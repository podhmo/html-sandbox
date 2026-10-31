// Command slops-nav checks and fixes the prev/next navigation chain of an
// article directory such as slops/.
//
// Every article — a YYYY-MM-DD-slug.md file or a same-named bundle
// directory — is linked to its neighbours in date order: "prev" to the
// previous article and "next" to the following one. Values are written as
// paths relative to the face file, the way the blog resolves them, so a
// bundle's face links to "../name.md".
//
// Without -w each inconsistency is listed and the exit status is 1 when any
// are found. With -w the front matter of each face is rewritten to match; a
// link written as "[label](url)" keeps its label.
//
// Usage:
//
//	go run ./examples/slops-nav ../../slops
//	go run ./examples/slops-nav -w ../../slops
package main

import (
	"flag"
	"fmt"
	"log/slog"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"slices"
	"strings"

	"github.com/podhmo/html-sandbox/go/pkg/tinyfrontmatter"
	"github.com/podhmo/html-sandbox/go/pkg/tinymarkdown"
)

func main() {
	flag.Usage = func() {
		fmt.Fprintln(flag.CommandLine.Output(), "usage: slops-nav [-w] [article directory]")
		flag.PrintDefaults()
	}
	write := flag.Bool("w", false, "rewrite the front matter to fix the chain")
	flag.Parse()
	dir := "slops"
	if flag.NArg() > 0 {
		dir = flag.Arg(0)
	}

	arts, err := load(dir)
	if err != nil {
		slog.Error("slops-nav", "error", err)
		os.Exit(1)
	}
	issues := check(dir, arts)
	if *write {
		n, err := fix(dir, arts)
		if err != nil {
			slog.Error("slops-nav", "error", err)
			os.Exit(1)
		}
		for _, is := range issues {
			fmt.Println(is)
		}
		fmt.Printf("%d issue(s), %d file(s) rewritten\n", len(issues), n)
		return
	}
	for _, is := range issues {
		fmt.Println(is)
	}
	if len(issues) > 0 {
		fmt.Printf("%d issue(s); run with -w to fix\n", len(issues))
		os.Exit(1)
	}
	fmt.Println("ok")
}

// article is one entry of the collection: a post file or a bundle
// directory named like one.
type article struct {
	name   string // entry name, e.g. "2026-10-18-moonbit.md"
	date   string
	slug   string
	bundle bool
	face   string // face file, relative to the collection directory
	meta   map[string]string
	src    string // the face file as written
}

var articleName = regexp.MustCompile(`^(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$`)

// load reads the face of every article in dir, ordered by date then slug —
// the order the blog lists them in.
func load(dir string) ([]article, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}
	var arts []article
	for _, e := range entries {
		m := articleName.FindStringSubmatch(e.Name())
		if m == nil {
			continue
		}
		a := article{name: e.Name(), date: m[1], slug: m[2], bundle: e.IsDir()}
		if a.face, err = faceOf(dir, a); err != nil {
			return nil, err
		}
		src, err := os.ReadFile(filepath.Join(dir, a.face))
		if err != nil {
			return nil, err
		}
		a.src = string(src)
		meta, _, err := tinyfrontmatter.Split(a.src)
		if err != nil {
			return nil, fmt.Errorf("%s: %w", a.face, err)
		}
		a.meta = meta
		arts = append(arts, a)
	}
	slices.SortFunc(arts, func(a, b article) int {
		return strings.Compare(a.date+a.slug, b.date+b.slug)
	})
	return arts, nil
}

// faceOf returns the face file of a — itself for a single-file article,
// README.md or the first *.md member for a bundle.
func faceOf(dir string, a article) (string, error) {
	if !a.bundle {
		return a.name, nil
	}
	entries, err := os.ReadDir(filepath.Join(dir, a.name))
	if err != nil {
		return "", err
	}
	face := ""
	for _, e := range entries {
		switch {
		case e.IsDir():
			return "", fmt.Errorf("%s/%s: is a directory (bundles are flat)", a.name, e.Name())
		case e.Name() == "README.md":
			return a.name + "/" + e.Name(), nil
		case face == "" && strings.HasSuffix(e.Name(), ".md"):
			face = a.name + "/" + e.Name()
		}
	}
	if face == "" {
		return "", fmt.Errorf("%s: bundle has no markdown face", a.name)
	}
	return face, nil
}

// navURL extracts the URL of a prev/next value the way the blog's navItem
// does: the destination of a single "[label](url)" link or a single bare
// word. label is the link's source text, "" for a bare URL. ok is false
// when the value is neither and renders as plain text.
func navURL(value string) (label, raw string, ok bool) {
	ins := tinymarkdown.Inlines(value)
	switch {
	case len(ins) == 1 && ins[0].Kind == tinymarkdown.InlineLink:
		// The value is a single link; its label is the text between the
		// first "[" and the "](" that opens the URL.
		if i := strings.LastIndex(value, "]("); i > 0 {
			label = value[1:i]
		}
		return label, ins[0].URL(), true
	case len(ins) == 1 && ins[0].Kind == tinymarkdown.InlineText && !strings.ContainsAny(ins[0].Text, " \t\n"):
		return "", ins[0].Text, true
	}
	return "", "", false
}

