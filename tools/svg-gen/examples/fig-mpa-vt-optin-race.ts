// fig-mpa-vt-optin-race.ts -- Why @view-transition at the end of a big
// external stylesheet silently disabled every cross-document transition.
// Chrome checks the opt-in at pagereveal without waiting for the rest of
// app.css; an opt-in that arrives late is simply never seen. Two lanes:
// before (opt-in inside external app.css, arrives late -> skipped) and
// after (opt-in in an inline <style> in <head>, present early -> runs).
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas();

const LANES: { y: number; label: string; mode: "late" | "early" }[] = [
  { y: 40, label: "before: opt-in は app.css の末尾", mode: "late" },
  { y: 190, label: "after: opt-in は <head> の inline <style>", mode: "early" },
];

for (const { y, label, mode } of LANES) {
  c.text(10, y - 12, label, { size: 12 });

  // HTML document shell
  const doc = c.box(10, y, 470, 90, { rx: 10 });
  c.text(20, y + 14, "new page", { size: 11, opacity: 0.7 });

  if (mode === "late") {
    // external stylesheet streaming — opt-in sits at its tail
    const css = c.box(30, y + 24, 320, 40, { dash: "5 4" });
    c.text(38, y + 40, "app.css loading", { size: 11, opacity: 0.8 });
    c.text(38, y + 55, "@view-transition = last bytes", { size: 10, opacity: 0.6 });
    const optin = c.box(355, y + 24, 90, 40, { color: c.color(3) });
    c.text(360, y + 40, "opt-in", { size: 11 });
    c.text(360, y + 55, "arrives late", { size: 10, opacity: 0.7 });
    css; optin;

    // pagereveal fires before the tail arrives
    const reveal = c.circle(180, y + 78, 5, { color: c.color(3), width: 2 });
    c.text(180, y + 78 + 16, "pagereveal", { size: 10, anchor: "middle" });
    c.arrow(c.anchor(optin, "w"), c.anchor(reveal, "n"), { color: c.color(3), dash: "4 3" });
    c.text(495, y + 40, "miss", { size: 12, color: c.color(3) });
    c.text(495, y + 56, "→ fadeなし", { size: 10, opacity: 0.7 });
  } else {
    // inline style in <head> — opt-in present from the first bytes
    const style = c.box(30, y + 24, 120, 40, { color: c.color(0) });
    c.text(38, y + 40, "inline <style>", { size: 11 });
    c.text(38, y + 55, "opt-in", { size: 10, opacity: 0.7 });
    const css = c.box(170, y + 24, 275, 40, { dash: "5 4" });
    c.text(178, y + 40, "app.css loading", { size: 11, opacity: 0.8 });
    c.text(178, y + 55, "capture styles / keyframes", { size: 10, opacity: 0.6 });
    style; css;

    const reveal = c.circle(180, y + 78, 5, { color: c.color(0), width: 2 });
    c.text(180, y + 78 + 16, "pagereveal", { size: 10, anchor: "middle" });
    c.text(495, y + 40, "hit", { size: 12, color: c.color(0) });
    c.text(495, y + 56, "→ VT 発火", { size: 10, opacity: 0.7 });
  }
  doc;
}

await writeFile(
  new URL("../build/fig-mpa-vt-optin-race.svg", import.meta.url),
  c.toString({ label: "external CSS 末尾の opt-in は pagereveal 検査に間に合わず遷移が無効、inline <style> なら間に合う比較図" }),
);
console.log("wrote fig-mpa-vt-optin-race.svg");
