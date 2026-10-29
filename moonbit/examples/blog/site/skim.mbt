// The skim page: shows an article, or Markdown pasted into it, a few
// words at a time in the middle of the screen (RSVP). skim.js does the
// showing; the page hands it the site's pages to pick from and, for
// pasted text, the preview page's renderer. It shares nothing with the
// listen page but the way it is laid out.

///|
/// Site::skim_choices is the list of the pages to skim: a link to each
/// post's and document's page, named by its repository path, which
/// skim.js narrows by a fuzzy match on the path, with its title beside it.
fn Site::skim_choices(self : Site) -> @el.Node {
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

  let list = [@el.Attr(@el.id, "skim-files")]
  for p in self.posts {
    list.push(choice(p.source(), p.title, p.page_path()))
  }
  for d in self.docs {
    list.push(choice(d.source, d.title, d.page_path()))
  }
  @el.el(@el.ul, list)
}

///|
/// skim_button is one of the page's buttons; the attrs are added to it.
fn skim_button(
  name : String,
  label : String,
  attrs~ : Array[@el.Node] = [],
) -> @el.Node {
  @el.el(
    @el.Tag("button"),
    [
      @el.Attr(@el.type_attr, "button"),
      @el.Attr(@el.id, "skim-\{name}"),
      ..attrs,
      @picoel.text(label),
    ],
  )
}

///|
/// skim_speed is a slider for the speed, in characters a minute, with its
/// value shown after the label. The page has one to set before starting
/// and the stage one to change it while it runs; skim.js keeps them
/// alike.
fn skim_speed(id : String, label : String) -> @el.Node {
  @el.el(@el.Tag("label"), [
    @picoel.text(label),
    @el.el(@el.Tag("output"), [
      @el.Attr(@el.id, "\{id}-out"),
      @picoel.text("600"),
    ]),
    @picoel.text("/min"),
    @el.el(@el.input, [
      @el.Attr(@el.type_attr, "range"),
      @el.Attr(@el.id, id),
      @el.Attr(@el.AttrName("data-setting"), "cpm"),
      @el.Attr(@el.AttrName("min"), "300"),
      @el.Attr(@el.AttrName("max"), "1500"),
      @el.Attr(@el.AttrName("step"), "50"),
      @el.Attr(@el.value, "600"),
    ]),
  ])
}

///|
/// skim_around is a switch for showing the pieces before and after the
/// one being shown; like skim_speed, there is one on the page and one on
/// the stage.
fn skim_around(id : String) -> @el.Node {
  @el.el(@el.Tag("label"), [
    @el.el(@el.input, [
      @el.Attr(@el.type_attr, "checkbox"),
      @el.Attr(@el.AttrName("role"), "switch"),
      @el.Attr(@el.id, id),
      @el.Attr(@el.AttrName("data-setting"), "around"),
      @el.Attr(@el.AttrName("checked"), ""),
    ]),
    @picoel.text("Before and after"),
  ])
}

