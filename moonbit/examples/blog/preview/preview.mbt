// The browser renderer of the preview page: the site's own rendering
// (@site.preview), exported for Wasm (with js-string builtins) and JS, as
// experiments/browser-render proved the load. src is the content of a
// Markdown file; files is the site's file list separated by "\n", as the
// preview page's preview-data embeds it.

///|
/// render turns src into the article of the page it would become, as an
/// HTML fragment, for the browser to call.
pub fn render(src : String, files : String) -> String {
  let list = []
  for f in files.split("\n") {
    if f != "" {
      list.push(f.to_owned())
    }
  }
  @el.render_html(@site.preview(src, list))
}
