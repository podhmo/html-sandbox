package site

// The skim page: shows an article, or Markdown pasted into it, a few
// words at a time in the middle of the screen (RSVP). skim.js does the
// showing; the page hands it the site's pages to pick from and, for
// pasted text, the preview page's renderer. It shares nothing with the
// listen page but the way it is laid out.

import (
	"strings"

	"github.com/podhmo/html-sandbox/go/pkg/el"
	pe "github.com/podhmo/html-sandbox/go/pkg/picoel"
)

// skimChoices is the list of the pages to skim: a link to each post's
// and document's page, named by its repository path, which skim.js
// narrows by a fuzzy match on the path, with its title beside it.
func (st *site) skimChoices() pe.Node {
	choice := func(source, title, href string) pe.Node {
		return pe.Li(
			el.El(el.A, el.Attr(el.Href, href), el.Attr(el.AttrName("data-source"), source), pe.Text(source)),
			pe.Text(" "),
			pe.Small(pe.Text(plainText(title))))
	}
	list := []pe.Node{el.Attr(el.ID, "skim-files")}
	for _, p := range st.posts {
		list = append(list, choice(postSource(p), p.Title, postPath(p)))
	}
	for _, d := range st.docs {
		list = append(list, choice(d.Source, d.Title, docPath(d)))
	}
	return el.El(el.Ul, list...)
}

// skimButton is one of the page's buttons; the attrs are added to it.
func skimButton(name, label string, attrs ...pe.Node) pe.Node {
	children := []pe.Node{el.Attr(el.Type, "button"), el.Attr(el.ID, "skim-"+name)}
	children = append(children, attrs...)
	return el.El(el.Tag("button"), append(children, pe.Text(label))...)
}

// skimSpeed is a slider for the speed, in characters a minute, with its
// value shown after the label. The page has one to set before starting
// and the stage one to change it while it runs; skim.js keeps them alike.
func skimSpeed(id, label string) pe.Node {
	return el.El(el.Tag("label"),
		pe.Text(label),
		el.El(el.Tag("output"), el.Attr(el.ID, id+"-out"), pe.Text("600")),
		pe.Text("/min"),
		el.El(el.Input,
			el.Attr(el.Type, "range"),
			el.Attr(el.ID, id),
			el.Attr(el.AttrName("data-setting"), "cpm"),
			el.Attr(el.AttrName("min"), "300"),
			el.Attr(el.AttrName("max"), "1500"),
			el.Attr(el.AttrName("step"), "50"),
			el.Attr(el.Value, "600")))
}

// skimAround is a switch for showing the pieces before and after the one
// being shown; like skimSpeed, there is one on the page and one on the
// stage.
func skimAround(id string) pe.Node {
	return el.El(el.Tag("label"),
		el.El(el.Input,
			el.Attr(el.Type, "checkbox"),
			el.Attr(el.AttrName("role"), "switch"),
			el.Attr(el.ID, id),
			el.Attr(el.AttrName("data-setting"), "around"),
			el.Attr(el.AttrName("checked"), "")),
		pe.Text("Before and after"))
}

// skimPage is the reader page: skim.js fills skim-out with the picked
// page's articles, or with the Markdown in skim-src rendered by the
// renderer at skim-data's data-wasm, and shows it piece by piece in
// skim-stage, which covers the screen while it runs.
func skimPage(env pageEnv, st *site) pe.Node {
	const description = "Articles shown a few words at a time in the middle of the screen. The speed stays in this browser."
	meta := pageMeta{
		Title:       "Skim",
		Description: description,
		URL:         env.BaseURL + "/skim",
		Type:        "website",
	}
	outline := el.Attr(el.Class, "outline")
	return layout(env, meta,
		pe.H1(pe.Text("Skim")),
		pe.P(pe.Text(description+" Tap a paragraph to start from there.")),
		el.El(el.Div,
			el.Attr(el.Class, "skim-picker"),
			el.El(el.Input,
				el.Attr(el.Type, "search"),
				el.Attr(el.ID, "skim-pick"),
				el.Attr(el.AttrName("autocomplete"), "off"),
				el.Attr(el.AttrName("placeholder"), "file name, e.g. moonbit wasm"),
				el.Attr(el.AttrName("aria-label"), "the file to skim")),
			st.skimChoices(),
		),
		el.El(el.Tag("details"),
			el.El(el.Tag("summary"), pe.Text("Or paste Markdown")),
			el.El(el.Tag("textarea"),
				el.Attr(el.ID, "skim-src"),
				el.Attr(el.AttrName("rows"), "8"),
				el.Attr(el.AttrName("aria-label"), "Markdown to skim"))),
		el.El(el.Div,
			el.Attr(el.Class, "grid"),
			skimSpeed("skim-cpm", "Speed "),
			skimAround("skim-around"),
			skimButton("start", "Start")),
		pe.P(el.El(el.Small, el.Attr(el.ID, "skim-status"))),
		// The stage: the piece being shown, between the pieces before and
		// after it (above and below on a narrow screen), how far it has
		// gone, the settings, and the controls, under the thumb. Tapping
		// the view pauses, and swiping it goes back or forward a sentence.
		el.El(el.Section,
			el.Attr(el.ID, "skim-stage"),
			el.Attr(el.AttrName("hidden"), ""),
			el.Attr(el.AttrName("aria-label"), "skim"),
			el.El(el.Small, el.Attr(el.ID, "skim-note")),
			el.El(el.Div,
				el.Attr(el.Class, "skim-view"),
				el.El(el.Div, el.Attr(el.ID, "skim-prev"), el.Attr(el.AttrName("aria-hidden"), "true")),
				el.El(el.Div, el.Attr(el.ID, "skim-word")),
				el.El(el.Div, el.Attr(el.ID, "skim-next"), el.Attr(el.AttrName("aria-hidden"), "true"))),
			el.El(el.Tag("progress"), el.Attr(el.ID, "skim-progress"), el.Attr(el.Value, "0"), el.Attr(el.AttrName("max"), "1")),
			el.El(el.Div,
				el.Attr(el.Class, "skim-settings"),
				skimSpeed("skim-speed", ""),
				skimAround("skim-around-stage")),
			el.El(el.Div,
				el.Attr(el.Class, "skim-controls"),
				skimButton("back", "«", outline, el.Attr(el.AttrName("aria-label"), "back a sentence")),
				skimButton("toggle", "Pause"),
				skimButton("forward", "»", outline, el.Attr(el.AttrName("aria-label"), "forward a sentence")),
				skimButton("close", "Close", el.Attr(el.Class, "secondary outline")))),
		el.El(el.Div, el.Attr(el.ID, "skim-out")),
		el.El(el.Script,
			el.Attr(el.ID, "skim-data"),
			el.Attr(el.Type, "text/plain"),
			el.Attr(el.AttrName("data-wasm"), previewWasmPath),
			el.Attr(el.AttrName("data-files"), strings.Join(st.previewFiles(), "\n"))),
		pe.Script(skimJSPath),
	)
}
