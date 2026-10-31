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
  label?: string;
}

export interface ShapeOptions {
  label?: string;
  dash?: string;
  opacity?: number;
  size?: number;
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
}

export interface StrokeOptions {
  dash?: string;
  opacity?: number;
}

export interface ArrowOptions extends StrokeOptions {
  via?: Point[];
  head?: number;
}

export interface LineOptions extends StrokeOptions {
  via?: Point[];
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

const SIDES: Record<Side, (b: Shape) => Point> = {
  n: (b) => [b.x + b.w / 2, b.y],
  s: (b) => [b.x + b.w / 2, b.y + b.h],
  w: (b) => [b.x, b.y + b.h / 2],
  e: (b) => [b.x + b.w, b.y + b.h / 2],
};

export class Canvas {
  private margin: number;
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

  private strokeAttrs({ dash, opacity }: StrokeOptions): string {
    const d = dash ? ` stroke-dasharray="${dash}"` : "";
    const o = opacity != null ? ` opacity="${opacity}"` : "";
    return d + o;
  }

  // Shapes return {x, y, w, h, label?}; anchors and placement read from it.
  // Pass w: "auto" to size the box to its label (plus padX on each side).
  box(x: number, y: number, w: number | "auto", h: number, { label, rx = 8, padX = 16, size = 14, ...o }: BoxOptions = {}): Shape {
    if (w === "auto") {
      if (label == null) throw new Error('box w="auto" needs a label');
      w = textWidth(label, size) + 2 * padX;
    }
    this.parts.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"` +
        ` fill="none" stroke="currentColor" stroke-width="1.5"${this.strokeAttrs(o)}/>`,
    );
    if (label != null) {
      this.text(x + w / 2, y + h / 2, label, {
        anchor: "middle",
        baseline: "central",
        size,
        opacity: o.opacity,
      });
    }
    const shape = { x, y, w, h, label };
    this.cover([x, y], [x + w, y + h]);
    return shape;
  }

  circle(cx: number, cy: number, r: number, { label, size = 14, ...o }: ShapeOptions = {}): Shape {
    this.parts.push(
      `<circle cx="${cx}" cy="${cy}" r="${r}"` +
        ` fill="none" stroke="currentColor" stroke-width="1.5"${this.strokeAttrs(o)}/>`,
    );
    if (label != null) {
      this.text(cx, cy, label, {
        anchor: "middle",
        baseline: "central",
        size,
        opacity: o.opacity,
      });
    }
    const shape = { x: cx - r, y: cy - r, w: 2 * r, h: 2 * r, label };
    this.cover([cx - r, cy - r], [cx + r, cy + r]);
    return shape;
  }

  text(x: number, y: number, s: string | number, { anchor = "start", baseline, size = 14, opacity }: TextOptions = {}): void {
    const a = anchor === "start" ? "" : ` text-anchor="${anchor}"`;
    const bl = baseline ? ` dominant-baseline="${baseline}"` : "";
    const o = opacity != null ? ` opacity="${opacity}"` : "";
    this.parts.push(
      `<text x="${x}" y="${y}" font-size="${size}"${a}${bl} fill="currentColor"${o}>${esc(s)}</text>`,
    );
    const w = textWidth(String(s), size);
    const lx = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
    const ty = baseline === "central" ? y - size / 2 : y - size;
    this.cover([lx, ty], [lx + w, ty + size * 1.2]);
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

  arrow(from: Point, to: Point, { via = [], head = 9, ...o }: ArrowOptions = {}): void {
    const pts: Point[] = [from, ...via, to];
    const d = "M" + pts.map(([x, y]) => `${x} ${y}`).join(" L");
    const [px, py] = pts[pts.length - 2];
    const [qx, qy] = to;
    const len = Math.hypot(qx - px, qy - py) || 1;
    const ux = (qx - px) / len;
    const uy = (qy - py) / len;
    const bx = qx - head * ux;
    const by = qy - head * uy;
    const pxn = -uy * head * 0.45;
    const pyn = ux * head * 0.45;
    this.parts.push(
      `<path d="${d}" fill="none" stroke="currentColor" stroke-width="1.5"${this.strokeAttrs(o)}/>` +
        `<path d="M${bx + pxn} ${by + pyn} L${qx} ${qy} L${bx - pxn} ${by - pyn}"` +
        ` fill="none" stroke="currentColor" stroke-width="1.5"${this.strokeAttrs(o)}/>`,
    );
    this.cover(...pts, [bx + pxn, by + pyn], [bx - pxn, by - pyn]);
  }

  line(from: Point, to: Point, { via = [], ...o }: LineOptions = {}): void {
    const pts: Point[] = [from, ...via, to];
    const d = "M" + pts.map(([x, y]) => `${x} ${y}`).join(" L");
    this.parts.push(
      `<path d="${d}" fill="none" stroke="currentColor" stroke-width="1.5"${this.strokeAttrs(o)}/>`,
    );
    this.cover(...pts);
  }

  // path(d) is an escape hatch for curves; caller lists the covered points.
  path(d: string, covered: Point[], o: StrokeOptions = {}): void {
    this.parts.push(
      `<path d="${d}" fill="none" stroke="currentColor" stroke-width="1.5"${this.strokeAttrs(o)}/>`,
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
      this.parts.join("\n") +
      "\n</svg>\n"
    );
  }
}
