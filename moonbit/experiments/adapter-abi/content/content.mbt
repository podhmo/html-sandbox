// The content the adapter spikes and the benchmarks serve: the posts and
// documents the build embeds, as the blog served them before the Worker
// began to load them from Static Assets. The spikes only need a Site, so
// this keeps each of them from importing the two generated packages.

///|
/// site serves the posts and documents embedded in the build. Spikes that
/// measure sizes and times use it as the blog's content.
pub fn site(base_url~ : String) -> @site.Site raise @site.LoadError {
  @site.Site(
    base_url~,
    posts=@site.load_posts(@posts.files),
    docs=@site.load_docs(@repodocs.files),
  )
}
