// fig-gabriel.ts -- X1: a Delaunay edge need not be a Gabriel edge.
// Obtuse triangle: the longest edge pq has an empty circumcircle (so it
// is Delaunay), but the circle with pq as diameter contains r
// (so it is not Gabriel). Being Gabriel means the *diameter* circle is
// empty; Delaunay only needs *some* empty circle through both endpoints.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas, type Point } from "../svg.ts";
import { circum } from "./geom.ts";

const p: Point = [55, 130];
const q: Point = [190, 130];
const r: Point = [125, 80];
const c = new Canvas();

const mid: Point = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
const dr = Math.hypot(p[0] - q[0], p[1] - q[1]) / 2;
const cc = circum(p, q, r);

// checks the figure depends on: obtuse at r, r inside diameter circle.
assert.ok(Math.hypot(r[0] - mid[0], r[1] - mid[1]) < dr, "r inside diameter circle");
assert.ok(Math.abs(Math.hypot(r[0] - cc.o[0], r[1] - cc.o[1]) - cc.r) < 1e-9, "circumcircle through all three");

for (const [x, y] of [[p, q], [q, r], [r, p]] as [Point, Point][]) c.line(x, y, { width: 1.5 });
c.line(p, q, { width: 3, color: c.color(0) });
c.circle(cc.o[0], cc.o[1], cc.r, { opacity: 0.5 });
c.circle(mid[0], mid[1], dr, { dash: "5 3", width: 1.5, color: c.color(3) });
for (const x of [p, q]) c.raw(`<circle cx="${x[0]}" cy="${x[1]}" r="4" fill="currentColor"/>`, [x]);
c.raw(`<circle cx="${r[0]}" cy="${r[1]}" r="4" fill="${c.color(3)}"/>`, [r]);
c.text(mid[0], mid[1] + dr + 14, "diameter circle contains r", { anchor: "middle", size: 11, opacity: 0.7 });
c.text(cc.o[0], cc.o[1] - cc.r - 8, "circumcircle: empty", { anchor: "middle", size: 11, opacity: 0.7 });

await writeFile(
  new URL("../build/fig-gabriel.svg", import.meta.url),
  c.toString({ label: "longest edge of an obtuse triangle: its circumcircle is empty (Delaunay) but its diameter circle holds the third vertex (not Gabriel)" }),
);
