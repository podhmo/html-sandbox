// Physical skill directories and their repository-local discovery aliases.
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas();
c.text(10, 20, ".claude/skills/ (sources)", { size: 13 });
c.text(10, 152, ".agents/skills/ (symlinks)", { size: 13 });
for (const [i, label] of ["base", "exploration"].entries()) {
  const x = 10 + i * 142;
  const source = c.box(x, 38, 124, 44, { label, size: 13 });
  const alias = c.box(x, 170, 124, 44, { label, size: 13, dash: "5 4" });
  c.arrow(c.anchor(alias, "n"), c.anchor(source, "s"));
}
c.text(10, 244, "Arrows point to stored files.", { size: 11 });
await writeFile(new URL("../build/fig-exploration-skill-links.svg", import.meta.url),
  c.toString({ label: "The base and exploration skill sources above, with matching discovery symlinks below pointing upward to the same files" }));
