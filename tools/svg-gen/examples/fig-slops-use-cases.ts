// fig-slops-use-cases.ts -- every slops article (as of 2026-11-05) placed by
// date (x) and by the use case it was written for (row). Row position carries
// the category; hue repeats it for colorful mode. The point is when each kind
// of article appears: feature reports fill October, while claim-examining and
// meta articles only show up in the last days.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas({ margin: 12 });

const cats = [
  "変更の報告",
  "詰まった経緯",
  "実験・比較",
  "実現性の調査",
  "他人の成果物を読む",
  "任せた作業の記録",
  "主張の検討",
  "書き方そのもの",
  "記法の見本",
];

// [day of month (Oct=10-31, Nov=1-5 as 32-36), category]
const D = (m: number, d: number) => (m === 10 ? d : 31 + d);
const articles: [number, number][] = [
  [D(10, 16), 0], [D(10, 17), 0], [D(10, 18), 0], [D(10, 19), 0], [D(10, 20), 0],
  [D(10, 22), 0], [D(10, 24), 0], [D(10, 25), 0], [D(10, 25), 0], [D(10, 28), 0],
  [D(10, 29), 0], [D(10, 31), 0],
  [D(10, 21), 1], [D(10, 28), 1],
  [D(10, 26), 2], [D(10, 27), 2], [D(10, 27), 2], [D(10, 31), 2], [D(11, 1), 2],
  [D(11, 3), 2], [D(11, 3), 2],
  [D(11, 3), 3],
  [D(11, 3), 4],
  [D(10, 30), 5],
  [D(11, 3), 6], [D(11, 5), 6],
  [D(10, 27), 7], [D(11, 5), 7], [D(11, 5), 7],
  [D(10, 14), 8], [D(10, 15), 8], [D(10, 22), 8],
];
assert.equal(articles.length, 32, "31 existing articles plus this one");

const X0 = 150;
// right margin so the 11/5 cluster of three fits
const DAY = 20;
const ROW = 24;
const Y0 = 40;
const first = D(10, 14);
const x = (d: number) => X0 + (d - first) * DAY + DAY / 2;

c.text(10, 14, "slops の記事を、書かれた目的ごとに日付順で並べる", { size: 13 });

cats.forEach((name, k) => {
  const y = Y0 + k * ROW;
  c.text(X0 - 10, y, name, { anchor: "end", baseline: "central", size: 11 });
  c.line([X0, y], [x(D(11, 5)) + DAY / 2, y], { opacity: 0.15 });
});

const counts = new Map<string, number>();
for (const [d, k] of articles) counts.set(`${d}:${k}`, (counts.get(`${d}:${k}`) ?? 0) + 1);
const seen = new Map<string, number>();
for (const [d, k] of articles) {
  const key = `${d}:${k}`;
  const n = seen.get(key) ?? 0;
  seen.set(key, n + 1);
  // same-day articles in one row sit side by side
  const dx = (n - ((counts.get(key) ?? 1) - 1) / 2) * 11;
  c.circle(x(d) + dx, Y0 + k * ROW, 5, {
    color: c.color(k % 6),
    width: 2,
    dash: k >= 6 ? "2 2" : undefined,
  });
}

// date axis
const yAxis = Y0 + cats.length * ROW;
c.line([X0, yAxis], [x(D(11, 5)) + DAY / 2, yAxis], { opacity: 0.6 });
for (const [label, d] of [["10/14", D(10, 14)], ["10/21", D(10, 21)], ["10/28", D(10, 28)], ["11/1", D(11, 1)], ["11/5", D(11, 5)]] as const) {
  c.line([x(d), yAxis], [x(d), yAxis + 4], { opacity: 0.6 });
  c.text(x(d), yAxis + 16, label, { anchor: "middle", size: 11, opacity: 0.75 });
}
// mark issue #133's target
const tx = x(D(11, 5));
c.line([tx - 9, Y0 + 6 * ROW - 13], [tx - 4, Y0 + 6 * ROW - 7], { opacity: 0.6 });
c.text(tx - 11, Y0 + 6 * ROW - 15, "#133 が指した記事", { anchor: "end", size: 10, opacity: 0.75 });

await writeFile(
  new URL("../build/fig-slops-use-cases.svg", import.meta.url),
  c.toString({
    label:
      "slops articles by date and use case: twelve feature reports spread through October; claim-examining and meta articles appear only from Nov 3",
  }),
);
