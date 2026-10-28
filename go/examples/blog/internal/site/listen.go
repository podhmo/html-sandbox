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

// listenChoices is the list of the pages to read: a link to each post's
// and document's page, named by its repository path, which listen.js
// narrows by a fuzzy match on the path, with its title beside it.
func (st *site) listenChoices() pe.Node {
	choice := func(source, title, href string) pe.Node {
		return pe.Li(
			el.El(el.A, el.Attr(el.Href, href), el.Attr(el.AttrName("data-source"), source), pe.Text(source)),
			pe.Text(" "),
			pe.Small(pe.Text(plainText(title))))
	}
	list := []pe.Node{el.Attr(el.ID, "listen-files")}
	for _, p := range st.posts {
		list = append(list, choice(postSource(p), p.Title, postPath(p)))
	}
	for _, d := range st.docs {
		list = append(list, choice(d.Source, d.Title, docPath(d)))
	}
	return el.El(el.Ul, list...)
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

// listenButton is one of the player's buttons; the attrs are added to it.
func listenButton(name, label string, attrs ...pe.Node) pe.Node {
	children := []pe.Node{el.Attr(el.Type, "button"), el.Attr(el.ID, "listen-"+name)}
	children = append(children, attrs...)
	return el.El(el.Tag("button"), append(children, pe.Text(label))...)
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
		el.El(el.Div,
			el.Attr(el.Class, "listen-picker"),
			el.El(el.Input,
				el.Attr(el.Type, "search"),
				el.Attr(el.ID, "listen-pick"),
				el.Attr(el.AttrName("autocomplete"), "off"),
				el.Attr(el.AttrName("placeholder"), "file name, e.g. moonbit wasm"),
				el.Attr(el.AttrName("aria-label"), "the file to read")),
			st.listenChoices(),
		),
		el.El(el.Tag("details"),
			el.El(el.Tag("summary"), pe.Text("Or paste Markdown")),
			el.El(el.Tag("textarea"),
				el.Attr(el.ID, "listen-src"),
				el.Attr(el.AttrName("rows"), "8"),
				el.Attr(el.AttrName("aria-label"), "Markdown to read"))),
		// Play stands out; the others are drawn as outlines.
		el.El(el.Div,
			el.Attr(el.Class, "grid"),
			listenButton("play", "Play"),
			listenButton("pause", "Pause", el.Attr(el.Class, "outline")),
			listenButton("stop", "Stop", el.Attr(el.Class, "outline"))),
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
