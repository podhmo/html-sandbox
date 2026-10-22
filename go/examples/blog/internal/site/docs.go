package site

import (
	"errors"
	"fmt"
	"io/fs"
	"path"
	"strings"

	"github.com/podhmo/html-sandbox/go/pkg/tinyfrontmatter"
	"github.com/podhmo/html-sandbox/go/pkg/tinymarkdown"
)

// Doc is a repository document, such as TODO.md or docs/ja/design.md,
// served under /docs/.
type Doc struct {
	Path        string   // URL path below /docs/: the file path without "docs/" and ".md"
	Source      string   // file path in the repository
	Title       string   // front matter "title", the first "#" heading, or Source
	Description string   // front matter "description", or the first paragraph
	Prev        *navItem // front matter "prev", resolved by newSite
	Next        *navItem // front matter "next", resolved by newSite
	prevRaw     string   // front matter "prev", as written
	nextRaw     string   // front matter "next", as written
	Doc         tinymarkdown.Document
	Markdown    string // the file as written, front matter included
	// Members holds every file of a bundle (a directory named like a
	// document file), face first; nil for a single-file document.
	Members []Member
}

// linkBase is the repository path that relative links of d resolve
// against: for a bundle the face member's own file, so relative links
// stay inside the bundle directory.
func (d Doc) linkBase() string {
	if len(d.Members) > 0 {
		return d.Members[0].Source
	}
	return d.Source
}

// DocSources are the files and directories of fsys that hold documents.
// Only these are read, so fsys may be the whole repository on disk.
var DocSources = []string{"TODO.md", "docs"}

// LoadDocs reads every *.md file in docSources, in that order and then in
// file path order, except as docs.head and docs.tail of
// docs/blog.metadata.json reorder them. Sources missing from fsys are
// skipped.
func LoadDocs(fsys fs.FS) ([]Doc, error) {
	var docs []Doc
	seen := map[string]string{} // Path -> Source
	walk := func(name string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			if !strings.HasSuffix(name, ".md") {
				return nil
			}
			// A directory named like a document file is a bundle: its
			// files form a single page.
			p := strings.TrimPrefix(strings.TrimSuffix(name, ".md"), "docs/")
			if prev, ok := seen[p]; ok {
				return fmt.Errorf("%s: /docs/%s is already used by %s", name, p, prev)
			}
			if st, err := fs.Stat(fsys, "docs/"+p); err == nil && st.IsDir() {
				return fmt.Errorf("%s: pages under docs/%s/ would collide with its members", name, p)
			}
			seen[p] = name
			members, err := loadMembers(fsys, name, name)
			if err != nil {
				return err
			}
			face := members[0]
			meta := face.Meta
			title := meta["title"]
			if title == "" {
				title, _ = firstTitle(face.Doc)
			}
			if title == "" {
				title = name
			}
			description := meta["description"]
			if description == "" {
				description = firstParagraph(face.Doc.Children)
			}
			docs = append(docs, Doc{Path: p, Source: name, Title: title, Description: description, prevRaw: meta["prev"], nextRaw: meta["next"], Doc: face.Doc, Markdown: face.Raw, Members: members})
			return fs.SkipDir
		}
		if path.Ext(name) != ".md" {
			return nil
		}
		p := strings.TrimPrefix(strings.TrimSuffix(name, ".md"), "docs/")
		if prev, ok := seen[p]; ok {
			return fmt.Errorf("%s: /docs/%s is already used by %s", name, p, prev)
		}
		seen[p] = name

		src, err := fs.ReadFile(fsys, name)
		if err != nil {
			return err
		}
		meta, body, err := tinyfrontmatter.Split(string(src))
		if err != nil {
			return fmt.Errorf("%s: %w", name, err)
		}
		if err := checkMeta(name, meta); err != nil {
			return err
		}
		doc := tinymarkdown.Parse(body)
		title := meta["title"]
		if title == "" {
			title, _ = firstTitle(doc)
		}
		if title == "" {
			title = name
		}
		description := meta["description"]
		if description == "" {
			description = firstParagraph(doc.Children)
		}
		docs = append(docs, Doc{Path: p, Source: name, Title: title, Description: description, prevRaw: meta["prev"], nextRaw: meta["next"], Doc: doc, Markdown: string(src)})
		return nil
	}
	for _, root := range DocSources {
		if _, err := fs.Stat(fsys, root); errors.Is(err, fs.ErrNotExist) {
			continue
		}
		if err := fs.WalkDir(fsys, root, walk); err != nil {
			return nil, err
		}
	}
	return orderDocs(fsys, docs)
}

func docPath(d Doc) string {
	return "/docs/" + d.Path
}

// docMarkdownPath is where the source of d is served.
func docMarkdownPath(d Doc) string {
	return docPath(d) + ".md"
}
