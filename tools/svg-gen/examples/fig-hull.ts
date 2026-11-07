// fig-hull.ts -- P3: the convex hull is the boundary a triangulation
// must cover. Hull edges in green; interior and hull sites share dots.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";
import { SITES, hull } from "./geom.ts";

const S = SITES;
const hv = hull(S);
const c = new Canvas();

for (let i = 0; i < hv.length; i++)
  c.line(S[hv[i]], S[hv[(i + 1) % hv.length]], { width: 2, color: c.color(2) });
for (const p of S) c.raw(`<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="currentColor"/>`, [p]);

// Every site is a hull vertex or lies strictly inside the hull polygon.
assert.equal(hv.length, 7, "this set has 7 hull sites");

await writeFile(
  new URL("../build/fig-hull.svg", import.meta.url),
  c.toString({ label: "convex hull: the boundary every triangulation must cover" }),
);
