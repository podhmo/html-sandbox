# SPA だからこそ必要になった modern-web-guidance

実装では `npx modern-web-guidance search/retrieve` のガイドを逐次適用してきた。ほとんどは MPA 版でも使っていたもの（`<dialog>`、`:user-invalid` + aria 同期、`<search>`、Ctrl+Enter、hover-reveal は opacity のみ、等）で、これらは SPA にもそのまま効く。ここでは「MPA では full-page load が無料でやってくれていたので、SPA で新たに必要になった」分だけを取り上げる。一覧は `docs/sketch/ja/libraries.md` にも記録してある。

## 適用したもの

- スクロール復元 — `createRouter({ scrollRestoration: true })`。MPA ではブラウザが履歴ごとに scroll 位置を戻す。SPA は DOM が生き残るので router が記憶・復元する側になる
- intent preload — `defaultPreload: 'intent'`（improve-next-page-load-performance ガイド）。hover/focus の時点で遷移先 route の loader を先行実行し、クリック時には温まったデータで遷移する。MPA でいう prefetch に相当するが、SPA では「loader の先行」という形になる
- `document.title` の追従 — `usePageTitle`（`src/page-title.ts`）で pathname→辞書キー→title。MPA では `<title>` は template が毎回書き出すので考えなくてよい。SPA では route が変わっても document は同じなので、明示的に更新しないと前ページの title が残る
- 遷移時フォーカス — `router.subscribe('onResolved')` で pathname 変化時に `#main-content`（`tabIndex={-1}`）へ `preventScroll` で focus。ページロード相当の「文書の先頭から読み始める」挙動を SR ユーザーにも提供する、route focus management のガイド
- 遷移中の pending bar — RootLayout に `<progress class="route-progress">`（indeterminate）。`useRouterState` の pending で mount し、CSS の遅延 fade-in で速い遷移では出さない。MPA ではブラウザのタブ spinner が担っていたもの
- 離脱ガード — `useBlocker`（in-app 遷移を `window.confirm` で止める）+ `enableBeforeUnload`（ブラウザの離脱・reload）。MPA は `beforeunload` だけで足りた（アプリ内遷移＝ページ遷移なので）。SPA は同じページ内遷移でもドラフトを失うので両方必要。複数フォームが同時に dirty なとき confirm が重複しないよう、ページ共通の latch を噛ませ、router の onResolved で再武装する設計にした
- コード分割 — react-markdown + remark 系 ~160KB を `React.lazy` + `Suspense` で別チャンク化（fallback は生テキスト）。初期 JS を 582KB→418KB に。MPA では JS は「小さい複数ファイルを普通に script 読み込み」なので bundling の話自体が無い
- `content-visibility: auto` — `.issue-row`/`.comment` に付け、画面外アイテムのレイアウト・描画をスキップ（faster-spa-view-transitions の DOM コスト削減）

## 計測してみたこと

chrome-devtools-cli で reload trace を取り、LCP と DOM 規模を計測した（2026-11-25 時点）。

- `/w/default/issues`: LCP 418ms（TTFB 3ms, render delay 415ms）, CLS 0, DOM 116 nodes
- `/w/default/issues/8`: LCP 434ms, DOM 同程度
- `/w/default/discussions`: DOM 111 nodes

DOM は全画面で ~40-120 nodes / depth ≤9 と小さく、`content-visibility` も適用済みなので DOM 自体は健全と判断し、追加の最適化は入れていない。render delay の大半は dev server の module 変換 + 初回 loader fetch の waterfall で、本番ビルドでは縮む想定（未検証）。

## 教訓として

MPA で「ブラウザがやること」だった振る舞いは、SPA では全部「router がやること」になる。一覧の半分（title/focus/scroll/pending/leave-guard）はユーザー体験としては退化させてはいけない類のもので、フレームワークを選ぶときに「これを埋める仕組みがあるか」は実際に選定基準になりうる。TanStack Router はこの点で必要な option/subscriber が揃っていたので、自前の履歴管理を書かずに済んだ。
