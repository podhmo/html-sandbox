// Package tinymarkdown parses a tiny subset of Markdown into a pure-data
// tree. It is a port of go/pkg/tinymarkdown and keeps its behavior,
// including the cases its tests pin down.
//
// Supported: headings "#" to "#####" (which open nested sections), "- " or "* "
// list items and "N. " numbered items (which may continue on indented lines
// and nest by indentation), paragraphs, "> "
// quotes, "|" tables, code blocks fenced by exactly "```", "<details>"
// blocks, and "[^label]" footnotes. Anything else is treated as paragraph
// text. Block parsing keeps inline syntax as text; inlines splits out code
// spans and links on request.
//
// Go indexes strings by byte and MoonBit by UTF-16 code unit. Every
// character the parser looks for is ASCII, so the two agree.

///|
/// Document is the root of a parsed document. Blocks before the first
/// heading are its direct children. footnotes holds the "[^label]: ..."
/// definitions of the document, in roughly the order they are written —
/// a definition inside another's body is collected before the one that
/// holds it. Where they are written does not matter — a definition may
/// sit anywhere, inside a quote or a details block too — and the first
/// definition of a label wins.
#derive(Eq, Debug)
pub(all) struct Document {
  children : Array[Block]
  footnotes : Array[FootnoteDef]
}

// The derived Eq and Debug are meant for == and assert_eq, not as methods;
// the #deprecated extends below (and in inline.mbt) mark the implicitly
// promoted methods as unwanted (warning implicit_impl_as_method), as el does.

///|
#deprecated("Use == and != instead")
pub extend Document with Eq::{not_equal, equal}

///|
#deprecated("Use Debug::to_repr instead")
pub extend Document with Debug::{to_repr}

///|
/// Block is a block-level node.
///
/// - Section is a heading together with everything up to the next heading
///   of the same or a shallower level (level is 1..5).
/// - Paragraph is a run of consecutive non-blank lines, joined with "\n".
/// - List is a run of consecutive "- ", "* ", or "N. " lines, an ItemList
///   whose kind is what the first marker makes it. Each item is nested
///   under the nearest item above it whose marker is indented less, as "b"
///   is under "a" in "- a\n  - b"; with no such item, it is at the top
///   level. Indentation counts leading spaces and tabs, one column each.
/// - Quote is a run of consecutive lines starting with ">". The text after
///   ">" and one optional space is parsed again as a document.
/// - Alert is a quote whose first line is a GitHub-style alert marker such
///   as "[!NOTE]": the marker is taken off the content and kept as kind,
///   the marker's type. The rest is parsed again as a document, as in
///   Quote.
/// - Table is a run of consecutive lines starting with "|": a header row, a
///   delimiter row such as "| --- | --- |", and body rows. Cells are trimmed
///   and "\|" is unescaped to "|"; every row has as many cells as the
///   header. Column alignment is accepted but ignored.
/// - CodeBlock is the content between "```" fences, lines joined with
///   "\n". When the opening fence is indented, each content line loses as
///   much leading indentation as the fence has — all of it on a line with
///   less — as CommonMark does. info is the text after the opening fence,
///   trimmed — usually a language name such as "go" or "svg".
/// - Details is a "<details>" line through its matching "</details>"
///   line, which may nest. A first non-blank line of the form
///   "<summary>...</summary>" is kept as summary, None without one; the
///   rest is parsed again as a document, as in Quote. The tags are the
///   whole line:
///   "<details open>" and the like stay paragraph text.
#derive(Eq, Debug)
pub(all) enum Block {
  Section(level~ : Int32, title~ : String, children~ : Array[Block])
  Paragraph(String)
  List(ItemList)
  Quote(Array[Block])
  Alert(kind~ : AlertKind, children~ : Array[Block])
  Table(header~ : Array[String], rows~ : Array[Array[String]])
  CodeBlock(String, info~ : String?)
  Details(summary~ : String?, children~ : Array[Block])
}

///|
#deprecated("Use == and != instead")
pub extend Block with Eq::{not_equal, equal}

///|
#deprecated("Use Debug::to_repr instead")
pub extend Block with Debug::{to_repr}

