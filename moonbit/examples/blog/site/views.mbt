// The pages: a port of the Go blog's views.go.

///|
const SITE_NAME = "blog"

///|
const SITE_DESCRIPTION = "Notes rendered with Wasm."

///|
/// REPO_HOME_URL is the repository's top page, linked from the header.
const REPO_HOME_URL = "https://github.com/podhmo/html-sandbox"

///|
/// PageMeta describes a page for <head>. title and description may hold
/// inline Markdown, which layout reduces to plain text.
priv struct PageMeta {
  title : String // page title without the site name; empty for the top page
  description : String
  // url is the absolute URL of the page. OGP tags are written only when
  // it is set, so error pages have none.
  url : String
  type_ : String // OGP type: "website" or "article"
}

///|
/// site_css_path carries a hash of site.css, so browsers may cache it for
/// long and still pick up a new version right after a deploy.
fn site_css_path() -> String {
  "/site.css?v=\{@assets.site_css_version}"
}

///|
/// code_copy_js_path carries a hash of code-copy.js, like site_css_path.
fn code_copy_js_path() -> String {
  "/code-copy.js?v=\{@assets.code_copy_js_version}"
}

///|
/// layout is the frame shared by every page. The doctype is written by
/// Response::page.
fn layout(meta : PageMeta, body : Array[@el.Node]) -> @el.Node {
  let title = plain_text(meta.title)
  let description = plain_text(meta.description)
  let head = [
    @picoel.title(document_title(title)),
    @picoel.meta_name("description", content=description),
    ..ogp({ ..meta, title, description, }),
    @picoel.stylesheet(site_css_path()),
    @picoel.icon("/favicon.svg", mime_type="image/svg+xml"),
    @picoel.script(code_copy_js_path()),
  ]
  @picoel.document("ja", head~, [
    @picoel.header([
      @picoel.spread(
        [
          @picoel.a("/", [@picoel.text("slops")]),
          @picoel.a("/posts/", [@picoel.text("posts")]),
          @picoel.a("/docs/", [@picoel.text("docs")]),
        ],
        end=[
          @picoel.a("/preview", [@picoel.text("preview")]),
          @picoel.a(REPO_HOME_URL, [@picoel.text("github")]),
        ],
      ),
    ]),
    @picoel.main_(body),
    @picoel.footer([@picoel.small([@picoel.text("Rendered with Wasm.")])]),
  ])
}

///|
/// document_title is the <title> text: the page title followed by the site
/// name.
fn document_title(title : String) -> String {
  if title == "" {
    SITE_NAME
  } else {
    "\{title} - \{SITE_NAME}"
  }
}

///|
/// ogp returns Open Graph <meta> tags, or none when meta has no URL.
fn ogp(meta : PageMeta) -> Array[@el.Node] {
  if meta.url == "" {
    return []
  }
  [
    @picoel.meta_property(
      "og:title",
      content=if meta.title == "" { SITE_NAME } else { meta.title },
    ),
    @picoel.meta_property("og:type", content=meta.type_),
    @picoel.meta_property("og:url", content=meta.url),
    @picoel.meta_property("og:description", content=meta.description),
    @picoel.meta_property("og:site_name", content=SITE_NAME),
  ]
}

///|
/// post_list shows each post as a card: the title links to the post and
/// the date below it is muted by hgroup. Each collection identifies its authors.
fn Site::post_list(
  self : Site,
  collection~ : String = "posts",
  list_path~ : String = "/",
) -> @el.Node {
  let title = if collection == "slops" { "Slops" } else { "Posts" }
  let subtitle = if collection == "slops" {
    "blog by AI"
  } else {
    "blog by human"
  }
  let body = [
    @picoel.hgroup([
      @picoel.h1([@picoel.text(title)]),
      @picoel.p([@picoel.text(subtitle)]),
    ]),
  ]
  for p in self.posts {
    if p.collection != collection {
      continue
    }
    body.push(
      @picoel.article([
        @picoel.hgroup([
          @picoel.h2([@picoel.a(p.page_path(), linked_title(p.title))]),
          @picoel.p([@picoel.date(p.date)]),
        ]),
      ]),
    )
  }
  layout(
    {
      title: if list_path == "/" {
        ""
      } else {
        title
      },
      description: if list_path == "/" {
        SITE_DESCRIPTION
      } else {
        subtitle
      },
      url: "\{self.base_url}\{list_path}",
      type_: "website",
    },
    body,
  )
}

