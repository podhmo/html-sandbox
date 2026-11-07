// fig-voronoi-circle.ts -- V3: a Voronoi vertex is where three cells
// meet — it is the circumcenter of the three sites, and its circle
// contains no other site. This is the bridge to the Delaunay dual.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas, type Point } from "../svg.ts";
import { SITES, circum, delaunay, voronoiSegments } from "./geom.ts";

const S = SITES;
const tris = delaunay(S);
const CLIP: [number, number, number, number] = [0, 0, 230, 230];
const c = new Canvas();
const COL_VOR = c.color(1);

for (const [a, b] of voronoiSegments(S, tris, CLIP)) c.line(a, b, { dash: "4 3", opacity: 0.6, color: COL_VOR });

// featured Voronoi vertex: circumcenter of a central triangle.
const feat = tris[4];
const { o, r } = circum(S[feat[0]], S[feat[1]], S[feat[2]]);
// equidistant to its three sites, and strictly nearer than to any other.
const d = (p: Point) => Math.hypot(p[0] - o[0], p[1] - o[1]);
for (const p of S) assert.ok(d(p) > r - 1e-9, "circle is empty");

c.circle(o[0], o[1], r, { width: 1.5 });
for (const i of feat) {
  c.raw(`<circle cx="${S[i][0]}" cy="${S[i][1]}" r="4" fill="${c.color(0)}"/>`, [S[i]]);
  c.line(S[i], o, { dash: "3 3", opacity: 0.5 });
}
for (const [i, p] of S.entries())
  if (!feat.includes(i)) c.raw(`<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="currentColor"/>`, [p]);
c.raw(`<circle cx="${o[0]}" cy="${o[1]}" r="3" fill="currentColor"/>`, [o]);

await writeFile(
  new URL("../build/fig-voronoi-circle.svg", import.meta.url),
  c.toString({ label: "a Voronoi vertex sits at the circumcenter of its three sites; the circle contains no other site" }),
);
