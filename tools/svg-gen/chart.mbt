// chart.mbt -- data-figure helpers for svg-gen: scales, axes, and series
// for statistical figures (the L1 side of the figure guideline in
// docs/sketch/ja/figure-guidelines.md). svg.mbt still owns drawing and
// the viewBox; this file owns data -> pixel mapping and the chart
// frame, and makes the "required metadata" required in the type:
// every Plot needs {title, subtitle, footnote} up front.

///|
/// Deterministic PRNG (mulberry32) so a figure's virtual data is
/// reproducible from its seed alone.
pub fn rng(seed : UInt32) -> () -> Double {
  let a = Ref(seed)
  fn() {
    a.val = a.val + 0x6d2b79f5U
    let ai = a.val
    let t0 = (ai ^ (ai >> 15)) * (ai | 1U)
    let t = (t0 + (t0 ^ (t0 >> 7)) * (t0 | 61U)) ^ t0
    (t ^ (t >> 14)).to_double() / 4294967296.0
  }
}

///|
/// Box-Muller on top of rng().
pub fn gauss(rand : () -> Double) -> () -> Double {
  fn() {
    let u = @cmp.maximum(rand(), 1.0e-12)
    let v = rand()
    (-2.0 * @math.ln(u)).sqrt() * @math.cos(2.0 * @math.PI * v)
  }
}

///|
pub fn quantile(sorted : Array[Double], q~ : Double) -> Double {
  let i = (sorted.length() - 1).to_double() * q
  let lo = @math.floor(i).to_int()
  let hi = @math.ceil(i).to_int()
  sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo.to_double())
}

///|
/// 1/2/5-style nice ticks covering [lo, hi], about `count` of them.
pub fn ticks(lo : Double, hi : Double, count~ : Int32 = 5) -> Array[Double] {
  let raw = (hi - lo) / count.to_double()
  let p = @math.pow(10.0, @math.floor(@math.log10(raw)))
  let f = raw / p
  let step = (if f >= 5.0 { 5.0 } else if f >= 2.0 { 2.0 } else { 1.0 }) * p
  let out : Array[Double] = []
  for v = @math.ceil(lo / step - 1.0e-9) * step
      v <= hi + step * 1.0e-6
      v = v + step {
    out.push(round12(v))
  }
  out
}

///|
fn round12(v : Double) -> Double {
  // +v.toPrecision(12)
  if v == 0.0 {
    return 0.0
  }
  let p = @math.pow(10.0, 12.0 - @math.floor(@math.log10(v.abs())))
  (v * p).round() / p
}

///|
/// How a `Scale` maps data to pixels. A Bool flag would name only two
/// states without saying which is which at the call site; `Log` works
/// on the data value (v > 0 only).
#derive(Debug, Eq)
pub(all) enum ScaleKind {
  Linear
  Log
}

///|
/// A data->pixel mapping.
#derive(Debug)
pub(all) struct Scale {
  lo : Double
  hi : Double
  a : Double
  b : Double
  kind : ScaleKind
}

///|
pub fn Scale::Scale(
  lo : Double,
  hi : Double,
  a : Double,
  b : Double,
  kind~ : ScaleKind = Linear,
) -> Scale {
  { lo, hi, a, b, kind, }
}

///|
fn Scale::spread(self : Scale) -> (Double, Double) {
  match self.kind {
    Log => (@math.log10(self.lo), @math.log10(self.hi))
    Linear => (self.lo, self.hi)
  }
}

///|
pub fn Scale::map(self : Scale, v : Double) -> Double {
  let (l, h) = self.spread()
  let x = match self.kind {
    Log => @math.log10(v)
    Linear => v
  }
  self.a + (x - l) / (h - l) * (self.b - self.a)
}

///|
pub fn Scale::ticks(self : Scale, count~ : Int32 = 5) -> Array[Double] {
  match self.kind {
    Linear => return ticks(self.lo, self.hi, count~)
    Log => ()
  }
  // log axis: mark 1/2/5 of each decade inside the domain.
  let (l, h) = self.spread()
  let out : Array[Double] = []
  for d = @math.floor(l); d <= @math.ceil(h); d = d + 1.0 {
    for m in [1.0, 2.0, 5.0] {
      let v = m * @math.pow(10.0, d)
      if v >= self.lo && v <= self.hi {
        out.push(v)
      }
    }
  }
  out
}

