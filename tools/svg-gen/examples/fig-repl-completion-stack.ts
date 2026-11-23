// fig-repl-completion-stack.ts -- Stack #1409's nine layers, drawn in
// merge order: each PR diffs only against the one beneath it, and the
// whole series lands bottom-up.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas();
const W = 345;
const LH = 30;

const layers: [string, string][] = [
  ["#1407", "EvalBase tier (eval the selector base)"],
  ["#1408", "map string-key candidates"],
  ["#1410", "untyped `var x = f()` inference"],
  ["#1411", "Ambiguous flag on promoted members"],
  ["#1412", "Detail spelled by the real home"],
  ["#1413", "no members inside an index slot"],
  ["#1414", "Detail for fn* builtins (~160)"],
  ["#1416", "`!` marker in listings"],
  ["#1417", "eval memoization"],
];

const X = 70;
const TOP = 10;
// top of the stack is the last PR; main sits below the bottom layer.
layers.forEach(([pr, label], i) => {
  const y = TOP + (layers.length - 1 - i) * LH;
  c.box(X, y, W, LH, { rx: 4, color: c.color(i % 6) });
  c.text(X + 10, y + LH / 2, pr, { size: 12, baseline: "central" });
  c.text(X + 62, y + LH / 2, label, { size: 12, baseline: "central" });
});
const stackBottom = TOP + layers.length * LH;
const main = c.box(X, stackBottom + 8, W, 24, { rx: 4, dash: "4 3", opacity: 0.7 });
c.text(X + 10, stackBottom + 8 + 12, "main", { size: 12, baseline: "central", opacity: 0.7 });

// merge-direction arrow on the left, pointing up = bottom merges first
c.arrow([40, stackBottom], [40, TOP + 2], { color: c.color(0), width: 2 });
c.text(40, stackBottom + 8 + 36, "lands bottom-up", { anchor: "middle", size: 12, opacity: 0.8 });

assert.ok(main.y > stackBottom, "main sits below the lowest layer");

await writeFile(new URL("../build/fig-repl-completion-stack.svg", import.meta.url), c.toString({ label: "nine stacked pull requests layered on main, merging bottom-up" }));
