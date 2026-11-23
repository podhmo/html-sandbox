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
/// Underline style for text, porting the TS `boolean | number` option:
/// `No` draws nothing, `Yes` draws the default 2px rule, `Custom(w)`
/// draws a rule of width `w`. As a sum type the off/on/custom cases are
/// exhaustive in `match`, rather than a magic `0` inside a Double.
#derive(Eq)
pub(all) enum Underline {
  No
  Yes
  Custom(Double)
}

///|
/// What sits at the ends of an `arrow` call: a single polyline with
/// its `Heads` decoration, or a parallel request/response pair at the
/// given offset. In the TS kit `heads` and `split` were independent
/// options, so `heads=Both` together with `split` silently ignored the
/// heads choice; folding them into one enum removes that state.
#derive(Eq)
pub(all) enum Ends {
  Single(Heads)
  Pair(Double)
}

///|
#derive(Eq)
pub(all) enum HighlightMode {
  Wash
  Ring
}

///|
/// Categorical palette for the "colorful" option: Okabe-Ito-derived
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
pub fn text_width(s : String, size~ : Double) -> Double {
  s
  .iter()
  .fold(init=0.0, fn(w, ch) {
    w + (if ch.to_int() > 0x2e80 { cjk_w } else { ascii_w }) * size
  })
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
  // Match JS String(v): integral values print without a fraction
  // (up to 1e21, where JS switches to exponential notation).
  if v == v.trunc() && v.abs() < 9.0e18 {
    v.to_int64().to_string()
  } else {
    v.to_string()
  }
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
    let d = @math.hypot(
      out[n - 1].0 - out[n - 2].0,
      out[n - 1].1 - out[n - 2].1,
    )
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
/// One node of the picture tree. A leaf (`El`) is an emitted SVG
/// fragment plus the points it covers; a `Group` bundles nodes that
/// logically form one figure (a box and its label, an arrow line and
/// its heads) so bounds and rendering are folds over the tree rather
/// than state threaded through every draw call.
priv enum Node {
  El(String, Array[Point])
  Group(Array[Node])
}

///|
fn Node::emit(self : Node) -> String {
  match self {
    El(s, _) => s
    Group(ns) => ns.map(Node::emit).join("\n")
  }
}

///|
fn Node::bounds(self : Node) -> Bounds? {
  match self {
    El(_, covered) =>
      covered.fold(init=None, fn(b, p) { Some(extend_bounds(b, p)) })
    Group(ns) => ns.fold(init=None, fn(b, n) { merge_bounds(b, n.bounds()) })
  }
}

///|
fn merge_bounds(a : Bounds?, b : Bounds?) -> Bounds? {
  match (a, b) {
    (None, x) => x
    (x, None) => x
    (Some(a), Some(b)) =>
      Some({
        min_x: if a.min_x < b.min_x {
          a.min_x
        } else {
          b.min_x
        },
        min_y: if a.min_y < b.min_y {
          a.min_y
        } else {
          b.min_y
        },
        max_x: if a.max_x > b.max_x {
          a.max_x
        } else {
          b.max_x
        },
        max_y: if a.max_y > b.max_y {
          a.max_y
        } else {
          b.max_y
        },
      })
  }
}

///|
fn extend_bounds(b : Bounds?, p : Point) -> Bounds {
  match b {
    None => { min_x: p.0, min_y: p.1, max_x: p.0, max_y: p.1, }
    Some(b) => b.cover(p)
  }
}

///|
fn nodes_bounds(ns : Array[Node]) -> Bounds? {
  ns.fold(init=None, fn(b, n) { merge_bounds(b, n.bounds()) })
}

///|
fn emit_nodes(ns : Array[Node]) -> String {
  ns.map(Node::emit).join("\n")
}

///|
/// The document is one tree: a backdrop layer (highlight washes and
/// rings, painted first) and a content layer. Draw calls append nodes;
/// `render` folds the tree into the SVG element.
pub struct Canvas {
  margin : Double
  priv backdrop : Array[Node]
  priv parts : Array[Node]
}

///|
pub fn Canvas::Canvas(margin~ : Double = 10) -> Canvas {
  { margin, backdrop: [], parts: [], }
}

///|
priv struct Bounds {
  min_x : Double
  min_y : Double
  max_x : Double
  max_y : Double
}

///|
fn Bounds::cover(self : Bounds, p : Point) -> Bounds {
  {
    min_x: if p.0 < self.min_x {
      p.0
    } else {
      self.min_x
    },
    min_y: if p.1 < self.min_y {
      p.1
    } else {
      self.min_y
    },
    max_x: if p.0 > self.max_x {
      p.0
    } else {
      self.max_x
    },
    max_y: if p.1 > self.max_y {
      p.1
    } else {
      self.max_y
    },
  }
}

///|
fn Canvas::push(self : Canvas, node : Node) -> Unit {
  self.parts.push(node)
}

///|
fn stroke_attrs(
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
  " stroke=\"\{esc(color)}\"" + w + d + o
}

/// Palette color for the colorful option. Indexes wrap around, but
/// the guideline caps categorical color use at six anyway.

///|
pub fn Canvas::color(_self : Canvas, i : Int32) -> String {
  let n = palette.length()
  palette[(i % n + n) % n]
}

///|
fn Canvas::label_lines(
  self : Canvas,
  cx : Double,
  cy : Double,
  label : String,
  size : Double,
  opacity~ : Double?,
  underline~ : Underline,
) -> Node {
  let lines = [ for s in label.split("\n") => s.to_owned() ]
  let lh = size * 1.3
  let k = lines.length()
  Group(
    lines.mapi(fn(i, s) {
      self.text_node(
        cx,
        cy + (i.to_double() - (k - 1).to_double() / 2.0) * lh,
        s,
        anchor=Middle,
        central=true,
        size~,
        opacity~,
        underline~,
      )
    }),
  )
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
  label~ : String? = None,
  rx~ : Double = 8,
  pad_x~ : Double = 16,
  size~ : Double = 14,
  dash~ : String? = None,
  opacity~ : Double? = None,
  width~ : Double = 1.5,
  color~ : String = "currentColor",
  underline~ : Underline = No,
) -> Shape {
  let ww = match w {
    Auto =>
      match label {
        None => abort("box w=Auto needs a label")
        Some(l) =>
          l
          .split("\n")
          .fold(init=0.0, fn(m, s) {
            @cmp.maximum(m, text_width(s.to_owned(), size~))
          }) +
          2.0 * pad_x
      }
    Fixed(v) => v
  }
  let rect = El(
    "<rect x=\"\{num(x)}\" y=\"\{num(y)}\" width=\"\{num(ww)}\" height=\"\{num(h)}\" rx=\"\{num(rx)}\"" +
    " fill=\"none\"\{stroke_attrs(dash~, opacity~, width~, color~)}/>",
    [(x, y), (x + ww, y + h)],
  )
  let node = match label {
    Some(l) =>
      Group([
        rect,
        self.label_lines(
          x + ww / 2.0,
          y + h / 2.0,
          l,
          size,
          opacity~,
          underline~,
        ),
      ])
    None => rect
  }
  self.push(node)
  { x, y, w: ww, h, }
}

///|
pub fn Canvas::circle(
  self : Canvas,
  cx : Double,
  cy : Double,
  r : Double,
  label~ : String? = None,
  size~ : Double = 14,
  dash~ : String? = None,
  opacity~ : Double? = None,
  width~ : Double = 1.5,
  color~ : String = "currentColor",
  underline~ : Underline = No,
) -> Shape {
  let ring = El(
    "<circle cx=\"\{num(cx)}\" cy=\"\{num(cy)}\" r=\"\{num(r)}\"" +
    " fill=\"none\"\{stroke_attrs(dash~, opacity~, width~, color~)}/>",
    [(cx - r, cy - r), (cx + r, cy + r)],
  )
  let node = match label {
    Some(l) =>
      Group([ring, self.label_lines(cx, cy, l, size, opacity~, underline~)])
    None => ring
  }
  self.push(node)
  { x: cx - r, y: cy - r, w: 2.0 * r, h: 2.0 * r, }
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
  underline~ : Underline = No,
) -> Unit {
  self.push(
    self.text_node(x, y, s, anchor~, central~, size~, opacity~, underline~),
  )
}

///|
fn Canvas::text_node(
  _self : Canvas,
  x : Double,
  y : Double,
  s : String,
  anchor~ : TextAnchor = Start,
  central~ : Bool = false,
  size~ : Double = 14,
  opacity~ : Double? = None,
  underline~ : Underline = No,
) -> Node {
  let a = match anchor {
    Start => ""
    Middle => " text-anchor=\"middle\""
    End => " text-anchor=\"end\""
  }
  let bl = if central { " dominant-baseline=\"central\"" } else { "" }
  let o = match opacity {
    Some(v) => " opacity=\"\{num(v)}\""
    None => ""
  }
  let w = text_width(s, size~)
  let lx = match anchor {
    Middle => x - w / 2.0
    End => x - w
    Start => x
  }
  let ty = if central { y - size / 2.0 } else { y - size }
  let by = ty + size * 1.2
  let uw = match underline {
    No => 0.0
    Yes => 2.0
    Custom(w) => w
  }
  let leaf = El(
    "<text x=\"\{num(x)}\" y=\"\{num(y)}\" font-size=\"\{num(size)}\"\{a}\{bl} fill=\"currentColor\"\{o}>\{esc(s)}</text>",
    [(lx, ty), (lx + w, by)],
  )
  if uw > 0.0 {
    Group([
      leaf,
      El(
        "<path d=\"M\{num(lx)} \{num(by + 2.0)} L\{num(lx + w)} \{num(by + 2.0)}\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"\{num(uw)}\"\{o}/>",
        [(lx, by + 2.0 + uw / 2.0)],
      ),
    ])
  } else {
    leaf
  }
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
pub fn Canvas::left_of(
  _self : Canvas,
  shape : Shape,
  gap : Double,
  w : Double,
) -> Double {
  shape.x - gap - w
}

///|
pub fn Canvas::below(_self : Canvas, shape : Shape, gap : Double) -> Double {
  shape.y + shape.h + gap
}

///|
pub fn Canvas::above(
  _self : Canvas,
  shape : Shape,
  gap : Double,
  h : Double,
) -> Double {
  shape.y - gap - h
}

///|
pub fn Canvas::arrow(
  self : Canvas,
  from : Point,
  to : Point,
  via~ : Array[Point] = [],
  head~ : Double = 9,
  ends~ : Ends = Single(End),
  gap~ : Double = 3,
  gap_start~ : Double? = None,
  gap_end~ : Double? = None,
  dash~ : String? = None,
  opacity~ : Double? = None,
  width~ : Double = 1.5,
  color~ : String = "currentColor",
) -> Unit {
  match ends {
    Pair(split) => {
      let dx = to.0 - from.0
      let dy = to.1 - from.1
      let dlen = @math.hypot(dx, dy)
      let len = if dlen == 0 { 1.0 } else { dlen }
      let nx = -dy / len * (split / 2.0)
      let ny = dx / len * (split / 2.0)
      let shift = fn(p : Point, s : Double) -> Point {
        (p.0 + nx * s, p.1 + ny * s)
      }
      // The forward arrow takes the "above/left of travel" side, like a
      // sequence diagram: request on top, response below.
      self.arrow(
        shift(from, -1.0),
        shift(to, -1.0),
        via=via.map(fn(p) { shift(p, -1.0) }),
        head~,
        ends=Single(End),
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
        ends=Single(End),
        gap~,
        gap_start~,
        gap_end~,
        dash~,
        opacity~,
        width~,
        color~,
      )
    }
    Single(heads) => {
      let pts = trim_ends(
        [from] + via + [to],
        gap_start.unwrap_or(gap),
        gap_end.unwrap_or(gap),
      )
      let d = "M" + pts.map(fn(p) { "\{num(p.0)} \{num(p.1)}" }).join(" L")
      // A head is an open V at `tip`, pointing along (ux, uy).
      let head_at = fn(tip : Point, seg : Point) -> (String, Array[Point]) {
        let (qx, qy) = tip
        let dlen = @math.hypot(tip.0 - seg.0, tip.1 - seg.1)
        let len = if dlen == 0 { 1.0 } else { dlen }
        let ux = (tip.0 - seg.0) / len
        let uy = (tip.1 - seg.1) / len
        let bx = qx - head * ux
        let by = qy - head * uy
        let pxn = -uy * head * 0.45
        let pyn = ux * head * 0.45
        (
          "<path d=\"M\{num(bx + pxn)} \{num(by + pyn)} L\{num(qx)} \{num(qy)} L\{num(bx - pxn)} \{num(by - pyn)}\"" +
          " fill=\"none\"\{stroke_attrs(dash~, opacity~, width~, color~)}/>",
          [(bx + pxn, by + pyn), (bx - pxn, by - pyn)],
        )
      }
      let heads_out = match heads {
        NoHead => ("", [])
        _ => {
          let end = if heads is (End | Both) {
            head_at(pts[pts.length() - 1], pts[pts.length() - 2])
          } else {
            ("", [])
          }
          let start = if heads is (Start | Both) {
            head_at(pts[0], pts[1])
          } else {
            ("", [])
          }
          (end.0 + start.0, end.1 + start.1)
        }
      }
      self.push(
        El(
          "<path d=\"\{d}\" fill=\"none\"\{stroke_attrs(dash~, opacity~, width~, color~)}/>" +
          heads_out.0,
          pts + heads_out.1,
        ),
      )
    }
  }
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
  value_fmt~ : (Double) -> String = num,
  fill_opacity~ : Double = 0.45,
  highlight~ : Int32? = None,
) -> Unit {
  let lw = match label_w {
    Some(v) => v
    None =>
      items.fold(init=0.0, fn(m, it) {
        @cmp.maximum(m, text_width(it.label, size~))
      }) +
      16.0
  }
  let mv = items.fold(init=0.0, fn(m, it) { @cmp.maximum(m, it.value) })
  let scale = max_w / mv
  for i, item in items {
    let by = y + i.to_double() * (bar_h + row_gap)
    let w = item.value * scale
    let label = self.text_node(
      x + lw - 8.0,
      by + bar_h / 2.0,
      item.label,
      anchor=End,
      central=true,
      size~,
    )
    let bar = { x: x + lw, y: by, w, h: bar_h, }
    if highlight is Some(h) && h == i {
      self.highlight(bar, pad=4.0)
    }
    let rect = El(
      "<rect x=\"\{num(bar.x)}\" y=\"\{num(by)}\" width=\"\{num(w)}\" height=\"\{num(bar_h)}\"" +
      " fill=\"currentColor\" fill-opacity=\"\{num(fill_opacity)}\" stroke=\"currentColor\" stroke-width=\"1\"/>",
      [(x + lw, by), (x + lw + w, by + bar_h)],
    )
    let value = self.text_node(
      x + lw + w + 6.0,
      by + bar_h / 2.0,
      value_fmt(item.value),
      central=true,
      size=size - 1.0,
      opacity=Some(0.7),
    )
    self.push(Group([label, rect, value]))
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
      "<rect x=\"\{num(x)}\" y=\"\{num(y)}\" width=\"\{num(w)}\" height=\"\{num(h)}\" rx=\"\{num(r)}\" fill=\"currentColor\" fill-opacity=\"\{num(opacity)}\" stroke=\"none\"/>"
  }
  self.backdrop.push(El(el, [(x, y), (x + w, y + h)]))
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
  dash~ : String? = None,
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
  self.push(
    El(
      "<path d=\"\{d}\" fill=\"none\"\{stroke_attrs(dash~, opacity~, width~, color~)}/>",
      pts,
    ),
  )
}

/// raw(el) is an escape hatch for elements the builder does not know
/// (chart.mbt uses it for scatter dots); caller lists the covered points.

///|
pub fn Canvas::raw(
  self : Canvas,
  el : String,
  covered~ : Array[Point] = [],
) -> Unit {
  self.push(El(el, covered))
}

/// path(d) is an escape hatch for curves; caller lists the covered points.

///|
pub fn Canvas::path(
  self : Canvas,
  d : String,
  covered : Array[Point],
  dash~ : String? = None,
  opacity~ : Double? = None,
  width~ : Double = 1.5,
  color~ : String = "currentColor",
) -> Unit {
  self.push(
    El(
      "<path d=\"\{d}\" fill=\"none\"\{stroke_attrs(dash~, opacity~, width~, color~)}/>",
      covered,
    ),
  )
}

///|
pub fn Canvas::render(
  self : Canvas,
  width~ : Double? = None,
  height~ : Double? = None,
  label~ : String? = None,
) -> String {
  let m = self.margin
  let bounds = merge_bounds(
    nodes_bounds(self.backdrop),
    nodes_bounds(self.parts),
  )
  let vb = match bounds {
    Some(b) => {
      let w = b.max_x - b.min_x + 2.0 * m
      let h = b.max_y - b.min_y + 2.0 * m
      "\{num(b.min_x - m)} \{num(b.min_y - m)} \{num(w)} \{num(h)}"
    }
    None => "0 0 0 0"
  }
  let w = match bounds {
    Some(b) => b.max_x - b.min_x + 2.0 * m
    None => 0.0
  }
  let h = match bounds {
    Some(b) => b.max_y - b.min_y + 2.0 * m
    None => 0.0
  }
  let wv = match width {
    Some(v) => num(v)
    None => w.round().to_int64().to_string()
  }
  let hv = match height {
    Some(v) => num(v)
    None => h.round().to_int64().to_string()
  }
  let size = " width=\"\{wv}\" height=\"\{hv}\""
  let aria = match label {
    Some(l) => " role=\"img\" aria-label=\"\{esc(l)}\""
    None => ""
  }
  "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"\{vb}\"\{size}\{aria}>\n" +
  emit_nodes(self.backdrop) +
  (if self.backdrop.length() > 0 { "\n" } else { "" }) +
  emit_nodes(self.parts) +
  "\n</svg>\n"
}
