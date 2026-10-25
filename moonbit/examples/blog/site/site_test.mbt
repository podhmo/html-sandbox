// Ported from the Go blog's posts_test.go and server_test.go, for the
// routes served so far: / and /posts/{slug}.

///|
let test_docs : ReadOnlyArray[(String, String)] = [
  (
    "TODO.md",
    (
      #|# TODO
      #|
      #|> note
      #|
      #|- [ ] **task**: first line
      #|  second line
      #|  - [x] child
    ),
  ),
  (
    "docs/ja/design.md",
    (
      #|# Design <x>
      #|
      #|why
      #|## Use `el`
      #|- run `go test`
      #|- ``a ` b``
    ),
  ),
  ("docs/notes.md", "no heading"),
  ("docs/image.svg", "<svg/>"),
]

///|
let test_posts : ReadOnlyArray[(String, String)] = [
  ("2026-10-01-old.md", "# Old post\nold body"),
  (
    "2026-10-14-hello.md",
    (
      #|# Hello <script>
      #|
      #|first
      #|## Points
      #|- one
      #|  - one.1
      #|- two
      #|```
      #|x := <1>
      #|```
    ),
  ),
]

///|
fn new_site(
  posts : ReadOnlyArray[(String, String)],
) -> @site.Site raise @site.LoadError {
  @site.Site(
    base_url="https://example.com",
    posts=@site.load_posts(posts),
    docs=@site.load_docs(test_docs),
  )
}

///|
/// embedded_site serves the posts and documents the build embedded, so
/// that the tests check that every file the Worker gets from Static Assets
/// loads.
fn embedded_site() -> @site.Site raise @site.LoadError {
  @site.Site(
    base_url="https://example.com",
    posts=[
      ..@site.load_posts(@posts.files),
      ..@site.load_posts(@slops.files, collection="slops"),
    ],
    docs=@site.load_docs(@repodocs.files),
  )
}

///|
fn header(res : @http.Response, name : String) -> String? {
  for (n, v) in res.headers {
    if n == name {
      return Some(v)
    }
  }
  None
}

///|
/// body returns the body of what s answers for path, failing unless the
/// status is want.
fn body(s : @site.Site, path : String, want~ : Int32 = 200) -> String raise {
  let res = s.render(path)
  assert_eq(res.status, want, msg="status of \{path}")
  res.body.text()
}

///|
fn assert_contains(body : String, wants : Array[String]) -> Unit raise {
  for want in wants {
    assert_true(body.contains(want), msg="body does not contain \{want}")
  }
}

///|
test "load posts" {
  let posts = @site.load_posts([
    ("2026-10-01-old.md", "# Old\nbody"),
    ("2026-10-14-hello.md", "intro\n# Hello\n## Sub\n# Second"),
    ("2026-10-14-another.md", "# Another"),
    ("README.txt", "ignored: not *.md"),
  ])
  assert_eq([ for p in posts => "\{p.date} \{p.slug} \{p.title}" ], [
    "2026-10-14 another Another", "2026-10-14 hello Hello", "2026-10-01 old Old",
  ])
}

///|
test "load posts errors" {
  let cases : Array[(String, ReadOnlyArray[(String, String)], String)] = [
    ("no date", [("hello.md", "# x")], "YYYY-MM-DD-slug.md"),
    ("no slug", [("2026-10-14.md", "# x")], "YYYY-MM-DD-slug.md"),
    ("uppercase slug", [("2026-10-14-Hello.md", "# x")], "YYYY-MM-DD-slug.md"),
    ("double dash", [("2026-10-14-a--b.md", "# x")], "YYYY-MM-DD-slug.md"),
    ("trailing dash", [("2026-10-14-a-.md", "# x")], "YYYY-MM-DD-slug.md"),
    ("invalid date", [("2026-13-01-x.md", "# x")], "month out of range"),
    ("invalid day", [("2026-02-29-x.md", "# x")], "day out of range"),
    (
      "duplicate slug",
      [("2026-10-01-same.md", "# a"), ("2026-10-14-same.md", "# b")],
      "slug \"same\" is already used",
    ),
    ("no title", [("2026-10-14-x.md", "## only h2")], "no title"),
    (
      "bad front matter",
      [("2026-10-14-x.md", "---\ntitle: x\n")],
      "2026-10-14-x.md: tinyfrontmatter: no closing",
    ),
    (
      "unknown front matter key",
      [("2026-10-14-x.md", "---\ntitel: x\n---\n# x")],
      "unknown front matter key \"titel\"",
    ),
  ]
  for (name, files, want) in cases {
    let msg = try @site.load_posts(files) catch {
      e => "\{e}"
    } noraise {
      _ => fail("\{name}: want an error")
    }
    assert_true(msg.contains(want), msg="\{name}: got \{msg}, want \{want}")
  }
}