///|
#derive(Debug)
pub(all) struct ChartMeta {
  title : String // the conclusion, e.g. "p99 dropped 38% in v2.3"
  subtitle : String // conditions: environment, period, n, aggregation
  footnote : String // provenance: source / period / n / aggregation / generator
}

///|
/// toFixed(d) for element attributes: x.toFixed(1), o.toFixed(2), ...
pub fn fixed(v : Double, d~ : Int32) -> String {
  let p = @math.pow(10.0, d.to_double())
  let scaled = (v * p).round()
  let neg = scaled < 0.0
  let a = if neg { -scaled } else { scaled }
  let whole = (a / p).floor().to_int64()
  let frac = (a - whole.to_double() * p).round().to_int64()
  let fs = frac.to_string()
  let pad = "0".repeat(d - fs.length())
  let body = if d > 0 { "\{whole}.\{pad}\{fs}" } else { whole.to_string() }
  if neg {
    "-" + body
  } else {
    body
  }
}

///|
fn fmt_num(v : Double) -> String {
  num(v)
}

///|
/// A tick is either a position formatted by xfmt/yfmt, or
/// Lab(pos, label) for categorical axes.
#derive(Debug)
pub(all) enum Tick {
  Num(Double)
  Lab(Double, String)
}

///|
#derive(Debug)
pub(all) struct BoxGroup {
  label : String
  values : Array[Double]
}

///|
#derive(Debug)
pub(all) struct Bin {
  x0 : Double
  x1 : Double
  mut n : Int32
}

///|
#derive(Eq)
pub(all) enum BarsLayout {
  Grouped
  Stacked
  Diverging
}

///|
pub(all) struct BarSeries {
  name : String
  values : Array[Double]
}

///|
pub fn BarSeries::BarSeries(
  label : String,
  values : Array[Double],
) -> BarSeries {
  { name: label, values, }
}

