// fig-min-angle.ts -- D4: Delaunay maximizes the minimum angle. Two
// triangulations of the SAME quad: flipping the diagonal creates a
// smaller minimum angle. The smallest angle is marked with an arc and
// its measured degree.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas, type Point } from "../svg.ts";
import { SITES, delaunay, edgeAdjacency, pathOf, shift } from "./geom.ts";

const S = SITES;
const tris = delaunay(S);
const c = new Canvas();
const DX = 260;

let quad: [number, number, number, number] | null = null;
for (const { e, t } of edgeAdjacency(tris).values())
  if (t.length === 2) {
    const [t1, t2] = [tris[t[0]], tris[t[1]]];
    quad = [e[0], t1.find((v) => v !== e[0] && v !== e[1])!, e[1], t2.find((v) => v !== e[0] && v !== e[1])!];
    break;
  }
assert.ok(quad);
const Q = quad;

const angleAt = (v: Point, p: Point, q: Point) => {
  const u = Math.atan2(p[1] - v[1], p[0] - v[0]);
  const w = Math.atan2(q[1] - v[1], q[0] - v[0]);
  let a = Math.abs(u - w);
  if (a > Math.PI) a = 2 * Math.PI - a;
  return a;
};

// min angle over a triangle list (vertex indices into P)
const minAngle = (P: Point[], tr: [number, number, number][]) => {
  let best = Infinity, mark: [number, number, number] | null = null;
  for (const t of tr)
    for (const [v, p, q] of [[0, 1, 2], [1, 2, 0], [2, 0, 1]] as const) {
      const a = angleAt(P[t[v]], P[t[p]], P[t[q]]);
      if (a < best) { best = a; mark = [t[v], t[p], t[q]]; }
    }
  return { a: best, mark: mark! };
};

const drawTriSet = (P: Point[], tr: [number, number, number][], cap: string, capX: number) => {
  for (const t of tr)
    for (const e of [[0, 1], [1, 2], [2, 0]] as const) c.line(P[t[e[0]]], P[t[e[1]]], { width: 1.2 });
  const { a, mark } = minAngle(P, tr);
  const [v, p, q] = [P[mark[0]], P[mark[1]], P[mark[2]]];
  const u = Math.atan2(p[1] - v[1], p[0] - v[0]);
  const w = Math.atan2(q[1] - v[1], q[0] - v[0]);
  let [t0, t1] = [Math.min(u, w), Math.max(u, w)];
  if (t1 - t0 > Math.PI) [t0, t1] = [t1, t0 + 2 * Math.PI];
  const R = 22;
  const arc = Array.from({ length: 17 }, (_, i) => {
    const t = t0 + ((t1 - t0) * i) / 16;
    return [v[0] + R * Math.cos(t), v[1] + R * Math.sin(t)] as Point;
  });
  c.path(pathOf(arc), arc, { width: 2.5, color: c.color(3) });
  const mid = (t0 + t1) / 2;
  c.text(v[0] + (R + 14) * Math.cos(mid), v[1] + (R + 14) * Math.sin(mid), `${Math.round((a * 180) / Math.PI)}°`, {
    anchor: "middle", baseline: "central", size: 12,
  });
  for (const p of P) c.raw(`<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="currentColor"/>`, [p]);
  c.text(capX, 215, cap, { anchor: "middle", size: 11, opacity: 0.7 });
  return a;
};

// Left: Delaunay (diagonal ac). Right: the same quad, diagonal bd.
const good = minAngle(S, [[Q[0], Q[1], Q[2]], [Q[0], Q[2], Q[3]]]);
const bad = minAngle(S, [[Q[0], Q[1], Q[3]], [Q[1], Q[2], Q[3]]]);
assert.ok(good.a > bad.a + 1e-9, `flip shrinks the min angle (${good.a} vs ${bad.a})`);

drawTriSet(S, [[Q[0], Q[1], Q[2]], [Q[0], Q[2], Q[3]]], "Delaunay", 112);
const P2 = shift(S, DX, 0);
drawTriSet(P2, [[Q[0], Q[1], Q[3]], [Q[1], Q[2], Q[3]]], "other diagonal", 112 + DX);

await writeFile(
  new URL("../build/fig-min-angle.svg", import.meta.url),
  c.toString({ label: "Delaunay maximizes the minimum angle; the other diagonal leaves a smaller one" }),
);
