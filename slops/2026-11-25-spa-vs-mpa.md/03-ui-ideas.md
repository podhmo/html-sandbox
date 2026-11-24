# 追加したくなった UI 実装

[ui-rules.md](https://github.com/podhmo/go-spa-sample/blob/devin/1795551400-spa-ui-rules/docs/ja/ui-rules.md) や移植 parity とは関係なく、実装していて「あったらよさそう」と感じたもの。優先度ではなく思いつき順。これらは TODO 化していないので、この節が唯一の記録になる。

## トースト通知

MPA には `toast.js` + `announcer.js` がある。SPA 側では成功フィードバックを「遷移 + 再描画で代替」と ui-rules に書いて N/A 扱いにしたが、実際には投稿・保存が成功しても画面に何の応答も出ない箇所が残っている。コメント投稿後に `#comment-N` へ遷移するので「新しいコメントが見える」ことが半分のフィードバックだが、hide/unhide やラベル編集のような「同じ場所に留まる mutation」では本当に静か。

実装の置きどころは決めていないが、`aria-live` の toast 群 + `role="status"` の組み合わせで、CopyButton の feedback bubble と同じ作り方がそのまま使えるはず。

## Write / Preview のエディタタブ

ui-rules の N/A 表に「Write / Preview エディタタブなし」と既に記してある。本文は GFM で書く仕様なので、markdown の見た目を投稿前に確かめたい場面は実際にある（特に pull の review comment で diff_snippet の引用と自分の文を組み合わせるとき）。

実装は `Markdown` コンポーネントを textarea の横に切り替え表示するだけで、`React.lazy` のチャンクも既にできているので追加コストは小さい。textarea が uncontrolled な箇所（PullDetail の編集・DiffRow）は draft を controlled にするか、toggle 時に FormData を読む必要がある。

## 相対時刻の自動追従（却下）

最初は「『3分前』が時間とともに更新されないので、`<time>` のテキストだけ更新する小さい仕組みが欲しい」と書いていた。しかしフィードバックで却下: 相対時刻へのこだわりは欧米圏の文化で、日本を含むアジア圏ではむしろ使いにくいという認識がある。絶対時刻（ja なら `YYYY年M月D日 HH:MM`）のほうが読みやすく、相対時刻は全部無くしたいくらいだという。SPA だから簡単にできることと、やるべきことは別、といういい例になったので記録として残す。

## `#comment-N` のスクロール + ハイライト

投稿後の遷移では URL に `comment-N` の hash を付けているが、router の scroll-to-element 的な挙動と、着地点の一時ハイライト（`:target` や transition）を入れていない。GitHub 的には permalink クリックでそのコメントがハイライトされるのが自然で、今は「移動した先で自分で探す」状態。

`onResolved` の subscriber で hash を見て scrollIntoView + 一時 class を付ける形で実装できそう。

## キーボードショートカット

`j`/`k` で一覧の行移動、`c` で新規作成、`g i`/`g d`/`g p` でセクション移動、あたりは GitHub 風の最低限で、issue tracker としては自然な拡張。reducer パターンのまま selection を state に持てるので相性は良い。IME との衝突だけ注意（入力中は無効化）。

## diff のコンテキスト展開

現在の `/pulls/{id}/files` は unified diff をそのまま出しているが、行数が多いと hunk 間の省略された部分を「展開」したくなる。MPA 側にも無い機能なので完全な新規。API 側に `context` パラメータかファイル単位の raw 取得を足す必要がある。

## 軽い live 更新

MPA の SSE live-updates は「port しない」と AI が途中で勝手に決めたもので（AGENTS.md の JSON-API only 方針）、プロダクトの判断としては未決定。複数のエージェントが discussion を更新しそれを人間が眺める viewer としての用途を考えると、live 更新はむしろ欲しい機能になりうる。SPA の loader モデルなら visibilitychange/focus 時の `router.invalidate()` という最小限の追従で近い体験が作れるが、SSE 相当の即時性が要るなら別途設計が必要。見直し予定の論点として記録しておく。

## まとめ

一番実用的なのはトーストと Preview タブだと思う。どちらも「形」は既にある（CopyButton の bubble、Markdown component）ので、小さく足せる。