///|
/// Categorical bar/column chart builder. `Grouped` places series side by
/// side, `Stacked` accumulates positive and negative values separately,
/// and `Diverging` uses a symmetric domain around zero. With
/// `horizontal=true` categories are rows (bar chart); otherwise columns.
pub fn Canvas::bar_chart(
  self : Canvas,
  x : Double,
  y : Double,
  w : Double,
  h : Double,
  labels : Array[String],
  series : Array[BarSeries],
  layout~ : BarsLayout = Grouped,
  horizontal~ : Bool = false,
) -> Unit {
  if labels.length() == 0 || series.length() == 0 {
    return
  }
  let mut minv = 0.0
  let mut maxv = 0.0
  if layout is Stacked {
    for i = 0; i < labels.length(); i = i + 1 {
      let mut pos = 0.0
      let mut neg = 0.0
      for s in series {
        if i < s.values.length() {
          let v = s.values[i]
          if v >= 0.0 {
            pos += v
          } else {
            neg += v
          }
        }
      }
      maxv = maxv.max(pos)
      minv = minv.min(neg)
    }
  } else {
    for s in series {
      for v in s.values {
        maxv = maxv.max(v)
        minv = minv.min(v)
      }
    }
  }
  if layout is Diverging {
    let a = maxv.abs().max(minv.abs())
    maxv = a
    minv = -a
  }
  if maxv == minv {
    maxv = minv + 1.0
  }
  let span = maxv - minv
  ignore(self.rect(x, y, w, h, fill="none", opacity=Some(0.35)))
  let n = labels.length().to_double()
  let ns = series.length().to_double()
  if horizontal {
    let zero = x + (0.0 - minv) / span * w
    self.line((zero, y), (zero, y + h), width=1.0, opacity=Some(0.5))
    let row = h / n
    for i = 0; i < labels.length(); i = i + 1 {
      let cy = y + i.to_double() * row
      self.text(
        x - 5.0,
        cy + row / 2.0,
        labels[i],
        anchor=End,
        central=true,
        size=10.0,
      )
      let bw = if layout is Stacked { row * 0.55 } else { row * 0.7 / ns }
      let mut acc_pos = 0.0
      let mut acc_neg = 0.0
      for j = 0; j < series.length(); j = j + 1 {
        if i >= series[j].values.length() {
          continue
        }
        let v = series[j].values[i]
        let (v0, v1, yy) = if layout is Stacked {
          if v >= 0.0 {
            let r = (acc_pos, acc_pos + v, cy + row * 0.225)
            acc_pos += v
            r
          } else {
            let r = (acc_neg, acc_neg + v, cy + row * 0.225)
            acc_neg += v
            r
          }
        } else {
          (0.0, v, cy + row * 0.15 + j.to_double() * bw)
        }
        let xa = x + (v0 - minv) / span * w
        let xb = x + (v1 - minv) / span * w
        let xx = xa.min(xb)
        ignore(
          self.rect(
            xx,
            yy,
            (xb - xa).abs(),
            bw,
            fill=self.color(j),
            fill_opacity=Some(0.45),
            color=self.color(j),
          ),
        )
      }
    }
  } else {
    let zero = y + maxv / span * h
    self.line((x, zero), (x + w, zero), width=1.0, opacity=Some(0.5))
    let col = w / n
    for i = 0; i < labels.length(); i = i + 1 {
      let cx = x + i.to_double() * col
      self.text(
        cx + col / 2.0,
        y + h + 12.0,
        labels[i],
        anchor=Middle,
        size=10.0,
      )
      let bw = if layout is Stacked { col * 0.55 } else { col * 0.7 / ns }
      let mut acc_pos = 0.0
      let mut acc_neg = 0.0
      for j = 0; j < series.length(); j = j + 1 {
        if i >= series[j].values.length() {
          continue
        }
        let v = series[j].values[i]
        let (v0, v1, xx) = if layout is Stacked {
          if v >= 0.0 {
            let r = (acc_pos, acc_pos + v, cx + col * 0.225)
            acc_pos += v
            r
          } else {
            let r = (acc_neg, acc_neg + v, cx + col * 0.225)
            acc_neg += v
            r
          }
        } else {
          (0.0, v, cx + col * 0.15 + j.to_double() * bw)
        }
        let ya = y + (maxv - v0) / span * h
        let yb = y + (maxv - v1) / span * h
        let yy = ya.min(yb)
        ignore(
          self.rect(
            xx,
            yy,
            bw,
            (yb - ya).abs(),
            fill=self.color(j),
            fill_opacity=Some(0.45),
            color=self.color(j),
          ),
        )
      }
    }
  }
  for j = 0; j < series.length(); j = j + 1 {
    let ly = y - 8.0 - (series.length() - 1 - j).to_double() * 13.0
    ignore(
      self.rect(
        x + w + 8.0,
        ly - 8.0,
        8.0,
        8.0,
        fill=self.color(j),
        fill_opacity=Some(0.45),
        color=self.color(j),
      ),
    )
    self.text(x + w + 20.0, ly, series[j].name, size=10.0)
  }
}

///|
pub struct Plot {
  x0 : Double
  y0 : Double
  x1 : Double
  y1 : Double
  xs : Scale
  ys : Scale
  meta : ChartMeta
  xfmt : (Double) -> String
  yfmt : (Double) -> String
  xtitle : String?
  ytitle : String?
  grid : Bool
  mut framed : Bool
  c : Canvas
  // While data() runs, mark elements collect here and are emitted as
  // one <g data-plot="x0 y0 x1 y1"> group — the conceptual parent
  // region check.mbtx can verify against.
  mut buf : Array[String]?
}

///|
pub fn Plot::Plot(
  c : Canvas,
  meta : ChartMeta,
  xdom : Point,
  ydom : Point,
  x~ : Double = 0,
  y~ : Double = 0,
  w~ : Double = 420,
  h~ : Double = 200,
  xscale~ : ScaleKind = Linear,
  yscale~ : ScaleKind = Linear,
  xtitle~ : String? = None,
  ytitle~ : String? = None,
  xfmt~ : (Double) -> String = fmt_num,
  yfmt~ : (Double) -> String = fmt_num,
  grid~ : Bool = false,
) -> Plot {
  let x0 = x
  let y0 = y
  let x1 = x0 + w
  let y1 = y0 + h
  let p = {
    x0,
    y0,
    x1,
    y1,
    xs: Scale::Scale(xdom.0, xdom.1, x0, x1, kind=xscale),
    ys: Scale::Scale(ydom.0, ydom.1, y1, y0, kind=yscale),
    meta,
    xfmt,
    yfmt,
    xtitle,
    ytitle,
    grid,
    framed: false,
    c,
    buf: None,
  }
  // The frame texts land at construction so a caller cannot forget them.
  c.text(x0, y0 - 40.0, meta.title, size=15.0)
  c.text(x0, y0 - 22.0, meta.subtitle, size=11.0, opacity=Some(0.65))
  c.text(x0, y1 + 42.0, meta.footnote, size=10.0, opacity=Some(0.55))
  p
}