///|
test "a leap day is a date" {
  let posts = @site.load_posts([("2028-02-29-leap.md", "# Leap")])
  assert_eq(posts[0].date, "2028-02-29")
}

///|
test "load posts front matter" {
  let cases = [
    ("from body", "intro\n# Heading\nfirst\nline\n\nsecond", "Heading", "intro"),
    (
      "paragraph inside a section", "# Heading\n## Sub\n- list\n\nnested\nline",
      "Heading", "nested line",
    ),
    ("no paragraph", "# Heading\n- only a list", "Heading", ""),
    (
      "front matter wins", "---\ntitle: FM title\ndescription: FM desc\n---\n# Heading\nbody",
      "FM title", "FM desc",
    ),
    (
      "front matter title without heading", "---\ntitle: Only FM\n---\nbody", "Only FM",
      "body",
    ),
    (
      "empty values fall back", "---\ntitle:\ndescription:\n---\n# Heading\nbody",
      "Heading", "body",
    ),
  ]
  for (name, src, title, description) in cases {
    let p = @site.load_posts([("2026-10-14-x.md", src)])[0]
    assert_eq((p.title, p.description), (title, description), msg=name)
  }
}

///|
test "list" {
  let res = new_site(test_posts).render("/posts/")
  assert_eq(res.status, 200)
  assert_eq(header(res, "content-type"), Some("text/html; charset=utf-8"))
  assert_true(res.body.text().has_prefix("<!doctype html>\n"))
  assert_true(
    res.body
    .text()
    .contains("<hgroup><h1>Posts</h1><p>blog by human</p></hgroup>"),
    msg="want the heading with its subtitle",
  )
  let hello = res.body.text().find("<a href=\"/posts/hello\">")
  let old = res.body.text().find("<a href=\"/posts/old\">")
  guard hello is Some(hello) && old is Some(old) && hello < old else {
    fail("want links to hello then old")
  }
  assert_false(
    res.body.text().contains("<script>"),
    msg="title must be escaped",
  )
}

///|
test "pico only" {
  let body = body(new_site(test_posts), "/posts/hello")
  let pico = body.find(
    "<link rel=\"stylesheet\" href=\"\{@picoel.STYLESHEET_URL}\">",
  )
  let site = body.find("<link rel=\"stylesheet\" href=\"/site.css?v=")
  guard pico is Some(pico) && site is Some(site) && pico < site else {
    fail("want pico, then site.css")
  }
  assert_eq(body.split("rel=\"stylesheet\"").count() - 1, 2)
  assert_false(body.contains("<style") || body.contains(" style="))
  assert_contains(body, [
    "<header class=\"container\">", "<main class=\"container\">", "<footer class=\"container\">",
    "<ul><li><a href=\"/preview\">preview</a></li><li><a href=\"https://github.com/podhmo/html-sandbox\">github</a></li></ul></nav></header>",
  ])
}

///|
test "post" {
  assert_contains(body(new_site(test_posts), "/posts/hello"), [
    "<title>Hello &lt;script&gt; - blog</title>", "<time datetime=\"2026-10-14\">2026-10-14</time>",
    "<section><h1 id=\"hello-script\">Hello &lt;script&gt;<a class=\"heading-permalink\" href=\"#hello-script\" aria-label=\"permalink\"> #</a></h1><p>first</p><section><h2 id=\"points\">Points<a class=\"heading-permalink\" href=\"#points\" aria-label=\"permalink\"> #</a></h2><ul><li>one<ul><li>one.1</li></ul></li><li>two</li></ul><pre><code>x := &lt;1&gt;</code></pre></section></section>",
  ])
}

///|
test "svg code block" {
  let s = new_site([
    (
      "2026-10-14-fig.md", "# Fig\n```svg\n<svg><rect/></svg>\n```\n```xml\n<svg/>\n```",
    ),
  ])
  let body = body(s, "/posts/fig")
  assert_true(
    body.contains("<svg><rect/></svg>"),
    msg="a ```svg block must render as markup, not a pre block",
  )
  assert_true(
    body.contains("<pre><code>&lt;svg/&gt;</code></pre>"),
    msg="a non-svg block must stay an escaped pre block",
  )
}

///|
test "not found pages" {
  let s = new_site(test_posts)
  assert_contains(body(s, "/posts/nope", want=404), [
    "<title>404 Not Found - blog</title>", "<h1>404 Not Found</h1><p>Post not found.</p>",
    "<a href=\"/\">Back to all posts</a>",
  ])
  assert_contains(body(s, "/nope", want=404), ["<p>Page not found.</p>"])
  assert_contains(body(s, "/a<b>&\"c'", want=404), ["<p>Page not found.</p>"])
}

