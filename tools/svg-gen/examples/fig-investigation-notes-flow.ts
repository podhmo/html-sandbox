// fig-investigation-notes-flow.ts -- four sections of investigation notes
// and the anti-patterns excluded from each section.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas({ margin: 16 });
const DIM = 0.55;

// Main workflow boxes (horizontal chain)
const Y_MAIN = 95;
const H_MAIN = 54;
const W_MAIN = 148;

const b1 = c.box(20, Y_MAIN, W_MAIN, H_MAIN, {
  label: ["1. 前提と制約", "依頼要約と初期条件"],
  size: 11,
});

const b2 = c.box(c.rightOf(b1, 32), Y_MAIN, W_MAIN, H_MAIN, {
  label: ["2. 試行と判断", "因果の散文と捨てた理由"],
  size: 11,
});

const b3 = c.box(c.rightOf(b2, 32), Y_MAIN, W_MAIN, H_MAIN, {
  label: ["3. 問いへの結論", "検証結果と実測値"],
  size: 11,
});

const b4 = c.box(c.rightOf(b3, 32), Y_MAIN, W_MAIN, H_MAIN, {
  label: ["4. 余談・展望", "深追いしなかった案"],
  size: 11,
});

// Horizontal connecting arrows
c.arrow(c.anchor(b1, "e"), c.anchor(b2, "w"));
c.arrow(c.anchor(b2, "e"), c.anchor(b3, "w"));
c.arrow(c.anchor(b3, "e"), c.anchor(b4, "w"));

// Upper row: Excluded anti-patterns (dimmed, dashed)
const Y_TOP = 20;
const H_TOP = 38;

const tDebate = c.box(b1.x, Y_TOP, W_MAIN, H_TOP, {
  label: "除外: 一般論の主張",
  size: 11,
  opacity: DIM,
  dash: "3 3",
});

const tLog = c.box(b2.x, Y_TOP, W_MAIN, H_TOP, {
  label: "除外: 作業ログ・年表",
  size: 11,
  opacity: DIM,
  dash: "3 3",
});

const tReflect = c.box(b3.x, Y_TOP, W_MAIN, H_TOP, {
  label: "除外: 自己反省・後悔",
  size: 11,
  opacity: DIM,
  dash: "3 3",
});

// Dashed indicators between top and main
c.line(c.anchor(tDebate, "s"), c.anchor(b1, "n"), { opacity: DIM, dash: "2 2" });
c.line(c.anchor(tLog, "s"), c.anchor(b2, "n"), { opacity: DIM, dash: "2 2" });
c.line(c.anchor(tReflect, "s"), c.anchor(b3, "n"), { opacity: DIM, dash: "2 2" });

// Lower row: Recorded conditional choices under b2
const Y_BOT = 190;
const H_BOT = 48;
const W_BOT = 170;

const bDiscarded = c.box(b2.x - 11, Y_BOT, W_BOT, H_BOT, {
  label: ["捨てた代替案の記録", "権限・ドライバ等の環境理由"],
  size: 10,
  dash: "4 3",
});

c.arrow(c.anchor(b2, "s"), c.anchor(bDiscarded, "n"), { dash: "3 2" });

// Assert layout sanity
assert.equal(b1.y, b2.y, "main boxes align on y");
assert.equal(b2.y, b3.y, "main boxes align on y");
assert.equal(b3.y, b4.y, "main boxes align on y");

await writeFile(
  new URL("../build/fig-investigation-notes-flow.svg", import.meta.url),
  c.toString({ label: "four sections of investigation notes and excluded anti-patterns" }),
);
