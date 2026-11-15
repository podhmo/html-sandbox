// aria-invalid x :user-invalid sync: what the browser knows vs. what the
// script writes, on blur of an emptied required textarea. Two lanes —
// pseudo-class (interaction-gated, automatic) and ARIA (written by JS at
// the same moment) — converging on the announcer + describedby link.
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas();

c.text(14, 18, "user action: empty a required textarea, then Tab away", {
  size: 12,
  opacity: 0.7,
});

const browser = c.box(20, 44, "auto", 64, {
  label: [":user-invalid", "UA が判定 (interaction後のみ)"],
  color: c.color(0),
  size: 12,
});
const sync = c.box(320, 44, "auto", 64, {
  label: ["form-errors.js", "blur capture → syncAria(el, true)"],
  color: c.color(1),
  size: 12,
});
c.arrow(c.anchor(browser, "e"), c.anchor(sync, "w"), { width: 1.5 });
c.text(268, 56, "matches?", { size: 10, opacity: 0.7 });

const aria = c.box(600, 8, "auto", 52, {
  label: ['aria-invalid="true"', "server-flagged は復元"],
  color: c.color(2),
  size: 12,
});
const desc = c.box(600, 76, "auto", 52, {
  label: ["aria-describedby += #comment-error", "表示中だけリンク"],
  color: c.color(3),
  size: 12,
});
const announce = c.box(600, 144, "auto", 52, {
  label: ['live region (polite)', '"Add a comment: Comment is required."'],
  color: c.color(4),
  size: 12,
});
c.arrow(c.anchor(sync, "e"), c.anchor(aria, "w"), { width: 1.5 });
c.arrow(c.anchor(sync, "e"), c.anchor(desc, "w"), { width: 1.5 });
c.arrow(c.anchor(sync, "e"), c.anchor(announce, "w"), { width: 1.5 });

c.box(20, 148, "auto", 48, {
  label: ["CSS (従来から)", ".field:has(:user-invalid) → 赤表示"],
  size: 12,
  dash: "5 4",
});
c.text(24, 228, "before: visual only — AT は気付けない", { size: 11, opacity: 0.65 });
c.text(600, 228, "after: 見た目と同じ瞬間に ARIA 側も更新", {
  size: 11,
  opacity: 0.65,
});

await writeFile(
  new URL("../build/fig-user-invalid-sync.svg", import.meta.url),
  c.toString({ label: "必須 textarea を空にして blur した瞬間に、form-errors.js が :user-invalid を見て aria-invalid・aria-describedby・polite live region を同時更新する流れ" }),
);
