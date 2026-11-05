// fig-good-slops-map.ts -- where parts of existing slops sit on two axes:
// x = whether the requester could already see it (PR, diff, chat) or only the
// AI could (what it saw, chose, left unsaid); y = whether the part carries
// content or only voice. Positions are qualitative. The arrow is the TTS
// article: its "properties" rearranged visible facts, while the reflection
// the requester asked for (why not ask for a driver update) was never written.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas({ margin: 12 });

const L = 90, R = 620, T = 50, B = 300;
c.text(10, 14, "記事の一部を、見えていたか・中身か語り口かで置く（定性的）", { size: 13 });

// axes
c.line([L, B], [R, B], { opacity: 0.6 });
c.line([L, T], [L, B], { opacity: 0.6 });
c.text(L, B + 18, "依頼した人に見えていたもの（PR、diff、会話）", { size: 11, opacity: 0.8 });
c.text(R, B + 36, "AI だけが知っていたもの（見たもの、選んだもの、言わなかったもの）", { anchor: "end", size: 11, opacity: 0.8 });
c.text(L - 8, T + 6, "語り口", { anchor: "end", size: 11, opacity: 0.8 });
c.text(L - 8, B - 6, "中身", { anchor: "end", size: 11, opacity: 0.8 });

// the region the inference points at
c.box(380, 150, 230, 140, { rx: 6, dash: "5 4", width: 1.5, opacity: 0.7 });
c.text(600, 166, "良い記事の側（推測）", { anchor: "end", size: 11, opacity: 0.8 });

type P = [number, number, string, number, "start" | "end"];
const pts: P[] = [
  [170, 250, "answers-under-constraints の「性質 1〜5」", 0, "start"],
  [250, 90, "reading-slops-again の「ぞくっとする」など", 3, "start"],
  [400, 205, "pi-sarashina の「どこでハマったか」", 1, "start"],
  [520, 240, "gom の推測とその根拠", 2, "end"],
];
for (const [x, y, label, k, anchor] of pts) {
  c.circle(x, y, 6, { color: c.color(k), width: 2.5 });
  c.text(anchor === "start" ? x - 6 : x + 6, y - 14, label, { anchor, size: 11 });
}

// the reflection that was asked for but not written
const miss: [number, number] = [430, 276];
c.circle(miss[0], miss[1], 6, { dash: "2 2", width: 1.5 });
c.text(miss[0] + 12, miss[1] + 4, "書かれなかった反省", { size: 11, opacity: 0.85 });
c.arrow([176, 252], [422, 275], { dash: "4 3", opacity: 0.6 });

for (const [x, y] of pts) assert.ok(x > L && x < R && y > T && y < B, "points inside the plot");
assert.ok(miss[0] > 380 && miss[1] > 150, "the missing reflection lies in the good region");

await writeFile(
  new URL("../build/fig-good-slops-map.svg", import.meta.url),
  c.toString({
    label:
      "qualitative map: x from what the requester could already see to what only the AI knew, y from content to voice; the TTS article's properties sit on the visible side, the unwritten reflection on the AI-only content side",
  }),
);