///|
/// ListKind is what the first marker of a list run makes it: "- " and
/// "* " a bullet list, "N. " an ordered list starting at N. The numbers
/// of the items after the first do not matter — HTML numbers them.
#derive(Eq, Debug)
pub(all) enum ListKind {
  Bullet
  Ordered(start~ : Int32)
}

///|
#deprecated("Use == and != instead")
pub extend ListKind with Eq::{not_equal, equal}

///|
#deprecated("Use Debug::to_repr instead")
pub extend ListKind with Debug::{to_repr}

///|
/// ItemList is a run of list items and the kind its first marker gives it.
#derive(Eq, Debug)
pub(all) struct ItemList {
  kind : ListKind
  items : Array[Item]
}

///|
#deprecated("Use == and != instead")
pub extend ItemList with Eq::{not_equal, equal}

///|
#deprecated("Use Debug::to_repr instead")
pub extend ItemList with Debug::{to_repr}

///|
/// Item is a list item: the text after the marker, with the nested list
/// under it, if any. Indented lines that follow an item without a list
/// marker continue its text, joined with "\n".
#derive(Eq, Debug)
pub(all) struct Item {
  text : String
  children : ItemList?
}

///|
#deprecated("Use == and != instead")
pub extend Item with Eq::{not_equal, equal}

///|
#deprecated("Use Debug::to_repr instead")
pub extend Item with Debug::{to_repr}

///|
/// AlertKind is the type a "[!KIND]" marker gives its quote block.
#derive(Eq, Debug)
pub(all) enum AlertKind {
  Note
  Tip
  Important
  Warning
  Caution
}

///|
#deprecated("Use == and != instead")
pub extend AlertKind with Eq::{not_equal, equal}

///|
#deprecated("Use Debug::to_repr instead")
pub extend AlertKind with Debug::{to_repr}

///|
/// AlertKind::name is the kind's lowercase name — "note", "tip",
/// "important", "warning", or "caution" — as the "[!KIND]" marker writes
/// it. It is also the HTML class suffix and the name the JS bridge emits.
pub fn AlertKind::name(self : AlertKind) -> String {
  match self {
    Note => "note"
    Tip => "tip"
    Important => "important"
    Warning => "warning"
    Caution => "caution"
  }
}

///|
/// FootnoteDef is a "[^label]: text" definition. The label is the text
/// between "[^" and "]"; it may not be empty or hold brackets or a line
/// break. The text after ":" is the start of the body; the indented lines
/// that follow — and the blank lines between them — continue it, and the
/// whole body is parsed again as a document, as in Quote. The definition
/// line must start at the first column: an indented "[^label]:" continues
/// a list item or stays paragraph text.
#derive(Eq, Debug)
pub(all) struct FootnoteDef {
  label : String
  children : Array[Block]
}

///|
#deprecated("Use == and != instead")
pub extend FootnoteDef with Eq::{not_equal, equal}

///|
#deprecated("Use Debug::to_repr instead")
pub extend FootnoteDef with Debug::{to_repr}

///|
const FENCE = "```"

///|
/// MAX_LEVEL is the deepest heading level recognized.
const MAX_LEVEL = 5

///|
/// trim_space is Go's strings.TrimSpace. It walks the ends itself: `trim` with
/// a character set would build a set (or, for a non-ASCII one, compare each
/// character against every member) on every line and every table cell. It
/// returns a view, as Go's TrimSpace returns a substring, so the caller decides
/// whether the trimmed text has to be copied.
fn trim_space(s : StringView) -> StringView {
  let n = s.length()
  let mut start = 0
  while start < n && is_space_code(s[start]) {
    start = start + 1
  }
  let mut end = n
  while end > start && is_space_code(s[end - 1]) {
    end = end - 1
  }
  s[start:end]
}

///|
/// is_space_code reports whether the UTF-16 code unit c is one of the
/// characters Go's unicode.IsSpace accepts, so that trimming matches
/// strings.TrimSpace. Every one of them is in the Basic Multilingual Plane, so
/// a code unit is enough.
fn is_space_code(c : UInt16) -> Bool {
  if c <= ' ' {
    return (c >= '\t' && c <= '\r') || c == ' '
  }
  match c {
    '\u{85}'
    | '\u{A0}'
    | '\u{1680}'
    | '\u{2028}'
    | '\u{2029}'
    | '\u{202F}'
    | '\u{205F}'
    | '\u{3000}' => true
    _ => c >= '\u{2000}' && c <= '\u{200A}'
  }
}

