// Before/after: a comment POST under classic SSR (303 PRG -> full page
// reload) vs the partial-update contract (X-Partial -> 200 <li> fragment
// -> DOM insert). Two lanes, same action, different round-trip cost.
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas();

c.text(14, 20, "same action: submit a comment on /issues/2", {
  size: 12,
  opacity: 0.7,
});

// lane 1 — classic SSR
const b1 = c.box(20, 52, "auto", 56, {
  label: ["browser", "comment form"],
  color: c.color(0),
  size: 12,
});
const s1 = c.box(300, 52, "auto", 56, {
  label: ["server", "POST → DB → redirect"],
  color: c.color(0),
  size: 12,
});
c.arrow(c.anchor(b1, "e"), c.anchor(s1, "w"), {
  width: 1.5,
  heads: "both",
  split: 14,
});
c.text(170, 68, "POST body=…", { size: 10, opacity: 0.75 });
c.text(168, 102, "303 → GET (full page)", { size: 10, opacity: 0.75 });
const r1 = c.box(620, 52, "auto", 56, {
  label: ["screen", "whole page repaints"],
  color: c.color(0),
  size: 12,
  dash: "5 4",
});
c.arrow(c.anchor(s1, "e"), c.anchor(r1, "w"), { width: 1.5 });
c.text(20, 140, "classic SSR: every POST repaints the page (PRG)", {
  size: 11,
  opacity: 0.65,
});

// lane 2 — partial update
const b2 = c.box(20, 168, "auto", 56, {
  label: ["browser", "partial-submit.js"],
  color: c.color(3),
  size: 12,
});
const s2 = c.box(300, 168, "auto", 56, {
  label: ["server", "same handler, X-Partial 分岐"],
  color: c.color(3),
  size: 12,
});
c.arrow(c.anchor(b2, "e"), c.anchor(s2, "w"), {
  width: 1.5,
  heads: "both",
  split: 14,
});
c.text(168, 184, "POST X-Partial", { size: 10, opacity: 0.75 });
c.text(168, 218, "200 <li> fragment", { size: 10, opacity: 0.75 });
const r2 = c.box(620, 168, "auto", 56, {
  label: ["screen", "<li> appended only"],
  color: c.color(3),
  size: 12,
});
c.arrow(c.anchor(s2, "e"), c.anchor(r2, "w"), { width: 1.5 });
c.text(20, 256, "partial: the list gains one element; nothing else moves", {
  size: 11,
  opacity: 0.65,
});

c.text(20, 292, "schematic — arrow labels are the wire contract, not timings", {
  size: 10,
  opacity: 0.55,
});

await writeFile(
  new URL("../build/fig-prg-vs-partial.svg", import.meta.url),
  c.toString({ label: "コメント投稿1回について、従来の 303 PRG 全画面再描画と X-Partial による 200 fragment 差し込みを上下2レーンで対比した図" }),
);
