// tinymarkdown parses a tiny subset of Markdown into a pure-data tree. The
// parser is MoonBit's (moonbit/pkg/tinymarkdown), built for js by
// moonbit/pkg/tinymarkdown/js into tinymarkdown.mjs (`make ts` in
// ../../../moonbit), which returns objects of the types here. The tests
// are there too: moonbit/pkg/tinymarkdown's, and those of the objects in
// moonbit/pkg/tinymarkdown/js.
//
// Supported: headings "#" to "#####" (which open nested sections), "- " or "* "
// list items (which may continue on indented lines and nest by
// indentation), paragraphs, "> " quotes, "|" tables, and code blocks fenced
// by exactly "```". Anything else is treated as paragraph text. Block
// parsing keeps inline syntax as text; inlines splits out code spans and
// links on request.

export type Document = { children: Block[] };

export type Block = Section | Paragraph | List | Quote | Alert | Table | CodeBlock;

// Section is a heading together with everything up to the next heading of
// the same or a shallower level.
export type Section = { kind: "section"; level: number; title: string; children: Block[] };

// Paragraph is a run of consecutive non-blank lines, joined with "\n".
export type Paragraph = { kind: "paragraph"; text: string };

// List is a run of consecutive "- " or "* " lines. Each item is nested under the
// nearest item above it whose marker is indented less.
export type List = { kind: "list"; items: Item[] };

// Item is a list item: the text after the "- " or "* " marker, with nested items.
// Indented lines that follow an item without a list marker continue its text.
export type Item = { text: string; children: Item[] };

// Quote is a run of lines starting with ">", whose content is parsed again
// as a document.
export type Quote = { kind: "quote"; children: Block[] };

// Alert is a quote whose first line is a GitHub-style alert marker such as
// "[!NOTE]": the marker is taken off the content and kept as alert, the
// marker's lowercase type — "note", "tip", "important", "warning", or
// "caution".
export type Alert = { kind: "alert"; alert: string; children: Block[] };

// Table is a header row, a delimiter row, and body rows. Every row has as
// many cells as the header; alignment is accepted but ignored.
export type Table = { kind: "table"; header: string[]; rows: string[][] };

// CodeBlock is the content between "```" fences. When the opening fence is
// indented, each content line loses as much leading indentation as the
// fence has, as CommonMark does.
export type CodeBlock = { kind: "code"; code: string };

// Inline is a piece of the text held by a section title, a paragraph, a
// list item, or a table cell.
export type Inline =
  | { kind: "text"; text: string }
  | { kind: "code"; text: string }
  | { kind: "link"; children: Inline[]; url: string };

// parse parses src. It never fails: lines it does not understand become
// paragraph text.
//
// inlines splits s into text, code spans, and links, as Go's Inlines does:
// a code span closes with the next run of as many backquotes, and a link is
// "[text](url)" with no brackets in the text outside code spans and no
// spaces or parentheses in the URL. Code spans bind tighter than links.
export { inlines, parse } from "./tinymarkdown.mjs";
