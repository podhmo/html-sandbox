package site

import (
	"net/http"
	"strings"
	"testing"
	"testing/fstest"
)

var bundlePosts = fstest.MapFS{
	"2026-10-14-hello.md":              file("# Hello\nbody"),
	"2026-10-15-bundle.md/README.md":   file("---\ntitle: Bundle title\ndescription: Bundle desc\n---\n# Bundle\nSee [code](main.go)."),
	"2026-10-15-bundle.md/00-intro.md": file("# Intro\nextra text"),
	"2026-10-15-bundle.md/main.go":     file("package main\n\nfunc main() {}"),
}

func TestLoadPostBundle(t *testing.T) {
	posts, err := LoadPosts(bundlePosts)
	if err != nil {
		t.Fatal(err)
	}
	if len(posts) != 2 {
		t.Fatalf("got %d posts, want 2", len(posts))
	}
	b := posts[0]
	if b.Slug != "bundle" || b.Title != "Bundle title" || b.Description != "Bundle desc" {
		t.Fatalf("face meta wrong: %+v", b)
	}
	var names []string
	for _, m := range b.Members {
		names = append(names, m.Name)
	}
	want := []string{"README.md", "00-intro.md", "main.go"}
	if strings.Join(names, ",") != strings.Join(want, ",") {
		t.Errorf("member order %v, want %v", names, want)
	}
	if b.Members[2].Name != "main.go" || b.Members[2].Markdown {
		t.Error("main.go must be a non-markdown member")
	}
}

func TestLoadPostBundleNoReadme(t *testing.T) {
	posts, err := LoadPosts(fstest.MapFS{
		"2026-10-15-b.md/01-second.md": file("# Second"),
		"2026-10-15-b.md/00-first.md":  file("# First\nbody"),
	})
	if err != nil {
		t.Fatal(err)
	}
	if posts[0].Members[0].Name != "00-first.md" || posts[0].Title != "First" {
		t.Errorf("first sorted member must be the face: %+v", posts[0])
	}
}

func TestLoadPostBundleErrors(t *testing.T) {
	// fstest.MapFS cannot express an empty directory, so the empty-bundle
	// error of loadMembers is exercised implicitly by its "no files" branch
	// on real filesystems only.
	for name, fsys := range map[string]fstest.MapFS{
		"subdir":   {"2026-10-15-e.md/sub/x.md": file("# x"), "2026-10-15-e.md/README.md": file("# R")},
		"no title": {"2026-10-15-e.md/x.go": file("package x")},
		"dup slug": {"2026-10-14-x.md": file("# A"), "2026-10-15-x.md/README.md": file("# B")},
		"bad fm":   {"2026-10-15-e.md/README.md": file("---\ntitel: x\n---\n# x")},
	} {
		if _, err := LoadPosts(fsys); err == nil {
			t.Errorf("%s: want error", name)
		}
	}
}

func TestPostBundlePage(t *testing.T) {
	h := newTestServer(t, bundlePosts)
	_, body := get(t, h, "/posts/bundle")
	for _, want := range []string{
		`<h2><a href="/posts/bundle/00-intro.md"><code>00-intro.md</code></a></h2>`,
		`<h2><a href="/posts/bundle/main.go"><code>main.go</code></a></h2>`,
		`<pre>package main`,
		`<a href="/posts/bundle/main.go">code</a>`,
	} {
		if !strings.Contains(body, want) {
			t.Errorf("page does not contain %q", want)
		}
	}
	if strings.Contains(body, `<code>README.md</code>`) {
		t.Error("the face must not be rendered as a named member section")
	}
}

func TestBundleMemberRaw(t *testing.T) {
	h := newTestServer(t, bundlePosts)
	res, body := get(t, h, "/posts/bundle/main.go")
	if res.StatusCode != http.StatusOK || body != "package main\n\nfunc main() {}" {
		t.Errorf("member: status %d, body %q", res.StatusCode, body)
	}
	if ct := res.Header.Get("Content-Type"); ct != "text/plain; charset=utf-8" {
		t.Errorf("Content-Type %q", ct)
	}
	res, _ = get(t, h, "/posts/bundle/00-intro.md")
	if ct := res.Header.Get("Content-Type"); ct != "text/markdown; charset=utf-8" {
		t.Errorf("md member: Content-Type %q", ct)
	}
	res, body = get(t, h, "/posts/bundle/nope.md")
	if res.StatusCode != http.StatusNotFound || !strings.Contains(body, "Page not found.") {
		t.Errorf("unknown member: status %d", res.StatusCode)
	}
	res, _ = get(t, h, "/posts/hello/extra.md")
	if res.StatusCode != http.StatusNotFound {
		t.Errorf("member of non-bundle: status %d", res.StatusCode)
	}
}

