// fig-mwg-funnel.ts -- Picking TODO tasks from the modern-web-guidance
// catalog: 208 guides pass three filters (needs executable JS? does the
// app even have that UI? is the gap real?), leaving 10 tasks. Counts of
// the dropped side are schematic — only 208 and 10 are real numbers.
import { writeFile } from "node:fs/promises";
import { Canvas, textWidth, type Shape } from "../svg.ts";

const c = new Canvas();

const src = c.box(0, 40, "auto", 60, {
  label: ["208 guides", "modern-web-guidance list"],
  width: 2,
});

// Three filter gates in a row; each drops a class of guides downward.
const gate = (x: number, y: number, label: string[], col: number): Shape =>
  c.box(x, y, "auto", 56, { label, color: c.color(col), width: 2 });

const g1 = gate(260, 42, ["executable JS?", "JS API 前提は除外"], 0);
const g2 = gate(450, 42, ["対象の UI が", "アプリにある?"], 1);
const g3 = gate(640, 42, ["現状に明確な", "不足がある?"], 4);

const out = c.box(800, 40, "auto", 60, {
  label: ["10 tasks", "採用 9 + 判断留保 1"],
  color: c.color(2),
  width: 2.5,
});

// Flow arrows through the gates.
c.arrow(c.anchor(src, "e"), c.anchor(g1, "w"));
c.arrow(c.anchor(g1, "e"), c.anchor(g2, "w"));
c.arrow(c.anchor(g2, "e"), c.anchor(g3, "w"));
c.arrow(c.anchor(g3, "e"), c.anchor(out, "w"));

// Drops below each gate (dashed = rejected), with example guide ids.
const drop = (g: Shape, label: string[]) => {
  const w = Math.max(...label.map((s) => textWidth(s, 11))) + 16;
  const d = c.box(g.x + g.w / 2 - w / 2, g.y + 130, w, label.length * 15 + 20, {
    label,
    dash: "5 4",
    opacity: 0.85,
    size: 11,
    padX: 8,
  });
  c.arrow(c.anchor(g, "s"), c.anchor(d, "n"), { dash: "5 4", opacity: 0.7 });
};

drop(g1, ["Temporal / built-in AI", "service worker / INP", "Web Components", "…大半"]);
drop(g2, ["custom select / slider", "autofill 住所・支払い", "carousel / scrollytelling", "対象 UI がない"]);
drop(g3, ["toast / idle detection 等", "用途・不足が薄い"]);

// The one borderline pick kept visible.
const note = c.box(800, 150, "auto", 3 * 15 + 20, {
  label: ["speculation rules:", "宣言的 JSON だが <script> 要素", "→ 実装するかは子が判断 (wontfix 可)"],
  color: c.color(3),
  dash: "5 4",
  size: 11,
  padX: 10,
});
c.arrow(c.anchor(out, "s"), c.anchor(note, "n"), { dash: "5 4", opacity: 0.7 });

c.text(10, 16, "schematic — dropped counts are not measured", { size: 11, opacity: 0.6 });

await writeFile(new URL("../build/fig-mwg-funnel.svg", import.meta.url), c.toString({ label: "modern-web-guidance 208 guides を3つのフィルタで絞り10タスクを採用した概略図" }));
console.log("wrote fig-mwg-funnel.svg");
