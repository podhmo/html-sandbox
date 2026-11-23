// svg.mbt -- a tiny builder for small concept figures (port of svg.ts).
//
// The point is not a DSL: it is that no coordinate is ever written twice.
// A box owns its position, an arrow takes anchors (`anchor(shape, E)`),
// so a line endpoint cannot drift away from the shape it is meant to
// touch. The canvas derives its own viewBox from what was drawn, so a
// label cannot silently fall outside it.

///|
#derive(Eq)
pub(all) enum Side {
  N
  S
  E
  W
}

///|
pub type Point = (Double, Double)

///|
#derive(Debug)
pub(all) struct Shape {
  x : Double
  y : Double
  w : Double
  h : Double
}

///|
#derive(Debug)
pub(all) enum Sizing {
  Auto
  Fixed(Double)
}

///|
#derive(Eq)
pub(all) enum TextAnchor {
  Start
  Middle
  End
}

///|
#derive(Eq)
pub(all) enum Heads {
  End
  Start
  Both
  NoHead
}

///|
#derive(Eq)
pub(all) enum HighlightMode {
  Wash
  Ring
}

///| Categorical palette for the "colorful" option: Okabe-Ito-derived
/// hues with lightness adjusted to stay legible on both light and dark
/// backgrounds. The default figure is colorless (currentColor only);
/// pass `color=c.color(i)` on strokes/fills when series distinction
/// needs hue — six categories max, per the figure guideline.
pub let palette : Array[String] = [
  "#3B82C4", // blue
  "#E69F00", // orange
  "#00A876", // bluish green
  "#D55E00", // vermillion
  "#CC79A7", // reddish purple
  "#56B4E9", // sky blue
]

///|
let ascii_w : Double = 0.55

///|
let cjk_w : Double = 1.0

///|
pub fn text_width(s : String, size : Double) -> Double {
  let mut w = 0.0
  for ch in s {
    w += (if ch.to_int() > 0x2e80 { cjk_w } else { ascii_w }) * size
  }
  w
}

///|
fn esc(s : String) -> String {
  s
  .replace_all(old="&", new="&amp;")
  .replace_all(old="<", new="&lt;")
  .replace_all(old=">", new="&gt;")
}

///|
fn num(v : Double) -> String {
  v.to_string()
}

/// Pull a polyline's ends toward its middle by `start`/`end` px.
///|
fn trim_ends(pts : Array[Point], start : Double, end : Double) -> Array[Point] {
  let out = pts.copy()
  if start > 0 && out.length() > 1 {
    let d = @math.hypot(out[1].0 - out[0].0, out[1].1 - out[0].1)
    let dd = if d == 0 { 1.0 } else { d }
    out[0] = (
      out[0].0 + (out[1].0 - out[0].0) / dd * start,
      out[0].1 + (out[1].1 - out[0].1) / dd * start,
    )
  }
  let n = out.length()
  if end > 0 && n > 1 {
    let d = @math.hypot(out[n - 1].0 - out[n - 2].0, out[n - 1].1 - out[n - 2].1)
    let dd = if d == 0 { 1.0 } else { d }
    out[n - 1] = (
      out[n - 1].0 - (out[n - 1].0 - out[n - 2].0) / dd * end,
      out[n - 1].1 - (out[n - 1].1 - out[n - 2].1) / dd * end,
    )
  }
  out
}

///|
fn side_point(b : Shape, side : Side) -> Point {
  match side {
    N => (b.x + b.w / 2.0, b.y)
    S => (b.x + b.w / 2.0, b.y + b.h)
    W => (b.x, b.y + b.h / 2.0)
    E => (b.x + b.w, b.y + b.h / 2.0)
  }
}

///|
pub struct Canvas {
  margin : Double
  backdrop : Array[String]
  parts : Array[String]
  mut min_x : Double
  mut min_y : Double
  mut max_x : Double
  mut max_y : Double
}

///|
pub fn Canvas::new(margin~ : Double = 10) -> Canvas {
  {
    margin,
    backdrop: [],
    parts: [],
    min_x: @double.infinity,
    min_y: @double.infinity,
    max_x: @double.neg_infinity,
    max_y: @double.neg_infinity,
  }
}