///|
fn Site::post_page(self : Site, p : Post) -> @el.Node {
  let link = self.linker(p.link_base())
  let gen = AnchorIds::new()
  let body = []
  if first_title(p.doc) is None {
    // The title came from front matter only, so the body has no heading.
    let id = gen.id(plain_text(p.title))
    body.push(
      heading(1, id, render_inlines(@tinymarkdown.inlines(p.title), link)),
    )
  }
  body.push_iter(render_face(link, p.members, p.doc, gen).iter())
  let meta = PageMeta::{
    title: p.title,
    description: p.description,
    url: "\{self.base_url}\{p.page_path()}",
    type_: "article",
  }
  let page = [
    page_header(@picoel.date(p.date), href=p.markdown_path(), filename=p.file),
    @picoel.article(body),
  ]
  for i = 1; i < p.members.length(); i = i + 1 {
    let m = p.members[i]
    page.push(member_section(self.linker(m.source), p.page_path(), m, gen))
  }
  match rel_nav(p.prev_nav, p.next_nav) {
    Some(nav) => page.push(nav)
    None => ()
  }
  layout(meta, page)
}

///|
/// doc_list links to every repository document, showing its file path
/// below the title.
fn Site::doc_list(self : Site) -> @el.Node {
  let body = [@picoel.h1([@picoel.text("Docs")])]
  for d in self.docs {
    body.push(
      @picoel.article([
        @picoel.hgroup([
          @picoel.h2([@picoel.a(d.page_path(), linked_title(d.title))]),
          @picoel.p([@picoel.text(d.source)]),
        ]),
      ]),
    )
  }
  let meta = PageMeta::{
    title: "Docs",
    description: "Documents of this repository.",
    url: "\{self.base_url}/docs/",
    type_: "website",
  }
  layout(meta, body)
}

///|
fn Site::doc_page(self : Site, d : Doc) -> @el.Node {
  let link = self.linker(d.link_base())
  let gen = AnchorIds::new()
  let body = []
  if first_title(d.doc) is None {
    let id = gen.id(plain_text(d.title))
    body.push(
      heading(1, id, render_inlines(@tinymarkdown.inlines(d.title), link)),
    )
  }
  body.push_iter(render_face(link, d.members, d.doc, gen).iter())
  let meta = PageMeta::{
    title: d.title,
    description: d.description,
    url: "\{self.base_url}\{d.page_path()}",
    type_: "article",
  }
  let page = [
    page_header(
      @picoel.small([@picoel.text(d.source)]),
      href=d.markdown_path(),
      filename=base(d.source),
    ),
    @picoel.article(body),
  ]
  for i = 1; i < d.members.length(); i = i + 1 {
    let m = d.members[i]
    page.push(member_section(self.linker(m.source), d.page_path(), m, gen))
  }
  match rel_nav(d.prev_nav, d.next_nav) {
    Some(nav) => page.push(nav)
    None => ()
  }
  layout(meta, page)
}

///|
/// render_face renders the page body: the face member's document, or its
/// raw text in a pre block when the face is not a Markdown file.
fn render_face(
  link : Linker,
  members : Array[Member],
  doc : @tinymarkdown.Document,
  gen : AnchorIds,
) -> Array[@el.Node] {
  if !members.is_empty() && !members[0].is_markdown {
    return [@picoel.pre(members[0].raw)]
  }
  render_blocks(doc.children, link, gen)
}

