---
title: Bundle demo
description: One page built from a directory — a main text, a companion note, and working code.
---

# Bundle demo

This post is a *bundle*: the directory `posts/2026-10-22-bundle-demo.md/`
holds several files, and all of them appear on this single page — like a
gist. This `README.md` is the face of the bundle and provides the title,
the description, and the `prev`/`next` navigation.

- `00-notes.md` is a companion note, rendered as Markdown.
- `hello.go` is a complete program, rendered as a code block and served raw.

The order is: README.md first, then the rest sorted by file name — so
`00-`, `01-`, … prefixes control the sequence.
