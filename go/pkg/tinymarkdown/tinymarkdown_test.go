package tinymarkdown

import (
	"reflect"
	"testing"
)

type testCase struct {
	name string
	src  string
	want Document
}

func run(t *testing.T, cases []testCase) {
	t.Helper()
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := Parse(c.src)
			if !reflect.DeepEqual(got, c.want) {
				t.Errorf("Parse(%q)\ngot  %#v\nwant %#v", c.src, got, c.want)
			}
		})
	}
}

// items makes list items without children.
func items(texts ...string) []Item {
	out := make([]Item, 0, len(texts))
	for _, t := range texts {
		out = append(out, Item{Text: t})
	}
	return out
}

func TestSectionsAndParagraphs(t *testing.T) {
	run(t, []testCase{
		{"empty", "", Document{}},
		{"blank lines only", "\n  \n\n", Document{}},
		{"paragraph", "hello", Document{Children: []Block{Paragraph{Text: "hello"}}}},
		{"lines join into one paragraph", "a\nb\r\n  c  ",
			Document{Children: []Block{Paragraph{Text: "a\nb\nc"}}}},
		{"blank line separates paragraphs", "a\n\nb",
			Document{Children: []Block{Paragraph{Text: "a"}, Paragraph{Text: "b"}}}},
		{"paragraph before first heading stays at root", "intro\n# Title\nbody",
			Document{Children: []Block{
				Paragraph{Text: "intro"},
				Section{Level: 1, Title: "Title", Children: []Block{Paragraph{Text: "body"}}},
			}}},
		{"heading ends a paragraph without a blank line", "a\n## H",
			Document{Children: []Block{Paragraph{Text: "a"}, Section{Level: 2, Title: "H"}}}},
		{"nested sections", "# A\na\n## B\nb\n### C\nc\n## D\n# E",
			Document{Children: []Block{
				Section{Level: 1, Title: "A", Children: []Block{
					Paragraph{Text: "a"},
					Section{Level: 2, Title: "B", Children: []Block{
						Paragraph{Text: "b"},
						Section{Level: 3, Title: "C", Children: []Block{Paragraph{Text: "c"}}},
					}},
					Section{Level: 2, Title: "D"},
				}},
				Section{Level: 1, Title: "E"},
			}}},
		{"level jump nests under the shallower heading", "# A\n### C\n## B",
			Document{Children: []Block{
				Section{Level: 1, Title: "A", Children: []Block{
					Section{Level: 3, Title: "C"},
					Section{Level: 2, Title: "B"},
				}},
			}}},
		{"heading title is trimmed", "#   spaced   ",
			Document{Children: []Block{Section{Level: 1, Title: "spaced"}}}},
		{"#### and ##### nest", "#### D\nd\n##### E\ne\n#### F",
			Document{Children: []Block{
				Section{Level: 4, Title: "D", Children: []Block{
					Paragraph{Text: "d"},
					Section{Level: 5, Title: "E", Children: []Block{Paragraph{Text: "e"}}},
				}},
				Section{Level: 4, Title: "F"},
			}}},
		{"###### is not a heading", "###### deep",
			Document{Children: []Block{Paragraph{Text: "###### deep"}}}},
		{"# without a space is not a heading", "#tag",
			Document{Children: []Block{Paragraph{Text: "#tag"}}}},
		{"bare # is not a heading", "#",
			Document{Children: []Block{Paragraph{Text: "#"}}}},
		{"inline syntax is kept as is", "**bold** [link](/x)",
			Document{Children: []Block{Paragraph{Text: "**bold** [link](/x)"}}}},
	})
}