///|
/// Flat is what scan produces: blocks, with headings kept flat until nest
/// builds sections.
priv enum Flat {
  Block(Block)
  Heading(Int32, String)
}

///|
/// FootnoteSet collects the footnote definitions of a document as scan
/// finds them. A label already seen is not collected again: the first
/// definition wins.
priv struct FootnoteSet {
  seen : Map[String, Bool]
  list : Array[FootnoteDef]
}

///|
fn FootnoteSet::add(
  self : FootnoteSet,
  label : String,
  children : Array[Block],
) -> Unit {
  if self.seen.contains(label) {
    return
  }
  self.seen[label] = true
  self.list.push({ label, children, })
}

///|
/// parse parses src. It never fails: lines it does not understand become
/// paragraph text.
pub fn parse(src : String) -> Document {
  let notes = FootnoteSet::{ seen: {}, list: [], }
  let (children, _) = nest(scan(src, notes), from=0, level=0)
  { children, footnotes: notes.list, }
}

///|
/// parse_children is the recursion of parse: the blocks of src, with the
/// footnote definitions of src added to notes so that every definition of
/// the outer document is collected wherever it was written.
fn parse_children(src : String, notes : FootnoteSet) -> Array[Block] {
  let (children, _) = nest(scan(src, notes), from=0, level=0)
  children
}

///|
/// Pending is the block kind scan is accumulating lines for; at most one
/// is open at a time. A line of a different kind flushes it first.
priv enum Pending {
  Nothing
  Para(Array[StringView])
  Items(Array[RawItem])
  Quote(Array[StringView])
  Table(Array[StringView])
}

///|
/// Mode is the multi-line construct scan is inside, if any: a code fence,
/// a "<details>" block, or a footnote definition. Each variant holds the
/// state that exists only while that mode is open.
priv enum Mode {
  Normal
  Code(info~ : StringView, indent~ : Int32, lines~ : Array[StringView])
  Details(mut depth~ : Int32, mut in_code~ : Bool, lines~ : Array[StringView])
  Footnote(label~ : String, mut blank~ : Int32, lines~ : Array[String])
}

