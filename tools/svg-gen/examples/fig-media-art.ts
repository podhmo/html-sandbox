// fig-media-art.ts -- "generative art" usage of the two structures, from
// the SAME point set (docs/sketch/ja/delaunay-voronoi.md): left panel
// fills Voronoi cells like stained glass, right panel fills Delaunay
// triangles like low-poly facets. The point: two art idioms, one
// point set, and they are duals of each other.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas, type Point } from "../svg.ts";
import { SITES, circum, delaunay, voronoiCell, shift } from "./geom.ts";

const S = SITES;
const tris = delaunay(S);
const c = new Canvas();

// Panel layout: left panel uses S as-is; right panel is S + (DX, 0).
const DX = 280;
const CLIP: Point[] = [[15, 15], [210, 15], [210, 210], [15, 210]]; // clip rect for unbounded cells
const poly = (pts: Point[], fill: string, op: number) =>
  `<polygon points="${pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")}" fill="${fill}" fill-opacity="${op}" stroke="currentColor" stroke-width="1"/>`;

// Left: Voronoi cells filled (stained glass idiom).
S.forEach((s, i) => {
  const cell = voronoiCell(s, S, CLIP);
  assert.ok(cell.length >= 3, `site ${i} has a visible cell`);
  c.raw(poly(cell, c.color(i), 0.35), cell);
});
c.text(112, 228, "Voronoi cells", { anchor: "middle", size: 12, opacity: 0.7 });

// Right: Delaunay triangles filled (low-poly facet idiom).
const T = shift(S, DX, 0);
tris.forEach((t, i) => {
  const pts = [T[t[0]], T[t[1]], T[t[2]]];
  c.raw(poly(pts, c.color(i), 0.45), pts);
});
c.text(112 + DX, 228, "Delaunay triangles", { anchor: "middle", size: 12, opacity: 0.7 });

// Same site dots on top of both panels — the shared input.
for (const p of S.concat(T)) c.raw(`<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="currentColor"/>`, [p]);

await writeFile(
  new URL("../build/fig-media-art.svg", import.meta.url),
  c.toString({ label: "generative-art idioms from one point set: filled Voronoi cells (stained glass) and filled Delaunay triangles (low-poly)" }),
);
