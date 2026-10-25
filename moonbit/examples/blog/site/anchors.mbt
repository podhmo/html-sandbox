// The section anchors: a port of the Go site's anchors.go.

///|
/// AnchorIds assigns an id to each heading on a page: the title is
/// slugified as on GitHub, and repeats of the same slug get "-1", "-2",
/// ... suffixes. Ids must be unique per page, so one AnchorIds covers the
/// face document and every member section of a page.
priv struct AnchorIds {
  seen : Map[String, Int32]
}

///|
fn AnchorIds::new() -> AnchorIds {
  { seen: {}, }
}

///|
/// AnchorIds::id returns the anchor id for a heading titled title. A title
/// that slugifies to nothing anchors as "sec".
fn AnchorIds::id(self : AnchorIds, title : String) -> String {
  let mut base = slugify(title)
  if base == "" {
    base = "sec"
  }
  let mut id = base
  while self.seen.contains(id) {
    let n = self.seen.get(base).unwrap_or(0) + 1
    self.seen[base] = n
    id = "\{base}-\{n}"
  }
  self.seen[id] = 0
  id
}

///|
/// slugify turns a heading title into an anchor id in the GitHub/GitLab
/// style: the title is lowercased, whitespace becomes "-", and
/// punctuation, symbols, and emoji are dropped — letters, numbers, "-",
/// and "_" are kept. Whitespace means Unicode whitespace, so a full-width
/// space also becomes "-".
///
/// The same rule is written without Unicode general categories so that
/// the Go, MoonBit, and TypeScript sites agree exactly: ASCII keeps only
/// letters, digits, "-", and "_", and non-ASCII is kept unless it falls
/// in drop_ranges or drop_chars, which enumerate the punctuation and
/// symbol blocks. A decomposed accent is kept, a composed one lowercased
/// only in its ASCII/full-width part — É stays É, matching no platform
/// exactly but matching each other.
fn slugify(title : String) -> String {
  let sb = StringBuilder()
  for c in title.iter() {
    if c.is_whitespace() {
      sb.write_char('-')
    } else if is_ascii_keeper(c) {
      sb.write_char(to_lower(c))
    } else if !c.is_ascii() && !in_drop(c) {
      sb.write_char(to_lower(c))
    }
  }
  sb.to_string()
}

///|
/// is_ascii_keeper reports whether c is an ASCII letter, digit, "-", or
/// "_".
fn is_ascii_keeper(c : Char) -> Bool {
  c == '-' ||
  c == '_' ||
  ('0' <= c && c <= '9') ||
  ('a' <= c && c <= 'z') ||
  ('A' <= c && c <= 'Z')
}

///|
/// to_lower lowercases ASCII A-Z and full-width A-Z; other letters are
/// returned unchanged, which is as far as the rule goes on every site.
fn to_lower(c : Char) -> Char {
  let i = c.to_int()
  if 'A' <= c && c <= 'Z' {
    Int32::unsafe_to_char(i + ('a'.to_int() - 'A'.to_int()))
  } else if 'Ａ' <= c && c <= 'Ｚ' {
    Int32::unsafe_to_char(i + ('ａ'.to_int() - 'Ａ'.to_int()))
  } else {
    c
  }
}

///|
/// drop_ranges are half-open [lo, hi) spans of code points to drop: the
/// Unicode punctuation and symbol blocks a blog heading might hold.
let drop_ranges : Array[(Int32, Int32)] = [
  (0x00A1, 0x00C0), // Latin-1 punctuation and symbols: ¡–¿
  (0x2000, 0x2070), // general punctuation
  (0x20A0, 0x20C0), // currency symbols
  (0x20D0, 0x2100), // combining marks for symbols
  (0x2100, 0x2150), // letterlike symbols
  (0x2190, 0x2460), // arrows, math operators, technical and control pictures
  (0x2500, 0x2C00), // box drawing, blocks, geometric shapes, dingbats, more math and arrows
  (0x2E00, 0x2E80), // supplemental punctuation
  (0x3001, 0x3004), // CJK punctuation: 、。〃
  (0x3008, 0x3012), // CJK brackets: 〈〉《》「」『』【】
  (0x3014, 0x3020), // more CJK brackets and marks: 〔〕〖〗〘〙〚〛〜〝〞〟
  (0x3030, 0x3031), // wavy dash 〰
  (0x303D, 0x303E), // part alternation mark 〽
  (0xFE00, 0xFE10), // variation selectors
  (0xFE10, 0xFE70), // vertical forms, CJK compatibility forms, small form variants
  (0xFF01, 0xFF10), // fullwidth punctuation: ！–／
  (0xFF1A, 0xFF21), // fullwidth punctuation: ：–＠
  (0xFF3B, 0xFF41), // fullwidth punctuation: ［–｀
  (0xFF5B, 0xFF66), // fullwidth and halfwidth punctuation: ｛–･
  (0x1F000, 0x1FB00), // emoji
  (0xE0000, 0xE1000), // tags and variation selectors supplement
]

///|
/// drop_chars holds punctuation outside the ranges above: ×, ÷, and the
/// katakana middle dot ・, which sits inside the katakana letter block.
let drop_chars = "×÷・"

///|
/// in_drop reports whether c is a non-ASCII punctuation or symbol to
/// drop.
fn in_drop(c : Char) -> Bool {
  for d in drop_chars {
    if d == c {
      return true
    }
  }
  let i = c.to_int()
  for r in drop_ranges {
    let (lo, hi) = r
    if lo <= i && i < hi {
      return true
    }
  }
  false
}

///|
/// permalink is the "#" link appended to a heading anchored at id. It
/// stays visible so the anchor can be copied on a phone, where nothing
/// hovers. Its glyph is raw markup: navigation chrome is not part of the
/// text a PlainRenderer dumps.
fn permalink(id : String) -> @el.Node {
  @el.el(@el.a, [
    @el.Attr(@el.class, "heading-permalink"),
    @el.Attr(@el.href, "#\{id}"),
    @el.Attr(@el.AttrName("aria-label"), "permalink"),
    @el.Raw(" #"),
  ])
}
