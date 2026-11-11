// fig-sum-type-product.ts -- "One state in two places" seen as a product
// grid. Each panel crosses the two type locations that together carried
// one state: Route.subtree x the last segment, and scan's Mode x Pending.
// Cells the code can produce are marked O; cells the types allow but no
// input produces are marked x. Folding the state into one enum leaves
// only the O cells — that is the "impossible combinations in the product"
// of the guidelines' second sign.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas, textWidth } from "../svg.ts";

const c = new Canvas();
const CW = 58;
const CH = 26;
const HDR = 11;
const GAPX = 48;

// A product grid: row/col labels, O where the combination can occur, x
// where the types allow it but nothing produces it.
function grid(
  x: number,
  y: number,
  title: string,
  cols: string[],
  rows: string[],
  real: (i: number, j: number) => boolean,
  caption: string,
): { x: number; y: number; w: number; h: number } {
  c.text(x, y - 22, title, { size: 13, underline: true });
  const labelW = Math.max(...rows.map((r) => textWidth(r, HDR))) + 8;
  cols.forEach((col, j) =>
    c.text(x + labelW + j * CW + CW / 2, y - 6, col, {
      anchor: "middle",
      size: HDR,
    })
  );
  rows.forEach((row, i) => {
    c.text(x + labelW - 6, y + i * CH + CH / 2, row, {
      anchor: "end",
      baseline: "central",
      size: HDR,
    });
    cols.forEach((_, j) => {
      const ok = real(i, j);
      const cell = c.box(x + labelW + j * CW, y + i * CH, CW, CH, {
        rx: 2,
        opacity: ok ? 1 : 0.25,
        width: ok ? 1.5 : 1,
      });
      c.text(
        cell.x + cell.w / 2,
        cell.y + cell.h / 2,
        ok ? "O" : "x",
        {
          anchor: "middle",
          baseline: "central",
          size: ok ? 13 : 12,
          opacity: ok ? 1 : 0.35,
        },
      );
    });
  });
  const w = labelW + cols.length * CW;
  const h = rows.length * CH;
  c.text(x, y + h + 18, caption, { size: HDR, opacity: 0.75 });
  return { x, y, w, h };
}

const Y = 62;
const route = grid(
  24,
  Y,
  "Route: subtree x 最後の segment",
  ["lit/{x}", "{$}", "{x...}", "(empty)"],
  ["subtree=false", "subtree=true"],
  // false x {lit, $, x...} and true x {lit, empty} occur; the rest cannot
  // be produced by a pattern but the types allow it.
  (i, j) => (i === 0 ? j < 3 : j === 0 || j === 3),
  "5 of 8 occur -> Tail { Exact; End; Subtree; Rest }",
);
const SX = route.x + route.w + GAPX;
const scan = grid(
  SX,
  Y,
  "scan: mode x pending",
  ["Nothing", "Para", "Items", "Quote", "Table"],
  ["Normal", "Code", "Details", "Footnote"],
  // pending is non-empty only in Normal.
  (i, j) => i === 0 || j === 0,
  "8 of 20 occur -> Normal(Pending)",
);

assert.ok(
  route.x + route.w + GAPX <= scan.x,
  "the two panels must not overlap",
);
assert.ok(scan.w > 0, "scan grid was drawn");

await writeFile(
  new URL("../build/fig-sum-type-product.svg", import.meta.url),
  c.toString({
    label:
      "product grids of the two split states; O marks combinations that occur, x marks ones the types allow but no input produces",
  }),
);
