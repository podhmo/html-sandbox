// fig-slops-genre-comma.ts -- comma density (per 1000 prose chars,
// member mean) by article genre and author. Real measurements from
// tools/slops-metrics/out/genre.md. devin's own values swing 10x across
// genres; in every shared genre claude still sits at or above devin.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";
import { Plot } from "../chart.ts";

const c = new Canvas();

// rows top-first, ordered by the devin mean (claude-only rows slotted
// by their claude value). * marks provisional genre labels from
// genre.py. d/c/x = devin/claude/codex member means (absent = no dot).
const rows: { label: string; d?: number; cl?: number; x?: number }[] = [
  { label: "書き方そのもの*", cl: 26.56 },
  { label: "書き方そのもの", d: 26.52, cl: 22.15, x: 26.01 },
  { label: "詰まった経緯", cl: 22.4 },
  { label: "主張の検討", d: 19.36 },
  { label: "他人の成果物を読む", d: 19.14 },
  { label: "変更の報告", d: 18.77, cl: 24.44 },
  { label: "実験・比較", d: 15.27, cl: 25.99 },
  { label: "変更の報告*", d: 14.4, cl: 18.71 },
  { label: "実験・比較*", d: 14.11 },
  { label: "主張の検討*", d: 13.93 },
  { label: "実現性の調査", d: 12.58 },
  { label: "任せた作業の記録", d: 9.99 },
  { label: "記法の見本", d: 0.0, cl: 13.82 },
];
const nR = rows.length;

const p = new Plot(
  c,
  {
    title: "読点密度はジャンルでも大きく動く",
    subtitle: "読点/千字のメンバー平均を記事の目的別に。devin/claude/codex は色分けの点",
    footnote: "出典: issue #172 集計 / tools/slops-metrics genre.py。n=1 の点あり",
  },
  { w: 300, h: 340, xdom: [-1.2, 30], ydom: [0, nR] },
);
p.frame({
  xticks: [0, 5, 10, 15, 20, 25, 30],
  yticks: rows.map((r, j) => [nR - 0.5 - j, r.label] as [number, string]),
});
p.data(() => {
  rows.forEach((r, j) => {
    const y = p.ys.map(nR - 0.5 - j);
    // dots() takes pixel coordinates, not data coordinates.
    if (r.d !== undefined) p.dots([[p.xs.map(r.d), y]], { r: 3.2, color: c.color(0) });
    if (r.cl !== undefined) p.dots([[p.xs.map(r.cl), y]], { r: 3.2, color: c.color(1) });
    if (r.x !== undefined) p.dots([[p.xs.map(r.x), y]], { r: 3.2, color: c.color(2) });
  });
});

// legend: colored dots + labels under the plot.
const ly = p.y1 + 56;
const legend: [number, string][] = [[0, "devin"], [1, "claude"], [2, "codex"]];
legend.forEach(([i, name], k) => {
  const x = p.x1 - 150 + k * 50;
  c.raw(
    `<circle cx="${x}" cy="${ly}" r="3.2" fill="${c.color(i)}" stroke="none"/>`,
  );
  c.text(x + 7, ly, name, { size: 9, opacity: 0.7, baseline: "central" });
});

assert.ok(rows.length === nR);
await writeFile(
  new URL("../build/fig-slops-genre-comma.svg", import.meta.url),
  c.toString({
    label:
      "comma density by genre and author: devin ranges 10 to 27 across genres while claude stays high in every shared genre",
  }),
);
