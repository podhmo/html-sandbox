// fig-points.ts -- P0: the article's whole input is ten unlabeled points.
// Every later figure reuses this set (geom.ts SITES).
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";
import { SITES } from "./geom.ts";

const c = new Canvas();
for (const p of SITES) c.raw(`<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="currentColor"/>`, [p]);

await writeFile(
  new URL("../build/fig-points.svg", import.meta.url),
  c.toString({ label: "the shared input: ten points, no structure yet" }),
);
