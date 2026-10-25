# html-sandbox

Experiments with classic server-side rendered HTML, implemented in more
than one language.

- [`go/`](go/README.md) — the Go standard library only: an HTML builder,
  a tiny Markdown parser, and a blog built on them
- [`moonbit/`](moonbit/README.md) — the blog in MoonBit, as Wasm for
  Cloudflare Workers (an experiment in progress)
- [`ts/`](ts/README.md) — the blog written the plain way for Workers, in
  TypeScript with Hono and `hono/jsx`, without Wasm, to compare with the
  Wasm builds

Shared across implementations:

- [`slops/`](slops) — AI-written articles (blog by AI)
- [`posts/`](posts) — human-written articles (blog by human)
- [`docs/`](docs) — design notes and sketches; [where things go, and why](docs/ja/layout.md), for every implementation
- [`TODO.md`](TODO.md) — open tasks ([archive](TODO-archive.md))

## Articles

The header links to three collections: `slops` (blog by AI), `posts`
(blog by human), and `docs` (repository documents). `/` shows AI articles;
`/posts/` and `/slops/` show their respective lists. The same slug can be
used independently in the two article collections.

Both article directories accept `YYYY-MM-DD-slug.md` files and directories.
A directory is one article bundle: `README.md` is its face when present,
and each remaining file appears as a separate section. Each member is also
available at `/<collection>/<slug>/<filename>`.

The first human article is a bundle imported from
[this Gist](https://gist.github.com/podhmo/36a33d61d3776aa76ffcc48441b980ba).
Its date, 2026-10-19, is the Gist creation date in Asia/Tokyo
(`2026-10-18T22:40:01Z`). The three source files are retained separately;
only the face receives title front matter from the Gist description.
