// geom.mbt -- shared 2D geometry for the Delaunay/Voronoi figures
// (docs/sketch/ja/delaunay-voronoi.md). Not a figure generator: it
// holds the one point set every figure reuses ("same data, different
// figure", like data.mbt for charts) plus the primitives the
// generators assert on.

///|
/// Triangle as three indices into the point set.
pub type Tri = (Int32, Int32, Int32)

///|
/// The article's shared point set: 10 points, no 4 cocircular,
/// no 3 collinear.
pub let sites : Array[Point] = [
  (45.0, 60.0),
  (95.0, 35.0),
  (140.0, 70.0),
  (70.0, 115.0),
  (120.0, 130.0),
  (35.0, 145.0),
  (175.0, 45.0),
  (185.0, 115.0),
  (65.0, 185.0),
  (150.0, 175.0),
]

///|
/// A smaller set for figures that color each site differently
/// (palette has 6).
pub let few_sites : Array[Point] = [
  (50.0, 70.0),
  (140.0, 45.0),
  (85.0, 120.0),
  (165.0, 140.0),
  (55.0, 165.0),
]

///|
/// Circumcircle of the triangle through a, b, c.
#derive(Debug)
pub(all) struct Circum {
  o : Point
  r : Double
}

///|
pub fn circum(a : Point, b : Point, c : Point) -> Circum {
  let d = 2.0 * (a.0 * (b.1 - c.1) + b.0 * (c.1 - a.1) + c.0 * (a.1 - b.1))
  let ux = (
      (a.0 * a.0 + a.1 * a.1) * (b.1 - c.1) +
      (b.0 * b.0 + b.1 * b.1) * (c.1 - a.1) +
      (c.0 * c.0 + c.1 * c.1) * (a.1 - b.1)
    ) /
    d
  let uy = (
      (a.0 * a.0 + a.1 * a.1) * (c.0 - b.0) +
      (b.0 * b.0 + b.1 * b.1) * (a.0 - c.0) +
      (c.0 * c.0 + c.1 * c.1) * (b.0 - a.0)
    ) /
    d
  { o: (ux, uy), r: @math.hypot(a.0 - ux, a.1 - uy), }
}

///|
/// Bowyer-Watson: supertriangle + insert each point into the cavity
/// of triangles whose circumcircle contains it.
pub fn delaunay(pts : Array[Point]) -> Array[Tri] {
  let n = pts.length()
  let (minx, maxx, miny, maxy) = pts.fold(
    init=(
      @double.infinity, @double.neg_infinity, @double.infinity, @double.neg_infinity,
    ),
    fn(acc, p) {
      (acc.0.min(p.0), acc.1.max(p.0), acc.2.min(p.1), acc.3.max(p.1))
    },
  )
  let cx = (minx + maxx) / 2.0
  let cy = (miny + maxy) / 2.0
  let m = 30.0 * (maxx - minx).max(maxy - miny)
  let work = pts +
    [(cx - 2.0 * m, cy - m), (cx, cy + 2.0 * m), (cx + 2.0 * m, cy - m)]
  let tris : Array[Tri] = [(n, n + 1, n + 2)]
  for i in 0..<n {
    let p = work[i]
    // cavity: triangle indices whose circumcircle contains p
    let bad : Array[Bool] = Array::make(tris.length(), false)
    for k, t in tris {
      let c = circum(work[t.0], work[t.1], work[t.2])
      if @math.hypot(p.0 - c.o.0, p.1 - c.o.1) < c.r - 1.0e-9 {
        bad[k] = true
      }
    }
    // boundary edges of the cavity: edges of bad triangles counted
    // exactly once (insertion-ordered assoc list keeps output stable)
    let edges : Array[((Int32, Int32), Int32)] = [] // key -> times seen (0/1)
    for k, t in tris {
      if !bad[k] {
        continue
      }
      for e in [(0, 1), (1, 2), (2, 0)] {
        let a = if e.0 == 0 { t.0 } else if e.0 == 1 { t.1 } else { t.2 }
        let b = if e.1 == 0 { t.0 } else if e.1 == 1 { t.1 } else { t.2 }
        let key = if a < b { (a, b) } else { (b, a) }
        let mut found = false
        for j = 0; j < edges.length(); j = j + 1 {
          if edges[j].0 == key {
            edges[j] = (edges[j].0, edges[j].1 + 1)
            found = true
            break
          }
        }
        if !found {
          edges.push((key, 1))
        }
      }
    }
    // drop bad triangles, then retriangulate the cavity boundary
    let kept : Array[Tri] = []
    for k, t in tris {
      if !bad[k] {
        kept.push(t)
      }
    }
    tris.clear()
    for t in kept {
      tris.push(t)
    }
    for entry in edges {
      if entry.1 == 1 {
        tris.push((entry.0.0, entry.0.1, i))
      }
    }
  }
  tris.filter(fn(t) { t.0 < n && t.1 < n && t.2 < n })
}

