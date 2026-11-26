# スケッチ: コードオーナーとして手を入れたいところ

コードを自由に変えてよい立場で、このリポジトリ（Go と MoonBit のブログ、Worker、ブラウザー側の JS、`tools/svg-gen`）をどう良くするかのアイデア集。
「コードの改善」「機能の追加・洗練」「UX の洗練」「性能の改善」の 4 つに分け、最後に優先度を下げて `tools/svg-gen` を扱う。
各項目には、根拠にしたコードの場所か、手元で測った数字を付けた。`TODO.md` にすでにある作業（profiler をかける、`{#id}` 記法、svg のサニタイズなど）は繰り返さず、関係するところで参照するだけにする。

## 結論（先にやるもの）

優先度は「効果 / 手間」で付けた。上ほど先にやる。

| 優先度 | 区分 | 内容 | 手間 |
| --- | --- | --- | --- |
| 高 | UX | 一覧のカードに description を出し、年ごとに見出しを付ける | 小 |
| 高 | 機能 | Atom フィード（`/feed.xml`、`/posts/feed.xml`）と `sitemap.xml` | 小〜中 |
| 高 | コード | Go の静的ファイルの handler 7 つを表 1 つにまとめる（MoonBit も同じ形に） | 小 |
| 高 | 性能 | Go サーバーに ETag と 304、gzip の事前圧縮 | 小〜中 |
| 中 | 機能 | 長い記事に目次（`<details>` で畳む） | 中 |
| 中 | コード | Post と Doc の読み込みの重複（title / description の決め方）を 1 か所に寄せる | 小 |
| 中 | コード | Go と MoonBit の一致を CI で常に見る（`compare` を全パスで回す） | 中 |
| 中 | 機能 | タイトルと description を対象にしたクライアント側の検索 | 中 |
| 中 | svg-gen | `aria-label` の `"` が属性を壊すバグを直す | 小 |
| 低 | 性能 | Worker でビルド時に全ページを描画しておく案を測る | 大 |
| 低 | svg-gen | 文字幅の見積もり、生成物と記事内 SVG のずれの検出、並列ビルド | 中 |

## 1. コードの改善

### 1.1 静的ファイルの handler を表にする

`go/examples/blog/internal/site/server.go` には `handleSiteCSS`、`handleCodeCopyJS`、`handlePreviewJS`、`handlePreviewWasm`、`handleListenJS`、`handleSkimJS`、`handleFavicon` の 7 つがあり、違うのは Content-Type、キャッシュの長さ、中身だけだ。
`content.go` の `siteCSSPath` などのバージョン付きパスも、同じ形の宣言が並んでいる（`siteCSSPath` と `codeCopyJSPath` だけ `versionOf` を使っていない）。

次のような表 1 つにする。

```go
type asset struct {
	path    string // "/site.css"
	ctype   string
	body    []byte
	version bool   // pages link to it as path?v=<hash>, so it is immutable
}

var assets = []asset{ ... }
```

- `route` の `case p == "/site.css"` などの分岐が 1 行（`if a, ok := assetByPath[p]`）になる。
- ページ側は `assetURL("/site.css")` でバージョン付きのパスを引く。新しいスクリプトを足すときに触る場所が 3 か所から 1 か所になる。
- MoonBit 側（`moonbit/examples/blog/site/site.mbt` の 146〜197 行）も同じ並びなので、同じ表に揃える。MoonBit では Content-Type とキャッシュ方針を enum（`Versioned | Daily`）で持つと、AGENTS.md の方針にも合う。

### 1.2 Post と Doc の読み込みの重複を寄せる

`posts.go` の `LoadPosts` と `loadPostBundle` は、「front matter の title、なければ最初の `#` 見出し、なければエラー」「description、なければ最初の段落」を同じ形で 2 回書いている。`docs.go` にも同じ判断がある。
`faceMeta(name string, meta map[string]string, doc Document) (title, description string, err error)` を 1 つ作り、3 か所から呼ぶ。エラーメッセージの文面も 1 か所に揃う。