///|
/// member_section renders one member of a bundle below the face: an
/// article headed by its file name, which links to the raw file served
/// at <page>/<name>. A .md member renders as Markdown, an .svg member
/// shows as an image, and any other member is shown as a pre block.
fn member_section(
  link : Linker,
  base : String,
  m : Member,
  gen : AnchorIds,
) -> @el.Node {
  let id = gen.id(m.name)
  let body = [
    @el.el(@el.h2, [
      @el.Attr(@el.id, id),
      @picoel.a("\{base}/\{m.name}", [@picoel.code(m.name)]),
      permalink(id),
    ]),
  ]
  if m.is_markdown {
    body.push_iter(render_blocks(m.doc.children, link, gen).iter())
  } else if m.is_svg {
    body.push(
      @el.el(@el.img, [
        @el.Attr(@el.src, "\{base}/\{m.name}"),
        @el.Attr(@el.alt, m.name),
      ]),
    )
  } else {
    body.push(@picoel.pre(m.raw))
  }
  @picoel.article(body)
}

///|
/// rel_nav is the prev/next navigation below the article: prev on the
/// left and next on the right, split like the "Download .md" row above
/// it. A None item leaves its side empty; when both are None there is no
/// nav.
fn rel_nav(prev : NavItem?, next : NavItem?) -> @el.Node? {
  if prev is None && next is None {
    return None
  }
  let side = (heading : String, it : NavItem?) => {
    match it {
      None => @el.el(@el.ul, [])
      Some(it) => {
        let children = [
          @picoel.small([@picoel.text(heading)]),
          @el.el(@el.br, []),
        ]
        let label = render_inlines(it.label, no_links)
        if it.href != "" {
          children.push(@picoel.a(it.href, label))
        } else {
          children.push_iter(label.iter())
        }
        @el.el(@el.ul, [@el.el(@el.li, children)])
      }
    }
  }
  Some(@el.el(@el.nav, [side("← Previous", prev), side("Next →", next)]))
}

///|
/// no_links resolves no URL: a nav label renders its text only, since a
/// link cannot sit inside another link.
let no_links : Linker = _ => None

///|
fn Post::page_path(self : Post) -> String {
  "/\{self.collection}/\{self.slug}"
}

///|
/// Post::markdown_path is where the post's Markdown source is served.
fn Post::markdown_path(self : Post) -> String {
  "\{self.page_path()}.md"
}

///|
fn Doc::page_path(self : Doc) -> String {
  "/docs/\{self.path}"
}

///|
/// Doc::markdown_path is where the document's Markdown source is served.
fn Doc::markdown_path(self : Doc) -> String {
  "\{self.page_path()}.md"
}

///|
/// page_header is the row above the article: info on the left and, on the
/// right, a small link that downloads the page's Markdown source. It sits
/// in main rather than in the article, where pico would pad it into a
/// band.
fn page_header(info : @el.Node, href~ : String, filename~ : String) -> @el.Node {
  let download = @picoel.small([
    @picoel.download_link(href, filename~, [@picoel.text("Download .md")]),
  ])
  @picoel.inner_header([@picoel.spread([info], end=[download])])
}

///|
/// status_text is Go's http.StatusText for the statuses the site sends.
fn status_text(status : Int32) -> String {
  match status {
    404 => "Not Found"
    500 => "Internal Server Error"
    _ => ""
  }
}

///|
fn error_page(status : Int32, message : String) -> @el.Node {
  let title = "\{status} \{status_text(status)}"
  layout({ title, description: message, url: "", type_: "", }, [
    @picoel.h1([@picoel.text(title)]),
    @picoel.p([@picoel.text(message)]),
    @picoel.p([@picoel.a("/", [@picoel.text("Back to all posts")])]),
  ])
}

///|
/// heading returns the heading element of level anchored at id.
fn heading(level : Int32, id : String, children : Array[@el.Node]) -> @el.Node {
  let tag = match level {
    1 => @el.h1
    2 => @el.h2
    3 => @el.h3
    4 => @el.h4
    _ => @el.h5
  }
  @el.el(tag, [@el.Attr(@el.id, id), ..children, permalink(id)])
}

