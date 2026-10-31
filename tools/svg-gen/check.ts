// check.ts -- lint an SVG for the breakage patterns recorded in
// slops/2026-10-27-writing-slops.md/03-svg-pitfalls.md.
//
// What it catches:
//   - elements or estimated text boxes outside the viewBox
//     ("text-anchor=end label clipped at the edge")
//   - duplicate id attributes inside one file
//     ("<pattern>/<linearGradient> ids collide on the combined page")
//   - constructs the svg fence must not contain
//     (script, foreignObject, event handlers, remote refs)
//   - text whose estimated box overflows the shape it sits in
//     ("label wider than its box")
//   - literal colors mixed into a currentColor figure
//     (dark-theme legends no longer match the strokes)
//   - missing role/aria-label
//
// Usage: node check.ts file.svg [more.svg ...]

import { readFile } from "node:fs/promises";
import { textWidth } from "./svg.ts";

type Level = "FAIL" | "WARN";
interface Result {
  level: Level;
  file: string;
  msg: string;
}

const results: Result[] = [];
const report = (level: Level, file: string, msg: string): void => {
  results.push({ level, file, msg });
  console.log(`${level} ${file}: ${msg}`);
};

const TAG_RE = /<(\w[\w:-]*)([^<>]*?)\/?>/gs;
const ATTR_RE = /([\w:-]+)="([^"]*)"/g;
const NUM = "-?\\d*\\.?\\d+(?:e-?\\d+)?";

function attrs(s: string): Record<string, string> {
  const o: Record<string, string> = {};
  for (const m of s.matchAll(ATTR_RE)) o[m[1]] = m[2];
  return o;
}

function nums(s: string): number[] {
  return (s.match(new RegExp(NUM, "g")) || []).map(Number);
}

// Collect the coordinate pairs a `d` attribute uses. Only the absolute
// commands this kit emits (M, L, H, V, Z) are understood; anything else is
// reported as unchecked rather than silently misparsed.
function pathPoints(d: string): { pts: [number | null, number | null][]; bad: string | null } {
  const tokens = d.match(new RegExp(`[MLHVZmlhvzCSQTAa]|${NUM}`, "g")) || [];
  const pts: [number | null, number | null][] = [];
  const pending: number[] = [];
  let bad: string | null = null;
  let cmd: string | null = null;
  for (const t of tokens) {
    if (/^[A-Za-z]$/.test(t)) {
      if (!"MLHVZ".includes(t) && !bad) bad = t;
      cmd = t;
      continue;
    }
    const n = Number(t);
    if (cmd === "H" || cmd === "V") {
      pts.push(cmd === "H" ? [n, null] : [null, n]);
      continue;
    }
    if (cmd === "M" || cmd === "L") {
      pending.push(n);
      if (pending.length === 2) pts.push([pending.shift()!, pending.shift()!]);
      continue;
    }
    if (cmd && cmd === cmd.toLowerCase()) bad ??= cmd;
    else if (cmd && !bad && !"MLHV".includes(cmd)) bad = cmd;
  }
  return { pts, bad };
}

