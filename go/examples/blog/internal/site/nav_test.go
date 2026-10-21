package site

import (
	"strings"
	"testing"
	"testing/fstest"

	"github.com/podhmo/html-sandbox/go/pkg/tinymarkdown"
)

func TestNavItem(t *testing.T) {
	posts, err := LoadPosts(testPosts)
	if err != nil {
		t.Fatal(err)
	}
	docs, err := LoadDocs(testDocs)
	if err != nil {
		t.Fatal(err)
	}
	st := newSite(posts, docs)
	src := postSource(posts[1]) // posts/2026-10-14-hello.md
	cases := []struct{ value, label, href string }{
		{"2026-10-01-old.md", "Old post", "/posts/old"},
		{"[Back](2026-10-01-old.md)", "Back", "/posts/old"},
		{"[Go `fmt`](2026-10-01-old.md)", "Go fmt", "/posts/old"},
		{"[](2026-10-01-old.md)", "Old post", "/posts/old"},
		{"/posts/old?ref=nav", "Old post", "/posts/old?ref=nav"},
		{"/posts/old#points", "Old post", "/posts/old#points"},
		{"../docs/ja/design.md", "Design <x>", "/docs/ja/design"},
		{"https://example.com/x", "https://example.com/x", "https://example.com/x"},
		{"mailto:a@example.com", "mailto:a@example.com", "mailto:a@example.com"},
		{"#anchor", "#anchor", "#anchor"},
		// An empty URL is not a served page, so it is text only.
		{"[Current]()", "Current", ""},
		// Refused by the linker: text only.
		{"javascript:alert(1)", "javascript:alert(1)", ""},
		{"../outside.md", "../outside.md", ""},
		// A relative URL that is not a page of the site is text only;
		// the body would link it to the file on GitHub.
		{".claude/skills/todo-md/SKILL.md", ".claude/skills/todo-md/SKILL.md", ""},
		// Not a single link or a single URL: shown as written.
		{"[a](x) [b](y)", "[a](x) [b](y)", ""},
		{"just some words", "just some words", ""},
		{"[title] (url)", "[title] (url)", ""},
	}
	for _, c := range cases {
		it := st.navItem(src, c.value)
		if it == nil {
			t.Errorf("%q: got nil", c.value)
			continue
		}
		if got := plainInlines(it.label); got != c.label {
			t.Errorf("%q: label %q, want %q", c.value, got, c.label)
		}
		if it.href != c.href {
			t.Errorf("%q: href %q, want %q", c.value, it.href, c.href)
		}
	}
	if it := st.navItem(src, ""); it != nil {
		t.Errorf("empty value: got %v", it)
	}
}

// plainInlines drops the markup of ins: code spans and links keep only
// their text.
func plainInlines(ins []tinymarkdown.Inline) string {
	var b strings.Builder
	for _, in := range ins {
		switch in.Kind {
		case tinymarkdown.InlineText, tinymarkdown.InlineCode:
			b.WriteString(in.Text)
		case tinymarkdown.InlineLink:
			b.WriteString(plainInlines(in.Children()))
		}
	}
	return b.String()
}

func TestPrevNextNav(t *testing.T) {
	h := newTestServer(t, fstest.MapFS{
		"2026-10-01-old.md":   file("---\ntitle: Old post\nnext: 2026-10-14-hello.md\n---\nbody"),
		"2026-10-14-hello.md": file("---\ntitle: Hello\nprev: [Go to old](2026-10-01-old.md)\nnext: ../docs/ja/design.md\n---\nbody"),
	})
	_, body := get(t, h, "/posts/hello")
	for _, want := range []string{
		`</article><nav><ul><li><small>← Previous</small><br><a href="/posts/old">Go to old</a></li></ul>`,
		`<ul><li><small>Next →</small><br><a href="/docs/ja/design">Design &lt;x&gt;</a></li></ul></nav>`,
	} {
		if !strings.Contains(body, want) {
			t.Errorf("hello: body does not contain %q", want)
		}
	}

	_, body = get(t, h, "/posts/old")
	want := `</article><nav><ul></ul><ul><li><small>Next →</small><br><a href="/posts/hello">Hello</a></li></ul></nav>`
	if !strings.Contains(body, want) {
		t.Errorf("old: body does not contain %q", want)
	}
}

func TestPrevNextNavTextOnly(t *testing.T) {
	h := newTestServer(t, fstest.MapFS{
		"2026-10-14-hello.md": file("---\ntitle: Hello\nprev: javascript:alert(1)\nnext: [a](x) [b](y)\n---\nbody"),
	})
	_, body := get(t, h, "/posts/hello")
	for _, want := range []string{
		`<nav><ul><li><small>← Previous</small><br>javascript:alert(1)</li></ul>`,
		`<ul><li><small>Next →</small><br>[a](x) [b](y)</li></ul></nav>`,
	} {
		if !strings.Contains(body, want) {
			t.Errorf("hello: body does not contain %q", want)
		}
	}
	if strings.Contains(body, `href="javascript:`) {
		t.Error("a refused URL must not be linked")
	}
}

func TestNoPrevNextNav(t *testing.T) {
	h := newTestServer(t, testPosts)
	_, body := get(t, h, "/posts/hello")
	if strings.Contains(body, "</article><nav>") {
		t.Error("a page without prev/next must not have the nav")
	}
}

func TestDocPrevNextNav(t *testing.T) {
	posts, err := LoadPosts(testPosts)
	if err != nil {
		t.Fatal(err)
	}
	docs, err := LoadDocs(fstest.MapFS{
		"TODO.md":           file("---\nprev: posts/2026-10-01-old.md\nnext: [Design](docs/ja/design.md)\n---\n# TODO\n\n> note"),
		"docs/ja/design.md": file("# Design <x>\n\nwhy\n## Use `el`\n- run `go test`"),
	})
	if err != nil {
		t.Fatal(err)
	}
	h, err := NewServer("https://example.com", posts, docs)
	if err != nil {
		t.Fatal(err)
	}
	_, body := get(t, h, "/docs/TODO")
	for _, want := range []string{
		`</article><nav><ul><li><small>← Previous</small><br><a href="/posts/old">Old post</a></li></ul>`,
		`<ul><li><small>Next →</small><br><a href="/docs/ja/design">Design</a></li></ul></nav>`,
	} {
		if !strings.Contains(body, want) {
			t.Errorf("TODO: body does not contain %q", want)
		}
	}
}