func TestLists(t *testing.T) {
	run(t, []testCase{
		{"list", "- a\n-   b  \n- c",
			Document{Children: []Block{List{Items: items("a", "b", "c")}}}},
		{"blank line splits lists", "- a\n\n- b",
			Document{Children: []Block{List{Items: items("a")}, List{Items: items("b")}}}},
		{"list after paragraph without a blank line", "intro\n- a\n- b",
			Document{Children: []Block{Paragraph{Text: "intro"}, List{Items: items("a", "b")}}}},
		{"paragraph after list without a blank line", "- a\nafter",
			Document{Children: []Block{List{Items: items("a")}, Paragraph{Text: "after"}}}},
		{"indented lines continue an item", "- a\n  more\n\tand more\n- b\n  b2",
			Document{Children: []Block{List{Items: items("a\nmore\nand more", "b\nb2")}}}},
		{"indented line after a paragraph stays in the paragraph", "p\n  q",
			Document{Children: []Block{Paragraph{Text: "p\nq"}}}},
		{"blank line ends the continuation", "- a\n\n  b",
			Document{Children: []Block{List{Items: items("a")}, Paragraph{Text: "b"}}}},
		{"dash without a space is paragraph text", "-a\n--",
			Document{Children: []Block{Paragraph{Text: "-a\n--"}}}},
		{"list inside a section", "# A\n- x\n## B\n- y",
			Document{Children: []Block{
				Section{Level: 1, Title: "A", Children: []Block{
					List{Items: items("x")},
					Section{Level: 2, Title: "B", Children: []Block{List{Items: items("y")}}},
				}},
			}}},
	})
}

func TestNestedLists(t *testing.T) {
	run(t, []testCase{
		{"indented item nests under the one above", "- a\n  - b\n  - c\n- d",
			Document{Children: []Block{List{Items: []Item{
				{Text: "a", Children: items("b", "c")},
				{Text: "d"},
			}}}}},
		{"deeper nesting", "- a\n  - b\n    - c\n- d",
			Document{Children: []Block{List{Items: []Item{
				{Text: "a", Children: []Item{{Text: "b", Children: items("c")}}},
				{Text: "d"},
			}}}}},
		{"dedent goes back to the matching level", "- a\n  - b\n    - c\n  - d",
			Document{Children: []Block{List{Items: []Item{
				{Text: "a", Children: []Item{{Text: "b", Children: items("c")}, {Text: "d"}}},
			}}}}},
		{"any deeper indent nests, a shallower one is a sibling", "- a\n    - b\n  - c\n\t- d",
			Document{Children: []Block{List{Items: []Item{
				{Text: "a", Children: []Item{{Text: "b"}, {Text: "c"}, {Text: "d"}}},
			}}}}},
		{"indented lines continue the nearest item", "- a\n  more\n  - b\n    b2\n  b3\n- c",
			Document{Children: []Block{List{Items: []Item{
				{Text: "a\nmore", Children: items("b\nb2\nb3")},
				{Text: "c"},
			}}}}},
		{"an indented first item is the top level", "  - a\n- b\n  - c",
			Document{Children: []Block{List{Items: []Item{
				{Text: "a"},
				{Text: "b", Children: items("c")},
			}}}}},
		{"indented item after a paragraph starts a list", "p\n  - a",
			Document{Children: []Block{Paragraph{Text: "p"}, List{Items: items("a")}}}},
		{"blank line splits nested lists too", "- a\n\n  - b",
			Document{Children: []Block{List{Items: items("a")}, List{Items: items("b")}}}},
		{"checkboxes are text", "- [ ] a\n  - [x] b",
			Document{Children: []Block{List{Items: []Item{
				{Text: "[ ] a", Children: items("[x] b")},
			}}}}},
		{"nested list in a quote", "> - a\n>   - b",
			Document{Children: []Block{Quote{Children: []Block{List{Items: []Item{
				{Text: "a", Children: items("b")},
			}}}}}}},
	})
}

