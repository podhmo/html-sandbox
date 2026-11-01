// fig-chart-ecdf.ts -- ECDF of request latency for two release versions.
// The "distribution" branch of the chart-selection flow: for a
// developer audience the first choice is ECDF (any percentile is
// readable directly, no bin width to declare). Data is virtual —
// lognormal samples from a seeded PRNG, regenerated identically
// every run.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "./svg.ts";
import { Plot, ecdfPoints, gauss, quantile, rng } from "./chart.ts";

const c = new Canvas();
const g = gauss(rng(20261101));
const sample = (mu: number, sigma: number, n: number) =>
  Array.from({ length: n }, () => Math.exp(mu + sigma * g())).sort((a, b) => a - b);

// virtual request latency (ms), before and after a deploy
const v22 = sample(Math.log(140), 0.55, 600);
const v23 = sample(Math.log(105), 0.5, 600);

const gain = Math.round((1 - quantile(v23, 0.99) / quantile(v22, 0.99)) * 100);

const p = new Plot(
  c,
  {
    title: `v2.3 で p99 レイテンシが ${gain}% 改善（仮想データ）`,
    subtitle: "us-east-1 相当の仮想計測、2026-10-01〜10-14、n = 600 / version、生値",
    footnote: "出典: 仮想データ (seed 20261101) / n = 600×2 / 集計: なし（生値の ECDF）/ 生成: tools/svg-gen/fig-chart-ecdf.ts",
  },
  {
    w: 420,
    h: 190,
    xdom: [40, 800],
    ydom: [0, 1],
    xtitle: "レイテンシ (ms)",
    ytitle: "累積割合",
    yfmt: (v) => v.toFixed(1),
    grid: true,
  },
);
p.frame();
// faint guides at p50 / p90 / p99 so the improvement is readable off axes.
for (const q of [0.5, 0.9, 0.99]) {
  p.hline(q, { label: `p${q * 100}`, opacity: 0.25 });
}
// stride-thinned to ~150 vertices per curve for inline embedding;
// the ECDF statistic itself is unchanged.
p.step(ecdfPoints(p, v22, 150), { opacity: 0.65 });
p.step(ecdfPoints(p, v23, 150), { width: 2.5 });
// direct labels where the curves are far apart (near their p80).
const at = (s: number[], q: number) => p.xs.map(quantile(s, q));
const y80 = p.ys.map(0.8);
c.text(at(v22, 0.8) + 6, y80, "v2.2", { baseline: "central", size: 11, opacity: 0.65 });
c.text(at(v23, 0.8) + 6, y80 - 14, "v2.3", { baseline: "central", size: 11 });

assert.ok(gain > 0, "v2.3 improves p99 over v2.2");

await writeFile(
  new URL("./build/fig-chart-ecdf.svg", import.meta.url),
  c.toString({ label: `ECDF of request latency: p99 improves ${gain}% in v2.3 (virtual data)` }),
);
