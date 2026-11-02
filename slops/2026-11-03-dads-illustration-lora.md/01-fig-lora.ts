// fig-lora.ts -- what a LoRA is: the base model's weight matrix W stays
// frozen while a small low-rank delta (B x A, rank r) is trained on the
// 74-image DADS dataset and later merged at inference time behind a
// trigger word. Schematic, not measured.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas({ margin: 12 });

// the frozen base: one large matrix block
const base = c.box(30, 60, 190, 140, {
  label: "base model W\n(凍結)",
  color: c.color(0),
});
c.text(125, 215, "数GB・学習しない", { anchor: "middle", size: 11, opacity: 0.7 });

// the adapter: two thin matrices B and A (low rank)
const bMat = c.box(270, 80, 26, 100, { label: "B", color: c.color(2), size: 12 });
const aMat = c.box(310, 150, 100, 26, { label: "A", color: c.color(3), size: 12 });
c.text(370, 120, "ΔW = B·A\nrank r (16程度)\n数十MB", { size: 11 });

// merge arrow into output
const out = c.box(520, 80, "auto", 44, { label: "生成時に\nW + ΔW", color: c.color(1) });
c.arrow(c.anchor(base, "e"), c.anchor(out, "w"), { via: [[240, 82]] });
c.arrow([296, 130], c.anchor(out, "s"), { dash: "4 4" });

// trigger word activates the delta
c.text(520, 170, "prompt:", { size: 11, opacity: 0.7 });
c.text(520, 186, "dadsillu, a person ...", { size: 12, underline: true });

assert.ok(base.w > aMat.w + bMat.w, "the delta is drawn much smaller than the base");
await writeFile(
  new URL("../build/fig-lora.svg", import.meta.url),
  c.toString({ label: "schematic of a LoRA: a frozen base weight W plus a small low-rank delta B times A merged at inference" }),
);
