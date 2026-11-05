// fig-skill-share.ts -- where write-slops spends its lines. Each row is a
// section of .claude/skills/write-slops/SKILL.md in file order; the bar
// length is its non-blank line count (measured 2026-11-05), hue/dash is
// what the section constrains. The last row is empty on purpose: no line
// names the narrator, the standpoint, or the voice.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas({ margin: 12 });

// [section, non-blank lines, category index]
const rows: [string, number, number][] = [
  ["冒頭（内容の扱い）", 8, 0],
  ["Markdown for this site", 18, 1],
  ["Try SVG illustrations", 15, 2],
  ["Generate figures with svg-gen", 27, 2],
  ["SVG is an image only with…", 25, 2],
  ["One file or one flat bundle", 22, 3],
  ["Check the intended output", 13, 4],
];
const cats: [string, string][] = [
  ["内容の誠実さ", ""],
  ["記法", "6 3"],
  ["図", ""],
  ["置き方", "2 3"],
  ["確認と報告", "8 3 2 3"],
];

const X = 210;
const UNIT = 9;
const BAR_H = 18;
const GAP = 8;
const Y0 = 40;

c.text(10, 14, "write-slops の SKILL.md、節ごとの行数（空行を除く）", { size: 13 });

rows.forEach(([name, n, k], i) => {
  const y = Y0 + i * (BAR_H + GAP);
  c.text(X - 8, y + BAR_H / 2, name, { anchor: "end", baseline: "central", size: 11 });
  c.box(X, y, n * UNIT, BAR_H, { rx: 2, color: c.color(k), dash: cats[k][1] || undefined, width: 2 });
  c.text(X + n * UNIT + 6, y + BAR_H / 2, `${n} 行`, { baseline: "central", size: 11, opacity: 0.75 });
});

// the empty row: nothing in the skill speaks about who writes or how
const yEmpty = Y0 + rows.length * (BAR_H + GAP) + 6;
c.text(X - 8, yEmpty + BAR_H / 2, "語り手・立場・文体", { anchor: "end", baseline: "central", size: 11 });
c.line([X, yEmpty], [X, yEmpty + BAR_H], { width: 2, opacity: 0.6 });
c.text(X + 8, yEmpty + BAR_H / 2, "0 行", { baseline: "central", size: 11, opacity: 0.75 });

// the three figure sections together
const fig0 = Y0 + 2 * (BAR_H + GAP);
const fig1 = Y0 + 4 * (BAR_H + GAP) + BAR_H;
const bx = X + 27 * UNIT + 50;
c.line([bx - 6, fig0], [bx, fig0], { opacity: 0.6, via: [[bx, fig0], [bx, fig1]] });
c.line([bx, fig1], [bx - 6, fig1], { opacity: 0.6 });
c.text(bx + 6, (fig0 + fig1) / 2 - 7, "図の 3 節で 67 行", { baseline: "central", size: 11 });
c.text(bx + 6, (fig0 + fig1) / 2 + 9, "（全 128 行の半分強）", { baseline: "central", size: 11, opacity: 0.7 });

// legend: hue and dash both carry the category
const ly = yEmpty + BAR_H + 26;
let lx = 10;
cats.forEach(([name, dash], k) => {
  c.line([lx, ly], [lx + 26, ly], { color: c.color(k), dash: dash || undefined, width: 2 });
  c.text(lx + 32, ly, name, { baseline: "central", size: 11 });
  lx += 32 + name.length * 11 + 22;
});

const total = rows.reduce((s, r) => s + r[1], 0);
assert.equal(total, 128, "section lines add up to the measured total");
assert.equal(rows.filter((r) => r[2] === 2).reduce((s, r) => s + r[1], 0), 67, "figure sections");

await writeFile(
  new URL("../build/fig-skill-share.svg", import.meta.url),
  c.toString({
    label:
      "bar per SKILL.md section by line count: figure sections take 67 of 128 lines, content honesty 8, and no line covers narrator, standpoint or voice",
  }),
);