///|
fn Canvas::cover(self : Canvas, pts : Array[Point]) -> Unit {
  for p in pts {
    let (x, y) = p
    if x < self.min_x {
      self.min_x = x
    }
    if y < self.min_y {
      self.min_y = y
    }
    if x > self.max_x {
      self.max_x = x
    }
    if y > self.max_y {
      self.max_y = y
    }
  }
}

///|
fn stroke_attrs(
  dash~ : String,
  opacity~ : Double?,
  width~ : Double,
  color~ : String,
) -> String {
  let w = " stroke-width=\"\{num(width)}\""
  let d = if dash == "" { "" } else { " stroke-dasharray=\"\{dash}\"" }
  let o = match opacity {
    Some(v) => " opacity=\"\{v}\""
    None => ""
  }
  " stroke=\"\{esc(color)}\"" + w + d + o
}

/// Palette color for the colorful option. Indexes wrap around, but
/// the guideline caps categorical color use at six anyway.
///|
pub fn Canvas::color(_self : Canvas, i : Int) -> String {
  let n = palette.length()
  palette[((i % n) + n) % n]
}

///|
fn Canvas::label_lines(
  self : Canvas,
  cx : Double,
  cy : Double,
  label : String,
  size : Double,
  opacity~ : Double?,
  underline~ : Double,
) -> Unit {
  let lines = label.split("\n").map(fn(v) { v.to_owned() }).collect()
  let lh = size * 1.3
  let k = lines.length()
  for i, s in lines {
    self.text(
      cx,
      cy + (i.to_double() - (k - 1).to_double() / 2.0) * lh,
      s,
      anchor=Middle,
      central=true,
      size~,
      opacity~,
      underline~,
    )
  }
}

/// Shapes return {x, y, w, h}; anchors and placement read from it.
/// Pass `Auto` for `w` to size the box to its widest label line
/// (+pad_x each side).
///|
pub fn Canvas::box(
  self : Canvas,
  x : Double,
  y : Double,
  w : Sizing,
  h : Double,
  label~ : String = "",
  rx~ : Double = 8,
  pad_x~ : Double = 16,
  size~ : Double = 14,
  dash~ : String = "",
  opacity~ : Double? = None,
  width~ : Double = 1.5,
  color~ : String = "currentColor",
  underline~ : Double = 0,
) -> Shape {
  let ww = match w {
    Auto => {
      if label == "" {
        abort("box w=Auto needs a label")
      }
      let mut m = 0.0
      for s in label.split("\n") {
        let tw = text_width(s.to_owned(), size)
        if tw > m {
          m = tw
        }
      }
      m + 2.0 * pad_x
    }
    Fixed(v) => v
  }
  self.parts.push(
    "<rect x=\"\{num(x)}\" y=\"\{num(y)}\" width=\"\{num(ww)}\" height=\"\{num(h)}\" rx=\"\{num(rx)}\"" +
    " fill=\"none\"\{stroke_attrs(dash~, opacity~, width~, color~)}/>",
  )
  if label != "" {
    self.label_lines(x + ww / 2.0, y + h / 2.0, label, size, opacity~, underline~)
  }
  let shape = { x, y, w: ww, h }
  self.cover([(x, y), (x + ww, y + h)])
  shape
}

///|
pub fn Canvas::circle(
  self : Canvas,
  cx : Double,
  cy : Double,
  r : Double,
  label~ : String = "",
  size~ : Double = 14,
  dash~ : String = "",
  opacity~ : Double? = None,
  width~ : Double = 1.5,
  color~ : String = "currentColor",
  underline~ : Double = 0,
) -> Shape {
  self.parts.push(
    "<circle cx=\"\{num(cx)}\" cy=\"\{num(cy)}\" r=\"\{num(r)}\"" +
    " fill=\"none\"\{stroke_attrs(dash~, opacity~, width~, color~)}/>",
  )
  if label != "" {
    self.label_lines(cx, cy, label, size, opacity~, underline~)
  }
  let shape = { x: cx - r, y: cy - r, w: 2.0 * r, h: 2.0 * r }
  self.cover([(cx - r, cy - r), (cx + r, cy + r)])
  shape
}