///|
/// render_blocks converts the Markdown tree into nodes. Every piece of text
/// goes through @picoel.text, so HTML in posts is escaped. link resolves
/// the URLs of links.
fn render_blocks(
  bs : Array[@tinymarkdown.Block],
  link : Linker,
  gen : AnchorIds,
) -> Array[@el.Node] {
  let inlines = (s : String) => render_inlines(@tinymarkdown.inlines(s), link)
  bs.map(b => {
    match b {
      Section(level~, title~, children~) => {
        let id = gen.id(plain_text(title))
        @picoel.section(
          [
            heading(level, id, inlines(title)),
            ..render_blocks(children, link, gen),
          ],
        )
      }
      Paragraph(text) => @picoel.p(inlines(text))
      List(items) => render_list(items, link)
      Quote(children) => @picoel.blockquote(render_blocks(children, link, gen))
      Alert(kind~, children~) =>
        @el.el(
          @el.blockquote,
          [
            @el.Attr(@el.class, "markdown-alert markdown-alert-\{kind}"),
            @el.el(@el.p, [
              @el.Attr(@el.class, "markdown-alert-title"),
              @picoel.text(alert_title(kind)),
            ]),
            ..render_blocks(children, link, gen),
          ],
        )
      Table(header~, rows~) => {
        let cells = (row : Array[String]) => [ for c in row => inlines(c) ]
        @picoel.table(cells(header), [ for r in rows => cells(r) ])
      }
      CodeBlock(code, info~) =>
        // A ```svg block is the image itself: its content is
        // author-controlled markup, so it may be written out raw.
        if info == "svg" {
          @el.Raw(code)
        } else {
          @picoel.pre(code)
        }
    }
  })
}

///|
/// alert_title is the heading text of an alert block — the kind with its
/// first letter capitalized, as GitHub writes it.
fn alert_title(kind : String) -> String {
  match kind {
    "note" => "Note"
    "tip" => "Tip"
    "important" => "Important"
    "warning" => "Warning"
    _ => "Caution"
  }
}

///|
/// render_list renders items as a list, with the children of an item as a
/// list inside its <li>.
fn render_list(items : Array[@tinymarkdown.Item], link : Linker) -> @el.Node {
  @picoel.list(
    items.map(it => {
      let li = render_inlines(@tinymarkdown.inlines(it.text), link)
      if !it.children.is_empty() {
        li.push(render_list(it.children, link))
      }
      @picoel.li(li)
    }),
  )
}

///|
/// linked_title renders a title written in Markdown inside the link to its
/// page. Links in the title show only their text, as links cannot nest.
fn linked_title(title : String) -> Array[@el.Node] {
  render_inlines(@tinymarkdown.inlines(title), no_links)
}

///|
/// plain_text drops the markup of inline Markdown: code spans and links
/// keep only their text. It is for places that hold no HTML, such as
/// <title>.
fn plain_text(s : String) -> String {
  let sb = StringBuilder()
  fn walk(ins : Array[@tinymarkdown.Inline]) {
    for i in ins {
      match i {
        Text(t) | Code(t) => sb.write_string(t)
        Link(children~, ..) => walk(children)
      }
    }
  }

  walk(@tinymarkdown.inlines(s))
  sb.to_string()
}

///|
/// render_inlines turns code spans into <code> and links into <a>; the
/// rest is text. A link whose URL link rejects shows only its text.
fn render_inlines(
  ins : Array[@tinymarkdown.Inline],
  link : Linker,
) -> Array[@el.Node] {
  let out = []
  for i in ins {
    match i {
      Text(t) => out.push(@picoel.text(t))
      Code(t) => out.push(@picoel.code(t))
      Link(children~, url~) => {
        let children = render_inlines(children, link)
        match link(url) {
          Some(href) => out.push(@picoel.a(href, children))
          None => out.push_iter(children.iter())
        }
      }
    }
  }
  out
}
