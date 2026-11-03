// fig-lora-vram.ts -- measured peak VRAM of the local FLUX.2 klein LoRA
// training runs, against the 8GB card they ran on. Measured with
// torch.cuda.max_memory_allocated() at the end of training on an
// RTX 5060 Laptop (8GB, WSL2), 2026-11-03.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas, textWidth } from "../svg.ts";

const c = new Canvas();

const GIB = 8; // nominal VRAM of the card
const PX_PER_GIB = 26;

const runs = [
  { label: "512px, 400 steps", value: 3.0 },
  { label: "1024px, 10 steps", value: 4.99 },
];

// hbars scales the largest value to maxW, so set maxW from the ratio to
// keep 1 GiB == PX_PER_GIB px and leave room for the 8 GiB marker.
const maxW = PX_PER_GIB * Math.max(...runs.map((r) => r.value));
c.hbars(runs, {
  x: 0,
  y: 0,
  barH: 20,
  rowGap: 14,
  maxW,
  size: 12,
  valueFmt: (v) => `${v.toFixed(2)} GiB`,
});

// The capacity line is placed at 8 GiB using the same ratio.
const labelW = Math.max(...runs.map((r) => textWidth(r.label, 12))) + 16;
const capX = labelW + GIB * PX_PER_GIB;
const bottom = runs.length * (20 + 14) - 14;
c.line([capX, -26], [capX, bottom + 10], { dash: "4 3", width: 1.5 });
c.text(capX, -34, "8 GiB (このGPUのVRAM)", { anchor: "middle", size: 11, opacity: 0.7 });

c.text(0, bottom + 34, "ピークは transformer をNF4、text encoderをCPUに置いた構成の実測値。", {
  size: 11,
  opacity: 0.65,
});

assert.ok(
  runs.every((r) => r.value < GIB),
  "every measured run must fit under the card's VRAM",
);
assert.ok(
  runs[0].value < runs[1].value,
  "1024px is the more expensive run",
);
await writeFile(
  new URL("../build/fig-lora-vram.svg", import.meta.url),
  c.toString({
    label:
      "peak VRAM of the local LoRA training: 512px 400 steps 3.00 GiB, 1024px 10 steps 4.99 GiB, on an 8 GiB card",
  }),
);
