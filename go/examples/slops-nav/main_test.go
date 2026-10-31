package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func writeFile(t *testing.T, dir, name, src string) {
	t.Helper()
	p := filepath.Join(dir, name)
	if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(p, []byte(src), 0o644); err != nil {
		t.Fatal(err)
	}
}

func TestCheckAndFix(t *testing.T) {
	dir := t.TempDir()
	writeFile(t, dir, "2026-10-01-a.md", "# A\n")
	writeFile(t, dir, "2026-10-02-b.md", "---\ntitle: B\nnext: 2026-10-04-not-a.md\n---\n\n# B\n")
	writeFile(t, dir, "2026-10-03-c.md/README.md", "---\ntitle: C\nprev: [see a](2026-10-01-a.md)\n---\n\n# C\n")
	writeFile(t, dir, "2026-10-03-c.md/code.txt", "x\n")

	arts, err := load(dir)
	if err != nil {
		t.Fatal(err)
	}
	issues := check(dir, arts)
	var joined string
	for _, is := range issues {
		joined += is + "\n"
	}
	for _, want := range []string{
		"2026-10-01-a.md: next: missing (want 2026-10-02-b.md)",
		"2026-10-02-b.md: prev: missing (want 2026-10-01-a.md)",
		`2026-10-02-b.md: next: "2026-10-04-not-a.md" does not link to an article (want 2026-10-03-c.md)`,
		`2026-10-03-c.md/README.md: prev: "[see a](2026-10-01-a.md)" does not link to an article (want ../2026-10-02-b.md)`,
	} {
		if !strings.Contains(joined, want) {
			t.Errorf("issues do not contain %q:\n%s", want, joined)
		}
	}

	if _, err := fix(dir, arts); err != nil {
		t.Fatal(err)
	}
	for file, want := range map[string]string{
		"2026-10-01-a.md":           "---\nnext: 2026-10-02-b.md\n---\n\n# A\n",
		"2026-10-02-b.md":           "---\ntitle: B\nprev: 2026-10-01-a.md\nnext: 2026-10-03-c.md\n---\n\n# B\n",
		"2026-10-03-c.md/README.md": "---\ntitle: C\nprev: [see a](../2026-10-02-b.md)\n---\n\n# C\n",
	} {
		got, err := os.ReadFile(filepath.Join(dir, file))
		if err != nil {
			t.Fatal(err)
		}
		if string(got) != want {
			t.Errorf("%s:\n%s\nwant:\n%s", file, got, want)
		}
	}

	arts, err = load(dir)
	if err != nil {
		t.Fatal(err)
	}
	if issues := check(dir, arts); len(issues) != 0 {
		t.Errorf("after fix: %v", issues)
	}
}

func TestSetNav(t *testing.T) {
	cases := []struct{ src, prev, next, want string }{
		// No front matter: a block is added.
		{"# A\n", "a.md", "b.md", "---\nprev: a.md\nnext: b.md\n---\n\n# A\n"},
		{"# A\n", "", "", "# A\n"},
		// Existing keys keep their lines; nav keys move to the end.
		{"---\ntitle: T\nnext: old.md\n---\n\n# T\n", "", "new.md", "---\ntitle: T\nnext: new.md\n---\n\n# T\n"},
		// A key with an empty want is removed.
		{"---\ntitle: T\nprev: x.md\nnext: y.md\n---\n\n# T\n", "", "y.md", "---\ntitle: T\nnext: y.md\n---\n\n# T\n"},
		// A block left empty is dropped.
		{"---\nprev: x.md\n---\n\n# T\n", "", "", "# T\n"},
	}
	for i, c := range cases {
		got, err := setNav(c.src, c.prev, c.next)
		if err != nil {
			t.Fatal(err)
		}
		if got != c.want {
			t.Errorf("case %d:\n%s\nwant:\n%s", i, got, c.want)
		}
	}
}

func TestNavURL(t *testing.T) {
	if label, raw, ok := navURL("[see `a`](x.md)"); !ok || label != "see `a`" || raw != "x.md" {
		t.Errorf("link: %q %q %v", label, raw, ok)
	}
	if _, raw, ok := navURL("x.md"); !ok || raw != "x.md" {
		t.Errorf("bare: %q %v", raw, ok)
	}
	if _, _, ok := navURL("just some words"); ok {
		t.Error("text must not parse as a URL")
	}
	if _, _, ok := navURL("[a](x) [b](y)"); ok {
		t.Error("two links must not parse as one URL")
	}
}
