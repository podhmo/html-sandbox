// fig-silence-loop.ts -- how silence turns one output into a convention.
// The loop's closed shape is the point: with no negative channel, each
// pass feeds the next. The dangling box is the escape: writing the
// precedent down turns it into an explicit, negotiable requirement.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const H = 52;
const GX = 150;
const GY = 74;

const c = new Canvas();

const a = c.box(0, 0, "auto", H, { label: ["振る舞いが", "出力に入る"] });
const b = c.box(c.rightOf(a, GX), a.y, "auto", H, {
  label: ["止められない", "（沈黙）"],
});
const cc = c.box(b.x, b.y + H + GY, "auto", H, {
  label: ["文脈に前例", "として残る"],
});
const d = c.box(a.x, cc.y, "auto", H, {
  label: ["次回の exemplar", "に化ける"],
});

c.arrow(c.anchor(a, "e"), c.anchor(b, "w"));
c.arrow(c.anchor(b, "s"), c.anchor(cc, "n"));
c.arrow(c.anchor(cc, "w"), c.anchor(d, "e"));
c.arrow(c.anchor(d, "n"), c.anchor(a, "s"));

// The loop's centre names what accumulates each time around.
c.text(a.x + a.w + GX / 2, a.y + H + GY / 2 - 12, "沈黙の意味は", {
  anchor: "middle",
  baseline: "central",
  size: 12,
  opacity: 0.65,
});
c.text(a.x + a.w + GX / 2, a.y + H + GY / 2 + 12, "ループで決まる", {
  anchor: "middle",
  baseline: "central",
  size: 12,
  opacity: 0.65,
});

// Escape hatch: codification converts precedent into an explicit rule.
const e = c.box(cc.x + 30, cc.y + H + GY, "auto", H, {
  label: ["skill に書き込まれる", "＝明示要求に昇格"],
});
c.arrow(c.anchor(cc, "s"), [e.x + e.w / 2, e.y], {
  dash: "5 4",
  via: [[cc.x + cc.w / 2, e.y + e.h / 2], [e.x + e.w / 2, e.y + e.h / 2]],
});

assert.ok(a.y === b.y && cc.y === d.y, "loop rows must be aligned");
assert.ok(b.x === cc.x && a.x === d.x, "loop columns must be aligned");
assert.ok(
  e.y > cc.y + cc.h && e.x > d.x + d.w,
  "the codification box must hang off the loop, not overlap it",
);

await writeFile(
  new URL("../build/fig-silence-loop.svg", import.meta.url),
  c.toString({
    label:
      "silence loop: an output nobody stops stays in context as precedent, becomes the next exemplar, and is repeated; writing it into a skill promotes it to an explicit requirement",
  }),
);