///|
pub fn Canvas::text(
  self : Canvas,
  x : Double,
  y : Double,
  s : String,
  anchor~ : TextAnchor = Start,
  central~ : Bool = false,
  size~ : Double = 14,
  opacity~ : Double? = None,
  underline~ : Double = 0,
) -> Unit {
  let a = match anchor {
    Start => ""
    Middle => " text-anchor=\"middle\""
    End => " text-anchor=\"end\""
  }
  let bl = if central { " dominant-baseline=\"central\"" } else { "" }
  let o = match opacity {
    Some(v) => " opacity=\"\{v}\""
    None => ""
  }
  self.parts.push(
    "<text x=\"\{num(x)}\" y=\"\{num(y)}\" font-size=\"\{num(size)}\"\{a}\{bl} fill=\"currentColor\"\{o}>\{esc(s)}</text>",
  )
  let w = text_width(s, size)
  let lx = match anchor {
    Middle => x - w / 2.0
    End => x - w
    Start => x
  }
  let ty = if central { y - size / 2.0 } else { y - size }
  let by = ty + size * 1.2
  if underline > 0 {
    self.parts.push(
      "<path d=\"M\{num(lx)} \{num(by + 2.0)} L\{num(lx + w)} \{num(by + 2.0)}\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"\{num(underline)}\"\{o}/>",
    )
    self.cover([(lx, by + 2.0 + underline / 2.0)])
  }
  self.cover([(lx, ty), (lx + w, by)])
}

///|
pub fn Canvas::anchor(_self : Canvas, shape : Shape, side : Side) -> Point {
  side_point(shape, side)
}

///|
pub fn Canvas::center(_self : Canvas, shape : Shape) -> Point {
  (shape.x + shape.w / 2.0, shape.y + shape.h / 2.0)
}

/// Placement helpers: coordinates for a shape next to another.
///|
pub fn Canvas::right_of(_self : Canvas, shape : Shape, gap : Double) -> Double {
  shape.x + shape.w + gap
}

///|
pub fn Canvas::left_of(_self : Canvas, shape : Shape, gap : Double, w : Double) -> Double {
  shape.x - gap - w
}

///|
pub fn Canvas::below(_self : Canvas, shape : Shape, gap : Double) -> Double {
  shape.y + shape.h + gap
}

///|
pub fn Canvas::above(_self : Canvas, shape : Shape, gap : Double, h : Double) -> Double {
  shape.y - gap - h
}

