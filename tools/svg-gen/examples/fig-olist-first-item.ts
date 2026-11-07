// fig-olist-first-item.ts -- In a list run that mixes "- " and "N. "
// items, the FIRST item's marker picks the wrapper tag: a run led by
// "N. " becomes <ol> (with start= when the number is not 1), a run led
// by "- " becomes <ul>; later markers only tag their own <li>.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas();
const OL = c.color(0);
const UL = c.color(1);
const LH = 22;

const runs = [
  { y: 70, lines: ["3. c", "4. d"], tag: '<ol start="3">', col: OL },
  { y: 150, lines: ["1. x", "- y", "- z"], tag: "<ol>", col: OL },
  { y: 250, lines: ["- x", "1. y", "- z"], tag: "<ul>", col: UL },
];

// Legend: marker dot colour = marker kind, decided tag stroke = first item.
c.raw(`<circle cx="16" cy="24" r="4.5" fill="${OL}"/>`, [[16, 24]]);
c.text(28, 28, '"N. " (num > 0)', { size: 12 });
c.raw(`<circle cx="170" cy="24" r="4.5" fill="${UL}"/>`, [[170, 24]]);
c.text(182, 28, '"- " / "* " (num = 0)', { size: 12 });

for (const run of runs) {
  run.lines.forEach((src, i) => {
    const y = run.y + i * LH;
    const m = /^(\d+)\./.exec(src);
    const ordered = m != null;
    c.raw(`<circle cx="16" cy="${y - 4}" r="4.5" fill="${ordered ? OL : UL}"/>`, [[16, y - 4]]);
    c.text(30, y, src, { size: 14 });
    c.text(110, y, `num=${ordered ? Number.parseInt(m![1]) : 0}`, { size: 12, opacity: 0.7 });
    if (i === 0) assert.equal(ordered, run.col === OL); // first item decides the tag
  });
  const tag = c.box(260, run.y - 16, "auto", 34, { label: run.tag, color: run.col, width: 2 });
  c.arrow([152, run.y - 4], c.anchor(tag, "w"), { color: run.col, width: 2, gapStart: 4, gapEnd: 6 });
}

await writeFile(
  new URL("../build/fig-olist-first-item.svg", import.meta.url),
  c.toString({ label: "a list run's first item marker picks <ol> or <ul>; later markers only tag their own li" }),
);
