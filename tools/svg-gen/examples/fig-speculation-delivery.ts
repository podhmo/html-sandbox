// fig-speculation-delivery.ts -- Two ways to deliver speculation rules,
// and what CSP `script-src 'none'` does to each. Top: an inline
// <script type="speculationrules"> is still a script element, so CSP
// blocks it. Bottom: the Speculation-Rules response header points at an
// external JSON ruleset — no <script> element exists, so the two coexist.
import { writeFile } from "node:fs/promises";
import { Canvas, type Shape } from "../svg.ts";

const c = new Canvas();

const chip = (x: number, y: number, w: number | "auto", label: string, col?: number): Shape =>
  c.box(x, y, w, 34, { label, color: col != null ? c.color(col) : undefined, size: 12, padX: 10 });

// ---- top row: inline script, blocked ----
c.text(10, 20, "inline <script>", { size: 13 });

const doc = c.box(20, 40, 200, 80, { rx: 10 });
c.text(30, 58, "document", { size: 11, opacity: 0.7 });
const inline = chip(35, 70, "auto", "<script type=speculationrules>", 3);
doc; inline;

const wall = c.box(280, 40, 14, 80, { color: c.color(3), width: 2.5 });
c.text(254, 140, "CSP", { size: 12 });
c.text(254, 156, "script-src 'none'", { size: 11, opacity: 0.8 });

const blocked = chip(360, 63, "auto", "✕ blocked (Chromium 156)", 3);
c.arrow(c.anchor(inline, "e"), c.anchor(wall, "w"), { color: c.color(3) });
c.line(c.anchor(wall, "e"), c.anchor(blocked, "w"), { dash: "5 4", color: c.color(3), opacity: 0.7 });

// ---- bottom row: header + external ruleset, allowed ----
c.text(10, 220, "Speculation-Rules header", { size: 13 });

const resp = c.box(20, 240, 240, 80, { rx: 10 });
c.text(30, 258, "HTTP response", { size: 11, opacity: 0.7 });
const hdr = chip(35, 270, "auto", 'Speculation-Rules: "/static/….json"', 0);
resp; hdr;

const ruleset = chip(360, 263, "auto", "application/speculationrules+json", 0);
c.arrow(c.anchor(hdr, "e"), c.anchor(ruleset, "w"), { color: c.color(0) });
c.text(360, 330, "no <script> element → CSP と共存", { size: 11, opacity: 0.7 });

await writeFile(new URL("../build/fig-speculation-delivery.svg", import.meta.url), c.toString({ label: "inline speculationrules は CSP にブロックされるが Speculation-Rules ヘッダ配信なら共存できる図" }));
console.log("wrote fig-speculation-delivery.svg");
