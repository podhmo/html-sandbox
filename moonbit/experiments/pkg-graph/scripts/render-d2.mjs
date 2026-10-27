#!/usr/bin/env node
// Renders build/graph.d2 (from graph.json) with all three of D2's bundled
// layout engines: dagre (its default), ELK, and TALA.

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { d2Source, loadGraph } from "./graph.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const build = resolve(here, "..", "build");
const LAYOUTS = ["dagre", "elk", "tala"];

const version = spawnSync("d2", ["--version"], { encoding: "utf8" });
if (version.error) {
  console.error("d2 not found in PATH; see https://d2lang.com/tour/install");
  process.exit(1);
}

mkdirSync(build, { recursive: true });
const source = join(build, "graph.d2");
writeFileSync(source, d2Source(loadGraph()));

for (const layout of LAYOUTS) {
  const file = join(build, `d2-${layout}.svg`);
  const run = spawnSync("d2", [`--layout=${layout}`, "--pad=40", source, file], {
    encoding: "utf8",
  });
  if (run.status !== 0) {
    console.error(run.stdout, run.stderr);
    process.exit(run.status ?? 1);
  }
  console.log(`${file}: ${run.stderr.trim()}`);
}
