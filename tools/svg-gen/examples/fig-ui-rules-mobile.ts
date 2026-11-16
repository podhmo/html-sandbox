// fig-ui-rules-mobile.ts -- the 360px collision the audit found: the
// back-to-top chip sat in the same corner as the submit button. The fix
// moves it to the inline-start edge under max-width:40em.
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas();
const W = 150;
const H = 240;

function phone(x: number, y: number, caption: string) {
  const p = c.box(x, y, W, H, { rx: 14, opacity: 0.8 });
  c.text(x + W / 2, y + H + 22, caption, {
    anchor: "middle",
    baseline: "central",
    size: 11,
    opacity: 0.6,
  });
  return p;
}

// before: the chip covers the submit corner
{
  const x = 20;
  const y = 10;
  phone(x, y, "before: overlap");
  c.box(x + W - 78, y + H - 46, 66, 28, { label: "Submit", size: 11, padX: 8, rx: 6, color: c.color(0) });
  c.box(x + W - 60, y + H - 31, 52, 26, { label: "↑Top", size: 11, padX: 6, rx: 13, color: c.color(3), dash: "4 3" });
}

// after: chip moves left, submit keeps the right corner
{
  const x = 240;
  const y = 10;
  phone(x, y, "after: split corners");
  c.box(x + W - 78, y + H - 46, 66, 28, { label: "Submit", size: 11, padX: 8, rx: 6, color: c.color(0) });
  c.box(x + 10, y + H - 46, 52, 26, { label: "↑Top", size: 11, padX: 6, rx: 13, color: c.color(1) });
}

await writeFile(
  new URL("../build/fig-ui-rules-mobile.svg", import.meta.url),
  c.toString({ label: "360px 幅で back-to-top チップが送信ボタンに重なっていた問題と、左右の隅に分けた修正後を対比した図" }),
);
