// fig-ghost-hypotheses.ts -- two readings of "the report names a function
// the code does not have". The refine pass picked (A) without checking;
// history said (B). Bars: when the name existed in code (left colour) and
// in the report (right colour). Dashed frame = the unverified guess.
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas();
const CODE = c.color(0);
const GHOST = c.color(3);

const X0 = 100;
const W = 360;
const tw = X0 + W * 0.15; // report written
const tr = X0 + W * 0.85; // refine pass

function bar(x0: number, x1: number, y: number, color: string): void {
  c.raw(`<rect x="${x0}" y="${y - 6}" width="${x1 - x0}" height="12" rx="3" fill="${color}" opacity="0.45"/>`, [[x0, y - 6], [x1, y + 6]]);
}

function panel(y: number, title: string, sub: string, codeSpan: [number, number] | null, dashed: boolean): void {
  c.raw(
    `<rect x="0" y="${y}" width="${X0 + W + 20}" height="116" rx="10" fill="none" stroke="currentColor" stroke-width="1"${dashed ? ' stroke-dasharray="5 4"' : ""} opacity="0.6"/>`,
    [[0, y], [X0 + W + 20, y + 116]],
  );
  c.text(12, y + 20, title, { size: 12 });
  c.text(X0 + W + 8, y + 20, sub, { anchor: "end", size: 10, opacity: 0.7 });
  const cy = y + 50;
  const ry = y + 78;
  c.text(X0 - 10, cy, "コード", { anchor: "end", baseline: "central", size: 11 });
  c.text(X0 - 10, ry, "レポート", { anchor: "end", baseline: "central", size: 11 });
  c.line([X0, cy], [X0 + W, cy], { opacity: 0.25, width: 1 });
  c.line([X0, ry], [X0 + W, ry], { opacity: 0.25, width: 1 });
  if (codeSpan) bar(codeSpan[0], codeSpan[1], cy, CODE);
  bar(tw, X0 + W, ry, GHOST);
  for (const [tx, s] of [[tw, "書く"], [tr, "refine"]] as const) {
    c.line([tx, y + 34], [tx, y + 92], { opacity: 0.4, width: 1, dash: "2 3" });
    c.text(tx, y + 108, s, { anchor: "middle", size: 9, opacity: 0.7 });
  }
}

c.text(0, 0, "「レポートにあってコードに無い」の 2 つの読み方", { size: 15 });
c.text(0, 18, "模式図。時間は左から右、帯はその名前が存在した期間", { size: 11, opacity: 0.65 });
panel(34, "A: 書いた後でコードから消えた", "refine で選んだ説明 (未確認)", [X0, X0 + W * 0.5], true);
panel(166, "B: コードには一度も無かった", "git log -S で確認した事実", null, false);
c.text(0, 306, "生成: fig-ghost-hypotheses.ts", { size: 10, opacity: 0.55 });

await writeFile(
  new URL("../build/fig-ghost-hypotheses.svg", import.meta.url),
  c.toString({
    label: "レポートにだけある名前の 2 つの説明。A は書いた後でコードから消えた、B はコードに一度も無かった。確認すると B だった",
  }),
);
