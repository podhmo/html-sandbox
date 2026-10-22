///|
/// base_url is the public origin the site was loaded with.
let base_url : Ref[String] = Ref("")

///|
/// post_files and doc_files hold the content the host
/// (../../../cloudflare/worker.mjs) loaded from Static Assets, as pairs of
/// the name and the file: post names are relative to the repository's
/// posts/, and doc names are paths from the repository root.
let post_files : Ref[Array[(String, String)]] = Ref([])

///|
let doc_files : Ref[Array[(String, String)]] = Ref([])

///|
/// site is the content being served, loaded on the first request (and
/// again if BASE_URL changes), or why it could not be.
let site : Ref[Result[@site.Site, String]?] = Ref(None)

///|
/// put replaces the file named name, or adds it: the host may load the
/// files again after a failure.
fn put(
  files : Ref[Array[(String, String)]],
  name : String,
  content : String,
) -> Unit {
  for i in 0..<files.val.length() {
    if files.val[i].0 == name {
      files.val[i] = (name, content)
      return
    }
  }
  files.val.push((name, content))
}

///|
/// file takes the file the host wrote at address 0, n bytes long, as
/// "name \t content", where name is its path in the Static Assets
/// directory: posts/... for the blog's posts, docs/... for the repository's
/// documents. It returns 0, or the length of an error message written at
/// address 0. The host calls it for every file before the first request.
pub fn file(n : Int32) -> Int32 {
  let (name, src) = @wasm.read_file(n) catch {
    e => return @wasm.write_error("\{e}")
  }
  if name.has_prefix("posts/") {
    put(post_files, name[6:].to_owned(), src)
  } else if name.has_prefix("docs/") {
    put(doc_files, name[5:].to_owned(), src)
  } else {
    return @wasm.write_error("\{name}: want a path under posts/ or docs/")
  }
  0
}

///|
/// load returns the site for base, loading it on first use.
fn load(base : String) -> Result[@site.Site, String] {
  match site.val {
    Some(s) if base == base_url.val => s
    _ => {
      base_url.val = base
      let s = Ok(load_site(base)) catch { e => Err("\{e}") }
      site.val = Some(s)
      s
    }
  }
}

///|
/// load_site builds the site from the files the host passed to file.
fn load_site(base : String) -> @site.Site raise @site.LoadError {
  if post_files.val.is_empty() && doc_files.val.is_empty() {
    raise @site.LoadError(
      message="no content loaded: the host must call file for each asset",
    )
  }
  @site.Site(
    base_url=base,
    posts=@site.load_posts(ReadOnlyArray::from_array(post_files.val)),
    docs=@site.load_docs(ReadOnlyArray::from_array(doc_files.val)),
  )
}

///|
/// answer answers req with the site for the BASE_URL
/// variable. If the content cannot be loaded, every request gets
/// a 500 saying why.
fn answer(req : @http.Request) -> @http.Response {
  match load(req.env.get("BASE_URL").unwrap_or("")) {
    Err(msg) => @http.Response::text(500, "\{msg}\n")
    Ok(s) => s.handle(req)
  }
}

///|
/// serve answers the request the host (../../../pkg/http/wasm/adapter.mjs)
/// wrote at address 0 of the memory, n bytes long, and writes the response
/// over it, returning its length; see the http/wasm package for the format.
pub fn serve(n : Int32) -> Int32 {
  @wasm.handle(n, answer)
}
