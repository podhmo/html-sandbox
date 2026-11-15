// The mirror figure for the tekitou article: the same "仲間内" frame, but
// the aimed direction flips. In the test, the shared 正解 is the goal
// (effort converges on the criterion). In the work group, the criterion
// is still there but unenforceable — the external requester cannot
// evaluate — so the advice points away from it toward 程々.
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas();

const TOKEN = c.color(2);
const LOOSE = c.color(3);

function token(cx: number, cy: number, dashed = false): void {
  if (dashed) {
    c.raw(
      `<rect x="${cx - 6.5}" y="${cy - 6.5}" width="13" height="13" transform="rotate(45 ${cx} ${cy})" fill="none" stroke="${TOKEN}" stroke-width="1.5" stroke-dasharray="3 2"/>`,
      [[cx - 10, cy - 10], [cx + 10, cy + 10]],
    );
  } else {
    c.raw(
      `<rect x="${cx - 6.5}" y="${cy - 6.5}" width="13" height="13" transform="rotate(45 ${cx} ${cy})" fill="${TOKEN}"/>`,
      [[cx - 10, cy - 10], [cx + 10, cy + 10]],
    );
  }
}

// ---- row 1: test — converge on the shared answer ----
const r1 = c.box(40, 30, 600, 92, { rx: 12, opacity: 0.75 });
c.text(56, 52, "同門（テスト）", { size: 12, opacity: 0.85 });
token(180, 76);
c.text(180, 106, "共有の正解", { anchor: "middle", size: 10, opacity: 0.75 });
const worker1 = c.circle(520, 76, 20, { size: 11 });
c.text(520, 76, "生徒", { anchor: "middle", baseline: "central", size: 11 });
c.arrow(c.anchor(worker1, "w"), [196, 76], { width: 2 });
c.text(355, 62, "正解にぴったり合わせる", { anchor: "middle", size: 11, opacity: 0.8 });

// ---- row 2: work group — the criterion is present but unenforced ----
const r2 = c.box(40, 160, 600, 92, { rx: 12, opacity: 0.75 });
c.text(56, 182, "作業グループ", { size: 12, opacity: 0.85 });
token(180, 206, true);
c.text(180, 238, "正解（評価者不在）", { anchor: "middle", size: 10, opacity: 0.75 });
const worker2 = c.circle(340, 206, 20, { size: 11 });
c.text(340, 206, "作業者", { anchor: "middle", baseline: "central", size: 11 });
const ease = c.box(500, 186, "auto", 40, { label: "程々・力を抜く", color: LOOSE, size: 12 });
c.arrow(c.anchor(worker2, "e"), c.anchor(ease, "w"), { width: 2, color: LOOSE });
c.text(340, 246, "「適当でいいよ」と仲間が助言", { anchor: "middle", size: 10, opacity: 0.8 });

await writeFile(
  new URL("../build/fig-tekitou-mirror.svg", import.meta.url),
  c.toString({
    label:
      "同じ仲間内の枠組みで向きが逆転する。テストでは正解へ収束する努力、作業グループでは評価不能な正解から離れて程々へ向かう助言",
  }),
);
