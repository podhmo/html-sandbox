# 根拠と留保（仮）

README の骨子を点検するための資料。相対リンクはこのバンドルのディレクトリを起点にしており、GitHub とブログの両方で根拠をたどれる形にしている。外部サービスの現在の仕様や、過去のベンチマーク結果の再現を今回のレポートが保証するものではない。

## 本人の言葉に近い材料

- [既存の人間記事の README](../2026-10-19-wsl-opencode.md/README.md): 手順と開発者向け補足を別ファイルにし、異なる取捨選択への関心を記す。解説の価値を「実際に動作するという疎通確認」に見出す前置きと、生成文への率直な感想がある。AI の本文が述べる思想すべてを、本人の確定した意見として扱うのは避ける。
- [バンドルの記事](../../slops/2026-10-22-bundle.md): 「今後の展望」に、複数ファイルの配置は高優先度、画像表示やハイライトは低め、Markdown のダウンロード・セクション ID・前後記事リンクは重視、と明記されている。ただし、この文書自体は `slops` に置かれているため、本人の逐語的な発言であるとは保証できない。実装と照合できる、リポジトリ内の方針表明として扱う。
- [Go から MoonBit への記事](../../slops/2026-10-18-moonbit.md): JS ではなく Wasm にした理由を「ロマン」と書く。同じ記事に、Go をローカル執筆用サーバーと比較基準として残す説明もある。
- [プレビューの記事](../../slops/2026-10-25-preview.md): スマホから LLM の生成した Markdown を仮当てしたかったこと、ファイル入力が欲しかった理由、サイトと同じ renderer を使うこと、確認後に JS フォールバックを捨てた判断がある。
- [SVG の記事](../../slops/2026-10-26-draw-svg-with-llm.md): 一発生成の出来より、レンダリングして見比べ、部分的に直すループを重視する。小さい SVG でかわいいタヌキを表示したい、という具体的な欲求から実験が始まっている。画像の優先度が低いという以前の記述とも矛盾しない。必要になったところから試す例として読める。

## 読みやすさと共有の土台

- [最初のブログのスケッチ](../../docs/sketch/ja/blog.md): 目的は「スマートフォンで快適に読める SSR のブログ」。日付、見出し、エラーページ、OGP、モバイル向けの表示などを設計する。
- [現在の CSS](../../go/examples/blog/internal/site/site.css): 日本語の行間、見出しサイズ、文節での折り返し、狭い画面のリスト、画像や SVG、プレビューの幅を扱う。
- [見出しリンクの記事](../../slops/2026-10-25-permalink.md)と[実装](../../go/examples/blog/internal/site/anchors.go): スマホには hover がないので `#` を常時表示する。ID の重複を避け、Go・MoonBit・TypeScript の同一規則を優先する。日本語を捨てる ASCII 限定案、連番案、ハッシュ案などとの比較も題材になる。
- [ビュー](../../go/examples/blog/internal/site/views.go): 記事一覧、日付、本文、OGP、原文取得、前後記事のナビゲーションが同じ仕組みで組まれている。華美な機能を後回しにしても、記事を共有し、必要な場所へ移る機能は持つ。

## 原文と複数ファイルを大事にする仕組み

- [ルート README](../../README.md): `slops`、`posts`、`docs` の役割と、記事バンドルの契約がある。トップは AI 記事、`posts` は人間記事。保存場所は区別するが、著者を検証する機能ではない。
- [記事ローダー](../../go/examples/blog/internal/site/posts.go)と[メンバーのローダー](../../go/examples/blog/internal/site/members.go): 単体ファイルと `.md` ディレクトリを記事として読む。`README.md` があれば顔にし、残りをファイルごとに保持する。サブディレクトリは許さない。
- [ルーティングと原文配信](../../go/examples/blog/internal/site/server.go)および[ビュー](../../go/examples/blog/internal/site/views.go): 記事と docs の `.md`、バンドルメンバーを配信し、画面にも原文取得の入口を置く。SVG メンバーは画像として、それ以外のコード等はテキストとして表示する。
- [リンク解決](../../go/examples/blog/internal/site/links.go): 原本のファイルを基準に相対 URL を解決する。配信対象はサイトへ、それ以外は GitHub の main へ。前後記事リンクは記事・文書のページに向けるため、単なる GitHub ファイルへのフォールバックを使わない。
- [現在の TODO](../../TODO.md): 画像記法、バイナリー画像、明示的な見出し ID などは残作業。SVG の表示をもって画像対応が全部完成したとはしない。