///|
/// scan splits src into a flat list of blocks, with headings as markers.
fn scan(src : String, notes : FootnoteSet) -> Array[Flat] {
  let out : Array[Flat] = []
  let mut pending = Pending::Nothing
  let mut mode = Mode::Normal
  fn flush() {
    match pending {
      Nothing => ()
      Para(lines) => out.push(Block(Paragraph(lines.join("\n"))))
      Items(items) =>
        out.push(Block(List(nest_items(items, from=0, parent=-1).0.unwrap())))
      Quote(lines) =>
        match alert_kind(lines[0]) {
          Some(kind) => {
            ignore(lines.remove(0))
            out.push(
              Block(
                Alert(kind~, children=parse_children(lines.join("\n"), notes)),
              ),
            )
          }
          None =>
            out.push(Block(Quote(parse_children(lines.join("\n"), notes))))
        }
      Table(lines) =>
        match parse_table(lines) {
          Some(t) => out.push(Block(t))
          None => out.push(Block(Paragraph(lines.join("\n"))))
        }
    }
    pending = Nothing
  }

  for raw in src.split("\n") {
    // line stays a view: only the lines that are kept are copied to a String.
    let line = raw.strip_suffix("\r").unwrap_or(raw)
    let trimmed = trim_space(line)
    match mode {
      Code(info~, indent~, lines~) => {
        if trimmed == FENCE {
          out.push(
            Block(
              CodeBlock(
                lines.join("\n"),
                info=if info == "" { None } else { Some(info.to_owned()) },
              ),
            ),
          )
          mode = Normal
        } else {
          lines.push(dedent(line, indent))
        }
        continue
      }
      Details(..) as d => {
        if d.in_code {
          if trimmed == FENCE {
            d.in_code = false
          }
        } else if trimmed.has_prefix(FENCE) {
          d.in_code = true
        } else if trimmed == "<details>" {
          d.depth += 1
        } else if trimmed == "</details>" {
          d.depth -= 1
          if d.depth == 0 {
            out.push(Block(parse_details(d.lines, notes)))
            mode = Normal
            continue
          }
        }
        d.lines.push(line)
        continue
      }
      Footnote(..) as f => {
        // Inside a footnote definition: an indented line continues it, and
        // a blank line keeps it open for one more indented line.
        if trimmed == "" {
          f.blank += 1
          continue
        }
        if line[0] is (' ' | '\t') {
          for _ in 0..<f.blank {
            f.lines.push("")
          }
          f.blank = 0
          f.lines.push(trimmed.to_owned())
          continue
        }
        notes.add(f.label, parse_children(f.lines.join("\n"), notes))
        mode = Normal
      }
      Normal => ()
    }
    if trimmed.has_prefix(FENCE) {
      flush()
      mode = Code(
        info=trim_space(trimmed[FENCE.length():]),
        indent=indent(line),
        lines=[],
      )
    } else if trimmed == "" {
      flush()
    } else if is_heading(trimmed) {
      flush()
      out.push(parse_heading(trimmed))
    } else if footnote_def(line) is Some((label, text)) {
      flush()
      mode = Footnote(label~, blank=0, lines=[text])
    } else if trimmed.has_prefix("|") {
      match pending {
        Table(lines) => lines.push(trimmed)
        _ => {
          flush()
          pending = Table([trimmed])
        }
      }
    } else if trimmed.has_prefix(">") {
      let rest = line[line.find(">").unwrap() + 1:]
      let text = rest.strip_prefix(" ").unwrap_or(rest).to_owned()
      match pending {
        Quote(lines) => lines.push(text)
        _ => {
          flush()
          pending = Quote([text])
        }
      }
    } else if list_item(trimmed) is Some((kind, text)) {
      let it = RawItem::{ indent: indent(line), kind, text: text.to_owned(), }
      match pending {
        Items(items) => items.push(it)
        _ => {
          flush()
          pending = Items([it])
        }
      }
    } else if trimmed == "<details>" {
      flush()
      mode = Details(depth=1, in_code=false, lines=[])
    } else if pending is Items(items) &&
      line.length() != trimmed.length() &&
      line[0] is (' ' | '\t') {
      // An indented line continues the item above it.
      items[items.length() - 1].text += "\n\{trimmed}"
    } else {
      match pending {
        Para(lines) => lines.push(trimmed)
        _ => {
          flush()
          pending = Para([trimmed])
        }
      }
    }
  }
  match mode {
    Code(info~, lines~, ..) =>
      // An unclosed fence runs to the end of the document.
      out.push(
        Block(
          CodeBlock(
            lines.join("\n"),
            info=if info == "" { None } else { Some(info.to_owned()) },
          ),
        ),
      )
    Details(..) as d =>
      // An unclosed "<details>" runs to the end of the document.
      out.push(Block(parse_details(d.lines, notes)))
    Footnote(..) as f =>
      // A footnote definition open at the end closes there.
      notes.add(f.label, parse_children(f.lines.join("\n"), notes))
    Normal => ()
  }
  flush()
  out
}

///|
/// parse_details turns the lines collected between "<details>" and
/// "</details>" into a Details. A first non-blank line of the form
/// "<summary>...</summary>" is kept as summary; the rest is parsed again
/// as a document, as in Quote.
fn parse_details(lines : Array[StringView], notes : FootnoteSet) -> Block {
  let mut summary : String? = None
  let mut body = lines[:]
  for i, line in lines {
    if trim_space(line) == "" {
      continue
    }
    if summary_text(line) is Some(s) {
      summary = Some(s)
      body = lines[i + 1:]
    }
    break
  }
  Details(summary~, children=parse_children(body.join("\n"), notes))
}

///|
/// footnote_def returns the label and the first line of the body of a
/// "[^label]: text" line, or None when the line is not one. The label is
/// the non-empty, bracket-free text between "[^" and "]"; the body starts
/// after ":". The line must start at the first column.
fn footnote_def(line : StringView) -> (String, String)? {
  guard line.strip_prefix("[^") is Some(rest) else { return None }
  guard rest.find("]") is Some(i) else { return None }
  guard i > 0 &&
    !rest[:i].contains("[") &&
    i + 1 < rest.length() &&
    rest[i + 1] == ':' else {
    return None
  }
  Some((rest[:i].to_owned(), trim_space(rest[i + 2:]).to_owned()))
}

