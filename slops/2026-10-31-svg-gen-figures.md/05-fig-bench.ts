// fig-bench.ts -- a horizontal bar chart from real numbers: the SVG
// sizes each renderer/layout produced for the same package graph in
// issue #85's comparison. Long labels fit because the label column is
// measured from the labels.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "./svg.ts";

const c = new Canvas();

// KiB of SVG output for moonbit/'s 17-package, 21-edge graph (issue #85).
const kib = [
  { label: "beautiful-mermaid elk", value: 19.8 },
  { label: "d2 tala", value: 20.8 },
  { label: "d2 dagre", value: 21.9 },
  { label: "d2 elk", value: 22.3 },
  { label: "mermaid elk", value: 46.9 },
  { label: "mermaid dagre", value: 47.9 },
];

c.hbars(kib, { x: 0, y: 0, valueFmt: (v) => `${v} KiB`, highlight: 0 });
c.text(160, -16, "SVG size for the same graph (smaller is better)", {
  size: 11,
  opacity: 0.6,
});

assert.ok(
  kib.every((k, i) => i === 0 || kib[i - 1].value <= k.value),
  "bars are sorted ascending",
);

await writeFile(
  new URL("./build/fig-bench.svg", import.meta.url),
  c.toString({ label: "SVG file size by renderer and layout" }),
);
