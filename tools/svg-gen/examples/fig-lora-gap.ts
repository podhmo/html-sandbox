// fig-lora-gap.ts -- the real blocker is not training cost ($2) but the
// format gap: the pipeline ends in PNG, and slops bundles cannot host
// raster. SVG went through the same question already and got an embed
// route; MathML (issue #73) is the same family of question, still open.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas({ margin: 12 });

const data = c.box(20, 60, "auto", 40, { label: "DADS素材\n74枚", color: c.color(0) });
const train = c.box(160, 60, "auto", 40, { label: "学習\n~$2", color: c.color(1) });
const lora = c.box(300, 60, "auto", 40, { label: "LoRA\n.safetensors", color: c.color(2) });
const png = c.box(510, 60, "auto", 40, { label: "生成\nPNG", color: c.color(3) });
const wall = c.box(660, 60, "auto", 40, { label: "slops\nPNG不可", color: c.color(4) });

c.arrow(c.anchor(data, "e"), c.anchor(train, "w"));
c.arrow(c.anchor(train, "e"), c.anchor(lora, "w"));
c.arrow(c.anchor(lora, "e"), c.anchor(png, "w"));
c.arrow(c.anchor(png, "e"), c.anchor(wall, "w"), { dash: "6 4" });

// the same wall, earlier: SVG already got its embed route
const svg = c.box(310, 170, "auto", 40, { label: "SVG\nフェンス", color: c.color(5) });
const ok = c.box(660, 170, "auto", 40, { label: "埋め込み可", color: c.color(1) });
c.arrow(c.anchor(svg, "e"), c.anchor(ok, "w"));

// the same question, still open: MathML
const math = c.box(310, 250, "auto", 40, { label: "MathML\nissue #73" });
const open = c.box(660, 250, "auto", 40, { label: "未回答" });
c.arrow(c.anchor(math, "e"), c.anchor(open, "w"), { dash: "4 4" });

c.text(20, 320, "同じ壁: 「このフォーマットにその表現形式を載せるか」— PNGがぶつかるのは3例目", { size: 12, opacity: 0.8 });

assert.ok(true);
await writeFile(
  new URL("../build/fig-lora-gap.svg", import.meta.url),
  c.toString({ label: "pipeline from DADS assets to a PNG that slops cannot host; SVG already has an embed route, MathML issue 73 is still open" }),
);