あわせて、`Post.Collection` は `"slops"` と `""`（= posts）という文字列で、`collection()` で正規化している。Go でも `type Collection int`（`Posts`, `Slops`）にすると、`articleList` の `if collection == "slops"` のような比較と `/posts/` `/slops/` のパス組み立てがメソッドに集まる。
`Member` の `Markdown bool` と `SVG bool` も排他なので、`kind memberKind` 1 つにする（MoonBit 側はすでに sum types に寄せた。Go 側も「形」ではなく「排他な状態を 1 つの値で持つ」点だけ揃える）。

### 1.3 `newSite` の二段構え

`newSite` は、まず全 Post / Doc をマップに入れ、次に prev / next を解決してから、値のコピーを 4 つのマップ（`bySlug`、`byFile`、`byPath`、`bySource`）に入れ直している。
マップの値を `*Post` / `*Doc` にすれば、解決後の書き戻しが要らなくなり、「スライスとマップでコピーがずれる」種類のバグも起きなくなる。`site` は差し替えるだけで書き換えないので、ポインターで共有しても安全だ。

### 1.4 Go と MoonBit の一致を常に確かめる

`moonbit/examples/blog/compare` は Go のブログと Worker をパスごとに比べられるが、今は手で回す道具だ。
`make test` の一部として、slops / posts / docs の全ページと主要な 404・リダイレクトを比べるジョブにすると、AGENTS.md の「振る舞いを一致させる」がテストで守られる。
比べるパスの一覧は、Go 側から `sitemap.xml`（2.1）として出したものを使えば、新しいページを足したときに比較対象からもれない。

### 1.5 ルーティング

`route` の `switch` は、ツール系ページ（`/preview`、`/listen`、`/skim`）とスクリプトの分岐が増えるたびに長くなる。
1.1 で静的ファイルを表に出せば、残るのはページの分岐だけになる。ツール系ページも `map[string]func(...)` にしてよい。TinyGo の ServeMux が古いという制約（コメントにある）はそのまま守れる。

## 2. 機能の追加・洗練

### 2.1 Atom フィードと sitemap

今は更新を知る手段がページを開くことしかない。
`/feed.xml`（slops）、`/posts/feed.xml`（posts）を Atom で出す。中身は title、日付、description、記事 URL で足り、本文は入れない（入れるなら `renderer` を通した HTML）。
`sitemap.xml` と `robots.txt` も同じ一覧から作れる。どれも `pkg/el` の上に XML 用の小さな描画を足すか、`encoding/xml` を使う。MoonBit 側にも同じものを入れる必要があるので、要素の数は最小にする。

layout の `<head>` に `<link rel="alternate" type="application/atom+xml">` を足す。

### 2.2 目次

`/docs/TODO` のような長い文書や、節の多い slops 記事では、目次があると読みやすい。
見出しにはすでに `anchorIDs` で id が振られている（`anchors.go`）。最初の `Document` を走査して、レベル 2〜3 の見出しを `<details><summary>目次</summary><ul>…</ul></details>` にして本文の前に置く。
見出しが 3 つ未満のときは出さない。front matter に `toc: false` のようなキーを足すかは、`frontMatterKeys` を増やすことになるので、まず自動判定だけにする。
`TODO.md` の Future work にある `{#id}` 記法と組み合わせると、目次のリンクも安定する。

### 2.3 検索

記事は 58 本（2026-11-26 時点）で、まだ一覧を目で追える数だが、増えるペースは速い。
サーバー側の全文検索は Worker の制約に合わないので、`/search.json`（title、description、URL、日付だけ）を出し、ブラウザー側で絞り込む。
`/listen` と `/skim` にはファイルパスを fuzzy に絞り込む部分がすでにあるので、それを共有モジュールに切り出して使う。

### 2.4 更新日

`go/pkg/gitorder` で git の履歴を読めるので、ファイル名の日付（作成日）とは別に最終更新日を出せる。
slops の記事は後から追記されることが多いので、一覧とフィードの `updated` に使うと、どれが動いているかが分かる。
ただし Worker 側は git を読めないので、`content.bin` を作るとき（`scripts/content.sh`）に日付を一緒に詰める必要がある。

### 2.5 404 ページの候補

slug を打ち間違えたときや、記事の slug を変えたときのために、404 ページに「近い slug」を 3 つ出す。
編集距離を全記事と比べても 58 本なら無視できる時間で済む。

