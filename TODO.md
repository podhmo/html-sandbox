# TODO

> **このファイルの更新について:** 運用ルールは
> [`.claude/skills/todo-md/SKILL.md`](.claude/skills/todo-md/SKILL.md) にある。
> タスクを追加・完了するときは必ずそれに従う。要点: このファイルには着手できる
> 作業だけを書く（`[ ]` / `[-]`）。終わった作業は `[x]` にし、定期的な GC で
> `TODO-archive.md` に移す。

このファイルは着手できるタスクだけを管理する。完了した作業は、定期的な GC で
`TODO-archive.md` に移す。

## To Be Implemented

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
- [ ] **MoonBit の http ライブラリから非同期の I/O を使えるようにする**: `serve` は
  同期なので、ハンドラーから KV、R2、D1、Static Assets、外への `fetch` を呼べない。
  JSPI（`WebAssembly.Suspending` / `promising`）で Wasm から JS の `fetch` を待つ形が、
  spike（`moonbit/experiments/wasm-fetch`）では Node と `wrangler dev` で動いた。これをライブラリに取り込み、
  本番の Workers で確かめる。上の Static Assets の TODO の「文章を Wasm にどう渡すか」とつながる。
  [探索メモ](docs/sketch/ja/moonbit-workers-http.md)の「ライブラリとして出すときに考えること」を参照。
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
- [ ] **MoonBit 版のブログで、記事と文書の解析を isolate の起動時に移す**: 今は
  最初のリクエストで解析している（`worker.mbt` の `Ref(None)`）。ts 版では、起動時に
  解析すると Startup Time は 3 ms から約 13 ms に増えたが、新しい isolate に当たった
  リクエストの CPU 時間は 18〜43 ms から 0〜3 ms に減った（[探索メモ](docs/sketch/ja/ts-hono-workers.md)の「デプロイ」）。
  MoonBit 版でも同じことが起きるかを確かめる。
  - 完了の条件: `make compare` で Go 版と一致したまま、Startup Time と `wrangler tail` の
    `cpuTime` を、今の形と比べて[調査メモ](docs/sketch/ja/moonbit-workers-wasm.md)に記録する。
