// Package tinymarkdown parses a tiny subset of Markdown into a pure-data
// tree. It is a port of go/pkg/tinymarkdown and keeps its behavior,
// including the cases its tests pin down.
//
// Supported: headings "#" to "#####" (which open nested sections), "- " or "* "
// list items (which may continue on indented lines and nest by
// indentation), paragraphs, "> "
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
pub(all) struct Document {
  children : Array[Block]
  footnotes : Array[FootnoteDef]
} derive(Eq, Debug)

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
/// - List is a run of consecutive "- " or "* " lines. Each item is nested under the
///   nearest item above it whose marker is indented less, as "b" is under "a"
///   in "- a\n  - b"; with no such item, it is at the top level.
///   Indentation counts leading spaces and tabs, one column each.
/// - Quote is a run of consecutive lines starting with ">". The text after
///   ">" and one optional space is parsed again as a document.
/// - Alert is a quote whose first line is a GitHub-style alert marker such
///   as "[!NOTE]": the marker is taken off the content and kept as kind,
///   the marker's lowercase type — "note", "tip", "important", "warning",
///   or "caution". The rest is parsed again as a document, as in Quote.
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
///   "<summary>...</summary>" is kept as summary; the rest is parsed again
///   as a document, as in Quote. The tags are the whole line:
///   "<details open>" and the like stay paragraph text.
pub(all) enum Block {
  Section(level~ : Int32, title~ : String, children~ : Array[Block])
  Paragraph(String)
  List(Array[Item])
  Quote(Array[Block])
  Alert(kind~ : String, children~ : Array[Block])
  Table(header~ : Array[String], rows~ : Array[Array[String]])
  CodeBlock(String, info~ : String)
  Details(summary~ : String, children~ : Array[Block])
} derive(Eq, Debug)

///|
#deprecated("Use == and != instead")
pub extend Block with Eq::{not_equal, equal}

///|
#deprecated("Use Debug::to_repr instead")
pub extend Block with Debug::{to_repr}

///|
/// Item is a list item: the text after the "- " or "* " marker, with nested items.
/// Indented lines that follow an item without a list marker continue its text,
/// joined with "\n".
pub(all) struct Item {
  text : String
  children : Array[Item]
} derive(Eq, Debug)

///|
#deprecated("Use == and != instead")
pub extend Item with Eq::{not_equal, equal}

///|
#deprecated("Use Debug::to_repr instead")
pub extend Item with Debug::{to_repr}

