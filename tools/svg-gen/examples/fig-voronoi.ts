// fig-voronoi.ts -- V2: the completed Voronoi diagram of the shared set.
// Dashed cells, one featured cell washed; unbounded cells belong to
// convex-hull sites (asserted).
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas, type Point } from "../svg.ts";
import { SITES, delaunay, edgeAdjacency, hull, polyEl, voronoiCell, voronoiSegments } from "./geom.ts";

const S = SITES;
const tris = delaunay(S);
const CLIP: [number, number, number, number] = [0, 0, 230, 230];
const c = new Canvas();
const COL_VOR = c.color(1);

// Unbounded cells: boundary Delaunay edges (one adjacent triangle)
// belong to hull-adjacent site pairs — assert that.
const hv = new Set(hull(S));
for (const { e, t } of edgeAdjacency(tris).values())
  if (t.length === 1) assert.ok(hv.has(e[0]) && hv.has(e[1]), "unbounded cell edge between hull sites");

for (const [a, b] of voronoiSegments(S, tris, CLIP)) c.line(a, b, { dash: "4 3", width: 1.5, color: COL_VOR });

// one featured cell washed
const feat = voronoiCell(S[3], S, [[CLIP[0], CLIP[1]], [CLIP[2], CLIP[1]], [CLIP[2], CLIP[3]], [CLIP[0], CLIP[3]]]);
c.raw(polyEl(feat, c.color(1), 0.12), feat);

for (const p of S) c.raw(`<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="currentColor"/>`, [p]);

await writeFile(
  new URL("../build/fig-voronoi.svg", import.meta.url),
  c.toString({ label: "the Voronoi diagram: every point of the plane assigned to its nearest site" }),
);
