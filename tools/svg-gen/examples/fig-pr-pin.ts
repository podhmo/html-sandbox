// fig-pr-pin.ts -- lifecycle of the pin ref: the live branch moves while
// the PR is open, then refs/zatudan/pr/<id>/head freezes the recorded tip
// so the closed view survives branch moves and deletion.
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas();
const PIN = 1, LIVE = 0;
const R = 9, D = 70;
const y = 110, x0 = 60;
const cen = (s: { x: number; y: number; w: number; h: number }): [number, number] => [
  s.x + s.w / 2,
  s.y + s.h / 2,
];

// commit row: the pin froze at C2; the branch tip later moved to C4
const cc: { x: number; y: number; w: number; h: number }[] = [];
for (let i = 0; i < 4; i++) {
  cc.push(c.circle(x0 + i * D, y, R, { color: c.color(LIVE) }));
}
for (let i = 0; i < 3; i++) {
  c.line(cen(cc[i]), cen(cc[i + 1]));
}
for (let i = 0; i < 4; i++) {
  c.text(cc[i].x + R, y + R + 20, `C${i + 1}`, { anchor: "middle", size: 13 });
}

// live head ref: follows the branch, now at the tip
c.text(x0 - 10, y - 40, "refs/heads/feature", { anchor: "end", size: 13 });
c.arrow([x0 - 4, y - 40], [cc[3].x + R, y - R - 4], {
  color: c.color(LIVE),
  head: 7,
});

// pin ref: written at close/merge, still points at the recorded commit
c.text(cc[1].x + R, y + R + 60, "refs/zatudan/pr/1/head", {
  anchor: "middle",
  size: 13,
});
c.arrow([cc[1].x + R, y + R + 50], [cc[1].x + R, y + R + 6], {
  color: c.color(PIN),
  head: 7,
  width: 2.5,
});
c.highlight(cc[1], { mode: "ring", color: c.color(PIN) });

// state captions
c.text(cc[1].x + R, y + R + 86, "closed at this commit — kept forever", {
  anchor: "middle",
  size: 12,
  opacity: 0.75,
});
c.text(cc[3].x + 2 * R + 8, y - 30, "branch moved / can be deleted", {
  size: 12,
  opacity: 0.75,
});

await writeFile(
  new URL("../build/fig-pr-pin.svg", import.meta.url),
  c.toString({
    label: "close・merge 時に記録された head コミットを pin ref が保持し続ける図",
  }),
);
