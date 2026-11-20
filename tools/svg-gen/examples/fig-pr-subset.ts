// fig-pr-subset.ts -- the tracker's feature set as a subset of GitHub:
// colored boxes are implemented, muted dashed boxes are not.
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas();
const IMP = [0, 1, 2, 3, 4, 5];
const OFF = { dash: "5 4", opacity: 0.45 };

const outer = c.box(0, 0, 720, 344, { rx: 12, dash: "6 4" });
c.text(outer.x + 16, outer.y + 26, "GitHub (as a product)", { size: 15 });

const H = 40;
const gapX = 24;
const gapY = 20;
const colW = 150;
const x0 = outer.x + 24;
const y0 = outer.y + 44;

function cell(col: number, row: number, label: string, i: number) {
  return c.box(x0 + col * (colW + gapX), y0 + row * (H + gapY), colW, H, {
    label,
    color: c.color(i),
    width: 2,
  });
}

// implemented: left column = social objects, middle = delivery, right = PR
cell(0, 0, "issues + comments", IMP[0]);
cell(0, 1, "labels", IMP[0]);
cell(0, 2, "discussions (Q&A)", IMP[0]);
cell(0, 3, "hide/edit history", IMP[0]);
cell(1, 0, "markdown export", IMP[1]);
cell(1, 1, "JSON API /api/v1", IMP[1]);
cell(1, 2, "gh-style CLI", IMP[1]);
cell(1, 3, "SSE live updates", IMP[1]);
cell(2, 0, "pull requests", IMP[2]);
cell(2, 1, "review comments", IMP[2]);
cell(2, 2, "merge 3 methods", IMP[2]);
cell(2, 3, "conflict check", IMP[2]);

// not implemented: muted row at the bottom
const y1 = y0 + 4 * (H + gapY) + 4;
c.box(x0, y1, colW, H, { label: "review verdicts", ...OFF });
c.box(x0 + (colW + gapX), y1, colW, H, { label: "CI / actions", ...OFF });
c.box(x0 + 2 * (colW + gapX), y1, colW, H, {
  label: "forks / releases",
  ...OFF,
});
c.box(x0 + 3 * (colW + gapX), y1, colW, H, {
  label: "permissions",
  ...OFF,
});

c.text(x0, y1 - 10, "implemented — solid strokes; skipped — dashed", {
  size: 12,
  opacity: 0.7,
});

await writeFile(
  new URL("../build/fig-pr-subset.svg", import.meta.url),
  c.toString({ label: "GitHub 本体に対する実装済み機能の subset 関係図" }),
);
