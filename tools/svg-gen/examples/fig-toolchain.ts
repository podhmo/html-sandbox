// fig-toolchain.ts -- the throwaway /tmp tooling behind the merge sweep.
// Left column: how tasks.json was built (gh pr list + ls-remote tips).
// Center: the merge driver loop with its resumable state files.
// Right: GitHub's async merge. Bottom: the supervisor and the repair
// scripts that turn a CONFLICTING PR back into a mergeable one.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas({ margin: 12 });

// -- scan phase (left column) ------------------------------------------
const ghlist = c.box(30, 30, "auto", 36, { label: "gh pr list", color: c.color(0) });
const prs = c.box(30, 90, "auto", 36, { label: "prs.json", color: c.color(0) });
c.arrow(c.anchor(ghlist, "s"), c.anchor(prs, "n"));

const lsr = c.box(30, 150, "auto", 36, { label: "git ls-remote", color: c.color(0) });
const heads = c.box(30, 210, "auto", 40, {
  label: ["orig_heads.txt", "252 tips"],
  color: c.color(0),
});
c.arrow(c.anchor(lsr, "s"), c.anchor(heads, "n"));

const tasks = c.box(230, 140, "auto", 52, {
  label: ["tasks.json", "{num,head,parent_num,…}"],
  color: c.color(1),
});
c.arrow(c.anchor(prs, "e"), c.anchor(tasks, "w"), { via: [[205, 108], [205, 166]] });
c.arrow(c.anchor(heads, "e"), c.anchor(tasks, "s"), { via: [[334, 228]] });
c.text(30, 270, "走査: base→head の解決 + tip凍結 → トポロジカル順のキュー", {
  size: 12,
  opacity: 0.75,
});

// -- driver loop (center) ----------------------------------------------
const mergeall = c.box(460, 120, "auto", 52, {
  label: ["mergeall.py", "enqueue→poll"],
  color: c.color(2),
});
c.arrow(c.anchor(tasks, "e"), c.anchor(mergeall, "w"));

const done = c.box(460, 195, "auto", 36, { label: "merge_done.json", color: c.color(1) });
c.arrow(c.anchor(mergeall, "s"), c.anchor(done, "n"));

const log = c.box(460, 245, "auto", 36, { label: "mergeall.log", color: c.color(1) });
c.arrow(c.anchor(done, "s"), c.anchor(log, "n"));

// -- GitHub (right) -----------------------------------------------------
const gh = c.box(640, 50, "auto", 90, {
  label: ["GitHub", "merge-async", "squash"],
  color: c.color(3),
});
c.arrow(c.anchor(mergeall, "e"), c.anchor(gh, "w"), { split: 5 });

const drive = c.box(640, 195, "auto", 40, {
  label: ["drive.py", "終盤の単発版"],
  color: c.color(2),
});
c.arrow(c.anchor(drive, "n"), c.anchor(gh, "s"), { dash: "4 4" });

// -- supervisor + repair (bottom) ---------------------------------------
const watch = c.box(230, 285, "auto", 44, {
  label: ["watchmerge.sh", "再起動+衝突検出"],
  color: c.color(4),
});
c.arrow(c.anchor(log, "w"), c.anchor(watch, "e"), { via: [[420, 263], [420, 307]] });
c.text(230, 258, "log: merge conflict", { size: 12, opacity: 0.75 });

const fix = c.box(430, 295, "auto", 56, {
  label: ["fixconflict.py / fixone.sh", "(restack.py, fix_budgets)"],
  color: c.color(5),
});
c.arrow(c.anchor(watch, "e"), c.anchor(fix, "w"));

// the repaired head goes back; GitHub sees the PR mergeable again
c.arrow(c.anchor(fix, "e"), c.anchor(gh, "e"), { via: [[850, 323], [850, 95]] });
c.text(858, 215, "force-push → mergeableに戻す", { size: 12, opacity: 0.75 });

c.text(30, 370, "青=走査  橙=状態/キュー  緑=ドライバ  紫=監督  空色=修復  朱=GitHub", {
  size: 12,
  opacity: 0.75,
});
c.text(430, 385, "修復ルール: budgets→--theirs, TODO→--union+dedupe / それ以外は停止して人間へ", {
  size: 12,
  opacity: 0.75,
});

assert.ok(true);
await writeFile(
  new URL("../build/fig-toolchain.svg", import.meta.url),
  c.toString({ label: "throwaway /tmp tooling: scan, queue, merge loop, supervisor, repair" }),
);
