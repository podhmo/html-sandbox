///|
test "render resolves links as the site does" {
  assert_eq(
    @preview.render(
      "[x](2026-01-02-hello.md) [y](../TODO.md) [z](missing.md)", "posts/2026-01-02-hello.md\nTODO.md",
    ),
    "<article><p><a href=\"/posts/hello\">x</a> <a href=\"/docs/TODO\">y</a> <a href=\"https://github.com/podhmo/html-sandbox/blob/main/posts/missing.md\">z</a></p></article>",
  )
}

///|
test "render reads front matter and anchors headings" {
  assert_eq(
    @preview.render("---\ntitle: T & U\n---\nBody", ""),
    "<article><h1 id=\"t--u\">T &amp; U<a class=\"heading-permalink\" href=\"#t--u\" aria-label=\"permalink\"> #</a></h1><p>Body</p></article>",
  )
}