///|
test "post page heading" {
  let s = new_site([
    (
      "2026-10-14-fm.md", "---\ntitle: From <FM>\ndescription: Short & sweet\n---\nbody",
    ),
    ("2026-10-14-both.md", "---\ntitle: FM title\n---\n# Body heading\nbody"),
  ])
  assert_contains(body(s, "/posts/fm"), [
    "<title>From &lt;FM&gt; - blog</title>", "<meta name=\"description\" content=\"Short &amp; sweet\">",
    "<h1 id=\"from-fm\">From &lt;FM&gt;<a class=\"heading-permalink\" href=\"#from-fm\" aria-label=\"permalink\"> #</a></h1><p>body</p>",
  ])
  let both = body(s, "/posts/both")
  assert_contains(both, [
    "<title>FM title - blog</title>", "<h1 id=\"body-heading\">Body heading<a class=\"heading-permalink\" href=\"#body-heading\" aria-label=\"permalink\"> #</a></h1>",
  ])
  assert_eq(both.split("<h1").count() - 1, 1)
}

///|
test "ogp" {
  let s = new_site([
    (
      "2026-10-14-hello.md", "---\ndescription: Say \"hi\" & more\n---\n# Hello\nbody",
    ),
  ])
  assert_contains(body(s, "/"), [
    "<title>blog</title>", "<meta property=\"og:title\" content=\"blog\">", "<meta property=\"og:type\" content=\"website\">",
    "<meta property=\"og:url\" content=\"https://example.com/\">", "<meta property=\"og:description\" content=\"Notes rendered with Wasm.\">",
    "<meta property=\"og:site_name\" content=\"blog\">",
  ])
  assert_contains(body(s, "/posts/hello"), [
    "<meta property=\"og:title\" content=\"Hello\">", "<meta property=\"og:type\" content=\"article\">",
    "<meta property=\"og:url\" content=\"https://example.com/posts/hello\">", "<meta property=\"og:description\" content=\"Say &#34;hi&#34; &amp; more\">",
  ])
  assert_false(body(s, "/nope", want=404).contains("og:"))
}

///|
test "base url" {
  let posts = @site.load_posts([("2026-10-14-x.md", "# x")])
  let cases = [
    ("https://example.com", "https://example.com/posts/x"),
    ("https://example.com/", "https://example.com/posts/x"),
    ("https://example.com/blog/", ""),
    ("http://localhost:8080", "http://localhost:8080/posts/x"),
    ("example.com", ""),
    ("ftp://example.com", ""),
    ("https://example.com/?q=1", ""),
    ("", ""),
  ]
  for (base_url, want) in cases {
    let s = @site.Site(base_url~, posts~, docs=[]) catch {
      LoadError(_) => {
        assert_eq(want, "", msg="\{base_url}: want no error")
        continue
      }
    }
    assert_true(want != "", msg="\{base_url}: want an error")
    assert_contains(body(s, "/posts/x"), [
      "<meta property=\"og:url\" content=\"\{want}\">",
    ])
  }
}

///|
test "tables and deep headings" {
  let s = new_site([
    (
      "2026-10-14-hello.md", "# Hello\n#### Four\n##### Five\n| a | `b` |\n| --- | --- |\n| [x](#x) | <i> |",
    ),
  ])
  assert_contains(body(s, "/posts/hello"), [
    [
      "<section><h4 id=\"four\">Four<a class=\"heading-permalink\" href=\"#four\" aria-label=\"permalink\"> #</a></h4><section><h5 id=\"five\">Five<a class=\"heading-permalink\" href=\"#five\" aria-label=\"permalink\"> #</a></h5>",
      "<div class=\"overflow-auto\"><table><thead><tr><th>a</th><th><code>b</code></th></tr></thead>",
      "<tbody><tr><td><a href=\"#x\">x</a></td><td>&lt;i&gt;</td></tr></tbody></table></div></section></section>",
    ].join(""),
  ])
}

///|
test "markdown in titles" {
  let s = new_site([
    (
      "2026-10-14-t.md", "# Put `x` on [Workers](https://example.com/)\nUse `go` and [docs](https://example.com/docs).",
    ),
    ("2026-10-13-fm.md", "---\ntitle: Run `go test`\n---\nbody"),
  ])
  assert_contains(body(s, "/posts/"), [
    "<a href=\"/posts/t\">Put <code>x</code> on Workers</a>", "<a href=\"/posts/fm\">Run <code>go test</code></a>",
  ])
  assert_contains(body(s, "/posts/t"), [
    "<title>Put x on Workers - blog</title>", "<meta property=\"og:title\" content=\"Put x on Workers\">",
    "<meta name=\"description\" content=\"Use go and docs.\">",
  ])
  assert_contains(body(s, "/posts/fm"), [
    "<title>Run go test - blog</title>", "<h1 id=\"run-go-test\">Run <code>go test</code><a class=\"heading-permalink\" href=\"#run-go-test\" aria-label=\"permalink\"> #</a></h1>",
  ])
}