///|
/// Delaunay edge -> adjacent triangle indices (1 at the boundary,
/// 2 inside). Assoc-list, insertion ordered like the TS Map.
pub fn edge_adjacency(tris : Array[Tri]) -> Array[(Int32, Int32, Array[Int32])] {
  let adj : Array[(Int32, Int32, Array[Int32])] = []
  for k, t in tris {
    for e in [(0, 1), (1, 2), (2, 0)] {
      let va = if e.0 == 0 { t.0 } else if e.0 == 1 { t.1 } else { t.2 }
      let vb = if e.1 == 0 { t.0 } else if e.1 == 1 { t.1 } else { t.2 }
      let (a, b) = if va < vb { (va, vb) } else { (vb, va) }
      let mut found = false
      for j = 0; j < adj.length(); j = j + 1 {
        if adj[j].0 == a && adj[j].1 == b {
          adj[j].2.push(k)
          found = true
          break
        }
      }
      if !found {
        adj.push((a, b, [k]))
      }
    }
  }
  adj
}

///|
/// Monotone chain hull; returns hull vertex indices ccw, used for
/// the Euler-formula check (T = 2n-2-h).
pub fn hull(pts : Array[Point]) -> Array[Int32] {
  let idx : Array[Int32] = Array::makei(pts.length(), fn(i) { i })
  idx.sort_by(fn(a, b) {
    let d = pts[a].0 - pts[b].0
    if d != 0.0 {
      d.compare(0.0)
    } else {
      (pts[a].1 - pts[b].1).compare(0.0)
    }
  })
  let cross = fn(o : Int32, a : Int32, b : Int32) -> Double {
    (pts[a].0 - pts[o].0) * (pts[b].1 - pts[o].1) -
    (pts[a].1 - pts[o].1) * (pts[b].0 - pts[o].0)
  }
  let half = fn(h : Array[Int32]) -> Array[Int32] {
    let out : Array[Int32] = []
    for i in h {
      while out.length() >= 2 &&
            cross(out[out.length() - 2], out[out.length() - 1], i) <= 0.0 {
        out.pop() |> ignore
      }
      out.push(i)
    }
    out
  }
  let lower = half(idx)
  let upper = half(idx.rev())
  lower[:lower.length() - 1]
  .iter()
  .concat(upper[:upper.length() - 1].iter())
  .collect()
}

///|
/// Voronoi cell of site s, clipped to `rect` (CCW polygon in screen
/// coords: half-plane intersection of the box with every perpendicular
/// bisector, keeping the side nearer to s).
pub fn voronoi_cell(
  s : Point,
  sites~ : Array[Point],
  rect~ : Array[Point],
) -> Array[Point] {
  let poly = rect.copy()
  for t in sites {
    if t == s {
      continue
    }
    let mid : Point = ((s.0 + t.0) / 2.0, (s.1 + t.1) / 2.0)
    let d : Point = (t.0 - s.0, t.1 - s.1) // outward normal toward t
    let side = fn(p : Point) -> Double {
      (p.0 - mid.0) * d.0 + (p.1 - mid.1) * d.1
    }
    let out : Array[Point] = []
    for i = 0; i < poly.length(); i = i + 1 {
      let cur = poly[i]
      let prev = poly[(i + poly.length() - 1) % poly.length()]
      let sc = side(cur)
      let sp = side(prev)
      if sc <= 0.0 {
        if sp > 0.0 {
          out.push(isect(prev, cur, sp, sc))
        }
        out.push(cur)
      } else if sp <= 0.0 {
        out.push(isect(prev, cur, sp, sc))
      }
    }
    poly.clear()
    for p in out {
      poly.push(p)
    }
  }
  poly
}

///|
fn isect(a : Point, b : Point, sa : Double, sb : Double) -> Point {
  let t = sa / (sa - sb)
  (a.0 + t * (b.0 - a.0), a.1 + t * (b.1 - a.1))
}

///|
/// Shift a point set so several panels can share one canvas.
pub fn shift(pts : Array[Point], dx~ : Double, dy~ : Double) -> Array[Point] {
  pts.map(fn(p) { (p.0 + dx, p.1 + dy) })
}

///|
/// Perpendicular bisector of s-t: passes through the midpoint,
/// along dir.
#derive(Debug)
pub(all) struct Bisector {
  mid : Point
  dir : Point
}

///|
pub fn bisector(s : Point, t : Point) -> Bisector {
  {
    mid: ((s.0 + t.0) / 2.0, (s.1 + t.1) / 2.0),
    dir: (-(t.1 - s.1), t.0 - s.0),
  }
}

