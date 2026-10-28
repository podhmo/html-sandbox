package site

// The listen page: reads an article, or Markdown pasted into it, aloud
// with the browser's speech synthesis. listen.js does the reading; the
// page hands it the site's pages to pick from and, for pasted text, the
// preview page's renderer.

import (
	"strings"

	"github.com/podhmo/html-sandbox/go/pkg/el"
	pe "github.com/podhmo/html-sandbox/go/pkg/picoel"
)

// listenChoices is the datalist of the pages to read: each post's and
// document's repository path, labeled with its title, and the page's URL
// in data-href, where listen.js fetches the articles from.
func (st *site) listenChoices() pe.Node {
	option := func(source, title, href string) pe.Node {
		return el.El(el.Tag("option"),
			el.Attr(el.Value, source),
			el.Attr(el.AttrName("label"), plainText(title)),
			el.Attr(el.AttrName("data-href"), href))
	}
	list := []pe.Node{el.Attr(el.ID, "listen-files")}
	for _, p := range st.posts {
		list = append(list, option(postSource(p), p.Title, postPath(p)))
	}
	for _, d := range st.docs {
		list = append(list, option(d.Source, d.Title, docPath(d)))
	}
	return el.El(el.Tag("datalist"), list...)
}

// listenKnob is a slider for one of the speech's settings, with its
// value shown beside its name.
func listenKnob(name, label, min, max, step, value string) pe.Node {
	id := "listen-" + name
	return el.El(el.Tag("label"),
		pe.Text(label+" "),
		el.El(el.Tag("output"), el.Attr(el.ID, id+"-out"), pe.Text(value)),
		el.El(el.Input,
			el.Attr(el.Type, "range"),
			el.Attr(el.ID, id),
			el.Attr(el.AttrName("min"), min),
			el.Attr(el.AttrName("max"), max),
			el.Attr(el.AttrName("step"), step),
			el.Attr(el.Value, value)))
}

// listenButton is one of the player's buttons.
func listenButton(name, label string) pe.Node {
	return el.El(el.Tag("button"),
		el.Attr(el.Type, "button"),
		el.Attr(el.ID, "listen-"+name),
		pe.Text(label))
}

// listenPage is the player page: listen.js fills listen-out with the
// picked page's articles, or with the Markdown in listen-src rendered by
// the renderer at listen-data's data-wasm, and reads it aloud.
func listenPage(env pageEnv, st *site) pe.Node {
	const description = "Articles read aloud by your browser's speech synthesis. Nothing is saved."
	meta := pageMeta{
		Title:       "Listen",
		Description: description,
		URL:         env.BaseURL + "/listen",
		Type:        "website",
	}
	return layout(env, meta,
		pe.H1(pe.Text("Listen")),
		pe.P(pe.Text(description+" Click a paragraph to read from there.")),
		pe.P(
			el.El(el.Input,
				el.Attr(el.Type, "search"),
				el.Attr(el.ID, "listen-pick"),
				el.Attr(el.AttrName("list"), "listen-files"),
				el.Attr(el.AttrName("placeholder"), "slops/..."),
				el.Attr(el.AttrName("aria-label"), "the page to read")),
			st.listenChoices(),
		),
		el.El(el.Tag("details"),
			el.El(el.Tag("summary"), pe.Text("Or paste Markdown")),
			el.El(el.Tag("textarea"),
				el.Attr(el.ID, "listen-src"),
				el.Attr(el.AttrName("rows"), "8"),
				el.Attr(el.AttrName("aria-label"), "Markdown to read"))),
		el.El(el.Div,
			el.Attr(el.AttrName("role"), "group"),
			listenButton("play", "Play"),
			listenButton("pause", "Pause"),
			listenButton("stop", "Stop")),
		el.El(el.Div,
			el.Attr(el.Class, "grid"),
			el.El(el.Tag("label"),
				pe.Text("Voice"),
				el.El(el.Tag("select"), el.Attr(el.ID, "listen-voice"))),
			listenKnob("rate", "Rate", "0.5", "3", "0.1", "1"),
			listenKnob("pitch", "Pitch", "0", "2", "0.1", "1"),
			listenKnob("volume", "Volume", "0", "1", "0.05", "1")),
		pe.P(el.El(el.Small, el.Attr(el.ID, "listen-status"))),
		el.El(el.Div, el.Attr(el.ID, "listen-out")),
		el.El(el.Script,
			el.Attr(el.ID, "listen-data"),
			el.Attr(el.Type, "text/plain"),
			el.Attr(el.AttrName("data-wasm"), previewWasmPath),
			el.Attr(el.AttrName("data-files"), strings.Join(st.previewFiles(), "\n"))),
		pe.Script(listenJSPath),
	)
}
