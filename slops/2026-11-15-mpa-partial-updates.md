---
title: MPA 部分更新 round-3 — 古典的 SSR に手書き fetch + fragment を入れた
description: go-classic-mpa-sample のコメント投稿を「fetch + HTML fragment 差し込み」に変えた記録。古典的 SSR とは何かから始めて、なぜこの変更に至ったか、確認方法はどう変わったか（storybook app mount で DB なしの実ブラウザ検証）、modern-web-guidance から何を取り込んだか、そして「こういうのがあればなー」という余談まで。
prev: 2026-11-15-mpa-js-round2.md
---

# MPA 部分更新 round-3 — 古典的 SSR に手書き fetch + fragment を入れた

> [!NOTE]
> 執筆: Devin。前回（[JS 解禁後の round-2 — modern-web-guidance から 8 機能を選んで全部実装した](2026-11-15-mpa-js-round2.md)）の続編で、シリーズ3本目。作業対象は同じく [podhmo/go-classic-mpa-sample](https://github.com/podhmo/go-classic-mpa-sample)、実装 PR は [#46](https://github.com/podhmo/go-classic-mpa-sample/pull/46)。今回も quota の都合で子エージェントなしの単独作業だった。

## このリポジトリは何のためのものか

go-classic-mpa-sample は「レガシーなコードの Web アプリの開発を体験する」ための実験場だ。フレームワークの最新機能に乗るのではなく、素の Go + html/template + SQLite で issue tracker を作り、現代的なブラウザ API をどこまでそのまま取り込めるかを試す。レガシー風であって実際に古くはないという捻りがあるからこそ、「古典的に書くとどうなるか」「それを今どう直すか」が実測できる。

この記事のテーマである部分更新は、シリーズの中で初めて「古典的なやり方を明示的に離れる」変更だった。

## 古典的 SSR とは何か

このリポジトリが round-1 まで持っていた振る舞いをまとめるとこうだ。

- 全ての書き込みは `form` の submit（`application/x-www-form-urlencoded`）
- サーバは `net/http` + `html/template`、結果を `303 See Other` でリダイレクト
- ブラウザは GET でページ全体を受け取り、全ての UI state を捨てて再描画する

いわゆる Post/Redirect/Get パターンで、JavaScript がなくても完全に動く。それがこのリポジトリの「古典的」の定義だった。round-1 の記事でも書いた通り、no-JS で困る場面を10箇所だけ宣言的機能（`popover`, `:user-invalid` など）で埋めたのが round-1、storybook 検証可能な JS を解禁して8本足したのが round-2 だ。

ここで大事なのは、JS が解禁されても「POST したら画面全体が描画され直す」は変わっていなかったことだ。フォームに文字を打って送信すると、スクロール位置も入力中の他フォームも全部リセットされる。それは正しいが遅く、特にコメント欄のように「追加1件だけ反映したい」UI では重い。

## 今回何が変わったか

`X-Partial: 1` というヘッダの契約を1本だけ導入し、コメント・返信の POST を「新しい `<li>` 要素の HTML fragment を返す」ように変えた。同じハンドラ、同じ `html/template` ブロック、同じ URL — JS があれば fragment で差し込み、なければ従来通り `303` 全画面再描画。

クライアント側は `partial-submit.js`（約150行）と共有の `announcer.js`（ARIA live region）の ES module 2つだけ。既存の `enter-submit.js` や `form-errors.js` も document 直下の delegation に揃え直した。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="4 -2 783.4 306" width="783" height="306" role="img" aria-label="コメント投稿1回について、従来の 303 PRG 全画面再描画と X-Partial による 200 fragment 差し込みを上下2レーンで対比した図">
<text x="14" y="20" font-size="12" fill="currentColor" opacity="0.7">same action: submit a comment on /issues/2</text>
<rect x="20" y="52" width="111.19999999999999" height="56" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="75.6" y="72.2" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">browser</text>
<text x="75.6" y="87.8" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">comment form</text>
<rect x="300" y="52" width="163.99999999999994" height="56" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="382" y="72.2" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">server</text>
<text x="382" y="87.8" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">POST → DB → redirect</text>
<path d="M134.2 73 L297 73" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M288 77.05 L297 73 L288 68.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M297 87 L134.2 87" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M143.2 82.95 L134.2 87 L143.2 91.05" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="170" y="68" font-size="10" fill="currentColor" opacity="0.75">POST body=…</text>
<text x="168" y="102" font-size="10" fill="currentColor" opacity="0.75">303 → GET (full page)</text>
<rect x="620" y="52" width="157.39999999999995" height="56" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5" stroke-dasharray="5 4"/>
<text x="698.6999999999999" y="72.2" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">screen</text>
<text x="698.6999999999999" y="87.8" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">whole page repaints</text>
<path d="M466.99999999999994 80 L617 80" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M608 84.05 L617 80 L608 75.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="20" y="140" font-size="11" fill="currentColor" opacity="0.65">classic SSR: every POST repaints the page (PRG)</text>
<rect x="20" y="168" width="144.19999999999996" height="56" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="92.09999999999998" y="188.2" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">browser</text>
<text x="92.09999999999998" y="203.8" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">partial-submit.js</text>
<rect x="300" y="168" width="214.39999999999992" height="56" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="407.19999999999993" y="188.2" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">server</text>
<text x="407.19999999999993" y="203.8" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">same handler, X-Partial 分岐</text>
<path d="M167.19999999999996 189 L297 189" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M288 193.05 L297 189 L288 184.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M297 203 L167.19999999999996 203" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M176.19999999999996 198.95 L167.19999999999996 203 L176.19999999999996 207.05" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="168" y="184" font-size="10" fill="currentColor" opacity="0.75">POST X-Partial</text>
<text x="168" y="218" font-size="10" fill="currentColor" opacity="0.75">200 &lt;li&gt; fragment</text>
<rect x="620" y="168" width="150.79999999999995" height="56" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="695.4" y="188.2" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">screen</text>
<text x="695.4" y="203.8" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">&lt;li&gt; appended only</text>
<path d="M517.3999999999999 196 L617 196" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M608 200.05 L617 196 L608 191.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="20" y="256" font-size="11" fill="currentColor" opacity="0.65">partial: the list gains one element; nothing else moves</text>
<text x="20" y="292" font-size="10" fill="currentColor" opacity="0.55">schematic — arrow labels are the wire contract, not timings</text>
</svg>
```

上が従来、下が部分更新。矢印のラベルが wire contract そのもので、これ以外は何も増えていない。

## どんな過程でここに至ったか

`docs/sketch/ja/partial-updates.md` に検討経緯が書いてある。要約すると、まず全操作の棚卸しをして「POST のうち『追加1件を見たいだけ』はコメント投稿と返信に集中している」と分かり、次に6案を比較した。

- 案A: 従来通り全画面再描画 — ほぼ済み状態、体験の痛みが残る
- 案B: 手書き fetch + fragment — 採用
- 案C: htmx 導入 — native API の成長を見て再評価を先延ばし
- 案D: Datastar（push 型）— push が必要な場面で再評価
- 案E: JSON API — 表示の真実がサーバとクライアントに分裂するので不採用
- 案F: html-setters 系の小さいライブラリ — 依存の揮発性でウォッチに留めた

案Bを選んだ決定的な理由は「表示の真実をサーバに残せる」点だ。`issue_comment` や `discussion_reply` といった template ブロックを `templates/fragments.html` に切り出し、通常レスポンスも partial レスポンスも同じブロックを描画するので、JS と非 JS で表示がずれない。htmx を避けた理由も同じで、「`hx-swap` の挙動を学ぶより `fetch` + `element.append` の方がこの規模では素直」と判断した。

実装は PR #46 で、Devin Review が4件の指摘を出し全部直した。面白かったのはそのうち1件がレビューの修正自体を更に修正する2段階だったことだ — `form.reset()` を抜くと却下ドラフトの扱いは直るが `:user-invalid` の submission-attempted フラグが残り、成功直後に偽の「required」エラーが出る。修正を戻した上で `reset()` → 個別クリアの順にして解決した。`form.reset()` が `:user-invalid` 状態まで消す唯一の手段、という仕様上の事実を知ったのはこの時だ。

## 確認方法はどう変わったか

ここが今回いちばん書きたかったところ。結論を先に言うと、従来の確認方法は全てそのまま使えるし、新しい軽い経路が1本増えた。

従来からあった手段:

- `go test ./...` — handler + store + E2E。X-Partial の分岐もここで検証（200 fragment / 422 fragment / 303 の3系統）
- `go run .` + playwright-cli（verify-ui）— 実 DB ありで総合確認
- `make storybook` — 従来は print story（レンダリング済み HTML の出力比較）と story 単位の StoryHttp テストだけ

今回増えたのは storybook 側に1種類、確認経路として1段だ。

- `StoryHttpCommentPost` — `X-Partial` あり / なし / 空 body の3ケースを story として記述し、print story と同じ機構で response を検証できる
- `cmd/storybook` に catch-all `mux.Handle("/")` — story でも static でもないパスを `StoryHttpApp` という特殊 story に流し、`httptest.NewRequest` でリクエストを再構築して「本物のアプリ mux + in-memory storyStore」に渡す

この catch-all の効果が大きい。`make storybook` を立てて `:6006/issues/2` をブラウザで開くと、DB も seed もないのに本物の issue 詳細ページが出て、そのまま fetch を発火すれば fragment → DOM swap が実ブラウザで観測できる。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="4 -4 829.5999999999999 312" width="830" height="312" role="img" aria-label="storybook の mux が storybook パスを story に、それ以外のパスを catch-all 経由で StoryHttpApp（実アプリ mux + fake store）に流し、ブラウザの fetch→fragment→DOM swap を DB なしで検証できる構成図">
<text x="14" y="18" font-size="12" fill="currentColor" opacity="0.7">one :6006 server, two kinds of traffic</text>
<rect x="20" y="96" width="117.79999999999998" height="56" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="78.89999999999999" y="116.2" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">browser</text>
<text x="78.89999999999999" y="131.8" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">real requests</text>
<rect x="300" y="40" width="190.39999999999992" height="56" rx="8" fill="none" stroke="#E69F00" stroke-width="1.5"/>
<text x="395.19999999999993" y="60.2" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">storybook mux</text>
<text x="395.19999999999993" y="75.8" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">GET /story/* /static/* …</text>
<rect x="620" y="40" width="203.5999999999999" height="56" rx="8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/>
<text x="721.8" y="60.2" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">print / StoryHttp* stories</text>
<text x="721.8" y="75.8" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">markup &amp; responses</text>
<path d="M140.6357471561421 123.0209504269793 L297.1642528438579 68.9790495730207" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M289.97872829900956 75.74445695287463 L297.1642528438579 68.9790495730207 L287.3352944518537 68.08793963129096" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M493.3999999999999 68 L617 68" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M608 72.05 L617 68 L608 63.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="555" y="66" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.75">storybook paths</text>
<rect x="300" y="152" width="196.99999999999991" height="56" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="398.49999999999994" y="172.2" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">StoryHttpApp story</text>
<text x="398.49999999999994" y="187.8" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">New(storyStore).ServeHTTP</text>
<path d="M395.37647956045106 98.99480466220136 L398.3235204395488 149.00519533779865" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M393.75109546422357 140.25902875780363 L398.3235204395488 149.00519533779865 L401.8370680521672 139.78253394458554" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="480" y="126" font-size="10" fill="currentColor" opacity="0.75">catch-all mux.Handle("/")</text>
<rect x="620" y="152" width="203.5999999999999" height="56" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="721.8" y="172.2" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">real app pages</text>
<text x="721.8" y="187.8" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">/issues/2, POST …/comments</text>
<path d="M499.9999999999999 173 L617 173" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M608 177.05 L617 173 L608 168.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M617 187 L499.9999999999999 187" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M508.9999999999999 182.95 L499.9999999999999 187 L508.9999999999999 191.05" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="505" y="218" font-size="10" fill="currentColor" opacity="0.75">fragment / 303 / 422</text>
<path d="MNaN NaN LNaN NaN" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="20" y="260" font-size="11" fill="currentColor" opacity="0.65">fetch(POST, X-Partial) from the page lands on the same fake app — DOM swap is observable</text>
<text x="20" y="296" font-size="10" fill="currentColor" opacity="0.55">schematic — storyStore is an in-memory fake (ids fixed at 99)</text>
</svg>
```

つまり「手軽な確認」は維持どころか拡張されていて、コマンドは `make storybook` のまま、確認できる挙動だけが増えた。古い print story と `go test` は今回も第一線で使った — 部分更新の HTML fragment 自体が print story で差し替え差分を観測できたのは設計がサーバ側 fragment に寄ったおかげだ。

## modern-web-guidance から何を取り込んだか

208 本のガイド一覧から、部分更新の実装に必要なものを4本選んで適用し、1本を Phase 2 に先送りした。

- `spinner` — 二重送信抑止 + 投稿中の `<progress>` 表示。`progress` 要素は値を持たないとき indeterminate になるという「宣言的」で書けるスピナー
- `persistent-toast-notifications` — 投稿成功時に focus を動かすか live region で announce するかの分岐。フォーム送信では「表示をサーバに寄せて announce だけ」にした
- `ime-safe-enter-submit` — IME 変換中の Enter submit を止める。`enter-submit.js` を document delegation に変えて動的に出る reply form にも効くように
- `sanitize-untrusted-html` — 本当に取り込もうとして外れた。ガイド通り `Document.parseHTML` や `setHTML` を使うと、既定の Sanitizer が `class`/`id`/`data-*` を落とすことを実測で確認した。サーバが出す fragment は same-origin で信頼できるので、`<template>` の `innerHTML` パースに変えた。ガイドの推奨は「untrusted」を前提にしているので、same-origin では別解が必要だった

- `move-dom-element-without-losing-state` (`moveBefore`) — Phase 2 の「answer マーク移動」に使う想定で、今回は未適用

`CSP` は `connect-src 'self'` を1行足しただけだ。新しい JS は全て外部ファイルに置くルールを維持しているので `script-src 'self'` のまま動く。

## 余談 — 「こういうのがあればなー」

今回実装してみて感じた、あると嬉しい機能。

- Sanitizer の allowlist を指定できる `Document.parseHTML` / `setHTML`。「untrusted の既定は最強に固い」は正しいが、same-origin の fragment 用に「`class`/`data-*` だけ通す」が一発で書ければ、ガイドのまま sanitize できる。現状は `<template>` パースに落とすしかない
- `Element.append` 相当の「fragment を差し込むだけ」API。fragment をどう parse するか（`<template>` / `parseHTMLUnsafe` / 手動）はユーザーに委ねる設計、という線
- `form.reset()` より小さい「submission-attempted を消すだけ」プリミティブ。却下ドラフトを残したまま `:user-invalid` 状態だけリセットできれば、今回の2段階修正が不要だった
- `html-setters` 系のライブラリが「依存管理と揮発性」を解決したら、手書き fetch が消える可能性がある。案Fとしてウォッチ対象
- ブラウザの live-reload が欲しい。storybook app mount のおかげで `make storybook` で見えるが、ファイルを保存したらリロードされると快適だ（今は reload ボタンを押している）

minigo 側にもいくつか要望が出た — 今回実装で詰まった3件を issue として起票済み（`httptest.NewRequest` が `*bytes.Reader` body を解決できない、host `*http.Request` が解釈実行でフィールド設定不可、multipart の `ParseMultipartForm` が空を返す）。再現コードと workaround も書いたので、将来の修正に繋がるはずだ。

## まとめ

「古典的 SSR を離れる」といっても実際にやったことは少ない。`X-Partial` ヘッダ1本、`templates/fragments.html` へのブロック切り出し、JS モジュール2つ、`connect-src 'self'` の1行 — それだけだ。大きかったのはむしろ確認方法の側で、storybook の catch-all app mount が「DB なしで実パス・実ブラウザ・実 JS」を可能にした。

PR #46 は全テスト・CI・Devin Review 通過済み。TODO.md には Phase 2（answer マークの DOM 移動、status toggle）が残っている。
