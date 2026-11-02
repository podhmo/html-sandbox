// fig-unslop-flow.ts -- the unslop pipeline and where the five DADS
// reports exit it. The skill runs audit -> direction -> nine fix
// passes, but its "no slop" branch stops before editing. The reports,
// built on a design system, exit there: the craft gate passes, the
// remaining question is direction (template look), which sits outside
// the fix passes.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas({ margin: 12 });

// main pipeline, left to right
const audit = c.box(30, 80, "auto", 40, { label: "監査\nsigns.md", color: c.color(0) });
const verdict = c.box(190, 80, "auto", 40, { label: "slopの\n量を判定", color: c.color(1) });
const direction = c.box(350, 80, "auto", 40, { label: "Direction\n(5行)", color: c.color(2) });
const passes = c.box(520, 80, "auto", 40, { label: "9パス修正", color: c.color(3) });

c.arrow(c.anchor(audit, "e"), c.anchor(verdict, "w"));
c.arrow(c.anchor(verdict, "e"), c.anchor(direction, "w"));
c.arrow(c.anchor(direction, "e"), c.anchor(passes, "w"));

// the no-slop exit: down and out before the passes
const exit = c.box(190, 180, "auto", 40, { label: "no slop\n→ polishのみ", color: c.color(4) });
c.arrow(c.anchor(verdict, "s"), c.anchor(exit, "n"), { dash: "4 4" });
c.text(240, 155, "DADSレポート5種はここ", { anchor: "start", size: 12 });

// what still lives past the exit: direction-level gap
c.text(30, 250, "抜けているもの: 型ごとの「世界」(個人メモに行政デザイン)・テンプレート同一感 — craft ではなく direction の領分", { anchor: "start", size: 12, opacity: 0.8 });

assert.ok(true);
await writeFile(
  new URL("../build/fig-unslop-flow.svg", import.meta.url),
  c.toString({ label: "unslop pipeline with the no-slop exit where the DADS reports land" }),
);
