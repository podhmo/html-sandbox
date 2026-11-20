// fig-cli-coverage.ts -- coverage map of the two browser CLIs.
// Inside the dashed frame: what playwright-cli (blue, left) and the
// chrome-devtools CLI (orange, right) each reach, with the overlap.
// Outside the frame: things neither CLI can verify for you.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas, type Point } from "../svg.ts";

const c = new Canvas({ margin: 14 });
const PW = c.color(0); // blue = playwright-cli
const CD = c.color(1); // orange = chrome-devtools CLI
const OUT = c.color(3); // vermillion = outside the CLIs' reach

const ellipse = (cx: number, cy: number, rx: number, ry: number, color: string) => {
  c.raw(
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${color}" stroke-width="2"/>`,
    [
      [cx - rx, cy],
      [cx + rx, cy],
      [cx, cy - ry],
      [cx, cy + ry],
    ] as Point[],
  );
  return { x: cx - rx, y: cy - ry, w: 2 * rx, h: 2 * ry };
};

// The frame: everything a browser-automation CLI can verify at all.
const FRAME = { x: 0, y: 0, w: 600, h: 290 };
c.raw(
  `<rect x="${FRAME.x}" y="${FRAME.y}" width="${FRAME.w}" height="${FRAME.h}" rx="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="7 5"/>`,
  [
    [FRAME.x, FRAME.y],
    [FRAME.x + FRAME.w, FRAME.y + FRAME.h],
  ] as Point[],
);
c.text(FRAME.x + 14, FRAME.y + 22, "CLI が届く範囲 (headless Chromium)", {
  size: 13,
  opacity: 0.75,
});

// Two overlapping ellipses; the shared lens is ~110px wide at center.
const E_Y = 175;
const pw = ellipse(210, E_Y, 145, 95, PW);
const cd = ellipse(390, E_Y, 145, 95, CD);
assert.ok(pw.x > FRAME.x && cd.x + cd.w < FRAME.x + FRAME.w);

// Tool names above each ellipse, underlined in their zone's color.
c.text(210, 56, "playwright-cli", { anchor: "middle", size: 15, underline: 2 });
c.text(390, 56, "chrome-devtools CLI", { anchor: "middle", size: 15, underline: 2 });
c.raw(
  `<line x1="${210 - 62}" y1="64" x2="${210 + 62}" y2="64" stroke="${PW}" stroke-width="2"/>`,
  [
    [210 - 62, 64],
    [210 + 62, 64],
  ] as Point[],
);
c.raw(
  `<line x1="${390 - 88}" y1="64" x2="${390 + 88}" y2="64" stroke="${CD}" stroke-width="2"/>`,
  [
    [390 - 88, 64],
    [390 + 88, 64],
  ] as Point[],
);

// Left-only area: automation + screenshots + arbitrary CDP.
c.text(135, 158, "定型操作・E2E", { anchor: "middle", size: 12.5 });
c.text(135, 180, "screenshot 差分", { anchor: "middle", size: 12.5 });
c.text(135, 202, "任意 CDP", { anchor: "middle", size: 12.5 });

// Overlap lens: what both do. Short labels, small size, near center.
c.text(300, 172, "trace 取得", { anchor: "middle", size: 11 });
c.text(300, 190, "net/console", { anchor: "middle", size: 11 });

// Right-only area: curated DevTools diagnosis.
c.text(468, 152, "perf insight", { anchor: "middle", size: 12.5 });
c.text(468, 174, "自動分析", { anchor: "middle", size: 12.5 });
c.text(468, 196, "CSS cascade 追跡", { anchor: "middle", size: 12.5 });
c.text(468, 218, "lighthouse", { anchor: "middle", size: 12.5 });

// Outside the frame: what neither CLI verifies. One color marks "out".
const OUT_X = FRAME.x + FRAME.w + 28;
c.text(OUT_X, 24, "届かないもの", { size: 13, opacity: 0.75 });
const outside: [number, string, string][] = [
  [70, "実デバイス・OS差", "フォント/GPU/タッチ"],
  [118, "他エンジン", "Safari / Firefox"],
  [166, "意味の判断", "差分 ≠ 壊れた"],
  [214, "継続的な実測", "RUM / 長時間挙動"],
];
for (const [y, t1, t2] of outside) {
  c.raw(
    `<circle cx="${OUT_X + 5}" cy="${y - 4}" r="4" fill="${OUT}"/>`,
    [[OUT_X + 5, y - 4]] as Point[],
  );
  c.text(OUT_X + 18, y, t1, { size: 13 });
  c.text(OUT_X + 18, y + 17, t2, { size: 11, opacity: 0.65 });
}

// A dashed boundary arrow: crossing the frame means leaving the CLIs.
c.arrow([FRAME.x + FRAME.w - 6, 262], [OUT_X - 6, 262], {
  heads: "end",
  dash: "5 4",
  color: OUT,
});

await writeFile(
  new URL("../build/fig-cli-coverage.svg", import.meta.url),
  c.toString({ label: "2つのCLIの届く範囲。重なる中央は両方で可能、枠の外側右は両方でも確認できない領域" }),
);
