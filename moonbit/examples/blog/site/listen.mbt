// The listen page: reads an article, or Markdown pasted into it, aloud
// with the browser's speech synthesis. listen.js does the reading; the
// page hands it the site's pages to pick from and, for pasted text, the
// preview page's renderer.

///|
/// Site::listen_choices is the list of the pages to read: a link to each
/// post's and document's page, named by its repository path, which
/// listen.js narrows by a fuzzy match on the path, with its title beside
/// it.
fn Site::listen_choices(self : Site) -> @el.Node {
  fn choice(source : String, title : String, href : String) -> @el.Node {
    @picoel.li([
      @el.el(@el.a, [
        @el.Attr(@el.href, href),
        @el.Attr(@el.AttrName("data-source"), source),
        @picoel.text(source),
      ]),
      @picoel.text(" "),
      @picoel.small([@picoel.text(plain_text(title))]),
    ])
  }

  let list = [@el.Attr(@el.id, "listen-files")]
  for p in self.posts {
    list.push(choice(p.source(), p.title, p.page_path()))
  }
  for d in self.docs {
    list.push(choice(d.source, d.title, d.page_path()))
  }
  @el.el(@el.ul, list)
}

///|
/// listen_knob is a slider for one of the speech's settings, with its
/// value shown beside its name.
fn listen_knob(
  name : String,
  label : String,
  min : String,
  max : String,
  step : String,
  value : String,
) -> @el.Node {
  let id = "listen-\{name}"
  @el.el(@el.Tag("label"), [
    @picoel.text("\{label} "),
    @el.el(@el.Tag("output"), [
      @el.Attr(@el.id, "\{id}-out"),
      @picoel.text(value),
    ]),
    @el.el(@el.input, [
      @el.Attr(@el.type_attr, "range"),
      @el.Attr(@el.id, id),
      @el.Attr(@el.AttrName("min"), min),
      @el.Attr(@el.AttrName("max"), max),
      @el.Attr(@el.AttrName("step"), step),
      @el.Attr(@el.value, value),
    ]),
  ])
}

///|
/// listen_button is one of the player's buttons.
fn listen_button(name : String, label : String) -> @el.Node {
  @el.el(@el.Tag("button"), [
    @el.Attr(@el.type_attr, "button"),
    @el.Attr(@el.id, "listen-\{name}"),
    @picoel.text(label),
  ])
}

///|
/// Site::listen_page is the player page: listen.js fills listen-out with
/// the picked page's articles, or with the Markdown in listen-src rendered
/// by the renderer at listen-data's data-wasm, and reads it aloud.
fn Site::listen_page(self : Site) -> @el.Node {
  let description = "Articles read aloud by your browser's speech synthesis. Nothing is saved."
  let meta = PageMeta::{
    title: "Listen",
    description,
    url: "\{self.base_url}/listen",
    type_: "website",
  }
  layout(meta, [
    @picoel.h1([@picoel.text("Listen")]),
    @picoel.p([
      @picoel.text("\{description} Click a paragraph to read from there."),
    ]),
    @el.el(@el.div, [
      @el.Attr(@el.class, "listen-picker"),
      @el.el(@el.input, [
        @el.Attr(@el.type_attr, "search"),
        @el.Attr(@el.id, "listen-pick"),
        @el.Attr(@el.AttrName("autocomplete"), "off"),
        @el.Attr(@el.AttrName("placeholder"), "file name, e.g. moonbit wasm"),
        @el.Attr(@el.AttrName("aria-label"), "the file to read"),
      ]),
      self.listen_choices(),
    ]),
    @el.el(@el.Tag("details"), [
      @el.el(@el.Tag("summary"), [@picoel.text("Or paste Markdown")]),
      @el.el(@el.Tag("textarea"), [
        @el.Attr(@el.id, "listen-src"),
        @el.Attr(@el.AttrName("rows"), "8"),
        @el.Attr(@el.AttrName("aria-label"), "Markdown to read"),
      ]),
    ]),
    @el.el(@el.div, [
      @el.Attr(@el.AttrName("role"), "group"),
      listen_button("play", "Play"),
      listen_button("pause", "Pause"),
      listen_button("stop", "Stop"),
    ]),
    @el.el(@el.div, [
      @el.Attr(@el.class, "grid"),
      @el.el(@el.Tag("label"), [
        @picoel.text("Voice"),
        @el.el(@el.Tag("select"), [@el.Attr(@el.id, "listen-voice")]),
      ]),
      listen_knob("rate", "Rate", "0.5", "3", "0.1", "1"),
      listen_knob("pitch", "Pitch", "0", "2", "0.1", "1"),
      listen_knob("volume", "Volume", "0", "1", "0.05", "1"),
    ]),
    @picoel.p([@el.el(@el.small, [@el.Attr(@el.id, "listen-status")])]),
    @el.el(@el.div, [@el.Attr(@el.id, "listen-out")]),
    @el.el(@el.script, [
      @el.Attr(@el.id, "listen-data"),
      @el.Attr(@el.type_attr, "text/plain"),
      @el.Attr(
        @el.AttrName("data-wasm"),
        "/preview.wasm?v=\{@assets.preview_wasm_version}",
      ),
      @el.Attr(@el.AttrName("data-files"), self.preview_files().join("\n")),
    ]),
    @picoel.script(listen_js_path()),
  ])
}

///|
/// listen_js_path carries a hash of listen.js, like site_css_path.
fn listen_js_path() -> String {
  "/listen.js?v=\{@assets.listen_js_version}"
}
