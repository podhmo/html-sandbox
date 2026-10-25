// The prev/next navigation: a port of the Go blog's nav.go.

///|
/// NavItem is a "prev" or "next" navigation link read from front matter:
/// the label's inlines and, when the written URL may be linked, the href
/// it resolved to.
pub struct NavItem {
  label : Array[@tinymarkdown.Inline]
  href : String // "" when the label is shown as text without a link
}

///|
/// Site::nav_item resolves the value of a prev or next key written in the
/// file at source. The value is a single Markdown link "[text](url)" or a
/// single bare URL; anything else, and any URL the page linker refuses, is
/// shown as text without a link. For a bare URL the label is the title of
/// the page it points to, or the URL itself when it does not point at a
/// page of this site.
fn Site::nav_item(self : Site, source : String, value : String) -> NavItem? {
  if value == "" {
    return None
  }
  let ins = @tinymarkdown.inlines(value)
  let (label, raw) = match ins {
    [Link(children~, url~)] => (Some(children), url)
    [Text(t)] if !t.contains_any(chars=" \t\n") => (None, t)
    // Not a single link nor a single URL: show the value as text.
    _ => return Some({ label: [Text(value)], href: "", })
  }
  // An empty label ("[](url)") is filled like a bare URL's.
  let label = if label is Some([]) { None } else { label }
  let raw = raw
  match self.page_linker(source)(raw) {
    None => {
      // The URL must not be linked; like a refused link in the body,
      // only its text is shown.
      let label = match label {
        Some(l) => l
        None => [Text(raw)]
      }
      Some({ label, href: "", })
    }
    Some(href) => {
      let label = match label {
        Some(l) => l
        None =>
          match self.page_title(href) {
            "" => [Text(raw)]
            t => @tinymarkdown.inlines(t)
          }
      }
      Some({ label, href, })
    }
  }
}

///|
/// Site::page_title returns the title of the post or document at href, a
/// URL that page_linker resolved, or "" when it is not a page of this
/// site.
fn Site::page_title(self : Site, href : String) -> String {
  let p = match href.find("?") {
    Some(i) => href[:i].to_owned()
    None => href
  }
  let p = match p.find("#") {
    Some(i) => p[:i].to_owned()
    None => p
  }
  if self.by_slug.get(p) is Some(post) {
    return post.title
  }
  match p {
    [.. "/docs/", .. path] =>
      match self.by_path.get(path.to_owned()) {
        Some(d) => d.title
        None => ""
      }
    _ => ""
  }
}
