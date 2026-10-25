package site

import (
	"strings"

	"github.com/podhmo/html-sandbox/go/pkg/tinymarkdown"
)

// navItem is a "prev" or "next" navigation link read from front matter:
// the label's inlines and, when the written URL may be linked, the href
// it resolved to.
type navItem struct {
	label []tinymarkdown.Inline
	href  string // "" when the label is shown as text without a link
}

// navItem resolves the value of a prev or next key written in the file at
// source. The value is a single Markdown link "[text](url)" or a single
// bare URL; anything else, and any URL the page linker refuses, is shown
// as text without a link. For a bare URL the label is the title of the
// page it points to, or the URL itself when it does not point at a page
// of this site.
func (st *site) navItem(source, value string) *navItem {
	if value == "" {
		return nil
	}
	ins := tinymarkdown.Inlines(value)
	var label []tinymarkdown.Inline
	var raw string
	switch {
	case len(ins) == 1 && ins[0].Kind == tinymarkdown.InlineLink:
		label, raw = ins[0].Children(), ins[0].URL()
	case len(ins) == 1 && ins[0].Kind == tinymarkdown.InlineText && !strings.ContainsAny(ins[0].Text, " \t\n"):
		raw = ins[0].Text
	default:
		// Not a single link nor a single URL: show the value as text.
		return &navItem{label: []tinymarkdown.Inline{tinymarkdown.Text(value)}}
	}
	if len(label) == 0 {
		// An empty label ("[](url)") is filled like a bare URL's.
		label = nil
	}
	href, ok := st.pageLinker(source)(raw)
	if !ok {
		// The URL must not be linked; like a refused link in the body,
		// only its text is shown.
		if label == nil {
			label = []tinymarkdown.Inline{tinymarkdown.Text(raw)}
		}
		return &navItem{label: label}
	}
	if label == nil {
		if t := st.pageTitle(href); t != "" {
			label = tinymarkdown.Inlines(t)
		} else {
			label = []tinymarkdown.Inline{tinymarkdown.Text(raw)}
		}
	}
	return &navItem{label: label, href: href}
}

// pageTitle returns the title of the post or document at href, a URL that
// pageLinker resolved, or "" when it is not a page of this site.
func (st *site) pageTitle(href string) string {
	p, _, _ := strings.Cut(href, "?")
	p, _, _ = strings.Cut(p, "#")
	if post, ok := st.bySlug[p]; ok {
		return post.Title
	}
	if path, ok := strings.CutPrefix(p, "/docs/"); ok {
		if d, ok := st.byPath[path]; ok {
			return d.Title
		}
	}
	return ""
}
