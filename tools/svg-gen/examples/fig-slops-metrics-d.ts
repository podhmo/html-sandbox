// fig-slops-metrics-d.ts -- claude-vs-devin Cohen's d for the measured
// features, overall vs inside the "変更の報告" genre only (6 vs 6
// members). Real measurements from the issue #172 aggregation
// (tools/slops-metrics/out/report.md and out/genre.md).
// Darkness encodes |d|; the signed value is printed in each cell.
// Rows above the gap are claude-high features, below it devin-high.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";
import { Plot } from "../chart.ts";

const c = new Canvas();

const cols = ["全体 (65)", "変更の報告 (6v6)"] as const;
// rows top-first; v = [overall d, within-genre d], sign = claude - devin.
const rows: { label: string; v: number[] }[] = [
  { label: "節数/文", v: [0.95, 1.43] },
  { label: "文末:「た」率", v: [1.12, 0.63] },
  { label: "読点@文節末", v: [0.9, 1.1] },
  { label: "読点", v: [0.8, 1.12] },
  { label: "接続詞", v: [0.63, 1.07] },
  { label: "形式名詞", v: [0.52, 0.96] },
  { label: "無生物主語+動作動詞", v: [0.65, 0.42] },
  { label: "連用形+読点", v: [0.79, 0.32] },
  { label: "て形接続", v: [0.67, 0.31] },
  { label: "係受け深さ平均", v: [0.51, 0.07] },
  { label: "名詞3連積み上げ", v: [-0.62, -1.11] },
  { label: "サ変名詞", v: [-1.11, -1.73] },
  { label: "文末:体言止め率", v: [-0.81, -2.87] },
];
const nR = rows.length;
const nC = cols.length;

const p = new Plot(
  c,
  {
    title: "ジャンルを統制しても執筆者差は残る",
    subtitle: "claude−devin の Cohen's d。右列は「変更の報告」内のみ (各6メンバー)",
    footnote: "出典: issue #172 集計 / tools/slops-metrics measure.py, genre.py",
  },
  { w: 220, h: 340, xdom: [0, nC], ydom: [0, nR] },
);
p.frame({
  xticks: cols.map((a, i) => [i + 0.5, a] as [number, string]),
  yticks: rows.map((r, j) => [nR - 0.5 - j, r.label] as [number, string]),
});
let mm!: { min: number; max: number };
p.data(() => {
  mm = p.heatmap(rows.map((r) => r.v.map(Math.abs)));
});
p.heatLegend(mm, {
  x: p.x1 - 80,
  y: p.y1 + 56,
  fmt: (v) => v.toFixed(1),
  label: "|d|",
});

const cw = (p.x1 - p.x0) / nC;
const ch = (p.y1 - p.y0) / nR;
rows.forEach((r, j) => {
  r.v.forEach((v, i) => {
    c.text(p.x0 + (i + 0.5) * cw, p.y0 + (j + 0.55) * ch, (v > 0 ? "+" : "") + v.toFixed(2), {
      anchor: "middle",
      baseline: "central",
      size: 8,
      opacity: 0.8,
    });
  });
});
// divider between claude-high rows and devin-high rows.
c.line([p.x0, p.y0 + 10 * ch], [p.x1, p.y0 + 10 * ch], { opacity: 0.45, width: 1 });
c.text(p.x0 - 6, p.y0 + 5 * ch, "claude 側が高い", { anchor: "end", baseline: "central", size: 9, opacity: 0.6 });
c.text(p.x0 - 6, p.y0 + 11.5 * ch, "devin 側が高い", { anchor: "end", baseline: "central", size: 9, opacity: 0.6 });

assert.ok(rows.length === 13 && rows.every((r) => r.v.length === cols.length));

await writeFile(
  new URL("../build/fig-slops-metrics-d.svg", import.meta.url),
  c.toString({
    label:
      "claude-vs-devin effect sizes overall vs within the 変更の報告 genre: the clause-chaining signature persists, dependency depth collapses",
  }),
);