func TestCodeBlocks(t *testing.T) {
	run(t, []testCase{
		{"code block", "```\nfmt.Println(1)\n```",
			Document{Children: []Block{CodeBlock{Code: "fmt.Println(1)"}}}},
		{"language name is kept as info", "```go\nx := 1\n```",
			Document{Children: []Block{CodeBlock{Code: "x := 1", Info: "go"}}}},
		{"info is the trimmed text after the fence", "``` svg \nx\n```",
			Document{Children: []Block{CodeBlock{Code: "x", Info: "svg"}}}},
		{"info is everything after the fence", "```go fmt\nx\n```",
			Document{Children: []Block{CodeBlock{Code: "x", Info: "go fmt"}}}},
		{"unclosed fence keeps the info", "```mermaid\nx",
			Document{Children: []Block{CodeBlock{Code: "x", Info: "mermaid"}}}},
		{"contents are kept verbatim", "```\n# not a heading\n- not a list\n\n\tindented  \n```",
			Document{Children: []Block{CodeBlock{Code: "# not a heading\n- not a list\n\n\tindented  "}}}},
		{"empty code block", "```\n```",
			Document{Children: []Block{CodeBlock{Code: ""}}}},
		{"closing fence may have surrounding spaces", "```\na\n  ```  \nafter",
			Document{Children: []Block{CodeBlock{Code: "a"}, Paragraph{Text: "after"}}}},
		{"closing fence must be bare", "```\n```go\n```",
			Document{Children: []Block{CodeBlock{Code: "```go"}}}},
		{"CRLF line endings", "```\r\na\r\n```\r\n",
			Document{Children: []Block{CodeBlock{Code: "a"}}}},
		{"unclosed fence runs to EOF", "```\na\n\n# b",
			Document{Children: []Block{CodeBlock{Code: "a\n\n# b"}}}},
		{"fence ends a paragraph and a list", "p\n```\nc\n```\n- a\n```\nd\n```",
			Document{Children: []Block{
				Paragraph{Text: "p"}, CodeBlock{Code: "c"},
				List{Items: items("a")}, CodeBlock{Code: "d"},
			}}},
		{"code block inside a section", "# A\n```\n## x\n```",
			Document{Children: []Block{
				Section{Level: 1, Title: "A", Children: []Block{CodeBlock{Code: "## x"}}},
			}}},
		{"an indented fence dedents its content", "  ```\n  a\n    b\n c\n  ```",
			Document{Children: []Block{CodeBlock{Code: "a\n  b\nc"}}}},
		{"a fence under a list item dedents by the fence", "1. step\n   ```sh\n   run this\n   ```",
			Document{Children: []Block{
				Paragraph{Text: "1. step"}, CodeBlock{Code: "run this", Info: "sh"},
			}}},
		{"an unclosed indented fence still dedents", "   ```\n   a",
			Document{Children: []Block{CodeBlock{Code: "a"}}}},
	})
}

func TestQuotes(t *testing.T) {
	run(t, []testCase{
		{"quote", "> a\n> b",
			Document{Children: []Block{Quote{Children: []Block{Paragraph{Text: "a\nb"}}}}}},
		{"space after > is optional", ">a\n  >  b",
			Document{Children: []Block{Quote{Children: []Block{Paragraph{Text: "a\nb"}}}}}},
		{"bare > separates paragraphs", "> a\n>\n> b",
			Document{Children: []Block{Quote{Children: []Block{Paragraph{Text: "a"}, Paragraph{Text: "b"}}}}}},
		{"blocks inside a quote", "> - x\n>   y\n> ```\n>   code\n> ```",
			Document{Children: []Block{Quote{Children: []Block{
				List{Items: items("x\ny")}, CodeBlock{Code: "  code"},
			}}}}},
		{"nested quote", "> a\n>\n> > b",
			Document{Children: []Block{Quote{Children: []Block{
				Paragraph{Text: "a"}, Quote{Children: []Block{Paragraph{Text: "b"}}},
			}}}}},
		{"quote ends a paragraph and a list", "p\n> q\n- a\n> r",
			Document{Children: []Block{
				Paragraph{Text: "p"}, Quote{Children: []Block{Paragraph{Text: "q"}}},
				List{Items: items("a")}, Quote{Children: []Block{Paragraph{Text: "r"}}},
			}}},
		{"a line without > ends the quote", "> q\np\n> r\n\n> s",
			Document{Children: []Block{
				Quote{Children: []Block{Paragraph{Text: "q"}}}, Paragraph{Text: "p"},
				Quote{Children: []Block{Paragraph{Text: "r"}}}, Quote{Children: []Block{Paragraph{Text: "s"}}},
			}}},
		{"quote inside a section", "# A\n> q",
			Document{Children: []Block{
				Section{Level: 1, Title: "A", Children: []Block{Quote{Children: []Block{Paragraph{Text: "q"}}}}},
			}}},
		{"> inside a code block is code", "```\n> x\n```",
			Document{Children: []Block{CodeBlock{Code: "> x"}}}},
	})
}

