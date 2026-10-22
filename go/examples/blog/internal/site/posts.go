package site

import (
	"cmp"
	"fmt"
	"io/fs"
	"regexp"
	"slices"
	"strings"
	"time"

	"github.com/podhmo/html-sandbox/go/pkg/tinyfrontmatter"
	"github.com/podhmo/html-sandbox/go/pkg/tinymarkdown"
)

// Post is one blog post loaded from a YYYY-MM-DD-slug.md file.
type Post struct {
	Slug        string
	File        string // file name, e.g. 2026-10-14-hello.md
	Date        time.Time
	Title       string   // front matter "title", or the first "#" heading
	Description string   // front matter "description", or the first paragraph
	Prev        *navItem // front matter "prev", resolved by newSite
	Next        *navItem // front matter "next", resolved by newSite
	prevRaw     string   // front matter "prev", as written
	nextRaw     string   // front matter "next", as written
	Doc         tinymarkdown.Document
	Markdown    string // the file as written, front matter included
	// Members holds every file of a bundle (a directory named like a post
	// file), face first; nil for a single-file post.
	Members []Member
}

// linkBase is the repository path that relative links of p resolve
// against: for a bundle the face member's own file, so relative links
// stay inside the bundle directory.
func (p Post) linkBase() string {
	if len(p.Members) > 0 {
		return p.Members[0].Source
	}
	return postSource(p)
}

// frontMatterKeys are the keys a post or document may set; others are
// reported as typos.
var frontMatterKeys = []string{"title", "description", "prev", "next"}

// checkMeta reports a key of meta that is not in frontMatterKeys.
func checkMeta(name string, meta map[string]string) error {
	for k := range meta {
		if !slices.Contains(frontMatterKeys, k) {
			return fmt.Errorf("%s: unknown front matter key %q (want one of %v)", name, k, frontMatterKeys)
		}
	}
	return nil
}

var postName = regexp.MustCompile(`^(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$`)

// LoadPosts reads every *.md file and every *.md directory (a bundle) at
// the top of fsys, newest first. Directories not named like a post file
// and files not named *.md are not content.
func LoadPosts(fsys fs.FS) ([]Post, error) {
	entries, err := fs.ReadDir(fsys, ".")
	if err != nil {
		return nil, err
	}
	seen := map[string]string{} // slug -> file name
	posts := make([]Post, 0, len(entries))
	for _, e := range entries {
		name := e.Name()
		m := postName.FindStringSubmatch(name)
		switch {
		case e.IsDir():
			if m == nil {
				continue
			}
		case !strings.HasSuffix(name, ".md"):
			continue
		case m == nil:
			return nil, fmt.Errorf("%s: file name must look like YYYY-MM-DD-slug.md (slug: a-z, 0-9, -)", name)
		}
		date, err := time.Parse(time.DateOnly, m[1])
		if err != nil {
			return nil, fmt.Errorf("%s: %w", name, err)
		}
		slug := m[2]
		if prev, ok := seen[slug]; ok {
			return nil, fmt.Errorf("%s: slug %q is already used by %s", name, slug, prev)
		}
		seen[slug] = name

		if e.IsDir() {
			p, err := loadPostBundle(fsys, name, date, slug)
			if err != nil {
				return nil, err
			}
			posts = append(posts, p)
			continue
		}
		src, err := fs.ReadFile(fsys, name)
		if err != nil {
			return nil, err
		}
		meta, body, err := tinyfrontmatter.Split(string(src))
		if err != nil {
			return nil, fmt.Errorf("%s: %w", name, err)
		}
		if err := checkMeta(name, meta); err != nil {
			return nil, err
		}
		doc := tinymarkdown.Parse(body)
		title := meta["title"]
		if title == "" {
			title, _ = firstTitle(doc)
		}
		if title == "" {
			return nil, fmt.Errorf("%s: no title (set \"title\" in front matter or start with a \"# title\" heading)", name)
		}
		description := meta["description"]
		if description == "" {
			description = firstParagraph(doc.Children)
		}
		posts = append(posts, Post{Slug: slug, File: name, Date: date, Title: title, Description: description, prevRaw: meta["prev"], nextRaw: meta["next"], Doc: doc, Markdown: string(src)})
	}
	slices.SortFunc(posts, func(a, b Post) int {
		return cmp.Or(b.Date.Compare(a.Date), cmp.Compare(a.Slug, b.Slug))
	})
	return posts, nil
}

// loadPostBundle reads the bundle directory name as a single post. Its
// first member — README.md if present, else the file first in name order —
// is the face: it gives the post its title, description, and prev/next.
func loadPostBundle(fsys fs.FS, name string, date time.Time, slug string) (Post, error) {
	members, err := loadMembers(fsys, name, postsDir+"/"+name)
	if err != nil {
		return Post{}, err
	}
	face := members[0]
	meta := face.Meta
	title := meta["title"]
	if title == "" {
		title, _ = firstTitle(face.Doc)
	}
	if title == "" {
		return Post{}, fmt.Errorf("%s: no title (set \"title\" in front matter or start with a \"# title\" heading)", face.Source)
	}
	description := meta["description"]
	if description == "" {
		description = firstParagraph(face.Doc.Children)
	}
	return Post{Slug: slug, File: name, Date: date, Title: title, Description: description, prevRaw: meta["prev"], nextRaw: meta["next"], Doc: face.Doc, Markdown: face.Raw, Members: members}, nil
}

// firstTitle returns the title of the first top-level "#" section.
func firstTitle(doc tinymarkdown.Document) (string, bool) {
	for _, b := range doc.Children {
		if s, ok := b.(tinymarkdown.Section); ok && s.Level == 1 {
			return s.Title, true
		}
	}
	return "", false
}

// firstParagraph returns the first paragraph in document order, with line
// breaks turned into spaces.
func firstParagraph(bs []tinymarkdown.Block) string {
	for _, b := range bs {
		switch b := b.(type) {
		case tinymarkdown.Paragraph:
			return strings.ReplaceAll(b.Text, "\n", " ")
		case tinymarkdown.Section:
			if s := firstParagraph(b.Children); s != "" {
				return s
			}
		}
	}
	return ""
}
