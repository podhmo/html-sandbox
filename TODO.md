# TODO

> **このファイルの更新について:** 運用ルールは
> [`.agents/skills/todo-md/SKILL.md`](.agents/skills/todo-md/SKILL.md) にある。
> タスクを追加・完了するときは必ずそれに従う。要点: このファイルには着手できる
> 作業だけを書く（`[ ]` / `[-]`）。終わった作業は `[x]` にし、定期的な GC で
> `TODO-archive.md` に移す。

このファイルは着手できるタスクだけを管理する。完了した作業は、定期的な GC で
`TODO-archive.md` に移す。

## To Be Implemented

- [ ] **MoonBit の http ライブラリから非同期の I/O を使えるようにする**: `serve` は
  同期なので、ハンドラーから KV、R2、D1、Static Assets、外への `fetch` を呼べない。
  JSPI（`WebAssembly.Suspending` / `promising`）で Wasm から JS の `fetch` を待つ形が、
  spike（`moonbit/experiments/wasm-fetch`）では Node と `wrangler dev` で動いた。これをライブラリに取り込み、
  本番の Workers で確かめる。上の Static Assets の TODO の「文章を Wasm にどう渡すか」とつながる。
  [探索メモ](docs/sketch/ja/moonbit-workers-http.md)の「ライブラリとして出すときに考えること」を参照。
