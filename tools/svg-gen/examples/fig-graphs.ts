// fig-graphs.ts -- G1: the proximity-graph chain on the same point set.
// NNG ⊂ EMST ⊂ Gabriel ⊂ Delaunay, drawn as four small panels, so the
// nesting is visible as edge sets thinning/thickening, not as a text
// diagram. Asserts the set inclusions edge by edge.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas, type Point } from "../svg.ts";
import { SITES, delaunay, edgeAdjacency, shift } from "./geom.ts";

const S = SITES;
const tris = delaunay(S);
const c = new Canvas();
const DX = 260, DY = 230;

const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const ekey = (a: number, b: number) => (a < b ? `${a},${b}` : `${b},${a}`);

const dt = new Set<string>();
for (const { e } of edgeAdjacency(tris).values()) dt.add(ekey(e[0], e[1]));

const nng = new Set<string>();
S.forEach((p, i) => {
  let best = -1, bd = Infinity;
  S.forEach((q, j) => { if (i !== j && dist(p, q) < bd) { bd = dist(p, q); best = j; } });
  nng.add(ekey(i, best));
});

// EMST = Prim over Delaunay edges (EMST ⊆ DT, so this is safe & cheap).
const emst = new Set<string>();
const inTree = new Set([0]);
const edges = [...dt].map((k) => k.split(",").map(Number) as [number, number]);
while (inTree.size < S.length) {
  let best: [number, number] | null = null, bd = Infinity;
  for (const [a, b] of edges)
    if (inTree.has(a) !== inTree.has(b) && dist(S[a], S[b]) < bd) { bd = dist(S[a], S[b]); best = [a, b]; }
  const [a, b] = best!;
  emst.add(ekey(a, b));
  inTree.add(a); inTree.add(b);
}

// Gabriel = Delaunay edges whose diameter circle contains no other site.
const gg = new Set<string>();
for (const [a, b] of edges) {
  const mid: Point = [(S[a][0] + S[b][0]) / 2, (S[a][1] + S[b][1]) / 2];
  const rr = dist(S[a], S[b]) / 2;
  if (S.every((p, i) => i === a || i === b || dist(p, mid) > rr - 1e-9)) gg.add(ekey(a, b));
}

for (const k of nng) assert.ok(emst.has(k), `NNG ${k} ⊆ EMST`);
for (const k of emst) assert.ok(gg.has(k), `EMST ${k} ⊆ Gabriel`);
for (const k of gg) assert.ok(dt.has(k), `Gabriel ${k} ⊆ DT`);

const panel = (set: Set<string>, ox: number, oy: number, cap: string) => {
  for (const k of set) {
    const [a, b] = k.split(",").map(Number);
    c.line([S[a][0] + ox, S[a][1] + oy], [S[b][0] + ox, S[b][1] + oy], { width: 1.5, color: c.color(0) });
  }
  for (const p of S) c.raw(`<circle cx="${p[0] + ox}" cy="${p[1] + oy}" r="3" fill="currentColor"/>`, [[p[0] + ox, p[1] + oy]]);
  c.text(110 + ox, 215 + oy, cap, { anchor: "middle", size: 12, opacity: 0.7 });
};

panel(nng, -25, -15, `NNG (${nng.size})`);
panel(emst, DX - 25, -15, `EMST (${emst.size})`);
panel(gg, -25, DY - 15, `Gabriel (${gg.size})`);
panel(dt, DX - 25, DY - 15, `Delaunay (${dt.size})`);

await writeFile(
  new URL("../build/fig-graphs.svg", import.meta.url),
  c.toString({ label: "proximity graph chain on one point set: NNG inside EMST inside Gabriel inside Delaunay" }),
);
