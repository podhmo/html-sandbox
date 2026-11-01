// fig-chart-series.ts -- daily latency percentiles around a deploy.
// The "time series" branch of the chart-selection flow: lines for the
// trend, a vertical event line for the deploy. Data is virtual —
// two weeks of daily-aggregated p50/p90 from a seeded PRNG.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";
import { Plot, gauss, rng } from "../chart.ts";

const c = new Canvas();
const g = gauss(rng(20261030));

// virtual daily aggregates: a latency drop after the 10/08 deploy,
// with day-of-week wobble and noise.
const days = Array.from({ length: 14 }, (_, i) => i + 1); // Oct 1..14
const base = (d: number) => (d < 8 ? 150 : 105);
const weekly = (d: number) => (d % 7 === 6 || d % 7 === 0 ? 12 : 0); // weekend bump
const p50 = days.map((d) => base(d) + weekly(d) + 5 * g());
const p90 = days.map((d, i) => p50[i] * 1.7 + weekly(d) + 12 * g());

const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
const drop = Math.round((1 - mean(p90.slice(8)) / mean(p90.slice(0, 8))) * 100);

const p = new Plot(
  c,
  {
    title: `10/08 デプロイ後に p90 が約 ${drop}% 低下（仮想データ）`,
    subtitle: "JST、1 時間平均の日次集計、2026-10-01〜10-14、仮想データ",
    footnote: "出典: 仮想データ (seed 20261030) / 集計: 日次 / イベント: 10/08 v2.3 デプロイ / 生成: tools/svg-gen/examples/fig-chart-series.ts",
  },
  {
    w: 420,
    h: 170,
    xdom: [1, 14],
    ydom: [0, 320],
    xtitle: "日付 (JST)",
    ytitle: "レイテンシ (ms)",
    xfmt: (v) => `10/${v}`,
    grid: true,
  },
);
p.frame();
p.data(() => {
  p.vline(8, { label: "10/08 v2.3 デプロイ" });
  // colorful option: hue does the series distinction, width/dash stays
  // as a grayscale fallback so the figure still reads when colors
  // are unavailable (print, copy).
  p.series(days.map((d, i) => [p.xs.map(d), p.ys.map(p90[i])]), { dash: "5 3", color: c.color(3) });
  p.series(days.map((d, i) => [p.xs.map(d), p.ys.map(p50[i])]), { width: 2.5, color: c.color(0) });
});
// direct labels at the right ends (the two series end far apart).
c.text(p.x1 + 6, p.ys.map(p50[13]), "p50", { baseline: "central", size: 10 });
c.text(p.x1 + 6, p.ys.map(p90[13]), "p90", { baseline: "central", size: 10, opacity: 0.65 });

assert.ok(drop > 10, "p90 clearly drops after the deploy");

await writeFile(
  new URL("../build/fig-chart-series.svg", import.meta.url),
  c.toString({ label: `daily p50/p90 latency: p90 drops about ${drop}% after the 10/08 deploy (virtual data)` }),
);
