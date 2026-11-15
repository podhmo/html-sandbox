// Meaning-drift spectrum for the tekitou article: "適当に" (fitting a shared
// criterion) slides through {よしなに, いい感じに} into "テキトーに"
// (no criterion asked). Position on the axis carries the meaning: the
// strictness of the criterion fades left to right.
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas();

const y = 90;
const x0 = 60;
const x3 = 620;

// the axis itself, with a drift arrowhead at the loose end
c.line([x0, y], [x3, y], { width: 2 });
c.arrow([x3 - 60, y], [x3 + 30, y], { width: 2 });

c.text(x0, y - 34, "基準が明確（正解が共有されている）", { size: 12, opacity: 0.8 });
c.text(x3 + 30, y - 34, "基準を問わない", { anchor: "end", size: 12, opacity: 0.8 });

// fading criterion: a bar whose fill thins out left to right
c.raw(
  `<rect x="${x0}" y="${y + 46}" width="${x3 - x0}" height="6" fill="currentColor" fill-opacity="0.10"/>`,
);
c.raw(
  `<polygon points="${x0},${y + 40} ${x0},${y + 58} ${x3},${y + 58}" fill="currentColor" fill-opacity="0.18"/>`,
  [[x0, y + 40], [x3, y + 58]],
);
c.text(x0, y + 74, "判断基準の共有度", { size: 11, opacity: 0.6 });

// the three stops on the spectrum
const stops = [
  { x: x0, word: "適当に", gloss: "適切に・ぴったり", scene: "テストの「最も適当な語句」", i: 0 },
  { x: (x0 + x3) / 2, word: "よしなに・いい感じに", gloss: "判断の丸ごと委任", scene: "依頼の「適当にお願い」", i: 1 },
  { x: x3, word: "テキトーに", gloss: "いい加減に・ざっくり", scene: "現場の「適当でいいよ」", i: 3 },
];

stops.forEach((s) => {
  const col = c.color(s.i);
  // ring + filled dot so the mark still reads without color
  c.circle(s.x, y, 9, { color: col, width: 2 });
  c.raw(`<circle cx="${s.x}" cy="${y}" r="4.5" fill="${col}"/>`);
  c.text(s.x, y - 20, s.scene, { anchor: "middle", size: 11, opacity: 0.75 });
  c.text(s.x, y + 30, s.word, { anchor: "middle", size: 14 });
  c.text(s.x, y + 100, s.gloss, { anchor: "middle", size: 11, opacity: 0.7 });
});

await writeFile(
  new URL("../build/fig-tekitou-spectrum.svg", import.meta.url),
  c.toString({
    label:
      "「適当に」から「よしなに・いい感じに」を経て「テキトーに」へ。横軸は判断基準の共有度で、右へ行くほど基準を問わない用法になる",
  }),
);