///|
/// summary_text returns the text of a "<summary>...</summary>" line,
/// trimmed.
fn summary_text(line : StringView) -> String? {
  let line = trim_space(line)
  guard line.strip_prefix("<summary>") is Some(inner) &&
    inner.has_suffix("</summary>") else {
    return None
  }
  let inner = inner[:inner.length() - "</summary>".length()]
  if inner.contains("</summary>") {
    return None
  }
  Some(trim_space(inner).to_owned())
}

///|
/// alert_kind returns the type of a GitHub-style alert marker —
/// "[!NOTE]", "[!TIP]", "[!IMPORTANT]", "[!WARNING]", or "[!CAUTION]" —
/// or None when line is not a marker. The marker is matched ASCII
/// case-insensitively and must be the whole line, trailing space aside.
fn alert_kind(line : StringView) -> AlertKind? {
  let mut end = line.length()
  while end > 0 && (line[end - 1] == ' ' || line[end - 1] == '\t') {
    end = end - 1
  }
  let line = line[0:end]
  guard line.length() >= 4 &&
    line[0] == '[' &&
    line[1] == '!' &&
    line[end - 1] == ']' else {
    return None
  }
  let inner = line[2:end - 1]
  for kind in [Note, Tip, Important, Warning, Caution] {
    if ascii_eq_fold(inner, kind.name()) {
      return Some(kind)
    }
  }
  None
}

///|
/// ascii_eq_fold compares two views ignoring ASCII letter case.
fn ascii_eq_fold(a : StringView, b : StringView) -> Bool {
  guard a.length() == b.length() else { return false }
  for i = 0; i < a.length(); i = i + 1 {
    if ascii_lower(a[i]) != ascii_lower(b[i]) {
      return false
    }
  }
  true
}

///|
fn ascii_lower(c : UInt16) -> UInt16 {
  if c >= 'A' && c <= 'Z' {
    c + 32
  } else {
    c
  }
}

///|
/// RawItem is a list item as scan reads it, kept flat until nest_items
/// builds the nested lists.
priv struct RawItem {
  indent : Int32
  kind : ListKind
  mut text : String
}

///|
/// list_item splits a list marker — "- ", "* ", or "N. " — off the
/// trimmed line, returning the kind the marker would give its list and
/// the text after it. N is a run of up to 9 digits, as CommonMark allows,
/// and may not be 0: "0." stays paragraph text.
fn list_item(line : StringView) -> (ListKind, StringView)? {
  if line is ([.. "- ", .. rest] | [.. "* ", .. rest]) {
    return Some((Bullet, trim_space(rest)))
  }
  let n = line.length()
  let mut i = 0
  while i < n && line[i] >= '0' && line[i] <= '9' {
    i = i + 1
  }
  if i == 0 || i > 9 || i + 1 >= n || line[i] != '.' || line[i + 1] != ' ' {
    return None
  }
  let mut num = 0
  for j = 0; j < i; j = j + 1 {
    num = num * 10 + (line[j].to_int() - '0'.to_int())
  }
  if num == 0 {
    return None
  }
  Some((Ordered(start=num), trim_space(line[i + 2:])))
}

///|
/// indent counts the leading spaces and tabs of line.
fn indent(line : StringView) -> Int32 {
  let n = line.length()
  let mut i = 0
  while i < n && (line[i] == ' ' || line[i] == '\t') {
    i = i + 1
  }
  i
}

///|
/// dedent removes up to n leading spaces and tabs of line — all of them
/// when it has fewer than n — as CommonMark does for the content lines of
/// a fence indented n columns.
fn dedent(line : StringView, n : Int32) -> StringView {
  let mut i = 0
  while i < n && i < line.length() && (line[i] == ' ' || line[i] == '\t') {
    i = i + 1
  }
  line[i:]
}

