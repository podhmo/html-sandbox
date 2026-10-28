package site

import (
	"cmp"
	"net/http"
	"path"
	"strconv"
	"strings"

	"github.com/podhmo/html-sandbox/go/pkg/el"
	pe "github.com/podhmo/html-sandbox/go/pkg/picoel"
	"github.com/podhmo/html-sandbox/go/pkg/tinymarkdown"
)

const (
	siteName        = "blog"
	siteDescription = "Notes rendered with Wasm."
	// repoHomeURL is the repository's top page, linked from the header.
	repoHomeURL = "https://github.com/podhmo/html-sandbox"
)

// pageMeta describes a page for <head>. Title and Description may hold
// inline Markdown, which layout reduces to plain text.
type pageMeta struct {
	Title       string // page title without the site name; empty for the top page
	Description string
	// URL is the absolute URL of the page. OGP tags are written only when
	// it is set, so error pages have none.
	URL  string
	Type string // OGP type: "website" or "article"
}

// pageEnv is what every page needs to know about the running server.
type pageEnv struct {
	BaseURL string // absolute, without a trailing slash
	// LiveReload loads the script that reloads the page when the server
	// says files have changed (the -watch flag).
	LiveReload bool
}

// layout is the frame shared by every page. The doctype is written by render.
func layout(env pageEnv, meta pageMeta, body ...pe.Node) pe.Node {
	meta.Title = plainText(meta.Title)
	meta.Description = plainText(meta.Description)
	head := []pe.Node{
		pe.Title(documentTitle(meta.Title)),
		pe.MetaName("description", meta.Description),
	}
	head = append(head, ogp(meta)...)
	head = append(head, pe.Stylesheet(siteCSSPath), pe.Icon("/favicon.svg", "image/svg+xml"), pe.Script(codeCopyJSPath))
	if env.LiveReload {
		head = append(head, pe.Script(liveReloadScriptPath))
	}
	return pe.Document("ja", head,
		pe.Header(pe.Spread(
			[]pe.Node{
				pe.A("/", pe.Text("slops")),
				pe.A("/posts/", pe.Text("posts")),
				pe.A("/docs/", pe.Text("docs")),
			},
			[]pe.Node{
				moreTools(),
				pe.A(repoHomeURL, pe.Text("github")),
			},
		)),
		pe.Main(body...),
		pe.Footer(pe.Small(pe.Text("Rendered with Wasm."))),
	)
}

// moreTools is the header's dropdown of the pages that work on text in
// the browser: preview and listen. pico draws a details.dropdown in a nav
// as a menu, and role="link" draws its summary like the links beside it
// rather than as a form field. site.css opens the menu under the
// summary's right edge.
func moreTools() pe.Node {
	return el.El(el.Tag("details"),
		el.Attr(el.Class, "dropdown"),
		el.El(el.Tag("summary"), el.Attr(el.AttrName("role"), "link"), pe.Text("more tools")),
		el.El(el.Ul,
			pe.Li(pe.A("/preview", pe.Text("preview"))),
			pe.Li(pe.A("/listen", pe.Text("listen")))))
}

// documentTitle is the <title> text: the page title followed by the site name.
func documentTitle(title string) string {
	if title == "" {
		return siteName
	}
	return title + " - " + siteName
}

// ogp returns Open Graph <meta> tags, or none when meta has no URL.
func ogp(meta pageMeta) []pe.Node {
	if meta.URL == "" {
		return nil
	}
	prop := pe.MetaProperty
	return []pe.Node{
		prop("og:title", cmp.Or(meta.Title, siteName)),
		prop("og:type", meta.Type),
		prop("og:url", meta.URL),
		prop("og:description", meta.Description),
		prop("og:site_name", siteName),
	}
}

// postList shows each post as a card: the title links to the post and the
// date below it is muted by hgroup. Each collection identifies its authors.
func postList(env pageEnv, posts []Post) pe.Node {
	return articleList(env, posts, "slops", "/")
}

