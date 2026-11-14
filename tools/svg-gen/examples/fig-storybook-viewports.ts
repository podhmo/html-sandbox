// fig-storybook-viewports.ts -- one story previewed at three viewport
// widths: same left edge, widths drawn to scale, hues distinguish the
// frames and a dash/width fallback keeps them readable without color.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const PX = 0.3; // css px -> svg units
const H = 180;

const c = new Canvas();

const nav = c.box(0, 0, "auto", H, { label: ["story", "nav"] });
const x0 = c.rightOf(nav, 48);

// widths drawn to scale: the 768 frame is visibly wider than the two
// phone widths, which differ only slightly.
const widths = [320, 360, 768];
const styles = [
  { dash: "5 3", width: 1.5 },
  { width: 2.5 },
  { dash: "2 3", width: 1.5 },
];
const frames = widths.map((wpx, i) =>
  c.box(x0, 0, wpx * PX, H, {
    color: c.color(i),
    dash: styles[i].dash,
    width: styles[i].width,
  }),
);

// each label sits above its own frame's right edge, staggered so the
// two close widths do not collide.
widths.forEach((wpx, i) => {
  const f = frames[i];
  c.text(f.x + f.w - 4, -10 - i * 14, `${wpx}px`, {
    anchor: "end",
    size: 12,
  });
});

c.text(x0 + (768 * PX) / 2, H + 24, "same story, three ?w= widths", {
  anchor: "middle",
  size: 13,
});

assert.ok(frames[0].w < frames[1].w && frames[1].w < frames[2].w);
assert.ok(frames.every((f) => f.x === x0));

await writeFile(
  new URL("../build/fig-storybook-viewports.svg", import.meta.url),
  c.toString({ label: "one story previewed at 320, 360 and 768 css px" }),
);
