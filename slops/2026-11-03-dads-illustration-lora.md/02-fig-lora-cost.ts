// fig-lora-cost.ts -- listed trainer prices for one LoRA run
// (1000 steps where stated), November 2026 price pages. Not measured
// spend: list prices gathered during the investigation. Local GPU is
// time, not a fee, so it is noted in text rather than as a bar.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas();

const usd = [
  { label: "Replicate FLUX.1 dev", value: 1.46 },
  { label: "fal FLUX.1 dev fast", value: 2.0 },
  { label: "fal Klein系", value: 4.3 },
  { label: "fal FLUX.2 dev", value: 6.4 },
];

c.hbars(usd, { x: 0, y: 0, valueFmt: (v) => `$${v}`, highlight: 0 });
c.text(160, -16, "LoRA学習1回あたりの表示価格 (2026-11, 各社の価格ページ)", {
  size: 11,
  opacity: 0.6,
});
c.text(160, 150, "local GPU (FluxGym等, 12GB VRAM) はGPU時間のみ。CivitaiはBuzz建て", {
  size: 11,
  opacity: 0.7,
});

assert.ok(
  usd.every((k, i) => i === 0 || usd[i - 1].value <= k.value),
  "bars are sorted ascending",
);
await writeFile(
  new URL("../build/fig-lora-cost.svg", import.meta.url),
  c.toString({ label: "listed prices for one LoRA training run: Replicate FLUX.1 dev 1.46 USD, fal FLUX.1 dev 2 USD, fal Klein 4.3 USD, fal FLUX.2 dev 6.4 USD" }),
);