## docs と TODO の意図を支えるもの

- [設計方針](../../docs/ja/design.md): Go 標準ライブラリ、純粋なデータとしての Node、別の Renderer、型の違う要素・属性名、小さい API などの意図を説明する。今の全実装に共通する禁止事項の一覧としては読まない。
- [配置のメモ](../../docs/ja/layout.md): 数か月後の自分が分かることを目安にし、作業中は散らかっていてよいとする。保守するライブラリとアプリ、数字を再現するために残す実験を分け、依存の向きも定める。
- [TODO の運用規則](../../.claude/skills/todo-md/SKILL.md)と[背景](../../.claude/skills/todo-md/why.md): TODO に着手できる作業を置き、詳細は docs や履歴へ。完了した項目は別の整理作業でアーカイブへ移す。人間にも LLM にも読み切れない巨大な TODO を再発させないための設計と説明されている。
- [文書ローダー](../../go/examples/blog/internal/site/docs.go): 配信対象に `TODO.md` と `docs` が明示されている。`TODO-archive.md` はこの公開対象には含まれない。
- [文書一覧のメタデータ](../../docs/blog.metadata.json)と[その処理](../../go/examples/blog/internal/site/metadata.go): 設計・探索メモを前方、profiling 関連を後方に置くなど、単なるディレクトリの羅列とは別の読み順を作っている。
- [Go のベンチマーク](../../go/pkg/tinymarkdown/bench_test.go)と[MoonBit のベンチマーク](../../moonbit/pkg/tinymarkdown/bench_test.mbt): リポジトリの大きな文書を入力にする。docs は説明文書であると同時に、ブログやパーサーが実際に読む入力でもある。

ここから「人間と AI が同じ仕事の続きを始める足場」と読むのは解釈。ただし TODO の可読性に LLM も含めて考えていることは、運用規則の背景に明記されている。

## 技術的な楽しみの候補

- HTML の組み立てそのもの。[Go の Node](../../go/pkg/el/node.go)と[Renderer](../../go/pkg/el/render.go)、[MoonBit の Node](../../moonbit/pkg/el/node.mbt)と[描画](../../moonbit/pkg/el/render.mbt)に、データと描画を分ける設計がある。表示だけでなく plain text にも出せ、構造を比較できる。
- 小さな Markdown を自分で扱うこと。[Go](../../go/pkg/tinymarkdown/tinymarkdown.go)、[MoonBit](../../moonbit/pkg/tinymarkdown/tinymarkdown.mbt)、[インライン解析](../../moonbit/pkg/tinymarkdown/inline.mbt)、[front matter](../../go/pkg/tinyfrontmatter/tinyfrontmatter.go)を小さい構造として持つ。GitHub 風のアラートなど、記事で使いたいものから機能が増える。
- 同じものを別の場所へ持っていくこと。[TinyGo の探索](../../docs/sketch/ja/blog-tinygo-workers.md)、[MoonBit の探索](../../docs/sketch/ja/moonbit-workers-wasm.md)、[ブラウザーの探索](../../docs/sketch/ja/moonbit-browser-render.md)、[Wasm 同士の接続](../../docs/sketch/ja/moonbit-wasm-pair.md)がある。「動いた」で終わらず、何が同じで、どこが違ったのかが次の問いになる。
- 実行環境の境界を調べること。[ABI の比較](../../docs/sketch/ja/moonbit-workers-adapter.md)には、コード単位で渡す、まとめて渡す、線形メモリ、文字列 builtins などの比較がある。[HTTP の切り出し](../../docs/sketch/ja/moonbit-workers-http.md)からは、ブログに不要だった要求本文やヘッダーも扱う汎用部品へ進む。
- 素直な方法との比較。[Hono 版の探索](../../docs/sketch/ja/ts-hono-workers.md)は、Wasm のために自分で書いた糊がどれだけ不要になるかを確かめる。[TS のビュー](../../ts/examples/blog/src/views.tsx)は `hono/jsx` を使い、Go の `el` を移植しない。
- 共有することの代償も調べること。[MoonBit の JS ビルドの探索](../../docs/sketch/ja/moonbit-js-tinymarkdown.md)と[TS 側の型・再 export](../../ts/pkg/tinymarkdown/tinymarkdown.ts)では、パーサーの実装を共有する代わりにサイズや起動時間を払う。front matter の置き換えは Worker で起動せず見送った記録もある。
- 計測から直すこと。[Go の profiling](../../docs/sketch/ja/profiling-go.md)と[MoonBit の profiling](../../docs/sketch/ja/profiling-moonbit.md)は、確保や走査を調べ、改善しなかった案も残す。[profiler のガイド](../../docs/sketch/ja/profiling-moonbit-guide.md)、[環境の切り分け](../../docs/sketch/ja/profiling-moonbit-setup.md)、[実験コード](../../moonbit/experiments/profile-demo/work/work.mbt)へ話が広がる。
- 実験を保存しつつ本体を整理すること。[実験の一覧](../../moonbit/experiments/README.md)、[modernize の記録](../../docs/sketch/ja/moonbit-modernize.md)、[配置のメモ](../../docs/ja/layout.md)に、そのまま残すものと保守するものの判断がある。新しい書き方にできることと、採るべきことも分けている。
- 出力を物差しにすること。[比較コード](../../moonbit/examples/blog/compare/compare.mbt)は status、Content-Type、本文を比較する。[HTTP/Wasm の統合テスト](../../moonbit/pkg/http/wasm/integration/test.mjs)は境界の受け渡しを別に検証する。テストが通ることと、別環境で動くことは同じ確認ではない。