///|
fn Plot::put(self : Plot, el : String, covered : Array[Point]) -> Unit {
  match self.buf {
    Some(buf) => buf.push(el)
    None => self.c.raw(el, covered~)
  }
}

/// Marks must stay inside the plot domain: a value outside it is a
/// wrong domain choice, not a detail to clip silently.

///|
fn Plot::inside(self : Plot, pts : Array[Point]) -> Array[Point] {
  for p in pts {
    let (x, y) = p
    if x < self.x0 - 0.01 ||
      x > self.x1 + 0.01 ||
      y < self.y0 - 0.01 ||
      y > self.y1 + 0.01 {
      abort("point (\{fixed1(x)}, \{fixed1(y)}) outside the plot domain")
    }
  }
  pts
}

///|
fn fixed1(v : Double) -> String {
  fixed(v, d=1)
}

///|
fn sattrs(
  dash~ : String?,
  opacity~ : Double?,
  width~ : Double,
  color~ : String,
) -> String {
  let w = " stroke-width=\"\{num(width)}\""
  let d = match dash {
    None => ""
    Some(p) => " stroke-dasharray=\"\{p}\""
  }
  let o = match opacity {
    Some(v) => " opacity=\"\{num(v)}\""
    None => ""
  }
  " stroke=\"\{color}\"" + w + d + o
}

/// Run mark-emitting calls; their elements go into a
/// <g data-plot="x0 y0 x1 y1"> group so the linter can verify them
/// against the plot area instead of only the viewBox.

///|
pub fn Plot::data(self : Plot, f : (Plot) -> Unit) -> Unit {
  let buf : Array[String] = []
  let prev = self.buf
  self.buf = Some(buf)
  f(self)
  self.buf = prev
  if buf.length() > 0 {
    self.c.raw(
      "<g data-plot=\"\{num(self.x0)} \{num(self.y0)} \{num(self.x1)} \{num(self.y1)}\">\n\{buf.join("\n")}\n</g>",
      covered=[(self.x0, self.y0), (self.x1, self.y1)],
    )
  }
}

/// Axis lines, tick labels, axis titles. Called once per plot.
/// Pass xticks/yticks to override the generated ones — e.g. for
/// categorical axes (Lab(pos, label) entries).

///|
pub fn Plot::frame(
  self : Plot,
  xticks~ : Array[Tick] = [],
  yticks~ : Array[Tick] = [],
) -> Unit {
  if self.framed {
    return
  }
  self.framed = true
  let c = self.c
  c.line((self.x0, self.y0), (self.x0, self.y1), opacity=Some(0.45), width=1.0)
  c.line((self.x0, self.y1), (self.x1, self.y1), opacity=Some(0.45), width=1.0)
  let yts = if yticks.length() > 0 {
    yticks
  } else {
    self.ys.ticks().map(fn(v) { Num(v) })
  }
  for t in yts {
    let (v, label) = match t {
      Num(v) => (v, (self.yfmt)(v))
      Lab(v, s) => (v, s)
    }
    let py = self.ys.map(v)
    c.line((self.x0 - 3.0, py), (self.x0, py), opacity=Some(0.5), width=1.0)
    c.text(
      self.x0 - 6.0,
      py,
      label,
      anchor=End,
      central=true,
      size=10.0,
      opacity=Some(0.7),
    )
    if self.grid {
      c.line((self.x0, py), (self.x1, py), opacity=Some(0.1), width=1.0)
    }
  }
  let xts = if xticks.length() > 0 {
    xticks
  } else {
    self.xs.ticks().map(fn(v) { Num(v) })
  }
  for t in xts {
    let (v, label) = match t {
      Num(v) => (v, (self.xfmt)(v))
      Lab(v, s) => (v, s)
    }
    let px = self.xs.map(v)
    c.line((px, self.y1), (px, self.y1 + 3.0), opacity=Some(0.5), width=1.0)
    c.text(
      px,
      self.y1 + 16.0,
      label,
      anchor=Middle,
      size=10.0,
      opacity=Some(0.7),
    )
  }
  if self.xtitle is Some(t) {
    c.text(
      (self.x0 + self.x1) / 2.0,
      self.y1 + 30.0,
      t,
      anchor=Middle,
      size=10.0,
      opacity=Some(0.7),
    )
  }
  if self.ytitle is Some(t) {
    // horizontal, above the axis top-left: readable without rotation.
    c.text(self.x0, self.y0 - 8.0, t, size=10.0, opacity=Some(0.7))
  }
}

