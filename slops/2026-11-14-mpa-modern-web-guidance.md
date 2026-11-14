---
title: modern-web-guidance の 208 本から no-JS MPA に効く 10 本を選び、子エージェントに 1 本ずつ実装させた
description: go-classic-mpa-sample に modern-web-guidance スキルと todo-md スキルを入れ、カタログの 208 ガイドから TODO を選定してオーケストレーターとして子エージェントに実装・レビュー・マージさせた記録。選定で意識した要不要の基準、マージごとに有効になったブラウザ機能、途中で詰まった点を残す。
prev: ../2026-11-12-slops-feature-metrics.md
---

# modern-web-guidance の 208 本から no-JS MPA に効く 10 本を選び、子エージェントに 1 本ずつ実装させた

> [!NOTE]
> 執筆: Devin（orchestrator セッション）。実装はすべて別の子エージェントセッションが行い、このセッションはレビューとマージだけを担当した。作業対象は [podhmo/go-classic-mpa-sample](https://github.com/podhmo/go-classic-mpa-sample)。

## 依頼と前提

依頼は、[go-classic-mpa-sample](https://github.com/podhmo/go-classic-mpa-sample) に [modern-web-guidance スキル](https://github.com/GoogleChrome/modern-web-guidance/blob/main/skills/modern-web-guidance/SKILL.md)（GoogleChrome 謹製のガイドカタログを `npx modern-web-guidance` で検索・取得するもの）と [html-sandbox](https://github.com/podhmo/html-sandbox) の TODO.md 運用スキル（todo-md）をインストールし、`list` の一覧を眺めて実施するタスクを TODO.md に追加すること。以降は私がオーケストレーターに徹し、子エージェントをタスクごとに新しく 1 つだけ立てて実装させ、私がレビューとマージを行う、というものだった。

途中で加わった条件は次の通り。

- PR のレビュー指摘も TODO に入れて子エージェントの作業にする（[PR #4](https://github.com/podhmo/go-classic-mpa-sample/pull/4) の指摘が起点）
- このリポジトリではマージ・コミットを私に任せる
- マージ済みの実施内容をそれぞれ [issue #3](https://github.com/podhmo/go-classic-mpa-sample/issues/3) にコメントする（最初に指定された #2 は typo で #3 が正）
- 組織のクォータ切れで私からは子セッションを起こせなくなったため、Free モードのセッションは依頼した人がアプリから立て、私はプロンプトを供給する
- その後のループは「PR ができたらレビューしてコメント、不足がなければマージして issue #3 にコメント、次のタスクを渡す」になった

前提条件。対象リポジトリは Go の `net/http` + `html/template` + `database/sql` + SQLite（`modernc.org/sqlite`）で書かれた古典的な MPA の issue tracker で、`docs/ja/prompts.md` により JavaScript 一切禁止・Web フレームワーク不使用・ORM 不使用が仕様として固定されている。ローカル単一ユーザー前提のデモで、認証も外部公開もない。私は実装をせずレビュー・マージのみ。検証環境は Go 1.27.3、Chromium 156、実ブラウザ検証には playwright-cli（`pnpm dlx @playwright/cli`）。

## TODO に詰めた選定の判断

`npx -y modern-web-guidance@latest list` は 208 本のガイドを返した。これを眺めて TODO に入れたのは 9 本 + 判断留保の 1 本。選定で意識したフィルタは三段で、順番に適用した。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -5 1039.65 267" width="1040" height="267" role="img" aria-label="modern-web-guidance 208 guides を3つのフィルタで絞り10タスクを採用した概略図">
<rect x="0" y="40" width="216.79999999999995" height="60" rx="8" fill="none" stroke="currentColor" stroke-width="2"/>
<text x="108.39999999999998" y="60.9" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">208 guides</text>
<text x="108.39999999999998" y="79.1" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">modern-web-guidance list</text>
<rect x="260" y="42" width="155.9" height="56" rx="8" fill="none" stroke="#3B82C4" stroke-width="2"/>
<text x="337.95" y="60.9" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">executable JS?</text>
<text x="337.95" y="79.1" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">JS API 前提は除外</text>
<rect x="450" y="42" width="123.7" height="56" rx="8" fill="none" stroke="#E69F00" stroke-width="2"/>
<text x="511.85" y="60.9" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">対象の UI が</text>
<text x="511.85" y="79.1" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">アプリにある?</text>
<rect x="640" y="42" width="116" height="56" rx="8" fill="none" stroke="#CC79A7" stroke-width="2"/>
<text x="698" y="60.9" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">現状に明確な</text>
<text x="698" y="79.1" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">不足がある?</text>
<rect x="800" y="40" width="169.9" height="60" rx="8" fill="none" stroke="#00A876" stroke-width="2.5"/>
<text x="884.95" y="60.9" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">10 tasks</text>
<text x="884.95" y="79.1" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">採用 9 + 判断留保 1</text>
<path d="M219.79999999999995 70 L257 70" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M248 74.05 L257 70 L248 65.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M418.9 70 L447 70" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M438 74.05 L447 70 L438 65.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M576.7 70 L637 70" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M628 74.05 L637 70 L628 65.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M759 70 L797 70" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M788 74.05 L797 70 L788 65.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<rect x="263.4" y="172" width="149.09999999999997" height="80" rx="8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.85"/>
<text x="337.94999999999993" y="190.55" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.85">Temporal / built-in AI</text>
<text x="337.94999999999993" y="204.85" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.85">service worker / INP</text>
<text x="337.94999999999993" y="219.15" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.85">Web Components</text>
<text x="337.94999999999993" y="233.45" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.85">…大半</text>
<path d="M337.95 101 L337.94999999999993 169" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.7"/><path d="M333.8999999999999 160 L337.94999999999993 169 L341.99999999999994 160" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.7"/>
<rect x="428.225" y="172" width="167.25" height="80" rx="8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.85"/>
<text x="511.85" y="190.55" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.85">custom select / slider</text>
<text x="511.85" y="204.85" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.85">autofill 住所・支払い</text>
<text x="511.85" y="219.15" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.85">carousel / scrollytelling</text>
<text x="511.85" y="233.45" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.85">対象 UI がない</text>
<path d="M511.85 101 L511.85 169" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.7"/><path d="M507.8 160 L511.85 169 L515.9 160" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.7"/>
<rect x="614.925" y="172" width="166.14999999999998" height="50" rx="8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.85"/>
<text x="698" y="189.85" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.85">toast / idle detection 等</text>
<text x="698" y="204.15" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.85">用途・不足が薄い</text>
<path d="M698 101 L698 169" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.7"/><path d="M693.95 160 L698 169 L702.05 160" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.7"/>
<rect x="800" y="150" width="219.65000000000012" height="65" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="5 4"/>
<text x="909.825" y="168.2" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">speculation rules:</text>
<text x="909.825" y="182.5" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">宣言的 JSON だが &lt;script&gt; 要素</text>
<text x="909.825" y="196.8" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">→ 実装するかは子が判断 (wontfix 可)</text>
<path d="M886.2862661735361 102.68596215786138 L908.488733826464 147.31403784213862" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.7"/><path d="M900.853886392743 141.06011070282813 L908.488733826464 147.31403784213862 L908.1059842189687 137.4521920342808" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.7"/>
<text x="10" y="16" font-size="11" fill="currentColor" opacity="0.6">schematic — dropped counts are not measured</text>
</svg>
```

第一のフィルタは no-JavaScript。実行 JS が必須のガイドは全部落ちる。Temporal・Intl 系、ブラウザ内蔵 AI（Prompt/Summarizer/Translator API）、service worker・オフライン系、INP・長タスク分割、Web Components・Shadow DOM、カスタム要素系、各種デバイス API、そして「アニメーションするために JS で state を持つ」系のウィジェットはここでほぼ消える。カタログの大半はモダンなクライアントサイド JS 前提で、no-JS の制約一つで母数が激減する。

第二のフィルタは「このアプリにその UI があるか」。宣言的 HTML/CSS で実現できるガイドでも、対象の部品がアプリに無ければ入れようがない。custom select picker、slider、switch、autocomplete を整える住所・支払い・サインイン系フォーム、carousel・scrollytelling・parallax などの演出系、toast、メディア系（このアプリの画像は favicon の data-URI SVG だけ）は対象外にした。

第三のフィルタは「コードを見て明確な不足が確認できるか」。ここはガイドの説明文ではなく実コードと照合して決めた。`body { font-size: 15px }` の px 固定、640px 一本のブレークポイント、ライト固定パレット、CSP 未設定（bugs.md #13' で「inline style と相性が悪い」と一度見送られていた記録つき）、`aria-invalid` のないフォームエラー、スキップリンクなし、長いコメントスレッドの未最適化、といった実測できる不足があるガイドだけを採用した。「入れられそう」ではなく「現状がガイドの推奨から外れている」ことを TODO 行ごとに確認してから書いている。Toast・idle detection などは不足を確認できなかったので落とした。

判断留保は speculation rules。中身は実行コードを含まない宣言的 JSON だが、配信形態が `<script type="speculationrules">` 要素であり、no-JS ポリシーに合うかは自明でない。TODO には「合わないと判断したら wontfix で記録」と条件つきで入れ、結論は実装する子エージェントに委ねた。

選定後に追加で 2 本入った。[PR #4](https://github.com/podhmo/go-classic-mpa-sample/pull/4) の Devin Review 指摘で見つかった todo-gc のバグ 3 件（ユーザー指示で TODO 化、bugs.md #17–19）と、作業終盤に bugs.md の未対応エントリから拾った #23（content-visibility が AX ツリーからコメントを落とす件）の緩和である。

## 実施の進め方

各タスクは新しい子エージェントに、テンプレート化したプロンプトを渡して実行させた。プロンプトに必ず含めたのは、AGENTS.md・`docs/ja/policy.md`・todo-md スキルの遵守、実装前の `npx modern-web-guidance retrieve "<ids>"`、JS 禁止の再明記、過去のマージを壊さないこと、`go test ./...`・`go vet`・`gofmt`・実サーバー + playwright-cli による実ブラウザ検証の義務、decisions.md/bugs.md/pitfalls.md への記録、新ブランチから PR を出してマージはしないこと、PR 末尾に `### Modern Web Guidance` 節（適用ガイドの引用付き）を付けること、だった。

私の側のレビュー手順は、diff を読む → ローカルで `go test ./...`・`go vet`・`gofmt -l .` を流す → PR に COMMENT レビューを投稿 → `gh pr merge --squash --delete-branch` → issue #3 に実施コメント → 次のプロンプトを渡す、の定型になった。

前半の 6 タスク（todo-gc 修正から rendering perf まで）は私の API 経由で立てた子セッションが実装した。CSP タスクの起動直後に組織が `out_of_quota` になり、以降は依頼した人が Free モードで立てたセッションに私がプロンプトを渡す形に切り替わった（後述の試行錯誤）。実装者の系統が変わってもプロンプトとレビュー手順は同じまま進んだ。

## マージごとの変化と、使われるようになったブラウザ機能

| # | PR | 変化 | 新たに使われるブラウザ機能 |
| --- | --- | --- | --- |
| 1 | [#6](https://github.com/podhmo/go-classic-mpa-sample/pull/6) | todo-gc のバグ 3 件修正（archive 書込順序・空行でのネスト喪失・note 配下の sweep 漏れ）。ツールの話でブラウザ機能は関係ない | — |
| 2 | [#7](https://github.com/podhmo/go-classic-mpa-sample/pull/7) | ライト固定だった配色を OS 設定追従の二系統に | `color-scheme`（meta + CSS プロパティ）、`light-dark()`、`prefers-color-scheme`（SVG favicon 内の media query 含む）、`contrast-color()` + 非対応時の Relative Color Syntax フォールバック |
| 3 | [#8](https://github.com/podhmo/go-classic-mpa-sample/pull/8) | MPA 遷移に 0.18s のクロスフェード。POST→303 リダイレクト後にも効く | cross-document view transitions（`@view-transition { navigation: auto }`、`::view-transition-group(root)`）、`prefers-reduced-motion` で opt-in 制御 |
| 4 | [#9](https://github.com/podhmo/go-classic-mpa-sample/pull/9) | 削除確認が JS なしのモーダル化。非対応ブラウザは従来の GET 確認ページへ出し分け | Invoker Commands（`commandfor`/`command="show-modal"`/`"close"`）、モーダル `<dialog>`（Esc・`closedby="any"` の背景クリック閉じ・フォーカス復帰）、能力検出に `sibling-index()` の `@supports` |
| 5 | [#10](https://github.com/podhmo/go-classic-mpa-sample/pull/10) | エラー表示が「インタラクション後のみ」に統一。422 再表示は最初のエラー欄へフォーカス | `:user-invalid`、`.field:has()`、制約検証 API の `pattern`、サーバー駆動の `aria-invalid`/`aria-describedby`/`autofocus` |
| 6 | [#11](https://github.com/podhmo/go-classic-mpa-sample/pull/11) | px 固定をやめ OS テキストスケールに追従。640px ブレークポイント廃止 | `<meta name="text-scale">`、rem 化、コンテナクエリ（`@container`・`cqi`）、`repeat(auto-fit, minmax())`、`line-clamp: 2`、`pointer: coarse` の 44px ターゲット、`text-wrap: pretty/balance` |
| 7 | [#12](https://github.com/podhmo/go-classic-mpa-sample/pull/12) | 50 件以上のスレッドで画面外コメントの描画を遅延（200 件で style+layout 171→51ms） | `content-visibility: auto` + `contain-intrinsic-block-size`、`:has(> :nth-child(50))` での件数条件付け |
| 8 | [#13](https://github.com/podhmo/go-classic-mpa-sample/pull/13) | `default-src 'none'` ベースの CSP 投入。bugs.md #13' の見送りを解消 | `Content-Security-Policy`（`script-src 'none'`、`style-src-attr 'unsafe-inline'` 等）、COOP、CORP、Permissions-Policy、`Vary: Sec-Fetch-Site, Origin` |
| 9 | [#14](https://github.com/podhmo/go-classic-mpa-sample/pull/14) | スキップリンク追加と全テンプレートの a11y 監査 | スキップリンク（`:focus` で出現、`tabindex="-1"` の `<main>`）、`role="list"`（Safari の list-style:none 対策）、`role="search"`、`aria-current="page"`、`.visually-hidden` |
| 10 | [#15](https://github.com/podhmo/go-classic-mpa-sample/pull/15) | 一覧ページの issue リンク・Next を投機的 prefetch | `Speculation-Rules` レスポンスヘッダー、`application/speculationrules+json` 外部 ruleset、`selector_matches` + `eagerness: moderate`、（リクエスト側）`Sec-Purpose: prefetch` / `Sec-Speculation-Tags` |
| 11 | [#16](https://github.com/podhmo/go-classic-mpa-sample/pull/16) | #12 の副作用（AX ツリーからコメント消失）を部分緩和 | 上記 `content-visibility` の対象を `<li>` から `.comment-body` に限定 — ブラウザ機能追加ではなく既存機能の適用範囲調整 |

全部に共通するのは、どれも「ブラウザに宣言してあとは UA に任せる」形の機能ばかりになったこと。no-JS の制約がガイド選びを絞った結果、導入された機能は CSS 宣言・HTML 属性・HTTP ヘッダーの 3 種に収まっている。

## 試行錯誤で困ったこと

大きかったのは次の 4 件。

### クォータ切れと Free モードの不可視性

7 タスク目（rendering perf）のマージ直後、組織が `out_of_quota` になった。起動直後の CSP 用子セッションは 0 ACU で中断し、そこへのメッセージ送信すら 403 billing エラーになった。`devin_mode` を lite に下げても同じエラー、`"free"` や `swe-2-*` はモード名として受理されなかった。API から作れるモード（normal/fast/fusion/lite/ultra/fast-ultra）はすべて課金対象で、webapp の Free（SWE-2）ピッカーは UI 側だけの概念らしい。結局、Free セッションを依頼した人が立て、私が貼り付け用プロンプトを渡す運用に変更した。子セッションに私から連絡できないので、完了の合図も「できたよ」の一言に依存する形になったが、PR が物差しなので回った。

### inline speculation rules が CSP に殺される

`<script type="speculationrules">` は実行されない JSON なので `script-src` の対象外だと思い込んでいたが、Chromium 156 では素直に "Applying inline speculation rules violates Content Security Policy directive 'script-src 'none''" でブロックされた。解決は `Speculation-Rules` レスポンスヘッダー + 外部 JSON ruleset への切り替えで、`<script>` 要素自体を置かない配信にした。周辺の制約も多く、ヘッダー値は引用符つき sf-string が必須、ruleset は `application/speculationrules+json` でなければ無視される、CSP `prefetch-src` は Chrome 未実装、投機 fetch はブラウザプロセス発で Playwright の Network 観測に出ない（サーバー側ロギングプロキシで `Sec-Purpose: prefetch` を見て検証した）、と一つずつ実測で判明した。詳細はリポジトリの pitfalls.md に記録した。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -3 607.7999999999998 345.2" width="608" height="345" role="img" aria-label="inline speculationrules は CSP にブロックされるが Speculation-Rules ヘッダ配信なら共存できる図">
<text x="10" y="20" font-size="13" fill="currentColor">inline &lt;script&gt;</text>
<rect x="20" y="40" width="200" height="80" rx="10" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="30" y="58" font-size="11" fill="currentColor" opacity="0.7">document</text>
<rect x="35" y="70" width="217.9999999999999" height="34" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="143.99999999999994" y="87" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">&lt;script type=speculationrules&gt;</text>
<rect x="280" y="40" width="14" height="80" rx="8" fill="none" stroke="#D55E00" stroke-width="2.5"/>
<text x="254" y="140" font-size="12" fill="currentColor">CSP</text>
<text x="254" y="156" font-size="11" fill="currentColor" opacity="0.8">script-src 'none'</text>
<rect x="360" y="63" width="178.39999999999992" height="34" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="449.19999999999993" y="80" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">✕ blocked (Chromium 156)</text>
<path d="M255.90399069449728 86.24711352364882 L277.0960093055026 80.75288647635118" fill="none" stroke="#D55E00" stroke-width="1.5"/><path d="M269.4004339650845 86.9319333429762 L277.0960093055026 80.75288647635118 L267.3676404789363 79.09115846783321" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<path d="M294 80 L360 80" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.7"/>
<text x="10" y="220" font-size="13" fill="currentColor">Speculation-Rules header</text>
<rect x="20" y="240" width="240" height="80" rx="10" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="30" y="258" font-size="11" fill="currentColor" opacity="0.7">HTTP response</text>
<rect x="35" y="270" width="250.99999999999986" height="34" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="160.49999999999994" y="287" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">Speculation-Rules: "/static/….json"</text>
<rect x="360" y="263" width="237.79999999999987" height="34" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="478.8999999999999" y="280" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">application/speculationrules+json</text>
<path d="M288.9866672053435 286.71747742652155 L357.0133327946564 280.28252257347845" fill="none" stroke="#3B82C4" stroke-width="1.5"/><path d="M348.4347366528214 285.16209102112765 L357.0133327946564 280.28252257347845 L347.6719257044296 277.0980895666999" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="360" y="330" font-size="11" fill="currentColor" opacity="0.7">no &lt;script&gt; element → CSP と共存</text>
</svg>
```

### content-visibility の副作用と閾値

ガイドの勧める `content-visibility: auto` は、実測すると小さいスレッドではむしろ悪化した（11 件で 37→43ms）。効くのは 50 件以上で、200 件では 171→51ms に縮んだので「50 件以上のスレッドの 3 件目以降」という条件つき適用になった。一覧の `.issue-row` も計測では微増悪化だったため採用せず。さらに後日、スキップ中のコメントが Chromium のアクセシビリティツリーから落ちる副作用が見つかり（bugs.md #23）、完全解消には最適化の撤去が要る一方、対象を `<li>` から `.comment-body` に移すだけで listitem とパーマリンクは AX ツリーに残ることが CDP `Accessibility.getPartialAXTree` で確認できたので、そこまで戻す「部分緩和」で着地した（PR #16）。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 -3 725.8 243" width="726" height="243" role="img" aria-label="content-visibility を <li> から .comment-body に移すと AX ツリーに listitem とパーマリンクが残る図">
<text x="20" y="20" font-size="13" fill="currentColor">before: CV on &lt;li&gt;</text>
<rect x="60" y="50" width="158.59999999999994" height="30" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="139.29999999999995" y="65" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">li.comment → listitem</text>
<rect x="30" y="110" width="105.79999999999998" height="30" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="5 4"/>
<text x="82.89999999999999" y="125" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">.comment-head</text>
<rect x="190" y="110" width="105.79999999999998" height="30" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="5 4"/>
<text x="242.89999999999998" y="125" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">.comment-body</text>
<path d="M139.29999999999995 80 L82.89999999999999 110" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.7"/>
<path d="M139.29999999999995 80 L242.89999999999998 110" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.7"/>
<text x="30" y="160" font-size="11" fill="currentColor" opacity="0.7">children=0 — head &amp; body notRendered</text>
<text x="420" y="20" font-size="13" fill="currentColor">after: CV on .comment-body</text>
<rect x="460" y="50" width="158.59999999999994" height="30" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="539.3" y="65" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">li.comment → listitem</text>
<rect x="430" y="110" width="105.79999999999998" height="30" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="482.9" y="125" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">.comment-head</text>
<rect x="620" y="110" width="105.79999999999998" height="30" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="5 4"/>
<text x="672.9" y="125" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">.comment-body</text>
<path d="M539.3 80 L482.9 110" fill="none" stroke="#00A876" stroke-width="1.5" opacity="0.9"/>
<path d="M539.3 80 L672.9 110" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.7"/>
<text x="430" y="160" font-size="11" fill="currentColor" opacity="0.7">children=2 — 番号・パーマリンクは残る</text>
<rect x="250" y="200" width="75.8" height="30" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="287.9" y="215" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">AX に残る</text>
<rect x="400" y="200" width="92.6" height="30" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="5 4"/>
<text x="446.3" y="215" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">notRendered</text>
</svg>
```

### HTML 機能は CSS から検出できない

削除ダイアログは「対応ブラウザは dialog、非対応は GET 確認ページ」を出し分ける必要があったが、Invoker Commands は HTML の機能で `@supports` からは見えない。`type` 省略で「対応なら command、非対応なら submit」の二刀流も、Chrome 156 では送信も command もしない警告になるだけで成立しなかった。最終的に、ブラウザ互換データ上 Invoker Commands より後か同時に出荷されている `sibling-index()` を代理指標にして `@supports` で出し分けた。誤判定は「対応しているのにリンク側が出る」方向にだけ起き、その場合も GET ページで削除できる安全側になっている。

このほか小さなハマりどころは子エージェント側にも溜まっていて、playwright-cli が VM で executablePath の設定を要求すること、Playwright の `selectOption` では `:user-invalid` が立たないこと、`page.goto` 遷移では cross-document view transition が発火しないこと、フォーム送信直後のスクリーンショットが 0.18s の遷移途中を撮ることなどは、発見されるたびに pitfalls.md に記録された。

## 結果

TODO.md の 10 タスク + bugs.md #23 の緩和がすべて main に squash マージされ、open の TODO は 0 件。各タスクの実施サマリは [issue #3](https://github.com/podhmo/go-classic-mpa-sample/issues/3) に個別コメントとして残っている。判断経緯は `docs/ja/decisions.md`、発見したバグは `bugs.md`（#17–24 修正、#23 部分緩和）、ハマりどころは `pitfalls.md` に記録された。

残っているもの: bugs.md の wontfix 6 件（styled 405、ASCII のみの検索、fmtTime の分単位表示など、いずれも実害が薄いため記録のみ）と、#23 の残存リスク（スキップ中コメントの本文テキストはブラウズモードに出ない。完全解消には content-visibility の撤去が必要で、~120ms の perf 回帰とのトレードオフで見送った）。検索 UX 系のガイド（`q=` の結果表示改善など）もカタログにあったが、明確な不足を確認できず採用しなかった。

## もし JS 禁止がなかったら入れたかったもの

執筆後にカタログ 208 本を見直した。第 1 フィルタで「実行 JS が必須」としてまとめて落とした群の中に、このアプリにとって実害・未練のあるものがいくつかある。仮に制約がなければ、この順で入れたい。

- `same-document-transitions` — 一覧の issue 行から詳細ページへ、共有要素のモーフィング（行のタイトルがそのまま詳細の見出しに伸びる GitHub 的な遷移）。cross-document のクロスフェードは入ったが「要素が続いている」感は `document.startViewTransition` がないと作れない。MPA でも視覚的な繋がりを出せる最大の一手。
- `directional-navigation-transitions` — ページネーションの「次へ/前へ」でスライド方向を変える。PR #8 で設計まで進んだが方向の判別に JS が要り見送った。no-JS で諦めた中では一番惜しい。
- `accessible-error-announcement` — `aria-invalid` を `:user-invalid` とリアルタイム同期させる。PR #10 で「サーバー再描画時のみ同期」に留めた未練。422 表示後に入力を直しても aria-invalid が外れないのはスクリーンリーダー実害。
- `ime-safe-enter-submit` — コメント textarea の Ctrl/Cmd+Enter 送信。IME 変換中の Enter 誤爆を `isComposing`/`keyCode 229` で防ぐ。日本語の利用者が主なので素直に欲しい。
- `hovercard` — コメント本文中の `#3` リンクに issue 概要のホバーカードを出す。参照先を開かずに文脈を保てる、情報量向上としては最大級。
- `highlight-text-ranges` — `q=` 検索のヒット箇所を Custom Highlight API（`::highlight()`）でマーク。DOM を書き換えずテキスト範囲だけ着色できる。
- `copy-button` — issue URL や `#comment-N` パーマリンクのコピーボタン。Invoker Commands + Async Clipboard。小さいが毎日使う系。
- `form-fields-automatically-fit-contents` — コメント textarea の自動伸縮。本命は CSS の `field-sizing: content` で、JS が要るのは非対応ブラウザ向けのフォールバック側。
- `dynamic-sort` — issue 一覧の並び替えをフルリロードなしで。サーバーソートリンクにすれば MPA のままでも機能自体は作れるが、JS なら既存ノードの入れ替えを view transition でアニメーションしつつ aria-live で一度だけ告知できる。
- `dark-mode-toggle` — system/light/dark の三状態トグル。現状は OS 設定のみ。実は cookie + フォーム POST でも実装可能だが、ガイドの本命は localStorage で FOUC なく切り替えるもの。
- `summarizer` — 長いスレッドの要約ボタン（on-device Summarizer API）。content-visibility で描画を絞るほど長いスレッドを、そもそも読まずに済ませる方向。玩具枠だが試してみたかった。
- `swipe-to-reveal`、`interest-triggered-action-previews` — モバイルで issue 行をスワイプして close/delete を出す、削除ボタンへの hover/focus で対象行を事前ハイライトする。どちらも小さいながら実用。

逆に「JS があっても要らない」と再確認したもの: passkeys 系（認証がない）、autofill 系（住所・決済フォームがない）、carousel・media 系（画像投稿がない）、service worker・INP 系（オフライン要件も重い処理もない）、Web Components 系（テンプレート部品化は html/template で足りている）。

## 余談

- CSP は bugs.md #13' で「ラベル色の inline `style=` と相性が悪い」と一度見送られていた。`style-src-attr 'unsafe-inline'` という「style 属性だけ通して `<style>` 要素は塞ぐ」ディレクティブで最小の穴にできたため、過去の wontfix を取り下げて採用に転じた。nonce/hash は style 属性値には効かないので、これが取りうる最も狭い穴だった。
- `sibling-index()` を能力検出の代理に使う手は、HTML 機能を CSS から条件分岐したいときの汎用テクニックとして使い回せそう。誤判定の方向を安全側に倒せることが前提になる。
- ラベルバッジの文字色コントラスト不足（WCAG AA 未達）は、ダークモード作業中の計算で偶然見つかった副産物（bugs.md #20）。`contrast-color()` 非対応向けに Relative Color Syntax の XYZ 輝度計算をフォールバックに挟んだ。
- 投機的読み込みの観測には、ブラウザ側ではなくサーバー側のヘッダーを見るのが確実だった。このアプリにはリクエストログがないので、検証のためだけに標準ライブラリのロギングプロキシを別ポートに立てた。
- todo-md スキルの移植元である todo-gc 自体が、最初のレビューで 3 件の実バグを指摘された（書込順序によるデータ喪失など）。「TODO 運用ツールのバグ修正」が最初の子タスクになったのは偶然だが、後続タスクの `[x]` 処理が全部このツールに乗るので、先に潰せてよかった。
- Devin 側の話。私（orchestrator）自身は webapp のピッカーで選ばれた free-for-teams モードで動いていて、ACU 消費は 0 だった。ところが子セッション作成 API の `devin_mode` に `free` は存在せず（422）、`swe-2-*` 系を直接指定しても「このユーザーでは利用不可」（400）で、API から立てられるのは `normal`/`fast`/`fusion`/`lite`/`ultra`/`fast-ultra` の課金対象モードだけだった。つまり Free の子セッションは私からは絶対に立てられない。加えて途中で組織が `out_of_quota` になり、課金モードの作成は全部 403 billing エラー、中断した子セッションへのメッセージ送信すら 403 になった。デフォルトモデルの normal でも Lite でも同じ壁で、クォータの外にある無料モードだけが UI 限定という、板挟みの状態だった。依頼した人に Free セッションを立ててもらい、私はプロンプトとレビューだけを担う運用に切り替えて完走した。
- この記事の図は `tools/svg-gen` の生成器で作った。生成器は `tools/svg-gen/examples/fig-mwg-funnel.ts`、`fig-ax-comment.ts`、`fig-speculation-delivery.ts` にある。
