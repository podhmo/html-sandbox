// fig-chart-scatter.ts -- payload size vs latency, log x axis.
// The "relationship" branch of the chart-selection flow: a scatter of
// raw request pairs. Data is virtual — 220 requests from a seeded
// PRNG, with a handful of timeout-ish outliers.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";
import { Plot, gauss, rng } from "../chart.ts";

const c = new Canvas();
const rand = rng(20261031);
const g = gauss(rand);

// virtual pairs: payload (KiB) spans 3 decades on a log axis;
// latency grows ~linearly in log10(payload) plus noise and outliers.
const pairs: [number, number][] = [];
for (let i = 0; i < 220; i++) {
  const lx = 3 * rand(); // log10(KiB), 1 .. 1M KiB? no: 0..3 -> 1KiB..1MiB
  const payload = Math.pow(10, lx);
  const outlier = rand() < 0.04 ? 160 + 60 * rand() : 0;
  const latency = 35 + 42 * lx + 22 * g() + outlier;
  pairs.push([payload, Math.max(latency, 8)]);
}

// least squares on log10(payload) -> the "+N ms per decade" headline.
const xs = pairs.map(([v]) => Math.log10(v));
const ys = pairs.map(([, v]) => v);
const mx = xs.reduce((s, v) => s + v) / xs.length;
const my = ys.reduce((s, v) => s + v) / ys.length;
const slope =
  xs.reduce((s, v, i) => s + (v - mx) * (ys[i] - my), 0) /
  xs.reduce((s, v) => s + (v - mx) * (v - mx), 0);
const perDecade = Math.round(slope);

const p = new Plot(
  c,
  {
    title: `ペイロード 1 桁ごとにレイテンシ +約 ${perDecade} ms（仮想データ）`,
    subtitle: "n = 220 リクエスト、2026-10-14 の 1 時間、生値、仮想データ",
    footnote: "出典: 仮想データ (seed 20261031) / n = 220 / 集計: なし（生値）/ 生成: tools/svg-gen/examples/fig-chart-scatter.ts",
  },
  {
    w: 420,
    h: 190,
    xdom: [1, 1000],
    ydom: [0, 320],
    xlog: true,
    xtitle: "ペイロード (KiB, log)",
    ytitle: "レイテンシ (ms)",
    grid: true,
  },
);
p.frame();
p.dots(pairs.map(([x, y]) => [p.xs.map(x), p.ys.map(y)]), { r: 1.8, opacity: 0.45 });
// regression guide, drawn dashed so it reads as "a fitted model",
// not as another measured series.
const lx = (v: number) => my + slope * (v - mx);
p.series(
  [
    [p.xs.map(1), p.ys.map(lx(0))],
    [p.xs.map(1000), p.ys.map(lx(3))],
  ],
  { dash: "2 3", opacity: 0.8, color: c.color(0) },
);
c.text(p.xs.map(300), p.ys.map(lx(Math.log10(300))) - 8, "単回帰（説明用）", {
  anchor: "middle",
  size: 10,
  opacity: 0.7,
});

assert.ok(perDecade > 20 && perDecade < 60, "slope lands in the designed range");

await writeFile(
  new URL("../build/fig-chart-scatter.svg", import.meta.url),
  c.toString({ label: `scatter of payload size vs latency: about +${perDecade} ms per decade of payload (virtual data)` }),
);