- [-] **Go と MoonBit の `pkg/el` と `pkg/tinymarkdown` に profiler をかけて速くする**:
  profiler で 2 つのパッケージの重いところを見て、確保と走査を直す。まず Go 版から
  （[調査メモ](docs/sketch/ja/profiling.md)、[issue #39](https://github.com/podhmo/html-sandbox/issues/39)）。
  - [x] Go 版: ベンチを足し、pprof で `tinymarkdown.cells` と `inlines` の走査、
    タグと属性の文字列連結を直した。`Parse` は 85 µs から 56 µs、描画は 97 µs
    から 62 µs になり、描画のアロケートは 0 になった
    （[調査メモ](docs/sketch/ja/profiling-go.md)）。
  - [ ] Go 版（実験）: API を変えて `Inline` をインターフェースから構造体にし、
    `Inlines` の確保を減らす。速くなったかを[調査メモ](docs/sketch/ja/profiling-go.md)の
    追記に記録する。マージするかは未定で、`go-aggressive-tinymarkdown` の枝に置く。
  - [ ] Go 版（実験）: ライターを `io.StringWriter` にして `io.WriteString` を外し、
    描画の CPU を 20% 減らす。速くなったかを[調査メモ](docs/sketch/ja/profiling-go.md)の
    追記に記録する。マージするかは未定で、`go-aggressive-el` の枝に置く。
  - [x] MoonBit 版: `moon bench` で前後を取り、`perf` と `addr2line` で内訳を
    見て、Go 版で効いたところ（セル、インラインの走査、タグと属性の連結）を
    なぞった。行とセルも `StringView` のまま引き回した。`parse` は native で
    186 µs から 70 µs、wasm-gc で 299 µs から 109 µs、`render_html` は
    108 µs から 67 µs / 233 µs から 191 µs になった。出力は変えておらず、
    `make check` が通る（`make compare` はこの環境では回していない）
    （[調査メモ](docs/sketch/ja/profiling-moonbit.md)）。
  - [x] MoonBit 版（ガイド）: `moon run --profile` / `moon test --profile` の仕組み、
    生成されるファイル、結果の読み方を、その 1 枚で完結するように書いた。この環境の
    `perf` では集計が空になる理由（libdw が無く DWARF の call graph を展開できない、
    `cpu-clock` に CPU 属性が無くヘッダを認識できない）と、`perf` と `nm` で
    self time を取る代替手順も入れた。題材は `moonbit/experiments/profile-demo`
    （[ガイド](docs/sketch/ja/profiling-moonbit-guide.md)）。
  - [x] MoonBit 版（ガイド、追試）: 何も知らないセッションにガイドだけを与え、naive 実装
    だけのプロジェクトで同じ改善を追試させて自己完結性を確かめた（約55〜61倍、出力一致）。
    引っかかったところ（`ldd` の判定、moon の `perf.data` には `ip` も残らないこと、
    `--no-strip` の実行ファイルが通常のビルドで差し替わること、`top.py` の仕様と
    実行ファイルのパスが書かれていないこと）を直し、`top.py` の全文を付録に入れた。
    修正後にもう一度追試して約60倍で同じ結果を確認し、残った事実誤り2件（`--no-strip`
    で名前が別の関数に化ける仕組みの説明、§3 の成功例が libc の行を含んでいたこと）を直した
    （[ガイド](docs/sketch/ja/profiling-moonbit-guide.md)、
    [PR #51](https://github.com/podhmo/html-sandbox/pull/51)）。
- [-] **`moon run --profile` が空になる原因を切り分けて直す**: この環境（WSL2）では
  `moon run --profile` が常に `Samples: 0` になる。原因は、環境側では perf が libdw /
  libelf を持たずにビルドされていること、moon 側では `perf record` に `--sample-cpu` を
  付けずパーサがヘッダの `[cpu]` を必須にしていることの 2 つだった
  （[issue #52](https://github.com/podhmo/html-sandbox/issues/52)）。
- [ ] **記事のセクションに `id` を付けて `#` リンクが届くようにする**: 今は
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
- [ ] **ts 版のブログが front matter の `prev` と `next` で起動できない**:
  記事が `prev:` / `next:` を持つようになったが（
  [docs/sketch/ja/blog.md](docs/sketch/ja/blog.md)）、ts 版の
  `frontMatterKeys`（ts/examples/blog/src/content.ts）は `title` と
  `description` しか認めないので、`loadPosts` が例外で止まり
  `app.test.ts` が落ちる。Go 版と MoonBit 版の relNav（記事末の
  前後リンク）に相当するものもまだない。

### Future work

- [ ] **```svg ブロックの中身をサニタイズする**: ```svg フェンスのブロックは
  中身をそのまま HTML に書くので、`<script>` や `on*` 属性、`foreignObject`
  経由でブログと同じオリジンのスクリプトが動く。今は記事の作者=自分なので
  意図どおりだが、要素/属性の allowlist 方式のサニタイザーを Go と MoonBit
  に同じ形で入れると安心（Devin Review SEC finding 由来）。

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

- [ ] **記事に図を載せられるようにする**: [同じ wasm をブラウザーと Worker で
  動かしたい](posts/2026-10-21-moonbit-browser.md)のように、ブラウザー、Worker、
  workerd、wasm の関係を図で示したくなる。図をテキストのまま Markdown に書き、
  ページでは図として見せたい。tinymarkdown のコードブロックは言語名を持つ
  ようになり（`CodeBlock(String, info~)`）、\`\`\`svg フェンスのブロックは
  inline の `<svg>` として描画される。記法は mermaid/graphviz などもあるので
  svg 直書きで足りるか、どこで描くか（ビルド時、Worker、ブラウザー）を決める。
  画像で済ませる道もあるので、下の画像の TODO より先に考える。

- [-] **記事に画像を載せられるようにする**: バンドルの `.svg` メンバーが
  `image/svg+xml` で配信され、ページでは `<img>` として表示されるようになった
  （[バンドルの例](posts/2026-10-22-bundle-demo.md)）。`![]()` の画像記法と
  `data:` URI は未対応、メンバーはテキストしか持てないので PNG/JPEG など
  バイナリー画像は載せられない。置き場所（リポジトリに入れて埋め込む、R2 など
  外に置く）と、tinymarkdown の画像の記法から決める。

- [ ] **バンドルメンバーのファイル名を URL エスケープする**: `#` や `?`、空白を
  含むメンバー名は、セクションのリンクや `<img src>`（`base + "/" + m.Name`）が
  そのまま置くのでブラウザーで別のパスとして解釈されて 404 になる。
  `<a href>` の時点で同じ問題なので svg 固有ではない。パーセントエンコードで
  作る URL と、Go/MoonBit 両方のルーティングでのデコード側の一致も要確認。