///|
/// Site::skim_page is the reader page: skim.js fills skim-out with the
/// picked page's articles, or with the Markdown in skim-src rendered by
/// the renderer at skim-data's data-wasm, and shows it piece by piece in
/// skim-stage, which covers the screen while it runs.
fn Site::skim_page(self : Site) -> @el.Node {
  let description = "Articles shown a few words at a time in the middle of the screen. The speed stays in this browser."
  let meta = PageMeta::{
    title: "Skim",
    description,
    url: "\{self.base_url}/skim",
    type_: "website",
  }
  let outline = @el.Attr(@el.class, "outline")
  layout(meta, [
    @picoel.h1([@picoel.text("Skim")]),
    @picoel.p([
      @picoel.text("\{description} Tap a paragraph to start from there."),
    ]),
    @el.el(@el.div, [
      @el.Attr(@el.class, "skim-picker"),
      @el.el(@el.input, [
        @el.Attr(@el.type_attr, "search"),
        @el.Attr(@el.id, "skim-pick"),
        @el.Attr(@el.AttrName("autocomplete"), "off"),
        @el.Attr(@el.AttrName("placeholder"), "file name, e.g. moonbit wasm"),
        @el.Attr(@el.AttrName("aria-label"), "the file to skim"),
      ]),
      self.skim_choices(),
    ]),
    @el.el(@el.Tag("details"), [
      @el.el(@el.Tag("summary"), [@picoel.text("Or paste Markdown")]),
      @el.el(@el.Tag("textarea"), [
        @el.Attr(@el.id, "skim-src"),
        @el.Attr(@el.AttrName("rows"), "8"),
        @el.Attr(@el.AttrName("aria-label"), "Markdown to skim"),
      ]),
    ]),
    @el.el(@el.div, [
      @el.Attr(@el.class, "grid"),
      skim_speed("skim-cpm", "Speed "),
      skim_around("skim-around"),
      skim_button("start", "Start"),
    ]),
    @picoel.p([@el.el(@el.small, [@el.Attr(@el.id, "skim-status")])]),
    // The stage: the piece being shown, between the pieces before and
    // after it (above and below on a narrow screen), how far it has gone,
    // the settings, and the controls, under the thumb. Tapping the view
    // pauses, and swiping it goes back or forward a sentence.
    @el.el(@el.section, [
      @el.Attr(@el.id, "skim-stage"),
      @el.Attr(@el.AttrName("hidden"), ""),
      @el.Attr(@el.AttrName("aria-label"), "skim"),
      @el.el(@el.small, [@el.Attr(@el.id, "skim-note")]),
      @el.el(@el.div, [
        @el.Attr(@el.class, "skim-view"),
        @el.el(@el.div, [
          @el.Attr(@el.id, "skim-prev"),
          @el.Attr(@el.AttrName("aria-hidden"), "true"),
        ]),
        @el.el(@el.div, [@el.Attr(@el.id, "skim-word")]),
        @el.el(@el.div, [
          @el.Attr(@el.id, "skim-next"),
          @el.Attr(@el.AttrName("aria-hidden"), "true"),
        ]),
      ]),
      @el.el(@el.Tag("progress"), [
        @el.Attr(@el.id, "skim-progress"),
        @el.Attr(@el.value, "0"),
        @el.Attr(@el.AttrName("max"), "1"),
      ]),
      @el.el(@el.div, [
        @el.Attr(@el.class, "skim-settings"),
        skim_speed("skim-speed", ""),
        skim_around("skim-around-stage"),
      ]),
      @el.el(@el.div, [
        @el.Attr(@el.class, "skim-controls"),
        skim_button("back", "«", attrs=[
          outline,
          @el.Attr(@el.AttrName("aria-label"), "back a sentence"),
        ]),
        skim_button("toggle", "Pause"),
        skim_button("forward", "»", attrs=[
          outline,
          @el.Attr(@el.AttrName("aria-label"), "forward a sentence"),
        ]),
        skim_button("close", "Close", attrs=[
          @el.Attr(@el.class, "secondary outline"),
        ]),
      ]),
    ]),
    @el.el(@el.div, [@el.Attr(@el.id, "skim-out")]),
    @el.el(@el.script, [
      @el.Attr(@el.id, "skim-data"),
      @el.Attr(@el.type_attr, "text/plain"),
      @el.Attr(
        @el.AttrName("data-wasm"),
        "/preview.wasm?v=\{@assets.preview_wasm_version}",
      ),
      @el.Attr(@el.AttrName("data-files"), self.preview_files().join("\n")),
    ]),
    @picoel.script(skim_js_path()),
  ])
}

///|
/// skim_js_path carries a hash of skim.js, like site_css_path.
fn skim_js_path() -> String {
  "/skim.js?v=\{@assets.skim_js_version}"
}
