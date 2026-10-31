// The preview page: an editor that renders Markdown the way the site
// renders it, for checking a post or document before it is written. The
// rendering runs in the browser (examples/blog/preview); the page only
// hands it the list of the site's files, so links resolve as they would
// for the file the text is meant to become.

///|
/// preview_source is the repository path the previewed text stands in
/// for: relative links resolve as if it were a file posts/preview.md.
const PREVIEW_SOURCE = "posts/preview.md"

///|
/// Site::preview_files is the list of the site's files as repository
/// paths — each post's or document's face and every bundle member — in
/// the order the site holds them. The preview page hands it to the
/// browser's renderer.
fn Site::preview_files(self : Site) -> Array[String] {
  let files = []
  for p in self.posts {
    files.push(p.source())
    for m in p.members {
      files.push(m.source)
    }
  }
  for d in self.docs {
    files.push(d.source)
    for m in d.members {
      files.push(m.source)
    }
  }
  files
}

///|
/// preview_url is the URL the site serves the repository file at, as
/// Site::page_url answers it — derived from the path alone, since the
/// renderer knows only the files' names. Anything the site could not
/// serve (a post file not named like one, a member in a subdirectory, a
/// file outside the documents' roots) is not a URL.
fn preview_url(source : String) -> String? {
  let collection = if source.has_prefix("slops/") { "slops" } else { "posts" }
  if source.strip_prefix("\{collection}/") is Some(name) {
    let (dir, file) = match name.find("/") {
      None => (name, None)
      Some(i) => (name[:i], Some(name[i + 1:]))
    }
    if file is Some(f) && f.contains("/") {
      return None
    }
    guard post_name(dir.to_owned()) is Some((_, slug)) else { return None }
    match file {
      None => Some("/\{collection}/\{slug}")
      Some(f) => Some("/\{collection}/\{slug}/\{f}")
    }
  } else {
    // The documents live at doc_sources: TODO.md and everything under
    // docs/. A bundle member's URL is its name under the bundle's page.
    match source.find(".md/") {
      Some(i) => {
        let dir = source[:i + 3].to_owned()
        let file = source[i + 4:]
        if !is_doc(dir) || file.contains("/") {
          return None
        }
        Some("/docs/\{doc_path(dir)}/\{file}")
      }
      None =>
        if is_doc(source) && source.has_suffix(".md") {
          Some("/docs/\{doc_path(source)}")
        } else {
          None
        }
    }
  }
}

///|
/// is_doc reports whether source lies in the documents' roots — TODO.md
/// or under docs/ — as doc_sources lists them.
fn is_doc(source : String) -> Bool {
  doc_sources.contains(source) ||
  doc_sources.iter().any(root => source.has_prefix("\{root}/"))
}

///|
/// doc_path is a document's path under /docs/: its file path without
/// "docs/" and ".md", as Doc.path has it.
fn doc_path(source : String) -> String {
  let p = source.strip_suffix(".md").unwrap_or(source)
  p.strip_prefix("docs/").unwrap_or(p).to_owned()
}

///|
/// preview_linker is the linker of PREVIEW_SOURCE: a relative URL
/// resolves to the page files says the repository file is served at, and
/// everything else resolves as the site's linker resolves it.
fn preview_linker(files : Array[String]) -> Linker {
  let urls = Map([])
  for f in files {
    if preview_url(f) is Some(u) {
      urls[f] = escape(u, fragment=false)
    }
  }
  resolve(p => urls.get(p), PREVIEW_SOURCE, repo_files=true)
}

///|
/// preview renders src — the content of a Markdown file — as the article
/// of the post page it would become: front matter is read and its title
/// becomes the h1 when the body has no heading. files is the site's file
/// list as Site::preview_files makes it, so links resolve as on the site.
/// Front matter that cannot be read renders as ordinary Markdown.
pub fn preview(src : String, files : Array[String]) -> @el.Node {
  let (meta, body) = @tinyfrontmatter.split(src) catch { _ => (None, src) }
  let meta = meta.unwrap_or(Map([]))
  let doc = @tinymarkdown.parse(body)
  let link = preview_linker(files)
  let gen = AnchorIds::new()
  let children = []
  if first_title(doc) is None {
    let title = match meta {
      { "title": t, .. } if t != "" => t
      _ => ""
    }
    // A page's title is always non-empty; the editor's may be missing,
    // and an empty heading anchors as "sec", so there is no h1 then.
    if title != "" {
      children.push(
        heading(
          1,
          gen.id(plain_text(title)),
          render_inlines(@tinymarkdown.inlines(title), link),
        ),
      )
    }
  }
  children.push_iter(render_document(doc, link, gen).iter())
  @picoel.article(children)
}

///|
/// Site::preview_page is the editor page: the textarea preview-src is
/// rendered into preview-out by preview.js, which reads the renderer's
/// URL and the site's file list from preview-data's data-* attributes
/// (attribute values are escaped when written, so a file's name cannot
/// inject markup).
fn Site::preview_page(self : Site) -> @el.Node {
  let meta = PageMeta::{
    title: "Preview",
    description: "Markdown rendered the way this site renders it. Nothing is saved.",
    url: "\{self.base_url}/preview",
    type_: "website",
  }
  layout(meta, [
    @picoel.h1([@picoel.text("Preview")]),
    @picoel.p([
      @picoel.text(
        "Markdown rendered the way this site renders it. Nothing is saved.",
      ),
    ]),
    @picoel.p([
      @el.el(@el.input, [
        @el.Attr(@el.type_attr, "file"),
        @el.Attr(@el.id, "preview-file"),
        @el.Attr(@el.AttrName("accept"), ".md,text/markdown,text/plain"),
        @el.Attr(@el.AttrName("aria-label"), "load a Markdown file"),
      ]),
      @el.el(@el.small, [@el.Attr(@el.id, "preview-engine")]),
    ]),
    @el.el(@el.div, [
      @el.Attr(@el.class, "preview-grid"),
      @el.el(@el.Tag("textarea"), [
        @el.Attr(@el.id, "preview-src"),
        @el.Attr(@el.AttrName("rows"), "24"),
        @el.Attr(@el.AttrName("aria-label"), "Markdown source"),
        @picoel.text(preview_sample),
      ]),
      @el.el(@el.div, [@el.Attr(@el.id, "preview-out")]),
    ]),
    @el.el(@el.script, [
      @el.Attr(@el.id, "preview-data"),
      @el.Attr(@el.type_attr, "text/plain"),
      @el.Attr(
        @el.AttrName("data-wasm"),
        "/preview.wasm?v=\{@assets.preview_wasm_version}",
      ),
      @el.Attr(@el.AttrName("data-files"), self.preview_files().join("\n")),
    ]),
    @picoel.script(preview_js_path()),
  ])
}

///|
/// preview_js_path carries a hash of preview.js, like site_css_path.
fn preview_js_path() -> String {
  "/preview.js?v=\{@assets.preview_js_version}"
}

///|
/// preview_sample is what the editor starts with: a short post showing
/// what the renderer does.
let preview_sample : String =
  #|# Sample
  #|
  #|Text with `code` and a [link](https://example.com).
  #|
  #|- one
  #|- two
  #|
  #|> [!NOTE]
  #|> An alert.
  #|
  #|| a | b |
  #|| - | - |
  #|| 1 | 2 |
  #|
  #|```js
  #|console.log("hi")
  #|```