/// A connected series. `label` draws the series name at its right end
/// (direct labelling, not a legend box).

///|
pub fn Plot::series(
  self : Plot,
  pts : Array[Point],
  label~ : String? = None,
  dash~ : String? = None,
  opacity~ : Double? = None,
  width~ : Double = 1.5,
  color~ : String = "currentColor",
) -> Unit {
  if pts.length() < 2 {
    return
  }
  let d = "M" +
    self.inside(pts).map(fn(p) { "\{num(p.0)} \{num(p.1)}" }).join(" L")
  self.put(
    "<path d=\"\{d}\" fill=\"none\"\{sattrs(dash~, opacity~, width~, color~)}/>",
    pts,
  )
  if label is Some(l) {
    self.c.text(
      self.x1 + 6.0,
      pts[pts.length() - 1].1,
      l,
      central=true,
      size=10.0,
    )
  }
}

/// Filled area under a data series. Unlike `series`, x/y inputs are data
/// coordinates and are mapped here; `baseline` is also a data y value.

///|
pub fn Plot::area(
  self : Plot,
  xs : Array[Double],
  ys : Array[Double],
  baseline~ : Double = 0.0,
  color~ : String = "currentColor",
  opacity~ : Double = 0.25,
) -> Unit {
  if xs.length() < 2 || xs.length() != ys.length() {
    return
  }
  let pts = xs.mapi(fn(i, x) { (self.xs.map(x), self.ys.map(ys[i])) })
  let by = self.ys.map(baseline)
  let poly = pts + [(pts[pts.length() - 1].0, by), (pts[0].0, by)]
  self.inside(poly) |> ignore
  let d = "M" + poly.map(fn(p) { "\{num(p.0)} \{num(p.1)}" }).join(" L") + " Z"
  self.put(
    "<path d=\"\{d}\" fill=\"\{color}\" fill-opacity=\"\{num(opacity)}\" stroke=\"none\"/>",
    poly,
  )
}

/// Band between two data series with the same x coordinates.

///|
pub fn Plot::band(
  self : Plot,
  xs : Array[Double],
  lower : Array[Double],
  upper : Array[Double],
  color~ : String = "currentColor",
  opacity~ : Double = 0.18,
) -> Unit {
  if xs.length() < 2 ||
    xs.length() != lower.length() ||
    xs.length() != upper.length() {
    return
  }
  let up = xs.mapi(fn(i, x) { (self.xs.map(x), self.ys.map(upper[i])) })
  let down = xs
    .rev()
    .mapi(fn(i, x) {
      let j = xs.length() - 1 - i
      (self.xs.map(x), self.ys.map(lower[j]))
    })
  let poly = up + down
  self.inside(poly) |> ignore
  let d = "M" + poly.map(fn(p) { "\{num(p.0)} \{num(p.1)}" }).join(" L") + " Z"
  self.put(
    "<path d=\"\{d}\" fill=\"\{color}\" fill-opacity=\"\{num(opacity)}\" stroke=\"none\"/>",
    poly,
  )
}

/// Step series for ECDF: horizontal then vertical at each point.