///|
/// FootnoteDef is a "[^label]: text" definition. The label is the text
/// between "[^" and "]"; it may not be empty or hold brackets or a line
/// break. The text after ":" is the start of the body; the indented lines
/// that follow — and the blank lines between them — continue it, and the
/// whole body is parsed again as a document, as in Quote. The definition
/// line must start at the first column: an indented "[^label]:" continues
/// a list item or stays paragraph text.
pub(all) struct FootnoteDef {
  label : String
  children : Array[Block]
} derive(Eq, Debug)

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
/// scan splits src into a flat list of blocks, with headings as markers.
fn scan(src : String, notes : FootnoteSet) -> Array[Flat] {
  let out : Array[Flat] = []
  let para : Array[StringView] = []
  let items : Array[RawItem] = []
  let quote : Array[StringView] = []
  let table : Array[StringView] = []
  fn flush() {
    if !para.is_empty() {
      out.push(Block(Paragraph(para.join("\n"))))
      para.clear()
    }
    if !items.is_empty() {
      out.push(Block(List(nest_items(items, from=0, parent=-1).0)))
      items.clear()
    }
    if !quote.is_empty() {
      let kind = alert_kind(quote[0])
      if kind != "" {
        ignore(quote.remove(0))
        out.push(
          Block(Alert(kind~, children=parse_children(quote.join("\n"), notes))),
        )
      } else {
        out.push(Block(Quote(parse_children(quote.join("\n"), notes))))
      }
      quote.clear()
    }
    if !table.is_empty() {
      match parse_table(table) {
        Some(t) => out.push(Block(t))
        None => out.push(Block(Paragraph(table.join("\n"))))
      }
      table.clear()
    }
  }

  let code : Array[StringView] = []
  let mut code_info : StringView = ""
  let mut code_indent = 0
  let mut in_code = false
  let details : Array[StringView] = []
  let mut details_depth = 0
  let mut details_code = false
  let mut in_details = false
  let foot : Array[String] = []
  let mut foot_label = ""
  let mut foot_blank = 0
  let mut in_foot = false
  for raw in src.split("\n") {
    // line stays a view: only the lines that are kept are copied to a String.
    let line = raw.strip_suffix("\r").unwrap_or(raw)
    let trimmed = trim_space(line)
    if in_code {
      if trimmed == FENCE {
        out.push(Block(CodeBlock(code.join("\n"), info=code_info.to_owned())))
        code.clear()
        code_info = ""
        code_indent = 0
        in_code = false
      } else {
        code.push(dedent(line, code_indent))
      }
      continue
    }
    if in_details {
      if details_code {
        if trimmed == FENCE {
          details_code = false
        }
        details.push(line)
      } else if trimmed.has_prefix(FENCE) {
        details_code = true
        details.push(line)
      } else if trimmed == "<details>" {
        details_depth += 1
        details.push(line)
      } else if trimmed == "</details>" {
        details_depth -= 1
        if details_depth == 0 {
          out.push(Block(parse_details(details, notes)))
          details.clear()
          in_details = false
        } else {
          details.push(line)
        }
      } else {
        details.push(line)
      }
      continue
    }
    if in_foot {
      // Inside a footnote definition: an indented line continues it, and
      // a blank line keeps it open for one more indented line.
      if trimmed == "" {
        foot_blank += 1
        continue
      } else if line[0] is (' ' | '\t') {
        for _ in 0..<foot_blank {
          foot.push("")
        }
        foot_blank = 0
        foot.push(trimmed.to_owned())
        continue
      } else {
        notes.add(foot_label, parse_children(foot.join("\n"), notes))
        foot.clear()
        foot_label = ""
        foot_blank = 0
        in_foot = false
      }
    }
    if trimmed.has_prefix(FENCE) {
      flush()
      code_info = trim_space(trimmed[FENCE.length():])
      code_indent = indent(line)
      in_code = true
    } else if trimmed == "" {
      flush()
    } else if is_heading(trimmed) {
      flush()
      out.push(parse_heading(trimmed))
    } else if footnote_def(line) is Some((label, text)) {
      flush()
      foot_label = label
      foot.push(text)
      in_foot = true
    } else if trimmed.has_prefix("|") {
      if !para.is_empty() || !items.is_empty() || !quote.is_empty() {
        flush()
      }
      table.push(trimmed)
    } else if trimmed.has_prefix(">") {
      if !para.is_empty() || !items.is_empty() || !table.is_empty() {
        flush()
      }
      let rest = line[line.find(">").unwrap() + 1:]
      quote.push(rest.strip_prefix(" ").unwrap_or(rest).to_owned())
    } else if trimmed is ([.. "- ", .. rest] | [.. "* ", .. rest]) {
      if !para.is_empty() || !quote.is_empty() || !table.is_empty() {
        flush()
      }
      items.push({ indent: indent(line), text: trim_space(rest).to_owned(), })
    } else if trimmed == "<details>" {
      flush()
      details_depth = 1
      details_code = false
      in_details = true
    } else if !items.is_empty() &&
      line.length() != trimmed.length() &&
      line[0] is (' ' | '\t') {
      // An indented line continues the item above it.
      items[items.length() - 1].text += "\n\{trimmed}"
    } else {
      if !items.is_empty() || !quote.is_empty() || !table.is_empty() {
        flush()
      }
      para.push(trimmed)
    }
  }
  if in_code {
    // An unclosed fence runs to the end of the document.
    out.push(Block(CodeBlock(code.join("\n"), info=code_info.to_owned())))
  }
  if in_details {
    // An unclosed "<details>" runs to the end of the document.
    out.push(Block(parse_details(details, notes)))
  }
  if in_foot {
    // A footnote definition open at the end closes there.
    notes.add(foot_label, parse_children(foot.join("\n"), notes))
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
  let mut summary = ""
  let mut body = lines[:]
  for i, line in lines {
    if trim_space(line) == "" {
      continue
    }
    if summary_text(line) is Some(s) {
      summary = s
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
/// alert_kind returns the lowercase type of a GitHub-style alert marker —
/// "[!NOTE]", "[!TIP]", "[!IMPORTANT]", "[!WARNING]", or "[!CAUTION]" —
/// or "" when line is not a marker. The marker is matched ASCII
/// case-insensitively and must be the whole line, trailing space aside.
fn alert_kind(line : StringView) -> String {
  let mut end = line.length()
  while end > 0 && (line[end - 1] == ' ' || line[end - 1] == '\t') {
    end = end - 1
  }
  let line = line[0:end]
  guard line.length() >= 4 &&
    line[0] == '[' &&
    line[1] == '!' &&
    line[end - 1] == ']' else {
    return ""
  }
  let inner = line[2:end - 1]
  for kind in ["note", "tip", "important", "warning", "caution"] {
    if ascii_eq_fold(inner, kind) {
      return kind
    }
  }
  ""
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
  mut text : String
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
/// returning them and the index where it stopped.
fn nest_items(
  flat : Array[RawItem],
  from~ : Int32,
  parent~ : Int32,
) -> (Array[Item], Int32) {
  let out = []
  for i = from; i < flat.length() && flat[i].indent > parent; {
    let (children, next) = nest_items(flat, from=i + 1, parent=flat[i].indent)
    out.push({ text: flat[i].text, children, })
    continue next
  } nobreak {
    (out, i)
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