func TestAlerts(t *testing.T) {
	run(t, []testCase{
		{"note alert", "> [!NOTE]\n> hello",
			Document{Children: []Block{Alert{Kind: "note", Children: []Block{Paragraph{Text: "hello"}}}}}},
		{"every kind", "> [!NOTE]\n> n\n\n> [!TIP]\n> t\n\n> [!IMPORTANT]\n> i\n\n> [!WARNING]\n> w\n\n> [!CAUTION]\n> c",
			Document{Children: []Block{
				Alert{Kind: "note", Children: []Block{Paragraph{Text: "n"}}},
				Alert{Kind: "tip", Children: []Block{Paragraph{Text: "t"}}},
				Alert{Kind: "important", Children: []Block{Paragraph{Text: "i"}}},
				Alert{Kind: "warning", Children: []Block{Paragraph{Text: "w"}}},
				Alert{Kind: "caution", Children: []Block{Paragraph{Text: "c"}}},
			}}},
		{"the marker is case-insensitive", "> [!warning]\n> w",
			Document{Children: []Block{Alert{Kind: "warning", Children: []Block{Paragraph{Text: "w"}}}}}},
		{"a marker alone has no children", "> [!TIP]",
			Document{Children: []Block{Alert{Kind: "tip"}}}},
		{"blocks inside an alert", "> [!NOTE]\n> - x\n>   y",
			Document{Children: []Block{Alert{Kind: "note", Children: []Block{
				List{Items: items("x\ny")},
			}}}}},
		{"a marker only leads the quote", "> a\n> [!NOTE]\n> b",
			Document{Children: []Block{Quote{Children: []Block{
				Paragraph{Text: "a\n[!NOTE]\nb"},
			}}}}},
		{"trailing text keeps the quote", "> [!NOTE] x\n> y",
			Document{Children: []Block{Quote{Children: []Block{
				Paragraph{Text: "[!NOTE] x\ny"},
			}}}}},
		{"an unknown marker keeps the quote", "> [!HINT]\n> y",
			Document{Children: []Block{Quote{Children: []Block{
				Paragraph{Text: "[!HINT]\ny"},
			}}}}},
		{"a non-ASCII marker keeps the quote", "> [!T\u0130P]\n> y",
			Document{Children: []Block{Quote{Children: []Block{
				Paragraph{Text: "[!T\u0130P]\ny"},
			}}}}},
		{"nested alert", "> a\n>\n> > [!NOTE]\n> > b",
			Document{Children: []Block{Quote{Children: []Block{
				Paragraph{Text: "a"},
				Alert{Kind: "note", Children: []Block{Paragraph{Text: "b"}}},
			}}}}},
		{"alert inside a section", "# A\n> [!NOTE]\n> q",
			Document{Children: []Block{
				Section{Level: 1, Title: "A", Children: []Block{
					Alert{Kind: "note", Children: []Block{Paragraph{Text: "q"}}},
				}},
			}}},
	})
}