///|
pub fn Canvas::arrow(
  self : Canvas,
  from : Point,
  to : Point,
  via~ : Array[Point] = [],
  head~ : Double = 9,
  heads~ : Heads = End,
  split~ : Double = 0,
  gap~ : Double = 3,
  gap_start~ : Double? = None,
  gap_end~ : Double? = None,
  dash~ : String = "",
  opacity~ : Double? = None,
  width~ : Double = 1.5,
  color~ : String = "currentColor",
) -> Unit {
  if split > 0 {
    let dx = to.0 - from.0
    let dy = to.1 - from.1
    let dlen = @math.hypot(dx, dy)
    let len = if dlen == 0 { 1.0 } else { dlen }
    let nx = -dy / len * (split / 2.0)
    let ny = dx / len * (split / 2.0)
    let shift = fn(p : Point, s : Double) -> Point { (p.0 + nx * s, p.1 + ny * s) }
    // The forward arrow takes the "above/left of travel" side, like a
    // sequence diagram: request on top, response below.
    self.arrow(
      shift(from, -1.0),
      shift(to, -1.0),
      via=via.map(fn(p) { shift(p, -1.0) }),
      head~,
      heads=End,
      gap~,
      gap_start~,
      gap_end~,
      dash~,
      opacity~,
      width~,
      color~,
    )
    self.arrow(
      shift(to, 1.0),
      shift(from, 1.0),
      via=via.rev().map(fn(p) { shift(p, 1.0) }),
      head~,
      heads=End,
      gap~,
      gap_start~,
      gap_end~,
      dash~,
      opacity~,
      width~,
      color~,
    )
    return
  }
  let pts = trim_ends(
    [from] + via + [to],
    gap_start.unwrap_or(gap),
    gap_end.unwrap_or(gap),
  )
  let d = "M" + pts.map(fn(p) { "\{num(p.0)} \{num(p.1)}" }).join(" L")
  // A head is an open V at `tip`, pointing along (ux, uy).
  let head_at = fn(tip : Point, seg : Point) -> String {
    let (qx, qy) = tip
    let dlen = @math.hypot(tip.0 - seg.0, tip.1 - seg.1)
    let len = if dlen == 0 { 1.0 } else { dlen }
    let ux = (tip.0 - seg.0) / len
    let uy = (tip.1 - seg.1) / len
    let bx = qx - head * ux
    let by = qy - head * uy
    let pxn = -uy * head * 0.45
    let pyn = ux * head * 0.45
    self.cover([(bx + pxn, by + pyn), (bx - pxn, by - pyn)])
    "<path d=\"M\{num(bx + pxn)} \{num(by + pyn)} L\{num(qx)} \{num(qy)} L\{num(bx - pxn)} \{num(by - pyn)}\"" +
    " fill=\"none\"\{stroke_attrs(dash~, opacity~, width~, color~)}/>"
  }
  let heads_svg = match heads {
    NoHead => ""
    _ =>
      (if heads == End || heads == Both {
        head_at(pts[pts.length() - 1], pts[pts.length() - 2])
      } else {
        ""
      }) +
      (if heads == Start || heads == Both { head_at(pts[0], pts[1]) } else { "" })
  }
  self.parts.push(
    "<path d=\"\{d}\" fill=\"none\"\{stroke_attrs(dash~, opacity~, width~, color~)}/>" +
    heads_svg,
  )
  self.cover(pts)
}

///|
pub fn Canvas::midpoint(_self : Canvas, from : Point, to : Point) -> Point {
  ((from.0 + to.0) / 2.0, (from.1 + to.1) / 2.0)
}

///|
pub(all) struct Hbar {
  label : String
  value : Double
}

/// Horizontal bars for tiny benchmark-style numbers. Bar lengths come
/// from the values, so a wrong length is impossible by construction.
///|
pub fn Canvas::hbars(
  self : Canvas,
  items : Array[Hbar],
  x~ : Double = 0,
  y~ : Double = 0,
  bar_h~ : Double = 20,
  row_gap~ : Double = 12,
  max_w~ : Double = 280,
  label_w~ : Double? = None,
  size~ : Double = 12,
  value_fmt~ : (Double) -> String = fn(v) { v.to_string() },
  fill_opacity~ : Double = 0.45,
  highlight~ : Int? = None,
) -> Unit {
  let lw = match label_w {
    Some(v) => v
    None => {
      let mut m = 0.0
      for it in items {
        let tw = text_width(it.label, size)
        if tw > m {
          m = tw
        }
      }
      m + 16.0
    }
  }
  let mut mv = 0.0
  for it in items {
    if it.value > mv {
      mv = it.value
    }
  }
  let scale = max_w / mv
  for i, item in items {
    let by = y + i.to_double() * (bar_h + row_gap)
    let w = item.value * scale
    self.text(x + lw - 8.0, by + bar_h / 2.0, item.label, anchor=End, central=true, size~)
    let bar = { x: x + lw, y: by, w, h: bar_h }
    if highlight == Some(i) {
      self.highlight(bar, pad=4.0)
    }
    self.parts.push(
      "<rect x=\"\{num(bar.x)}\" y=\"\{num(by)}\" width=\"\{num(w)}\" height=\"\{num(bar_h)}\"" +
      " fill=\"currentColor\" fill-opacity=\"\{fill_opacity}\" stroke=\"currentColor\" stroke-width=\"1\"/>",
    )
    self.text(
      x + lw + w + 6.0,
      by + bar_h / 2.0,
      value_fmt(item.value),
      central=true,
      size=size - 1.0,
      opacity=Some(0.7),
    )
    self.cover([(x + lw, by), (x + lw + w, by + bar_h)])
  }
}

