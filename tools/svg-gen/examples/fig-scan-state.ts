// fig-scan-state.ts -- The scanner's state, before and after. Before: four
// accumulation buffers and three mode flags sit side by side, each mode's
// own variables floating loose; the "at most one is active" rule is kept
// by hand. After: two slots, and each variant carries only its own state.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas();
const LIVE = c.color(0); // the active slot / the variant

// ---- before ----
c.text(24, 30, "before", { size: 14, underline: true });
c.text(24, 54, "pending buffers", { size: 12, opacity: 0.7 });
const bufs = ["para []", "items [it]", "quote []", "table []"];
bufs.forEach((label, i) => {
  const x = 24 + i * 104;
  const b = c.box(x, 62, 92, 28, {
    label,
    size: 12,
    rx: 4,
    color: i === 1 ? LIVE : undefined,
    width: i === 1 ? 2 : 1,
    opacity: i === 1 ? 1 : 0.6,
  });
  if (i === 1) c.highlight(b, { opacity: 0.06 });
});
c.text(24, 112, "at most one non-empty", { size: 11, opacity: 0.6 });

c.text(24, 156, "mode flags + loose vars", { size: 12, opacity: 0.7 });
const flags = ["in_code", "in_details", "in_foot"];
flags.forEach((label, i) => {
  const x = 24 + i * 104;
  const b = c.box(x, 164, 92, 28, {
    label,
    size: 12,
    rx: 4,
    color: i === 1 ? LIVE : undefined,
    width: i === 1 ? 2 : 1,
    opacity: i === 1 ? 1 : 0.6,
  });
  if (i === 1) c.highlight(b, { opacity: 0.06 });
});
// The vars that exist only while in_details — floating, not bound to it.
["details []", "details_depth", "details_code"].forEach((label, i) => {
  const v = c.box(128 + i * 96, 206, 88, 24, {
    label,
    size: 11,
    rx: 4,
    dash: "3 3",
    opacity: 0.7,
  });
  c.line(c.anchor(v, "n"), [174, 192], { dash: "3 3", opacity: 0.5 });
});
c.text(24, 248, "one group active at a time — a rule kept by hand", {
  size: 11,
  opacity: 0.6,
});

// ---- after ----
const AX = 470;
c.text(AX, 30, "after", { size: 14, underline: true });
c.text(AX, 54, "pending", { size: 12, opacity: 0.7 });
const p = c.box(AX, 62, 180, 28, {
  label: "Items([it])",
  size: 12,
  rx: 4,
  color: LIVE,
  width: 2,
});
c.highlight(p, { opacity: 0.06 });
c.text(AX + 190, 76, "= one of Nothing | Para | Items | Quote | Table", {
  size: 11,
  opacity: 0.6,
  baseline: "central",
});

c.text(AX, 126, "mode", { size: 12, opacity: 0.7 });
const m = c.box(AX, 134, 180, 56, {
  label: ["Details {", "  depth, in_code, lines }"],
  size: 12,
  rx: 4,
  color: LIVE,
  width: 2,
});
c.highlight(m, { opacity: 0.06 });
c.text(AX + 190, 162, "= one of Normal | Code | Details | Footnote", {
  size: 11,
  opacity: 0.6,
  baseline: "central",
});
c.text(AX + 190, 178, "its vars ride inside the variant", {
  size: 11,
  opacity: 0.6,
  baseline: "central",
});
c.text(AX, 248, "one slot each; the type keeps the rule", {
  size: 11,
  opacity: 0.6,
});

// The flags row is 3 cells of 92 + 2 gaps; loose vars hang below the mid cell.
assert.equal(24 + 104, 128);

await writeFile(
  new URL("../build/fig-scan-state.svg", import.meta.url),
  c.toString({
    label:
      "before: many slots, one live, kept by hand; after: two slots, variant carries its own vars",
  }),
);