## 3. UX の洗練

### 3.1 一覧ページ

`articleList` は各記事をタイトルと日付だけのカードにしている。`Post.Description` は読み込み済みで、OGP にだけ使われている。

- カードに description を 1〜2 行（CSS の `line-clamp`）で出す。タイトルだけでは、slops の記事は中身の見当がつきにくい。
- 年月ごとに `h2` の見出しを入れ、記事の `h2` を `h3` に下げる。58 本が 1 列に並ぶ今の形より、どこまで読んだかを追いやすい。
- バンドルの記事には、メンバーの数（「3 節」など）を小さく出す。

### 3.2 記事ページ

- 長い記事の下にある前後ナビ（`relNav`）までの距離が長い。目次（2.2）と一緒に、スマホで「上へ戻る」を出す。sticky header があるので、ボタンは右下に小さく置く。
- `Download .md` と並べて「GitHub で見る / 編集する」リンクを置く。`repoHomeURL` と `File` から組み立てられ、誤字を見つけた人が直しに行ける。
- 読了時間の目安（文字数 ÷ 600 字/分 程度）をヘッダーの日付の隣に出す。`/skim` の速度設定と考え方を揃えられる。

### 3.3 ツール系ページ

- `more tools` の 3 つ（preview、listen、skim）は、どれも「記事を選ぶ / Markdown を貼る」部分を別々に持っている。記事ページからそのまま `/listen?path=…`、`/skim?path=…` で開けるリンクを記事ヘッダーに置くと、選び直す手間がなくなる。
- `/preview` の textarea の中身を `localStorage` に残す（`listen.js` は設定を残しているので同じ流儀でよい）。リロードで書きかけが消えないようにする。

### 3.4 アクセシビリティ

- `code-copy.js` のボタンは文言が "Copy" → "Copied" と変わるが、スクリーンリーダーには伝わらない。`aria-live="polite"` の領域に結果を書く。
- `details.dropdown` のメニューは Esc で閉じない。pico の挙動に任せず、`keydown` で `open` を外す数行を足す。

## 4. 性能の改善

### 4.1 測った数字

`go build` したブログを手元で立ち上げ、`curl` で取った（2026-11-26、embedded のまま、ウォームアップなし）。

| パス | サイズ | 時間 |
| --- | --- | --- |
| `/`（slops 一覧、58 本） | 13,935 B | 2.4 ms（最初のリクエスト） |
| `/docs/` | 7,517 B | 0.6 ms |
| `/docs/TODO` | 16,506 B | 0.8 ms |

`Accept-Encoding: gzip` を付けても圧縮されずに返り、`ETag` も `Last-Modified` もない。
描画は 1ms 前後で十分速いので、効くのは転送量と再訪時の往復のほうだ。

### 4.2 Go サーバー: ETag と事前圧縮

`site` は `-watch` で差し替わるまで不変なので、ページの中身も版ごとに不変だ。

- 描画した本文の SHA-256 の先頭を ETag にし、`If-None-Match` が合えば 304 を返す。`render` がすでにバッファーに書いているので、ハッシュを取るだけで足りる。
- gzip の結果を `site` の版ごとに `sync.Map` で覚える。`-watch` で `update` されたら版ごと捨てる。静的ファイル（1.1 の表）は起動時に一度だけ圧縮しておく。
- TinyGo 版（`workers/`）は Cloudflare が圧縮するので、ETag だけを共通にする。

### 4.3 Worker: 版を跨ぐキャッシュ

`worker.mjs` はアイソレートごとに 200 の応答を `Map` に持っているが、アイソレートが変わるたびに `content.bin` の読み込みと Wasm での描画をやり直す。

- デプロイごとの版（`content.bin` のハッシュ）を ETag に入れ、Cache API（`caches.default`）にも入れる。アイソレートを跨いで、コールドスタートの最初のリクエストも速くなる。
- `Cache-Control: public, max-age=60, stale-while-revalidate=86400` くらいを HTML に付ける。中身はデプロイでしか変わらないので、長めにしてよい。

### 4.4 ビルド時に全ページを描く案（測ってから決める）