///|
test "links in pages" {
  let s = new_site([
    (
      "2026-10-14-hello.md", "# Hello [`x`](https://x.test)\n\n- [design](../docs/ja/design.md)\n\n[bad](javascript:alert(1)) [ok](#a)",
    ),
  ])
  assert_contains(body(s, "/posts/hello"), [
    "<h1 id=\"hello-x\">Hello <a href=\"https://x.test\"><code>x</code></a><a class=\"heading-permalink\" href=\"#hello-x\" aria-label=\"permalink\"> #</a></h1>",
    "<li><a href=\"/docs/ja/design\">design</a></li>",
    // The URL holds "(" so this is no link at all.
     "<p>[bad](javascript:alert(1)) <a href=\"#a\">ok</a></p>",
  ])
  let s = new_site([
    (
      "2026-10-14-hello.md", "# Hello\n\n[bad](javascript:alert) and [up](../../x)",
    ),
  ])
  assert_contains(body(s, "/posts/hello"), ["<p>bad and up</p>"])
}

///|
test "the embedded posts and documents load" {
  let s = embedded_site()
  assert_contains(body(s, "/slops/"), ["<a href=\"/slops/hello\">"])
  assert_contains(body(s, "/slops/hello"), ["<h1 id=\"hello\">Hello"])
}

///|
test "two files for one document path" {
  let msg = try
    @site.load_docs([("TODO.md", "a"), ("docs/TODO.md", "b")])
  catch {
    e => "\{e}"
  } noraise {
    _ => fail("want an error for two files mapped to /docs/TODO")
  }
  assert_true(msg.contains("/docs/TODO is already used by TODO.md"), msg~)
}

///|
test "doc pages" {
  let s = new_site(test_posts)
  assert_contains(body(s, "/docs/"), [
    "<a href=\"/docs/TODO\">TODO</a>", "<a href=\"/docs/ja/design\">Design &lt;x&gt;</a>",
    "<p>docs/ja/design.md</p>",
  ])
  assert_contains(body(s, "/docs/TODO"), [
    "<li>[ ] **task**: first line\nsecond line<ul><li>[x] child</li></ul></li>",
    "<blockquote><p>note</p></blockquote>",
  ])
  assert_contains(body(s, "/docs/ja/design"), [
    "<h2 id=\"use-el\">Use <code>el</code><a class=\"heading-permalink\" href=\"#use-el\" aria-label=\"permalink\"> #</a></h2><ul><li>run <code>go test</code></li><li><code>a ` b</code></li></ul>",
    "<ul><li><small><a href=\"/docs/ja/design.md\" download=\"design.md\" class=\"secondary\">Download .md</a></small></li></ul></nav></header><article>",
  ])
  assert_contains(body(s, "/docs/notes"), [
    "<h1 id=\"docsnotesmd\">docs/notes.md<a class=\"heading-permalink\" href=\"#docsnotesmd\" aria-label=\"permalink\"> #</a></h1><p>no heading</p>",
  ])
  for p in ["/docs/nope", "/docs/image", "/docs/image.svg"] {
    assert_contains(body(s, p, want=404), ["Document not found."])
  }
}

///|
test "the embedded documents have pages" {
  let s = embedded_site()
  for p in ["/docs/TODO", "/docs/ja/design", "/docs/sketch/ja/blog"] {
    assert_true(body(s, p).contains("<article>"), msg=p)
  }
}

///|
test "post markdown" {
  let s = new_site(test_posts)
  let res = s.render("/posts/hello.md")
  assert_eq(res.status, 200)
  assert_eq(res.body.text(), test_posts[1].1)
  assert_eq(header(res, "content-type"), Some("text/markdown; charset=utf-8"))
  assert_eq(header(res, "x-content-type-options"), Some("nosniff"))
  assert_contains(body(s, "/posts/hello"), [
    "<header><nav><ul><li><time datetime=\"2026-10-14\">2026-10-14</time></li></ul><ul><li><small><a href=\"/posts/hello.md\" download=\"2026-10-14-hello.md\" class=\"secondary\">Download .md</a></small></li></ul></nav></header><article>",
  ])
}

///|
test "preview page" {
  let s = new_site(test_posts)
  assert_contains(body(s, "/preview"), [
    "<title>Preview - blog</title>", "<textarea id=\"preview-src\"", "<script id=\"preview-data\" type=\"text/plain\"",
    "data-wasm=\"/preview.wasm?v=", "data-files=\"", "posts/2026-10-14-hello.md",
    "TODO.md",
  ])
}

