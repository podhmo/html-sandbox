// fig-highlight.ts -- compare low-key ways to say "look here", from
// weakest to strongest claim. The posts figures used a flat grey band;
// these stay currentColor so they work on both themes.
import { writeFile } from "node:fs/promises";
import { Canvas, type Shape, type ShapeOptions } from "./svg.ts";

const c = new Canvas();
const ROW_H = 64;

interface Variant {
  boxOpts?: ShapeOptions;
  mark?: (s: Shape) => void;
}

const variants: [caption: string, v: Variant][] = [
  ["wash 0.06", { mark: (s) => c.highlight(s, { opacity: 0.06 }) }],
  ["wash 0.12", { mark: (s) => c.highlight(s, { opacity: 0.12 }) }],
  ["dashed ring", { mark: (s) => c.highlight(s, { mode: "ring" }) }],
  ["thick stroke", { boxOpts: { width: 2.5 } }],
  [
    "underline",
    {
      mark: (s) =>
        c.line([s.x + 4, s.y + s.h + 8], [s.x + s.w - 4, s.y + s.h + 8], { width: 3 }),
    },
  ],
];

variants.forEach(([caption, v], i) => {
  const y = i * ROW_H;
  c.text(150, y + 20, caption, { anchor: "end", baseline: "central", size: 11, opacity: 0.6 });
  const a = c.box(170, y, "auto", 40, { label: "plain", size: 12 });
  const b = c.box(c.rightOf(a, 60), y, "auto", 40, { label: "emphasized", size: 12, ...v.boxOpts });
  c.arrow(c.anchor(a, "e"), c.anchor(b, "w"));
  v.mark?.(b);
});

await writeFile(
  new URL("./build/fig-highlight.svg", import.meta.url),
  c.toString({ label: "five low-key ways to emphasize a box" }),
);
