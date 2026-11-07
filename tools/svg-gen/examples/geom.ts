// geom.ts -- shared 2D geometry for the Delaunay/Voronoi figures
// (docs/sketch/ja/delaunay-voronoi.md). Not a fig-* generator: it holds
// the one point set every figure reuses ("same data, different figure",
// like data.ts for charts) plus the primitives the generators assert on.

export type Point = [number, number];
export type Tri = [number, number, number];

// The article's shared point set: 10 points, no 4 cocircular, no 3 collinear.
export const SITES: Point[] = [
  [45, 60], [95, 35], [140, 70], [70, 115], [120, 130],
  [35, 145], [175, 45], [185, 115], [65, 185], [150, 175],
];

// A smaller set for figures that color each site differently (PALETTE has 6).
export const FEW_SITES: Point[] = [
  [50, 70], [140, 45], [85, 120], [165, 140], [55, 165],
];

// Circumcircle of the triangle through a, b, c.
export function circum(a: Point, b: Point, c: Point): { o: Point; r: number } {
  const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
  const ux = ((a[0] ** 2 + a[1] ** 2) * (b[1] - c[1]) + (b[0] ** 2 + b[1] ** 2) * (c[1] - a[1]) + (c[0] ** 2 + c[1] ** 2) * (a[1] - b[1])) / d;
  const uy = ((a[0] ** 2 + a[1] ** 2) * (c[0] - b[0]) + (b[0] ** 2 + b[1] ** 2) * (a[0] - c[0]) + (c[0] ** 2 + c[1] ** 2) * (b[0] - a[0])) / d;
  return { o: [ux, uy], r: Math.hypot(a[0] - ux, a[1] - uy) };
}

// Bowyer-Watson: supertriangle + insert each point into the cavity of
// triangles whose circumcircle contains it.
export function delaunay(pts: Point[]): Tri[] {
  const n = pts.length;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const m = 30 * Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const work = pts.concat([[cx - 2 * m, cy - m], [cx, cy + 2 * m], [cx + 2 * m, cy - m]]);
  let tris: Tri[] = [[n, n + 1, n + 2]];
  for (let i = 0; i < n; i++) {
    const p = work[i];
    const bad = new Set<number>();
    tris.forEach((t, k) => {
      const { o, r } = circum(work[t[0]], work[t[1]], work[t[2]]);
      if (Math.hypot(p[0] - o[0], p[1] - o[1]) < r - 1e-9) bad.add(k);
    });
    const edges = new Map<string, [number, number]>();
    const key = (a: number, b: number) => (a < b ? `${a},${b}` : `${b},${a}`);
    for (const k of bad)
      for (const e of [[0, 1], [1, 2], [2, 0]] as const) {
        const [a, b] = [tris[k][e[0]], tris[k][e[1]]];
        const kk = key(a, b);
        if (edges.has(kk)) edges.delete(kk);
        else edges.set(kk, [a, b]);
      }
    tris = tris.filter((_, k) => !bad.has(k));
    for (const [a, b] of edges.values()) tris.push([a, b, i]);
  }
  return tris.filter((t) => t[0] < n && t[1] < n && t[2] < n);
}

// Delaunay edge -> adjacent triangle indices (1 at the boundary, 2 inside).
export function edgeAdjacency(tris: Tri[]): Map<string, { e: [number, number]; t: number[] }> {
  const adj = new Map<string, { e: [number, number]; t: number[] }>();
  const ekey = (a: number, b: number) => (a < b ? `${a},${b}` : `${b},${a}`);
  tris.forEach((t, k) => {
    for (const e of [[0, 1], [1, 2], [2, 0]] as const) {
      const [a, b] = [t[e[0]], t[e[1]]];
      const kk = ekey(a, b);
      if (!adj.has(kk)) adj.set(kk, { e: [a, b], t: [] });
      adj.get(kk)!.t.push(k);
    }
  });
  return adj;
}

// Monotone chain hull; returns hull vertex indices ccw, used for the
// Euler-formula check (T = 2n-2-h).
export function hull(pts: Point[]): number[] {
  const idx = pts.map((_, i) => i).sort((a, b) => pts[a][0] - pts[b][0] || pts[a][1] - pts[b][1]);
  const cross = (o: number, a: number, b: number) =>
    (pts[a][0] - pts[o][0]) * (pts[b][1] - pts[o][1]) - (pts[a][1] - pts[o][1]) * (pts[b][0] - pts[o][0]);
  const half = (h: number[]) => {
    const out: number[] = [];
    for (const i of h) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], i) <= 0) out.pop();
      out.push(i);
    }
    return out;
  };
  const lower = half(idx);
  const upper = half([...idx].reverse());
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

