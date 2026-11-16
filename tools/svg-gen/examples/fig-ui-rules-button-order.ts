// fig-ui-rules-button-order.ts -- the drift the ui-rules audit found:
// two pages disagreed on whether the confirm button goes left or right,
// and on where the row sits. One ".form-actions" convention fixes both.
import { writeFile } from "node:fs/promises";
import { Canvas, textWidth } from "../svg.ts";

const c = new Canvas();
const STRIP_W = 310;
const STRIP_H = 46;
const X = 150;

function strip(y: number, caption: string) {
  const s = c.box(X, y, STRIP_W, STRIP_H, { rx: 4, opacity: 0.7 });
  c.text(X - 14, y + STRIP_H / 2, caption, {
    anchor: "end",
    baseline: "central",
    size: 11,
    opacity: 0.6,
  });
  return s;
}

function btn(x: number, y: number, label: string, i: number) {
  return c.box(x, y, "auto", 30, { label, size: 12, padX: 12, rx: 6, color: c.color(i), width: i === 0 ? 2 : 1.5 });
}

// before: the create form put Cancel first, left-aligned (colorful = hue
// only on the button outlines; text stays currentColor)
{
  const y = 10;
  strip(y, "before: create form");
  const a = btn(X + 10, y + 8, "Cancel", 2);
  btn(c.rightOf(a, 8), y + 8, "Create", 0);
}

// before: the delete confirmation put the destructive action first
{
  const y = 70;
  strip(y, "before: delete confirm");
  const a = btn(X + 10, y + 8, "Delete", 3);
  btn(c.rightOf(a, 8), y + 8, "Cancel", 2);
}

// after: Cancel left, confirm right, the whole row pushed to flex-end
{
  const y = 150;
  strip(y, "after: .form-actions");
  const primaryW = textWidth("Confirm", 12) + 24;
  const cancelW = textWidth("Cancel", 12) + 24;
  const primaryX = X + STRIP_W - 10 - primaryW;
  const cancelX = primaryX - 8 - cancelW;
  btn(cancelX, y + 8, "Cancel", 2);
  btn(primaryX, y + 8, "Confirm", 0);
  // the flex-end anchor: a short spine marking the shared edge
  c.line([X + STRIP_W - 4, y + 4], [X + STRIP_W - 4, y + STRIP_H - 4], { dash: "3 3", opacity: 0.5 });
}

await writeFile(
  new URL("../build/fig-ui-rules-button-order.svg", import.meta.url),
  c.toString({ label: "ページごとにずれていた決定ボタンの左右位置を .form-actions の Cancel 左・確定右に統一した図" }),
);