///|
pub fn Plot::step(
  self : Plot,
  pts : Array[Point],
  label~ : String? = None,
  dash~ : String? = None,
  opacity~ : Double? = None,
  width~ : Double = 1.5,
  color~ : String = "currentColor",
) -> Unit {
  if pts.length() < 2 {
    return
  }
  let segs : Array[Point] = [pts[0]]
  for i in 1..<pts.length() {
    segs.push((pts[i].0, pts[i - 1].1))
    segs.push(pts[i])
  }
  let d = "M" +
    self.inside(segs).map(fn(p) { "\{num(p.0)} \{num(p.1)}" }).join(" L")
  self.put(
    "<path d=\"\{d}\" fill=\"none\"\{sattrs(dash~, opacity~, width~, color~)}/>",
    segs,
  )
  if label is Some(l) {
    self.c.text(
      self.x1 + 6.0,
      pts[pts.length() - 1].1,
      l,
      central=true,
      size=10.0,
    )
  }
}

///|
pub fn Plot::dots(
  self : Plot,
  pts : Array[Point],
  r~ : Double = 1.8,
  opacity~ : Double = 0.5,
  color~ : String = "currentColor",
) -> Unit {
  let fill = color
  for p in self.inside(pts) {
    let (x, y) = p
    self.put(
      "<circle cx=\"\{num(x)}\" cy=\"\{num(y)}\" r=\"\{num(r)}\" fill=\"\{fill}\" fill-opacity=\"\{num(opacity)}\" stroke=\"none\"/>",
      [(x, y)],
    )
  }
  // dots do not extend the viewBox; the frame's domain already does.
}

/// An event marker: vertical line at data x, with a short label above.

///|
pub fn Plot::vline(
  self : Plot,
  xv : Double,
  label~ : String? = None,
  dash~ : String? = Some("4 3"),
  opacity~ : Double = 0.6,
) -> Unit {
  let px = self.xs.map(xv)
  self.put(
    "<line x1=\"\{num(px)}\" y1=\"\{num(self.y0)}\" x2=\"\{num(px)}\" y2=\"\{num(self.y1)}\"\{sattrs(dash~, opacity=Some(opacity), width=1.0, color="currentColor")}/>",
    [(px, self.y0), (px, self.y1)],
  )
  self.inside([(px, self.y0)]) |> ignore
  if label is Some(l) {
    self.c.text(px + 4.0, self.y0 + 10.0, l, size=10.0, opacity=Some(0.8))
  }
}

/// A reference line (SLO, baseline): horizontal line at data y.

///|
pub fn Plot::hline(
  self : Plot,
  yv : Double,
  label~ : String? = None,
  dash~ : String? = Some("4 3"),
  opacity~ : Double = 0.6,
) -> Unit {
  let py = self.ys.map(yv)
  self.put(
    "<line x1=\"\{num(self.x0)}\" y1=\"\{num(py)}\" x2=\"\{num(self.x1)}\" y2=\"\{num(py)}\"\{sattrs(dash~, opacity=Some(opacity), width=1.0, color="currentColor")}/>",
    [(self.x0, py), (self.x1, py)],
  )
  self.inside([(self.x1, py)]) |> ignore
  if label is Some(l) {
    self.c.text(
      self.x1 - 4.0,
      py - 4.0,
      l,
      anchor=End,
      size=10.0,
      opacity=Some(0.8),
    )
  }
}

/// Box-and-whisker per group, centred at x = i + 0.5 (use xdom
/// [0, groups.length]). Whiskers reach the 1.5*IQR fences clamped
/// to the data range; values beyond are outlier dots. `overlay`
/// jitters raw points behind the boxes — the guideline wants raw
/// points overlaid for small n because the box alone hides shape.

