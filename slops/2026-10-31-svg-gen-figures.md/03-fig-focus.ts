// fig-focus.ts -- focus + context: one node in full strength, its
// neighbours dimmed, drawn without a layout engine.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "./svg.ts";

const c = new Canvas();
const DIM = 0.35;

const focus = c.box(140, 60, 130, 46, { label: "focus pkg" });
const users = c.box(c.leftOf(focus, 40, 110), 60, 110, 46, {
  label: "users of it",
  size: 13,
  opacity: DIM,
});
const lib = c.box(focus.x, c.above(focus, 24, 40), 130, 40, {
  label: "a library",
  size: 13,
  opacity: DIM,
});
const tests = c.box(c.rightOf(focus, 40), 60, 110, 46, {
  label: "its tests",
  size: 13,
  opacity: DIM,
});
const app = c.box(focus.x, c.below(focus, 24), 130, 40, {
  label: "the app",
  size: 13,
  opacity: DIM,
});

// Edges join focus anchors to neighbour anchors; also dimmed.
c.arrow(c.anchor(focus, "w"), c.anchor(users, "e"), { opacity: DIM });
c.arrow(c.anchor(focus, "n"), c.anchor(lib, "s"), { opacity: DIM });
c.arrow(c.anchor(focus, "e"), c.anchor(tests, "w"), { opacity: DIM });
c.arrow(c.anchor(focus, "s"), c.anchor(app, "n"), { opacity: DIM });

assert.ok(users.y === tests.y, "side boxes share the row");
assert.ok(lib.x === app.x, "top and bottom boxes share the column");

await writeFile(
  new URL("./build/fig-focus.svg", import.meta.url),
  c.toString({ label: "one package in focus, related packages dimmed" }),
);
