# MPA+ajax と SPA の違いは何か

両者の実装を並べて書いた上での差分を、架空の一般論ではなく今回のコードに即して書く。

## mutation のライフサイクル

一番の違いは「mutation 後に画面を作り直す主体」。MPA は form POST → PRG の 302 → GET でサーバが HTML 全体を再生成する。SPA は JSON POST のあと `router.invalidate()` で loader のデータを取り直し、React が DOM を reconcile する。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -1 450 229.2" width="450" height="229" role="img" aria-label="mutation 後に画面を作り直す主体の違い。MPA はサーバ、SPA はブラウザ">
<text x="10" y="22" font-size="13" fill="currentColor">MPA (POST -&gt; 302 -&gt; GET)</text>
<rect x="10" y="40" width="120" height="34" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="70" y="57" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">ブラウザ</text>
<rect x="250" y="30" width="190" height="54" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="345" y="49.85" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">サーバ</text>
<text x="345" y="64.15" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">templates が HTML 全体を再生成</text>
<path d="M133 52 L247 52" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M238 56.05 L247 52 L238 47.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M247 62 L133 62" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M142 57.95 L133 62 L142 66.05" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="150" y="46" font-size="11" fill="currentColor">POST form</text>
<text x="150" y="66" font-size="11" fill="currentColor">302 → GET → HTML</text>
<text x="10" y="122" font-size="13" fill="currentColor">SPA (POST -&gt; invalidate -&gt; navigate)</text>
<rect x="10" y="140" width="180" height="54" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="100" y="159.85" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">ブラウザ</text>
<text x="100" y="174.15" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">router + loader + component</text>
<rect x="300" y="150" width="110" height="34" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="355" y="159.85" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">サーバ</text>
<text x="355" y="174.15" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">JSON のみ</text>
<path d="M193 162 L297 162" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M288 166.05 L297 162 L288 157.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M297 172 L193 172" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M202 167.95 L193 172 L202 176.05" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="200" y="146" font-size="11" fill="currentColor">POST mutation / GET (loader)</text>
<text x="200" y="182" font-size="11" fill="currentColor">JSON</text>
<text x="18" y="216" font-size="11" fill="currentColor">DOM reconcile — scroll / focus / draft は保持</text>
</svg>
```

ただし MPA 側も単純な PRG だけではない。`X-Partial` ヘッダを付けた ajax POST にはサーバが fragment HTML を返し、`fragments.js` が scoped view transition つきで差し替える（コメント投稿・hide など）。詳細ページでは SSE（`live-updates.js`）が「{kind, target} のヒント」を受けて該当 fragment を再取得して upsert する。つまり MPA+ajax の本質は「画面の一部だけサーバレンダリングし直す」ための自作の部分更新プロトコルだった。SPA はそれを JSON + reconcile に置き換えた、と見るのが正確。

## 楽になったこと

- 部分更新のプロトコルが要らなくなった。 MPA では「ページ全体用の template」と「X-Partial 用の fragment template」を両方保守し、swap 後に JS の初期化（dom-hooks）を再実行する必要があった。SPA は loader が JSON を取り直すだけで、reconcile が差分を当てる。コメント1件の更新のために「partial 版のハンドラとテンプレ」を書く必要がない
- ページをまたがない UI 状態がタダ。 編集フォームの開閉、diff 行への行内コメントフォームの出し入れ、返信ボックスの折りたたみは全部 `useReducer` の state で、再描画しても消えない。MPA で同じことをするには fragment swap の範囲を自分で設計する必要がある
- mutation から導線までの距離が短い。 「コメント投稿 → そのコメントへ遷移（`#comment-N`）」を onSubmit の中で await で書ける。MPA だと 302 Location か fragment の指示をレスポンスに載せる設計が要る
- pending・二重送信・再試行の型が揃う。 `useTransition` の pending、invalidate、error boundary の retry がフレームワークの語彙で書ける。MPA では `partial-submit.js`/`form-errors.js`/`enter-submit.js` に分散していた
- 複数箇所にまたがる情報更新が data binding に乗る。 1つの変更を起点に複数箇所の表示が変わる挙動は、loader のデータからの導出として書ける。MPA の fragment 方式だと「どの partial がどの状態に依存するか」を人間が設計・管理する必要がある
- フィルタ遷移の合成が楽。 `search` param を変えて navigate すれば loader が取り直す。GET form の submit + name 属性の制御という MPA の作法を考えなくてよい

## 難しくなったこと

- ブラウザが無料でやってくれた振る舞いを全部 opt-in で取り戻す。 `document.title`、遷移時フォーカス、スクロール復元。MPA なら full-page load が自動的にやるものを、SPA では router の subscribe/option で自分で配線する（次の記事で詳しく）。離脱ガードだけは別扱いで、MPA でも `beforeunload` は自動ではなく leave-guard.js で自前登録していた。ただし SPA では「ナビゲーション自体を止める」`useBlocker` と `ignoreBlocker` の設計が別途必要になった
- PRG が消えた分の安全性を自前で持つ。 MPA は POST→302→GET なので F5 での二重送信も直リンクも安全。SPA では「invalidate を navigate より先に呼ぶ」（遷移先が古い loader snapshot を見せないため）、submit 後の navigate が leave-guard に引っかからないよう `submitted` フラグや `ignoreBlocker` を使う、といった約束を自分で守る。実際この辺りはレビューで実バグとして拾われた
- クライアントが「サーバの真実」のコピーを持つ。 一覧の表示中に他者が消した issue、force-push で動いた head SHA（行内コメントの anchor）など、loader の snapshot は陳腐化する。MPA では fragment を取り直せばサーバの最新 HTML が来るので陳腐化は fetch のたびに自然解消する。SPA は invalidate の粒度とタイミングを設計する必要があり、stale anchor の再送のようなケースは明示的に書いた
- uncontrolled な DOM と state の不整合がバグになる。 MPA の JS は DOM をそのまま読み書きするので「DOM が真実」。SPA で uncontrolled textarea + 別管理の dirty/blank フラグにすると、キャンセル→再オープンで「DOM は元に戻っているのにフラグだけ残る」という不整合が生まれた（実バグ）。controlled にするか、閉じるたびにフラグをリセットするかを決める必要がある
- URL が変わっても DOM が残る。 MPA では画面遷移でフォームも消えるので「削除したページのコメントドラフトをガードする」という問題がそもそも無い。SPA では `ignoreBlocker: true` を navigate に付けて回避した
- 開発構成が2プロセスになる。 vite dev server + Go API の proxy 構成。MPA は `go run` ひとつ。本番構成（embed 単一バイナリか別配備か）も SPA 化で新たに決めることになった論点で、これは比較メモを書いて未決のまま残した

## まとめ

「画面の一部を作り直すプロトコルを自前で持つか、フレームワークに任せるか」が差の本質で、持たなくなった分だけ部分更新は楽になった。代わりに失ったのは「full-page load の自然な振る舞い」と「サーバの HTML が常に真実」という単純さで、それらは一つひとつ opt-in の実装と設計約束で埋めている。
