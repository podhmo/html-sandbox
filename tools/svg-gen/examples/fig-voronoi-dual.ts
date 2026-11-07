// fig-voronoi-dual.ts -- spike for the Delaunay/Voronoi article (see
// docs/sketch/ja/delaunay-voronoi.md): draw a *computed* Delaunay
// triangulation (solid blue) and its dual Voronoi diagram (dashed orange)
// for the shared point set in geom.ts. Asserts the claims the figure
// illustrates: every circumcircle is empty, T = 2n-2-h.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas, type Point } from "../svg.ts";
import { SITES, circum, delaunay, edgeAdjacency, hull } from "./geom.ts";

const S = SITES;
const tris = delaunay(S);
const centers = tris.map(([a, b, c]) => circum(S[a], S[b], S[c]).o);

// Assert the properties the figure claims (README: "assert spatial claims
// the figure depends on").
const h = hull(S).length;
assert.equal(tris.length, 2 * S.length - 2 - h, "triangle count = 2n-2-h");
for (const t of tris) {
  const { o, r } = circum(S[t[0]], S[t[1]], S[t[2]]);
  for (const p of S) assert.ok(Math.hypot(p[0] - o[0], p[1] - o[1]) > r - 1e-9, "empty circumcircle");
}

const c = new Canvas();
const COL_DT = c.color(0); // Delaunay: solid blue
const COL_VOR = c.color(1); // Voronoi: dashed orange
const B = 230; // clip box for Voronoi rays (figure bounds)
for (const { e, t } of edgeAdjacency(tris).values()) {
  if (t.length === 2) {
    c.line(centers[t[0]], centers[t[1]], { dash: "4 3", opacity: 0.8, color: COL_VOR });
  } else {
    // ray from the single center along the edge's perpendicular
    // bisector, away from the triangle's third vertex.
    const tri = tris[t[0]];
    const third = tri.find((v) => v !== e[0] && v !== e[1])!;
    const mid: Point = [(S[e[0]][0] + S[e[1]][0]) / 2, (S[e[0]][1] + S[e[1]][1]) / 2];
    const d: Point = [-(S[e[1]][1] - S[e[0]][1]), S[e[1]][0] - S[e[0]][0]];
    const l = Math.hypot(d[0], d[1]);
    const sgn = Math.sign((S[third][0] - mid[0]) * d[0] + (S[third][1] - mid[1]) * d[1]) || 1;
    const dir: Point = [(-sgn * d[0]) / l, (-sgn * d[1]) / l];
    const o = centers[t[0]];
    const far: Point = [o[0] + dir[0] * B, o[1] + dir[1] * B];
    const tt = Math.min(
      ...([far[0] > 0 ? B / far[0] : Infinity, far[0] < 0 ? -20 / far[0] : Infinity,
            far[1] > 0 ? B / far[1] : Infinity, far[1] < 0 ? -20 / far[1] : Infinity]),
    );
    c.line(o, [o[0] + dir[0] * B * Math.min(tt, 1), o[1] + dir[1] * B * Math.min(tt, 1)], { dash: "4 3", opacity: 0.8, color: COL_VOR });
  }
}
for (const t of tris)
  for (const e of [[0, 1], [1, 2], [2, 0]] as const)
    c.line(S[t[e[0]]], S[t[e[1]]], { width: 1.2, color: COL_DT });

// Highlight one triangle: its empty circumcircle is the figure's claim,
// its center is a Voronoi vertex (dashed edges meet there).
const feat = 4;
{
  const { o, r } = circum(S[tris[feat][0]], S[tris[feat][1]], S[tris[feat][2]]);
  c.circle(o[0], o[1], r, { opacity: 0.45 });
  c.raw(`<circle cx="${o[0]}" cy="${o[1]}" r="2.5" fill="currentColor"/>`, [o]);
}
for (const p of S) c.raw(`<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="currentColor"/>`, [p]);

await writeFile(
  new URL("../build/fig-voronoi-dual.svg", import.meta.url),
  c.toString({ label: "Delaunay triangulation (solid) and its dual Voronoi diagram (dashed); one empty circumcircle shown" }),
);
