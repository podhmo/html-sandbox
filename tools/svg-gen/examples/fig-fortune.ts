// fig-fortune.ts -- A2: Fortune's sweep. Each swept site owns a parabola
// of points equidistant to it and the sweep line; only sites near the
// sweep ever reach the beach line, so those get hues and the rest stay
// faint. The beach line (thick solid) is the top of the parabola pile;
// breakpoints where two parabolas tie trace Voronoi edges.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas, type Point } from "../svg.ts";
import { SITES, pathOf, sample } from "./geom.ts";

// sites above the sweep line (screen y grows downward, sweep below).
const S = SITES;
const ly = 200; // sweep line y: 4 breakpoints on this set
const c = new Canvas();
const X0 = 0, X1 = 230;

// parabola for focus (fx,fy), directrix ly:  y = (x-fx)^2/(2(fy-ly)) + (fy+ly)/2
const parab = ([fx, fy]: Point) => (x: number) => ((x - fx) ** 2) / (2 * (fy - ly)) + (fy + ly) / 2;
const fns = S.map(parab);

// beach line = pointwise max (nearest to the sweep line = largest y).
const N = 600;
const beach: Point[] = [];
const beachSet = new Set<number>();
let prevTop = -1;
const breaks: Point[] = [];
for (let i = 0; i <= N; i++) {
  const x = X0 + ((X1 - X0) * i) / N;
  let top = -Infinity, arg = 0;
  fns.forEach((f, k) => { const y = f(x); if (y > top) { top = y; arg = k; } });
  if (prevTop !== -1 && arg !== prevTop) breaks.push([x, top]);
  prevTop = arg;
  if (top > -10 && top < ly + 5) {
    beach.push([x, top]);
    beachSet.add(arg);
  }
}
assert.ok(breaks.length >= 4, "several parabolas share the beach line");
const onBeach = [...beachSet];
const hueOf = new Map(onBeach.map((s, i) => [s, i]));

for (const [i, s] of S.entries()) {
  const pts = sample(fns[i], X0, X1, 160).filter((p) => p[1] > -10 && p[1] < ly + 5);
  if (hueOf.has(i)) c.path(pathOf(pts), pts, { dash: "5 3", opacity: 0.8, color: c.color(hueOf.get(i)!) });
  else c.path(pathOf(pts), pts, { dash: "4 3", opacity: 0.25 });
}
for (const [i, s] of S.entries())
  c.raw(
    hueOf.has(i)
      ? `<circle cx="${s[0]}" cy="${s[1]}" r="4" fill="${c.color(hueOf.get(i)!)}"/>`
      : `<circle cx="${s[0]}" cy="${s[1]}" r="3.5" fill="currentColor"/>`,
    [s],
  );
c.path(pathOf(beach), beach, { width: 3 });
c.line([X0, ly], [X1, ly], { width: 2, color: c.color(5) });
for (const [x, y] of breaks) c.raw(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${c.color(3)}"/>`, [[x, y]]);
c.text(X1 - 6, ly - 8, "sweep", { anchor: "end", size: 11, opacity: 0.7 });

await writeFile(
  new URL("../build/fig-fortune.svg", import.meta.url),
  c.toString({ label: "Fortune's sweep: site parabolas (dashed), their top envelope is the beach line (thick), breakpoints trace Voronoi edges" }),
);
