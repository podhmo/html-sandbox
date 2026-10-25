package site

// The preview page: an editor that renders Markdown the way the site
// renders it, for checking a post or document before it is written. The
// rendering runs in the browser; the page only hands it the list of the
// site's files, so links resolve as they would for the file the text is
// meant to become.

import (
	"strings"

	"github.com/podhmo/html-sandbox/go/pkg/el"
	pe "github.com/podhmo/html-sandbox/go/pkg/picoel"
)

// previewFiles is the list of the site's files as repository paths —
// each post's or document's face and every bundle member — in the order
// the site holds them. The preview page hands it to the browser's
// renderer.
func (st *site) previewFiles() []string {
	var files []string
	for _, p := range st.posts {
		files = append(files, postSource(p))
		for _, m := range p.Members {
			files = append(files, m.Source)
		}
	}
	for _, d := range st.docs {
		files = append(files, d.Source)
		for _, m := range d.Members {
			files = append(files, m.Source)
		}
	}
	return files
}

// previewPage is the editor page: the textarea preview-src is rendered
// into preview-out by preview.js, which reads the renderer's URL and the
// site's file list from preview-data's data-* attributes (attribute
// values are escaped when written, so a file's name cannot inject
// markup).
func previewPage(env pageEnv, st *site) pe.Node {
	meta := pageMeta{
		Title:       "Preview",
		Description: "Markdown rendered the way this site renders it. Nothing is saved.",
		URL:         env.BaseURL + "/preview",
		Type:        "website",
	}
	return layout(env, meta,
		pe.H1(pe.Text("Preview")),
		pe.P(pe.Text("Markdown rendered the way this site renders it. Nothing is saved.")),
		pe.P(
			el.El(el.Input,
				el.Attr(el.Type, "file"),
				el.Attr(el.ID, "preview-file"),
				el.Attr(el.AttrName("accept"), ".md,text/markdown,text/plain"),
				el.Attr(el.AttrName("aria-label"), "load a Markdown file")),
			el.El(el.Small, el.Attr(el.ID, "preview-engine")),
		),
		el.El(el.Div,
			el.Attr(el.Class, "preview-grid"),
			el.El(el.Tag("textarea"),
				el.Attr(el.ID, "preview-src"),
				el.Attr(el.AttrName("rows"), "24"),
				el.Attr(el.AttrName("aria-label"), "Markdown source"),
				pe.Text(previewSample)),
			el.El(el.Div, el.Attr(el.ID, "preview-out"))),
		el.El(el.Script,
			el.Attr(el.ID, "preview-data"),
			el.Attr(el.Type, "text/plain"),
			el.Attr(el.AttrName("data-wasm"), previewWasmPath),
			el.Attr(el.AttrName("data-files"), strings.Join(st.previewFiles(), "\n"))),
		pe.Script(previewJSPath),
	)
}

// previewSample is what the editor starts with: a short post showing
// what the renderer does.
const previewSample = `# Sample

Text with ` + "`code`" + ` and a [link](https://example.com).

- one
- two

> [!NOTE]
> An alert.

| a | b |
| - | - |
| 1 | 2 |

` + "```js\nconsole.log(\"hi\")\n```"
