// fig-repl-completion-pipe.ts -- what one TAB press walks through in
// minigo's REPL completer. The green (static) tier resolves the selector
// base from AST alone; the vermillion (eval) tier may run user code.
// Dashed = gates that can end the pipeline with no candidates.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas();
const H = 56;
const GAP = 34;

const input = c.box(0, 0, "auto", H, { label: ["`strings.To`", "line + cursor"], size: 13 });
const ctx = c.box(c.rightOf(input, GAP), 0, "auto", H, { label: ["completeContext", "scanner offsets"], size: 13, color: c.color(0) });
const base = c.box(c.rightOf(ctx, GAP), 0, "auto", H, { label: ["resolveBase", "what is left of `.`"], size: 13 });

// suppression exit above the context box
const suppress = c.box(ctx.x, c.above(ctx, 30, 36), "auto", 36, {
  label: "no candidates",
  size: 12,
  dash: "5 3",
  opacity: 0.85,
});

// two resolution tiers stacked on the right
const statik = c.box(c.rightOf(base, GAP), -34, "auto", H, { label: ["resolveExpr", "AST walk only"], size: 13, color: c.color(2) });
const evaled = c.box(c.rightOf(base, GAP), c.below(statik, 22), "auto", H, { label: ["evalBase (opt-in)", "EvalExpr + memo"], size: 13, color: c.color(3) });

const members = c.box(c.rightOf(statik, GAP), -14, "auto", H, { label: ["members / keys", "dedupe + Ambiguous"], size: 13 });
const splice = c.box(c.rightOf(members, GAP), -14, "auto", H, { label: ["splice prefix", "or list"], size: 13 });

c.arrow(c.anchor(input, "e"), c.anchor(ctx, "w"));
c.arrow(c.anchor(ctx, "e"), c.anchor(base, "w"));
c.arrow(c.anchor(base, "e"), c.anchor(statik, "w"), { color: c.color(2) });
c.arrow(c.anchor(base, "e"), c.anchor(evaled, "w"), { color: c.color(3), dash: "5 3" });
c.arrow(c.anchor(statik, "e"), c.anchor(members, "n"), { via: [[c.anchor(statik, "e")[0] + 20, c.anchor(members, "n")[1]]], color: c.color(2) });
c.arrow(c.anchor(evaled, "e"), c.anchor(members, "s"), { via: [[c.anchor(evaled, "e")[0] + 20, c.anchor(members, "s")[1]]], color: c.color(3), dash: "5 3" });
c.arrow(c.anchor(members, "e"), c.anchor(splice, "w"));

// dashed gate: context may veto the whole walk (index slot, string tail
c.arrow(c.anchor(ctx, "n"), c.anchor(suppress, "s"), { dash: "5 3", color: c.color(1) });

assert.ok(statik.y + statik.h < evaled.y, "tiers must not overlap");
assert.ok(suppress.y + suppress.h < ctx.y, "suppress exit sits above the pipeline");

await writeFile(new URL("../build/fig-repl-completion-pipe.svg", import.meta.url), c.toString({ label: "TAB completion pipeline: context scan, two base-resolution tiers, member enumeration, splice" }));
