// svg.ts -- a tiny builder for small concept figures.
//
// The point is not a DSL: it is that no coordinate is ever written twice.
// A box owns its position, an arrow takes anchors (`anchor(shape, "e")`),
// so a line endpoint cannot drift away from the shape it is meant to
// touch. The canvas derives its own viewBox from what was drawn, so a
// label cannot silently fall outside it.

export type Side = "n" | "s" | "e" | "w";
export type Point = [x: number, y: number];

export interface Shape {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string | string[];
}

export interface ShapeOptions {
  label?: string | string[];
  dash?: string;
  opacity?: number;
  size?: number;
  width?: number;
  // underline the label text, not the box.
  underline?: boolean | number;
}

export interface BoxOptions extends ShapeOptions {
  rx?: number;
  padX?: number;
}

export interface TextOptions {
  anchor?: "start" | "middle" | "end";
  baseline?: "central";
  size?: number;
  opacity?: number;
  // underline draws a stroke under the text, sized from its estimated
  // width; `true` uses width 2, a number picks the stroke width.
  underline?: boolean | number;
}

export interface StrokeOptions {
  dash?: string;
  opacity?: number;
  width?: number;
}

export interface ArrowOptions extends StrokeOptions {
  via?: Point[];
  head?: number;
  heads?: "end" | "start" | "both" | "none";
  // split: draw two opposing arrows offset `split` px apart, instead of
  // one line — the request/response notation of sequence diagrams.
  split?: number;
  // gap pulls the ends back this many px along the edge direction, so
  // arrowheads stop just short of the shape they point at.
  gap?: number;
  gapStart?: number;
  gapEnd?: number;
}

export interface LineOptions extends StrokeOptions {
  via?: Point[];
  gap?: number;
  gapStart?: number;
  gapEnd?: number;
}

const ASCII_W = 0.55;
const CJK_W = 1.0;

export function textWidth(s: string, size: number): number {
  let w = 0;
  for (const ch of String(s)) {
    w += (ch.codePointAt(0)! > 0x2e80 ? CJK_W : ASCII_W) * size;
  }
  return w;
}

const esc = (s: string | number): string =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Pull a polyline's ends toward its middle by `start`/`end` px.
function trimEnds(pts: Point[], start: number, end: number): Point[] {
  const out = pts.slice() as Point[];
  if (start > 0 && out.length > 1) {
    const d = Math.hypot(out[1][0] - out[0][0], out[1][1] - out[0][1]) || 1;
    out[0] = [out[0][0] + ((out[1][0] - out[0][0]) / d) * start, out[0][1] + ((out[1][1] - out[0][1]) / d) * start];
  }
  const n = out.length;
  if (end > 0 && n > 1) {
    const d = Math.hypot(out[n - 1][0] - out[n - 2][0], out[n - 1][1] - out[n - 2][1]) || 1;
    out[n - 1] = [out[n - 1][0] - ((out[n - 1][0] - out[n - 2][0]) / d) * end, out[n - 1][1] - ((out[n - 1][1] - out[n - 2][1]) / d) * end];
  }
  return out;
}

const SIDES: Record<Side, (b: Shape) => Point> = {
  n: (b) => [b.x + b.w / 2, b.y],
  s: (b) => [b.x + b.w / 2, b.y + b.h],
  w: (b) => [b.x, b.y + b.h / 2],
  e: (b) => [b.x + b.w, b.y + b.h / 2],
};

export class Canvas {
  private margin: number;
  private backdrop: string[] = [];
  private parts: string[] = [];
  private minX = Infinity;
  private minY = Infinity;
  private maxX = -Infinity;
  private maxY = -Infinity;

  constructor({ margin = 10 }: { margin?: number } = {}) {
    this.margin = margin;
  }

  private cover(...pts: Point[]): void {
    for (const [x, y] of pts) {
      if (x < this.minX) this.minX = x;
      if (y < this.minY) this.minY = y;
      if (x > this.maxX) this.maxX = x;
      if (y > this.maxY) this.maxY = y;
    }
  }

  private strokeAttrs({ dash, opacity, width }: StrokeOptions): string {
    const w = width != null && width !== 1.5 ? ` stroke-width="${width}"` : ` stroke-width="1.5"`;
    const d = dash ? ` stroke-dasharray="${dash}"` : "";
    const o = opacity != null ? ` opacity="${opacity}"` : "";
    return w + d + o;
  }

