// fig-empty-circle.ts -- D2: the empty circumcircle property, obeyed
// (left) and violated (right). Same convex quad, different diagonal:
// one circle stays empty, the other swallows the fourth site
// (vermillion). The quad comes from real Delaunay data.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas, type Point } from "../svg.ts";
import { SITES, circum, delaunay, edgeAdjacency, shift } from "./geom.ts";

const S = SITES;
const tris = delaunay(S);
const c = new Canvas();
const DX = 260;

// an interior Delaunay edge (a,c) with triangles abc and acd → quad a-b-c-d.
let quad: [number, number, number, number] | null = null;
for (const { e, t } of edgeAdjacency(tris).values())
  if (t.length === 2) {
    const [t1, t2] = [tris[t[0]], tris[t[1]]];
    const b = t1.find((v) => v !== e[0] && v !== e[1])!;
    const d = t2.find((v) => v !== e[0] && v !== e[1])!;
    quad = [e[0], b, e[1], d];
    break;
  }
assert.ok(quad);
const [ia, ib, ic, id] = quad;
const [a, b, cc, d] = [S[ia], S[ib], S[ic], S[id]];

const dot = (p: Point, fill = "currentColor") =>
  c.raw(`<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="${fill}"/>`, [p]);

// Left: Delaunay triangles abc + acd; circumcircle of abc is empty.
const good = circum(a, b, cc);
assert.ok(Math.hypot(d[0] - good.o[0], d[1] - good.o[1]) > good.r - 1e-9);
const quadEdges: [Point, Point][] = [[a, b], [b, cc], [cc, d], [d, a]];
for (const [p, q] of quadEdges) c.line(p, q, { width: 1.2 });
c.line(a, cc, { width: 1.2, color: c.color(0) });
c.circle(good.o[0], good.o[1], good.r, { opacity: 0.6 });
for (const p of [a, b, cc, d]) dot(p);
c.text(120, 215, "empty circle", { anchor: "middle", size: 12, opacity: 0.7 });

// Right: the other diagonal bd. Its triangle abd has bcd's vertex c
// inside the circumcircle — violation.
const [A, B, CC, D] = [shift([a], DX, 0)[0], shift([b], DX, 0)[0], shift([cc], DX, 0)[0], shift([d], DX, 0)[0]];
const bad = circum(A, B, D);
assert.ok(Math.hypot(CC[0] - bad.o[0], CC[1] - bad.o[1]) < bad.r);
for (const [p, q] of [[A, B], [B, CC], [CC, D], [D, A]] as [Point, Point][]) c.line(p, q, { width: 1.2 });
c.line(B, D, { width: 2, color: c.color(3) });
c.circle(bad.o[0], bad.o[1], bad.r, { color: c.color(3), dash: "5 3" });
for (const p of [A, B, D]) dot(p);
dot(CC, c.color(3));
c.text(120 + DX, 215, "a site inside: not Delaunay", { anchor: "middle", size: 12, opacity: 0.7 });

await writeFile(
  new URL("../build/fig-empty-circle.svg", import.meta.url),
  c.toString({ label: "empty circumcircle: every Delaunay triangle's circumcircle contains no other site (left); the other diagonal puts a site inside (right)" }),
);
