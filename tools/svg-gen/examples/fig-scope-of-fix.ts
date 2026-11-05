// fig-scope-of-fix.ts -- the retry's central fact in space: the error
// names the driver, but the driver sits outside the region the agent can
// change. What it can change (a torch version) is inside. Position
// carries "reachable / not reachable", and neither arrow is a process
// step -- one is the fix that ran, one is the cause it skipped.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas({ margin: 14 });

// the log line the agent saw
const log = c.box(10, 110, "auto", 46, {
  label: ["CUDA initialization:", "driver too old"],
  size: 12,
});

// the host, which the agent cannot modify, and the sandbox inside it
const host = c.box(200, 26, 320, 250, { dash: "6 5", rx: 14 });
c.text(208, 46, "変更できない領域（ホスト / Windows）", { size: 11, opacity: 0.7 });

const sandbox = c.box(220, 60, 280, 134, { color: c.color(2), rx: 12 });
c.text(228, 78, "変更できる領域（WSL2, root なし）", { size: 11, opacity: 0.7 });

// inside: the action that was taken
const pin = c.box(238, 96, "auto", 44, {
  label: ["torch を cu128 に", "下げる"],
  color: c.color(2),
  size: 12,
});
// inside, but out of reach without root
const apt = c.box(238, 150, "auto", 34, {
  label: ["apt で直す"],
  dash: "4 4",
  size: 12,
  opacity: 0.6,
});
// outside the sandbox, inside the host: the actual cause
const driver = c.box(232, 212, "auto", 44, {
  label: ["ドライバを", "更新する"],
  color: c.color(3),
  dash: "4 4",
  size: 12,
});

c.arrow(c.anchor(log, "e"), [pin.x, pin.y + pin.h / 2], { color: c.color(2) });
// the skipped cause crosses the host border once, entering from below
c.arrow([log.x + log.w / 2, log.y + log.h], [driver.x + driver.w / 2, driver.y + driver.h], {
  via: [
    [log.x + log.w / 2, 300],
    [driver.x + driver.w / 2, 300],
  ],
  color: c.color(3),
  dash: "5 4",
});

// annotations sit beside the two boxes, so each names its own target
c.text(pin.x + pin.w + 8, pin.y + pin.h / 2, "実行された", { size: 11, opacity: 0.75, baseline: "central" });
c.text(driver.x + driver.w + 8, driver.y + driver.h / 2, "原因（範囲の外）", {
  size: 11,
  opacity: 0.75,
  baseline: "central",
});

// the two facts that make the boundary real, not a preference
c.text(10, 330, "境界は方針: sudo なし・automount=false・interop=false・/mnt/c は空", {
  size: 11,
  opacity: 0.7,
});

assert.ok(host.x < sandbox.x && sandbox.x + sandbox.w < host.x + host.w, "sandbox sits inside the host region");
assert.ok(
  sandbox.y + sandbox.h < driver.y && driver.y + driver.h < host.y + host.h,
  "the driver box is inside the host but below the sandbox",
);

await writeFile(
  new URL("../build/fig-scope-of-fix.svg", import.meta.url),
  c.toString({
    label:
      "a log line 'driver too old' points two ways: to a torch version inside the region the agent can change, and to a driver update outside it in the host",
  }),
);