var bundleDocs = fstest.MapFS{
	"TODO.md":                       file("# TODO"),
	"docs/guide.md/README.md":       file("# Guide\nbody"),
	"docs/guide.md/setup.sh":        file("#!/bin/sh\necho hi"),
	"docs/sketch/deep.md/README.md": file("# Deep"),
	"docs/plain.md":                 file("# Plain"),
}

func TestLoadDocBundle(t *testing.T) {
	docs, err := LoadDocs(bundleDocs)
	if err != nil {
		t.Fatal(err)
	}
	var g Doc
	paths := map[string]bool{}
	for _, d := range docs {
		paths[d.Path] = true
		if d.Path == "guide" {
			g = d
		}
	}
	if !paths["guide"] || !paths["sketch/deep"] || !paths["plain"] {
		t.Fatalf("paths %v", paths)
	}
	if g.Source != "docs/guide.md" || g.Title != "Guide" || len(g.Members) != 2 {
		t.Fatalf("bundle doc wrong: %+v", g)
	}
}

func TestDocBundleConflict(t *testing.T) {
	_, err := LoadDocs(fstest.MapFS{
		"docs/guide.md/README.md": file("# G"),
		"docs/guide/memo.md":      file("# M"),
	})
	if err == nil || !strings.Contains(err.Error(), "collide") {
		t.Errorf("want collision error, got %v", err)
	}
}

func TestDocBundleMemberRaw(t *testing.T) {
	posts, _ := LoadPosts(fstest.MapFS{})
	docs, err := LoadDocs(bundleDocs)
	if err != nil {
		t.Fatal(err)
	}
	h, err := NewServer("https://example.com", posts, docs)
	if err != nil {
		t.Fatal(err)
	}
	res, body := get(t, h, "/docs/guide/setup.sh")
	if res.StatusCode != http.StatusOK || body != "#!/bin/sh\necho hi" {
		t.Errorf("member: status %d, body %q", res.StatusCode, body)
	}
	res, _ = get(t, h, "/docs/guide/README.md")
	if res.StatusCode != http.StatusOK {
		t.Errorf("face member raw: status %d", res.StatusCode)
	}
	_, body = get(t, h, "/docs/guide")
	if want := `<h2><a href="/docs/guide/setup.sh"><code>setup.sh</code></a></h2>`; !strings.Contains(body, want) {
		t.Errorf("page does not contain %q", want)
	}
	res, _ = get(t, h, "/docs/plain/memo.md")
	if res.StatusCode != http.StatusNotFound {
		t.Errorf("member of non-bundle doc: status %d", res.StatusCode)
	}
}

func TestReadmeHoistKeepsOrder(t *testing.T) {
	posts, err := LoadPosts(fstest.MapFS{
		"2026-10-15-b.md/README.md": file("---\ntitle: F\n---\nface"),
		"2026-10-15-b.md/a.md":      file("# A"),
		"2026-10-15-b.md/b.md":      file("# B"),
	})
	if err != nil {
		t.Fatal(err)
	}
	want := []string{"README.md", "a.md", "b.md"}
	for i, m := range posts[0].Members {
		if m.Name != want[i] {
			t.Fatalf("member %d = %s, want order %v", i, m.Name, want)
		}
	}
}

func TestDocBundleNonMarkdownFace(t *testing.T) {
	posts, _ := LoadPosts(fstest.MapFS{})
	docs, err := LoadDocs(fstest.MapFS{
		"docs/x.md/00-run.sh": file("echo hi\n"),
		"docs/x.md/01-note.md": file("# Note"),
	})
	if err != nil {
		t.Fatal(err)
	}
	h, err := NewServer("https://example.com", posts, docs)
	if err != nil {
		t.Fatal(err)
	}
	res, body := get(t, h, "/docs/x")
	if res.StatusCode != http.StatusOK {
		t.Fatalf("status %d", res.StatusCode)
	}
	if !strings.Contains(body, "<pre>echo hi") {
		t.Errorf("non-markdown face must render as a pre block")
	}
	if !strings.Contains(body, `<h2><a href="/docs/x/01-note.md"><code>01-note.md</code></a></h2>`) {
		t.Errorf("companion section missing")
	}
}
