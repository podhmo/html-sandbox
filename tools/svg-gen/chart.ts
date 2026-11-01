// chart.ts -- data-figure helpers for svg-gen: scales, axes, and series
// for statistical figures (the L1 side of the figure guideline in
// docs/sketch/ja/figure-guidelines.md). svg.ts still owns drawing and
// the viewBox; this file owns data -> pixel mapping and the chart
// frame, and makes the "required metadata" required in the type:
// every Plot needs {title, subtitle, footnote} up front.

import { Canvas, textWidth } from "./svg.ts";
import type { Point, StrokeOptions } from "./svg.ts";

// Deterministic PRNG (mulberry32) so a figure's virtual data is
// reproducible from its seed alone.
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller on top of rng().
export function gauss(rand: () => number): () => number {
  return () => {
    const u = Math.max(rand(), 1e-12);
    const v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
}

export function quantile(sorted: number[], q: number): number {
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

// 1/2/5-style nice ticks covering [lo, hi], about `count` of them.
export function ticks(lo: number, hi: number, count = 5): number[] {
  const raw = (hi - lo) / count;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / p;
  const step = (f >= 5 ? 5 : f >= 2 ? 2 : 1) * p;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + step * 1e-6; v += step) {
    out.push(+v.toPrecision(12));
  }
  return out;
}

// A data->pixel mapping. `log` works on the data value (v > 0 only).
export class Scale {
  lo: number;
  hi: number;
  a: number;
  b: number;
  log: boolean;

  constructor(lo: number, hi: number, a: number, b: number, log = false) {
    this.lo = lo;
    this.hi = hi;
    this.a = a;
    this.b = b;
    this.log = log;
  }

  private spread(): [number, number] {
    return this.log ? [Math.log10(this.lo), Math.log10(this.hi)] : [this.lo, this.hi];
  }

  map(v: number): number {
    const [l, h] = this.spread();
    const x = this.log ? Math.log10(v) : v;
    return this.a + ((x - l) / (h - l)) * (this.b - this.a);
  }

  ticks(count = 5): number[] {
    if (!this.log) return ticks(this.lo, this.hi, count);
    // log axis: mark 1/2/5 of each decade inside the domain.
    const [l, h] = this.spread();
    const out: number[] = [];
    for (let d = Math.floor(l); d <= Math.ceil(h); d++) {
      for (const m of [1, 2, 5]) {
        const v = m * Math.pow(10, d);
        if (v >= this.lo && v <= this.hi) out.push(v);
      }
    }
    return out;
  }
}

export interface ChartMeta {
  title: string; // the conclusion, e.g. "p99 dropped 38% in v2.3"
  subtitle: string; // conditions: environment, period, n, aggregation
  footnote: string; // provenance: source / period / n / aggregation / generator
}

export interface PlotOpts {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  xdom: [number, number];
  ydom: [number, number];
  xlog?: boolean;
  ylog?: boolean;
  xtitle?: string; // include the unit, e.g. "latency (ms)"
  ytitle?: string;
  xfmt?: (v: number) => string;
  yfmt?: (v: number) => string;
  grid?: boolean; // faint horizontal lines at the y ticks
}

const fmtNum = (v: number): string => String(v);

export class Plot {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
  readonly xs: Scale;
  readonly ys: Scale;
  readonly meta: ChartMeta;
  private xfmt: (v: number) => string;
  private yfmt: (v: number) => string;
  private xtitle?: string;
  private ytitle?: string;
  private grid: boolean;
  private framed = false;
  private c: Canvas;

  constructor(c: Canvas, meta: ChartMeta, o: PlotOpts) {
    this.c = c;
    this.meta = meta;
    this.x0 = o.x ?? 0;
    this.y0 = o.y ?? 0;
    const w = o.w ?? 420;
    const h = o.h ?? 200;
    this.x1 = this.x0 + w;
    this.y1 = this.y0 + h;
    this.xs = new Scale(o.xdom[0], o.xdom[1], this.x0, this.x1, o.xlog ?? false);
    this.ys = new Scale(o.ydom[0], o.ydom[1], this.y1, this.y0, o.ylog ?? false);
    this.xfmt = o.xfmt ?? fmtNum;
    this.yfmt = o.yfmt ?? fmtNum;
    this.xtitle = o.xtitle;
    this.ytitle = o.ytitle;
    this.grid = o.grid ?? false;
    // The frame texts land at construction so a caller cannot forget them.
    c.text(this.x0, this.y0 - 40, meta.title, { size: 15 });
    c.text(this.x0, this.y0 - 22, meta.subtitle, { size: 11, opacity: 0.65 });
    c.text(this.x0, this.y1 + 42, meta.footnote, { size: 10, opacity: 0.55 });
  }

  // Axis lines, tick labels, axis titles. Called once per plot.
  frame(): this {
    if (this.framed) return this;
    this.framed = true;
    const c = this.c;
    c.line([this.x0, this.y0], [this.x0, this.y1], { opacity: 0.45, width: 1 });
    c.line([this.x0, this.y1], [this.x1, this.y1], { opacity: 0.45, width: 1 });
    for (const t of this.ys.ticks()) {
      const py = this.ys.map(t);
      c.line([this.x0 - 3, py], [this.x0, py], { opacity: 0.5, width: 1 });
      c.text(this.x0 - 6, py, this.yfmt(t), { anchor: "end", baseline: "central", size: 10, opacity: 0.7 });
      if (this.grid) c.line([this.x0, py], [this.x1, py], { opacity: 0.1, width: 1 });
    }
    for (const t of this.xs.ticks()) {
      const px = this.xs.map(t);
      c.line([px, this.y1], [px, this.y1 + 3], { opacity: 0.5, width: 1 });
      c.text(px, this.y1 + 16, this.xfmt(t), { anchor: "middle", size: 10, opacity: 0.7 });
    }
    if (this.xtitle) {
      c.text((this.x0 + this.x1) / 2, this.y1 + 30, this.xtitle, { anchor: "middle", size: 10, opacity: 0.7 });
    }
    if (this.ytitle) {
      // horizontal, above the axis top-left: readable without rotation.
      c.text(this.x0, this.y0 - 8, this.ytitle, { size: 10, opacity: 0.7 });
    }
    return this;
  }

  // A connected series. `label` draws the series name at its right end
  // (direct labelling, not a legend box).
  series(pts: Point[], o: StrokeOptions & { label?: string } = {}): this {
    if (pts.length < 2) return this;
    const { label, ...stroke } = o;
    this.c.line(pts[0], pts[pts.length - 1], { via: pts.slice(1, -1), ...stroke });
    if (label) {
      this.c.text(this.x1 + 6, pts[pts.length - 1][1], label, { baseline: "central", size: 10 });
    }
    return this;
  }

  // Step series for ECDF: horizontal then vertical at each point.
  step(pts: Point[], o: StrokeOptions & { label?: string } = {}): this {
    if (pts.length < 2) return this;
    const { label, ...stroke } = o;
    const segs: Point[] = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      segs.push([pts[i][0], pts[i - 1][1]], pts[i]);
    }
    this.c.path(
      "M" + segs.map(([x, y]) => `${x} ${y}`).join(" L"),
      segs,
      stroke,
    );
    if (label) {
      this.c.text(this.x1 + 6, pts[pts.length - 1][1], label, { baseline: "central", size: 10 });
    }
    return this;
  }

  dots(pts: Point[], { r = 1.8, opacity = 0.5 }: { r?: number; opacity?: number } = {}): this {
    for (const [x, y] of pts) {
      this.c.raw(
        `<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor" fill-opacity="${opacity}" stroke="none"/>`,
      );
    }
    // dots do not extend the viewBox; the frame's domain already does.
    return this;
  }

  // An event marker: vertical line at data x, with a short label above.
  vline(xv: number, { label, dash = "4 3", opacity = 0.6 }: { label?: string; dash?: string; opacity?: number } = {}): this {
    const px = this.xs.map(xv);
    this.c.line([px, this.y0], [px, this.y1], { dash, opacity, width: 1 });
    if (label) {
      this.c.text(px + 4, this.y0 + 10, label, { size: 10, opacity: 0.8 });
    }
    return this;
  }

  // A reference line (SLO, baseline): horizontal line at data y.
  hline(yv: number, { label, dash = "4 3", opacity = 0.6 }: { label?: string; dash?: string; opacity?: number } = {}): this {
    const py = this.ys.map(yv);
    this.c.line([this.x0, py], [this.x1, py], { dash, opacity, width: 1 });
    if (label) {
      this.c.text(this.x1 - 4, py - 4, label, { anchor: "end", size: 10, opacity: 0.8 });
    }
    return this;
  }
}

// Build an ECDF's pixel points from raw samples on a Plot. `max`
// thins the step vertices for inline embedding — the statistic is
// the same, only fewer of its vertices are drawn.
export function ecdfPoints(p: Plot, samples: number[], max = Infinity): Point[] {
  const s = [...samples].sort((a, b) => a - b);
  const stride = Math.max(1, Math.floor(s.length / max));
  const pts: Point[] = [];
  for (let i = 0; i < s.length; i += stride) {
    pts.push([p.xs.map(s[i]), p.ys.map((i + 1) / s.length)]);
  }
  pts.push([p.xs.map(s[s.length - 1]), p.ys.map(1)]);
  return pts;
}
