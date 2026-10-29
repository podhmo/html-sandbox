// The second Wasm: the JSON that ../parser writes, to an HTML fragment
// through picoel and el. It knows nothing of Markdown.

///|
/// render turns the blocks in json into HTML. Text goes through
/// @picoel.text, so the output is escaped; JSON it does not understand is
/// dropped.
pub fn render(json : String) -> String {
  let blocks = try @json.parse(json) catch {
    _ => []
  } noraise {
    Array(bs) => bs
    _ => []
  }
  @el.render_html(@picoel.article(blocks.filter_map(block)))
}

///|
fn block(j : Json) -> @el.Node? {
  match j {
    {
      "t": "section",
      "level": Number(level, ..),
      "title": t,
      "children": Array(cs),
      ..
    } => {
      let h = if level <= 1.0 {
        @picoel.h2(inlines(t))
      } else {
        @picoel.h3(inlines(t))
      }
      Some(@picoel.section([h, ..cs.filter_map(block)]))
    }
    { "t": "p", "text": t, .. } => Some(@picoel.p(inlines(t)))
    { "t": "list", "items": Array(items), .. } => Some(list(items))
    { "t": "quote", "children": Array(cs), .. } =>
      Some(@picoel.blockquote(cs.filter_map(block)))
    { "t": "alert", "kind": String(kind), "children": Array(cs), .. } =>
      Some(
        @el.el(@el.blockquote, [
          @el.Attr(@el.class, "markdown-alert markdown-alert-\{kind}"),
          @el.el(@el.p, [
            @el.Attr(@el.class, "markdown-alert-title"),
            @picoel.text(alert_title(kind)),
          ]),
          ..cs.filter_map(block),
        ]),
      )
    { "t": "table", "header": Array(h), "rows": Array(rows), .. } => {
      let cells = (row : Array[Json]) => row.map(inlines)
      let rows = rows.map(r => {
        match r {
          Array(r) => cells(r)
          _ => []
        }
      })
      Some(@picoel.table(cells(h), rows))
    }
    { "t": "code", "text": String(code), .. } => Some(@picoel.pre(code))
    {
      "t": "details",
      "summary": s,
      "children": Array(cs),
      ..
    } => {
      let body = cs.filter_map(block)
      let summary = inlines(s)
      if !summary.is_empty() {
        body.insert(0, @el.el(@el.Tag("summary"), summary))
      }
      Some(@el.el(@el.Tag("details"), body))
    }
    _ => None
  }
}

///|
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
fn list(items : Array[Json]) -> @el.Node {
  @picoel.list(
    items.map(it => {
      guard it is Object(it) else { return @picoel.li([]) }
      let li = inlines(it.get("text").unwrap_or(Json::null()))
      if it.get("children") is Some(Array(cs)) && !cs.is_empty() {
        li.push(list(cs))
      }
      @picoel.li(li)
    }),
  )
}

///|
fn inlines(j : Json) -> Array[@el.Node] {
  guard j is Array(ins) else { return [] }
  ins.filter_map(i => {
    match i {
      { "t": "text", "s": String(s), .. } => Some(@picoel.text(s))
      { "t": "code", "s": String(s), .. } => Some(@picoel.code(s))
      { "t": "link", "url": String(url), "children": cs, .. } =>
        Some(@picoel.a(url, inlines(cs)))
      _ => None
    }
  })
}
