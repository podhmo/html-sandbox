// fig-pr-dots.ts -- why the commits list and the files view use different
// ranges: two-dot base..head vs three-dot merge-base..head.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas();
const BASE = 0, HEAD = 1, MB = 2;
const R = 9, D = 64;
const yBase = 60, yHead = 150, x0 = 40;
const cen = (s: { x: number; y: number; w: number; h: number }): [number, number] => [
  s.x + s.w / 2,
  s.y + s.h / 2,
];

// base branch (top): merge-base, then commits that arrived after the fork
const mb = c.circle(x0, yBase, R, { color: c.color(MB), width: 2.5 });
c.text(x0, yBase - R - 12, "merge-base", { anchor: "middle", size: 13 });
const b1 = c.circle(x0 + D, yBase, R, { color: c.color(BASE) });
const b2 = c.circle(x0 + 2 * D, yBase, R, { color: c.color(BASE) });
const b3 = c.circle(x0 + 3 * D, yBase, R, { color: c.color(BASE) });
c.line(cen(mb), cen(b3), { color: c.color(BASE) });
c.text(b3.x + b3.w + 8, yBase + 4, "base (moved on)", { size: 13 });

// head branch (bottom): diverged at merge-base
const h1 = c.circle(x0 + D, yHead, R, { color: c.color(HEAD) });
const h2 = c.circle(x0 + 2 * D, yHead, R, { color: c.color(HEAD) });
const h3 = c.circle(x0 + 3 * D, yHead, R, { color: c.color(HEAD) });
c.line(cen(mb), cen(h1), { color: c.color(HEAD) });
c.line(cen(h1), cen(h3), { color: c.color(HEAD) });
c.text(h3.x + h3.w + 8, yHead + 4, "head", { size: 13 });

// two-dot range: every commit on head since it diverged (commits list)
c.text(x0 + 2 * D, yHead + 34, "commits list: base..head (head-side only)", {
  anchor: "middle",
  size: 13,
  underline: 2,
});
for (const h of [h1, h2, h3]) {
  c.highlight(h, { mode: "ring", color: c.color(HEAD) });
}

// three-dot range: merge-base..head comparison (files view)
c.text(x0 + D, yBase - 46, "files view: merge-base → head", {
  size: 13,
  underline: 2,
});
c.arrow([x0 + D, yBase - 36], [x0, yBase - R - 4], {
  dash: "4 3",
  color: c.color(MB),
  head: 7,
});
c.arrow([x0 + 2 * D + 8, yBase - 36], [x0 + 3 * D, yHead - R - 4], {
  dash: "4 3",
  color: c.color(MB),
  head: 7,
});

assert.ok(b1.x === b3.x - 2 * D, "base row spaced evenly");
assert.ok(mb.x < h1.x, "merge-base sits before head commits");

await writeFile(
  new URL("../build/fig-pr-dots.svg", import.meta.url),
  c.toString({
    label: "two-dot base..head と three-dot merge-base..head の対象範囲の違い",
  }),
);
