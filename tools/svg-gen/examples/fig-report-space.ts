// fig-report-space.ts -- the five report variants placed on two axes:
// x = formality (informal -> formal), y = distance to the reader
// (future self -> strangers). The position carries the meaning: a
// personal memo and an incident report share the design system but
// sit at opposite corners of the space a report skill must cover.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas({ margin: 12 });

const X0 = 70;
const Y0 = 190;
const X1 = 430;
const Y1 = 30;

// axes: x = formality, y = reader distance
c.line([X0, Y0], [X1, Y0], { width: 1.5 });
c.line([X0, Y0], [X0, Y1], { width: 1.5 });
c.arrow([X1 - 1, Y0], [X1, Y0], { width: 1.5 });
c.arrow([X0, Y1 + 1], [X0, Y1], { width: 1.5 });

c.text(X1, Y0 + 22, "形式度 →", { anchor: "end", size: 12 });
c.text(X0, Y0 + 22, "← くだけた", { anchor: "start", size: 12, opacity: 0.7 });
c.text(X0 - 8, Y1 + 4, "遠い読者", { anchor: "end", size: 12 });
c.text(X0 - 8, Y0, "近い読者", { anchor: "end", size: 12, opacity: 0.7 });

// variants: [x, y, label, palette index]
const pts: [number, number, string, number][] = [
  [360, 140, "週次進捗報告", 0], // thesis: formal, close-ish (boss)
  [110, 165, "個人メモ", 1], // antithesis: informal, closest (future self)
  [280, 45, "技術調査", 2], // shift: formal, far (other dept)
  [330, 62, "障害報告", 3], // shift: formal, mid-far (stakeholders)
  [392, 92, "意思決定依頼", 4], // shift: most formal, close (approver)
];

for (const [x, y, label, i] of pts) {
  c.circle(x, y, 4, { color: c.color(i), width: 2 });
  c.text(x, y - 12, label, { anchor: "middle", size: 12 });
}

// same design system covers both extremes: dashed span thesis <-> antithesis
c.line([110, 165], [360, 140], { dash: "4 4", opacity: 0.6 });

assert.ok(pts.every(([x, y]) => x > X0 && x < X1 && y < Y0 && y > Y1), "all variants inside the axes");

await writeFile(
  new URL("../build/fig-report-space.svg", import.meta.url),
  c.toString({ label: "five report variants on a formality vs. reader-distance plane" }),
);
