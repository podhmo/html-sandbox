// fig-squad-handoff.ts -- a squad of agent sessions has no shared memory,
// so the repository's document layers carry the handoff. The dashed
// arrows between sessions mark the path that does NOT exist; all
// state moves through docs/ + TODO.md below.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const H = 52;
const GX = 130;
const GY = 104;

const c = new Canvas();

// Ephemeral workers. Colour = the mark that dies with the session.
const s1 = c.box(0, 0, "auto", H, {
  label: ["実装セッション 1", "（揮発）"],
  color: c.color(0),
});
const s2 = c.box(c.rightOf(s1, GX), s1.y, "auto", H, {
  label: ["実装セッション 2", "（揮発）"],
  color: c.color(1),
});
const s3 = c.box(c.rightOf(s2, GX), s1.y, "auto", H, {
  label: ["実装セッション 3", "（揮発）"],
  color: c.color(2),
});

// The absent channel: dashed = the path that does not exist.
c.arrow(c.anchor(s1, "e"), c.anchor(s2, "w"), {
  dash: "4 4",
  opacity: 0.5,
});
c.arrow(c.anchor(s2, "e"), c.anchor(s3, "w"), {
  dash: "4 4",
  opacity: 0.5,
});
c.text(s1.x + s1.w + GX / 2, s1.y + H / 2 - 14, "記憶は", {
  anchor: "middle",
  baseline: "central",
  size: 11,
  opacity: 0.65,
});
c.text(s1.x + s1.w + GX / 2, s1.y + H / 2 + 14, "渡らない", {
  anchor: "middle",
  baseline: "central",
  size: 11,
  opacity: 0.65,
});
c.text(s2.x + s2.w + GX / 2, s2.y + H / 2 - 14, "記憶は", {
  anchor: "middle",
  baseline: "central",
  size: 11,
  opacity: 0.65,
});
c.text(s2.x + s2.w + GX / 2, s2.y + H / 2 + 14, "渡らない", {
  anchor: "middle",
  baseline: "central",
  size: 11,
  opacity: 0.65,
});

// The persistent lane: repo documents as the squad's shared memory.
const laneY = s1.y + H + GY;
const lane = c.box(s1.x - 34, laneY, s3.x + s3.w - s1.x + 68, 126);
c.text(lane.x + lane.w / 2, lane.y + 20, "docs/ + TODO.md = 文脈を共有しないエージェントの共有メモリ", {
  anchor: "middle",
  baseline: "central",
  size: 12,
  opacity: 0.7,
});

const innerW = (lane.w - 2 * 18 - 3 * 14) / 4;
const d1 = c.box(lane.x + 18, lane.y + 44, innerW, 60, {
  label: ["decisions/", "決定の記録"],
  size: 12,
});
const d2 = c.box(c.rightOf(d1, 14), d1.y, innerW, 60, {
  label: ["sketch/", "検証レポート"],
  size: 12,
});
const d3 = c.box(c.rightOf(d2, 14), d1.y, innerW, 60, {
  label: ["problems/", "未決の懸念"],
  size: 12,
});
const d4 = c.box(c.rightOf(d3, 14), d1.y, innerW, 60, {
  label: ["TODO.md", "タスク＋依存"],
  size: 12,
});

// Write arrows drop from each session; handoff arrows rise into the
// next one. Offset pairs so read and write stay distinguishable.
const midX = (s: { x: number; w: number }) => s.x + s.w / 2;
const OX = 12;

c.arrow([midX(s1), s1.y + H], [midX(s1), lane.y], { color: c.color(0) });
c.text(midX(s1) + 10, s1.y + H + GY / 2, "書く", {
  anchor: "start",
  baseline: "central",
  size: 11,
  opacity: 0.65,
});

for (const [s, i] of [[s2, 1], [s3, 2]] as const) {
  c.arrow([midX(s) - OX, lane.y], [midX(s) - OX, s.y + H], {
    color: c.color(i),
  });
  c.arrow([midX(s) + OX, s.y + H], [midX(s) + OX, lane.y], {
    color: c.color(i),
  });
}
c.text(midX(s2) - OX - 10, s2.y + H + GY / 2 - 12, "読む", {
  anchor: "end",
  baseline: "central",
  size: 11,
  opacity: 0.65,
});
c.text(midX(s2) + OX + 10, s2.y + H + GY / 2 - 12, "書く", {
  anchor: "start",
  baseline: "central",
  size: 11,
  opacity: 0.65,
});

assert.ok(s1.y === s2.y && s2.y === s3.y, "session row must be aligned");
for (const d of [d1, d2, d3, d4]) {
  assert.ok(
    d.x >= lane.x && d.x + d.w <= lane.x + lane.w &&
      d.y >= lane.y && d.y + d.h <= lane.y + lane.h,
    "doc boxes must sit inside the shared-memory lane",
  );
}
assert.ok(
  d4.x + d4.w <= lane.x + lane.w - 10,
  "last doc box must not touch the lane edge",
);

await writeFile(
  new URL("../build/fig-squad-handoff.svg", import.meta.url),
  c.toString({
    label:
      "squad handoff: three coloured session boxes sit above a document lane (decisions, sketch, problems, TODO); dashed arrows between sessions mark the missing direct channel while coloured arrows show each session writing down into the lane and the next session reading up from it",
  }),
);
