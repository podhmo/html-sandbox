// fig-gom-scope-lifetime.ts -- how long a resource opened inside an
// `if` lives under three cleanup designs. Horizontal position is
// program order; each bar is the interval during which `f` is open.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas();
const X0 = 170;
// Program points, left to right.
const pts = [
  { x: X0, label: ["関数の", "はじめ"] },
  { x: X0 + 120, label: ["if c {", "f を開く"] },
  { x: X0 + 250, label: ["if を", "抜ける"] },
  { x: X0 + 380, label: ["f を", "使う"] },
  { x: X0 + 510, label: ["Scope の", "終わり"] },
  { x: X0 + 640, label: ["関数の", "終わり"] },
];
const [start, open, ifEnd, use, scopeEnd, fnEnd] = pts.map((p) => p.x);
assert.ok(open < ifEnd && ifEnd < use && use < scopeEnd && scopeEnd < fnEnd);

c.text(0, 0, "if の中で開いた f はいつ閉じられるか", { size: 15 });
c.text(0, 20, "横軸はプログラムの実行順。帯は f が開いている区間（模式図）", { size: 11, opacity: 0.65 });

const axisY = 60;
for (const p of pts) {
  c.line([p.x, axisY], [p.x, axisY + 250], { dash: "2 4", opacity: 0.35 });
  c.text(p.x, axisY - 14, p.label[0], { anchor: "middle", size: 11 });
  c.text(p.x, axisY + 0, p.label[1], { anchor: "middle", size: 11 });
}

const rows = [
  { name: ["(B) ブロック末尾", "で走る defer"], from: open, to: ifEnd, i: 3, dash: "5 3" },
  { name: ["(C) Go の defer", "（関数スコープ）"], from: open, to: fnEnd, i: 0, dash: "" },
  { name: ["(E) Scope.run", "（明示的な境界）"], from: open, to: scopeEnd, i: 2, dash: "" },
];
const H = 18;
rows.forEach((r, k) => {
  const y = axisY + 40 + k * 70;
  c.text(150, y - 6, r.name[0], { anchor: "end", size: 12 });
  c.text(150, y + 10, r.name[1], { anchor: "end", size: 11, opacity: 0.75 });
  const col = c.color(r.i);
  const dash = r.dash ? ` stroke-dasharray="${r.dash}"` : "";
  c.raw(
    `<rect x="${r.from}" y="${y - H / 2}" width="${r.to - r.from}" height="${H}" rx="4" fill="${col}" fill-opacity="0.45" stroke="${col}" stroke-width="1.5"${dash}/>`,
    [[r.from, y - H / 2], [r.to, y + H / 2]],
  );
  if (r.to < use) {
    c.text(use, y + 1, "閉じた後に使う", { anchor: "middle", baseline: "central", size: 11 });
    c.line([use - 46, y + 12], [use + 46, y + 12], { color: col, width: 2 });
  }
});

// The explicit scope bracket for (E): the body of Scope.run.
const ey = axisY + 40 + 2 * 70 + 26;
c.line([start + 40, ey], [scopeEnd, ey], { width: 1.5 });
c.line([start + 40, ey - 5], [start + 40, ey + 5], { width: 1.5 });
c.line([scopeEnd, ey - 5], [scopeEnd, ey + 5], { width: 1.5 });
c.text((start + 40 + scopeEnd) / 2, ey + 16, "Scope.run <| fn s -> { ... } の本体", { anchor: "middle", size: 11, opacity: 0.8 });

await writeFile(
  new URL("../build/fig-gom-scope-lifetime.svg", import.meta.url),
  c.toString({
    label:
      "three bars over program order: a block-scoped defer closes f when the if ends, before it is used; Go's function-scoped defer keeps it until the function ends; Scope.run keeps it until the explicit scope body ends",
  }),
);
