package site

import (
	"bytes"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/podhmo/html-sandbox/go/pkg/el"
	pe "github.com/podhmo/html-sandbox/go/pkg/picoel"
	"github.com/podhmo/html-sandbox/go/pkg/tinymarkdown"
)

// MiniSearch on jsDelivr, pinned to a major version like pico.css.
const miniSearchURL = "https://cdn.jsdelivr.net/npm/minisearch@7/dist/umd/index.min.js"

// searchEntry is one page in /search.json: the corpus the browser indexes.
type searchEntry struct {
	URL   string `json:"url"`
	Kind  string `json:"kind"` // "post" or "doc"
	Title string `json:"title"`
	Date  string `json:"date,omitempty"` // YYYY-MM-DD; posts only
	Text  string `json:"text"`
}

// handleSearchJSON serves every post and document as plain text, in the same
// order as / (posts) and /docs/ (documents). The browser builds the index;
// the server only supplies the corpus.
func (s *Server) handleSearchJSON(w http.ResponseWriter, r *http.Request) {
	var b bytes.Buffer
	enc := json.NewEncoder(&b)
	enc.SetEscapeHTML(false) // keep <, >, and & as they are: smaller JSON
	if err := enc.Encode(s.searchEntries()); err != nil {
		s.renderError(w, r, http.StatusInternalServerError, "Something went wrong.", err)
		return
	}
	h := w.Header()
	h.Set("Content-Type", "application/json; charset=utf-8")
	h.Set("Cache-Control", "no-cache")
	h.Set("Content-Length", strconv.Itoa(b.Len()))
	w.Write(b.Bytes())
}

// searchEntries builds the corpus from the site loaded for this request, so
// it follows -watch reloads without a separate build step.
func (s *Server) searchEntries() []searchEntry {
	st := s.site.Load()
	entries := make([]searchEntry, 0, len(st.posts)+len(st.docs))
	for _, p := range st.posts {
		entries = append(entries, searchEntry{
			URL:   postPath(p),
			Kind:  "post",
			Title: plainText(p.Title),
			Date:  p.Date.Format("2006-01-02"),
			Text:  pageText(p.Doc, p.Members),
		})
	}
	for _, d := range st.docs {
		entries = append(entries, searchEntry{
			URL:   docPath(d),
			Kind:  "doc",
			Title: plainText(d.Title),
			Text:  pageText(d.Doc, d.Members),
		})
	}
	return entries
}

// pageText is the plain text of a page: its face document and, for a bundle,
// the documents of its Markdown members. Non-Markdown members are skipped
// because their text is a code listing, not prose.
func pageText(doc tinymarkdown.Document, members []Member) string {
	parts := []string{documentText(doc)}
	for _, m := range sectionMembers(members) {
		if !m.Markdown {
			continue
		}
		if text := documentText(m.Doc); text != "" {
			parts = append(parts, m.Name, text)
		}
	}
	return strings.TrimSpace(strings.Join(nonEmpty(parts), "\n\n"))
}

// documentText walks the Markdown tree and returns its readable text, with
// headings, paragraphs, list items, quotes, tables, and code blocks. All
// inline markup is dropped: links and code spans keep only their text.
func documentText(doc tinymarkdown.Document) string {
	var lines []string
	collectBlocks(&lines, doc.Children)
	return strings.TrimSpace(strings.Join(lines, "\n"))
}

func collectBlocks(lines *[]string, blocks []tinymarkdown.Block) {
	for _, block := range blocks {
		switch b := block.(type) {
		case tinymarkdown.Section:
			addLine(lines, inlineText(b.Title))
			collectBlocks(lines, b.Children)
		case tinymarkdown.Paragraph:
			addLine(lines, inlineText(b.Text))
		case tinymarkdown.List:
			collectItems(lines, b.Items)
		case tinymarkdown.Quote:
			collectBlocks(lines, b.Children)
		case tinymarkdown.Table:
			addLine(lines, inlineCells(b.Header))
			for _, row := range b.Rows {
				addLine(lines, inlineCells(row))
			}
		case tinymarkdown.CodeBlock:
			addLine(lines, strings.TrimSpace(b.Code))
		}
	}
}

func collectItems(lines *[]string, items []tinymarkdown.Item) {
	for _, item := range items {
		addLine(lines, inlineText(item.Text))
		collectItems(lines, item.Children)
	}
}

func inlineCells(cells []string) string {
	text := make([]string, 0, len(cells))
	for _, cell := range cells {
		text = append(text, inlineText(cell))
	}
	return strings.Join(text, "\t")
}

// inlineText is s without inline Markdown markup. The parser leaves
// emphasis as text (it supports only code spans and links), so the "**" of
// emphasis is dropped here as well; search needs the words, not the markup.
func inlineText(s string) string {
	return strings.ReplaceAll(plainText(s), "**", "")
}

func addLine(lines *[]string, s string) {
	if s = strings.TrimSpace(s); s != "" {
		*lines = append(*lines, s)
	}
}

func nonEmpty(ss []string) []string {
	out := ss[:0]
	for _, s := range ss {
		if s != "" {
			out = append(out, s)
		}
	}
	return out
}

// handleSearchJS serves the embedded client script. The page loads it with a
// version in the query, so it can be cached for long like site.css.
func handleSearchJS(w http.ResponseWriter, r *http.Request) {
	h := w.Header()
	h.Set("Content-Type", "text/javascript; charset=utf-8")
	h.Set("Cache-Control", "public, max-age=31536000, immutable")
	h.Set("Content-Length", strconv.Itoa(len(searchJS)))
	w.Write(searchJS)
}

// handleSearch serves the search page. The results are filled in by
// search.js; without JavaScript the page explains why it stays empty.
func (s *Server) handleSearch(w http.ResponseWriter, r *http.Request) {
	s.page(w, r, searchPage(s.env))
}

func searchPage(env pageEnv) pe.Node {
	form := el.El(el.Tag("form"),
		el.Attr(el.AttrName("role"), "search"),
		el.Attr(el.AttrName("action"), "/search"),
		el.Attr(el.AttrName("method"), "get"),
		el.El(el.Input,
			el.Attr(el.Type, "search"),
			el.Attr(el.Name, "q"),
			el.Attr(el.AttrName("placeholder"), "Search posts and docs"),
			el.Attr(el.AttrName("aria-label"), "Search query"),
		),
		el.El(el.Tag("button"), el.Attr(el.Type, "submit"), pe.Text("Search")),
	)
	body := []pe.Node{
		pe.H1(pe.Text("Search")),
		form,
		el.El(el.Tag("noscript"), pe.P(pe.Text("Search needs JavaScript. Enable it, or browse the posts and docs from the header."))),
		el.El(el.P,
			el.Attr(el.ID, "search-status"),
			el.Attr(el.AttrName("role"), "status"),
			pe.Text("Type a word to search."),
		),
		el.El(el.Ul, el.Attr(el.ID, "search-results")),
		pe.Script(miniSearchURL),
		pe.Script(searchJSPath),
	}
	meta := pageMeta{
		Title:       "Search",
		Description: "Search posts and documents.",
		URL:         env.BaseURL + "/search",
		Type:        "website",
	}
	return layout(env, meta, body...)
}
