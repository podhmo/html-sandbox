// fig-bw-step.ts -- A1: one Bowyer-Watson insertion. Left: current
// triangulation, the point to insert (vermillion), and the triangles
// whose circumcircle contains it — the cavity (vermillion wash). Right:
// cavity boundary re-triangulated to the new point (blue fan).
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas, type Point } from "../svg.ts";
import { SITES, circum, delaunay, polyEl, shift, type Tri } from "./geom.ts";

const S = SITES;
const c = new Canvas();
const DX = 260;

// Triangulate everything except the central site 3 ([70,115]), whose
// removal leaves the largest cavity — 4 triangles by the debug check.
const init = S.filter((_, i) => i !== 3);
const tris = delaunay(init);
const p = S[3];

// bad triangles = circumcircle contains p; cavity = boundary edges of bad set.
const bad = tris.filter((t) => {
  const { o, r } = circum(init[t[0]], init[t[1]], init[t[2]]);
  return Math.hypot(p[0] - o[0], p[1] - o[1]) < r;
});
assert.ok(bad.length >= 2, "new point falls in a multi-triangle cavity");
const count = new Map<string, [number, number]>();
const key = (a: number, b: number) => (a < b ? `${a},${b}` : `${b},${a}`);
for (const t of bad)
  for (const e of [[0, 1], [1, 2], [2, 0]] as const) {
    const [a, b] = [t[e[0]], t[e[1]]];
    const kk = key(a, b);
    if (count.has(kk)) count.delete(kk);
    else count.set(kk, [a, b]);
  }
const cavity = [...count.values()];

const dot = (x: Point, fill = "currentColor") => c.raw(`<circle cx="${x[0]}" cy="${x[1]}" r="3.5" fill="${fill}"/>`, [x]);

// Left: existing triangulation + cavity highlighted.
for (const t of tris)
  for (const e of [[0, 1], [1, 2], [2, 0]] as const)
    c.line(init[t[e[0]]], init[t[e[1]]], { width: 1, opacity: bad.includes(t) ? 0.35 : 0.8 });
for (const t of bad) c.raw(polyEl([init[t[0]], init[t[1]], init[t[2]]], c.color(3), 0.15), [init[t[0]], init[t[1]], init[t[2]]]);
for (const [a, b] of cavity) c.line(init[a], init[b], { width: 2.5, color: c.color(0) });
for (const q of init) dot(q);
dot(p, c.color(3));
c.text(115, 218, "point falls in cavity", { anchor: "middle", size: 11, opacity: 0.7 });

// Right: cavity boundary stitched to the new point.
{
  const I = shift(init, DX, 0);
  const P = shift([p], DX, 0)[0];
  const kept = tris.filter((t) => !bad.includes(t));
  for (const t of kept)
    for (const e of [[0, 1], [1, 2], [2, 0]] as const) c.line(I[t[e[0]]], I[t[e[1]]], { width: 1, opacity: 0.8 });
  for (const [a, b] of cavity) {
    c.line(I[a], I[b], { width: 2.5, color: c.color(0) });
    c.line(I[a], P, { width: 1.5, color: c.color(0) });
    c.line(I[b], P, { width: 1.5, color: c.color(0) });
  }
  for (const q of I) dot(q);
  dot(P, c.color(3));
  c.text(115 + DX, 218, "retriangulated", { anchor: "middle", size: 11, opacity: 0.7 });
}

await writeFile(
  new URL("../build/fig-bw-step.svg", import.meta.url),
  c.toString({ label: "Bowyer-Watson step: remove triangles whose circumcircle contains the new point, then stitch the cavity to it" }),
);
