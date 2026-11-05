// fig-chart-tts-retry.ts -- the retry's two kinds of change on one RTF
// axis. The Qwen rows move because the driver changed (1.80 -> 1.54 with
// the same venv); the Piper rows move because the first measurement was
// taken under load (0.133 -> 0.072 in the same venv). Same metric, same
// direction, different cause: hue marks the cause, so the two groups are
// not read as one improvement story.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";
import { Plot } from "../chart.ts";

const c = new Canvas();

// measured values, one run each (Qwen: the warmed-up second run)
const rows: { y: number; rtf: number; label: string; cause: "driver" | "load" }[] = [
  { y: 4, rtf: 1.8, label: "1.80", cause: "driver" },
  { y: 3, rtf: 1.54, label: "1.54", cause: "driver" },
  { y: 2, rtf: 1.57, label: "1.57", cause: "driver" },
  { y: 1, rtf: 0.133, label: "0.133", cause: "load" },
  { y: 0, rtf: 0.072, label: "0.072", cause: "load" },
];
const COLOR = { driver: 3, load: 4 } as const;

const p = new Plot(
  c,
  {
    title: "同じ RTF の差でも、原因は 2 種類ある",
    subtitle: "実測 1 回ずつ（Qwen はウォームアップ後の 2 回目）、RTF は小さいほど速い",
    footnote:
      "出典: docs/sketch/ja/tts-wsl2.md（追試の記録、PR #129）の実測値 / 生成: tools/svg-gen/examples/fig-chart-tts-retry.ts",
  },
  {
    x: 210,
    y: 0,
    w: 400,
    h: 180,
    xdom: [0.05, 2],
    xlog: true,
    ydom: [-0.6, 4.6],
    xtitle: "RTF（音声 1 秒あたりの合成秒数、対数軸）",
    grid: true,
  },
);

p.frame({
  xticks: [0.05, 0.1, 0.2, 0.5, 1, 2],
  yticks: [
    [4, "Qwen1.7B 573.22 / cu128"],
    [3, "Qwen1.7B 617.42 / cu128 venv"],
    [2, "Qwen1.7B 617.42 / cu132 既定"],
    [1, "Piper 初回（573.22）"],
    [0, "Piper 同じ venv で再測"],
  ],
});

p.data(() => {
  p.vline(1, { label: "実時間の境界" });
  for (const row of rows) {
    p.dots([[p.xs.map(row.rtf), p.ys.map(row.y)]], { r: 5, opacity: 1, color: c.color(COLOR[row.cause]) });
    // the value stays as text, so hue is not the only channel
    c.text(p.xs.map(row.rtf) + 10, p.ys.map(row.y), row.label, { size: 11, baseline: "central" });
  }
});

// which hue means which cause, without a legend box
c.text(p.x1 + 16, p.ys.map(3.5), "ドライバ由来", { size: 11, opacity: 0.8 });
c.text(p.x1 + 16, p.ys.map(0.5), "負荷によるノイズ", { size: 11, opacity: 0.8 });

assert.ok(rows[0].rtf - rows[1].rtf > 0.2, "the driver change moves the Qwen row visibly");
assert.ok(rows[3].rtf - rows[4].rtf > 0.05, "the Piper re-measurement moves visibly too");

await writeFile(
  new URL("../build/fig-chart-tts-retry.svg", import.meta.url),
  c.toString({
    label:
      "dot plot of RTF for three Qwen configurations and two Piper measurements: the Qwen change tracks the driver, the Piper change is measurement noise",
  }),
);
