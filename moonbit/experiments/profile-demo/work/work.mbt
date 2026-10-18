// The workload of the profile-demo experiment: a deterministic document, a
// naive renderer, and a fast one that produces the same HTML. The text is
// ASCII, so bytes, UTF-16 code units and characters all coincide.

///|
/// parse_count reads a non-negative decimal count, or returns fallback when s
/// is not one. The counts are small and this is not the code under profile, so
/// it stays hand-rolled rather than pulling in a parser that raises.
fn parse_count(s : String, fallback : Int32) -> Int32 {
  if s == "" {
    return fallback
  }
  let zero = '0'.to_int()
  let mut n = 0
  for i = 0; i < s.length(); i = i + 1 {
    let d = s[i].to_int() - zero
    if d < 0 || d > 9 {
      return fallback
    }
    n = n * 10 + d
  }
  n
}

///|
/// workload_args reads "lines reps" from the program's own arguments, falling
/// back to the defaults. It skips argv[0], so both mains are sized the same
/// way:
///
///   moon run --profile naive -- 2000 20
pub fn workload_args(
  default_lines~ : Int32,
  default_reps~ : Int32,
) -> (Int32, Int32) {
  let args = @env.args()
  let lines = if args.length() > 1 {
    parse_count(args[1], default_lines)
  } else {
    default_lines
  }
  let reps = if args.length() > 2 {
    parse_count(args[2], default_reps)
  } else {
    default_reps
  }
  (lines, reps)
}

///|
/// generate builds n lines: every seventh is a heading, so the renderer takes
/// both branches, and the rest are paragraphs carrying the characters that
/// have to be escaped.
pub fn generate(n : Int32) -> Array[String] {
  let lines : Array[String] = []
  for i = 0; i < n; i = i + 1 {
    if i % 7 == 0 {
      lines.push("## Section " + i.to_string())
    } else {
      lines.push(
        "para " + i.to_string() + " says <tag> & \"quotes\" and 'apostrophes'",
      )
    }
  }
  lines
}

///|
/// escape_naive escapes s one character at a time, appending to the string
/// that is being built. Every append copies what is already there, so a line
/// of n characters costs about n*n/2 bytes of copying and n allocations.
fn escape_naive(s : String) -> String {
  let mut out = ""
  for c in s {
    let esc = match c {
      '<' => "&lt;"
      '>' => "&gt;"
      '&' => "&amp;"
      '"' => "&#34;"
      '\'' => "&#39;"
      _ => c.to_string()
    }
    out = out + esc
  }
  out
}

///|
/// render_naive escapes and concatenates one piece at a time, so the whole
/// document is copied again on every line.
pub fn render_naive(lines : Array[String]) -> String {
  let mut out = ""
  for line in lines {
    if line.has_prefix("## ") {
      out = out + "<h2>" + escape_naive(line[3:].to_owned()) + "</h2>\n"
    } else {
      out = out + "<p>" + escape_naive(line) + "</p>\n"
    }
  }
  out
}

///|
/// write_escaped appends s to sb, escaping the HTML-significant characters. It
/// writes whole runs between them, so the builder sees a few writes per line
/// instead of one per character.
fn write_escaped(sb : StringBuilder, s : StringView) -> Unit {
  let n = s.length()
  let mut start = 0
  let mut i = 0
  while i < n {
    let esc = match s[i] {
      '<' => "&lt;"
      '>' => "&gt;"
      '&' => "&amp;"
      '"' => "&#34;"
      '\'' => "&#39;"
      _ => {
        i = i + 1
        continue
      }
    }
    if start < i {
      sb.write_view(s[start:i])
    }
    sb.write_string(esc)
    i = i + 1
    start = i
  }
  if start < n {
    sb.write_view(s[start:])
  }
}

///|
/// render_fast escapes into one builder and turns it into a string once, so
/// each character is written a constant number of times.
pub fn render_fast(lines : Array[String]) -> String {
  let sb = StringBuilder()
  for line in lines {
    if line.has_prefix("## ") {
      sb.write_string("<h2>")
      write_escaped(sb, line[3:])
      sb.write_string("</h2>\n")
    } else {
      sb.write_string("<p>")
      write_escaped(sb, line[:])
      sb.write_string("</p>\n")
    }
  }
  sb.to_string()
}

///|
/// checksum is a rolling hash of the rendered HTML. The mains print it so the
/// two renderers can be checked to agree without printing the document.
pub fn checksum(s : String) -> Int32 {
  let mut h = 0
  for i = 0; i < s.length(); i = i + 1 {
    h = (h * 31 + s[i].to_int()) % 1000000007
  }
  h
}
