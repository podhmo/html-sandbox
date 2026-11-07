// fig-flip.ts -- D3: the repair is one edge flip. Left: the wrong
// diagonal (vermillion) whose circumcircle swallows the opposite vertex.
// Right: flipped to the Delaunay diagonal (blue), circles empty.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas, type Point } from "../svg.ts";
import { SITES, circum, delaunay, edgeAdjacency, shift } from "./geom.ts";

const S = SITES;
const tris = delaunay(S);
const c = new Canvas();
const DX = 265;

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
const [a, b, cc, d] = quad.map((i) => S[i]) as [Point, Point, Point, Point];

const dot = (p: Point, fill = "currentColor") =>
  c.raw(`<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="${fill}"/>`, [p]);
const quadOutline = (P: Point[]) => {
  for (const [p, q] of [[P[0], P[1]], [P[1], P[2]], [P[2], P[3]], [P[3], P[0]]] as [Point, Point][])
    c.line(p, q, { width: 1.2 });
};

// Left: wrong diagonal bd — circle through abd contains c.
{
  const bad = circum(a, b, d);
  assert.ok(Math.hypot(cc[0] - bad.o[0], cc[1] - bad.o[1]) < bad.r);
  quadOutline([a, b, cc, d]);
  c.line(b, d, { width: 2.5, color: c.color(3) });
  c.circle(bad.o[0], bad.o[1], bad.r, { color: c.color(3), dash: "5 3", opacity: 0.8 });
  for (const p of [a, b, cc, d]) dot(p);
  c.text(112, 215, "illegal: site inside", { anchor: "middle", size: 11, opacity: 0.7 });
}

// arrow between panels
c.arrow([240, 105], [258, 105], { width: 1.5 });

// Right: flipped diagonal ac — both circumcircles empty.
{
  const [A, B, CC, D] = shift([a, b, cc, d], DX, 0) as [Point, Point, Point, Point];
  for (const [t, other] of [[[A, B, CC], D], [[A, CC, D], B]] as [[Point, Point, Point], Point][]) {
    const { o, r } = circum(t[0], t[1], t[2]);
    assert.ok(Math.hypot(other[0] - o[0], other[1] - o[1]) > r - 1e-9);
  }
  quadOutline([A, B, CC, D]);
  c.line(A, CC, { width: 2.5, color: c.color(0) });
  c.circle(circum(A, B, CC).o[0], circum(A, B, CC).o[1], circum(A, B, CC).r, { opacity: 0.6 });
  c.circle(circum(A, CC, D).o[0], circum(A, CC, D).o[1], circum(A, CC, D).r, { opacity: 0.6 });
  for (const p of [A, B, CC, D]) dot(p);
  c.text(112 + DX, 215, "legal: circles empty", { anchor: "middle", size: 11, opacity: 0.7 });
}

await writeFile(
  new URL("../build/fig-flip.svg", import.meta.url),
  c.toString({ label: "edge flip: an illegal diagonal (site inside the circumcircle) is swapped for the Delaunay one" }),
);