///|
test "doc markdown" {
  let s = new_site(test_posts)
  for
    (path, want) in [
      ("/docs/TODO.md", test_docs[0].1),
      ("/docs/ja/design.md", test_docs[1].1),
    ] {
    let res = s.render(path)
    assert_eq(res.status, 200, msg=path)
    assert_eq(res.body.text(), want, msg=path)
    assert_eq(
      header(res, "content-type"),
      Some("text/markdown; charset=utf-8"),
      msg=path,
    )
  }
  assert_contains(body(s, "/docs/nope.md", want=404), ["Document not found."])
}

///|
test "prev next nav" {
  let s = new_site([
    (
      "2026-10-01-old.md", "---\ntitle: Old post\nnext: 2026-10-14-hello.md\n---\nbody",
    ),
    (
      "2026-10-14-hello.md", "---\ntitle: Hello\nprev: [Go to old](2026-10-01-old.md)\nnext: ../docs/ja/design.md\n---\nbody",
    ),
  ])
  assert_contains(body(s, "/posts/hello"), [
    "</article><nav><ul><li><small>← Previous</small><br><a href=\"/posts/old\">Go to old</a></li></ul>",
    "<ul><li><small>Next →</small><br><a href=\"/docs/ja/design\">Design &lt;x&gt;</a></li></ul></nav>",
  ])
  assert_contains(body(s, "/posts/old"), [
    "</article><nav><ul></ul><ul><li><small>Next →</small><br><a href=\"/posts/hello\">Hello</a></li></ul></nav>",
  ])
}

///|
test "prev next nav text only" {
  let s = new_site([
    (
      "2026-10-14-hello.md", "---\ntitle: Hello\nprev: javascript:alert(1)\nnext: [a](x) [b](y)\n---\nbody",
    ),
  ])
  let b = body(s, "/posts/hello")
  assert_contains(b, [
    "<nav><ul><li><small>← Previous</small><br>javascript:alert(1)</li></ul>",
    "<ul><li><small>Next →</small><br>[a](x) [b](y)</li></ul></nav>",
  ])
  assert_false(b.contains("href=\"javascript:"))
}

///|
test "no prev next nav" {
  let b = body(new_site(test_posts), "/posts/hello")
  assert_false(b.contains("</article><nav>"))
}

///|
test "doc prev next nav" {
  let posts = @site.load_posts(test_posts)
  let docs = @site.load_docs([
    (
      "TODO.md", "---\nprev: posts/2026-10-01-old.md\nnext: [Design](docs/ja/design.md)\n---\n# TODO\n\n> note",
    ),
    ("docs/ja/design.md", "# Design <x>\n\nwhy\n## Use `el`\n- run `go test`"),
  ])
  let s = @site.Site(base_url="https://example.com", posts~, docs~)
  assert_contains(body(s, "/docs/TODO"), [
    "</article><nav><ul><li><small>← Previous</small><br><a href=\"/posts/old\">Old post</a></li></ul>",
    "<ul><li><small>Next →</small><br><a href=\"/docs/ja/design\">Design</a></li></ul></nav>",
  ])
}

///|
test "more not found pages" {
  let s = new_site(test_posts)
  let cases = [
    ("/posts/hello/extra", "Page not found."),
    ("/posts/nope.md", "Post not found."),
    ("/posts/hello/extra.md", "Page not found."),
  ]
  for (path, message) in cases {
    let res = s.render(path)
    assert_eq(res.status, 404, msg=path)
    assert_eq(header(res, "content-type"), Some("text/html; charset=utf-8"))
    assert_contains(res.body.text(), [
      "<h1>404 Not Found</h1>", message, "<a href=\"/\">Back to all posts</a>",
    ])
  }
}

///|
test "favicon and site.css" {
  let s = new_site(test_posts)
  let res = s.render("/favicon.svg")
  assert_eq(res.status, 200)
  assert_eq(header(res, "content-type"), Some("image/svg+xml"))
  assert_eq(header(res, "cache-control"), Some("public, max-age=86400"))
  assert_true(res.body.text().has_prefix("<svg"))
  let page = body(s, "/")
  guard page.find("/site.css?v=") is Some(i) else { fail("no site.css link") }
  let version = page[i + "/site.css?v=".length():i + "/site.css?v=".length() + 8]
  assert_true(version.iter().all(c => c is ('0'..<='9' | 'a'..<='f')))
  let res = s.render("/site.css", query="v=\{version}")
  assert_eq(res.status, 200)
  assert_eq(header(res, "content-type"), Some("text/css; charset=utf-8"))
  assert_eq(
    header(res, "cache-control"),
    Some("public, max-age=31536000, immutable"),
  )
  assert_true(res.body.text().contains("body > header"))
}

