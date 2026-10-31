// fig-loop.ts -- generate -> render -> check -> fix loop, the same figure
// as the earlier /tmp prototype, now with anchors instead of literals.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "./svg.ts";

const H = 44;
const GAP = 40;

const c = new Canvas();

// Widths come from the labels, so no label can outgrow its box.
const input = c.box(0, 80, "auto", H, { label: "Input" });
const conv = c.box(c.rightOf(input, GAP), input.y, "auto", H, { label: "Convert" });
const out = c.box(c.rightOf(conv, GAP), input.y, "auto", H, { label: "Output" });
const check = c.box(conv.x, input.y - 1.5 * GAP - H, "auto", H, {
  label: "Check + fix",
});

c.arrow(c.anchor(input, "e"), c.anchor(conv, "w"));
c.arrow(c.anchor(conv, "e"), c.anchor(out, "w"));
c.arrow(c.anchor(out, "n"), c.anchor(check, "e"), {
  via: [[c.anchor(out, "n")[0], c.anchor(check, "e")[1]]],
});
c.arrow(c.anchor(check, "w"), c.anchor(input, "n"), {
  via: [
    [input.x - GAP / 2, c.anchor(check, "w")[1]],
    [input.x - GAP / 2, c.anchor(input, "n")[1]],
  ],
  dash: "5 4",
});

// Spatial claims the drawing depends on, stated where they can fail loudly.
assert.ok(input.y === conv.y && conv.y === out.y, "row must be aligned");
assert.ok(
  check.y + check.h < input.y,
  "check box must sit above the input row",
);

await writeFile(
  new URL("./build/fig-loop.svg", import.meta.url),
  c.toString({ label: "generate, render, then check and fix loop" }),
);
