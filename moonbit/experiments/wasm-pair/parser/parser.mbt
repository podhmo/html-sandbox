// The first Wasm: Markdown to the tree of tinymarkdown, as JSON text. JSON
// is what crosses between the two Wasm modules (and over postMessage), as
// MoonBit's values cannot be shared between modules built apart.

///|
/// parse reads md and writes its blocks as JSON, with the inline Markdown
/// already split into text, code spans and links.
pub fn parse(md : String) -> String {
  Json::array(@tinymarkdown.parse(md).children.map(block)).stringify()
}

///|
fn block(b : @tinymarkdown.Block) -> Json {
  match b {
    Section(level~, title~, children~) =>
      {
        "t": "section",
        "level": Json(level),
        "title": inlines(title),
        "children": Json::array(children.map(block)),
      }
    Paragraph(text) => { "t": "p", "text": inlines(text) }
    List(list) => { "t": "list", "list": item_list(list) }
    Quote(children) =>
      { "t": "quote", "children": Json::array(children.map(block)) }
    Alert(kind~, children~) =>
      {
        "t": "alert",
        "kind": Json(kind.name()),
        "children": Json::array(children.map(block)),
      }
    Table(header~, rows~) =>
      {
        "t": "table",
        "header": Json::array(header.map(inlines)),
        "rows": Json::array(rows.map(r => Json::array(r.map(inlines)))),
      }
    CodeBlock(code, ..) => { "t": "code", "text": Json(code) }
    Details(summary~, children~) =>
      {
        "t": "details",
        "summary": match summary {
          Some(s) => inlines(s)
          None => Json::null()
        },
        "children": Json::array(children.map(block)),
      }
  }
}

///|
/// item_list is the JSON shape of an ItemList: kind and items, with
/// start added when the list is ordered.
fn item_list(list : @tinymarkdown.ItemList) -> Json {
  let items = Json::array(list.items.map(item))
  match list.kind {
    Bullet => { "kind": "bullet", "items": items }
    Ordered(start~) =>
      { "kind": "ordered", "start": Json(start), "items": items }
  }
}

///|
fn item(it : @tinymarkdown.Item) -> Json {
  {
    "text": inlines(it.text),
    "children": match it.children {
      Some(children) => item_list(children)
      None => Json::null()
    },
  }
}

///|
fn inlines(s : String) -> Json {
  Json::array(@tinymarkdown.inlines(s).map(inline))
}

///|
fn inline(i : @tinymarkdown.Inline) -> Json {
  match i {
    Text(s) => { "t": "text", "s": Json(s) }
    Code(s) => { "t": "code", "s": Json(s) }
    Footnote(label) => { "t": "footnote", "label": Json(label) }
    Link(children~, url~) =>
      {
        "t": "link",
        "url": Json(url),
        "children": Json::array(children.map(inline)),
      }
  }
}
