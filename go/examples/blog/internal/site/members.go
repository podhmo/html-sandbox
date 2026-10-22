package site

import (
	"fmt"
	"io/fs"
	"strings"

	"github.com/podhmo/html-sandbox/go/pkg/tinyfrontmatter"
	"github.com/podhmo/html-sandbox/go/pkg/tinymarkdown"
)

// Member is one file of a bundle — a directory named like a page's file
// (posts/YYYY-MM-DD-slug.md/, docs/**/x.md/) — shown as a section of the
// bundle's page. The first member is the face: it is rendered as the page
// body and gives the page its title, description, and prev/next.
type Member struct {
	Name     string // file name inside the bundle, e.g. "memo.md"
	Source   string // its path in the repository
	Markdown bool   // Name ends in .md: rendered as Markdown, else as a pre block
	Doc      tinymarkdown.Document
	Meta     map[string]string // front matter, when Markdown
	Raw      string            // the file as written
}

// memberOf returns the member named name, or false.
func memberOf(ms []Member, name string) (Member, bool) {
	for _, m := range ms {
		if m.Name == name {
			return m, true
		}
	}
	return Member{}, false
}

// loadMembers reads the files directly inside the bundle directory name,
// sorted by file name with README.md hoisted to the front — fs.ReadDir
// already sorts by name. Bundles are flat: a subdirectory or an empty
// bundle is an error. repoDir is the bundle's path in the repository, for
// Member.Source.
func loadMembers(fsys fs.FS, name, repoDir string) ([]Member, error) {
	entries, err := fs.ReadDir(fsys, name)
	if err != nil {
		return nil, err
	}
	members := make([]Member, 0, len(entries))
	for _, e := range entries {
		if e.IsDir() {
			return nil, fmt.Errorf("%s/%s: is a directory (bundles are flat)", name, e.Name())
		}
		m := Member{
			Name:     e.Name(),
			Source:   repoDir + "/" + e.Name(),
			Markdown: strings.HasSuffix(e.Name(), ".md"),
		}
		src, err := fs.ReadFile(fsys, name+"/"+e.Name())
		if err != nil {
			return nil, err
		}
		m.Raw = string(src)
		if m.Markdown {
			meta, body, err := tinyfrontmatter.Split(m.Raw)
			if err != nil {
				return nil, fmt.Errorf("%s/%s: %w", name, e.Name(), err)
			}
			if err := checkMeta(m.Source, meta); err != nil {
				return nil, err
			}
			m.Meta = meta
			m.Doc = tinymarkdown.Parse(body)
		}
		members = append(members, m)
	}
	if len(members) == 0 {
		return nil, fmt.Errorf("%s: bundle has no files", name)
	}
	for i := range members {
		if members[i].Name == "README.md" {
			members[0], members[i] = members[i], members[0]
			break
		}
	}
	return members, nil
}
