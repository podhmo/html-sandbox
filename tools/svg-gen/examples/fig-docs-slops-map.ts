// fig-docs-slops-map.ts -- where each directory's text sits on two
// questions: is it rewritten to stay current, or kept as of its date
// (x)? is its reader someone who will act on it next, or someone who
// wants to know what happened (y)? Positions are qualitative. Thin
// dashed lines join real sketch/slops pairs written from the same work;
// the hollow dot is the rule-writing section of a slops article that
// sits in sketch territory.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas({ margin: 12 });

const X0 = 60;
const X1 = 560;
const Y0 = 330;
const Y1 = 30;

c.line([X0, Y0], [X1, Y0], { width: 1.5 });
c.line([X0, Y0], [X0, Y1], { width: 1.5 });
c.arrow([X1 - 1, Y0], [X1, Y0], { width: 1.5 });
c.arrow([X0, Y1 + 1], [X0, Y1], { width: 1.5 });
c.text(X0, Y0 + 20, "書き直して最新に保つ", { size: 11, opacity: 0.75 });
c.text(X1, Y0 + 20, "日付の時点のまま残す", { anchor: "end", size: 11, opacity: 0.75 });
c.text(X0 + 8, Y1 + 4, "読み手: 何が起きたかを知りたい人", { size: 11, opacity: 0.75 });
c.text(X0 + 8, Y0 - 10, "読み手: 次に手を動かす人やエージェント", { size: 11, opacity: 0.75 });

// directory regions: [x, y, w, h, label, palette index, dash]
const regions: [number, number, number, number, string, number, string?][] = [
  [70, 264, 180, 42, "docs/（英語・設計と開発手順）", 0],
  [180, 138, 190, 120, "docs/sketch/ja/（調査メモ）", 2, "6 4"],
  [385, 72, 195, 120, "slops/（AI が書いた記事）", 3],
  [470, 34, 110, 30, "posts/（人間）", 4, "2 3"],
];
const shapes = regions.map(([x, y, w, h, label, k, dash]) => {
  const s = c.box(x, y, w, h, { color: c.color(k), dash, rx: 10 });
  c.text(x + 8, y + 15, label, { size: 11 });
  return s;
});

// real pairs written from the same work: [sketch, slops] names
const pairs: [string, string][] = [
  ["tts-wsl2", "answers-under-constraints"],
  ["dads-illustration-lora", "dads-illustration-lora"],
  ["html-report-skill", "html-report-variations"],
  ["figure-guidelines", "chart-gen"],
];
const pts = pairs.map(([sk, sl], i): [[number, number], [number, number]] => {
  const a: [number, number] = [345, 190 + i * 19];
  const b: [number, number] = [405, 104 + i * 22];
  c.line(a, b, { dash: "3 3", opacity: 0.55, width: 1, gap: 5 });
  c.circle(a[0], a[1], 4, { color: c.color(2), width: 2.5 });
  c.circle(b[0], b[1], 4, { color: c.color(3), width: 2.5 });
  c.text(a[0] - 9, a[1], sk, { anchor: "end", baseline: "central", size: 10, opacity: 0.85 });
  c.text(b[0] + 9, b[1], sl, { baseline: "central", size: 10, opacity: 0.85 });
  return [a, b];
});

// the prescriptive section of answers-under-constraints sits in sketch land
const rule: [number, number] = [345, 167];
c.circle(rule[0], rule[1], 6, { dash: "2 2", width: 1.5 });
c.line(pts[0][1], rule, { dash: "1 3", width: 1.5, gap: 8 });
c.text(rule[0] - 11, rule[1], "「記録の側でできること」の節", { anchor: "end", baseline: "central", size: 10 });

assert.ok(
  pts.every(([a, b]) => b[0] > a[0] && b[1] < a[1]),
  "every slops half sits right of and above its sketch half",
);
const [, sketch, slops] = shapes;
assert.ok(
  rule[0] > sketch.x && rule[0] < sketch.x + sketch.w && rule[1] > sketch.y && rule[0] < slops.x,
  "the rule section sits inside the sketch region, outside slops",
);

await writeFile(
  new URL("../build/fig-docs-slops-map.svg", import.meta.url),
  c.toString({
    label:
      "docs, docs/sketch, slops and posts on two axes (rewritten vs kept as dated; reader acts next vs wants to know what happened), with four real sketch-to-slops pairs and one slops section that sits in sketch territory",
  }),
);
