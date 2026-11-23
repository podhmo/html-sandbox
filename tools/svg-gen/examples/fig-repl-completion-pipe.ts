// fig-repl-completion-pipe.ts -- what one TAB press walks through in
// minigo's REPL completer. The green (static) tier resolves the selector
// base from AST alone; the vermillion (eval) tier may run user code.
// Dashed = gates that can end the pipeline with no candidates.
// Vertical layout so the figure stays readable on narrow (mobile) screens.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas();
const H = 56;
const GAP = 26;
const COLX = 170;

const input = c.box(COLX, 0, "auto", H, { label: ["`strings.To`", "line + cursor"], size: 13 });
const ctx = c.box(COLX, c.below(input, GAP), "auto", H, { label: ["completeContext", "scanner offsets"], size: 13, color: c.color(0) });
const base = c.box(COLX, c.below(ctx, GAP), "auto", H, { label: ["resolveBase", "what is left of `.`"], size: 13 });

// suppression exit on the left of the context box
const suppress = c.box(c.leftOf(ctx, 20, 140), ctx.y + 10, 140, 36, {
  label: "no candidates",
  size: 12,
  dash: "5 3",
  opacity: 0.85,
});

// two resolution tiers side by side below the base
const tierY = c.below(base, GAP);
const statik = c.box(0, tierY, "auto", H, { label: ["resolveExpr", "AST walk only"], size: 13, color: c.color(2) });
const evaled = c.box(c.rightOf(statik, 60), tierY, "auto", H, { label: ["evalBase (opt-in)", "EvalExpr + memo"], size: 13, color: c.color(3) });

const members = c.box(COLX, c.below(statik, GAP), "auto", H, { label: ["members / keys", "dedupe + Ambiguous"], size: 13 });
const splice = c.box(COLX, c.below(members, GAP), "auto", H, { label: ["splice prefix", "or list"], size: 13 });

c.arrow(c.anchor(input, "s"), c.anchor(ctx, "n"));
c.arrow(c.anchor(ctx, "s"), c.anchor(base, "n"));
c.arrow(c.anchor(base, "s"), c.anchor(statik, "n"), { color: c.color(2) });
c.arrow(c.anchor(base, "s"), c.anchor(evaled, "n"), { color: c.color(3), dash: "5 3" });
c.arrow(c.anchor(statik, "s"), c.anchor(members, "n"), { color: c.color(2) });
c.arrow(c.anchor(evaled, "s"), c.anchor(members, "n"), { color: c.color(3), dash: "5 3" });
c.arrow(c.anchor(members, "s"), c.anchor(splice, "n"));

// dashed gate: context may veto the whole walk (index slot, string tail)
c.arrow(c.anchor(ctx, "w"), c.anchor(suppress, "e"), { dash: "5 3", color: c.color(1) });

assert.ok(statik.y + statik.h < members.y, "tiers must not overlap members");
assert.ok(statik.x + statik.w < evaled.x, "tiers must not overlap each other");
assert.ok(suppress.x + suppress.w < ctx.x, "suppress exit sits left of the pipeline");

await writeFile(new URL("../build/fig-repl-completion-pipe.svg", import.meta.url), c.toString({ label: "TAB completion pipeline: context scan, two base-resolution tiers, member enumeration, splice" }));
