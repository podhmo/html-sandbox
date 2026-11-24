---
title: MPA+ajax から SPA への移植 — やったことと、実装から見えた差分
description: go-classic-mpa-sample の issue tracker を Go API + React SPA に移植した一連の作業をふり返る。MPA+ajax と SPA の違いを実際の実装を元に比較し、何がやりやすく何がやりにくくなったか、SPA だからこそ必要になった modern-web-guidance、追加したくなった UI、そして両者の「放置のしやすさ」を整理する。
prev: ../2026-11-23-moonbit-port-for-quality.md
---

# MPA+ajax から SPA への移植 — やったことと、実装から見えた差分

> [!NOTE]
> 執筆: Devin。作業対象は [podhmo/go-spa-sample](https://github.com/podhmo/go-spa-sample)。元実装は [podhmo/go-classic-mpa-sample](https://github.com/podhmo/go-classic-mpa-sample)（issue tracker「zatudan」、Go のサーバレンダリング + 素の JS による ajax 強化）。成果は stacked PR 15 本（[#1](https://github.com/podhmo/go-spa-sample/pull/1) から [#16](https://github.com/podhmo/go-spa-sample/pull/16) まで。#3 は欠番。いずれもオープン）。

## この記事の構成

1. やったこと（この README。自分が書いた分と、リポジトリ作成後に先行してあった分を分けて記す）
2. [MPA+ajax と SPA の違いは何か](#01-mpa-vs-spamd) — 実装を元に、楽になったこと・難しくなったこと
3. [SPA だからこそ必要になった modern-web-guidance](#02-spa-guidancemd) — MPA が full-page load で無料でもらっていた振る舞いの再実装
4. [追加したくなった UI 実装](#03-ui-ideasmd) — ルールとは無関係に「あったらよさそう」と感じたもの
5. [放置のしやすさの比較](#04-maintainabilitymd) — 依存面積と dependabot 要不要、依存ライブラリの終了リスク

各節の見出しから元の Markdown ファイルにも飛べる。

## やったこと

### 先行してあったもの（リポジトリ作成後、今回の作業以前）

master の履歴を見る限り、issues スコープの基礎は既にあった。

- `cmd/zatudan` の Go API サーバ（issues スコープ）の移植と `/api/v1` 骨格
- issues の SPA 一式（一覧・詳細・作成/編集・コメント・hide/unhide・permalink・markdown 描画）と Vitest browser mode のテスト基盤
- MPA のマークアップ・CSS・fmtTime 等の parity 合わせ、`oxfmt` 導入、CI workflow、`modern-web-guidance` の初回適用
- TanStack Query の評価と「今は導入しない」という判断の記録（`docs/sketch/ja/tanstack-query.md`）
- `/api` 疎通確認用の `cmd/fakeapi` スパイク

つまり「MPA の API を Go で移植し、issues だけ SPA 化した雛形」が出発点。TODO.md に残っていたのは残り機能の移植と構成決定だった。

### 今回やったこと（実装の主体）

- workspace スコープ `/w/{slug}` — scope 違いリソースへの GET が 404 になるとき `error.workspace` + `X-Workspace-Slug` ヘッダで正しい slug を返し（[PR #1](https://github.com/podhmo/go-spa-sample/pull/1)）、SPA 側は `/w/{slug}/issues…` 構造にルートを再編。workspace なし URL は default/先頭へ誘導、一覧・作成・削除の workspaces UI 追加（[PR #2](https://github.com/podhmo/go-spa-sample/pull/2)）。MPA の 302 誘導を SPA の「404 ヒント + クライアント側 rebase」に置き換えた形
- Discussions — threads + replies、category/answered フィルタ、qa の answer マーク、hide/unhide、markdown エクスポートを API（[PR #4](https://github.com/podhmo/go-spa-sample/pull/4)）と UI（[PR #5](https://github.com/podhmo/go-spa-sample/pull/5)）に移植
- Pull Requests — `internal/gitrepo`（`git merge-tree` による mergeability、plumbing merge、rev 解決）と `/api/v1/pulls*`（[PR #6](https://github.com/podhmo/go-spa-sample/pull/6)）、一覧・詳細・files diff・行内レビューコメント・merge ダイアログ（merge/squash/rebase）の UI（[PR #7](https://github.com/podhmo/go-spa-sample/pull/7)）。`-repo` フラグまたは `.git` 自動検出、repo なし配備では Pulls ナビ自体が消える
- 認証 — cookie セッションの register/login/logout/me（[PR #8](https://github.com/podhmo/go-spa-sample/pull/8)）と `/login`・`/register` ページ、nav のセッション表示、`?next=` バウンス（[PR #9](https://github.com/podhmo/go-spa-sample/pull/9)）。API 側は従来の Bearer token も残し CLI や開発 proxy が使う
- `zatu` CLI — gh 風 CLI を local（DB 直）/remote（API 経由）両バックエンドで移植（[PR #10](https://github.com/podhmo/go-spa-sample/pull/10)）
- i18n (en/ja) — `en.ts` が正の型付き辞書（`ja: typeof en` で欠キーをコンパイル時に弾く）、nav の言語スイッチ（[PR #11](https://github.com/podhmo/go-spa-sample/pull/11)）
- fakeapi 撤去 + 本番構成メモ — スパイク残骸を消し（[PR #12](https://github.com/podhmo/go-spa-sample/pull/12)）、embed 配信 + セッション vs 別配備 + token の比較だけ書いて決定は保留（[PR #13](https://github.com/podhmo/go-spa-sample/pull/13)）
- SPA 固有のページ遷移品質 — `document.title` 更新、遷移時の `#main-content` フォーカス、スクロール復元、intent preload、route 単位のコード分割、遷移中 pending bar、markdown の lazy chunk 化、`content-visibility`（[PR #14](https://github.com/podhmo/go-spa-sample/pull/14)）。chrome-devtools-cli による LCP/DOM 計測基盤もこの時に導入
- SPA 版 ui-rules.md — MPA 版の規約を SPA の語彙に移植し、[正]/代案/変更予定/N/A の構造で整備（[PR #15](https://github.com/podhmo/go-spa-sample/pull/15)）
- 離脱ガード + 空送信 disabled — `useBlocker` + `beforeunload` の両対応 leave-guard、コメント空送信の disabled 化（[PR #16](https://github.com/podhmo/go-spa-sample/pull/16)）

上に挙げた15本すべてが GitHub の stacked PR として `master` 基点で積み上がっている（stack #3）。各 PR は Devin Review の findings を何ラウンドか往復しており、実バグ（返信ドラフトの保持、stale anchor の再送、uncontrolled textarea とフラグの不整合など）もその過程でいくつか直っている。

## 検証のやり方

各機能は vitest browser mode（実 Chrome）で component 級のテストを書き、その後 playwright-cli で実サーバ + 実ブラウザの疎通確認をした。最終時点で 57 件の browser テストが通る。PR の files diff では実際に行内コメントを投稿し、squash merge まで実 git repo で確認済み。

続き: [MPA+ajax と SPA の違いは何か](#01-mpa-vs-spamd)
