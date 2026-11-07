package main

import "testing"

var cases = []struct {
	name string
	in   string
	want string
}{
	// "*" emphasis is stripped.
	{"bold", "**bold**", "bold"},
	{"em", "*em*", "em"},
	{"both", "***both***", "both"},
	{"mid-sentence", "a **bold** b", "a bold b"},
	{"in heading", "# **bold**", "# bold"},
	{"in quote", "> **bold**", "> bold"},
	{"in table", "| **a** | b |", "| a | b |"},
	{"in link text", "[**x**](u)", "[x](u)"},
	{"in front matter", "---\ntitle: **x**\n---", "---\ntitle: x\n---"},
	{"nested", "**a *b* c**", "a b c"},
	{"nested reversed", "*a **b** c*", "a b c"},
	{"inner star pair", "*a *b* c*", "a b c"},
	{"across lines", "**a\nb**", "a\nb"},
	{"with punctuation", "（**太字**）", "（太字）"},
	{"in list items", "- **a**\n* *b*\n  - **c**", "- a\n* b\n  - c"},
	{"star bullet then bold", "* **bold**", "* bold"},

	// Asterisks that are not emphasis stay.
	{"list marker", "* item\n  * nested", "* item\n  * nested"},
	{"lone star", "a * b", "a * b"},
	{"spaced stars", "** a **", "** a **"},
	{"unmatched", "**a", "**a"},
	{"in word", "a*b", "a*b"},
	{"glob once", "fig-*.ts", "fig-*.ts"},
	{"glob twice", "fig-*.ts and fig-*.ts", "fig-*.ts and fig-*.ts"},
	{"escaped", `\*a\*`, `\*a\*`},
	{"closing line star", "foo *\n* bar", "foo *\n* bar"},
	{"mismatched counts", "**a*", "**a*"},

	// Code is not touched.
	{"inline code", "a `**b**` c", "a `**b**` c"},
	{"inline code em", "a `*b*` c", "a `*b*` c"},
	{"double backquotes", "a ``*b*`` c", "a ``*b*`` c"},
	{"span across lines", "a `*x\ny*` z", "a `*x\ny*` z"},
	{"emphasis wraps code", "**a `x` b**", "a `x` b"},
	{"unmatched backquote", "a `*b* c", "a `b c"},
	{"fenced code", "```go\n**not em**\n```", "```go\n**not em**\n```"},
	{"unclosed fence", "```go\n**x**", "```go\n**x**"},
	{"after fence", "```go\nx\n```\n**y**", "```go\nx\n```\ny"},

	// An unlabeled <svg body gets the svg label.
	{"unlabeled svg", "```\n<svg/>\n```", "```svg\n<svg/>\n```"},
	{"svg after blank", "```\n\n<svg/>\n```", "```svg\n\n<svg/>\n```"},
	{"svg indented body", "```\n  <svg/>\n```", "```svg\n  <svg/>\n```"},
	{"unclosed svg fence", "```\n<svg/>", "```svg\n<svg/>"},
	{"indented svg fence", "  ```\n  <svg/>\n  ```", "  ```svg\n  <svg/>\n  ```"},
	{"xml label kept", "```xml\n<svg/>\n```", "```xml\n<svg/>\n```"},
	{"SVG label kept", "```SVG\n<svg/>\n```", "```SVG\n<svg/>\n```"},
	{"non-svg body kept", "```\ntext\n```", "```\ntext\n```"},
	{"comment body kept", "```\n<!-- demo -->\n<svg/>\n```", "```\n<!-- demo -->\n<svg/>\n```"},
}

func TestNormalize(t *testing.T) {
	for _, c := range cases {
		if got := Normalize(c.in); got != c.want {
			t.Errorf("%s:\n got: %q\nwant: %q", c.name, got, c.want)
		}
	}
}

func TestNormalizeIdempotent(t *testing.T) {
	for _, c := range cases {
		if got := Normalize(Normalize(c.in)); got != Normalize(c.in) {
			t.Errorf("%s: not idempotent: %q", c.name, got)
		}
	}
}