///|
/// Clip the infinite line through o with direction d to the rect
/// (x0, y0, x1, y1); returns its two endpoints on the boundary.
pub fn line_rect(
  o : Point,
  d : Point,
  r : (Double, Double, Double, Double),
) -> (Point, Point) {
  let ts : Array[Double] = []
  if d.0 != 0.0 {
    ts.push((r.0 - o.0) / d.0)
    ts.push((r.2 - o.0) / d.0)
  }
  if d.1 != 0.0 {
    ts.push((r.1 - o.1) / d.1)
    ts.push((r.3 - o.1) / d.1)
  }
  let ok : Array[Double] = []
  for t in ts {
    let x = o.0 + t * d.0
    let y = o.1 + t * d.1
    if x >= r.0 - 1.0e-9 &&
      x <= r.2 + 1.0e-9 &&
      y >= r.1 - 1.0e-9 &&
      y <= r.3 + 1.0e-9 {
      ok.push(t)
    }
  }
  ok.sort()
  if ok.length() < 2 {
    return (o, o)
  }
  let a = ok[0]
  let b = ok[ok.length() - 1]
  ((o.0 + a * d.0, o.1 + a * d.1), (o.0 + b * d.0, o.1 + b * d.1))
}

///|
/// Voronoi diagram as line segments: for every Delaunay edge, the
/// dual segment between the adjacent circumcenters; at the boundary,
/// a ray from the single center along the bisector, clipped to rect.
pub fn voronoi_segments(
  pts : Array[Point],
  tris~ : Array[Tri],
  rect~ : (Double, Double, Double, Double),
) -> Array[(Point, Point)] {
  let centers = tris.map(fn(t) { circum(pts[t.0], pts[t.1], pts[t.2]).o })
  let out : Array[(Point, Point)] = []
  for entry in edge_adjacency(tris) {
    let (ea, eb, t) = entry
    if t.length() == 2 {
      out.push((centers[t[0]], centers[t[1]]))
      continue
    }
    let tri = tris[t[0]]
    let third = for v in [tri.0, tri.1, tri.2] {
      if v != ea && v != eb {
        break v
      }
    } nobreak {
      abort("voronoi_segments: edge not in triangle")
    }
    let mid : Point = (
      (pts[ea].0 + pts[eb].0) / 2.0,
      (pts[ea].1 + pts[eb].1) / 2.0,
    )
    let d : Point = (-(pts[eb].1 - pts[ea].1), pts[eb].0 - pts[ea].0)
    let l = @math.hypot(d.0, d.1)
    let sign = ((pts[third].0 - mid.0) * d.0 + (pts[third].1 - mid.1) * d.1).signum()
    let sgn = if sign == 0.0 { 1.0 } else { sign }
    let dir : Point = (-sgn * d.0 / l, -sgn * d.1 / l)
    let o = centers[t[0]]
    // smallest positive t where o + t*dir reaches the rect boundary
    let mut tmin = @double.infinity
    for wall in [(rect.0, 0), (rect.2, 0), (rect.1, 1), (rect.3, 1)] {
      let (w, axis) = wall
      let dv = if axis == 0 { dir.0 } else { dir.1 }
      let ov = if axis == 0 { o.0 } else { o.1 }
      if dv != 0.0 {
        let tt = (w - ov) / dv
        if tt > 0.0 && tt < tmin {
          tmin = tt
        }
      }
    }
    out.push((o, (o.0 + dir.0 * tmin, o.1 + dir.1 * tmin)))
  }
  out
}

///|
/// Sample a function to a polyline for c.path().
pub fn sample(
  f : (Double) -> Double,
  x0~ : Double,
  x1~ : Double,
  n~ : Int32 = 64,
) -> Array[Point] {
  let pts : Array[Point] = []
  for i = 0; i <= n; i = i + 1 {
    let x = x0 + (x1 - x0) * i.to_double() / n.to_double()
    pts.push((x, f(x)))
  }
  pts
}

///|
/// Sampled polyline -> SVG path data.
pub fn path_of(pts : Array[Point]) -> String {
  "M" + pts.map(fn(p) { "\{fixed(p.0, d=1)} \{fixed(p.1, d=1)}" }).join(" L")
}

///|
/// Filled polygon element (escape hatch for cell/triangle fills).
pub fn poly_el(
  pts : Array[Point],
  fill~ : String,
  opacity~ : Double,
  extra~ : String = "",
) -> String {
  let s = pts.map(fn(p) { fixed(p.0, d=1) + "," + fixed(p.1, d=1) }).join(" ")
  "<polygon points=\"\{s}\" fill=\"\{fill}\" fill-opacity=\"\{opacity}\"\{extra}/>"
}