func articleList(env pageEnv, posts []Post, collection, listPath string) pe.Node {
	title, subtitle := "Posts", "blog by human"
	if collection == "slops" {
		title, subtitle = "Slops", "blog by AI"
	}
	body := []pe.Node{pe.Hgroup(pe.H1(pe.Text(title)), pe.P(pe.Text(subtitle)))}
	for _, p := range posts {
		if p.collection() != collection {
			continue
		}
		body = append(body, pe.Article(pe.Hgroup(
			pe.H2(pe.A(postPath(p), linkedTitle(p.Title)...)),
			pe.P(pe.Date(p.Date)),
		)))
	}
	meta := pageMeta{Description: siteDescription, URL: env.BaseURL + listPath, Type: "website"}
	if listPath != "/" {
		meta.Title = title
		meta.Description = subtitle
	}
	return layout(env, meta, body...)
}

func postPage(env pageEnv, st *site, p Post) pe.Node {
	link := st.linker(p.linkBase())
	gen := newAnchorIDs()
	var body []pe.Node
	if _, ok := firstTitle(p.Doc); !ok {
		// The title came from front matter only, so the body has no heading.
		id := gen.id(plainText(p.Title))
		head := append([]pe.Node{el.Attr(el.ID, id)}, renderInlines(tinymarkdown.Inlines(p.Title), link)...)
		body = append(body, el.El(el.H1, append(head, permalink(id))...))
	}
	body = append(body, renderFace(link, p.Members, p.Doc, gen)...)
	meta := pageMeta{
		Title:       p.Title,
		Description: p.Description,
		URL:         env.BaseURL + postPath(p),
		Type:        "article",
	}
	page := []pe.Node{pageHeader(pe.Date(p.Date), postMarkdownPath(p), p.File), pe.Article(body...)}
	for _, m := range sectionMembers(p.Members) {
		page = append(page, memberSection(st.linker(m.Source), postPath(p), m, gen))
	}
	if nav := relNav(p.Prev, p.Next); nav != nil {
		page = append(page, nav)
	}
	return layout(env, meta, page...)
}

// renderFace renders the page body: the face member's document, or its raw
// text in a pre block when the face is not a Markdown file.
func renderFace(link linker, ms []Member, doc tinymarkdown.Document, gen *anchorIDs) []pe.Node {
	if len(ms) > 0 && !ms[0].Markdown {
		return []pe.Node{pe.Pre(ms[0].Raw)}
	}
	return renderBlocks(doc.Children, link, gen)
}

// sectionMembers returns the members of ms shown as sections: every member but
// the face, which the page renders as its body.
func sectionMembers(ms []Member) []Member {
	if len(ms) == 0 {
		return nil
	}
	return ms[1:]
}

// memberSection renders one member of a bundle after the face: an article
// headed by its file name, which links to the raw file served under the
// page's URL. Markdown members render their document, an SVG member shows
// as an image, and other members render as a pre block.
func memberSection(link linker, base string, m Member, gen *anchorIDs) pe.Node {
	id := gen.id(m.Name)
	body := []pe.Node{el.El(el.H2, el.Attr(el.ID, id), pe.A(base+"/"+m.Name, pe.Code(m.Name)), permalink(id))}
	switch {
	case m.Markdown:
		body = append(body, renderBlocks(m.Doc.Children, link, gen)...)
	case m.SVG:
		body = append(body, el.El(el.Img,
			el.Attr(el.Src, base+"/"+m.Name), el.Attr(el.Alt, m.Name)))
	default:
		body = append(body, pe.Pre(m.Raw))
	}
	return pe.Article(body...)
}

// docList links to every repository document, showing its file path below
// the title.
func docList(env pageEnv, docs []Doc) pe.Node {
	body := []pe.Node{pe.H1(pe.Text("Docs"))}
	for _, d := range docs {
		body = append(body, pe.Article(pe.Hgroup(
			pe.H2(pe.A(docPath(d), linkedTitle(d.Title)...)),
			pe.P(pe.Text(d.Source)),
		)))
	}
	meta := pageMeta{Title: "Docs", Description: "Documents of this repository.", URL: env.BaseURL + "/docs/", Type: "website"}
	return layout(env, meta, body...)
}

