// Who holds the answer? Three scenes from the tekitou article: the school
// test (knowledge shared on both sides), the request (requester cannot
// judge, receiver holds the criterion), and the receiver's realization
// (the requester cannot evaluate the delivered work). The "正解" token
// sits with whoever holds the criterion; the drift tracks that asymmetry.
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas();

const TOKEN = c.color(2); // green — the "正解" mark
const LOOSE = c.color(3); // vermillion — the "テキトー" end
const R = 20;

function token(cx: number, cy: number): void {
  c.raw(
    `<rect x="${cx - 6.5}" y="${cy - 6.5}" width="13" height="13" transform="rotate(45 ${cx} ${cy})" fill="${TOKEN}"/>`,
    [[cx - 10, cy - 10], [cx + 10, cy + 10]],
  );
}

function person(cx: number, cy: number, role: string, dash?: string): void {
  c.circle(cx, cy, R, dash ? { dash, size: 11 } : { size: 11 });
  c.text(cx, cy + R + 15, role, { anchor: "middle", size: 11, opacity: 0.85 });
}

// ---- panel 1: test — knowledge shared ----
const p1 = 110;
c.text(p1, 18, "テスト（同門）", { anchor: "middle", size: 13 });
person(p1, 56, "先生");
person(p1, 146, "生徒");
// enclosing box = the shared frame of knowledge, drawn around both roles
c.box(p1 - 52, 30, 104, 172, { rx: 12, dash: "4 3", opacity: 0.55 });
token(p1 + 36, 101);
c.text(p1 + 36, 126, "正解", { anchor: "middle", size: 10, opacity: 0.8 });
c.text(p1, 216, "同じ正解を共有", { anchor: "middle", size: 10, opacity: 0.7 });

// ---- panel 2: request — requester does not know ----
const p2 = 360;
c.text(p2, 18, "依頼（お任せ）", { anchor: "middle", size: 13 });
person(p2, 56, "依頼者");
person(p2, 146, "受注者");
token(p2 + 44, 146);
c.arrow(
  c.anchor({ x: p2 - R, y: 56, w: 2 * R, h: 2 * R }, "s"),
  c.anchor({ x: p2 - R, y: 146, w: 2 * R, h: 2 * R }, "n"),
  { width: 1.5 },
);
c.text(p2 + 50, 96, "よしなに", { size: 11, opacity: 0.8 });
c.text(p2 + 50, 110, "（丸ごと委任）", { size: 10, opacity: 0.6 });

// ---- panel 3: realization — requester cannot evaluate ----
const p3 = 610;
c.text(p3, 18, "受注側の気づき", { anchor: "middle", size: 13 });
person(p3, 56, "発注者", "4 3");
person(p3, 146, "受注者");
token(p3 + 44, 146);
c.arrow(
  c.anchor({ x: p3 - R, y: 146, w: 2 * R, h: 2 * R }, "n"),
  c.anchor({ x: p3 - R, y: 56, w: 2 * R, h: 2 * R }, "s"),
  { dash: "4 3", width: 1.5, color: LOOSE },
);
c.text(p3 + 52, 96, "手を抜いても", { size: 11, opacity: 0.85 });
c.text(p3 + 52, 110, "見抜けない", { size: 11, opacity: 0.85 });
c.text(p3, 216, "破線 = 評価できない側", { anchor: "middle", size: 10, opacity: 0.6 });

// ---- the drift below the panels ----
c.line([110, 246], [610, 246], { dash: "2 3", opacity: 0.4, gapEnd: 0, gapStart: 0 });
c.text(110, 266, "正解が両者にある", { size: 11, opacity: 0.8 });
c.text(610, 266, "正解は受け手だけにある", { anchor: "end", size: 11, opacity: 0.8 });
c.arrow([360, 250], [560, 250], { width: 1.5 });
c.text(360, 266, "対称 → 非対称", { size: 11, opacity: 0.8 });

await writeFile(
  new URL("../build/fig-tekitou-asymmetry.svg", import.meta.url),
  c.toString({
    label:
      "三つの場面で正解の持ち主が移る。テストでは両者が共有、依頼では受注者だけが持ち、受注者は発注者が評価できないと気づく",
  }),
);