///|
pub fn Plot::boxplot(
  self : Plot,
  groups : Array[BoxGroup],
  box_w~ : Double = 0.44,
  overlay~ : Double = 0,
  color~ : String = "currentColor",
  rand~ : (() -> Double)? = None,
) -> Unit {
  let stride = if overlay > 0 && overlay < 1 {
    @cmp.maximum(1.0, (1.0 / overlay).round()).to_int()
  } else {
    1
  }
  for i, g in groups {
    let s = g.values.copy()
    s.sort()
    let q1 = quantile(s, q=0.25)
    let q2 = quantile(s, q=0.5)
    let q3 = quantile(s, q=0.75)
    let iqr = q3 - q1
    let lo = @cmp.maximum(s[0], q1 - 1.5 * iqr)
    let hi = @cmp.minimum(s[s.length() - 1], q3 + 1.5 * iqr)
    let cx = self.xs.map(i.to_double() + 0.5)
    let bw = (self.xs.map(i.to_double() + 0.5 + box_w) - cx) * 2.0
    if overlay > 0 && rand is Some(r) {
      for j in 0..<s.length() {
        if j % stride != 0 {
          continue
        }
        let jx = @cmp.minimum(
          @cmp.maximum(cx + (r() - 0.5) * bw * 1.6, self.x0 + 1.5),
          self.x1 - 1.5,
        ) // jitter stays inside the domain
        self.put(
          "<circle cx=\"\{fixed1(jx)}\" cy=\"\{fixed1(self.ys.map(s[j]))}\" r=\"1.3\" fill=\"\{color}\" fill-opacity=\"0.28\" stroke=\"none\"/>",
          [],
        )
      }
    }
    // whiskers + caps
    self.inside([(cx, self.ys.map(lo)), (cx, self.ys.map(hi))]) |> ignore
    let lo_y = self.ys.map(lo)
    let hi_y = self.ys.map(hi)
    self.put(
      "<line x1=\"\{num(cx)}\" y1=\"\{num(lo_y)}\" x2=\"\{num(cx)}\" y2=\"\{num(hi_y)}\"\{sattrs(dash=None, opacity=Some(0.8), width=1.0, color~)}/>",
      [],
    )
    self.put(
      "<line x1=\"\{num(cx - bw * 0.2)}\" y1=\"\{num(lo_y)}\" x2=\"\{num(cx + bw * 0.2)}\" y2=\"\{num(lo_y)}\"\{sattrs(dash=None, opacity=None, width=1.0, color~)}/>",
      [],
    )
    self.put(
      "<line x1=\"\{num(cx - bw * 0.2)}\" y1=\"\{num(hi_y)}\" x2=\"\{num(cx + bw * 0.2)}\" y2=\"\{num(hi_y)}\"\{sattrs(dash=None, opacity=None, width=1.0, color~)}/>",
      [],
    )
    // outliers beyond the fences
    for v in s {
      if v < lo || v > hi {
        self.put(
          "<circle cx=\"\{fixed1(cx)}\" cy=\"\{fixed1(self.ys.map(v))}\" r=\"1.6\" fill=\"none\" stroke=\"\{color}\" stroke-width=\"1\" opacity=\"0.6\"/>",
          [],
        )
      }
    }
    // IQR box + median
    self.put(
      "<rect x=\"\{fixed1(cx - bw / 2.0)}\" y=\"\{fixed1(self.ys.map(q3))}\" width=\"\{fixed1(bw)}\" height=\"\{fixed1(self.ys.map(q1) - self.ys.map(q3))}\" fill=\"\{color}\" fill-opacity=\"0.18\" stroke=\"\{color}\" stroke-width=\"1.5\"/>",
      [],
    )
    self.put(
      "<line x1=\"\{num(cx - bw / 2.0)}\" y1=\"\{num(self.ys.map(q2))}\" x2=\"\{num(cx + bw / 2.0)}\" y2=\"\{num(self.ys.map(q2))}\"\{sattrs(dash=None, opacity=None, width=2.5, color~)}/>",
      [],
    )
  }
}

/// Histogram bars from bins() output; heights are counts.

///|
pub fn Plot::histogram(
  self : Plot,
  bins : Array[Bin],
  color~ : String = "currentColor",
) -> Unit {
  for b in bins {
    let x = self.xs.map(b.x0)
    let w = self.xs.map(b.x1) - x
    let top = self.inside([(self.xs.map(b.x0), self.ys.map(b.n.to_double()))])[0].1
    self.put(
      "<rect x=\"\{fixed1(x)}\" y=\"\{fixed1(top)}\" width=\"\{fixed1(w)}\" height=\"\{fixed1(self.y1 - top)}\" fill=\"\{color}\" fill-opacity=\"0.35\" stroke=\"\{color}\" stroke-width=\"1\"/>",
      [],
    )
  }
}

/// Cells of a rows x cols grid; fill-opacity encodes value against
/// the data max (sequential single-hue scale: currentColor keeps it
/// theme-following). Row 0 draws at the top. Returns (min, max) for
/// the legend.

