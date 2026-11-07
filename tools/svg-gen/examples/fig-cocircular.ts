// fig-cocircular.ts -- X2: four cocircular sites give two equally valid
// Delaunay triangulations. All four triangle circumcircles coincide with
// the big circle, so neither diagonal breaks the empty-circle rule.
// The Voronoi vertex has degree 4 — the degenerate case.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas, type Point } from "../svg.ts";
import { circum, shift } from "./geom.ts";

const O: Point = [115, 105];
const R = 78;
const c = new Canvas();
const DX = 260;

const onCircle = (deg: number): Point => [
  O[0] + R * Math.cos((deg * Math.PI) / 180),
  O[1] + R * Math.sin((deg * Math.PI) / 180),
];
const P = [10, 100, 195, 285].map(onCircle);

// All four circumcircles coincide with the big circle (sites on it,
// none strictly inside).
for (const [i, j, k] of [[0, 1, 2], [0, 2, 3], [1, 2, 3], [0, 1, 3]] as const) {
  const { o, r } = circum(P[i], P[j], P[k]);
  assert.ok(Math.hypot(o[0] - O[0], o[1] - O[1]) < 1e-6 && Math.abs(r - R) < 1e-6);
}

const drawPanel = (P: Point[], diag: [number, number], off: number) => {
  c.circle(O[0] + off, O[1], R, { opacity: 0.45 });
  for (const [i, j] of [[0, 1], [1, 2], [2, 3], [3, 0]] as const) c.line(P[i], P[j], { width: 1.2 });
  c.line(P[diag[0]], P[diag[1]], { width: 2.5, color: c.color(0) });
  for (const p of P) c.raw(`<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="currentColor"/>`, [p]);
};

drawPanel(P, [0, 2], 0);
drawPanel(shift(P, DX, 0), [1, 3], DX);
// the single degree-4 Voronoi vertex, same spot in both panels
for (const off of [0, DX]) c.raw(`<circle cx="${O[0] + off}" cy="${O[1]}" r="3.5" fill="${c.color(3)}"/>`, [[O[0] + off, O[1]]]);
c.text(115, 215, "diagonal A", { anchor: "middle", size: 11, opacity: 0.7 });
c.text(115 + DX, 215, "diagonal B", { anchor: "middle", size: 11, opacity: 0.7 });

await writeFile(
  new URL("../build/fig-cocircular.svg", import.meta.url),
  c.toString({ label: "four cocircular sites: both diagonals give legal Delaunay triangulations" }),
);
