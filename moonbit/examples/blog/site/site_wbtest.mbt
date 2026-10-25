// Ported from the Go blog's links_test.go and server_test.go: the parts
// that reach into the site's internals.

///|
test "linker" {
  let s = Site(
    base_url="https://example.com",
    posts=load_posts([
      ("2026-10-01-old.md", "# Old post\nold body"),
      ("2026-10-14-hello.md", "# Hello"),
    ]),
    docs=load_docs([
      ("TODO.md", "# TODO"),
      ("docs/ja/design.md", "# Design"),
      ("docs/notes.md", "no heading"),
    ]),
  )
  let gh = "https://github.com/podhmo/html-sandbox/blob/main/"
  let hello = "posts/2026-10-14-hello.md"
  let cases = [
    ("TODO.md", "https://example.com/a?b#c", "https://example.com/a?b#c"),
    ("TODO.md", "HTTP://example.com", "HTTP://example.com"),
    ("TODO.md", "mailto:a@example.com", "mailto:a@example.com"),
    ("TODO.md", "javascript:alert(1)", ""),
    ("TODO.md", "JavaScript:alert(1)", ""),
    ("TODO.md", "data:text/html,x", ""),
    ("TODO.md", "//example.com/x", "//example.com/x"),
    ("TODO.md", "/posts/hello", "/posts/hello"),
    ("TODO.md", "#to-be-implemented", "#to-be-implemented"),
    ("TODO.md", "docs/ja/design.md", "/docs/ja/design"),
    ("TODO.md", "./docs/ja/design.md#why", "/docs/ja/design#why"),
    ("docs/ja/design.md", "../../TODO.md", "/docs/TODO"),
    ("docs/ja/design.md", "../notes.md", "/docs/notes"),
    ("TODO.md", "posts/2026-10-01-old.md", "/posts/old"),
    (hello, "2026-10-01-old.md", "/posts/old"),
    (hello, "../docs/ja/design.md", "/docs/ja/design"),
    (
      "TODO.md",
      ".claude/skills/todo-md/SKILL.md",
      "\{gh}.claude/skills/todo-md/SKILL.md",
    ),
    ("TODO.md", "go/pkg/el/el.go#L10", "\{gh}go/pkg/el/el.go#L10"),
    ("docs/ja/design.md", "../../go/pkg/", "\{gh}go/pkg"),
    ("TODO.md", "a b.md", "\{gh}a%20b.md"),
    ("TODO.md", "../outside.md", ""),
    ("docs/ja/design.md", "../../../x", ""),
    // Beyond the Go cases: escapes, queries, and URLs url.Parse rejects.
    ("TODO.md", "a%20b.md?x=1#y z", "\{gh}a%20b.md?x=1#y%20z"),
    (
      "TODO.md",
      "メモ.md#見出し",
      "\{gh}%E3%83%A1%E3%83%A2.md#%E8%A6%8B%E5%87%BA%E3%81%97",
    ),
    ("TODO.md", "docs/ja/design.md?x=1", "/docs/ja/design"),
    ("TODO.md", "a%2.md", ""),
    ("TODO.md", "1a:b", ""),
    ("TODO.md", ":x", ""),
    ("TODO.md", "a\u{7F}b", ""),
  ]
  for (source, url, want) in cases {
    let got = s.linker(source)(url).unwrap_or("")
    assert_eq(got, want, msg="\{source}: link \{url}")
  }
}

///|
test "post page text" {
  let posts = load_posts([
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
  ])
  let s = Site(base_url="https://example.com", posts~, docs=[])
  let got = @el.render_plain(s.post_page(posts[0]))
  assert_eq(
    got,
    (
      #|Hello <script> - blog
      #|slops
      #|posts
      #|docs
      #|preview
      #|github
      #|2026-10-14
      #|Download .md
      #|Hello <script>
      #|first
      #|Points
      #|one
      #|one.1
      #|two
      #|x := <1>
      #|Rendered with Wasm.
      #|
    ),
  )
}

///|
test "load docs" {
  let docs = load_docs([
    ("TODO.md", "# TODO\n\n> note"),
    ("docs/ja/design.md", "# Design <x>\n\nwhy"),
    ("docs/ja-old.md", "old"),
    ("docs/notes.md", "no heading"),
    ("docs/image.svg", "<svg/>"),
    ("README.md", "# not a doc"),
  ])
  assert_eq([ for d in docs => (d.path, d.source, d.title, d.description) ], [
    ("TODO", "TODO.md", "TODO", ""),
    ("ja/design", "docs/ja/design.md", "Design <x>", "why"),
    ("ja-old", "docs/ja-old.md", "docs/ja-old.md", "old"),
    ("notes", "docs/notes.md", "docs/notes.md", "no heading"),
  ])
}

///|
/// plain_inlines drops the markup of ins: code spans and links keep only
/// their text.
fn plain_inlines(ins : Array[@tinymarkdown.Inline]) -> String {
  let sb = StringBuilder()
  fn walk(ins : Array[@tinymarkdown.Inline]) {
    for i in ins {
      match i {
        Text(t) | Code(t) => sb.write_string(t)
        Link(children~, ..) => walk(children)
      }
    }
  }

  walk(ins)
  sb.to_string()
}