///|
test "methods other than GET and HEAD get the 404 page" {
  let s = new_site(test_posts)
  assert_eq(s.render("/", verb="HEAD").status, 200)
  for verb in ["POST", "PUT", "DELETE"] {
    let res = s.render("/posts/hello", verb~)
    assert_eq(res.status, 404, msg=verb)
    assert_contains(res.body.text(), [
      "<h1>404 Not Found</h1>", "Page not found.",
    ])
    // Even a path that would redirect.
    assert_eq(s.render("/docs", verb~).status, 404, msg=verb)
  }
}

///|
test "redirects" {
  let s = new_site(test_posts)
  let cases = [
    ("/docs", "", "/docs/"),
    ("/docs", "x=1", "/docs/?x=1"),
    ("//posts/hello", "", "/posts/hello"),
    ("/posts/../docs/", "", "/docs/"),
    ("/docs/ja/../TODO", "", "/docs/TODO"),
    ("/a b//", "", "/a%20b/"),
    ("/メモ//", "", "/%E3%83%A1%E3%83%A2/"),
    ("/docs", "a=\"<>", "/docs/?a=\"<>"),
  ]
  for (path, query, location) in cases {
    let res = s.render(path, query~)
    assert_eq(res.status, 307, msg=path)
    assert_eq(header(res, "location"), Some(location), msg=path)
    assert_eq(header(res, "content-type"), Some("text/html; charset=utf-8"))
    assert_eq(
      res.body.text(),
      "<a href=\"\{@el.render_html(@el.Text(location))}\">Temporary Redirect</a>.\n\n",
      msg=path,
    )
  }
}

///|
let test_bundle : ReadOnlyArray[(String, String)] = [
  ("2026-10-01-old.md", "# Old\nbody"),
  ("2026-10-22-bundle.md/README.md", "---\ntitle: Bundle\n---\nface body"),
  ("2026-10-22-bundle.md/00-memo.md", "# Memo\nmember body"),
  ("2026-10-22-bundle.md/diagram.svg", "<svg><rect/></svg>"),
  ("2026-10-22-bundle.md/hello.go", "package main\n\nfunc main() {}\n"),
]

///|
test "load post bundle" {
  let posts = @site.load_posts(test_bundle)
  let p = posts[0]
  assert_eq("\{p.date} \{p.slug} \{p.title}", "2026-10-22 bundle Bundle")
  assert_eq([ for m in p.members => m.name ], [
    "README.md", "00-memo.md", "diagram.svg", "hello.go",
  ])
  assert_eq([ for m in p.members => m.is_markdown ], [true, true, false, false])
  assert_eq([ for m in p.members => m.is_svg ], [false, false, true, false])
}

///|
test "load post bundle without README" {
  let posts = @site.load_posts([
    ("2026-10-22-b.md/02-extra.md", "---\ntitle: X\n---\nextra"),
    ("2026-10-22-b.md/00-face.md", "---\ntitle: Face\n---\nface"),
  ])
  let p = posts[0]
  assert_eq(p.title, "Face")
  assert_eq([ for m in p.members => m.name ], ["00-face.md", "02-extra.md"])
}

///|
test "load post bundle errors" {
  let cases : Array[(String, ReadOnlyArray[(String, String)], String)] = [
    (
      "subdirectory",
      [("2026-10-22-b.md/sub/f.md", "# x")],
      "is inside a subdirectory (bundles are flat)",
    ),
    (
      "face without title",
      [("2026-10-22-b.md/README.md", "## only h2")],
      "no title",
    ),
    (
      "slug clash with a file",
      [("2026-10-01-b.md", "# f"), ("2026-10-22-b.md/README.md", "# d")],
      "slug \"b\" is already used",
    ),
    (
      "bad front matter",
      [("2026-10-22-b.md/README.md", "---\ntitle: x\n")],
      "tinyfrontmatter: no closing",
    ),
  ]
  for (name, files, want) in cases {
    let msg = try @site.load_posts(files) catch {
      e => "\{e}"
    } noraise {
      _ => fail("\{name}: want an error")
    }
    assert_true(msg.contains(want), msg="\{name}: got \{msg}, want \{want}")
  }
}