///|
pub fn Plot::heatmap(
  self : Plot,
  grid : Array[Array[Double]],
  color~ : String = "currentColor",
) -> (Double, Double) {
  let rows = grid.length()
  let cols = grid[0].length()
  let cw = (self.x1 - self.x0) / cols.to_double()
  let ch = (self.y1 - self.y0) / rows.to_double()
  let (min, max) = grid.fold(init=(@double.infinity, @double.neg_infinity), fn(
    acc,
    row,
  ) {
    row.fold(init=acc, fn(acc, v) { (acc.0.min(v), acc.1.max(v)) })
  })
  let span = if max - min == 0 { 1.0 } else { max - min }
  for j, row in grid {
    for i, v in row {
      let o = 0.06 + 0.9 * ((v - min) / span)
      self.put(
        "<rect x=\"\{fixed1(self.x0 + i.to_double() * cw)}\" y=\"\{fixed1(self.y0 + j.to_double() * ch)}\" width=\"\{fixed1(cw - 0.6)}\" height=\"\{fixed1(ch - 0.6)}\" fill=\"\{color}\" fill-opacity=\"\{fixed(o, d=2)}\" stroke=\"none\"/>",
        [],
      )
    }
  }
  (min, max)
}

/// Legend ramp for heatmap(): N steps of increasing fill-opacity
/// with min/max labels below and an optional caption to the left.
/// Position it above the plot top so labels stay clear of cells.

///|
pub fn Plot::heat_legend(
  self : Plot,
  mm : (Double, Double),
  x : Double,
  y : Double,
  w~ : Double = 70,
  fmt~ : (Double) -> String = fmt_num,
  label~ : String? = None,
) -> Unit {
  let (min, max) = mm
  let steps = 6
  let sw = w / steps.to_double()
  for i in 0..<steps {
    let o = 0.06 + 0.9 * (i.to_double() / (steps - 1).to_double())
    self.c.raw(
      "<rect x=\"\{fixed1(x + i.to_double() * sw)}\" y=\"\{num(y)}\" width=\"\{fixed1(sw - 1.0)}\" height=\"8\" fill=\"currentColor\" fill-opacity=\"\{fixed(o, d=2)}\" stroke=\"none\"/>",
    )
  }
  self.c.text(x, y + 16.0, fmt(min), size=9.0, opacity=Some(0.6))
  self.c.text(
    x + w,
    y + 16.0,
    fmt(max),
    anchor=End,
    size=9.0,
    opacity=Some(0.6),
  )
  if label is Some(l) {
    self.c.text(
      x - 6.0,
      y + 4.0,
      l,
      anchor=End,
      central=true,
      size=9.0,
      opacity=Some(0.6),
    )
  }
}

/// Count samples into width-w bins aligned to w*k boundaries.

///|
pub fn bins(values : Array[Double], w~ : Double) -> Array[Bin] {
  let (mn, mx) = values.fold(init=(@double.infinity, @double.neg_infinity), fn(
    acc,
    v,
  ) {
    (acc.0.min(v), acc.1.max(v))
  })
  let lo = @math.floor(mn / w) * w
  let hi = @math.ceil(mx / w) * w
  let out : Array[Bin] = []
  for x = lo; x < hi - 1.0e-9; x = x + w {
    out.push({ x0: x, x1: x + w, n: 0, })
  }
  for v in values {
    let i = @cmp.minimum(out.length() - 1, @math.floor((v - lo) / w).to_int())
    out[i].n += 1
  }
  out
}

/// Build an ECDF's pixel points from raw samples on a Plot. `max`
/// thins the step vertices for inline embedding — the statistic is
/// the same, only fewer of its vertices are drawn.

///|
pub fn Plot::ecdf_points(
  self : Plot,
  samples~ : Array[Double],
  max~ : Double = @double.infinity,
) -> Array[Point] {
  let s = samples.copy()
  s.sort()
  let stride = @cmp.maximum(1.0, @math.floor(s.length().to_double() / max)).to_int()
  let pts : Array[Point] = []
  for i in 0..<s.length() {
    if i % stride != 0 {
      continue
    }
    pts.push(
      (
        self.xs.map(s[i]),
        self.ys.map((i + 1).to_double() / s.length().to_double()),
      ),
    )
  }
  pts.push((self.xs.map(s[s.length() - 1]), self.ys.map(1.0)))
  pts
}
