# TODO archive

> **What this file is:** append-only history of completed work moved out of
> `TODO.md` by a periodic GC sweep (see `.claude/skills/todo-md/SKILL.md` —
> feature PRs never write here, so this file never conflicts). Entries land
> **verbatim** at the end of the file as `- [x]` lines; nested items get a
> `> parent: <title>` context line first. Entries are never rewritten;
> links into docs, issues, and PRs are preserved.
>
> **Reading this file:** do not read it whole — `grep` for a symbol or
> feature name, then read only the surrounding lines (`rg -C` / read with
> an offset).

- [x] **Core `pkg/el`** ([design](docs/ja/design.md)): the scope the blog
  needs first; more elements/attributes are added as const lines later.
> parent: Core `pkg/el`
- [x] **Node types and constructors**: `Node`, `Tag` / `AttrName` consts,
  `El`, `Attr`, `Text`, `Raw`. Tests compare trees with
  `reflect.DeepEqual`.
> parent: Core `pkg/el`
- [x] **`HTMLRenderer`**: escaping in `Text`, void elements, attributes
  vs. children. Table tests on rendered strings, including an XSS case.
> parent: Core `pkg/el`
- [x] **`PlainRenderer`**: text-only output. Tests for nested elements
  and dropped attributes.
- [x] **`Parse(src) Document`** ([sketch](docs/sketch/ja/blog.md)): pure-data
  AST with no dependency on `pkg/el`. Table tests compare ASTs with
  `reflect.DeepEqual`.
> parent: `Parse(src) Document`
- [x] **Sections**: `#`–`###` nest into `Section`; content before the
  first heading goes to `Document.Children`. Tests for nesting and
  level jumps.
> parent: `Parse(src) Document`
- [x] **Lists and paragraphs**: consecutive `- ` lines form one `List`;
  other non-empty lines join into a `Paragraph`; blank lines separate.
> parent: `Parse(src) Document`
- [x] **Code blocks**: ```` ``` ```` fences only; the info string is
  ignored and contents are kept verbatim (including `#`, `- `, blank
  lines). Tests for an unclosed fence running to EOF.
- [x] **Mobile-first blog** ([sketch](docs/sketch/ja/blog.md)): handlers
  tested with `httptest` over a `fstest.MapFS`, body checks via
  `PlainRenderer`.
> parent: Mobile-first blog
- [x] **Post loading**: `loadPosts(fs.FS)` over `//go:embed posts/*.md`;
  date and slug from `YYYY-MM-DD-slug.md`, title from the first `#`.
  Tests for bad file names and duplicate slugs (startup error).
> parent: Mobile-first blog
- [x] **Post list and post page**: `GET /{$}` (newest first) and
  `GET /posts/{slug}`, built by `layout` / `postList` / `postPage` and
  `renderBlocks` (AST → `el.Node`, code blocks as `<pre>`).
> parent: Mobile-first blog
- [x] **Error pages**: 404 for unknown slugs and unmatched URLs, 500 via
  a `recover` middleware; render into `bytes.Buffer` first. Tests that
  the 500 page leaks no internal details.
> parent: Mobile-first blog
- [x] **Favicon**: embedded `favicon.svg` at `GET /favicon.svg` with
  `Content-Type` and `Cache-Control`. Test the headers.
> parent: Mobile-first blog
- [x] **Mobile-first CSS**: inline `<style>` via `Raw`, no build step,
  under ~100 lines (dark mode, 44px tap targets, scrollable `<pre>`).
> parent: Mobile-first blog
- [x] **Sample posts**: a few posts in `cmd/blog/posts/` that exercise
  every supported Markdown construct.
- [x] **Readable `PlainRenderer` output**: text of adjacent elements is
  glued together (`blog2026-10-14Hello`). Separate block-level elements
  (e.g. with newlines) and update tests in `pkg/el` and `cmd/blog`.
- [x] **Tiny front matter**: split a leading `---` block of `key: value`
  lines from the Markdown body, as a separate package next to
  `pkg/tinymarkdown`. Errors for an unclosed block, a line without `:`,
  and duplicate keys.