// Voronoi cell of site s, clipped to `rect` (CCW polygon in screen coords:
// half-plane intersection of the box with every perpendicular bisector,
// keeping the side nearer to s).
export function voronoiCell(s: Point, sites: Point[], rect: Point[]): Point[] {
  let poly = rect.slice();
  for (const t of sites) {
    if (t === s) continue;
    const mid: Point = [(s[0] + t[0]) / 2, (s[1] + t[1]) / 2];
    const d: Point = [t[0] - s[0], t[1] - s[1]]; // outward normal toward t
    const side = (p: Point) => (p[0] - mid[0]) * d[0] + (p[1] - mid[1]) * d[1];
    const out: Point[] = [];
    for (let i = 0; i < poly.length; i++) {
      const cur = poly[i], prev = poly[(i + poly.length - 1) % poly.length];
      const sc = side(cur), sp = side(prev);
      if (sc <= 0) {
        if (sp > 0) out.push(isect(prev, cur, sp, sc));
        out.push(cur);
      } else if (sp <= 0) out.push(isect(prev, cur, sp, sc));
    }
    poly = out;
  }
  return poly;
}

function isect(a: Point, b: Point, sa: number, sb: number): Point {
  const t = sa / (sa - sb);
  return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
}

// Shift a point set so several panels can share one canvas.
export function shift(pts: Point[], dx: number, dy: number): Point[] {
  return pts.map(([x, y]) => [x + dx, y + dy]);
}

// Perpendicular bisector of s-t: passes through the midpoint, along dir.
export function bisector(s: Point, t: Point): { mid: Point; dir: Point } {
  return {
    mid: [(s[0] + t[0]) / 2, (s[1] + t[1]) / 2],
    dir: [-(t[1] - s[1]), t[0] - s[0]],
  };
}

// Clip the infinite line through o with direction d to the rect
// [x0, y0, x1, y1]; returns its two endpoints on the boundary.
export function lineRect(o: Point, d: Point, r: [number, number, number, number]): [Point, Point] {
  const ts: number[] = [];
  if (d[0] !== 0) ts.push((r[0] - o[0]) / d[0], (r[2] - o[0]) / d[0]);
  if (d[1] !== 0) ts.push((r[1] - o[1]) / d[1], (r[3] - o[1]) / d[1]);
  const ok = ts
    .filter((t) => {
      const x = o[0] + t * d[0], y = o[1] + t * d[1];
      return x >= r[0] - 1e-9 && x <= r[2] + 1e-9 && y >= r[1] - 1e-9 && y <= r[3] + 1e-9;
    })
    .sort((a, b) => a - b);
  if (ok.length < 2) return [o, o];
  return [
    [o[0] + ok[0] * d[0], o[1] + ok[0] * d[1]],
    [o[0] + ok[ok.length - 1] * d[0], o[1] + ok[ok.length - 1] * d[1]],
  ];
}

// Voronoi diagram as line segments: for every Delaunay edge, the dual
// segment between the adjacent circumcenters; at the boundary, a ray
// from the single center along the bisector, clipped to `rect`.
export function voronoiSegments(pts: Point[], tris: Tri[], rect: [number, number, number, number]): [Point, Point][] {
  const centers = tris.map(([a, b, c]) => circum(pts[a], pts[b], pts[c]).o);
  const out: [Point, Point][] = [];
  for (const { e, t } of edgeAdjacency(tris).values()) {
    if (t.length === 2) {
      out.push([centers[t[0]], centers[t[1]]]);
      continue;
    }
    const tri = tris[t[0]];
    const third = tri.find((v) => v !== e[0] && v !== e[1])!;
    const mid: Point = [(pts[e[0]][0] + pts[e[1]][0]) / 2, (pts[e[0]][1] + pts[e[1]][1]) / 2];
    const d: Point = [-(pts[e[1]][1] - pts[e[0]][1]), pts[e[1]][0] - pts[e[0]][0]];
    const l = Math.hypot(d[0], d[1]);
    const sgn = Math.sign((pts[third][0] - mid[0]) * d[0] + (pts[third][1] - mid[1]) * d[1]) || 1;
    const dir: Point = [(-sgn * d[0]) / l, (-sgn * d[1]) / l];
    const o = centers[t[0]];
    // smallest positive t where o + t*dir reaches the rect boundary
    let tmin = Infinity;
    for (const [wall, axis] of [[rect[0], 0], [rect[2], 0], [rect[1], 1], [rect[3], 1]] as const) {
      if (dir[axis] !== 0) {
        const tt = (wall - o[axis]) / dir[axis];
        if (tt > 0 && tt < tmin) tmin = tt;
      }
    }
    out.push([o, [o[0] + dir[0] * tmin, o[1] + dir[1] * tmin]]);
  }
  return out;
}

// Sample a function to a polyline for c.path().
export function sample(f: (x: number) => number, x0: number, x1: number, n = 64): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    pts.push([x, f(x)]);
  }
  return pts;
}

// Sampled polyline -> SVG path data.
export function pathOf(pts: Point[]): string {
  return "M" + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L");
}

// Filled polygon element (escape hatch for cell/triangle fills).
export function polyEl(pts: Point[], fill: string, op: number, extra = ""): string {
  const s = pts.map((p) => p.map((v) => +v.toFixed(1)).join(",")).join(" ");
  return `<polygon points="${s}" fill="${fill}" fill-opacity="${op}"${extra}/>`;
}
