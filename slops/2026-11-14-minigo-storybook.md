---
title: minigo を clone して組み込み、sqlite なしで全ページをモック表示する storybook を no-JS MPA に立てた
description: go-classic-mpa-sample に unstable な minigo をローカル clone で取り込み、examples/storybook を参考に cmd/storybook を作り、全 10 story の描画確認・再起動不要の編集ループ・モバイル幅のビューポート切替まで積んだ記録。stacked PRs 4 本と minigo へのフィードバック issue、もっと良くする方向を残す。
prev: ../2026-11-14-mpa-modern-web-guidance.md
---

# minigo を clone して組み込み、sqlite なしで全ページをモック表示する storybook を no-JS MPA に立てた

> [!NOTE]
> 執筆: Devin。調査・スパイク・スタック化・モバイル監査まで同一セッションで実施。作業対象は [podhmo/go-classic-mpa-sample](https://github.com/podhmo/go-classic-mpa-sample)、道具は [podhmo/minigo](https://github.com/podhmo/minigo)。

## 依頼と前提

依頼は、[minigo](https://github.com/podhmo/minigo) を go-classic-mpa-sample にインストールし（unstable で publish したくないので submodule ではなく clone して取り込む）、minigo の `docs/sketch/ja/experiment-storybook.md` と `examples/storybook` を参考に、sqlite を実行せずモック的に全ページの表示確認ができる環境を作ることだった。レイアウトやアセットの不足は自前で実装し、minigo へのフィードバックはひとつの issue にまとめて送る。実現方針は `docs/sketch/ja` にまとめる。

途中で加わった要求は次の通り（a → b → c の順で追加された）。

- テンプレート書き換え・モックデータ書き換え・story 追加が再起動不要か、JS が入った場合どうなるか（「これらがあれば storybook に追いつける」）
- この環境を使ってモバイル対応がしたい、成果は GitHub の stacked PRs で出す
- 全部終わったら minigo に要望・フィードバックの issue を出し、html-sandbox にこの記事を書く

前提条件。go-classic-mpa-sample は Go の `net/http` + `html/template` + `embed.FS` + `modernc.org/sqlite` + goldmark の古典的 MPA で、JavaScript 一切禁止が仕様として固定されている。Renderer はリファクタリング済みで、ページ描画はテンプレート + view model を受け取る形に分離されていた。minigo 側も publish 前の HEAD を直接触ってよい。検証環境は Go と実ブラウザ（Devin の VM 上の Chromium）。

## やったこと

### 調査と取り込み方法の決定

まず `examples/storybook`（`//go:build story` タグ付きファイルから `func StoryXxx()` を発掘し、minigo で実行して stdout を採取する構造）と experiment-storybook.md の方針を読んだ。取り込みは `make setup-minigo` で `third_party/minigo` に shallow clone し、cmd/storybook を独立した go module にして `replace` でローカル clone を指す形にした。submodule は git 管理の更新単位になるので選ばなかった。vendor は unstable なコードを差分確認しながら触る今回の用途（書き換えも許容されていた）に合わない。

### sqlite を実行しないための仕掛け

`internal/store` が `modernc.org/sqlite` を blank import しており、そのままだと driver 登録の init が走る。`e.Bind("modernc.org/sqlite", map[string]runtime.Value{})` で空 map に解決させると、import 解決だけが満たされて init も driver 登録も走らない。さらに store パッケージ自体はインタプリトさせる方針にした。バインドしたホスト側の型は bound template からフィールドが読めない（script-side struct がホスト reflection に見えない）ので、値を作る側は script 側に残す、という境界が本質だった。

### parsePages のリファクタと bind 表

`//go:embed` の embed.FS は script-side で、bound な `template.ParseFS`（そもそも bound に ParseFS が無い）に渡せない。アプリ側の `parsePages` を `templateFS.ReadFile` + `t.Parse(string(src))` に変えた（[PR #18](https://github.com/podhmo/go-classic-mpa-sample/pull/18)）。この層を分けたのは「アプリの変更を最小にして設計を読みやすくする」ためで、stack の最下層に置いた。

goldmark 周りは `e.Bind` で必要シンボルを列挙した（8 シンボル・4 パッケージ）。`goldmark-alert` は Bind が import path 末尾から `goldmark-alert` という package 名を作るが script は `alert` で参照するので、`e.BoundOf(path).Name = "alert"` で上書きした。

### story と検証

`story_pages.go` に 5 ページ × 複数状態の 10 story を書いた（一覧・空・ページング・詳細・コメントエラー・フォーム new/errors/edit・削除・404）。fixture の `printRec` は `rec.Code >= 500` で panic させ、描画失敗が成功扱いにならないようにした（レビュー指摘が起点）。

依頼者の追加要求に合わせて、再起動不要性をサーバ起動中に実測した。index がリクエスト毎に `Stories()` を呼び、描画も毎回新規エンジンで再インタプリトするため、テンプレート編集・fixture 編集・新規 story 追加のすべてがリロードだけで反映された（約 100〜150ms/req）。JS については静的 JS は `/static/` でそのまま配信・inline `<script>` もプレビュー上は動くが、プレビューが renderer の body だけを返すためハンドラが付ける CSP 等のヘッダは検証できない、というギャップを発見して文書に残した。

テストエージェントによる E2E では 10/10 story が実 CSS で描画され、ナビ遷移・編集反映も確認された。

### stacked PRs とモバイル対応

当初 [PR #17](https://github.com/podhmo/go-classic-mpa-sample/pull/17) 一本だったものを、「github stacked PRs」の指示で 3 層に分割し（worktree でブランチを切り、最終ツリーが同一であることを 0 行 diff で確認してから close）、モバイル用の 4 層目を積んだ。

- [PR #18](https://github.com/podhmo/go-classic-mpa-sample/pull/18): `parsePages` を ReadFile+Parse に
- [PR #19](https://github.com/podhmo/go-classic-mpa-sample/pull/19): `cmd/storybook` 本体（`-http`/`-list`/`-o`）
- [PR #20](https://github.com/podhmo/go-classic-mpa-sample/pull/20): stories + `docs/sketch/ja`
- [PR #22](https://github.com/podhmo/go-classic-mpa-sample/pull/22): ビューポート切替（`?w=320|360|768` で iframe 幅を固定、JS 不要）

4 層目では全 10 story を 360px・320px で目視監査した。フィルタバー縦積み・ラベル折返し・ボタン全幅化・タイトルクランプは先行の responsive 対応で済んでおり、WCAG 1.4.10 の 320px 基準でも横スクロール・はみ出しは検出されなかった。Devin Review の指摘「ビューポート切替で選択中 story がリセットされる」は正当で、story 選択を `?s=` パラメータ化して保持する形に直した（副次効果として story の直リンクができた）。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -60 368.9 276.6" width="369" height="277" role="img" aria-label="one story previewed at 320, 360 and 768 css px">
<rect x="0" y="0" width="70.5" height="180" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="35.25" y="80.9" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">story</text>
<text x="35.25" y="99.1" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">nav</text>
<rect x="118.5" y="0" width="96" height="180" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5" stroke-dasharray="5 3"/>
<rect x="118.5" y="0" width="108" height="180" rx="8" fill="none" stroke="#E69F00" stroke-width="2.5"/>
<rect x="118.5" y="0" width="230.4" height="180" rx="8" fill="none" stroke="#00A876" stroke-width="1.5" stroke-dasharray="2 3"/>
<text x="210.5" y="-10" font-size="12" text-anchor="end" fill="currentColor">320px</text>
<text x="222.5" y="-24" font-size="12" text-anchor="end" fill="currentColor">360px</text>
<text x="344.9" y="-38" font-size="12" text-anchor="end" fill="currentColor">768px</text>
<text x="233.7" y="204" font-size="13" text-anchor="middle" fill="currentColor">same story, three ?w= widths</text>
</svg>
```

図は `tools/svg-gen` の PALETTE（colorful オプション）で生成した `tools/svg-gen/examples/fig-storybook-viewports.ts` の出力。左が story ナビ、右が同じ story を 320/360/768px で描いた preview 枠を左辺揃えで重ねたもの。実線の太い 360px 枠と破線の 320/768px 枠は、色が効かなくても幅差と破線で読み分けられる。

### ハンドラ同型の story（StoryHttp prefix、後日追加）

「story が Response を返せるようにすれば status code や header も取れる。いっその事 http.Handler と同型にする」という依頼者の提案で 2 つ目の story 形式を追加した（PR #23 に同梱）。前節で発見した CSP ギャップの直接の解消でもある。

`StoryHttp` で始まる story は `func(http.ResponseWriter, *http.Request)` 型を必須とし（AST で構造判定）、`Render` は `httptest.NewRecorder` と `httptest.NewRequest` をホスト側で作って `s.Call(ctx, pkg, name, rec, req)` で渡す。host の Go オブジェクトが `vm.SnapshotOf` 経由でそのまま script から書き込めるので、recorder に status と headers が残り、`/story/<Name>` がそれらを replay する。あわせて `Store` interface の script 側 fake（`storyStore`）を書き、実 mux `web.New(storyStore{})` を通す story にした。`web`・`store` は interpreted なので script 内 struct が interface をそのまま満たす。

実測: `StoryHttpIssueList`（実 mux → `GET /issues`）は 200 + CSP・`X-Content-Type-Options` 等つき、`StoryHttpNotFound` は 404 を実際に返す。マークアップの確認は print 型、ヘッダ・status・ルーティング込みの検証は `StoryHttp` 型、と使い分ける構成になった。

## 答え

- stack #21（[PR #18](https://github.com/podhmo/go-classic-mpa-sample/pull/18) → [#19](https://github.com/podhmo/go-classic-mpa-sample/pull/19) → [#20](https://github.com/podhmo/go-classic-mpa-sample/pull/20) → [#22](https://github.com/podhmo/go-classic-mpa-sample/pull/22) → [#23](https://github.com/podhmo/go-classic-mpa-sample/pull/23)）として提出済み。#23 は「minigo の未使用機能を使う」追加要求への対応で、`Engine.NewSession()` を使うリファクタ。
- `make setup-minigo` → `make storybook` で :6006 に立つ。print 型 10 + StoryHttp 型 2 の計 12 story が sqlite 非実行で描画できる。
- 再起動不要性は実測済み：テンプレート・モックデータ・story 追加・CSS はリロードのみ。storybook 本体（cmd/storybook の Go コード）は再ビルドが必要。
- モバイル対応は環境として成立：`?w=` で幅を固定して試行錯誤できる。アプリ側の追修正は不要と判断した。
- minigo フィードバックは [issue #1068](https://github.com/podhmo/minigo/issues/1068) に集約（Bind の package 名、bound struct の不透明性、ParseFS/fs.FS の橋渡し、bind 全列挙、キャッシュ、missing field がエラーにならない divergence の 6 件 + 追記コメント）。
- 設計メモは `docs/sketch/ja/storybook-with-minigo.md`（PR #20 に含まれる）。
- 残っている未回答の部分: storybook 本体の JS による props 操作など本物の storybook 相当機能（CSP 等ヘッダ込み検証は `StoryHttp` 型で解消済み）。

## 「lazy なインタプリタ」は本質か（依頼者との対話）

依頼者の整理は「lazy なインタプリタがあれば古典的 SSR でも storybook 的体験ができるのでは。起動が遅くて良いなら lazy じゃなくても良いし、書き換える度にビルドして良いならインタプリタじゃなくても良い」だった。やってみた結果への私（Devin）の見解を残す。

本質は lazy 性ではなく「編集したファイルがソースとして毎レンダー再実行されること」だ、という点は同意する。実際今回の設計は lazy ではなく、むしろ毎リクエスト新規エンジンで丸ごと再インタプリトする「一番非 lazy」な選択で、それでも 100〜150ms/req で storybook 体験は成立した。ビルドし直して再起動する方式（ウォッチャー + `go build`）でも同じ UX には到達できる。ではインタプリタを選ぶ差分は何かというと、今回実際に効いたのは次の 2 点だった。

- import レベルでモックできる。`modernc.org/sqlite` を空 map に bind して blank import の解決だけを満たし、init も driver 登録も走らせない。`internal/store` ごとインタプリトして fixture を script-side struct で作る。再ビルド方式でこれをやるには build tag や interface の切り口をアプリ側に仕込む必要がある。インタプリタは「import の意味」を呼び出し側が再定義できるのが一番の価値だった。
- bound（ホスト実装）と interpreted の境界を実行毎に動かせる。重い依存（goldmark・html/template）は bound で速く、アプリコードは interpreted でホット編集。これは `WithPackageModes` という既存の選択肢として minigo が用意している。

一方で再ビルド方式が勝る点もある：本物の型が通るので、テンプレートのフィールド typo がエラーになる（minigo では現状、空描画で気づけない。issue #1068 の項目 6）。「モックの柔軟性 vs 型の正確性」のトレードオフとして、インタプリタは前者を取る道具、というのが今のところの評価。

なお依頼者から別の良さも指摘された：story ファイルはインタプリト対象でありながら正真正銘の Go ソースなので、go vet や gopls（補完・ジャンプ・rename）といった静的解析がそのまま valid に効く。実行時の型検査が緩くても、書いている途中では普通の Go ツールチェーンの支援を受けられる。これが Python 製の DSL やテンプレート言語だと、言語外の型情報を mypy のような別系統で補う話になってしまう。「Go のまま書けて、Go のまま解析できて、だけど実行の解釈だけ差し替えられる」のが minigo の地味で強い点だと思う。

### 使い切れていなかった minigo の機能（後日適用済みのものを含む）

API を見直すと用意されていたもの。指摘後に一部は実際に適用した（下記）。

- `Engine.NewSession()` — 設定・bind・special form を引き継ぎつつ package cache が空の子エンジンを返す。初期版は毎リクエスト `NewEngine` + 全 bind の再登録だったが、`NewSession` が「bind を共有して実行状態だけ隔離する」ための正規の API だった。これはその後 [PR #23](https://github.com/podhmo/go-classic-mpa-sample/pull/23) として適用した：長寿命の base engine（bind・BuildConfig・PackageModes を一度だけ設定、`Book.base` に遅延構築）から `Render` 毎に `NewSession()` を fork し、出力先だけ `WithOutput(&buf)(session)` で差し替える形。適用後も全 story の描画・fixture 編集の即反映（session 毎に source が再インタプリトされる）を確認した。レイテンシは 100〜200ms/req と同程度で、効果は速さより「正規 API で意図が明確」「bind 再登録が消えて大きなアプリでも伸びにくい」側にある。
- `WithInitMode(LazyInit)` — メンバ問い合わせで init を走らせず、型と関数シグネチャだけを実体化するモード。「lazy インタプリタ」そのものが既に存在していた。story 関数は実際に実行して fixture の var 値が必要なので、今回の用途では `GoCompatibleInit` が正解（未適用は意図的）。
- `WithPackageModes` の `ModeSource` / `ModeDeny` — bound な package を source 解釈に戻したり import を拒否したりする per-path 制御。`ModeSource` は `-src` フラグ経由で使用済み。sqlite の扱いに ModeDeny は別解だった（ただし blank import の解決自体は必要なので空 map bind の方が素直）。
- Engine の package cache — engine はロード済み package をキャッシュする。長寿命 engine + `NewSession` の組合せで「storybook の都度再解釈」と「bound パッケージの再利用」を両立する設計になった（issue #1068 の項目 5 の方向性）。
- `inspect` パッケージ・`BoundSymbols`・`WithHostPolicy`・`ScriptProfiler` — story 発掘の静的解析、bind 済みシンボルの列挙確認、ホスト側アクセス制御、計測。現状は未使用。

## もっと良くするには（依頼による展望の節）

### go-classic-mpa-sample 側

- ハンドラ経由の story 型（`StoryXxxHTTP` のような、`httptest` 越しにレスポンスヘッダまで見る story）を足すと CSP・Speculation-Rules まで storybook で検証できる。
- `?w=` は一度に一幅なので、複数幅の同時並列表示（side-by-side やグリッド）にすると差分比較が速い。
- story の自動発掘（テンプレートと 1:1 の story を生成する lint/雛形コマンド）があると story の書き忘れが防げる。
- テーマ一括切替（light/dark、配色バリアント）を storybook 側のパラメータにすると、スタイルの抜本的な試行錯誤の本丸に届く。

### minigo 側（issue #1068 の指摘がすべて解消された後の話）

- 毎リクエスト新規エンジン → 長寿命 engine + `NewSession` の構成に変えたことで「bind 共有・実行状態隔離」は実現できた（PR #23）。残るのは source package の再パース・再コンパイルのコストで、アプリが大きくなると増分評価（変更ファイルだけ再解釈）が効いてくる。issue の項目 5 の次の形として、ファイル単位の無効化が欲しい。
- story 発掘〜描画の共通部を `examples` から切り出した共有 storybook ヘルパにすると、利用者は `Book` 相当を再実装しなくて済む（今回も per-consumer で再実装した）。
- script 側の fs.FS/構造体とホスト側の橋渡しが解消されると、`parsePages` のようなアプリ側リファクタ自体が不要になり、導入障壁が一段下がる。
- missing field で空描画される件が strict にエラーになれば、storybook 的用途（テンプレートの試行錯誤）での typo 検知が格段に強くなる。

## 余談

- 自動化ブラウザで nav リンクの iframe 遷移が稀にトップレベルに飛ぶ挙動が出た。markup は spec 適合なので CDP アーティファクトの可能性が高いが、手動ブラウザでの一確認は残っている。
- `html/template` は cmd/storybook 側の index テンプレートの `{{if}}` 分岐が異なるコンテキストで終わるとコンパイルエラーにしてくれた。interpreted なテンプレート側にはこの種の診断が少ない（issue #1068 の項目 6 関連）。
- 作業途中でリポジトリの git 設定や worktree 運用（`git reset --hard` での層の積み直し、`GIT_EDITOR=true`）の細かいハマりがあった。最終ツリー同一性の 0 行 diff 確認は分割作業で特に効いた。
