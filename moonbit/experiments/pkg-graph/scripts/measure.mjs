#!/usr/bin/env node
// Reads the SVG files in build/ back and prints one table row each: the
// canvas the layout engine chose, how many nodes and edges it drew, and
// the file size. The node and edge counts would catch a renderer that
// dropped or duplicated part of graph.json; the script exits 1 if any
// disagrees with graph.json.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadGraph } from "./graph.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const build = resolve(here, "..", "build");
const graph = loadGraph();

// What each renderer's SVG calls a node and an edge.
function inspect(svg) {
  if (svg.includes("<g class=\"shape\"")) {
    return {
      nodes: matches(svg, /<g class="shape"/g),
      edges: matches(svg, /<path [^>]*class="connection/g),
    };
  }
  if (svg.includes("<polyline class=\"edge\"")) {
    return {
      nodes: matches(svg, /<g class="node"/g),
      edges: matches(svg, /<polyline class="edge"/g),
    };
  }
  return {
    nodes: matches(svg, /class="node default /g),
    edges: matches(svg, /data-et="edge"/g),
  };
}

const matches = (text, re) => (text.match(re) ?? []).length;

const LABELS = {
  "mermaid-dagre.svg": ["mermaid", "dagre"],
  "mermaid-elk.svg": ["mermaid", "elk"],
  "beautiful-mermaid-elk.svg": ["beautiful-mermaid", "elk"],
  "d2-dagre.svg": ["d2", "dagre"],
  "d2-elk.svg": ["d2", "elk"],
  "d2-tala.svg": ["d2", "tala"],
};

const rows = [];
let ok = true;
for (const file of readdirSync(build).filter((f) => f.endsWith(".svg")).sort()) {
  const svg = readFileSync(join(build, file), "utf8");
  const [, , w, h] = svg.match(/viewBox="([^"]*)"/)[1].split(/\s+/).map(Number);
  const { nodes, edges } = inspect(svg);
  const good = nodes === graph.packages.length && edges === graph.edges.length;
  if (!good) ok = false;
  const [renderer, layout] = LABELS[file] ?? [file, ""];
  rows.push({ renderer, layout, width: Math.round(w), height: Math.round(h), nodes, edges, bytes: Buffer.byteLength(svg), good });
}

console.log("| Renderer | Layout | Canvas | Nodes | Edges | SVG |");
console.log("| --- | --- | ---: | ---: | ---: | ---: |");
for (const r of rows) {
  console.log(
    `| ${r.renderer} | ${r.layout} | ${r.width}x${r.height} | ${r.nodes} | ${r.edges} | ${(r.bytes / 1024).toFixed(1)} KiB |`,
  );
}
const want = `${graph.packages.length} nodes, ${graph.edges.length} edges`;
if (!ok) {
  console.error(`\nsome SVG does not match graph.json (${want})`);
  process.exit(1);
}
console.log(`\nall ${rows.length} SVGs match graph.json (${want})`);
