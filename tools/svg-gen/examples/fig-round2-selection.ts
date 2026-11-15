// Round-2 selection funnel for the go-classic-mpa-sample modern-web-guidance
// article: 208 guides -> relaxed JS policy (declarative first; JS only when
// storybook-verifiable) -> target UI + measured gap -> 8 tasks shipped.
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas();

const src = c.box(10, 40, 200, 60, { size: 13 });
c.text(110, 63, "208 guides", { anchor: "middle", baseline: "central", size: 14 });
c.text(110, 82, "modern-web-guidance list", {
  anchor: "middle",
  baseline: "central",
  size: 12,
  opacity: 0.75,
});

// filter 1: declarative first / JS needs storybook verification
const f1 = c.box(255, 42, 250, 56, { color: c.color(0), size: 12 });
c.text(380, 61, "宣言的で書ける?", {
  anchor: "middle",
  baseline: "central",
  size: 12,
});
c.text(380, 80, "JS は storybook で検証できるものだけ", {
  anchor: "middle",
  baseline: "central",
  size: 11,
  opacity: 0.8,
});

// filter 2: target UI exists + measurable gap
const f2 = c.box(540, 42, 170, 56, { color: c.color(1), size: 12 });
c.text(625, 61, "対象 UI があり", {
  anchor: "middle",
  baseline: "central",
  size: 12,
});
c.text(625, 80, "明確な不足がある?", {
  anchor: "middle",
  baseline: "central",
  size: 12,
});

const out = c.box(750, 40, 170, 60, { color: c.color(3), size: 13 });
c.text(835, 63, "8 tasks", { anchor: "middle", baseline: "central", size: 14 });
c.text(835, 82, "all merged (PR #28-#35)", {
  anchor: "middle",
  baseline: "central",
  size: 11,
  opacity: 0.8,
});

for (const [a, b] of [[src, f1], [f1, f2], [f2, out]] as const)
  c.arrow(c.anchor(a, "e"), c.anchor(b, "w"), { width: 1.5 });

// dropped-by-filter notes
c.box(280, 150, 200, 58, { dash: "5 4", opacity: 0.85, size: 11 });
c.text(292, 168, "検証不能な JS（スクロール", { size: 11, opacity: 0.85 });
c.text(292, 184, "連動アニメ等）は引き続き除外", { size: 11, opacity: 0.85 });
c.arrow(c.anchor(f1, "s"), [380, 148], { dash: "5 4", width: 1.2, opacity: 0.7 });

c.box(535, 150, 185, 58, { dash: "5 4", opacity: 0.85, size: 11 });
c.text(547, 168, "新設フォームがないので", { size: 11, opacity: 0.85 });
c.text(547, 184, "autofill・日時系は対象外", { size: 11, opacity: 0.85 });
c.arrow(c.anchor(f2, "s"), [625, 148], { dash: "5 4", width: 1.2, opacity: 0.7 });

// the unlocked items
c.box(742, 150, 196, 58, { dash: "2 3", opacity: 0.85, size: 11 });
c.text(752, 168, "no-JS 時代に見送った2件を回収", { size: 11, opacity: 0.85 });
c.text(752, 184, "方向アニメ + aria-invalid 同期", { size: 11, opacity: 0.85 });
c.arrow(c.anchor(out, "s"), [835, 148], { dash: "5 4", width: 1.2, opacity: 0.7 });

c.text(10, 16, "schematic — dropped counts are not measured", {
  size: 11,
  opacity: 0.6,
});

await writeFile(
  new URL("../build/fig-round2-selection.svg", import.meta.url),
  c.toString({ label: "208 ガイドを「宣言的優先・storybook 検証可能な JS のみ」「対象 UI と明確な不足」の2フィルタで絞り、8 タスクを全てマージした概略図" }),
);