async function check(file: string): Promise<void> {
  const svg = await readFile(file, "utf8");

  const banned: [RegExp, string][] = [
    [/<script/i, "<script> is not allowed in an svg fence"],
    [/<foreignObject/i, "<foreignObject> is not allowed"],
    [/\son\w+=/i, "event handler attribute is not allowed"],
    [/xlink:href|href=/i, "href (remote or internal reference) is not allowed"],
    [/url\(|@import|data:/i, "external resource reference is not allowed"],
  ];
  for (const [re, msg] of banned) {
    if (re.test(svg)) report("FAIL", file, msg);
  }

  const svgTag = svg.match(/<svg\b([^>]*)>/);
  if (!svgTag) {
    report("FAIL", file, "no <svg> element");
    return;
  }
  const svgAttrs = attrs(svgTag[1]);
  const vb = nums(svgAttrs.viewBox || "");
  if (vb.length !== 4) {
    report("FAIL", file, "missing or malformed viewBox");
    return;
  }
  const [vx, vy, vw, vh] = vb;
  const inside = (x: number, y: number): boolean =>
    x >= vx && x <= vx + vw && y >= vy && y <= vy + vh;
  const outside = (what: string, x: number, y: number): void =>
    report("FAIL", file, `${what} at (${x.toFixed(1)}, ${y.toFixed(1)}) outside viewBox`);

  if (!/role="img"|aria-label=|<title>/.test(svg)) {
    report("WARN", file, "no aria-label, role=img, or <title>");
  }

  const ids = new Map<string, string>();
  const colors = new Set<string>();
  let usesCurrentColor = false;
  let textCount = 0;
  // Containers and texts are checked against each other after the scan.
  interface Bounds { x: number; y: number; w: number; h: number; ellipse: boolean }
  const containers: Bounds[] = [];
  interface TextBox { body: string; ax: number; ay: number; lx: number; ty: number; rx: number; by: number }
  const texts: TextBox[] = [];

  for (const m of svg.matchAll(TAG_RE)) {
    const [, tag, raw] = m;
    const a = attrs(raw);
    if (a.id) {
      if (ids.has(a.id)) {
        report("FAIL", file, `duplicate id "${a.id}" (first seen in <${ids.get(a.id)}>)`);
      }
      ids.set(a.id, tag);
    }
    for (const k of ["stroke", "fill", "color"] as const) {
      if (a[k] === "currentColor") usesCurrentColor = true;
      else if (a[k] && a[k] !== "none" && !/^url\(/.test(a[k])) colors.add(a[k]);
    }

    switch (tag) {
      case "rect": {
        const [x, y, w, h] = [+a.x || 0, +a.y || 0, +a.width || 0, +a.height || 0];
        containers.push({ x, y, w, h, ellipse: false });
        for (const [px, py] of [[x, y], [x + w, y + h]]) {
          if (!inside(px, py)) outside(`<rect> corner`, px, py);
        }
        break;
      }
      case "circle": {
        const [cx, cy, r] = [+a.cx || 0, +a.cy || 0, +a.r || 0];
        containers.push({ x: cx - r, y: cy - r, w: 2 * r, h: 2 * r, ellipse: true });
        for (const [px, py] of [[cx - r, cy - r], [cx + r, cy + r]]) {
          if (!inside(px, py)) outside(`<circle> edge`, px, py);
        }
        break;
      }
      case "ellipse": {
        const [cx, cy, rx, ry] = [+a.cx || 0, +a.cy || 0, +a.rx || 0, +a.ry || 0];
        containers.push({ x: cx - rx, y: cy - ry, w: 2 * rx, h: 2 * ry, ellipse: true });
        for (const [px, py] of [[cx - rx, cy - ry], [cx + rx, cy + ry]]) {
          if (!inside(px, py)) outside(`<ellipse> edge`, px, py);
        }
        break;
      }
      case "line": {
        for (const [px, py] of [[+a.x1, +a.y1], [+a.x2, +a.y2]]) {
          if (!inside(px, py)) outside(`<line> end`, px, py);
        }
        break;
      }
      case "polyline":
      case "polygon": {
        const ns = nums(a.points || "");
        for (let i = 0; i + 1 < ns.length; i += 2) {
          if (!inside(ns[i], ns[i + 1])) outside(`<${tag}> point`, ns[i], ns[i + 1]);
        }
        break;
      }
      case "path": {
        const { pts, bad } = pathPoints(a.d || "");
        if (bad) {
          report("WARN", file, `<path> uses '${bad}' commands; coordinates not checked`);
        }
        let last: [number, number] = [0, 0];
        for (const [px, py] of pts) {
          const x = px ?? last[0];
          const y = py ?? last[1];
          last = [x, y];
          if (!inside(x, y)) outside(`<path> point`, x, y);
        }
        break;
      }
      case "text": {
        textCount++;
        const size = +a["font-size"] || 16;
        const x = +a.x || 0;
        const y = +a.y || 0;
        const close = svg.indexOf("</text>", m.index);
        const body =
          close < 0
            ? ""
            : svg
                .slice(m.index! + m[0].length, close)
                .replace(/<[^>]*>/g, "")
                .trim();
        const w = textWidth(body, size);
        const ax = a["text-anchor"];
        const lx = ax === "middle" ? x - w / 2 : ax === "end" ? x - w : x;
        const central = /dominant-baseline="central"/.test(m[0]);
        const ty = central ? y - size / 2 : y - size;
        texts.push({ body, ax: x, ay: y, lx, ty, rx: lx + w, by: ty + size * 1.2 });
        for (const [px, py] of [[lx, ty], [lx + w, ty + size * 1.2]]) {
          if (!inside(px, py)) outside(`<text> "${body}" box`, px, py);
        }
        break;
      }
    }
  }

  // A text whose anchor point sits inside a shape is meant to be inside
  // it; flag when the estimated text box escapes that shape.
  for (const t of texts) {
    const mine = containers
      .filter((b) => t.ax >= b.x && t.ax <= b.x + b.w && t.ay >= b.y && t.ay <= b.y + b.h)
      .sort((a, b) => a.w * a.h - b.w * b.h)[0];
    if (!mine) continue;
    if (mine.ellipse) {
      const cx = mine.x + mine.w / 2;
      const cy = mine.y + mine.h / 2;
      const inEllipse = (px: number, py: number) =>
        ((px - cx) / (mine.w / 2)) ** 2 + ((py - cy) / (mine.h / 2)) ** 2 <= 1;
      for (const [px, py] of [[t.lx, t.ty], [t.rx, t.ty], [t.lx, t.by], [t.rx, t.by]]) {
        if (!inEllipse(px, py)) {
          report("FAIL", file, `<text> "${t.body}" overflows its ellipse at (${px.toFixed(1)}, ${py.toFixed(1)})`);
          break;
        }
      }
    } else if (t.lx < mine.x || t.rx > mine.x + mine.w || t.ty < mine.y || t.by > mine.y + mine.h) {
      report(
        "FAIL",
        file,
        `<text> "${t.body}" estimated box (${t.lx.toFixed(1)},${t.ty.toFixed(1)})-(${t.rx.toFixed(1)},${t.by.toFixed(1)}) overflows its shape (${mine.x},${mine.y})-(${mine.x + mine.w},${mine.y + mine.h})`,
      );
    }
  }

  if (textCount === 0) {
    report("WARN", file, "no <text> elements; labels will not be searchable");
  }
  if (usesCurrentColor && colors.size > 0) {
    report(
      "WARN",
      file,
      `literal color(s) ${[...colors].join(", ")} mixed into a currentColor figure`,
    );
  }
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage: node check.ts file.svg ...");
  process.exit(2);
}
for (const f of files) await check(f);

const failed = results.filter((r) => r.level === "FAIL").length;
const warned = results.filter((r) => r.level === "WARN").length;
console.log(`\n${files.length} file(s), ${failed} failure(s), ${warned} warning(s)`);
process.exit(failed ? 1 : 0);
