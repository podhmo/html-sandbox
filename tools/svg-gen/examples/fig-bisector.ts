// fig-bisector.ts -- P1: the locus of points equidistant from two sites
// is one straight line (the perpendicular bisector). Dashed connectors
// from two sample points on the line to both sites carry "equal
// distance"; same length by construction.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas, type Point } from "../svg.ts";
import { bisector, lineRect } from "./geom.ts";

const a: Point = [70, 60];
const b: Point = [170, 115];
const c = new Canvas();
const COL_A = c.color(0), COL_B = c.color(1);
const RECT: [number, number, number, number] = [10, 10, 230, 170];

const { mid, dir } = bisector(a, b);
const [p, q] = lineRect(mid, dir, RECT);
c.line(p, q, { width: 2 });
c.raw(`<circle cx="${a[0]}" cy="${a[1]}" r="4" fill="${COL_A}"/>`, [a]);
c.raw(`<circle cx="${b[0]}" cy="${b[1]}" r="4" fill="${COL_B}"/>`, [b]);

// Two sample points on the locus, connectors to both sites — same length.
const len = Math.hypot(dir[0], dir[1]);
for (const t of [-45, 55]) {
  const w: Point = [mid[0] + (dir[0] / len) * t, mid[1] + (dir[1] / len) * t];
  assert.ok(Math.abs(Math.hypot(w[0] - a[0], w[1] - a[1]) - Math.hypot(w[0] - b[0], w[1] - b[1])) < 1e-9);
  c.line(w, a, { dash: "3 3", opacity: 0.6, color: COL_A });
  c.line(w, b, { dash: "3 3", opacity: 0.6, color: COL_B });
  c.raw(`<circle cx="${w[0]}" cy="${w[1]}" r="2.5" fill="currentColor"/>`, [w]);
}

await writeFile(
  new URL("../build/fig-bisector.svg", import.meta.url),
  c.toString({ label: "perpendicular bisector: locus of points equidistant from two sites" }),
);