func docPage(env pageEnv, st *site, d Doc) pe.Node {
	link := st.linker(d.linkBase())
	gen := newAnchorIDs()
	var body []pe.Node
	if _, ok := firstTitle(d.Doc); !ok {
		id := gen.id(plainText(d.Title))
		head := append([]pe.Node{el.Attr(el.ID, id)}, renderInlines(tinymarkdown.Inlines(d.Title), link)...)
		body = append(body, el.El(el.H1, append(head, permalink(id))...))
	}
	body = append(body, renderFace(link, d.Members, d.Doc, gen)...)
	meta := pageMeta{Title: d.Title, Description: d.Description, URL: env.BaseURL + docPath(d), Type: "article"}
	page := []pe.Node{pageHeader(pe.Small(pe.Text(d.Source)), docMarkdownPath(d), path.Base(d.Source)), pe.Article(body...)}
	for _, m := range sectionMembers(d.Members) {
		page = append(page, memberSection(st.linker(m.Source), docPath(d), m, gen))
	}
	if nav := relNav(d.Prev, d.Next); nav != nil {
		page = append(page, nav)
	}
	return layout(env, meta, page...)
}

// relNav is the prev/next navigation below the article: prev on the left
// and next on the right, split like the "Download .md" row above it. A
// nil item leaves its side empty; when both are nil there is no nav.
func relNav(prev, next *navItem) pe.Node {
	if prev == nil && next == nil {
		return nil
	}
	side := func(heading string, it *navItem) pe.Node {
		if it == nil {
			return el.El(el.Ul)
		}
		label := renderInlines(it.label, noLinks)
		children := []pe.Node{pe.Small(pe.Text(heading)), el.El(el.Br)}
		if it.href != "" {
			children = append(children, pe.A(it.href, label...))
		} else {
			children = append(children, label...)
		}
		return el.El(el.Ul, el.El(el.Li, children...))
	}
	return el.El(el.Nav, side("← Previous", prev), side("Next →", next))
}

// noLinks resolves no URL: a nav label renders its text only, since a
// link cannot sit inside another link.
var noLinks linker = func(string) (string, bool) { return "", false }

func postPath(p Post) string {
	return "/" + p.collection() + "/" + p.Slug
}

// postMarkdownPath is where the source of p is served.
func postMarkdownPath(p Post) string {
	return postPath(p) + ".md"
}

// pageHeader is the row above the article: info on the left and, on the
// right, a small link that downloads the page's Markdown source. It sits in
// main rather than in the article, where pico would pad it into a band.
func pageHeader(info pe.Node, href, filename string) pe.Node {
	download := pe.Small(pe.DownloadLink(href, filename, pe.Text("Download .md")))
	return pe.InnerHeader(pe.Spread([]pe.Node{info}, []pe.Node{download}))
}

func errorPage(env pageEnv, status int, message string) pe.Node {
	title := strconv.Itoa(status) + " " + http.StatusText(status)
	return layout(env, pageMeta{Title: title, Description: message},
		pe.H1(pe.Text(title)),
		pe.P(pe.Text(message)),
		pe.P(pe.A("/", pe.Text("Back to all posts"))),
	)
}

// headingTags maps a section level to its heading tag.
var headingTags = [...]el.Tag{1: el.H1, 2: el.H2, 3: el.H3, 4: el.H4, 5: el.H5}

