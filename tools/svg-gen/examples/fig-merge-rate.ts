// fig-merge-rate.ts -- PR merges completed per hour during the
// 2026-11-21/22 stacked-chain sweep (podhmo/minigo #1111..#1395).
// Real data: squash-commit committer timestamps from main.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";
import { Plot } from "../chart.ts";

const c = new Canvas();

// merges per hour, 20:00 -> 06:00 JST (x = hours since 20:00).
const counts = [44, 27, 36, 42, 44, 30, 10, 13, 12, 13, 7];
const bs = counts.map((n, i) => ({ x0: i + 0.08, x1: i + 0.92, n }));
const clock = (i: number) => `${(20 + i) % 24}:00`;

const p = new Plot(
  c,
  {
    title: "1時間あたりのマージ完了数 — 02時すぎから鈍化した",
    subtitle: "podhmo/minigo 2026-11-21 20:00 → 11-22 06:30 (JST)、squash merge完了コミット時刻で集計",
    footnote:
      "出典: main のコミット時刻 (実測) / n = 278 マージ / 生成: tools/svg-gen/examples/fig-merge-rate.ts",
  },
  {
    w: 430,
    h: 170,
    xdom: [-0.4, 11.2],
    ydom: [0, 50],
    xtitle: "時刻 (JST)",
    ytitle: "マージ数 / 時間",
    grid: true,
  },
);
p.frame({
  xticks: [0, 2, 4, 6, 8, 10].map((i) => [i + 0.5, clock(i)]),
});
p.data(() => {
  p.histogram(bs, { color: c.color(0) });
  p.vline(6, { label: "手動対応が増え始めた帯" });
});

assert.equal(counts.reduce((a, b) => a + b), 278);
assert.ok(counts[0] > 40 && counts[10] < 10, "the early/late rate contrast is the point of the figure");

await writeFile(
  new URL("../build/fig-merge-rate.svg", import.meta.url),
  c.toString({ label: "bar chart of PR merges per hour: ~40/h until 01:00, then ~10/h after 02:00" }),
);
