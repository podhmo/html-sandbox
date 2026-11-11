///|
/// SiteState is the state of the content being served: Unloaded until the
/// first request, then Loaded with the base it was loaded under — loaded
/// again when the base changes — and either the site or why it could not
/// load.
priv enum SiteState {
  Unloaded
  Loaded(base~ : String, result~ : Result[@site.Site, String])
}

///|
let site_state : Ref[SiteState] = Ref(Unloaded)

///|
fn load(base : String) -> Result[@site.Site, String] {
  match site_state.val {
    Loaded(base=b, result=s) if b == base => s
    _ => {
      let s = Ok(@content.site(base_url=base)) catch { e => Err("\{e}") }
      site_state.val = Loaded(base~, result=s)
      s
    }
  }
}

///|
/// serve answers a request with JS strings in and out, returning the
/// response as "status\nname\tvalue\n...\n\n" followed by the body.
pub fn serve(
  base : String,
  verb : String,
  path : String,
  query : String,
) -> String {
  let res = match load(base) {
    Ok(s) => s.render(path, query~, verb~)
    Err(msg) => @http.Response::text(500, "\{msg}\n")
  }
  let head = StringBuilder()
  head.write_string("\{res.status}\n")
  for (name, value) in res.headers {
    head.write_string("\{name}\t\{value}\n")
  }
  head.write_char('\n')
  head.to_string() + res.body.text()
}