///|
test "nav item" {
  let s = Site(
    base_url="https://example.com",
    posts=load_posts([
      ("2026-10-01-old.md", "# Old post\nold body"),
      ("2026-10-14-hello.md", "# Hello"),
    ]),
    docs=load_docs([("docs/ja/design.md", "# Design <x>\n\nwhy")]),
  )
  let src = "posts/2026-10-14-hello.md"
  let cases = [
    ("2026-10-01-old.md", "Old post", "/posts/old"),
    ("[Back](2026-10-01-old.md)", "Back", "/posts/old"),
    ("[Go `fmt`](2026-10-01-old.md)", "Go fmt", "/posts/old"),
    ("[](2026-10-01-old.md)", "Old post", "/posts/old"),
    ("/posts/old?ref=nav", "Old post", "/posts/old?ref=nav"),
    ("/posts/old#points", "Old post", "/posts/old#points"),
    ("../docs/ja/design.md", "Design <x>", "/docs/ja/design"),
    ("https://example.com/x", "https://example.com/x", "https://example.com/x"),
    ("mailto:a@example.com", "mailto:a@example.com", "mailto:a@example.com"),
    ("#anchor", "#anchor", "#anchor"),
    // An empty URL is not a served page, so it is text only.
    ("[Current]()", "Current", ""),
    // Refused by the linker: text only.
    ("javascript:alert(1)", "javascript:alert(1)", ""),
    ("../outside.md", "../outside.md", ""),
    // A relative URL that is not a page of the site is text only;
    // the body would link it to the file on GitHub.
    (".claude/skills/todo-md/SKILL.md", ".claude/skills/todo-md/SKILL.md", ""),
    // Not a single link or a single URL: shown as written.
    ("[a](x) [b](y)", "[a](x) [b](y)", ""),
    ("just some words", "just some words", ""),
    ("[title] (url)", "[title] (url)", ""),
  ]
  for (value, label, href) in cases {
    match s.nav_item(src, value) {
      None => fail("\{value}: got None")
      Some(it) => {
        assert_eq(plain_inlines(it.label), label, msg=value)
        assert_eq(it.href, href, msg=value)
      }
    }
  }
  assert_true(s.nav_item(src, "") is None)
}

///|
test "slugify" {
  let cases = [
    ("Hello World", "hello-world"),
    ("ABC", "abc"),
    ("a-b_c", "a-b_c"),
    ("日本語", "日本語"),
    ("日本語 の 見出し", "日本語-の-見出し"),
    ("日本語　の　見出し", "日本語-の-見出し"),
    ("a\tb", "a-b"),
    ("a  b", "a--b"),
    ("日本語、の。見出し", "日本語の見出し"),
    ("テスト・検証", "テスト検証"),
    ("😀 Emoji", "-emoji"),
    ("Café", "café"),
    ("Hello 世界！", "hello-世界"),
    ("`code` と **強調**", "code-と-強調"),
    ("123", "123"),
    ("!!!", ""),
    ("", ""),
    (" a ", "-a-"),
  ]
  for c in cases {
    let (title, want) = c
    assert_eq(slugify(title), want, msg=title)
  }
}

///|
test "anchor id dedup" {
  let gen = AnchorIds::new()
  assert_eq(gen.id("Hello"), "hello")
  assert_eq(gen.id("Hello"), "hello-1")
  assert_eq(gen.id("Hello"), "hello-2")
  assert_eq(gen.id("foo"), "foo")
  assert_eq(gen.id("foo"), "foo-1")
  assert_eq(gen.id("foo-1"), "foo-1-1")
  assert_eq(gen.id("!!!"), "sec")
  assert_eq(gen.id("???"), "sec-1")
}

///|
test "collections isolate identical slugs and retain bundle links" {
  let human = load_posts([
    (
      "2026-10-19-same.md/README.md", "# Human\n\n[AI](../../slops/2026-10-19-same.md)",
    ),
    ("2026-10-19-same.md/article.md", "# Human member"),
  ])
  let ai = load_posts(
    [
      (
        "2026-10-19-same.md/README.md", "---\nnext: ../../posts/2026-10-19-same.md\n---\n# AI\n\n[Member](article.md)",
      ),
      ("2026-10-19-same.md/article.md", "# AI member"),
    ],
    collection="slops",
  )
  let s = Site(base_url="https://example.com", posts=[..human, ..ai], docs=[])
  let home = s.render("/").body.text()
  assert_true(home.contains("blog by AI"))
  assert_true(home.contains("href=\"/slops/same\""))
  assert_false(home.contains("href=\"/posts/same\""))
  let list = s.render("/slops/").body.text()
  assert_true(list.contains("blog by AI"))
  assert_true(list.contains("href=\"/slops/same\""))
  assert_false(list.contains("href=\"/posts/same\""))
  let body = s.render("/slops/same").body.text()
  assert_true(body.contains("<a href=\"/slops/same/article.md\">Member</a>"))
  assert_true(body.contains("<a href=\"/posts/same\">Human</a>"))
  assert_eq(s.render("/posts/same/article.md").body.text(), "# Human member")
  assert_eq(s.render("/slops/same/article.md").body.text(), "# AI member")
  assert_true(
    s.render("/preview").body
    .text()
    .contains("slops/2026-10-19-same.md/article.md"),
  )
  assert_eq(
    preview_url("slops/2026-10-19-same.md/article.md"),
    Some("/slops/same/article.md"),
  )
}
