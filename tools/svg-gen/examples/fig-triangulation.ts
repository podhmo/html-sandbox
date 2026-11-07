// fig-triangulation.ts -- P4: a triangulation fills the convex hull with
// non-crossing triangles (left). A chord across the middle crosses
// several edges (right, vermillion) — not a triangulation.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas, type Point } from "../svg.ts";
import { SITES, delaunay, edgeAdjacency, hull, shift } from "./geom.ts";

const S = SITES;
const tris = delaunay(S);
const c = new Canvas();
const DX = 260;

const dot = (p: Point) => c.raw(`<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="currentColor"/>`, [p]);

// Left: a valid triangulation (the Delaunay one) filling the hull.
for (const t of tris)
  for (const e of [[0, 1], [1, 2], [2, 0]] as const) c.line(S[t[e[0]]], S[t[e[1]]], { width: 1.2 });
for (const p of S) dot(p);
c.text(115, 225, "a triangulation", { anchor: "middle", size: 12, opacity: 0.7 });

// Right: same edges plus one chord through the middle — it crosses
// Delaunay edges it is not part of, so this is not a triangulation.
const T = shift(S, DX, 0);
for (const t of tris)
  for (const e of [[0, 1], [1, 2], [2, 0]] as const) c.line(T[t[e[0]]], T[t[e[1]]], { width: 1.2, opacity: 0.5 });
// find two non-adjacent sites whose chord crosses the most edges
const hv = new Set(hull(S));
let chord: [Point, Point] | null = null;
let crossings: Point[] = [];
for (let i = 0; i < S.length && !chord; i++)
  for (let j = i + 1; j < S.length && !chord; j++) {
    if (hv.has(i) && hv.has(j)) continue;
    const xs: Point[] = [];
    for (const { e } of edgeAdjacency(tris).values()) {
      const [a, b] = [S[e[0]], S[e[1]]];
      if (e[0] === i || e[0] === j || e[1] === i || e[1] === j) continue;
      const d1 = (S[j][0] - S[i][0]) * (a[1] - S[i][1]) - (S[j][1] - S[i][1]) * (a[0] - S[i][0]);
      const d2 = (S[j][0] - S[i][0]) * (b[1] - S[i][1]) - (S[j][1] - S[i][1]) * (b[0] - S[i][0]);
      const d3 = (b[0] - a[0]) * (S[i][1] - a[1]) - (b[1] - a[1]) * (S[i][0] - a[0]);
      const d4 = (b[0] - a[0]) * (S[j][1] - a[1]) - (b[1] - a[1]) * (S[j][0] - a[0]);
      if (d1 * d2 < 0 && d3 * d4 < 0) xs.push([(a[0] + b[0]) / 2 + DX, (a[1] + b[1]) / 2]);
    }
    if (xs.length >= 2) { chord = [T[i], T[j]]; crossings = xs; }
  }
assert.ok(chord !== null, "found a crossing chord");
c.line(chord[0], chord[1], { width: 2.5, color: c.color(3) });
for (const x of crossings) c.raw(`<circle cx="${x[0]}" cy="${x[1]}" r="4" fill="none" stroke="${c.color(3)}" stroke-width="2"/>`, [x]);
for (const p of T) dot(p);
c.text(115 + DX, 225, "crossing edge: not a triangulation", { anchor: "middle", size: 12, opacity: 0.7 });

await writeFile(
  new URL("../build/fig-triangulation.svg", import.meta.url),
  c.toString({ label: "valid triangulation vs a chord that crosses existing edges" }),
);