///|
test "post bundle page and members" {
  let s = new_site(test_bundle)
  assert_contains(body(s, "/posts/bundle"), [
    "face body", "<h2 id=\"00-memomd\"><a href=\"/posts/bundle/00-memo.md\"><code>00-memo.md</code></a><a class=\"heading-permalink\" href=\"#00-memomd\" aria-label=\"permalink\"> #</a></h2>",
    "member body", "<h2 id=\"hellogo\"><a href=\"/posts/bundle/hello.go\"><code>hello.go</code></a><a class=\"heading-permalink\" href=\"#hellogo\" aria-label=\"permalink\"> #</a></h2>",
    "<pre><code>package main", "<h2 id=\"diagramsvg\"><a href=\"/posts/bundle/diagram.svg\"><code>diagram.svg</code></a><a class=\"heading-permalink\" href=\"#diagramsvg\" aria-label=\"permalink\"> #</a></h2>",
    "<img src=\"/posts/bundle/diagram.svg\" alt=\"diagram.svg\">",
  ])
  // The face is the page; its heading is not a member section.
  let page = body(s, "/posts/bundle")
  assert_false(
    page.contains(">README.md</code>"),
    msg="face must not be a member section",
  )
  // Members are served raw.
  let res = s.render("/posts/bundle/00-memo.md")
  assert_eq(res.status, 200)
  assert_eq(header(res, "content-type"), Some("text/markdown; charset=utf-8"))
  assert_eq(header(res, "x-content-type-options"), Some("nosniff"))
  assert_eq(res.body.text(), test_bundle[2].1)
  let res = s.render("/posts/bundle/diagram.svg")
  assert_eq(res.status, 200)
  assert_eq(header(res, "content-type"), Some("image/svg+xml"))
  assert_eq(res.body.text(), test_bundle[3].1)
  let res = s.render("/posts/bundle/hello.go")
  assert_eq(res.status, 200)
  assert_eq(header(res, "content-type"), Some("text/plain; charset=utf-8"))
  assert_eq(res.body.text(), test_bundle[4].1)
  let res = s.render("/posts/bundle/README.md")
  assert_eq(res.status, 200)
  assert_eq(res.body.text(), test_bundle[1].1)
  // Unknown member, or under a single-file post.
  assert_eq(s.render("/posts/bundle/nope.md").status, 404)
  assert_eq(s.render("/posts/old/x.md").status, 404)
}

///|
let test_doc_bundle : ReadOnlyArray[(String, String)] = [
  ("docs/guide.md/README.md", "---\ntitle: Guide\n---\nface body"),
  ("docs/guide.md/00-setup.md", "# Setup\nsetup body"),
  ("docs/guide.md/run.sh", "echo hi\n"),
]

///|
test "load doc bundle" {
  let s = @site.Site(
    base_url="https://example.com",
    posts=[],
    docs=@site.load_docs(test_doc_bundle),
  ) catch {
    e => fail("\{e}")
  }
  assert_contains(body(s, "/docs/guide"), [
    "face body", "<h2 id=\"00-setupmd\"><a href=\"/docs/guide/00-setup.md\"><code>00-setup.md</code></a><a class=\"heading-permalink\" href=\"#00-setupmd\" aria-label=\"permalink\"> #</a></h2>",
    "<h2 id=\"runsh\"><a href=\"/docs/guide/run.sh\"><code>run.sh</code></a><a class=\"heading-permalink\" href=\"#runsh\" aria-label=\"permalink\"> #</a></h2>",
    "<pre><code>echo hi",
  ])
  let res = s.render("/docs/guide/00-setup.md")
  assert_eq(res.status, 200)
  assert_eq(header(res, "content-type"), Some("text/markdown; charset=utf-8"))
  assert_eq(res.body.text(), test_doc_bundle[1].1)
  let res = s.render("/docs/guide/run.sh")
  assert_eq(res.status, 200)
  assert_eq(header(res, "content-type"), Some("text/plain; charset=utf-8"))
  // The face source keeps serving from /docs/guide.md.
  assert_eq(body(s, "/docs/guide.md"), test_doc_bundle[0].1)
  assert_eq(s.render("/docs/guide/nope").status, 404)
}

///|
test "doc bundle collides with a directory" {
  let msg = try
    @site.load_docs([
      ("docs/x.md/README.md", "# x"),
      ("docs/x/memo.md", "# memo"),
    ])
  catch {
    e => "\{e}"
  } noraise {
    _ => fail("want an error")
  }
  assert_true(msg.contains("collide"), msg="got \{msg}, want \"collide\"")
}

///|
test "doc bundle with non-markdown face" {
  let s = @site.Site(
    base_url="https://example.com",
    posts=[],
    docs=@site.load_docs([
      ("docs/x.md/00-run.sh", "echo hi\n"),
      ("docs/x.md/01-note.md", "# Note"),
    ]),
  ) catch {
    e => fail("\{e}")
  }
  let page = body(s, "/docs/x")
  assert_true(
    page.contains("<pre><code>echo hi"),
    msg="non-markdown face must render as a pre block",
  )
  assert_true(
    page.contains(
      "<h2 id=\"01-notemd\"><a href=\"/docs/x/01-note.md\"><code>01-note.md</code></a><a class=\"heading-permalink\" href=\"#01-notemd\" aria-label=\"permalink\"> #</a></h2>",
    ),
    msg="companion section missing",
  )
}

