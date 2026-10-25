package site

import (
	"strings"
	"testing"
	"testing/fstest"
)

func TestArticleCollections(t *testing.T) {
	human, err := LoadPosts(fstest.MapFS{
		"2026-10-19-same.md/README.md":  file("# Human\n\n[AI](../../slops/2026-10-19-same.md)"),
		"2026-10-19-same.md/article.md": file("# Human member"),
	})
	if err != nil {
		t.Fatal(err)
	}
	ai, err := LoadSlops(fstest.MapFS{
		"2026-10-19-same.md/README.md":  file("---\nnext: ../../posts/2026-10-19-same.md\n---\n# AI\n\n[Member](article.md)"),
		"2026-10-19-same.md/article.md": file("# AI member"),
	})
	if err != nil {
		t.Fatal(err)
	}
	h, err := NewServer("https://example.com", append(human, ai...), nil)
	if err != nil {
		t.Fatal(err)
	}
	for _, tc := range []struct{ path, want, absent string }{
		{"/", "blog by AI", `<a href="/posts/same">`},
		{"/posts/", `<a href="/posts/same">Human</a>`, `<a href="/slops/same">`},
		{"/slops/", `<a href="/slops/same">AI</a>`, `<a href="/posts/same">`},
		{"/posts/same", `<a href="/slops/same">AI</a>`, "AI member"},
		{"/slops/same", `<a href="/slops/same/article.md">Member</a>`, "Human member"},
		{"/posts/same/article.md", "# Human member", "AI member"},
		{"/slops/same/article.md", "# AI member", "Human member"},
		{"/slops/same.md", "# AI", "Human member"},
	} {
		res, body := get(t, h, tc.path)
		if res.StatusCode != 200 || !strings.Contains(body, tc.want) || strings.Contains(body, tc.absent) {
			t.Errorf("%s: status %d; want %q without %q", tc.path, res.StatusCode, tc.want, tc.absent)
		}
	}
	_, body := get(t, h, "/slops/same")
	if !strings.Contains(body, `<a href="/posts/same">Human</a>`) {
		t.Error("cross-collection next link lost its title")
	}
	for _, collection := range []string{"posts", "slops"} {
		res, _ := get(t, h, "/"+collection+"?x=1")
		if res.StatusCode != 307 || res.Header.Get("Location") != "/"+collection+"/?x=1" {
			t.Error("collection redirect lost query")
		}
	}
}

func TestEmbeddedHumanBundle(t *testing.T) {
	humanFS, aiFS, docsFS := EmbeddedSources()
	human, err := LoadPosts(humanFS)
	if err != nil {
		t.Fatal(err)
	}
	if len(human) != 1 || human[0].Slug != "wsl-opencode" || len(human[0].Members) != 3 {
		t.Fatalf("want the three-file Gist bundle, got %#v", human)
	}
	ai, err := LoadSlops(aiFS)
	if err != nil {
		t.Fatal(err)
	}
	docs, err := LoadDocs(docsFS)
	if err != nil {
		t.Fatal(err)
	}
	h, err := NewServer("https://example.com", append(human, ai...), docs)
	if err != nil {
		t.Fatal(err)
	}
	_, body := get(t, h, "/posts/wsl-opencode")
	for _, want := range []string{"2026-10-19", "/posts/wsl-opencode/article1.md", "/posts/wsl-opencode/article2.md", "非開発者向け手順", "開発者向けフォローアップ"} {
		if !strings.Contains(body, want) {
			t.Errorf("bundle page is missing %q", want)
		}
	}
	res, _ := get(t, h, "/posts/hello")
	if res.StatusCode != 404 {
		t.Error("AI article still served as a human post")
	}
	res, _ = get(t, h, "/slops/hello")
	if res.StatusCode != 200 {
		t.Error("moved AI article is missing")
	}
}
