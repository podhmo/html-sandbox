#!/usr/bin/env node
// Renders the same flowchart as render-mermaid.mjs with beautiful-mermaid,
// which lays out with ELK itself and needs no browser.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderMermaidSVG } from "beautiful-mermaid";

import { loadGraph, mermaidSource } from "./graph.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const build = resolve(here, "..", "build");

const code = mermaidSource(loadGraph());
mkdirSync(build, { recursive: true });
writeFileSync(join(build, "beautiful-mermaid.mmd"), code);

const svg = renderMermaidSVG(code, {
  bg: "#ffffff",
  fg: "#27272a",
  accent: "#1a73e8",
});
const file = join(build, "beautiful-mermaid-elk.svg");
writeFileSync(file, svg);
console.log(`${file}: ${svg.length} bytes`);