- [-] **Go と MoonBit の `pkg/el` と `pkg/tinymarkdown` に profiler をかけて速くする**:
  profiler で 2 つのパッケージの重いところを見て、確保と走査を直す。まず Go 版から
  （[調査メモ](docs/sketch/ja/profiling.md)、[issue #39](https://github.com/podhmo/html-sandbox/issues/39)）。
  - [ ] Go 版（実験）: API を変えて `Inline` をインターフェースから構造体にし、
    `Inlines` の確保を減らす。速くなったかを[調査メモ](docs/sketch/ja/profiling-go.md)の
    追記に記録する。マージするかは未定で、`go-aggressive-tinymarkdown` の枝に置く。
  - [ ] Go 版（実験）: ライターを `io.StringWriter` にして `io.WriteString` を外し、
    描画の CPU を 20% 減らす。速くなったかを[調査メモ](docs/sketch/ja/profiling-go.md)の
    追記に記録する。マージするかは未定で、`go-aggressive-el` の枝に置く。
- [-] **`moon run --profile` が空になる原因を切り分けて直す**: この環境（WSL2）では
  `moon run --profile` が常に `Samples: 0` になる。原因は、環境側では perf が libdw /
  libelf を持たずにビルドされていること、moon 側では `perf record` に `--sample-cpu` を
  付けずパーサがヘッダの `[cpu]` を必須にしていることの 2 つだった
  （[issue #52](https://github.com/podhmo/html-sandbox/issues/52)）。
- [-] **記事をブラウザーの TTS で聞けるようにする（`/listen`）**: ヘッダーの `preview`
  を `<details>` のドロップダウン `more tools`（preview と listen）にし、`/listen` でファイルパスを fuzzy に絞り込んで選ぶとそのページの記事を、
  Markdown を貼ると `preview.wasm` で描画した DOM を、Web Speech API で文ごとに読む。
  Go と MoonBit の両方に入れる（[issue #95](https://github.com/podhmo/html-sandbox/issues/95)）。
  - [ ] 任意: 見出しの前後や文・ブロックの間隔を設定できるようにする。
- [ ] **Qwen3-TTS を vLLM バックエンドで動かして実時間に届くか確かめる**: 素の `qwen-tts` では
  RTF 1.5〜1.9 で、GPU 使用率 25% 前後のまま Python の生成ループが律速している。WSL2 + RTX 5060 8GB
  （root なし）で vLLM が sm_120 / cu13 で入るか、RTF が 1.0 を切るかを測って追記する
  （[調査メモ](docs/sketch/ja/tts-wsl2.md)、[PR #127](https://github.com/podhmo/html-sandbox/pull/127)）。
- [ ] **slops-nav が同じ日付の既存記事で prev/next の食い違いを 22 件報告する**: `cd tools/slops-nav && go run . ../../slops`
  が 10-24〜10-29 と 11-05 の同日記事について、git の追加順（`go/pkg/gitorder`）と front matter の prev/next が
  合わないと報告する（2026-11-07 時点、新しい記事とは無関係）。`-w` で直すか、並びが意図どおりなら追加順の判定側を見直すかを決める。
- [x] **slops の Markdown を整える normalizer を作る**: `*` の太字・強調（`**bold**`、`*em*`）は
  write-slops で禁止しているが、AI の出力に残りやすい。lint で見つけて書き直させるのではなく、
  gofmt のように通すだけで `*` の強調を外した文に直す normalizer を作る（`* ` のリスト記号はそのまま）。
  できたら write-slops のスキルに、記事を書いたあと（`/preview` 用の Markdown も含む）に
  これをかけるという指定を足す（[issue #142](https://github.com/podhmo/html-sandbox/issues/142)）。
  - [x] SVG のコードブロックに ` ```svg ` のラベルを補う: `/preview` に渡す tinymarkdown を AI との対話で
    作らせると、指定があってもフェンスの `svg` ラベルが漏れることが多い（ラベルがないと画像にならずコードとして出る）。
    中身が `<svg` で始まるラベルなしのフェンスに `svg` を付ける。
- [x] **モバイルで長いインラインコードが横スクロールを起こす**: pico が `code` を
  inline-block にするため、空白のないパスなどが本文の幅を超えていた。site.css で
  `pre` 外の `code` に `overflow-wrap: anywhere` を付けた
  （[issue #153](https://github.com/podhmo/html-sandbox/issues/153)）。
- [ ] **MoonBit 側に残った sentinel 値とフラグを sum types / Option に寄せる**:
  [issue #158](https://github.com/podhmo/html-sandbox/issues/158) の対応で
  `moonbit/` 全体を走査して見つかった未対応の候補。判定基準と「enum にしない
  もの」の線引きは[記事](slops/2026-11-11-moonbit-sum-types.md)に整理済み。
  - [ ] `links.mbt` の `Ref` が無い `scheme`/`query`/`fragment` を `""` で保持
    → `String?`（`priv` なので `Ref::parse` と `resolve` の中で完結する）
  - [ ] `nav.mbt` の `page_title` の `""` 返しと `views.mbt` の
    `PageMeta.title` の `""`（トップページ）→ `String?`
  - [ ] `worker.mbt` と adapter-abi 各種が「未ロード/ロード済み」を `base_url`
    と `site` の2変数の同期で表現 → `Unloaded | Loaded(base~, result~)` enum
  - [ ] `inline.mbt` の `closing_run` と `tinymarkdown.mbt` の
    `nest_items(parent=-1)` の `-1` → `Int32?`
  - [ ] 弱い候補: `content.mbt` の `Doc.members` を `Array[Member]?` にするか
    どうか決める。`router` の `Route.subtree : Bool` は固有フィールドを持た
    ないので見送り方向

### Future work

- [ ] **見出しの `{#id}` 記法で明示的な id を付けられるようにする**: 自動
  スラッグ化（issue #69）はタイトルから id を作るので、タイトルの変更や
  翻訳で id が揺れる。Pandoc 式の `## 見出し {#my-id}` を tinymarkdown の
  構文拡張として入れると、表示と独立した安定した id が書ける
  （[issue #69](https://github.com/podhmo/html-sandbox/issues/69) の
  コメントで先送りに決めた）。

- [ ] **```svg ブロックの中身をサニタイズする**: ```svg フェンスのブロックは
  中身をそのまま HTML に書くので、`<script>` や `on*` 属性、`foreignObject`
  経由でブログと同じオリジンのスクリプトが動く。今は記事の作者=自分なので
  意図どおりだが、要素/属性の allowlist 方式のサニタイザーを Go と MoonBit
  に同じ形で入れると安心（Devin Review SEC finding 由来）。なお
  `/preview` は textarea の任意入力をそのまま描くので、他人が用意した
  Markdown を貼ると被害者のブラウザーでスクリプトが動きうる（
  [PR #77](https://github.com/podhmo/html-sandbox/pull/77) の
  Devin Review でも指摘）。

- [ ] **記事に図を載せられるようにする**: [同じ wasm をブラウザーと Worker で
  動かしたい](slops/2026-10-21-moonbit-browser.md)のように、ブラウザー、Worker、
  workerd、wasm の関係を図で示したくなる。図をテキストのまま Markdown に書き、
  ページでは図として見せたい。tinymarkdown のコードブロックは言語名を持つ
  ようになり（`CodeBlock(String, info~)`）、\`\`\`svg フェンスのブロックは
  inline の `<svg>` として描画される。記法は mermaid/graphviz などもあるので
  svg 直書きで足りるか、どこで描くか（ビルド時、Worker、ブラウザー）を決める。
  画像で済ませる道もあるので、下の画像の TODO より先に考える。

- [-] **記事に画像を載せられるようにする**: バンドルの `.svg` メンバーが
  `image/svg+xml` で配信され、ページでは `<img>` として表示されるようになった
  （[バンドルの例](slops/2026-10-22-bundle-demo.md)）。`![]()` の画像記法と
  `data:` URI は未対応、メンバーはテキストしか持てないので PNG/JPEG など
  バイナリー画像は載せられない。置き場所（リポジトリに入れて埋め込む、R2 など
  外に置く）と、tinymarkdown の画像の記法から決める。

- [ ] **バンドルメンバーのファイル名を URL エスケープする**: `#` や `?`、空白を
  含むメンバー名は、セクションのリンクや `<img src>`（`base + "/" + m.Name`）が
  そのまま置くのでブラウザーで別のパスとして解釈されて 404 になる。
  `<a href>` の時点で同じ問題なので svg 固有ではない。パーセントエンコードで
  作る URL と、Go/MoonBit 両方のルーティングでのデコード側の一致も要確認。
