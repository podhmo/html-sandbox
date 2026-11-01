// fig-chart-heat.ts -- traffic heatmap, day x hour. The "time
// series / periodicity" branch: a heatmap shows daily and weekly
// patterns that 168 points of spaghetti lines would not.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";
import { Plot } from "../chart.ts";
import { traffic, trafficDays } from "./data.ts";

const c = new Canvas();

// find the peak cell for the conclusion title
let peak = { d: 0, h: 0, v: 0 };
traffic.forEach((row, d) =>
  row.forEach((v, h) => {
    if (v > peak.v) peak = { d, h, v };
  }),
);

const p = new Plot(
  c,
  {
    title: `${trafficDays[peak.d]} ${peak.h} 時台のスパイクと週末の谷（仮想データ）`,
    subtitle: "req/s の 1 時間平均、2026-10-W42 の 1 週間、仮想データ",
    footnote:
      "出典: 仮想データ (tools/svg-gen/examples/data.ts, seed 20261102) / 集計: 1 時間平均 / 生成: tools/svg-gen/examples/fig-chart-heat.ts",
  },
  {
    w: 440,
    h: 150,
    xdom: [0, 24],
    ydom: [0, 7],
    xtitle: "時刻 (JST)",
  },
);
p.frame({
  xticks: [0, 6, 12, 18, 24].map((h) => [h, `${h}時`] as [number, string]),
  yticks: trafficDays.map((d, i) => [traffic.length - 0.5 - i, d] as [number, string]),
});
const mm = p.heatmap(traffic);
p.heatLegend(mm, { x: p.x1 - 80, y: p.y0 - 24, fmt: (v) => String(Math.round(v)), label: "req/s" });

assert.ok(peak.d === 1, "the incident peak is on Tuesday");

await writeFile(
  new URL("../build/fig-chart-heat.svg", import.meta.url),
  c.toString({ label: `traffic heatmap: peak on ${trafficDays[peak.d]} around ${peak.h}:00, weekends quiet (virtual data)` }),
);
