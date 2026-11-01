// fig-chart-hist.ts -- histogram of the same "cached" group the box
// plot flattened. Same virtual dataset (data.ts), different figure:
// the two modes the box hid are obvious here. The bin width is
// declared in the subtitle, as the guideline requires.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "./svg.ts";
import { Plot, bins } from "./chart.ts";
import { bench } from "./data.ts";

const c = new Canvas();

const cached = bench.find((b) => b.label === "cached")!;
const binW = 10;
const bs = bins(cached.values, binW);
// two modes: a dip below 45% of the peak somewhere between the modes
const peak = Math.max(...bs.map((b) => b.n));
const mid = bs.findIndex((b) => b.x0 >= 110);
const dip = Math.min(...bs.slice(4, mid + 1).map((b) => b.n));

const p = new Plot(
  c,
  {
    title: `"cached" の試行時間は二峰（箱ひげと同じデータ、仮想）`,
    subtitle: `ベンチマーク試行 n = ${cached.values.length}、ビン幅 ${binW} ms、仮想データ`,
    footnote:
      "出典: 仮想データ (tools/svg-gen/data.ts, seed 20261102) / n = 160 / ビン幅 10 ms / 生成: tools/svg-gen/fig-chart-hist.ts",
  },
  {
    w: 420,
    h: 170,
    xdom: [60, 200],
    ydom: [0, 30],
    xtitle: "試行時間 (ms)",
    ytitle: "件数",
    grid: true,
  },
);
p.frame();
p.histogram(bs, { color: c.color(0) });

assert.ok(dip < peak * 0.5, "a visible dip separates the two modes");

await writeFile(
  new URL("./build/fig-chart-hist.svg", import.meta.url),
  c.toString({ label: "histogram of cached trials showing two modes (same virtual data as the box plot)" }),
);