/// A low-key emphasis zone behind a shape. `Wash` is a translucent
/// currentColor fill (a grey wash in light theme, a light veil in dark
/// theme); `Ring` is a dashed enclosure; both render behind the shape
/// so they never cover its label.
///|
pub fn Canvas::highlight(
  self : Canvas,
  shape : Shape,
  pad~ : Double = 7,
  opacity~ : Double = 0.08,
  mode~ : HighlightMode = Wash,
  rx~ : Double? = None,
) -> Unit {
  let x = shape.x - pad
  let y = shape.y - pad
  let w = shape.w + 2.0 * pad
  let h = shape.h + 2.0 * pad
  let r = rx.unwrap_or(pad + 4.0)
  let el = match mode {
    Ring =>
      "<rect x=\"\{num(x)}\" y=\"\{num(y)}\" width=\"\{num(w)}\" height=\"\{num(h)}\" rx=\"\{num(r)}\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-dasharray=\"4 3\"/>"
    Wash =>
      "<rect x=\"\{num(x)}\" y=\"\{num(y)}\" width=\"\{num(w)}\" height=\"\{num(h)}\" rx=\"\{num(r)}\" fill=\"currentColor\" fill-opacity=\"\{opacity}\" stroke=\"none\"/>"
  }
  self.backdrop.push(el)
  self.cover([(x, y), (x + w, y + h)])
}

///|
pub fn Canvas::line(
  self : Canvas,
  from : Point,
  to : Point,
  via~ : Array[Point] = [],
  gap~ : Double = 0,
  gap_start~ : Double? = None,
  gap_end~ : Double? = None,
  dash~ : String = "",
  opacity~ : Double? = None,
  width~ : Double = 1.5,
  color~ : String = "currentColor",
) -> Unit {
  let pts = trim_ends(
    [from] + via + [to],
    gap_start.unwrap_or(gap),
    gap_end.unwrap_or(gap),
  )
  let d = "M" + pts.map(fn(p) { "\{num(p.0)} \{num(p.1)}" }).join(" L")
  self.parts.push(
    "<path d=\"\{d}\" fill=\"none\"\{stroke_attrs(dash~, opacity~, width~, color~)}/>",
  )
  self.cover(pts)
}

/// raw(el) is an escape hatch for elements the builder does not know
/// (chart.mbt uses it for scatter dots); caller lists the covered points.
///|
pub fn Canvas::raw(self : Canvas, el : String, covered~ : Array[Point] = []) -> Unit {
  self.parts.push(el)
  self.cover(covered)
}

/// path(d) is an escape hatch for curves; caller lists the covered points.
///|
pub fn Canvas::path(
  self : Canvas,
  d : String,
  covered : Array[Point],
  dash~ : String = "",
  opacity~ : Double? = None,
  width~ : Double = 1.5,
  color~ : String = "currentColor",
) -> Unit {
  self.parts.push(
    "<path d=\"\{d}\" fill=\"none\"\{stroke_attrs(dash~, opacity~, width~, color~)}/>",
  )
  self.cover(covered)
}

///|
pub fn Canvas::render(
  self : Canvas,
  width~ : Double? = None,
  height~ : Double? = None,
  label~ : String = "",
) -> String {
  let m = self.margin
  let w = self.max_x - self.min_x + 2.0 * m
  let h = self.max_y - self.min_y + 2.0 * m
  let vb = "\{num(self.min_x - m)} \{num(self.min_y - m)} \{num(w)} \{num(h)}"
  let wv = match width {
    Some(v) => v.to_string()
    None => w.round().to_int64().to_string()
  }
  let hv = match height {
    Some(v) => v.to_string()
    None => h.round().to_int64().to_string()
  }
  let size = " width=\"\{wv}\" height=\"\{hv}\""
  let aria = if label != "" { " role=\"img\" aria-label=\"\{esc(label)}\"" } else { "" }
  "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"\{vb}\"\{size}\{aria}>\n" +
  self.backdrop.join("\n") +
  (if self.backdrop.length() > 0 { "\n" } else { "" }) +
  self.parts.join("\n") +
  "\n</svg>\n"
}
