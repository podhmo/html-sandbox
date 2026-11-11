// fig-item-kind.ts -- Where the list kind lives, before and after the
// refactor. Before: "num = 0" on every Item is the bullet marker and the
// renderer re-reads items[0].num to pick <ul>/<ol>; children recurse to
// the same record, so a nested list has nowhere to keep its kind. After:
// ItemList owns kind once per level and Item.children points back at the
// list type, not at an item.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas, type Shape } from "../svg.ts";

const c = new Canvas();
const KIND = c.color(0); // where the kind lives
const SENT = c.color(1); // sentinel value
const W = 148;
const FH = 26;
const GAP = 6;
const PAD = 8;

interface Field {
  label: string;
  color?: string;
}

// A record: its name above a column of field cells inside a thin frame.
// Returns the frame and the cells.
function record(
  x: number,
  y: number,
  name: string,
  fields: Field[],
): { frame: Shape; cells: Shape[] } {
  c.text(x + 2, y - 8, name, { size: 13 });
  const cells = fields.map((f, i) =>
    c.box(x + PAD, y + PAD + i * (FH + GAP), W, FH, {
      label: f.label,
      size: 12,
      rx: 4,
      color: f.color,
      width: f.color ? 2 : 1,
    })
  );
  const frame = c.box(
    x,
    y,
    W + PAD * 2,
    PAD + fields.length * (FH + GAP) + PAD - GAP,
    { rx: 8, opacity: 0.5 },
  );
  return { frame, cells };
}

// ---- before ----
c.text(24, 30, "before", { size: 14, underline: true });
const item = record(24, 52, "Item", [
  { label: "text : String" },
  { label: "num : Int32", color: SENT },
  { label: "children : Array[Item]" },
]);
// children recurses to the same record (dashed).
const ch = item.cells[2];
c.line(c.anchor(ch, "w"), [12, ch.y + ch.h / 2], { dash: "4 3" });
c.line([12, ch.y + ch.h / 2], [12, item.frame.y + item.frame.h / 2], {
  dash: "4 3",
});
c.arrow(
  [12, item.frame.y + item.frame.h / 2],
  c.anchor(item.frame, "w"),
  { gap: 0, dash: "4 3" },
);
const listBefore = c.box(24 + PAD, 178, W, FH, {
  label: "List(items)",
  size: 12,
  rx: 4,
});
c.arrow(c.anchor(listBefore, "n"), c.anchor(item.frame, "s"), { gap: 2 });
c.text(24, 232, "num == 0 marks bullet items", { size: 11, opacity: 0.75 });
c.text(24, 248, "render: items[0].num > 0 ? <ol> : <ul>", {
  size: 11,
  opacity: 0.75,
});

// ---- after ----
const AX = 300;
c.text(AX, 30, "after", { size: 14, underline: true });
const itemList = record(AX, 52, "ItemList", [
  { label: "kind : ListKind", color: KIND },
  { label: "items : Array[Item]" },
]);
const itemAfter = record(AX, 156, "Item", [
  { label: "text : String" },
  { label: "children : ItemList?" },
]);
// items holds the Items.
const it = itemList.cells[1];
c.line(c.anchor(it, "w"), [AX - 16, it.y + it.h / 2]);
c.line(
  [AX - 16, it.y + it.h / 2],
  [AX - 16, itemAfter.frame.y + itemAfter.frame.h / 2],
);
c.arrow(
  [AX - 16, itemAfter.frame.y + itemAfter.frame.h / 2],
  c.anchor(itemAfter.frame, "w"),
  { gap: 0 },
);
// children points back at the list type, not at an item (dashed).
const ch2 = itemAfter.cells[1];
c.line(c.anchor(ch2, "w"), [AX - 34, ch2.y + ch2.h / 2], { dash: "4 3" });
c.line(
  [AX - 34, ch2.y + ch2.h / 2],
  [AX - 34, itemList.frame.y + itemList.frame.h / 2],
  { dash: "4 3" },
);
c.arrow(
  [AX - 34, itemList.frame.y + itemList.frame.h / 2],
  c.anchor(itemList.frame, "w"),
  { gap: 0, dash: "4 3" },
);
// List wraps the ItemList.
const listAfter = c.box(
  AX + W + PAD * 2 + 60,
  itemList.frame.y + itemList.frame.h / 2 - FH / 2,
  W,
  FH,
  { label: "List(item_list)", size: 12, rx: 4 },
);
c.arrow(c.anchor(listAfter, "w"), c.anchor(itemList.frame, "e"), { gap: 2 });
c.text(AX, 262, "kind = Bullet | Ordered(start~)", {
  size: 11,
  opacity: 0.75,
});
c.text(AX, 278, "render: match list.kind { ... }", {
  size: 11,
  opacity: 0.75,
});

// The before panel's widest element is its frame; keep the panels apart.
assert.ok(24 + W + 40 < AX, "panels must not overlap");

await writeFile(
  new URL("../build/fig-item-kind.svg", import.meta.url),
  c.toString({
    label:
      "before: num on every Item doubles as the list kind; after: ItemList owns kind and Item.children points back at it",
  }),
);