// renderBlocks converts the Markdown tree into nodes. Every piece of text
// goes through pe.Text, so HTML in posts is escaped. link resolves the URLs
// of links. gen assigns each section's heading its anchor id.
func renderBlocks(bs []tinymarkdown.Block, link linker, gen *anchorIDs) []pe.Node {
	out := make([]pe.Node, 0, len(bs))
	for _, b := range bs {
		switch b := b.(type) {
		case tinymarkdown.Section:
			id := gen.id(plainText(b.Title))
			head := append([]pe.Node{
				el.Attr(el.ID, id),
			}, renderInlines(tinymarkdown.Inlines(b.Title), link)...)
			children := append([]pe.Node{el.El(headingTags[b.Level], append(head, permalink(id))...)}, renderBlocks(b.Children, link, gen)...)
			out = append(out, pe.Section(children...))
		case tinymarkdown.Paragraph:
			out = append(out, pe.P(renderInlines(tinymarkdown.Inlines(b.Text), link)...))
		case tinymarkdown.List:
			out = append(out, renderList(b.Items, link))
		case tinymarkdown.Quote:
			out = append(out, pe.Blockquote(renderBlocks(b.Children, link, gen)...))
		case tinymarkdown.Alert:
			title := el.El(el.P, el.Attr(el.Class, "markdown-alert-title"), pe.Text(alertTitle(b.Kind)))
			children := append([]pe.Node{
				el.Attr(el.Class, "markdown-alert markdown-alert-"+b.Kind),
				title,
			}, renderBlocks(b.Children, link, gen)...)
			out = append(out, el.El(el.Blockquote, children...))
		case tinymarkdown.Table:
			cells := func(row []string) [][]pe.Node {
				out := make([][]pe.Node, 0, len(row))
				for _, c := range row {
					out = append(out, renderInlines(tinymarkdown.Inlines(c), link))
				}
				return out
			}
			rows := make([][][]pe.Node, 0, len(b.Rows))
			for _, r := range b.Rows {
				rows = append(rows, cells(r))
			}
			out = append(out, pe.Table(cells(b.Header), rows))
		case tinymarkdown.CodeBlock:
			// A ```svg block is the image itself: its content is author-
			// controlled markup, so it may be written out raw.
			if b.Info == "svg" {
				out = append(out, el.Raw(b.Code))
			} else {
				out = append(out, pe.Pre(b.Code))
			}
		}
	}
	return out
}

// alertTitle is the heading text of an alert block — the kind with its
// first letter capitalized, as GitHub writes it.
func alertTitle(kind string) string {
	return strings.ToUpper(kind[:1]) + kind[1:]
}

// renderList renders items as a list, with the children of an item as a
// list inside its <li>.
func renderList(items []tinymarkdown.Item, link linker) pe.Node {
	lis := make([]pe.Node, 0, len(items))
	for _, it := range items {
		li := renderInlines(tinymarkdown.Inlines(it.Text), link)
		if len(it.Children) > 0 {
			li = append(li, renderList(it.Children, link))
		}
		lis = append(lis, pe.Li(li...))
	}
	return pe.List(lis...)
}

// linkedTitle renders a title written in Markdown inside the link to its
// page. Links in the title show only their text, as links cannot nest.
func linkedTitle(title string) []pe.Node {
	return renderInlines(tinymarkdown.Inlines(title), noLinks)
}

// plainText drops the markup of inline Markdown: code spans and links keep
// only their text. It is for places that hold no HTML, such as <title>.
func plainText(s string) string {
	var b strings.Builder
	var walk func([]tinymarkdown.Inline)
	walk = func(ins []tinymarkdown.Inline) {
		for _, in := range ins {
			switch in.Kind {
			case tinymarkdown.InlineText, tinymarkdown.InlineCode:
				b.WriteString(in.Text)
			case tinymarkdown.InlineLink:
				walk(in.Children())
			}
		}
	}
	walk(tinymarkdown.Inlines(s))
	return b.String()
}

// renderInlines turns code spans into <code> and links into <a>; the rest
// is text. A link whose URL link rejects shows only its text.
func renderInlines(ins []tinymarkdown.Inline, link linker) []pe.Node {
	var out []pe.Node
	for _, in := range ins {
		switch in.Kind {
		case tinymarkdown.InlineText:
			out = append(out, pe.Text(in.Text))
		case tinymarkdown.InlineCode:
			out = append(out, pe.Code(in.Text))
		case tinymarkdown.InlineLink:
			children := renderInlines(in.Children(), link)
			if href, ok := link(in.URL()); ok {
				out = append(out, pe.A(href, children...))
			} else {
				out = append(out, children...)
			}
		}
	}
	return out
}