func TestTables(t *testing.T) {
	run(t, []testCase{
		{"table", "| a | b |\n| --- | --- |\n| 1 | `2` |\n| 3 | 4 |",
			Document{Children: []Block{Table{
				Header: []string{"a", "b"},
				Rows:   [][]string{{"1", "`2`"}, {"3", "4"}},
			}}}},
		{"header only", "| a |\n|---|",
			Document{Children: []Block{Table{Header: []string{"a"}}}}},
		{"trailing pipe is optional", "| a | b\n| --- | ---\n| 1 | 2",
			Document{Children: []Block{Table{Header: []string{"a", "b"}, Rows: [][]string{{"1", "2"}}}}}},
		{"alignment is accepted and ignored", "| a | b | c |\n| :-- | :-: | --: |",
			Document{Children: []Block{Table{Header: []string{"a", "b", "c"}}}}},
		{"rows are padded and cut to the header", "| a | b |\n| - | - |\n| 1 |\n| 1 | 2 | 3 |\n| | x |",
			Document{Children: []Block{Table{
				Header: []string{"a", "b"},
				Rows:   [][]string{{"1", ""}, {"1", "2"}, {"", "x"}},
			}}}},
		{"escaped pipe", "| a \\| b |\n| --- |\n| `x \\| y` |",
			Document{Children: []Block{Table{Header: []string{"a | b"}, Rows: [][]string{{"`x | y`"}}}}}},
		{"no delimiter row is a paragraph", "| a |\n| b |",
			Document{Children: []Block{Paragraph{Text: "| a |\n| b |"}}}},
		{"delimiter count must match", "| a | b |\n| --- |",
			Document{Children: []Block{Paragraph{Text: "| a | b |\n| --- |"}}}},
		{"single line is a paragraph", "| a |",
			Document{Children: []Block{Paragraph{Text: "| a |"}}}},
		{"table between paragraphs", "intro\n| a |\n| - |\n| 1 |\nafter",
			Document{Children: []Block{
				Paragraph{Text: "intro"},
				Table{Header: []string{"a"}, Rows: [][]string{{"1"}}},
				Paragraph{Text: "after"},
			}}},
		{"blank line splits tables", "| a |\n| - |\n\n| b |\n| - |",
			Document{Children: []Block{Table{Header: []string{"a"}}, Table{Header: []string{"b"}}}}},
		{"indented rows", "  | a |\n  | - |\n  | 1 |",
			Document{Children: []Block{Table{Header: []string{"a"}, Rows: [][]string{{"1"}}}}}},
		{"table in a section and a quote", "# T\n| a |\n| - |\n> | b |\n> | - |",
			Document{Children: []Block{Section{Level: 1, Title: "T", Children: []Block{
				Table{Header: []string{"a"}},
				Quote{Children: []Block{Table{Header: []string{"b"}}}},
			}}}}},
		{"list ends at a table", "- x\n| a |\n| - |",
			Document{Children: []Block{List{Items: items("x")}, Table{Header: []string{"a"}}}}},
	})
}

