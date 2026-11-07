// Physical skill directories and their repository-local discovery aliases.
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas();
c.text(10, 20, ".claude/skills/（実体）", { size: 13 });
c.text(10, 152, ".agents/skills/（リンク）", { size: 13 });
for (const [i, label] of ["共通", "探索用"].entries()) {
  const x = 10 + i * 142;
  const source = c.box(x, 38, 124, 44, { label, size: 13 });
  const alias = c.box(x, 170, 124, 44, { label, size: 13, dash: "5 4" });
  c.arrow(c.anchor(alias, "n"), c.anchor(source, "s"));
}
c.text(10, 244, "矢印はリンクから実体へ向く。", { size: 11 });
await writeFile(new URL("../build/fig-exploration-skill-links.svg", import.meta.url),
  c.toString({ label: "共通・探索用スキルの実体を上段、その実体を指す発見用リンクを下段に示す" }));