  // Shapes return {x, y, w, h, label?}; anchors and placement read from it.
  // Pass w: "auto" to size the box to its widest label line (+padX each side).
  private labelLines(cx: number, cy: number, label: string | string[], size: number, o: { opacity?: number; underline?: boolean | number } = {}): void {
    const lines = Array.isArray(label) ? label : [label];
    const lh = size * 1.3;
    lines.forEach((s, i) =>
      this.text(cx, cy + (i - (lines.length - 1) / 2) * lh, s, {
        anchor: "middle",
        baseline: "central",
        size,
        opacity: o.opacity,
        underline: o.underline,
      }),
    );
  }

  box(x: number, y: number, w: number | "auto", h: number, { label, rx = 8, padX = 16, size = 14, ...o }: BoxOptions = {}): Shape {
    if (w === "auto") {
      if (label == null) throw new Error('box w="auto" needs a label');
      const lines = Array.isArray(label) ? label : [label];
      w = Math.max(...lines.map((s) => textWidth(s, size))) + 2 * padX;
    }
    this.parts.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"` +
        ` fill="none" stroke="currentColor"${this.strokeAttrs(o)}/>`,
    );
    if (label != null) {
      this.labelLines(x + w / 2, y + h / 2, label, size, o);
    }
    const shape = { x, y, w, h, label };
    this.cover([x, y], [x + w, y + h]);
    return shape;
  }

  circle(cx: number, cy: number, r: number, { label, size = 14, ...o }: ShapeOptions = {}): Shape {
    this.parts.push(
      `<circle cx="${cx}" cy="${cy}" r="${r}"` +
        ` fill="none" stroke="currentColor"${this.strokeAttrs(o)}/>`,
    );
    if (label != null) {
      this.labelLines(cx, cy, label, size, o);
    }
    const shape = { x: cx - r, y: cy - r, w: 2 * r, h: 2 * r, label };
    this.cover([cx - r, cy - r], [cx + r, cy + r]);
    return shape;
  }

  text(x: number, y: number, s: string | number, { anchor = "start", baseline, size = 14, opacity, underline }: TextOptions = {}): void {
    const a = anchor === "start" ? "" : ` text-anchor="${anchor}"`;
    const bl = baseline ? ` dominant-baseline="${baseline}"` : "";
    const o = opacity != null ? ` opacity="${opacity}"` : "";
    this.parts.push(
      `<text x="${x}" y="${y}" font-size="${size}"${a}${bl} fill="currentColor"${o}>${esc(s)}</text>`,
    );
    const w = textWidth(String(s), size);
    const lx = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
    const ty = baseline === "central" ? y - size / 2 : y - size;
    const by = ty + size * 1.2;
    if (underline) {
      const uw = underline === true ? 2 : underline;
      this.parts.push(
        `<path d="M${lx} ${by + 2} L${lx + w} ${by + 2}" fill="none" stroke="currentColor" stroke-width="${uw}"${o}/>`,
      );
      this.cover([lx, by + 2 + uw / 2]);
    }
    this.cover([lx, ty], [lx + w, by]);
  }

  anchor(shape: Shape, side: Side): Point {
    return SIDES[side](shape);
  }

  center(shape: Shape): Point {
    return [shape.x + shape.w / 2, shape.y + shape.h / 2];
  }

  // Placement helpers: coordinates for a shape next to another.
  rightOf(shape: Shape, gap: number): number {
    return shape.x + shape.w + gap;
  }

  leftOf(shape: Shape, gap: number, w: number): number {
    return shape.x - gap - w;
  }

  below(shape: Shape, gap: number): number {
    return shape.y + shape.h + gap;
  }

  above(shape: Shape, gap: number, h: number): number {
    return shape.y - gap - h;
  }

  arrow(from: Point, to: Point, { via = [], head = 9, heads = "end", split = 0, gap = 3, gapStart, gapEnd, ...o }: ArrowOptions = {}): void {
    if (split > 0) {
      const dx = to[0] - from[0];
      const dy = to[1] - from[1];
      const len = Math.hypot(dx, dy) || 1;
      const nx = (-dy / len) * (split / 2);
      const ny = (dx / len) * (split / 2);
      const shift = ([x, y]: Point, s: number): Point => [x + nx * s, y + ny * s];
      // The forward arrow takes the "above/left of travel" side, like a
      // sequence diagram: request on top, response below.
      this.arrow(shift(from, -1), shift(to, -1), {
        via: via.map((p) => shift(p, -1)),
        head,
        heads: "end",
        gap,
        gapStart,
        gapEnd,
        ...o,
      });
      this.arrow(shift(to, 1), shift(from, 1), {
        via: [...via].reverse().map((p) => shift(p, 1)),
        head,
        heads: "end",
        gap,
        gapStart,
        gapEnd,
        ...o,
      });
      return;
    }
    const pts = trimEnds([from, ...via, to], gapStart ?? gap, gapEnd ?? gap);
    const d = "M" + pts.map(([x, y]) => `${x} ${y}`).join(" L");
    // A head is an open V at `tip`, pointing along (ux, uy).
    const headAt = (tip: Point, seg: Point): string => {
      const [qx, qy] = tip;
      const len = Math.hypot(tip[0] - seg[0], tip[1] - seg[1]) || 1;
      const ux = (tip[0] - seg[0]) / len;
      const uy = (tip[1] - seg[1]) / len;
      const bx = qx - head * ux;
      const by = qy - head * uy;
      const pxn = -uy * head * 0.45;
      const pyn = ux * head * 0.45;
      this.cover([bx + pxn, by + pyn], [bx - pxn, by - pyn]);
      return (
        `<path d="M${bx + pxn} ${by + pyn} L${qx} ${qy} L${bx - pxn} ${by - pyn}"` +
        ` fill="none" stroke="currentColor"${this.strokeAttrs(o)}/>`
      );
    };
    const headsSvg =
      heads === "none"
        ? ""
        : (heads === "end" || heads === "both" ? headAt(pts[pts.length - 1], pts[pts.length - 2]) : "") +
          (heads === "start" || heads === "both" ? headAt(pts[0], pts[1]) : "");
    this.parts.push(
      `<path d="${d}" fill="none" stroke="currentColor"${this.strokeAttrs(o)}/>` + headsSvg,
    );
    this.cover(...pts);
  }

  midpoint(from: Point, to: Point): Point {
    return [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  }

  // A low-key emphasis zone behind a shape. "wash" is a translucent
  // currentColor fill (a grey wash in light theme, a light veil in dark
  // theme); "ring" is a dashed enclosure; both render behind the shape
  // so they never cover its label.
  highlight(
    shape: Shape,
    { pad = 7, opacity = 0.08, mode = "wash", rx }: { pad?: number; opacity?: number; mode?: "wash" | "ring"; rx?: number } = {},
  ): void {
    const x = shape.x - pad;
    const y = shape.y - pad;
    const w = shape.w + 2 * pad;
    const h = shape.h + 2 * pad;
    const r = rx ?? pad + 4;
    const el =
      mode === "ring"
        ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/>`
        : `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="currentColor" fill-opacity="${opacity}" stroke="none"/>`;
    this.backdrop.push(el);
    this.cover([x, y], [x + w, y + h]);
  }

  line(from: Point, to: Point, { via = [], gap = 0, gapStart, gapEnd, ...o }: LineOptions = {}): void {
    const pts = trimEnds([from, ...via, to], gapStart ?? gap, gapEnd ?? gap);
    const d = "M" + pts.map(([x, y]) => `${x} ${y}`).join(" L");
    this.parts.push(
      `<path d="${d}" fill="none" stroke="currentColor"${this.strokeAttrs(o)}/>`,
    );
    this.cover(...pts);
  }

  // path(d) is an escape hatch for curves; caller lists the covered points.
  path(d: string, covered: Point[], o: StrokeOptions = {}): void {
    this.parts.push(
      `<path d="${d}" fill="none" stroke="currentColor"${this.strokeAttrs(o)}/>`,
    );
    this.cover(...covered);
  }

  toString({ width, height, label }: { width?: number; height?: number; label?: string } = {}): string {
    const m = this.margin;
    const w = this.maxX - this.minX + 2 * m;
    const h = this.maxY - this.minY + 2 * m;
    const vb = `${this.minX - m} ${this.minY - m} ${w} ${h}`;
    const size = ` width="${width ?? w.toFixed(0)}" height="${height ?? h.toFixed(0)}"`;
    const aria = label ? ` role="img" aria-label="${esc(label)}"` : "";
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"${size}${aria}>\n` +
      this.backdrop.join("\n") +
      (this.backdrop.length ? "\n" : "") +
      this.parts.join("\n") +
      "\n</svg>\n"
    );
  }
}