func TestDetails(t *testing.T) {
	run(t, []testCase{
		{"details", "<details>\n<summary>answer</summary>\n\nhidden\n</details>",
			Document{Children: []Block{Details{Summary: "answer", Children: []Block{Paragraph{Text: "hidden"}}}}}},
		{"details without a summary", "<details>\nhidden\n</details>",
			Document{Children: []Block{Details{Children: []Block{Paragraph{Text: "hidden"}}}}}},
		{"blocks inside details", "<details>\n<summary>s</summary>\n\n- a\n- b\n\n```\ncode\n```\n</details>",
			Document{Children: []Block{Details{Summary: "s", Children: []Block{
				List{Items: items("a", "b")}, CodeBlock{Code: "code"},
			}}}}},
		{"summary needs blank lines nowhere", "<details>\n\n<summary>s</summary>\ntext\n</details>",
			Document{Children: []Block{Details{Summary: "s", Children: []Block{Paragraph{Text: "text"}}}}}},
		{"a summary not first stays text", "<details>\ntext\n<summary>s</summary>\n</details>",
			Document{Children: []Block{Details{Children: []Block{Paragraph{Text: "text\n<summary>s</summary>"}}}}}},
		{"summary text is trimmed", "<details>\n<summary>  s  </summary>\n</details>",
			Document{Children: []Block{Details{Summary: "s"}}}},
		{"summary must fill the line", "<details>\n<summary>s</summary> tail\n</details>",
			Document{Children: []Block{Details{Children: []Block{Paragraph{Text: "<summary>s</summary> tail"}}}}}},
		{"nested details", "<details>\n<summary>outer</summary>\n\n<details>\n<summary>inner</summary>\n\ndeep\n</details>\n\n</details>",
			Document{Children: []Block{Details{Summary: "outer", Children: []Block{
				Details{Summary: "inner", Children: []Block{Paragraph{Text: "deep"}}},
			}}}}},
		{"a fence inside details keeps </details> as code", "<details>\n```\n</details>\n```\n</details>",
			Document{Children: []Block{Details{Children: []Block{CodeBlock{Code: "</details>"}}}}}},
		{"details ends a paragraph and a list", "p\n<details>\nx\n</details>\n- a\n<details>\ny\n</details>",
			Document{Children: []Block{
				Paragraph{Text: "p"}, Details{Children: []Block{Paragraph{Text: "x"}}},
				List{Items: items("a")}, Details{Children: []Block{Paragraph{Text: "y"}}},
			}}},
		{"unclosed details runs to EOF", "<details>\na\n\n# b",
			Document{Children: []Block{Details{Children: []Block{
				Paragraph{Text: "a"}, Section{Level: 1, Title: "b"},
			}}}}},
		{"details inside a section", "# A\n<details>\nx\n</details>",
			Document{Children: []Block{
				Section{Level: 1, Title: "A", Children: []Block{Details{Children: []Block{Paragraph{Text: "x"}}}}},
			}}},
		{"details inside a quote", "> <details>\n> <summary>s</summary>\n>\n> x\n> </details>",
			Document{Children: []Block{Quote{Children: []Block{
				Details{Summary: "s", Children: []Block{Paragraph{Text: "x"}}},
			}}}}},
		{"<details> inside a code block is code", "```\n<details>\n```",
			Document{Children: []Block{CodeBlock{Code: "<details>"}}}},
		{"a tag with attributes stays a paragraph", "<details open>\nx\n</details>",
			Document{Children: []Block{Paragraph{Text: "<details open>\nx\n</details>"}}}},
		{"</details> alone is a paragraph", "</details>",
			Document{Children: []Block{Paragraph{Text: "</details>"}}}},
	})
}