## 過去の記述を現在の断言にしないための注意

- 「JavaScript を使わない」は初期スケッチの制約。現在の通常ページは[コピー用 JS](../../go/examples/blog/internal/site/code-copy.js)を読み、プレビューは[Wasm を呼ぶ JS](../../go/examples/blog/internal/site/preview.js)を使う。
- 「依存ゼロ」は Go 側の設計の文脈。現在のサイトは pico.css を CDN から使い、TypeScript は Hono 等を使い、MoonBit 側にもツールチェーンや比較 CLI の依存がある。リポジトリ全体が標準ライブラリだけとは書かない。
- 「同じ renderer」は「同じ Wasm バイナリー」を意味しない。現在の Workers 版は線形メモリの ABI、ブラウザーのプレビュー版は JS string builtins を使う別のビルドになっている。
- 「Workers では builtins が使えない」という古い記事のあとに、[ABI 比較メモ](../../docs/sketch/ja/moonbit-workers-adapter.md)の追試がある。そこではローカルと本番で動作確認したと記録されているが、速度やパスのデコードの違いから現行方式を維持する。単純な不可能論でロマンを説明しない。
- [Static Assets の検討](../../docs/sketch/ja/moonbit-static-assets.md)は、HTML の事前生成を「Wasm で動かす目的から外れる」とする。現在は[Worker](../../moonbit/examples/blog/cloudflare/worker.mjs)が内容を読み、[Wasm の入口](../../moonbit/examples/blog/worker/worker.mbt)がサイトを組む。全アクセスで毎回再解析している、という意味ではない。
- 出力一致を目指していても、全実装の機能が常に揃うわけではない。現在の TODO には、TS 版の `prev` / `next` 対応とプレビュー追加が残る。ただし[現在の TS ローダー](../../ts/examples/blog/src/content.ts)はすでに `prev` / `next` キーを許可しており、[ビュー](../../ts/examples/blog/src/views.tsx)には Go・MoonBit と同じ前後ナビゲーションがない。TODO にある起動エラーの説明と、今残っている実装の差も区別する。過去の比較成功を、現在の三実装の完全一致と書かない。
- SVG はそのまま描画する経路を持ち、サニタイズは TODO に残る。「読みやすく安全に扱えること」は望む土台だが、すでにすべて実現したという説明にはしない。
- TODO は意図や残作業を読む資料であり、実装の状態を機械的に証明する資料ではない。たとえば Go の Renderer の Writer は現在 `io.StringWriter` だが、関連実験は TODO にも記載されている。保留や完了を、このレポートの判断だけで書き換えない。

## まだ本人にしか決められないこと

- 主な読者が人間なのか、未来の自分なのか、AI なのか。このレポートは全部を読者候補にしたが、本人の順位付けは確認していない。
- 「人間が監督する AI の文章」を `posts` と呼ぶとき、どの程度の確認を条件にしたいか。現行のディレクトリ構造からは決められない。
- SEO、収益化、コメント、検索、タグへの本当の関心。main に機能がないことだけでは、低優先度とも不要とも言い切れない。
- どの寄り道が一番楽しかったのか。資料から候補は出せるが、その実感を AI が補作して本人の体験としては書けない。
