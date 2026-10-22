package site

import (
	"encoding/json"
	"net/http"
	"strings"
	"testing"
	"testing/fstest"
)

func TestSearchJSON(t *testing.T) {
	h := newTestServer(t, testPosts)
	res, body := get(t, h, "/search.json")
	if res.StatusCode != http.StatusOK {
		t.Fatalf("status %d", res.StatusCode)
	}
	if ct := res.Header.Get("Content-Type"); ct != "application/json; charset=utf-8" {
		t.Errorf("Content-Type %q", ct)
	}
	if strings.Contains(body, `\u003c`) || strings.Contains(body, `\u0026`) {
		t.Error(`SetEscapeHTML(false) should leave < and & alone`)
	}
	if strings.Contains(body, `"date":""`) {
		t.Error("documents should omit date")
	}

	var entries []searchEntry
	if err := json.Unmarshal([]byte(body), &entries); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}
	type row struct{ URL, Kind, Title, Date string }
	var got []row
	for _, e := range entries {
		got = append(got, row{e.URL, e.Kind, e.Title, e.Date})
	}
	want := []row{
		{"/posts/hello", "post", "Hello <script>", "2026-10-14"},
		{"/posts/old", "post", "Old post", "2026-10-01"},
		{"/docs/TODO", "doc", "TODO", ""},
		{"/docs/ja/design", "doc", "Design <x>", ""},
		{"/docs/notes", "doc", "docs/notes.md", ""},
	}
	if len(got) != len(want) {
		t.Fatalf("got %d entries, want %d: %v", len(got), len(want), got)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Errorf("entry %d: got %v, want %v", i, got[i], want[i])
		}
	}

	text := map[string]string{}
	for _, e := range entries {
		text[e.URL] = e.Text
	}
	for _, want := range []string{"Hello <script>", "first", "Points", "one.1", "two", "x := <1>"} {
		if !strings.Contains(text["/posts/hello"], want) {
			t.Errorf("hello text does not contain %q: %q", want, text["/posts/hello"])
		}
	}
	if strings.Contains(text["/posts/hello"], "#") || strings.Contains(text["/posts/hello"], "`") {
		t.Errorf("hello text holds Markdown markup: %q", text["/posts/hello"])
	}
	todo := text["/docs/TODO"]
	for _, want := range []string{"TODO", "note", "task", "first line\nsecond line", "child"} {
		if !strings.Contains(todo, want) {
			t.Errorf("TODO text does not contain %q: %q", want, todo)
		}
	}
	if strings.Contains(todo, "**") {
		t.Errorf("TODO text holds emphasis markup: %q", todo)
	}
	design := text["/docs/ja/design"]
	if want := "Use el"; !strings.Contains(design, want) {
		t.Errorf("design text does not contain %q: %q", want, design)
	}
}

func TestSearchJSONBundle(t *testing.T) {
	h := newTestServer(t, fstest.MapFS{
		"2026-10-20-b.md/README.md": file("---\ntitle: Bundle\ndescription: d\n---\n# Bundle\nface text"),
		"2026-10-20-b.md/member.md": file("## Member\nmember text"),
		"2026-10-20-b.md/raw.txt":   file("raw member text"),
	})
	_, body := get(t, h, "/search.json")
	var entries []searchEntry
	if err := json.Unmarshal([]byte(body), &entries); err != nil {
		t.Fatal(err)
	}
	for _, e := range entries {
		if e.URL != "/posts/b" {
			continue
		}
		for _, want := range []string{"face text", "member.md", "member text"} {
			if !strings.Contains(e.Text, want) {
				t.Errorf("bundle text does not contain %q: %q", want, e.Text)
			}
		}
		if strings.Contains(e.Text, "raw member text") {
			t.Errorf("bundle text holds a non-Markdown member: %q", e.Text)
		}
		return
	}
	t.Fatal("no entry for /posts/b")
}

func TestSearchJS(t *testing.T) {
	if !strings.HasPrefix(searchJSPath, "/search.js?v=") {
		t.Fatalf("searchJSPath %q", searchJSPath)
	}
	res, body := get(t, newTestServer(t, testPosts), searchJSPath)
	if res.StatusCode != http.StatusOK || body != string(searchJS) {
		t.Errorf("status %d, body %.40q", res.StatusCode, body)
	}
	for k, want := range map[string]string{
		"Content-Type":  "text/javascript; charset=utf-8",
		"Cache-Control": "public, max-age=31536000, immutable",
	} {
		if got := res.Header.Get(k); got != want {
			t.Errorf("%s: got %q, want %q", k, got, want)
		}
	}
}

func TestSearchPage(t *testing.T) {
	res, body := get(t, newTestServer(t, testPosts), "/search")
	if res.StatusCode != http.StatusOK {
		t.Fatalf("status %d", res.StatusCode)
	}
	if ct := res.Header.Get("Content-Type"); ct != "text/html; charset=utf-8" {
		t.Errorf("Content-Type %q", ct)
	}
	for _, want := range []string{
		`<title>Search - blog</title>`,
		`<meta name="description" content="Search posts and documents.">`,
		`<h1>Search</h1>`,
		`<form role="search" action="/search" method="get">`,
		`<input type="search" name="q" placeholder="Search posts and docs" aria-label="Search query">`,
		`<button type="submit">Search</button>`,
		`<noscript>`,
		`<p id="search-status" role="status">`,
		`<ul id="search-results"></ul>`,
		`<script src="` + miniSearchURL + `" defer></script>`,
		`<script src="` + searchJSPath + `" defer></script>`,
	} {
		if !strings.Contains(body, want) {
			t.Errorf("body does not contain %q", want)
		}
	}
	docs := strings.Index(body, `<a href="/docs/">docs</a>`)
	search := strings.Index(body, `<a href="/search">search</a>`)
	github := strings.Index(body, `<a href="https://github.com/podhmo/html-sandbox">github</a>`)
	if docs < 0 || search < docs || github < search {
		t.Errorf("want docs, then search, then github; got indexes %d, %d, %d", docs, search, github)
	}
}