func TestFootnoteDefs(t *testing.T) {
	run(t, []testCase{
		{"a definition alone", "[^a]: note",
			Document{Footnotes: []FootnoteDef{
				{Label: "a", Children: []Block{Paragraph{Text: "note"}}},
			}}},
		{"ref and definition", "text[^a]\n\n[^a]: note",
			Document{
				Children:  []Block{Paragraph{Text: "text[^a]"}},
				Footnotes: []FootnoteDef{{Label: "a", Children: []Block{Paragraph{Text: "note"}}}},
			}},
		{"a definition may sit anywhere", "[^a]: note\n\ntext[^a]",
			Document{
				Children:  []Block{Paragraph{Text: "text[^a]"}},
				Footnotes: []FootnoteDef{{Label: "a", Children: []Block{Paragraph{Text: "note"}}}},
			}},
		{"indented lines continue the definition", "[^a]: one\n  two\n\n  three\n\ndone",
			Document{
				Children: []Block{Paragraph{Text: "done"}},
				Footnotes: []FootnoteDef{{Label: "a", Children: []Block{
					Paragraph{Text: "one\ntwo"}, Paragraph{Text: "three"},
				}}},
			}},
		{"a non-indented line ends the definition", "[^a]: one\nnext",
			Document{
				Children:  []Block{Paragraph{Text: "next"}},
				Footnotes: []FootnoteDef{{Label: "a", Children: []Block{Paragraph{Text: "one"}}}},
			}},
		{"the definition line must start at the first column", "  [^a]: note",
			Document{Children: []Block{Paragraph{Text: "[^a]: note"}}}},
		{"a definition inside a list item is item text", "- item\n  [^a]: note",
			Document{Children: []Block{List{Items: items("item\n[^a]: note")}}}},
		{"definitions collect from inside a quote", "> [^a]: note",
			Document{
				Children:  []Block{Quote{}},
				Footnotes: []FootnoteDef{{Label: "a", Children: []Block{Paragraph{Text: "note"}}}},
			}},
		{"definitions collect from inside details", "<details>\n[^a]: note\n</details>",
			Document{
				Children:  []Block{Details{}},
				Footnotes: []FootnoteDef{{Label: "a", Children: []Block{Paragraph{Text: "note"}}}},
			}},
		{"the first definition of a label wins", "[^a]: one\n\n[^a]: two",
			Document{Footnotes: []FootnoteDef{
				{Label: "a", Children: []Block{Paragraph{Text: "one"}}},
			}}},
		{"a label may hold spaces", "[^my note]: body",
			Document{Footnotes: []FootnoteDef{
				{Label: "my note", Children: []Block{Paragraph{Text: "body"}}},
			}}},
		{"an empty label is not a definition", "[^]: note",
			Document{Children: []Block{Paragraph{Text: "[^]: note"}}}},
		{"no colon is not a definition", "[^a] note",
			Document{Children: []Block{Paragraph{Text: "[^a] note"}}}},
		{"a definition ends a paragraph", "intro\n[^a]: note",
			Document{
				Children:  []Block{Paragraph{Text: "intro"}},
				Footnotes: []FootnoteDef{{Label: "a", Children: []Block{Paragraph{Text: "note"}}}},
			}},
		{"a definition inside a code block is code", "```\n[^a]: note\n```",
			Document{Children: []Block{CodeBlock{Code: "[^a]: note"}}}},
	})
}

func TestAsteriskLists(t *testing.T) {
	run(t, []testCase{
		{"asterisk items", "* a\n*   b  \n* c", Document{Children: []Block{List{Items: items("a", "b", "c")}}}},
		{"mixed markers", "- a\n* b\n- c", Document{Children: []Block{List{Items: items("a", "b", "c")}}}},
		{"mixed nested markers and continuation", "* a\n  - b\n    * c\n      more\n* d", Document{Children: []Block{List{Items: []Item{
			{Text: "a", Children: []Item{{Text: "b", Children: items("c\nmore")}}}, {Text: "d"},
		}}}}},
		{"paragraph boundaries", "intro\n* a\nafter", Document{Children: []Block{Paragraph{Text: "intro"}, List{Items: items("a")}, Paragraph{Text: "after"}}}},
		{"blank lines split asterisk lists", "* a\n\n* b", Document{Children: []Block{List{Items: items("a")}, List{Items: items("b")}}}},
		{"asterisk list in a quote", "> * a\n>   * b", Document{Children: []Block{Quote{Children: []Block{List{Items: []Item{{Text: "a", Children: items("b")}}}}}}}},
		{"asterisks without a space stay text", "*word\n**bold**\n***", Document{Children: []Block{Paragraph{Text: "*word\n**bold**\n***"}}}},
		{"fenced asterisks stay code", "```\n* code\n```", Document{Children: []Block{CodeBlock{Code: "* code"}}}},
	})
}
