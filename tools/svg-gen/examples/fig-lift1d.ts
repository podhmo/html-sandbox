// fig-lift1d.ts -- A3: lifting in one dimension. Points on the axis go
// up to the parabola z=x^2; the lower hull is exactly the adjacent-pair
// segments (Delaunay in 1D is sorted adjacency). A chord over a skipped
// point (vermillion) leaves that point below it — so it is not hull.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas, type Point } from "../svg.ts";
import { pathOf, sample } from "./geom.ts";

const c = new Canvas();
const AXIS_Y = 200, SCALE = 0.010, X0 = 30, X1 = 220;
const lift = (x: number): Point => [x, AXIS_Y - (x - 125) ** 2 * SCALE];
const xs = [45, 70, 105, 150, 195];

// parabola + lifted points + lower hull = adjacent segments.
const paraPts = sample((x) => lift(x)[1], X0, X1, 120);
c.path(pathOf(paraPts), paraPts, { width: 1.5, opacity: 0.7 });
c.line([X0, AXIS_Y], [X1, AXIS_Y], { width: 1.5 });

const lifted = xs.map(lift);
for (let i = 0; i < xs.length - 1; i++) {
  c.line(lifted[i], lifted[i + 1], { width: 3, color: c.color(0) });
  // adjacency on the axis, mirrored below as small arcs
  const midx = (xs[i] + xs[i + 1]) / 2;
  c.raw(`<path d="M${xs[i]} ${AXIS_Y + 14} Q${midx} ${AXIS_Y + 26} ${xs[i + 1]} ${AXIS_Y + 14}" fill="none" stroke="${c.color(0)}" stroke-width="1.5"/>`,
    [[xs[i], AXIS_Y + 14], [xs[i + 1], AXIS_Y + 14], [midx, AXIS_Y + 26]]);
}
// a chord skipping one site: the middle lifted point falls below it.
{
  const [x0, x2] = [lift(xs[0]), lift(xs[2])];
  const midLift = lift(xs[1]);
  const yChord = x0[1] + ((x2[1] - x0[1]) * (xs[1] - xs[0])) / (xs[2] - xs[0]);
  assert.ok(midLift[1] > yChord, "skipped point below the chord (screen y down)");
  c.line(x0, x2, { dash: "5 3", width: 1.5, color: c.color(3) });
}
for (const [i, p] of lifted.entries()) {
  c.line([xs[i], AXIS_Y], p, { dash: "3 3", opacity: 0.5 });
  c.raw(`<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="currentColor"/>`, [p]);
  c.raw(`<circle cx="${xs[i]}" cy="${AXIS_Y}" r="3.5" fill="currentColor"/>`, [[xs[i], AXIS_Y]]);
}
c.text(15, AXIS_Y, "x", { size: 11, baseline: "central" });
c.text(15, 20, "x²", { size: 11, baseline: "central" });

await writeFile(
  new URL("../build/fig-lift1d.svg", import.meta.url),
  c.toString({ label: "1D lifting: points on x go up to the parabola x^2; the lower hull is exactly adjacent pairs — Delaunay in 1D is sorted adjacency" }),
);
