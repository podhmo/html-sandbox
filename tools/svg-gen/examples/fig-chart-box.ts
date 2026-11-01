// fig-chart-box.ts -- box-and-whisker for four benchmark variants,
// raw points jittered on top. The "cached" group is secretly bimodal
// (data.ts): the box reports one compact distribution, which is the
// guideline's own warning — a box plot hides multimodality — made
// visible here by the jittered points.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";
import { Plot, quantile, rng } from "../chart.ts";
import { bench } from "./data.ts";

const c = new Canvas();
const jitter = rng(20261103);

const medians = bench.map((b) => quantile([...b.values].sort((a, b2) => a - b2), 0.5));
const best = bench[medians.indexOf(Math.min(...medians))].label;

const p = new Plot(
  c,
  {
    title: `"cached" は箱では一様だが、実は二峰（仮想データ）`,
    subtitle: `ベンチマーク試行 n = 160 / impl、中央値最小は "${best}"、仮想データ`,
    footnote:
      "出典: 仮想データ (tools/svg-gen/examples/data.ts, seed 20261102) / n = 160×4 / ひげ: 1.5×IQR / 生成: tools/svg-gen/examples/fig-chart-box.ts",
  },
  {
    w: 420,
    h: 190,
    xdom: [0, bench.length],
    ydom: [40, 260],
    ytitle: "試行時間 (ms)",
    grid: true,
  },
);
p.frame({
  xticks: bench.map((b, i) => [i + 0.5, b.label] as [number, string]),
});
// faint jittered points (thinned): the box alone hides shape, so the
// points carry the multimodality the boxes cannot show.
p.data(() => p.boxplot(bench, { overlay: 0.25, rand: jitter, color: c.color(0) }));

assert.ok(bench.length === 4, "four benchmark groups drawn");

await writeFile(
  new URL("../build/fig-chart-box.svg", import.meta.url),
  c.toString({ label: "box plot of four benchmark variants; the cached group is secretly bimodal (virtual data)" }),
);
