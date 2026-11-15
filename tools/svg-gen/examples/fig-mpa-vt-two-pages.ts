// fig-mpa-vt-two-pages.ts -- Classification for directional transitions
// must run on BOTH sides of the navigation. On the outgoing page,
// pageswap's event.activation has from/entry URLs; on the new page,
// pagereveal must re-derive them from navigation.activation — types
// added during pageswap do not propagate to the new page's vt.types.
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas();

// ---- old page ----
const old_ = c.box(10, 30, 300, 120, { rx: 10 });
c.text(20, 46, "old page (/issues)", { size: 12, opacity: 0.75 });
const swap = c.box(30, 60, 260, 60, { color: c.color(0) });
c.text(40, 80, "pageswap listener", { size: 12 });
c.text(40, 98, "event.activation.from / entry.url", { size: 10, opacity: 0.8 });
c.text(40, 112, "vt.types.add(\"forward\")", { size: 10, opacity: 0.8 });
old_; swap;

// ---- new page ----
const newp = c.box(390, 30, 330, 120, { rx: 10 });
c.text(400, 46, "new page (/issues/3)", { size: 12, opacity: 0.75 });
const reveal = c.box(410, 60, 290, 60, { color: c.color(1) });
c.text(420, 80, "pagereveal listener", { size: 12 });
c.text(420, 98, "navigation.activation.from / entry.url", { size: 10, opacity: 0.8 });
c.text(420, 112, "vt.types.add(\"forward\")  again", { size: 10, opacity: 0.8 });
newp; reveal;

// the transition carries the snapshot across; the types do not
c.arrow(c.anchor(swap, "e"), c.anchor(reveal, "w"), { heads: "both", color: c.color(2) });
c.text(320, 58, "same ViewTransition", { size: 10, anchor: "middle" });
c.text(320, 72, "object", { size: 10, anchor: "middle" });
c.text(320, 104, "types は引き継がれない", { size: 10, anchor: "middle", color: c.color(3) });
c.text(320, 118, "(Chrome 156 実測)", { size: 9, anchor: "middle", opacity: 0.7 });

// result line
const css = c.box(230, 190, 280, 40, { rx: 8, color: c.color(4) });
c.text(370, 206, "CSS matches:", { size: 11, anchor: "middle" });
c.text(370, 222, ":active-view-transition-type(forward)", { size: 11, anchor: "middle" });
c.arrow(c.anchor(swap, "s"), c.anchor(css, "w"), { dash: "4 3", opacity: 0.8 });
c.arrow(c.anchor(reveal, "s"), c.anchor(css, "e"), { dash: "4 3", opacity: 0.8 });

await writeFile(
  new URL("../build/fig-mpa-vt-two-pages.svg", import.meta.url),
  c.toString({ label: "旧ページの pageswap と新ページの pagereveal の両方で type を付けないと :active-view-transition-type が効かない図" }),
);
console.log("wrote fig-mpa-vt-two-pages.svg");
