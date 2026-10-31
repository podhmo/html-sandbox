///|
extern "js" fn stringify(v : @js.Js) -> String = "(v) => JSON.stringify(v)"

///|
test "parse builds the TS port's Document" {
  inspect(
    stringify(
      @js.parse(
        "# A\nb\n- x\n  - y\n> q\n\n> [!NOTE]\n> n\n\n| h |\n| - |\n| c |\n\n```\nz\n```",
      ),
    ),
    content=(
      #|{"children":[{"kind":"section","level":1,"title":"A","children":[{"kind":"paragraph","text":"b"},{"kind":"list","items":[{"text":"x","children":[{"text":"y","children":[]}]}]},{"kind":"quote","children":[{"kind":"paragraph","text":"q"}]},{"kind":"alert","alert":"note","children":[{"kind":"paragraph","text":"n"}]},{"kind":"table","header":["h"],"rows":[["c"]]},{"kind":"code","code":"z"}]}],"footnotes":[]}
    ),
  )
}

///|
test "inlines builds the TS port's Inline[]" {
  inspect(
    stringify(@js.inlines("a `b` [c `d`](/e)")),
    content=(
      #|[{"kind":"text","text":"a "},{"kind":"code","text":"b"},{"kind":"text","text":" "},{"kind":"link","children":[{"kind":"text","text":"c "},{"kind":"code","text":"d"}],"url":"/e"}]
    ),
  )
}

///|
test "asterisk and mixed lists reach the TS parser" {
  assert_eq(
    stringify(@js.parse("* a\n  - b\n    * c\n* d")),
    stringify(@js.parse("- a\n  - b\n    - c\n- d")),
  )
}

///|
test "footnotes reach the TS parser" {
  inspect(
    stringify(@js.parse("x[^a]\n\n[^a]: note")),
    content=(
      #|{"children":[{"kind":"paragraph","text":"x[^a]"}],"footnotes":[{"kind":"footnote","label":"a","children":[{"kind":"paragraph","text":"note"}]}]}
    ),
  )
}

///|
test "details reaches the TS parser" {
  inspect(
    stringify(@js.parse("<details>\n<summary>s</summary>\n\nx\n</details>")),
    content=(
      #|{"children":[{"kind":"details","summary":"s","children":[{"kind":"paragraph","text":"x"}]}],"footnotes":[]}
    ),
  )
}
