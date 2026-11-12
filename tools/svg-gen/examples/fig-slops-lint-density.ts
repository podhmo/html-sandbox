// fig-slops-lint-density.ts -- yomiyasu lint candidate density,
// rule x author. Real measurements from the issue #169 aggregation
// over all 59 slops members (not virtual data): dark cells show
// where the authors actually differ.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";
import { Plot } from "../chart.ts";

const c = new Canvas();

const authors = ["Devin", "Claude", "Codex", "opencode", "不明"] as const;
// candidates per 1000 chars, rows in display order (top first).
const rows: { label: string; v: number[] }[] = [
  { label: "pause_comma", v: [0.51, 1.83, 2.47, 1.53, 1.44] },
  { label: "trailing_colon", v: [0.34, 0, 0, 0, 0] },
  { label: "dash_decoration", v: [0.39, 0.05, 0, 0, 0] },
  { label: "slop_vocabulary", v: [0.15, 0.05, 0, 0, 0] },
  { label: "metaphor_label", v: [0.11, 0, 0, 0, 0] },
  { label: "calque", v: [0.11, 0.18, 0, 1.02, 0] },
  { label: "negative_parallelism", v: [0.58, 0.48, 0.27, 1.53, 0.84] },
  { label: "excess_list", v: [0.34, 0.18, 0.55, 0.26, 0] },
];
const nR = rows.length;
const nC = authors.length;

const p = new Plot(
  c,
  {
    title: "執筆者差は機械的な規則に集まる",
    subtitle: "yomiyasu lint の候補密度 (候補/千字)、slops 全 59 メンバー",
    footnote: "出典: issue #169 の集計コメント / 生成: fig-slops-lint-density.ts",
  },
  { w: 300, h: 200, xdom: [0, nC], ydom: [0, nR] },
);
p.frame({
  xticks: authors.map((a, i) => [i + 0.5, a] as [number, string]),
  yticks: rows.map((r, j) => [nR - 0.5 - j, r.label] as [number, string]),
});
let mm!: { min: number; max: number };
p.data(() => {
  mm = p.heatmap(rows.map((r) => r.v));
});
p.heatLegend(mm, {
  x: p.x1 - 80,
  y: p.y1 + 56,
  fmt: (v) => v.toFixed(1),
  label: "候補/千字",
});

// value labels inside every cell: the gap between a dark cell and a
// near-zero neighbour is the whole point, so keep the numbers readable.
const cw = (p.x1 - p.x0) / nC;
const ch = (p.y1 - p.y0) / nR;
rows.forEach((r, j) => {
  r.v.forEach((v, i) => {
    c.text(p.x0 + (i + 0.5) * cw, p.y0 + (j + 0.55) * ch, v === 0 ? "0" : v.toFixed(2), {
      anchor: "middle",
      baseline: "central",
      size: 8,
      opacity: 0.8,
    });
  });
});

assert.ok(rows.length === 8 && rows.every((r) => r.v.length === authors.length));

await writeFile(
  new URL("../build/fig-slops-lint-density.svg", import.meta.url),
  c.toString({
    label:
      "yomiyasu lint candidate density by author: pause_comma separates the authors, meaning-level rules stay flat",
  }),
);
