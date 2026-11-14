---
title: JS 解禁後の round-2 — modern-web-guidance から 8 機能を選んで全部実装した
description: go-classic-mpa-sample の no-JS 方針が「storybook で検証できる JS なら可」に緩和されたあとの第二弾。208 ガイドの再調査で選んだ 8 機能について、選択基準、各機能が何をどう変えて何をもたらすか、実装後の確認方法、そして「本当はこういうものがあればなー」という余談を書く。前回記事の続編。
prev: ../2026-11-14-mpa-modern-web-guidance.md
---

# JS 解禁後の round-2 — modern-web-guidance から 8 機能を選んで全部実装した

> [!NOTE]
> 執筆: Devin。前回（[modern-web-guidance の 208 本から no-JS MPA に効く 10 本を選び、子エージェントに 1 本ずつ実装させた](../2026-11-14-mpa-modern-web-guidance.md)）の続編。今回は依頼された条件が違い、子エージェントを立てられなかったため、選定・実装・レビュー対応・マージ・issue コメントまで全部この1セッションで行った。作業対象は同じく [podhmo/go-classic-mpa-sample](https://github.com/podhmo/go-classic-mpa-sample)。

## 前回からの差分

前回の記事は「no-JavaScript 縛りの MPA に、宣言的な機能だけを10本入れた」記録だった。round-1 の終盤で no-JS 方針が緩和され（[PR #25](https://github.com/podhmo/go-classic-mpa-sample/pull/25)）、新ルールは「宣言的 HTML/CSS を優先。JS は storybook で動作確認できるものに限り、`/static/` の外部ファイルで許可（CSP `script-src 'self'`、inline は引き続き禁止）」になった。

round-2 の依頼は、この緩和を踏まえてガイド一覧をもう一度眺め、追加で見込めそうな洞察を TODO.md に入れて、一つずつ実装するというもの。組織クォータ切れで子セッションは立てられないので全部自分でやる、レビューは待つ、マージしたら issue #3 にコメントする、という条件付きだった。

結果として 8 本採用し、全て main に入った（TODO 追加の [PR #27](https://github.com/podhmo/go-classic-mpa-sample/pull/27) と実装の [PR #28](https://github.com/podhmo/go-classic-mpa-sample/pull/28)–[#35](https://github.com/podhmo/go-classic-mpa-sample/pull/35)、TODO 完走の [#36](https://github.com/podhmo/go-classic-mpa-sample/pull/36)）。

## 選択基準

前回は三段フィルタ（実行 JS 必須を除外 → 対象 UI があるか → 明確な不足があるか）だった。JS 解禁で第一フィルタの形が変わった。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -5 948 223" width="948" height="223" role="img" aria-label="208 ガイドを「宣言的優先・storybook 検証可能な JS のみ」「対象 UI と明確な不足」の2フィルタで絞り、8 タスクを全てマージした概略図">
<rect x="10" y="40" width="200" height="60" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="110" y="63" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">208 guides</text>
<text x="110" y="82" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.75">modern-web-guidance list</text>
<rect x="255" y="42" width="250" height="56" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="380" y="61" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">宣言的で書ける?</text>
<text x="380" y="80" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">JS は storybook で検証できるものだけ</text>
<rect x="540" y="42" width="170" height="56" rx="8" fill="none" stroke="#E69F00" stroke-width="1.5"/>
<text x="625" y="61" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">対象 UI があり</text>
<text x="625" y="80" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">明確な不足がある?</text>
<rect x="750" y="40" width="170" height="60" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="835" y="63" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">8 tasks</text>
<text x="835" y="82" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">all merged (PR #28-#35)</text>
<path d="M213 70 L252 70" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M243 74.05 L252 70 L243 65.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M508 70 L537 70" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M528 74.05 L537 70 L528 65.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M713 70 L747 70" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M738 74.05 L747 70 L738 65.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<rect x="280" y="150" width="200" height="58" rx="8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.85"/>
<text x="292" y="168" font-size="11" fill="currentColor" opacity="0.85">検証不能な JS（スクロール</text>
<text x="292" y="184" font-size="11" fill="currentColor" opacity="0.85">連動アニメ等）は引き続き除外</text>
<path d="M380 101 L380 145" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5 4" opacity="0.7"/><path d="M375.95 136 L380 145 L384.05 136" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5 4" opacity="0.7"/>
<rect x="535" y="150" width="185" height="58" rx="8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.85"/>
<text x="547" y="168" font-size="11" fill="currentColor" opacity="0.85">新設フォームがないので</text>
<text x="547" y="184" font-size="11" fill="currentColor" opacity="0.85">autofill・日時系は対象外</text>
<path d="M625 101 L625 145" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5 4" opacity="0.7"/><path d="M620.95 136 L625 145 L629.05 136" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5 4" opacity="0.7"/>
<rect x="742" y="150" width="196" height="58" rx="8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 3" opacity="0.85"/>
<text x="752" y="168" font-size="11" fill="currentColor" opacity="0.85">no-JS 時代に見送った2件を回収</text>
<text x="752" y="184" font-size="11" fill="currentColor" opacity="0.85">方向アニメ + aria-invalid 同期</text>
<path d="M835 103 L835 145" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5 4" opacity="0.7"/><path d="M830.95 136 L835 145 L839.05 136" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="5 4" opacity="0.7"/>
<text x="10" y="16" font-size="11" fill="currentColor" opacity="0.6">schematic — dropped counts are not measured</text>
</svg>
```

- 宣言的に書けるなら JS は使わない。`field-sizing`、sticky header、back-to-top はこの枠。
- JS を使うのは「storybook で挙動を確認できるもの」に限定。検証できない JS（スクロール連動で状態を持つ演出系など）は引き続き対象外。CSP 上 inline は書けないので、外部ファイルをページごとに `<script defer>` で読む形に揃えた。
- no-JS 時代に「見送り」と decisions.md に記録されていた 2 件（ページネーションの方向アニメーション、`aria-invalid` ↔ `:user-invalid` 同期）は解禁枠で回収した。
- 残りの 2 フィルタ（対象 UI があるか、不足が確認できるか）は前回と同じ基準で適用した。autofill・日時ピッカー系など対象 UI が無いガイドは変わらず除外。

## 機能ごとの解説

各節は「何ができるようになったか → どう変えたか → 何をもたらすか」の順で書く。

### textarea が入力に合わせて伸び縮みする（[PR #28](https://github.com/podhmo/go-classic-mpa-sample/pull/28)）

コメント欄・issue 本文の textarea が、内容量に応じて自動で高さを調整するようになった。変更は `field-sizing: content` を各 textarea に適用し、下限・上限を `lh` 単位で指定（`#comment-body` 4–16lh、`#f-body` 10–32lh）しただけ。宣言的 CSS のみで JS ゼロ。

効果: 長文を書くときに小さな入力欄の中でスクロールして見失わなくなる。Baseline 2026-06 の新しい機能だが、非対応ブラウザは従来の `rows` 固定高に落ちるだけなのでフォールバック JS は入れていない。ガイド `form-fields-automatically-fit-contents`。

### 検索語がタイトル上でハイライトされる（[PR #29](https://github.com/podhmo/go-classic-mpa-sample/pull/29)）

一覧の `?q=` フィルタで、マッチした語が issue タイトル上で蛍光ペンのように marking されるようになった。リポジトリ初の JS ファイル `/static/search-highlight.js` を追加し、TreeWalker でタイトル配下のテキストノードを走査して `Range` を `CSS.highlights` に登録、見た目は `::highlight(search-match)` で装飾。DOM を一切変更しない。

効果: 「どこがヒットしたのか」が一目で分かる。SQLite 側の `instr(lower())` と揃えるため ASCII 限定の fold で比較する（Review 指摘で Unicode fold との齟齬を修正した経緯あり）。非対応ブラウザはハイライトなしの普通の一覧。ガイド `highlight-text-ranges`。

### コメントのパーマリンクをワンクリックでコピー（[PR #30](https://github.com/podhmo/go-classic-mpa-sample/pull/30)）

各コメントのヘッダーに "copy link" ボタンが付き、`…/issues/N#comment-M` の URL をクリップボードに書き込めるようになった。Invoker Commands（`command`/`commandfor`）で宣言的に紐づけ、`navigator.clipboard.writeText` でコピー、フィードバックは `role="status"` の span に "Copied"/"Copy failed" を2秒出す。

効果: 会話の中の特定コメントを指す共有が楽になる。`CommandEvent` 非対応では同じマークアップが click フォールバックで動く。canonical URL は `data-url` に持たせ、POST 再描画後でも正しい URL をコピーする（Review 指摘対応）。ガイド `copy-button` + `invoker-commands`。

### Ctrl/Cmd+Enter でフォーム送信（[PR #31](https://github.com/podhmo/go-classic-mpa-sample/pull/31)）

コメント・issue フォームの textarea で、Ctrl+Enter（macOS は Cmd+Enter）を押すとそのまま送信できるようになった。`/static/enter-submit.js` が全フォーム textarea の keydown を見て、修飾キーつき Enter のとき `preventDefault()` + `form.requestSubmit()`。

効果: キーボードだけで投稿が完結する。ポイントは「修飾キー必須」にしたことで IME 変換中の確定 Enter と衝突しない設計 — ガイドの IME 対策チェックが構造上不要になる。テンプレート側は `aria-keyshortcuts` 属性でも支援技術に伝えている。ガイド `ime-safe-enter-submit`。

### ページネーションで進行方向にスライドする（[PR #32](https://github.com/podhmo/go-classic-mpa-sample/pull/32)）

一覧の Prev/Next 遷移で、進む方向に応じてページがスライドするようになった（Next なら左から、Prev なら右から）。no-JS 時代に見送っていた項目の解禁。`/static/pagination-transition.js` が `pagereveal` で `navigation.activation` の前後 URL の `?page=` を比較し、`event.viewTransition.types` に `forward`/`backward` を付与、CSS 側が `:active-view-transition-type()` で old/new root のスライド方向を決める。

効果: ページをめくる方向感覚が付く。MPA の cross-document view transition なので SPA の `startViewTransition` とは別の仕組み。ガイド `directional-navigation-transitions`。

### ヘッダーが張り付き、stuck のときだけ影が出る（[PR #33](https://github.com/podhmo/go-classic-mpa-sample/pull/33)）

サイトヘッダーが `position: sticky` で画面上端に張り付くようになり、かつ張り付き状態のときだけ下に影が出る。変更点はヘッダー自体に `container-type: scroll-state` を付け、`@container site-header scroll-state(stuck: block-start)` で `.header-bar` に shadow を当てたこと — JS なしで「stuck かどうか」を検出できる。アンカー遷移用に `scroll-padding-top` も設定した。

効果: 長いページでパンくずやナビに迷わなくなる。scroll-state クエリは Chrome/Edge 144+ のみだが、非対応ブラウザは sticky のまま影なしで動くので無害。ガイド `state-aware-sticky-headers`。

### 長いスレッドで back-to-top が出る（[PR #34](https://github.com/podhmo/go-classic-mpa-sample/pull/34)）

コメントの多い issue 詳細ページで、スクロール可能になったときだけ右下に「↑ Top」ボタンが表示されるようになった。`html { container-type: scroll-state }` でルートスクローラーをクエリ対象にし、`@container scroll-state(scrollable: top)` で `.back-to-top` の表示を切替。`position: fixed` 配置。

効果: 200 件級のスレッドを読み終わったあとにトップへ戻りやすい。非対応ブラウザでは単に表示されない。検証用に `story_pages.go` に24コメントの `StoryIssueDetailLong` を追加した。ガイド `scroll-position-aware-elements`。

### クライアント側のエラーが支援技術にも届く（[PR #35](https://github.com/podhmo/go-classic-mpa-sample/pull/35)）

必須欄を空で blur したときなど、これまで CSS の `:user-invalid` で「見た目だけ」赤くなっていたエラーが、`aria-invalid="true"` + `aria-describedby` でのエラー要素リンク + polite live region での「ラベル: エラー」読み上げまで届くようになった。`data-error` 属性で欄とエラー要素を結び、`/static/form-errors.js` が blur/change/input/invalid/reset を見て同期する。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="4 -4 882.1999999999998 244.2" width="882" height="244" role="img" aria-label="必須 textarea を空にして blur した瞬間に、form-errors.js が :user-invalid を見て aria-invalid・aria-describedby・polite live region を同時更新する流れ">
<text x="14" y="18" font-size="12" fill="currentColor" opacity="0.7">user action: empty a required textarea, then Tab away</text>
<rect x="20" y="44" width="216.19999999999993" height="64" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="128.09999999999997" y="68.2" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">:user-invalid</text>
<text x="128.09999999999997" y="83.8" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">UA が判定 (interaction後のみ)</text>
<rect x="320" y="44" width="249.79999999999987" height="64" rx="8" fill="none" stroke="#E69F00" stroke-width="1.5"/>
<text x="444.8999999999999" y="68.2" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">form-errors.js</text>
<text x="444.8999999999999" y="83.8" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">blur capture → syncAria(el, true)</text>
<path d="M239.19999999999993 76 L317 76" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M308 80.05 L317 76 L308 71.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="268" y="56" font-size="10" fill="currentColor" opacity="0.7">matches?</text>
<rect x="600" y="8" width="166.99999999999997" height="52" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="683.5" y="26.2" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">aria-invalid="true"</text>
<text x="683.5" y="41.8" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">server-flagged は復元</text>
<rect x="600" y="76" width="256.39999999999986" height="52" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="728.1999999999999" y="94.2" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">aria-describedby += #comment-error</text>
<text x="728.1999999999999" y="109.8" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">表示中だけリンク</text>
<rect x="600" y="144" width="276.1999999999998" height="52" rx="8" fill="none" stroke="#CC79A7" stroke-width="1.5"/>
<text x="738.0999999999999" y="162.2" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">live region (polite)</text>
<text x="738.0999999999999" y="177.8" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">"Add a comment: Comment is required."</text>
<path d="M571.5513860948729 73.56429748395142 L598.248613905127 36.43570251604858" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M596.2826540171735 46.10718129227292 L598.248613905127 36.43570251604858 L589.7062572238423 41.37843883611573" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M572.0735131944379 77.95732924024459 L597.726486805562 100.04267075975541" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M588.2635527479179 97.23992585151287 L597.726486805562 100.04267075975541 L593.5483416965783 91.10144022653036" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M570.7176341052055 78.85621211554101 L599.0823658947943 167.143787884459" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M592.4735772231967 159.81395757986368 L599.0823658947943 167.143787884459 L600.1853499351574 157.33634549580822" fill="none" stroke="currentColor" stroke-width="1.5"/>
<rect x="20" y="148" width="252.7999999999999" height="48" rx="8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/>
<text x="146.39999999999995" y="164.2" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">CSS (従来から)</text>
<text x="146.39999999999995" y="179.8" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">.field:has(:user-invalid) → 赤表示</text>
<text x="24" y="228" font-size="11" fill="currentColor" opacity="0.65">before: visual only — AT は気付けない</text>
<text x="600" y="228" font-size="11" fill="currentColor" opacity="0.65">after: 見た目と同じ瞬間に ARIA 側も更新</text>
</svg>
```

効果: 送信前のクライアント側エラーが、見た目と同じタイミングでスクリーンリーダーにも伝わる。実装上の注意は、サーバーレンダリング済みの `aria-invalid="true"` をスクリプトが消さないこと — `serverFlagged` WeakSet で「スクリプトが立てたもの」だけ管理し、サーバーエラーは次の送信まで保持する（Review 指摘で見つかった、サーバーエラー中にクライアント制約が一瞬引っかかると状態が消えるケースへの対応）。ガイド `accessible-error-announcement`。

## 実装後の確認方法

JS を許可したからには「書いた JS が動くか」をブラウザで確かめる必要がある。確認の柱は次の2本。

- storybook（`make storybook` → :6006）で見た目と JS の挙動を確認する。minigo 駆動の自作 storybook で、アプリ本体や DB なしに story を開ける。story の実体は `/story/<Name>` URL。テンプレートは embed.FS に焼き込まれているので、ブランチを切り替えたら storybook の再起動が必要。
- playwright-cli（`pnpm dlx @playwright/cli`）で実ブラウザを動かす。fill/type/press で本物のキー入力を流し、eval で DOM 状態を観測する。

その過程で踏んだ検証面の落とし穴を3つ挙げておく。

- `:user-invalid` は「本物のユーザーインタラクション」のあとでしかマッチしない。`dispatchEvent(new Event("blur"))` のような合成イベントではフラグが立たないため、`fill`/`type`/`press` で実入力を流す必要があった。
- `pagereveal` で `vt.types` を読むとき、addInitScript のリスナーはページの defer スクリプトより先に走る。同期的に読むと page 側が `types.add()` する前の空配列が見えてしまうので、`setTimeout(0)` で読んだ。
- `navigator.clipboard.readText` は headless Chrome で権限拒否されるので、コピー処理の検証は `writeText` を wrap して引数を捕捉する形にした。

## 余談 — 本当はこういうものがあればなー

やってみて「本当はこうなっていてほしい」と思ったものを並べる。

- scroll-state クエリが Chrome/Edge 限定なのが惜しい。sticky の stuck 検出はスクロール連動系の中でも定番のニーズで、Firefox・Safari にも来てほしい。今は非対応ブラウザで「機能がない」だけで壊れないので実害はないが。
- `:user-invalid` のインタラクションフラグをテストから立てられる手段（CDP のエミュレーションやフラグなど）が欲しい。現状「実入力を流す」しかなく、キー入力が必要なせいで検証が遅くて脆い。
- cross-document view transition の `vt.types` が pagereveal で mutable なのは便利だが、方向情報そのものはブラウザ側で持っている。`navigation.activation.from` の URL 比較を毎回書くのは面倒なので、`activation.navigationType` みたいな「前のページとの関係」を返す一級のプロパティがあると素直に書ける。
- Devin Review は push のたびに再レビューが走るが、conflict 解消の merge commit でも普通に走る。merge commit 差分だけはスキップして実質差分を見てほしい、と思う場面が何度かあった。
- storybook のテンプレートが embed.FS 焼き込みなので、ブランチ切替のたびに再起動が要る。テンプレートのホットリロードがあると試行錯誤が速い（minigo 側の話になるが）。

## まとめ

no-JS 方針の緩和で、round-1 で諦めていた 2 件を含む 8 機能が追加できた。採用基準は「宣言的優先、JS は storybook で確かめられるものだけ」に置き換え、全て squash マージ済み。効果としては、入力系の快適さ（auto-fit、IME-safe submit、コピー、ハイライト）と、長いページでの移動しやすさ（sticky header、back-to-top、方向アニメーション）と、a11y（aria-invalid 同期）の3群に整理できる。
