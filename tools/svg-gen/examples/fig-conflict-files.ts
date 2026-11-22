// fig-conflict-files.ts -- which files conflicted in the auto-fix
// rebase loop. The point: 81 of 114 conflicts were the line-budget
// file, not code.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";
import { Plot } from "../chart.ts";

const c = new Canvas();

// conflicted-path counts from the fix loop log, grouped:
//  - internal/archcheck/budgets.go: the file-line-count ratchet
//  - docs/next/ja/TODO.md, TODO.md, open-questions.md, follow-up.md: task/checklist merges
//  - everything else: real code/tests (engine_bench_test.go, typehint.go, ...)
const groups: [string, number][] = [
  ["budgets.go", 81],
  ["TODO / docs系", 21],
  ["コード・テスト", 12],
];
const bs = groups.map(([, n], i) => ({ x0: i + 0.12, x1: i + 0.88, n }));

const p = new Plot(
  c,
  {
    title: "コンフリクトしたファイルの内訳 — ほぼ記録用ファイル",
    subtitle: "自動rebase-fixループのログに現れたコンフリクト154件のうち114ファイル分",
    footnote:
      "出典: fixループのログ (実測) / n = 114 ファイル / 生成: tools/svg-gen/examples/fig-conflict-files.ts",
  },
  {
    w: 400,
    h: 170,
    xdom: [-0.35, 3.1],
    ydom: [0, 90],
    xtitle: "コンフリクトしたファイル",
    ytitle: "件数",
    grid: true,
  },
);
p.frame({
  xticks: groups.map(([label], i) => [i + 0.5, label]),
});
p.data(() => p.histogram(bs, { color: c.color(1) }));

assert.equal(groups.reduce((a, g) => a + g[1], 0), 114);
assert.ok(groups[0][1] > groups[1][1] * 3, "budgets.go dominates — the figure exists to show that");

await writeFile(
  new URL("../build/fig-conflict-files.svg", import.meta.url),
  c.toString({ label: "bar chart: budgets.go 81 conflicts, TODO/docs files 21, code and tests 12" }),
);