///|
test "README hoisting keeps member order" {
  let posts = @site.load_posts([
    ("2026-10-15-b.md/README.md", "---\ntitle: F\n---\nface"),
    ("2026-10-15-b.md/a.md", "# A"),
    ("2026-10-15-b.md/b.md", "# B"),
  ])
  assert_eq([ for m in posts[0].members => m.name ], [
    "README.md", "a.md", "b.md",
  ])
}

///|
fn load_docs_with_metadata(src : String?) -> Array[String] raise {
  let files = [
    ("TODO.md", "# TODO"),
    ("docs/develop.md", "# Develop"),
    ("docs/ja/design.md", "# Design"),
    ("docs/ja/layout.md", "# Layout"),
    ("docs/x.md/a.md", "# Bundle"),
  ]
  if src is Some(src) {
    files.push(("docs/blog.metadata.json", src))
  }
  [
    for d in @site.load_docs(ReadOnlyArray::from_array(files)) => d.source
  ]
}

///|
test "docs ordered by docs/blog.metadata.json" {
  let all = [
    "TODO.md", "docs/develop.md", "docs/ja/design.md", "docs/ja/layout.md", "docs/x.md",
  ]
  assert_eq(load_docs_with_metadata(None), all)
  assert_eq(load_docs_with_metadata(Some("{}")), all)
  assert_eq(
    load_docs_with_metadata(
      Some("{\"docs\": {\"head\": [\"docs/ja/layout.md\", \"docs/x.md\"]}}"),
    ),
    [
      "docs/ja/layout.md", "docs/x.md", "TODO.md", "docs/develop.md", "docs/ja/design.md",
    ],
  )
  assert_eq(
    load_docs_with_metadata(
      Some("{\"docs\": {\"tail\": [\"TODO.md\", \"docs/develop.md\"]}}"),
    ),
    [
      "docs/ja/design.md", "docs/ja/layout.md", "docs/x.md", "TODO.md", "docs/develop.md",
    ],
  )
  assert_eq(
    load_docs_with_metadata(
      Some(
        "{\"docs\": {\"head\": [\"docs/ja/design.md\"], \"tail\": [\"TODO.md\"]}}",
      ),
    ),
    [
      "docs/ja/design.md", "docs/develop.md", "docs/ja/layout.md", "docs/x.md", "TODO.md",
    ],
  )
}

///|
test "docs/blog.metadata.json errors" {
  let cases = [
    ("[]", "docs/blog.metadata.json: want a JSON object"),
    (
      "{\"doc\": {}}", "docs/blog.metadata.json: unknown key \"doc\" (want one of [docs])",
    ),
    ("{\"docs\": []}", "docs/blog.metadata.json: \"docs\" must be an object"),
    (
      "{\"docs\": {\"order\": []}}", "docs/blog.metadata.json: unknown key \"docs.order\" (want one of [head tail])",
    ),
    (
      "{\"docs\": {\"head\": \"TODO.md\"}}", "docs/blog.metadata.json: \"docs.head\" must be an array of strings",
    ),
    (
      "{\"docs\": {\"tail\": null}}", "docs/blog.metadata.json: \"docs.tail\" must be an array of strings",
    ),
    (
      "{\"docs\": {\"head\": [1]}}", "docs/blog.metadata.json: \"docs.head\" must be an array of strings",
    ),
    (
      "{\"docs\": {\"head\": [\"docs/missing.md\"]}}", "docs/blog.metadata.json: docs.head: \"docs/missing.md\" is not a document",
    ),
    (
      "{\"docs\": {\"tail\": [\"docs/x.md/a.md\"]}}", "docs/blog.metadata.json: docs.tail: \"docs/x.md/a.md\" is not a document",
    ),
    (
      "{\"docs\": {\"head\": [\"TODO.md\", \"TODO.md\"]}}", "docs/blog.metadata.json: docs.head: \"TODO.md\" is listed twice",
    ),
    (
      "{\"docs\": {\"head\": [\"TODO.md\"], \"tail\": [\"TODO.md\"]}}", "docs/blog.metadata.json: docs.tail: \"TODO.md\" is listed twice",
    ),
  ]
  for c in cases {
    let (src, want) = c
    let msg = try load_docs_with_metadata(Some(src)) catch {
      e => "\{e}"
    } noraise {
      _ => fail("\{src}: want an error")
    }
    assert_eq(msg, want, msg=src)
  }
  let msg = try load_docs_with_metadata(Some("{\"docs\": ")) catch {
    e => "\{e}"
  } noraise {
    _ => fail("want an error for broken JSON")
  }
  assert_true(msg.has_prefix("docs/blog.metadata.json: "), msg~)
}
