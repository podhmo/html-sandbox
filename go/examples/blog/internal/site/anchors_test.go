package site

import "testing"

func TestSlugify(t *testing.T) {
	tests := []struct {
		name  string
		title string
		want  string
	}{
		{"ascii words", "Hello World", "hello-world"},
		{"uppercase", "ABC", "abc"},
		{"keeps hyphen and underscore", "a-b_c", "a-b_c"},
		{"japanese is kept", "日本語", "日本語"},
		{"japanese words", "日本語 の 見出し", "日本語-の-見出し"},
		{"full-width space becomes a hyphen", "日本語　の　見出し", "日本語-の-見出し"},
		{"tab becomes a hyphen", "a\tb", "a-b"},
		{"double space becomes two hyphens", "a  b", "a--b"},
		{"punctuation is dropped", "日本語、の。見出し", "日本語の見出し"},
		{"middle dot is dropped", "テスト・検証", "テスト検証"},
		{"emoji is dropped, its space stays", "😀 Emoji", "-emoji"},
		{"latin accent is kept", "Café", "café"},
		{"mixed ascii and japanese", "Hello 世界！", "hello-世界"},
		{"inline code text stays", "`code` と **強調**", "code-と-強調"},
		{"digits are kept", "123", "123"},
		{"only punctuation", "!!!", ""},
		{"empty", "", ""},
		{"leading and trailing spaces are hyphens", " a ", "-a-"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := slugify(tt.title); got != tt.want {
				t.Errorf("slugify(%q) = %q, want %q", tt.title, got, tt.want)
			}
		})
	}
}

func TestAnchorIDs(t *testing.T) {
	t.Run("duplicates get numbered suffixes", func(t *testing.T) {
		gen := newAnchorIDs()
		got := []string{gen.id("Hello"), gen.id("Hello"), gen.id("Hello")}
		want := []string{"hello", "hello-1", "hello-2"}
		for i := range want {
			if got[i] != want[i] {
				t.Fatalf("id %d = %q, want %q (%v)", i, got[i], want[i], got)
			}
		}
	})
	t.Run("a generated suffix is not reused", func(t *testing.T) {
		gen := newAnchorIDs()
		gen.id("Foo")
		gen.id("Foo")
		if got := gen.id("foo-1"); got != "foo-1-1" {
			t.Fatalf("literal foo-1 = %q, want foo-1-1", got)
		}
	})
	t.Run("empty slugs anchor as sec", func(t *testing.T) {
		gen := newAnchorIDs()
		got := []string{gen.id("!!!"), gen.id("???")}
		want := []string{"sec", "sec-1"}
		for i := range want {
			if got[i] != want[i] {
				t.Fatalf("id %d = %q, want %q (%v)", i, got[i], want[i], got)
			}
		}
	})
}
