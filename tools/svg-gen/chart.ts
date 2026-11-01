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

// A tick is either a position formatted by xfmt/yfmt, or
// [position, label] for categorical axes.
export type Tick = number | [number, string];

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
  // Pass xticks/yticks to override the generated ones — e.g. for
  // categorical axes ([pos, label] entries).
  frame(o: { xticks?: Tick[]; yticks?: Tick[] } = {}): this {
    if (this.framed) return this;
    this.framed = true;
    const c = this.c;
    c.line([this.x0, this.y0], [this.x0, this.y1], { opacity: 0.45, width: 1 });
    c.line([this.x0, this.y1], [this.x1, this.y1], { opacity: 0.45, width: 1 });
    const yts: [number, string][] = (o.yticks ?? this.ys.ticks()).map((t) =>
      Array.isArray(t) ? t : [t, this.yfmt(t)],
    );
    for (const [v, label] of yts) {
      const py = this.ys.map(v);
      c.line([this.x0 - 3, py], [this.x0, py], { opacity: 0.5, width: 1 });
      c.text(this.x0 - 6, py, label, { anchor: "end", baseline: "central", size: 10, opacity: 0.7 });
      if (this.grid) c.line([this.x0, py], [this.x1, py], { opacity: 0.1, width: 1 });
    }
    const xts: [number, string][] = (o.xticks ?? this.xs.ticks()).map((t) =>
      Array.isArray(t) ? t : [t, this.xfmt(t)],
    );
    for (const [v, label] of xts) {
      const px = this.xs.map(v);
      c.line([px, this.y1], [px, this.y1 + 3], { opacity: 0.5, width: 1 });
      c.text(px, this.y1 + 16, label, { anchor: "middle", size: 10, opacity: 0.7 });
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

  dots(pts: Point[], { r = 1.8, opacity = 0.5, color }: { r?: number; opacity?: number; color?: string } = {}): this {
    const fill = color ?? "currentColor";
    for (const [x, y] of pts) {
      this.c.raw(
        `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" fill-opacity="${opacity}" stroke="none"/>`,
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

  // Box-and-whisker per group, centred at x = i + 0.5 (use xdom
  // [0, groups.length]). Whiskers reach the 1.5*IQR fences clamped
  // to the data range; values beyond are outlier dots. `overlay`
  // jitters raw points behind the boxes — the guideline wants raw
  // points overlaid for small n because the box alone hides shape.
  boxplot(
    groups: { label: string; values: number[] }[],
    { boxW = 0.44, overlay = 0, color, rand }: { boxW?: number; overlay?: number; color?: string; rand?: () => number } = {},
  ): this {
    const c = this.c;
    const stride = overlay > 0 && overlay < 1 ? Math.max(1, Math.round(1 / overlay)) : 1;
    groups.forEach((g, i) => {
      const s = [...g.values].sort((a, b) => a - b);
      const q1 = quantile(s, 0.25);
      const q2 = quantile(s, 0.5);
      const q3 = quantile(s, 0.75);
      const iqr = q3 - q1;
      const lo = Math.max(s[0], q1 - 1.5 * iqr);
      const hi = Math.min(s[s.length - 1], q3 + 1.5 * iqr);
      const cx = this.xs.map(i + 0.5);
      const bw = (this.xs.map(i + 0.5 + boxW) - cx) * 2;
      if (overlay > 0 && rand) {
        for (let j = 0; j < s.length; j += stride) {
          const jx = cx + (rand() - 0.5) * bw * 1.6;
          c.raw(`<circle cx="${jx.toFixed(1)}" cy="${this.ys.map(s[j]).toFixed(1)}" r="1.3" fill="${color ?? "currentColor"}" fill-opacity="0.28" stroke="none"/>`);
        }
      }
      // whiskers + caps
      c.line([cx, this.ys.map(lo)], [cx, this.ys.map(hi)], { width: 1, color, opacity: 0.8 });
      c.line([cx - bw * 0.2, this.ys.map(lo)], [cx + bw * 0.2, this.ys.map(lo)], { width: 1, color });
      c.line([cx - bw * 0.2, this.ys.map(hi)], [cx + bw * 0.2, this.ys.map(hi)], { width: 1, color });
      // outliers beyond the fences
      for (const v of s) {
        if (v < lo || v > hi) {
          c.raw(`<circle cx="${cx.toFixed(1)}" cy="${this.ys.map(v).toFixed(1)}" r="1.6" fill="none" stroke="${color ?? "currentColor"}" stroke-width="1" opacity="0.6"/>`);
        }
      }
      // IQR box + median
      c.raw(
        `<rect x="${(cx - bw / 2).toFixed(1)}" y="${this.ys.map(q3).toFixed(1)}" width="${bw.toFixed(1)}" height="${(this.ys.map(q1) - this.ys.map(q3)).toFixed(1)}" fill="${color ?? "currentColor"}" fill-opacity="0.18" stroke="${color ?? "currentColor"}" stroke-width="1.5"/>`,
      );
      c.line([cx - bw / 2, this.ys.map(q2)], [cx + bw / 2, this.ys.map(q2)], { width: 2.5, color });
    });
    return this;
  }

  // Histogram bars from bins() output; heights are counts.
  histogram(bins: { x0: number; x1: number; n: number }[], { color }: { color?: string } = {}): this {
    for (const b of bins) {
      const x = this.xs.map(b.x0);
      const w = this.xs.map(b.x1) - x;
      const top = this.ys.map(b.n);
      this.c.raw(
        `<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${w.toFixed(1)}" height="${(this.y1 - top).toFixed(1)}" fill="${color ?? "currentColor"}" fill-opacity="0.35" stroke="${color ?? "currentColor"}" stroke-width="1"/>`,
      );
    }
    return this;
  }

  // Cells of a rows x cols grid; fill-opacity encodes value against
  // the data max (sequential single-hue scale: currentColor keeps it
  // theme-following). Row 0 draws at the top. Returns {min, max} for
  // the legend.
  heatmap(
    grid: number[][],
    { color }: { color?: string } = {},
  ): { min: number; max: number } {
    const rows = grid.length;
    const cols = grid[0].length;
    const cw = (this.x1 - this.x0) / cols;
    const ch = (this.y1 - this.y0) / rows;
    let min = Infinity;
    let max = -Infinity;
    for (const row of grid) for (const v of row) { min = Math.min(min, v); max = Math.max(max, v); }
    const span = max - min || 1;
    grid.forEach((row, j) => {
      row.forEach((v, i) => {
        const o = 0.06 + 0.9 * ((v - min) / span);
        this.c.raw(
          `<rect x="${(this.x0 + i * cw).toFixed(1)}" y="${(this.y0 + j * ch).toFixed(1)}" width="${(cw - 0.6).toFixed(1)}" height="${(ch - 0.6).toFixed(1)}" fill="${color ?? "currentColor"}" fill-opacity="${o.toFixed(2)}" stroke="none"/>`,
        );
      });
    });
    return { min, max };
  }

  // Legend ramp for heatmap(): N steps of increasing fill-opacity
  // with min/max labels below and an optional caption to the left.
  // Position it above the plot top so labels stay clear of cells.
  heatLegend(
    { min, max }: { min: number; max: number },
    { x, y, w = 70, fmt = fmtNum, label }: { x: number; y: number; w?: number; fmt?: (v: number) => string; label?: string } = {},
  ): this {
    const steps = 6;
    const sw = w / steps;
    for (let i = 0; i < steps; i++) {
      const o = 0.06 + 0.9 * (i / (steps - 1));
      this.c.raw(`<rect x="${(x + i * sw).toFixed(1)}" y="${y}" width="${(sw - 1).toFixed(1)}" height="8" fill="currentColor" fill-opacity="${o.toFixed(2)}" stroke="none"/>`);
    }
    this.c.text(x, y + 16, fmt(min), { size: 9, opacity: 0.6 });
    this.c.text(x + w, y + 16, fmt(max), { anchor: "end", size: 9, opacity: 0.6 });
    if (label) this.c.text(x - 6, y + 4, label, { anchor: "end", baseline: "central", size: 9, opacity: 0.6 });
    return this;
  }
}

// Count samples into width-w bins aligned to w*k boundaries.
export function bins(values: number[], w: number): { x0: number; x1: number; n: number }[] {
  const lo = Math.floor(Math.min(...values) / w) * w;
  const hi = Math.ceil(Math.max(...values) / w) * w;
  const out: { x0: number; x1: number; n: number }[] = [];
  for (let x = lo; x < hi - 1e-9; x += w) out.push({ x0: x, x1: x + w, n: 0 });
  for (const v of values) {
    const i = Math.min(out.length - 1, Math.floor((v - lo) / w));
    out[i].n++;
  }
  return out;
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
