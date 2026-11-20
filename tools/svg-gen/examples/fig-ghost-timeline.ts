// fig-ghost-timeline.ts -- the gist-cli session on one time axis. Code
// commits and report commits sit on separate lanes; the thick bar on the
// report lane is the span during which the report named `parse_files`.
// The code lane has no such bar: the function never existed in a commit.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas();
const CODE = c.color(0);
const DOC = c.color(1);
const GHOST = c.color(3);

const X0 = 110;
const PX = 22; // px per minute, t = minutes since 01:42:00 JST
const x = (hms: string): number => {
  const [h, m, s] = hms.split(":").map(Number);
  return X0 + ((h * 60 + m - (1 * 60 + 42)) + s / 60 + (h < 1 ? 24 * 60 : 0)) * PX;
};

const codeY = 70;
const docY = 150;
const axisY = 200;

c.text(0, 0, "書き直したコードと、振り返りレポートの時間軸", { size: 15 });
c.text(0, 20, "podhmo/gom PR #89 のコミット時刻 (JST)。点は 1 コミット", { size: 11, opacity: 0.65 });

c.text(X0 - 12, codeY, "コード", { anchor: "end", baseline: "central", size: 12 });
c.text(X0 - 12, docY, "レポート", { anchor: "end", baseline: "central", size: 12 });
const end = x("02:11:30");
c.line([X0, codeY], [end, codeY], { opacity: 0.3 });
c.line([X0, docY], [end, docY], { opacity: 0.3 });

// The span the report carried the ghost name: 44428e7 .. 57391df.
const g0 = x("01:45:53");
const g1 = x("02:10:26");
c.raw(
  `<rect x="${g0}" y="${docY - 7}" width="${g1 - g0}" height="14" rx="3" fill="${GHOST}" opacity="0.35"/>`,
  [[g0, docY - 7], [g1, docY + 7]],
);
c.text((g0 + g1) / 2, docY + 24, "本文に parse_files と [\"--gist\"] の腕がある", { anchor: "middle", size: 11 });
c.text((g0 + g1) / 2, codeY - 16, "コードには一度も現れない (git log -S)", { anchor: "middle", size: 11, opacity: 0.75 });

function dot(t: string, y: number, color: string, k = 0): void {
  const cx = x(t);
  const cy = y + k * 9;
  c.raw(`<circle cx="${cx}" cy="${cy}" r="4.5" fill="${color}"/>`, [[cx - 5, cy - 5], [cx + 5, cy + 5]]);
}

// Code commits; same-second pairs are stacked downward.
const code = ["01:42:26", "01:42:47", "01:43:28", "01:43:37", "01:43:49", "01:44:01", "01:44:08", "01:44:29", "01:50:01"];
code.forEach((t) => dot(t, codeY, CODE));
dot("01:43:49", codeY, CODE, 1);
dot("01:44:08", codeY, CODE, 1);
// Report commits: written, refined, corrected.
["01:45:53", "02:06:07", "02:10:26"].forEach((t) => dot(t, docY, DOC));

function note(t: string, y: number, lines: string[], up: boolean): void {
  const cx = x(t);
  const ty = up ? y - 34 : y + 46;
  c.line([cx, up ? y - 8 : y + 8], [cx, up ? ty + 6 : ty - 12], { opacity: 0.45, width: 1 });
  lines.forEach((s, i) => c.text(cx, ty + i * 14, s, { anchor: "middle", size: 10, opacity: 0.85 }));
}
note("01:43:00", codeY, ["全体→局所の 10 コミット"], true);
note("01:50:01", codeY, ["レビュー指摘の修正"], true);
note("01:45:53", docY, ["レポートを書く"], false);
note("02:06:07", docY, ["refine-slops", "「もう存在しません」"], false);
note("02:10:26", docY, ["指摘を受けて", "履歴を確認し訂正"], false);

// Context summary: only known to fall between the last edit and 606e73e.
const s0 = x("01:47:00");
const s1 = x("01:50:00");
c.raw(
  `<rect x="${s0}" y="${codeY + 18}" width="${s1 - s0}" height="${docY - codeY - 36}" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="3 3" opacity="0.5"/>`,
  [[s0, codeY + 18], [s1, docY - 18]],
);
c.text((s0 + s1) / 2, (codeY + docY) / 2, "要約", { anchor: "middle", baseline: "central", size: 10, opacity: 0.8 });

// Time axis.
c.line([X0, axisY + 50], [end, axisY + 50], { opacity: 0.45, width: 1 });
for (const t of ["01:45:00", "01:50:00", "01:55:00", "02:00:00", "02:05:00", "02:10:00"]) {
  const tx = x(t);
  c.line([tx, axisY + 50], [tx, axisY + 54], { opacity: 0.5, width: 1 });
  c.text(tx, axisY + 68, t.slice(0, 5), { anchor: "middle", size: 10, opacity: 0.7 });
}
c.text(0, axisY + 92, "点線の枠は文脈の要約が起きた区間。正確な時刻は残っておらず、前後のコミットからの推定", { size: 10, opacity: 0.6 });
c.text(0, axisY + 108, "出典: git log origin/main..HEAD (podhmo/gom) / 生成: fig-ghost-timeline.ts", { size: 10, opacity: 0.55 });

assert.ok(x("02:10:26") < end, "the last commit fits on the lanes");
assert.ok(g0 > x("01:44:29"), "the report was written after the last structural code commit");

await writeFile(
  new URL("../build/fig-ghost-timeline.svg", import.meta.url),
  c.toString({
    label: "コードとレポートのコミットの時間軸。レポートには 01:45 から 02:10 まで parse_files が書かれていたが、コードには一度も現れない",
  }),
);