// target resolves a nav URL to the article it points at, the way the
// blog's pageLinker does: relative URLs resolve against the face's
// directory, and "/<coll>/<slug>" resolves by slug. "" means the URL is
// not an article page of the collection — a member file, an external URL,
// a missing target.
func (a article) target(coll, raw string, byName, bySlug map[string]article) string {
	u, err := url.Parse(raw)
	if err != nil || u.Scheme != "" || u.Host != "" || raw == "" || strings.HasPrefix(raw, "#") {
		return ""
	}
	if strings.HasPrefix(raw, "/") {
		rest, ok := strings.CutPrefix(u.Path, "/"+coll+"/")
		if !ok || strings.Contains(rest, "/") || strings.HasSuffix(rest, ".md") {
			return ""
		}
		if art, ok := bySlug[rest]; ok {
			return art.name
		}
		return ""
	}
	if art, ok := byName[path.Join(path.Dir(a.face), u.Path)]; ok {
		return art.name
	}
	return ""
}

// check compares each article's prev/next with its neighbours in the chain
// and returns one issue per inconsistency.
func check(dir string, arts []article) []string {
	coll := filepath.Base(dir)
	byName := make(map[string]article, len(arts))
	bySlug := make(map[string]article, len(arts))
	for _, a := range arts {
		byName[a.name] = a
		bySlug[a.slug] = a
	}
	known := []string{"title", "description", "prev", "next"}
	var issues []string
	report := func(a article, format string, args ...any) {
		issues = append(issues, a.face+": "+fmt.Sprintf(format, args...))
	}
	for i, a := range arts {
		if a.meta == nil {
			a.meta = map[string]string{}
		}
		for k := range a.meta {
			if !slices.Contains(known, k) {
				report(a, "unknown front matter key %q (want one of %v)", k, known)
			}
		}
		for _, field := range []string{"prev", "next"} {
			want := ""
			if field == "prev" && i > 0 {
				want = arts[i-1].name
			}
			if field == "next" && i+1 < len(arts) {
				want = arts[i+1].name
			}
			value := a.meta[field]
			_, raw, ok := navURL(value)
			got := a.target(coll, raw, byName, bySlug)
			switch {
			case value == "" && want == "":
			case value == "":
				report(a, "%s: missing (want %s)", field, rel(a, want))
			case !ok:
				report(a, "%s: %q is not a link", field, value)
			case got == "":
				report(a, "%s: %q does not link to an article (want %s)", field, value, relOrNone(a, want))
			case want == "":
				report(a, "%s: links to %s (want none)", field, got)
			case got != want:
				report(a, "%s: links to %s (want %s)", field, got, rel(a, want))
			}
		}
	}
	return issues
}

// rel is the path of the article named name as written in a's face: plain
// from a single file, "../name" from inside a bundle.
func rel(a article, name string) string {
	if a.bundle {
		return "../" + name
	}
	return name
}

func relOrNone(a article, name string) string {
	if name == "" {
		return "none"
	}
	return rel(a, name)
}

// fix rewrites the front matter of each face whose prev/next differs from
// the chain and returns the number of files written.
func fix(dir string, arts []article) (int, error) {
	n := 0
	for i, a := range arts {
		want := map[string]string{}
		if i > 0 {
			want["prev"] = arts[i-1].name
		}
		if i+1 < len(arts) {
			want["next"] = arts[i+1].name
		}
		vals := map[string]string{}
		changed := false
		for _, field := range []string{"prev", "next"} {
			t := want[field]
			if t == "" {
				if a.meta[field] != "" {
					changed = true
				}
				continue
			}
			v := rel(a, t)
			label, raw, ok := navURL(a.meta[field])
			if ok && label != "" {
				v = "[" + label + "](" + v + ")"
			}
			vals[field] = v
			if !ok || raw != rel(a, t) {
				changed = true
			}
		}
		if !changed {
			continue
		}
		src, err := setNav(a.src, vals["prev"], vals["next"])
		if err != nil {
			return n, fmt.Errorf("%s: %w", a.face, err)
		}
		if err := os.WriteFile(filepath.Join(dir, a.face), []byte(src), 0o644); err != nil {
			return n, err
		}
		n++
	}
	return n, nil
}

// setNav returns src with its front matter's prev and next set to the
// given values, "" removing the key. Other keys keep their lines; a
// document without front matter gets a new block.
func setNav(src, prev, next string) (string, error) {
	meta, body, err := tinyfrontmatter.Split(src)
	if err != nil {
		return "", err
	}
	if meta == nil {
		if prev == "" && next == "" {
			return src, nil
		}
		var b strings.Builder
		b.WriteString("---\n")
		if prev != "" {
			b.WriteString("prev: " + prev + "\n")
		}
		if next != "" {
			b.WriteString("next: " + next + "\n")
		}
		b.WriteString("---\n\n")
		b.WriteString(src)
		return b.String(), nil
	}

	lines := strings.Split(src, "\n")
	var kept []string
	i := 1 // lines[0] is the opening "---"
	for ; i < len(lines); i++ {
		l := strings.TrimRight(lines[i], " \t\r")
		if l == "---" {
			break
		}
		key, _, ok := strings.Cut(l, ":")
		if ok && (strings.TrimSpace(key) == "prev" || strings.TrimSpace(key) == "next") {
			continue
		}
		kept = append(kept, lines[i])
	}
	if len(kept) == 0 && prev == "" && next == "" {
		return strings.TrimLeft(body, "\n"), nil // an empty block is dropped
	}
	var b strings.Builder
	b.WriteString("---\n")
	for _, l := range kept {
		b.WriteString(l + "\n")
	}
	if prev != "" {
		b.WriteString("prev: " + prev + "\n")
	}
	if next != "" {
		b.WriteString("next: " + next + "\n")
	}
	b.WriteString("---\n")
	b.WriteString(body)
	return b.String(), nil
}
