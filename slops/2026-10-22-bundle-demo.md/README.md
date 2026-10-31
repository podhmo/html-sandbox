---
title: Bundle demo
description: One page built from a directory — a main text, a companion note, an image, and working code.
prev: ../2026-10-22-bundle.md
next: ../2026-10-24-alerts.md
---

# Bundle demo

This post is a *bundle*: the directory `posts/2026-10-22-bundle-demo.md/`
holds several files, and all of them appear on this single page — like a
gist. This `README.md` is the face of the bundle and provides the title,
the description, and the `prev`/`next` navigation.

- `00-notes.md` is a companion note, rendered as Markdown.
- `01-diagram.svg` is an image, shown with `<img>` and served as
  `image/svg+xml`.
- `hello.go` is a complete program, rendered as a code block and served raw.

The order is: README.md first, then the rest sorted by file name — so
`00-`, `01-`, … prefixes control the sequence.

## Inline SVG

A code block fenced with `svg` is not a code block at all — it is the
image itself, rendered inline:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60" role="img" aria-label="A small inline drawing">
  <rect x="2" y="2" width="196" height="56" rx="8" fill="#eafbf1" stroke="#33d17a" stroke-width="1.5"/>
  <circle cx="30" cy="30" r="12" fill="#33d17a"/>
  <path d="M24 30 l4 4 l8 -8" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="52" y="35" font="13px/1.3 sans-serif" fill="#1f8a4d">an inline ```svg block</text>
</svg>
```

Any other fence name stays a code block:

```
<svg>this is only text</svg>
```

## What does *not* work

Standard Markdown image syntax is not parsed — `!` is just a character
and the `[...](...)` part is an ordinary link — the line below renders
as `!` followed by a link to the file:

![local file](hello.go)

The same goes for an inline `data:image/...` URI — `data:` is not an
allowed link scheme here, so even the link is dropped and only its text
remains (a `!` and the word "embedded"):

![embedded](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==)

Binary image formats (PNG, JPEG) cannot be bundle members either — a
member is stored as text, so `.svg` is the only image type a bundle can
carry.