中身がデプロイでしか変わらないなら、`make build` で全ページを描画して Static Assets に置き、Worker は `/preview` などの動的なものだけを持てばよい。
ただしこのリポジトリの目的は「Wasm で SSR する」実験なので、置き換えるのではなく、コールドスタートの p50 / p99 を比べる実験として `experiments/` に置く。
差が小さければ今の形のままでよい、という結論もありうる。

### 4.5 クライアント側

- `preview.wasm` は 69,745 B。`/preview` を開いたときだけ読まれるので急がないが、Static Assets の圧縮後のサイズも記録しておく（`moonbit-workers-wasm.md` のサイズ比較の続き）。
- `skim.js` は BudouX を esm.sh から読む。オフラインや esm.sh の障害時にはフォールバックするが、毎回外へ取りに行くので、Static Assets に置いて同じオリジンから配る。

`pkg/el` と `pkg/tinymarkdown` のホットパスは `TODO.md` の profiler の項目で扱っている。

## 5. `tools/svg-gen`（優先度は下げる）

図を描くための道具で、ブログ本体の利用者には直接見えない。ただ、記事の図の品質はここで決まるので、小さい修正は早めに入れる。

### 5.1 `aria-label` の `"` が属性を壊す（バグ）

`svg.mbt` の `esc` は `&`、`<`、`>` だけをエスケープする。`<text>` の中身にはこれで足りるが、869 行目の `aria-label="\{esc(l)}"` と 319 行目の `stroke="\{esc(color)}"` は属性値なので、`"` が来ると属性がそこで終わる。
図の説明文に引用符を含めると、壊れた SVG（あるいは意図しない属性）になる。属性用に `"` も `&quot;` にする `esc_attr` を分ける。`check.mbtx` に「属性値の中の生の `"`」の検査はないので、テストも足す。

### 5.2 文字幅の見積もり

`text_width` は、コードポイントが `0x2e80` より大きければ全角（1.0）、そうでなければ 0.55 と見なしている。

- 半角カナ（U+FF61〜U+FF9F）と、全角記号の一部が全角扱いになり、箱が広くなりすぎる。
- 英字は `i` と `W` で幅が倍以上違うので、英語のラベルでは見積もりが外れやすい。
- 絵文字や結合文字（濁点の結合など）は 1 文字として数えられない。

文字種ごとの小さな幅表（狭い英字、広い英字、数字、半角カナ）を持ち、`check.mbtx` と同じ関数を使う。見積もりを変えると既存の図の viewBox が全部変わるので、`build/*.svg` の差分を一度確かめてから入れる。

### 5.3 生成物と記事の中の SVG がずれる

図は `make -C tools/svg-gen` で `build/*.svg` に出し、それを記事の ` ```svg ` フェンスに貼っている。
生成器を直しても、記事の中の SVG は自動では変わらず、どの記事がどの生成器から来たかもコードからはたどれない。

- 記事の SVG の先頭に `<!-- svg-gen: fig-loop -->` のコメントを入れる約束にする（生成器が出力に含める）。
- `check` に「記事中のその SVG が `build/fig-loop.svg` と一致するか」を足す。違えば警告し、`-w` で書き戻せるようにする（`slops-fmt` と同じ流儀）。

### 5.4 ビルド時間

`examples/` には 89 個の `.mbtx` があり、`make svg` はそれぞれ `moon run` を 1 回ずつ呼ぶ。
Makefile はパターンルールなので、`make -j` で並列にできる（`vendor` が先に終わる必要があるので、`vendor` を order-only prerequisite `| vendor` に直す）。
さらに速くしたければ、1 回の `moon run` で複数の図を出す「まとめ実行」の生成器を作る。ただし 1 図 1 ファイルの読みやすさは残したいので、まず `-j` だけを入れて測る。

## 進め方

1. 表の「高」から、1 項目 1 PR で進める（`docs/develop.md` の stacked PR の手順）。Go と MoonBit の両方に入るもの（2.1、2.2、3.1）は、Go で形を決めてから MoonBit に移し、`compare` で一致を見る。
2. 性能の項目は、変える前と後の数字を `profiling-go.md` か新しいメモに残す。
3. 着手するものから `TODO.md` に移す（`.agents/skills/todo-md/SKILL.md` に従う）。このメモは候補の置き場で、全部をやるとは限らない。
