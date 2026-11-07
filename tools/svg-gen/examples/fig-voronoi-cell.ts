// fig-voronoi-cell.ts -- V1: one Voronoi cell is the intersection of
// half-planes. For a featured site, each neighbor's bisector (dashed)
// cuts away the far half; what remains is the cell (washed fill).
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas, type Point } from "../svg.ts";
import { SITES, bisector, delaunay, edgeAdjacency, lineRect, polyEl, voronoiCell } from "./geom.ts";

const S = SITES;
const CLIP: [number, number, number, number] = [10, 10, 225, 220];
const c = new Canvas();

// Featured site: a central one (index 3 = [70,115] has 6 neighbors).
const si = 3;
const s = S[si];
// its Voronoi neighbors = Delaunay-adjacent sites
const nbr = new Set<number>();
for (const { e } of edgeAdjacency(delaunay(S)).values())
  if (e[0] === si) nbr.add(e[1]);
  else if (e[1] === si) nbr.add(e[0]);

const cell = voronoiCell(s, S, [[CLIP[0], CLIP[1]], [CLIP[2], CLIP[1]], [CLIP[2], CLIP[3]], [CLIP[0], CLIP[3]]]);
assert.ok(cell.length >= 3);

for (const j of nbr) {
  const { mid, dir } = bisector(s, S[j]);
  const [p, q] = lineRect(mid, dir, CLIP);
  c.line(p, q, { dash: "4 3", opacity: 0.55 });
  c.raw(`<circle cx="${S[j][0]}" cy="${S[j][1]}" r="3.5" fill="currentColor"/>`, [S[j]]);
}
// other (non-adjacent) sites faint
for (const [i, p] of S.entries())
  if (i !== si && !nbr.has(i)) c.raw(`<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="currentColor" fill-opacity="0.3"/>`, [p]);

c.raw(polyEl(cell, c.color(2), 0.18, ` stroke="${c.color(2)}" stroke-width="2"`), cell);
c.raw(`<circle cx="${s[0]}" cy="${s[1]}" r="4" fill="${c.color(2)}"/>`, [s]);
c.text(115, 240, "cell = half-planes kept", { anchor: "middle", size: 12, opacity: 0.7 });

await writeFile(
  new URL("../build/fig-voronoi-cell.svg", import.meta.url),
  c.toString({ label: "one Voronoi cell: intersection of the near half-planes cut by bisectors to the site's neighbors" }),
);
