# TODO

> **このファイルの更新について:** 運用ルールは
> [`.claude/skills/todo-md/SKILL.md`](.claude/skills/todo-md/SKILL.md) にある。
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
- [x] **`TestEmbeddedHumanBundle` が posts の記事追加で落ちる**:
  go/examples/blog/internal/site/collections_test.go が posts を
  wsl-opencode の1件だけと決め打ちしているので、
  posts/2026-10-27-why-ai-novel-is-bored.md を足した 2bcf887 から
  `make test-go` が落ちる。件数ではなく wsl-opencode の束を探して
  確かめる形にする。

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