- [x] **Front matter in posts**: `title` and `description` from
  `pkg/tinyfrontmatter`, falling back to the first `#` heading and the
  first paragraph; `description` also feeds `<meta name="description">`
  and OGP.
- [x] **OGP support**: `og:title`, `og:type` (`website` / `article`),
  `og:url`, `og:description` (the post's description), `og:site_name`.
  Needs a base URL flag for absolute URLs and a `property` attribute
  const in `pkg/el`; `og:image` is out of scope for now.
- [x] **`pkg/picoel`: pico.css v2 building blocks for the blog**: add a
  package with only the elements the blog needs, built on `pkg/el` and
  following the rules in `../podhmo.github.io/ui/pico/README.md` (no custom
  classes or CSS, semantic elements first, `.container` on
  `header`/`main`/`footer`, pico v2 from the CDN). Rewrite `examples/blog` to
  import only `picoel` (no direct `pkg/el`) and drop `style.go`.
- [x] **Dark mode for the blog**: render every page in pico's dark theme
  (`data-theme="dark"` on `<html>`) instead of following the OS setting.
- [x] **`examples/parse-markdown`: dump the tinymarkdown tree**: a small
  CLI that parses Markdown files (or stdin) with `pkg/tinymarkdown` and
  prints the resulting tree, to check how documents such as `TODO.md` and
  `docs/**/*.md` are understood before embedding them in the blog.
- [x] **tinymarkdown: list items spanning several lines**: indented lines
  after a `- ` item should continue that item instead of starting a
  paragraph. Today every multi-line entry in `TODO.md` splits into a
  one-line list plus a paragraph (check with `examples/parse-markdown`).
- [x] **Serve `TODO.md` and `docs/` in the blog**: embed them with
  `go:embed` from a package at the repository root (embed cannot reach
  `..`), parse them with tinymarkdown at startup, and serve them under
  `/docs/` with an index page and a nav link.
- [x] **tinymarkdown: blockquotes**: consecutive `>` lines become a `Quote`
  whose content is parsed as Markdown again; render it as `<blockquote>`
  in the blog (the note at the top of `TODO.md` is one).
- [x] **tinymarkdown: inline code**: split text into plain runs and
  `` `code` `` spans (CommonMark-style backtick runs) and render the spans
  as `<code>` in headings, paragraphs, and list items.
- [x] **blog: `-debug` and `-watch` for writing**: `-debug` reads posts and
  docs from files on disk instead of the embedded copies; `-watch` implies
  `-debug`, polls those files for changes, reloads them, and tells open
  pages to reload over SSE. Deploys keep serving the embedded files.
- [x] **blog: download posts and docs as Markdown**: serve the source of
  `/posts/foo` and `/docs/foo` at `/posts/foo.md` and `/docs/foo.md` as
  `text/markdown`, and add a download link to each page
  ([#3](https://github.com/podhmo/go-html-sandbox/issues/3)).
- [x] **blog: sticky site header and tighter spacing with a small
  `site.css`**: pico has no utility for either, so allow one embedded
  stylesheet served after pico that only overrides pico variables and adds
  minimal layout rules (sticky `body > header`, smaller block spacing for
  `header`/`main`).
- [x] **blog: rewrite the stale sample post `2026-10-16-mobile-first.md`**:
  it still describes the old inline stylesheet (custom properties, clamp(),
  prefers-color-scheme, ...), but pages now use pico.css v2 in its dark
  theme, plus a small `site.css` for what pico cannot express.
- [x] **blog: update the stale sample post `2026-10-15-tinymarkdown.md`**:
  it says headings stop at `###` and shows `####` as unsupported, and
  does not mention links or pipe tables, all of which tinymarkdown now
  supports.
- [x] **tinymarkdown: links**: parse `[text](url)` into a link inline
  (alongside `` `code` `` spans) and render it as `<a>` in the blog; today
  it shows as raw text, e.g. the note at the top of `TODO.md`. Decide how
  relative links between repository files (`docs/...md`, `.claude/...`)
  map to `/docs/` URLs or elsewhere.
- [x] **tinymarkdown: headings up to `#####`**: raise `maxLevel` from 3
  to 5 so `####` and `#####` open nested sections (rendered as `<h4>` and
  `<h5>` in the blog); today they are shown as paragraph text. See
  [the sketch](docs/sketch/ja/blog.md).
- [x] **tinymarkdown: tables**: parse GitHub-style pipe tables (header
  row, `| --- |` delimiter row, body rows) into a table block, with
  inline syntax in cells, and render them as `<table>` in the blog.
  `docs/sketch/ja/blog.md` and `docs/sketch/ja/blog-tinygo-workers.md`
  use tables, which are shown as raw `|` text today. Decide whether to
  honor column alignment (`:---:`).
- [x] **blog: render inline Markdown in titles of the post and doc lists**:
  `postList` and `docList` write the title with `pe.Text`, so a title such
  as ``実験レポート: `examples/blog` を …`` shows its backticks literally.
  Render it with `renderInlines` like the page heading (dropping links,
  since the title is already a link), and strip the markup from `<title>`
  and `og:title`.
- [x] **blog: serve `TODO.md` and `docs/` again**: since the Go code moved
  into `go/`, they sit above the module and `go:embed` cannot reach them,
  so the root `embed.go` was dropped and `/docs/` lists nothing (the nav
  link still shows). Decide how to bring them back, e.g. copy them into
  the module with `go generate` before building, or read them from disk
  in `-debug` with `-root` pointing at the repository.
- [x] **Run `examples/blog` on Cloudflare Workers with TinyGo**: split the entry
  point by build tag so the default build stays standard-library only,
  and serve the same `http.Handler` via
  [syumai/workers-go](https://github.com/syumai/workers-go) under TinyGo.
  Far off; check that `pkg/*` and `go:embed` work under TinyGo first.
  Spike: [report](docs/sketch/ja/blog-tinygo-workers.md), branches
  `spike/tinygo-workers` (build tags) and `spike/tinygo-workers-module`
  (separate module).
- [x] **MoonBit の Wasm バックエンドを Cloudflare Workers で試す**:
  ブログを移植する前に、ローカルで確認でき、デプロイもできる MoonBit の
  Worker を `moonbit/` に用意する。ページは `wasm-gc`（Workers ではコンパイル
  できない `use-js-builtin-string` は使わない）から、コード単位の ABI で返す。
  [調査メモ](docs/sketch/ja/moonbit-workers-wasm.md)を参照。
  - [x] **`moonbit/` の雛形**: トップページと 404 ページを組み立てる `render`
    を持つ MoonBit のモジュール（`moon.mod`、`moon.pkg`）と、その両方を確かめる
    `moon test`。完了の条件: `moon test` が通り、
    `moon build --target wasm-gc --release` でできる Wasm の export が
    `path_push` と `serve` だけ、import が `host.put` だけである。
  - [x] **Worker と `wrangler dev`**: spike の `worker.mjs` と、MoonBit を
    ビルドして Wasm を `worker.mjs` の隣にコピーする（git では無視する）
    `wrangler.jsonc` を `moonbit/workers/` に置く。完了の条件: そこで
    `npx wrangler dev` を実行するとトップページが表示され、`<` を含むパスが
    エスケープされる。
  - [x] **ABI でステータスとヘッダーを返す**: `serve` がステータスコードと
    content type を伝えられるようにし（例: `host.status(code)` と `host.header`
    の呼び出し）、存在しないパスに 404 を返す。完了の条件: `wrangler dev` に
    `curl -i` すると 200 / 404 と正しい `Content-Type` が返り、`render` が選ぶ
    ステータスを `moon test` で確かめている。
  - [x] **Makefile のターゲット**: `go/Makefile` と同じように、`build`、`test`、
    `dev`、`deploy` を持つ `moonbit/Makefile` を作る（ルートの `Makefile` は
    なく、各実装はそれぞれのディレクトリで実行する）。完了の条件: clone 直後の
    状態から、`moonbit/` で `make test dev` が動く。
  - [x] **デプロイ**: 当面は Worker `blog-moonbit` としてデプロイし、Go 版の
    `blog` は残す。最終的には、勝ったほうの実装を `blog` としてデプロイする。
    Go 版の Worker と同じ手順に従う。完了の条件: workers.dev の URL がトップ
    ページと 404 を返し、Workers が wasm-gc のアップロードを受け付けることを
    確かめる。wrangler が表示するアップロードサイズを調査メモに記録する。
  - [x] **計測**: `wasm-opt -Oz` をかけた Wasm のサイズと、約 50 KB のページで
    `serve` がコード単位ごとの呼び出しにかける時間（ローカルの `wrangler dev`
    で）を測る。両方を調査メモに記録し、呼び出しが遅ければ、UTF-8 のバイト列を
    線形メモリ越しに渡す ABI を検討する。

- [x] **ブログを MoonBit で作り直す**: 同じサイトをトップレベルの `moonbit/`
  に作り、Wasm として Cloudflare Workers で動かして、Wasm のサイズを Go 版と
  比べる（TinyGo で約 2 MiB / gzip 後 760 KiB、標準 Go で約 8 MiB。
  [レポート](docs/sketch/ja/blog-tinygo-workers.md)を参照）。`pkg/*`（HTML
  ビルダー、Markdown パーサー）をどこまで移植するかを決め、比較の結果を
  `docs/` に記録する。下の各ステップは、`moonbit/` で `make test` と
  `make dev` で確認でき、`make deploy` でデプロイできる状態で終える。対象は
  Worker が配信するものだけで、`-debug` や `-watch` は移植しない。
  [実験](docs/sketch/ja/moonbit-workers-wasm.md)の続き。
  - [x] **Go 版のブログと比べる**: Go 版のブログ（`go run ./examples/blog`）と
    MoonBit の Worker（`make dev`）から同じパスを取得し、レスポンスごとに
    ステータス、`Content-Type`、本文の差分を取るスクリプトを `moonbit/` に
    置く。完了の条件: `/`、記事 1 つ、文書 1 つ、`/docs/`、`/favicon.svg`、
    存在しないパスに対して実行でき、どれが違うかを報告する（最初は全部違う）。
  - [x] **記事と文書を埋め込む**: MoonBit には `go:embed` がない。Go 版の
    ブログの記事、`TODO.md`、`docs/**/*.md` を、ファイルパスと内容の組として
    使い、生成したソースはコミットしない。完了の条件: `moon test` ですべてが
    そろっていることを確かめ、clone 直後の状態から `make build` が通る。
    - [x] **記事**: `go/examples/blog/posts/*.md` を `moonbit/posts` の
      `files` として埋め込む（`scripts/embed.sh` を `moon.pkg` の
      `dev_build` と `make` から実行）。
    - [x] **文書**: `TODO.md` と `docs/**/*.md` を同じように埋め込む。
      `scripts/embed.sh` はディレクトリ直下の `*.md` しか扱わず、moon の
      `dev_build` はディレクトリの mtime しか見ないので、サブディレクトリの
      扱いを決める。
  - [x] **HTML ビルダー**: `pkg/el`（ノード、エスケープ、レンダリング）と、
    `pkg/picoel` のうちページで使う部分を移植する。完了の条件: Go のテストの
    うち当てはまるケースを `moon test` で、同じ出力で確かめている。
    - [x] **el**: `pkg/el` を `moonbit/el` に移植する。
    - [x] **picoel**: `pkg/picoel` のうちページで使う部分を移植する。
  - [x] **front matter と Markdown**: `pkg/tinyfrontmatter` と
    `pkg/tinymarkdown`（`#####` までのセクション、リスト、段落、引用、
    フェンスで囲んだコード、表。インラインのコードとリンク）を移植する。
    完了の条件: Go のテストのケースを `moon test` で、同じ構文木で確かめて
    いる。
    - [x] **tinymarkdown**: `pkg/tinymarkdown` を `moonbit/tinymarkdown` に
      移植する。
    - [x] **tinyfrontmatter**: `pkg/tinyfrontmatter` を移植する。front matter
      は構文木ではないので、Go のテストのケースと同じ結果になることを
      `moon test` で確かめる。
  - [x] **記事**: 埋め込んだ記事（`YYYY-MM-DD-slug.md`。タイトルと説明は
    front matter、なければ最初の見出しと段落から）を読み込み、`/` と
    `/posts/{slug}` を Go 版のブログと同じレイアウト（pico.css、`BASE_URL`
    からの OGP タグ。`BASE_URL` は `wrangler.jsonc` から渡す）で返す。
    完了の条件: 比較スクリプトで、`/` とすべての記事が Go 版と一致する。
  - [x] **文書とリンク**: `/docs/` と `/docs/{path}` を返し、Markdown の相対
    リンクを Go 版と同じように解決する（`/docs/` や `/posts/` のページへ、
    GitHub へ、またはリンクにしない）。完了の条件: 比較で、すべての文書が
    一致する。
  - [x] **残りのルート**: `/favicon.svg`、`/site.css?v=<hash>`、記事と文書の
    `.md` 版、リダイレクト（正規化されていないパス、`/docs` から `/docs/`）、
    404 ページ。完了の条件: Go 版のブログのすべてのパスで、比較に差分がない。
  - [x] **比較して記録する**: デプロイし、wrangler が表示するアップロード
    サイズと起動時間を、TinyGo 版と標準 Go 版の数字と並べて、いちばん大きい
    ページで `serve` にかかる時間とともに調査メモに記録する。どちらの実装を
    `blog` としてデプロイするかを決める。

- [x] **`moonbit/site` のエスケープを Go 版に揃える**: `site` の
  `write_escaped` は `"` を `&quot;` にするが、Go 版（`moonbit/el` も同じ）は
  `html.EscapeString` に倣って `&#34;` にするので、`"` を含むパスの 404 ページが
  Go 版と違う。`site` を `el` で組み立て直し、`write_escaped` を消す。
  [modernize のレポート](docs/sketch/ja/moonbit-modernize.md)の「パッケージ構成と依存関係」を参照。
- [x] **`derive` で生えるメソッドの打ち消し方を揃える**: `moonbit/el` の
  `extends.mbt` は `Eq` と `Debug` のメソッドを `#deprecated` 付きの
  `pub extend` で打ち消しているが、`moonbit/tinymarkdown` は `#deprecated` を
  付けていない。どちらかに揃える。
  [modernize のレポート](docs/sketch/ja/moonbit-modernize.md)の「気づいたこと」を参照。
- [x] **`moonbit/tinymarkdown` のコピーを減らす**: `cells` と `code_text` は
  `String` を受け取るので、呼び出し側が先に `to_owned()` している。
  `StringView` を受け取るようにして、構文木に入れるときだけコピーする。
  [modernize のレポート](docs/sketch/ja/moonbit-modernize.md)の「view 型とコピー」を参照。
- [x] **`moonbit/compare` のテストの抜けを埋める**: 改行も `>` もない末尾の
  断片、`\r` と `\t` の表示、MoonBit 側だけの取得失敗をテストする。
  [modernize のレポート](docs/sketch/ja/moonbit-modernize.md)の「テストとドキュメント」を参照。
- [x] **`moonbit/` で opt-in の警告を有効にするか決める**: `moonc check -warn-help`
  で `off` になっている警告（`unnecessary_view_op`、`unqualified_record` など）を
  `moon.mod` の `warnings` に入れれば、普段の `moon check` で書き換えの候補が
  見える。`unnecessary_annotation` は `@pkg.` を残す方針なので入れない。
  [modernize のレポート](docs/sketch/ja/moonbit-modernize.md)の「手順」を参照。

- [x] **MoonBit 版のブログで、記事や文書を足しても Wasm が太らないようにする**:
  今は記事、`TODO.md`、`docs/**/*.md` を Wasm に埋め込んでいるので、書くたびに
  Wasm が大きくなる（249 KB のうち、埋め込んだ文章が約 134 KB）。`wrangler deploy`
  と `make dev` だけで済む今の手軽さを保ったまま、文章を Wasm の外に出す。
  第一候補は Workers の Static Assets（`wrangler.jsonc` の `assets`。同じ
  `wrangler deploy` でアップロードされ、`wrangler dev` でも動き、R2 や KV のような
  別の手順が要らない）。Static Assets には一覧の API がないので、ファイルの一覧は
  ビルド時に作る。
  - 決めること: 文章を Wasm にどう渡すか（`serve` は同期なので、JS が先に取って
    渡すか、Wasm が要るファイルを返して呼び直すか）。下の Future work の
    アダプターの見直しと関わる。
  - [調査レポート](docs/sketch/ja/moonbit-static-assets.md)では、最初のリクエストで
    全部の文章を取って Wasm に渡す案を推している。
  - 完了の条件: `make compare` で Go 版と一致したまま、記事を 1 本足しても Wasm の
    サイズが変わらない。サイズと処理時間の変化を
    [調査メモ](docs/sketch/ja/moonbit-workers-wasm.md)に記録する。

- [x] **MoonBit の Workers 用アダプターを汎用化する**: 今のアダプターはブログ専用で、
  要求として `BASE_URL`、メソッド、クエリー、パスしか渡さない。POST の本文、
  ヘッダー、クエリーの解析、フォーム（urlencoded と multipart）、パスの
  パターンによるルーティングを、ライブラリとして切り出せる形で使えるようにする。
  Go 版や net/http に寄せる必要はなく、同じような機能が使えればよい。
  [issue #33](https://github.com/podhmo/html-sandbox/issues/33)、
  [PR #31](https://github.com/podhmo/html-sandbox/pull/31) の知見を踏まえる。
  - 完了の条件: POST、クエリー、本文、フォームを扱う例が `wrangler dev` で動き、
    ブログは `make compare` で Go 版と一致したまま。分かったことを
    [探索メモ](docs/sketch/ja/moonbit-workers-http.md)に記録する。

- [x] **tinymarkdown: ネストした箇条書きを扱う**: ブログで `TODO.md` をそのまま
  読めるように、インデントした `- ` を親の項目の子のリストにする。今は
  `List.Items` が文字列の並びなので、子の項目が親と同じ階層に並んでしまう
  （`examples/parse-markdown` で確かめられる）。
  - [x] Go 版（`go/pkg/tinymarkdown`）を直し、HTML とプレーンテキストの描画も
    子のリストに対応させる。
  - [x] MoonBit 版（`moonbit/tinymarkdown`）も同じように直す。
  - 完了の条件: `TODO.md` の入れ子がそのまま描画され、`make compare` で Go 版と
    一致する。

- [x] **ts 版のブログを本番にデプロイして、起動時間を測る**: `ts/`（Hono と
  hono/jsx、Vite）は `vite preview` までで、デプロイしていない。`npm run deploy` で
  `blog-ts` としてデプロイし、起動時間とアップロードの大きさを MoonBit 版と比べる。
  - 完了の条件: 結果を[探索メモ](docs/sketch/ja/ts-hono-workers.md)に記録する。

- [x] **記事のセクションに `id` を付けて `#` リンクが届くようにする**: 今は
  tinymarkdown の `Section` が `<section>` だけを出すので、`#見出し` への
  フラグメントリンクがどこにも届かない（`prev` / `next` の値にも `#` 付きの
  URL を書ける）。見出しから id を作る規則（GitHub 式のスラッグ化など）を
  決めて、Go 版と MoonBit 版の両方で `<section>` に付ける。

- [x] **フラットなディレクトリを1ページとして公開する**: 記事と URL が一対一の
  今の形に加えて、gist のように複数のテキスト（本文、併記の解説記事、完全な
  形の動作コード）を一つのページで見せたい
  （[issue #58](https://github.com/podhmo/html-sandbox/issues/58)）。置き場所と
  URL（`posts/` の日付付きディレクトリを1ページにする、専用のトップレベル
  ディレクトリを用意する、`index.md` を顔にする、など）と、ページ内での
  ファイルの順序と境界、非 Markdown ファイルの扱いを決める。
  - 完了の条件: `make compare` で Go 版と MoonBit 版が一致したまま、
    ディレクトリを1つ足すだけで1ページが増える。

- [x] **GitHub のアラート記法 `> [!NOTE]` などを描く**: 引用の先頭行が
  `[!NOTE]`、`[!TIP]`、`[!IMPORTANT]`、`[!WARNING]`、`[!CAUTION]` の
  どれかだけのとき、その行を外してアラートとして描く
  （[issue #65](https://github.com/podhmo/html-sandbox/issues/65)）。
  pico.css v2 にアラートのコンポーネントはないので、タイトルと種類
  ごとの色は site.css で自作した。

- [x] **コードブロックにコピーのボタンを付ける**: フェンスのコード
  ブロックの右上に、中身をクリップボードへ写すボタンを出す。ボタンは
  ページが読む `code-copy.js` が `pre` ごとに作るので、描画する HTML は
  変わらず、`make compare` の一致もそのまま。通常のページが読む初めての
  JavaScript になる（これまでは `-watch` の livereload だけだった）。

- [x] **プレビューページ `/preview` を足す**（Go 版・MoonBit 版）:
  [issue #71](https://github.com/podhmo/html-sandbox/issues/71)。
  ヘッダーの `preview` リンクから。textarea の Markdown をブラウザ上の
  Wasm（site パッケージの描画を wasm-gc でエクスポートした
  `preview.wasm`）で記事と同じ形に描く。保存はせず、
  ファイル入力で `.md` を読み込める。

- [x] **tinymarkdown の記事を最新の状態に合わせる**: 「tinymarkdown で
  書けること」([記事](slops/2026-10-15-tinymarkdown.md)) が、見出しの id と
  permalink、字下げしたフェンスの dedent、リンクの解決規則、インラインコードと
  表の細かい規則、`svg` の生マークアップ、`/preview` を説明していなかった。
  現在の実装に合わせて追記した。

- [x] **tinymarkdown: `*` を使った箇条書きが表示されない不具合を直す**: `* 項目` が箇条書きとして認識されず、通常の段落として表示される。`-` と同様に `*` でも箇条書きと入れ子を扱えるようにし、Go・MoonBit・TypeScript の各実装で確認する（[再現する記事](posts/2026-10-19-wsl-opencode.md/article2.md)）。

- [x] **MoonBit の Workers 用アダプターを最適な形に磨く**: 今のアダプター
  （`moonbit/cloudflare/worker.mjs`（当時は `moonbit/workers/`）と `moonbit/worker` の export、host の
  import）は、ブログに必要十分で、足りないものはない。ただ、spike から必要に
  応じて継ぎ足してきたものなので、これまでの知見を総動員して最適な形に設計し
  直す。知見とは、Workers では
  `use-js-builtin-string` が使えないこと、コード単位の受け渡しが時間の約 8 割を
  占めること、`wasm-opt -Oz` の効果、workerd による URL の正規化、メソッドと HEAD
  の扱い、`set_query` と `set_base_url` を後から足した経緯など。
  - 受け渡しの方法（コード単位ごと、またはまとめて渡す）と export / import の数、
    `worker.mjs` の行数、Wasm のサイズ、起動時間、いちばん大きいページの処理時間を
    今と比べる。
  - 完了の条件: `make compare` で Go 版と一致したまま、結果を
    [調査メモ](docs/sketch/ja/moonbit-workers-wasm.md)に記録する。
  - 探索の記録は[探索メモ](docs/sketch/ja/moonbit-workers-adapter.md)にある。
    線形メモリに UTF-8 でまとめて渡す案、`moon-wasm-opt -Oz`、workerd の
    `wasm_esm_integration_builtins` フラグを使う案などを、一つずつ確かめる。
  - [x] 線形メモリに UTF-8 でまとめて渡す案（D'）と、メソッドを Wasm に渡す案（G）を
    取り込み、`make compare` で Go 版と一致することを確かめる。
  - [x] `moon-wasm-opt -Oz` を `make build` に入れる（案 F）。
  - [x] パスのデコードを Wasm に移し、`/%FF` のような UTF-8 でないパスにも Go 版と
    同じ 404 を返す（案 H）。
  - [x] GET と HEAD への 200 の応答を、isolate の中でパスごとにキャッシュする（案 I）。
  - [x] 2026-10-22 に、フラグ入りの wrangler 4.151.3（workerd 1.20261019.1）で
    `wasm_esm_integration_builtins` を使う案 E を `wrangler dev` と本番で動かした。
    通常の 70 パスは Go 版と一致し、`-Oz` の Wasm は今の案 D' より 78,050 B 小さいが、
    いちばん大きいページは約 7% 遅く、案 H のパスのデコードは再現できなかった
    （[探索メモ](docs/sketch/ja/moonbit-workers-adapter.md)）。

> parent: Go と MoonBit の `pkg/el` と `pkg/tinymarkdown` に profiler をかけて速くする
  - [x] Go 版: ベンチを足し、pprof で `tinymarkdown.cells` と `inlines` の走査、
    タグと属性の文字列連結を直した。`Parse` は 85 µs から 56 µs、描画は 97 µs
    から 62 µs になり、描画のアロケートは 0 になった
    （[調査メモ](docs/sketch/ja/profiling-go.md)）。

> parent: Go と MoonBit の `pkg/el` と `pkg/tinymarkdown` に profiler をかけて速くする
  - [x] MoonBit 版: `moon bench` で前後を取り、`perf` と `addr2line` で内訳を
    見て、Go 版で効いたところ（セル、インラインの走査、タグと属性の連結）を
    なぞった。行とセルも `StringView` のまま引き回した。`parse` は native で
    186 µs から 70 µs、wasm-gc で 299 µs から 109 µs、`render_html` は
    108 µs から 67 µs / 233 µs から 191 µs になった。出力は変えておらず、
    `make check` が通る（`make compare` はこの環境では回していない）
    （[調査メモ](docs/sketch/ja/profiling-moonbit.md)）。

> parent: Go と MoonBit の `pkg/el` と `pkg/tinymarkdown` に profiler をかけて速くする
  - [x] MoonBit 版（ガイド）: `moon run --profile` / `moon test --profile` の仕組み、
    生成されるファイル、結果の読み方を、その 1 枚で完結するように書いた。この環境の
    `perf` では集計が空になる理由（libdw が無く DWARF の call graph を展開できない、
    `cpu-clock` に CPU 属性が無くヘッダを認識できない）と、`perf` と `nm` で
    self time を取る代替手順も入れた。題材は `moonbit/experiments/profile-demo`
    （[ガイド](docs/sketch/ja/profiling-moonbit-guide.md)）。

> parent: Go と MoonBit の `pkg/el` と `pkg/tinymarkdown` に profiler をかけて速くする
  - [x] MoonBit 版（ガイド、追試）: 何も知らないセッションにガイドだけを与え、naive 実装
    だけのプロジェクトで同じ改善を追試させて自己完結性を確かめた（約55〜61倍、出力一致）。
    引っかかったところ（`ldd` の判定、moon の `perf.data` には `ip` も残らないこと、
    `--no-strip` の実行ファイルが通常のビルドで差し替わること、`top.py` の仕様と
    実行ファイルのパスが書かれていないこと）を直し、`top.py` の全文を付録に入れた。
    修正後にもう一度追試して約60倍で同じ結果を確認し、残った事実誤り2件（`--no-strip`
    で名前が別の関数に化ける仕組みの説明、§3 の成功例が libc の行を含んでいたこと）を直した
    （[ガイド](docs/sketch/ja/profiling-moonbit-guide.md)、
    [PR #51](https://github.com/podhmo/html-sandbox/pull/51)）。
