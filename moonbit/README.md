# html-sandbox/moonbit

The blog reimplemented in [MoonBit](https://www.moonbitlang.com/), to run
on Cloudflare Workers as Wasm and compare its size with the Go builds.
It is an experiment in progress; see
[the research notes](../docs/sketch/ja/moonbit-workers-wasm.md) and
`TODO.md` for what is next.

The libraries are in `pkg/` and the applications on them in `examples/`,
as in `../go`.

`pkg/`:

- `el` — the HTML builder ported from `go/pkg/el`: nodes as plain data,
  `render_html` (escaping like Go's `html.EscapeString`) and
  `render_plain`
- `picoel` — the part of `go/pkg/picoel` the blog's pages use: pages
  styled by pico.css v2 (`document`, `header`, `main_`, `nav`, `article`,
  `table`, ...) as `el` nodes; `date` takes a `YYYY-MM-DD` string
- `tinymarkdown` — a port of `go/pkg/tinymarkdown`: `parse(src)` into a
  tree of sections, paragraphs, lists, quotes, tables, and code blocks, and
  `inlines(text)` into text, code spans, and links; its tests are the Go
  test cases
- `tinyfrontmatter` — a port of `go/pkg/tinyfrontmatter`: `split(src)`
  into the `key: value` pairs of a leading `---` block (`None` without
  one) and the rest, raising `SplitError` on a malformed block; its tests
  are the Go test cases
- `http` — a small HTTP library, independent of the host: `Request`
  (method, URL, headers, body, and the host's variables, with the query,
  text, JSON, and urlencoded or multipart forms parsed on demand),
  `Response` with a text or binary body, and `Router`, which routes by
  patterns like Go 1.22's ServeMux (`GET /posts/{slug}`,
  `/files/{path...}`, `/{$}`), answering 405 with `Allow` and 404
- `http/wasm` — runs an `http` handler as a Wasm export:
  `handle(n, handler)` reads the request the host wrote into the linear
  memory as UTF-8 (the method, the URL, the headers, the variables, and
  the body as bytes) and writes the response over it; `adapter.mjs` is
  the host side, `wasmApp(module)`, which gives a `fetch` handler and
  `load(files)`, which hands content to a Wasm that exports `file`
- `http/wasm/integration` — the integration test of `http/wasm`: a stub
  app that echoes back the request (methods, wildcards, the query, text,
  JSON and form bodies, binary responses, cookies, and variables), and
  `test.mjs`, which runs it on Node through `adapter.mjs`; `make test`
  runs it, and `make dev-echo` serves it with wrangler

`examples/blog/`, the blog:

- `site` — the blog, ported from the Go blog's `internal/site`:
  `load_posts` and `load_docs` build the posts and documents from
  `(name, content)` pairs, and
  `Site::handle(req)` answers an `@http.Request` (methods other than GET
  and HEAD get the 404 page) for every route of the Go blog: `/`,
  `/posts/{slug}` and `/docs/{path}` with their `.md` sources, `/docs/`,
  `/favicon.svg`, `/site.css`, the redirects to cleaned paths, and the
  404 pages, routing with an `@http.Router`. The Worker builds the `Site`
  from the posts and documents it loads from Static Assets; the tests
  build one from the embedded copies.
- `assets` — the Go blog's `site.css` and `favicon.svg`, and the hash of
  `site.css` that pages put in its URL, generated into
  `assets/embedded.mbt` by `scripts/embed-assets.sh`
- `posts` — `files`, the blog's posts (`posts/*.md` in the repository root)
  as pairs of file name and content, generated into `posts/embedded.mbt`
  (ignored by git) by `scripts/embed.sh`; the tests and the spikes in
  `experiments/` read it, and the Worker does not
- `repodocs` — `files`, the repository's own `TODO.md` and
  `docs/**/*.md` as pairs of path (from the repository root) and content,
  generated into `repodocs/embedded.mbt` the same way, as the Go blog's
  `repodocs` embeds them; used like `posts`
- `worker` — the blog's Wasm entry point, a MoonBit package: `file`,
  `serve`, and the linear memory exported, nothing imported; `file` takes
  each post and document the host loads from Static Assets, and `serve`
  hands the request to `Site::handle` through `http/wasm`
- `cloudflare` — the Cloudflare Worker that runs it, in JS: `worker.mjs`
  loads `build/content` through the `ASSETS` binding once per isolate and
  runs the Wasm with `http/wasm/adapter.mjs`, keeping each 200 response to
  GET and HEAD by path for the rest of the isolate's life, and
  `wrangler.jsonc` builds it and uploads the content as Static Assets
- `compare` — compares the Go blog with the Worker path by path (status,
  `Content-Type`, and a diff of the body); `compare/cmd` is its native
  CLI, built on `moonbitlang/async`, and the only package that uses it

And outside the module:

- `experiments` — spikes kept to reproduce the numbers in the notes,
  each a module of its own outside the blog's (see its README)

Strings cross between JS and Wasm as UTF-8 in the Wasm's memory because
Workers compiles imported Wasm modules without the JS string builtins,
which `use-js-builtin-string` relies on. moon emits one page of linear
memory even for wasm-gc and leaves it unused; `http/wasm` reads and
writes it with inline Wasm. See
[the notes on the http library](../docs/sketch/ja/moonbit-workers-http.md).

## Development

From `moonbit/` (`make help` lists the targets). The blog and `pkg/`
are maintained, and `make test` runs all their tests, including the
integration test of `pkg/http/wasm` on Node. The modules in `experiments/` are one-off spikes, and
`make -s check` only makes sure they still build (the `-s` drops make's
own echo, leaving the tools' output). To work on one part, run
moon directly (`moon test -p podhmo/html-sandbox/pkg/http`).

```sh
make build    # the blog's Wasm, into _build/wasm-gc/release/build/examples/blog/worker/worker.wasm, and after wasm-opt -Oz into examples/blog/cloudflare/build/app.wasm; also copies the posts and documents into examples/blog/cloudflare/build/content
make test     # moon test, and the integration test of pkg/http/wasm on Node through adapter.mjs
make -s check # before every commit: make test, moon fmt --check, moon check (wasm-gc, native, and in experiments/), moon info
```

The blog's `worker`, `http/wasm`, and `http/wasm/integration` are built for wasm-gc only
(their inline Wasm does not compile on native) and `compare/cmd` for
native only (async's I/O is native only), so the CLI and its dependency
stay out of the Wasm.

MoonBit has no `go:embed`, and the Worker does not need one: `make build`
runs `examples/blog/scripts/content.sh`, which copies the posts and the
documents into `examples/blog/cloudflare/build/content/` (ignored by git)
and writes `files.txt`, the sorted list of them. `worker.mjs` fetches
every file listed there through the `ASSETS` binding on the isolate's
first request. Because Static Assets has no API to list its files, the
build makes the list, and a post added to `posts/` reaches the site with
the same `make dev` or `make deploy` as before.

The tests and the spikes in `experiments/` still use `embed.sh`, which
writes the posts into `posts/embedded.mbt`, and `TODO.md` and
`docs/**/*.md` into `repodocs/embedded.mbt`, as MoonBit source (both in
`examples/blog/`). `content.sh` picks the files with the same script,
`list-files.sh`. `posts/moon.pkg` and `repodocs/moon.pkg` run `embed.sh`
before every `moon check`, `moon build`, and `moon test`, but moon looks
only at the mtime of its inputs: it reruns the script when a post or a
file directly in `docs/` is added or removed, or `TODO.md` is edited, not
when a post or document is edited or a file in a subdirectory of `docs/`
changes. `make test` and `make -s check` run it every time (`make embed`
alone), so use them after editing a post or a document.

Needs `moon` and `moon-wasm-opt` (binaryen's `wasm-opt`, installed with
moon) on `PATH`, and Node.js for wrangler.

## Running on Workers locally

```sh
make dev            # or: make dev PORT=8798, if the Go Worker uses 8787
```

Then open <http://localhost:8787>. wrangler's build command runs
`make build`, which writes the Wasm, shrunk by `wasm-opt -Oz`, to
`examples/blog/cloudflare/build/app.wasm` and the posts and documents to
`examples/blog/cloudflare/build/content/`, ignored by git, and `wrangler dev`
rebuilds when `pkg/`, `examples/blog/site/`, `examples/blog/worker/`, the
scripts under `examples/blog/scripts/`, the posts in `posts/`, `TODO.md`,
or the documents in `docs/` change. The content is
Static Assets: they are uploaded with the Worker, and the Worker reads
them through `env.ASSETS` on the first request, so a request never gets
one of those files directly.

## Comparing with the Go blog

With the Go blog and the Worker both running:

```sh
(cd ../go && go generate ./... && go run ./examples/blog -base-url https://blog.podhmo.workers.dev)   # http://localhost:8080
make dev PORT=8798                                           # the Worker
make compare PORT=8798                                       # or GO_URL=... MOONBIT_URL=...
make compare PORT=8798 PATHS="/posts/hello /docs/"           # only these paths
```

`go generate` copies `TODO.md` and `docs/` into the Go blog; without it
the Go side serves no documents. `-base-url` gives the Go blog the
Worker's `BASE_URL` (from `examples/blog/cloudflare/wrangler.jsonc`), so that the OGP tags
match. For each path `compare` prints `same`, or
which of status, `Content-Type`, and body differ with a unified diff of
the body (split after each `>` and newline, since the pages are mostly on
one line; `--lines N` caps it, 40 by default). It exits non-zero when any
path differs. Redirects are not followed, so they are compared as they are.

## Deploying

```sh
make deploy
```

It deploys as the Worker `blog`, in place of the Go blog, at
<https://blog.podhmo.workers.dev>. Deploying the Go blog again puts it
back.

`make deploy` runs `make clean` first, then wrangler's build, so the Wasm
and `worker.mjs` always come from the same tree. Without that, the ignored
`build/` and `_build/` directories keep their files across branches, and an
`app.wasm` from one branch with a `worker.mjs` from another can be deployed
together. The site then fails with `no content loaded: the host must call
file for each asset`, because the old Worker never passes the Wasm the
files the new one expects. The GitHub Actions deploy checks out a clean
tree, so it was never affected.

It can also be deployed from GitHub Actions, by running the `deploy`
workflow (`.github/workflows/deploy.yml`) by hand, from the Actions tab or
the GitHub mobile app. It runs `make test` and then `make deploy`. It needs
a `production` environment in the repository settings, with:

- the secret `CLOUDFLARE_API_TOKEN`: an API token from the "Edit Cloudflare
  Workers" template, limited to the account;
- the variable `CLOUDFLARE_ACCOUNT_ID`;
- deployment branches limited to `main`, since a manual run can pick any
  branch.

### Article collections

The shared repository content has three directories: `slops/` for
AI-written articles, `posts/` for human-written articles, and `docs/` for
repository documents. `/` shows AI articles; `/posts/` and `/slops/` have
separate lists and article URLs. Both article collections accept dated
Markdown files and flat directory bundles named `YYYY-MM-DD-slug.md/`.
A bundle uses `README.md` as its face and keeps its other files as sections
and individual downloads. See the root [README](../README.md) for the
content contract.
