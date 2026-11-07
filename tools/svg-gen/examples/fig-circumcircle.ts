// fig-circumcircle.ts -- P2: three non-collinear sites pin down one
// circle. Two bisectors (dashed) meet at the circumcenter; the circle
// through the three sites is unique.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas, type Point } from "../svg.ts";
import { SITES, bisector, circum, lineRect } from "./geom.ts";

const pts = [SITES[0], SITES[2], SITES[8]];
const RECT: [number, number, number, number] = [0, 0, 230, 230];
const c = new Canvas();
const { o, r } = circum(pts[0], pts[1], pts[2]);

for (const [i, j] of [[0, 1], [1, 2]] as const) {
  const { mid, dir } = bisector(pts[i], pts[j]);
  const [p, q] = lineRect(mid, dir, RECT);
  c.line(p, q, { dash: "4 3", opacity: 0.6 });
}

// The center sits on both bisectors, so it is equidistant to all three.
const d = (p: Point) => Math.hypot(p[0] - o[0], p[1] - o[1]);
assert.ok(Math.abs(d(pts[0]) - r) < 1e-9 && Math.abs(d(pts[1]) - r) < 1e-9 && Math.abs(d(pts[2]) - r) < 1e-9);

c.circle(o[0], o[1], r, { width: 1.5 });
for (const [i, p] of pts.entries()) {
  c.raw(`<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${c.color(i)}"/>`, [p]);
  c.line(p, o, { dash: "3 3", opacity: 0.5, color: c.color(i) });
}
c.raw(`<circle cx="${o[0]}" cy="${o[1]}" r="3" fill="currentColor"/>`, [o]);
c.text(o[0] + 8, o[1], "外心", { size: 12, baseline: "central" });

await writeFile(
  new URL("../build/fig-circumcircle.svg", import.meta.url),
  c.toString({ label: "three non-collinear sites: two bisectors meet at the circumcenter, one circle through all three" }),
);