///|
/// nest_items turns indentation in flat into nested lists. It consumes
/// items from flat[from:] while they are indented deeper than parent,
/// returning the list — its kind taken from its first item's marker —
/// and the index where it stopped, or None when nothing is deeper.
fn nest_items(
  flat : Array[RawItem],
  from~ : Int32,
  parent~ : Int32,
) -> (ItemList?, Int32) {
  guard from < flat.length() && flat[from].indent > parent else {
    return (None, from)
  }
  let items = []
  for i = from; i < flat.length() && flat[i].indent > parent; {
    let (children, next) = nest_items(flat, from=i + 1, parent=flat[i].indent)
    items.push({ text: flat[i].text, children, })
    continue next
  } nobreak {
    (Some({ kind: flat[from].kind, items, }), i)
  }
}

///|
/// parse_table parses the lines of a table. It fails, leaving the lines to
/// be a paragraph, unless the second line is a delimiter row with as many
/// cells as the header.
fn parse_table(lines : Array[StringView]) -> Block? {
  guard lines is [header, delim, .. body] else { return None }
  let header = cells(header)
  let delim = cells(delim)
  guard delim.length() == header.length() && delim.iter().all(is_delimiter) else {
    return None
  }
  let rows = []
  for line in body {
    let row = cells(line)
    row.truncate(header.length())
    for _ in row.length()..<header.length() {
      row.push("")
    }
    rows.push(row)
  }
  Some(Table(header~, rows~))
}

///|
/// cells splits a row such as "| a | b |" at unescaped "|". The leading
/// "|" is required by scan; the trailing one is optional. It jumps from one
/// separator to the next, rather than writing every character to a builder.
fn cells(line : StringView) -> Array[String] {
  let line = line.strip_prefix("|").unwrap_or(line)
  let out = []
  let n = line.length()
  let mut start = 0
  let mut i = 0
  while i < n {
    let j = match line[i:].find("|") {
      None => break
      Some(k) => i + k
    }
    i = j + 1
    // "\|" is a literal "|", not a separator: a backslash always escapes the
    // "|" right after it.
    if j > start && line[j - 1] == '\\' {
      continue
    }
    out.push(trim_space(unescape_cell(line[start:j])).to_owned())
    start = i
  }
  let rest = trim_space(unescape_cell(line[start:]))
  if rest != "" {
    out.push(rest.to_owned())
  }
  out
}

///|
/// unescape_cell turns "\|" into "|". It returns s as is when there is no
/// backslash, so the common cell does not allocate.
fn unescape_cell(s : StringView) -> StringView {
  if s.contains("\\") {
    s.replace_all(old="\\|", new="|")[:]
  } else {
    s
  }
}

///|
/// is_delimiter reports whether c is a delimiter cell: "---", ":---",
/// ":---:", or "---:", with at least one "-".
fn is_delimiter(c : String) -> Bool {
  // Count directly: `trim(chars="-")` builds a character set on every cell.
  let c = c[:]
  let n = c.length()
  let mut start = 0
  let mut end = n
  if start < end && c[start] == ':' {
    start = start + 1
  }
  if end > start && c[end - 1] == ':' {
    end = end - 1
  }
  if start >= end {
    return false
  }
  for i = start; i < end; i = i + 1 {
    if c[i] != '-' {
      return false
    }
  }
  true
}

///|
fn is_heading(line : StringView) -> Bool {
  let n = line.length()
  let mut i = 0
  while i < n && line[i] == '#' {
    i = i + 1
  }
  1 <= i && i <= MAX_LEVEL && i < n && line[i] == ' '
}

///|
fn parse_heading(line : StringView) -> Flat {
  let n = line.find(" ").unwrap()
  Heading(n, trim_space(line[n:]).to_owned())
}

///|
/// nest turns headings in flat into nested sections. It consumes blocks
/// from flat[from:] until a heading at or above level, returning the children
/// and the index where it stopped.
fn nest(
  flat : Array[Flat],
  from~ : Int32,
  level~ : Int32,
) -> (Array[Block], Int32) {
  let out = []
  for i = from; i < flat.length(); {
    match flat[i] {
      Block(b) => {
        out.push(b)
        continue i + 1
      }
      Heading(h, _) if h <= level => break (out, i)
      Heading(h, title) => {
        let (children, next) = nest(flat, from=i + 1, level=h)
        out.push(Section(level=h, title~, children~))
        continue next
      }
    }
  } nobreak {
    (out, i)
  }
}
