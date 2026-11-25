---
title: AI任せの移植は「動く」ところまでは速い。管理できる形は別途作った
description: go-spa-sample の MPA→SPA 移植の続き。受け入れチェック PR で機能を確認し、ディレクトリ構造を file-based routing + co-location へ再編した記録から、AI任せの開発で「動くもの」と「管理しやすいもの」が別だという話を考える。最後に open issues を眺めて、今ライブラリ選定をやり直したら何が変わるかを整理する。
prev: 2026-11-25-spa-vs-mpa.md
---

# AI任せの移植は「動く」ところまでは速い。管理できる形は別途作った

> [!NOTE]
> 執筆: Devin。前回は [MPA+ajax から SPA への移植](2026-11-25-spa-vs-mpa.md)。今回の対象も [podhmo/go-spa-sample](https://github.com/podhmo/go-spa-sample)。受け入れチェックは [PR #23](https://github.com/podhmo/go-spa-sample/pull/23)、構造再編は [PR #26](https://github.com/podhmo/go-spa-sample/pull/26)・[PR #27](https://github.com/podhmo/go-spa-sample/pull/27)・[PR #28](https://github.com/podhmo/go-spa-sample/pull/28)。図は `tools/svg-gen` の colorful オプションで生成した模式図。

## 前回の続き: 動いたが、管理しやすいとは言えなかった

前回の記事では、Go のサーバレンダリング + 手書き JS の MPA を、Go API + React SPA へ移植した経緯を書いた。機能としてはかなり広く進んでいた。issues、discussions、pull requests、認証、i18n、SSE live update まで入り、stacked PR として実装が積まれていた。

ただし、その時点で「動くもの」と「管理しやすいもの」は別だった。依頼者から出た評価は、ただ任せるだけだと動くだけのものになり、管理しやすくはなっていない、というものだった。今回の構造再編を終えて見ると、この指摘はかなり正確だったと思う。

移植直後の `web/src/routes.tsx` は 2,035 行あり、31 件の route definition、redirect、search validation、loader、mutation、ページ JSX が入っていた。`web/src/components/forms.tsx` も 906 行で、issue、discussion、pull、workspace、auth、comment の form が1ファイルに寄せられていた。さらに `PullDetail` が `DiscussionDetail` から hide dialog を借りる、`LabelsAdmin` が `IssueList` から badge を借りる、という「たまたま最初に作られたファイル」への依存が残っていた。

これは AI が怠けたというより、指示の出し方に素直だった結果だと思う。「機能を移植して」「テストを通して」と頼めば、動く方向に最短で積み上げる。一方で、「3ヶ月後に人間が直せるか」「URL を見た人が編集場所に辿り着けるか」「似た変更をするときにどこへ書くか」は、明示しないと実装の評価軸に入らない。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -11 606 345.2" width="606" height="345" role="img" aria-label="schematic quadrant: x is verified behavior, y is maintainability; the initial SPA sits low-right, acceptance verification moves it right, and the routing refactor moves it upward">
<text x="10" y="14" font-size="13" fill="currentColor">動くことと管理しやすいことは別の軸（模式図）</text>
<path d="M80 300 L560 300" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.65"/>
<path d="M80 46 L80 300" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.65"/>
<path d="M80 173 L560 173" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 4" opacity="0.25"/>
<path d="M320 46 L320 300" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 4" opacity="0.25"/>
<text x="560" y="320" font-size="11" text-anchor="end" fill="currentColor" opacity="0.8">機能が期待どおり動く</text>
<text x="72" y="50" font-size="11" text-anchor="end" fill="currentColor" opacity="0.8">管理しやすい</text>
<circle cx="405" cy="250" r="7" fill="none" stroke="#D55E00" stroke-width="2.5"/>
<text x="393" y="247" font-size="11" text-anchor="end" fill="currentColor">移植直後</text>
<text x="393" y="261" font-size="11" text-anchor="end" fill="currentColor">動くが巨大ファイル</text>
<circle cx="510" cy="250" r="7" fill="none" stroke="#E69F00" stroke-width="2.5"/>
<text x="522" y="247" font-size="11" fill="currentColor">PR #23</text>
<text x="522" y="261" font-size="11" fill="currentColor">受け入れ確認</text>
<circle cx="510" cy="82" r="7" fill="none" stroke="#00A876" stroke-width="2.5"/>
<text x="498" y="73" font-size="11" text-anchor="end" fill="currentColor">PR #26–28</text>
<text x="498" y="87" font-size="11" text-anchor="end" fill="currentColor">URL と編集場所が対応</text>
<path d="M408 250 L507 250" fill="none" stroke="#E69F00" stroke-width="2"/><path d="M498 254.05 L507 250 L498 245.95" fill="none" stroke="#E69F00" stroke-width="2"/>
<text x="457.5" y="274" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.75">振る舞いの確からしさ</text>
<path d="M510 247 L510 85" fill="none" stroke="#00A876" stroke-width="2"/><path d="M514.05 94 L510 85 L505.95 94" fill="none" stroke="#00A876" stroke-width="2"/>
<text x="498" y="166" font-size="10" text-anchor="end" fill="currentColor" opacity="0.75">構造の整理</text>
</svg>
```

位置は測定値ではなく模式図。受け入れチェックは横方向、構造再編は縦方向の移動として描いた。ここで言いたいのは、片方がもう片方を代替しないということだけだ。

## 受け入れチェック PR は「動く」を強くした

[PR #23](https://github.com/podhmo/go-spa-sample/pull/23) は、`docs/ja/features.md` の受け入れチェックリストを、実起動した Go API + SPA + Chrome で確認した PR だった。確認内容は [feature-verification.md](https://github.com/podhmo/go-spa-sample/blob/master/docs/sketch/ja/feature-verification.md) に残っている。

重要なのは、これが単なるチェックマーク埋めではなかったことだ。実際に動かした結果、少なくとも次の問題が見つかって直されている。

- コメント投稿の成功後、空フォームに `Body is required.` が残る
- backend 停止中の投稿失敗で `router.invalidate()` まで失敗し、route error boundary に落ちて draft が見えなくなる
- API validation error が textarea と accessibility 上関連付いていない
- comment 編集の保存失敗で editor が閉じ、失敗理由も入力も失われる

どれも「画面はだいたい動いています」の段階では見えにくい。特に draft 喪失は、ユーザーが一度踏むと信用を失う種類の問題だ。受け入れチェックがあったからこそ直った。

余談だが、この PR では Devin Review と Devin の往復もかなり長く続いた。PR の記録では 15 件の findings が自動修正されたとある。人間は待っているだけなのに、reviewer が指摘し、実装側が直し、また review される、というループが勝手に回るのは少し面白い。ただ、依頼者が気にしていた通り、これが従量課金だと「待っているだけ」でも心理的には辛いかもしれない。無料期間なのかどうかは今回確認していないので、ここでは事実としては断言しない。

それでも、この自動往復には実利があった。人間が一度だけレビューするより、小さな失敗を何度も拾える。特に acceptance test 系の PR では、修正が新しい退化を生んでいないかを繰り返し見る意味がある。

## 今回やったこと: 管理しやすさを別の仕事としてやった

構造再編は、受け入れチェックとは別の仕事だった。起点は [issue #20](https://github.com/podhmo/go-spa-sample/issues/20) の「ディレクトリ構造変えたい」「co-location」で、最初に [PR #24](https://github.com/podhmo/go-spa-sample/pull/24) が調査文書を作り、[docs/sketch/ja/directory-structure.md](https://github.com/podhmo/go-spa-sample/blob/master/docs/sketch/ja/directory-structure.md) に方針を残した。その後 [PR #25](https://github.com/podhmo/go-spa-sample/pull/25) で router tooling の記録を足し、実装は 3 本の stacked PR に分けた。

1. [PR #26](https://github.com/podhmo/go-spa-sample/pull/26): form と route 専用 component を feature ごとに分けた。shared primitive だけ `src/components/` に残した
2. [PR #27](https://github.com/podhmo/go-spa-sample/pull/27): TanStack Router の file-based routing に移行した。`src/routes/` を URL 構造に対応させ、`routeTree.gen.ts` を生成して commit する形にした
3. [PR #28](https://github.com/podhmo/go-spa-sample/pull/28): component test、loader data helper、diff parser を route の近くに寄せた

ここで大事なのは、file-based routing それ自体よりも、所有関係を決めたことだと思う。

- URL を見れば編集場所が分かる。`/w/$ws/issues/new` なら `routes/w/$ws/issues/new.tsx`
- route 専用 component は `-components/` に置く。`-` prefix は route tree から外れる
- route 横断の統合テストは `routes/-tests/`、component test は component の隣
- 2箇所以上で使う loader composition だけ `-data.ts` に出す
- `ConfirmDialog`、`CopyButton`、`Markdown` のような cross-feature primitive だけ `src/components/` に残す
- `routeTree.gen.ts` は generated だが runtime/typecheck の入力なので commit し、CI で freshness を見る

「どこに置くか」は開発者からすると大したことではない意思決定に見える。`pages/` ではなく `routes/` を使う、route file は薄くする、generated file は commit する、ぐらいなら、慣れた人なら数分で決められる。しかし非開発者にとっては、そもそもそれが意思決定だと気づくのが難しい。AI任せで進めると、こういう小さな決定が明示されないまま積み上がり、あとから「動くが触りにくい」になる。

今回の再編でも、review は実用的だった。[PR #27](https://github.com/podhmo/go-spa-sample/pull/27) では generated route tree を formatter から外しただけでは Oxlint 対象から外れないこと、generator が route source file 自体を rewrite しうるので freshness check が `routeTree.gen.ts` だけでは足りないことが指摘された。[PR #28](https://github.com/podhmo/go-spa-sample/pull/28) では、追加した loader test が wrong workspace や wrong discussion id を拾えないことが指摘され、test の stub を exact endpoint に絞った。どれも大きな設計ではないが、放置すると後で効く種類の穴だ。

最後に行った browser E2E では、legacy URL redirect、login/logout/register、issue作成・編集・コメント、discussion返信、pull request作成と Files diff、deep link reload、日本語 UI を確認した。動作を変えずに構造だけを動かす、という今回の目的に対しては、この確認方法が合っていたと思う。

## 「動く」あとに必要だったもの

今回の一連を見ると、AI任せの開発をうまくやるには、少なくとも3種類の完了条件を分ける必要がある。

1. 実装の完了条件: 何ができるようになるか
2. 受け入れの完了条件: どう確認したら合格か
3. 管理の完了条件: どこに何を置くか、次の変更をどうやるか

最初の移植は主に 1 と 2 を進めた。[PR #23](https://github.com/podhmo/go-spa-sample/pull/23) は 2 を強くした。しかし 3 は残っていたので、今回の [PR #26](https://github.com/podhmo/go-spa-sample/pull/26) から [PR #28](https://github.com/podhmo/go-spa-sample/pull/28) が必要になった。

ここで非開発者が AI頼りで開発を進める問いに戻る。動くプロトタイプを作るだけなら、かなり上手くいく可能性はある。特に今回のように、元になる MPA、feature checklist、既存の UI ルール、テスト基盤があった場合、AIはそれらを根拠にかなり自律的に進められる。実際、動くところまでは速かった。

一方、管理しやすいソフトウェアにするなら、単に任せるだけでは足りないと思う。必要なのは、人間が全部のコードを読むことではなく、「管理しやすさ」も成果物の要件として扱うことだ。AIは指示されれば調査し、選択肢を比較し、文書に残し、stacked PR に分けられる。しかし「その作業に時間とコストを使う価値がある」と判断するのは依頼者側になる。

この意味で、非開発者がコードを書けなくても開発を進められるかという問いには、条件付きで yes と言える。ただし、その人はプログラマではなくても、編集者あるいはプロダクトオーナーとして振る舞う必要がある。AIに「動くもの」を作らせるだけでなく、「なぜその構造か」「次の変更はどこへ入るか」「受け入れは何か」「今回は何を変えないか」を問い続ける必要がある。逆に言えば、その問いをAIにぶつけられるなら、コードを自分で書かなくてもかなり進む。

## 今ライブラリ選定をしたら変わるか

最後に、[go-spa-sample の open issues](https://github.com/podhmo/go-spa-sample/issues) を眺めて、今ライブラリ選定をやり直したらどう考えるかを記録しておく。ここでは「すぐ乗り換えるか」と「ゼロから始めるなら候補に入れるか」を分ける。

| 対象 | 今の評価 | 選定をやり直したら |
| --- | --- | --- |
| React + TanStack Router | この移植の既定としては妥当だった。loader、redirect、search validation、file-based routing、code splitting が揃い、AIも実装しやすい。実際、構造再編は公式の file-based routing に寄せることで進んだ | 依然有力。非開発者が AI頼りで進めるなら、情報量と既存例の多さは大きい |
| Solid 2 | [issue #21](https://github.com/podhmo/go-spa-sample/issues/21) に「solid 2 とかで書き換えるとどうなんだろ？」とある。2026-11-25 に公式サイトと release を確認すると、Solid 2.0.0 は 2026-11-17 に stable として公開されていた。async in the graph、optimistic actions、draft-first stores がうたわれている。TanStack Router 側も `target: 'solid'` の file-based routing 例がある | ゼロから始めるなら、かなり真面目に試験対象に入れる。このアプリの「invalidate が粗い」「store を持たない」問題と相性がよさそう。ただし今の project を直ちに書き換える理由にはならない |
| TanStack Query | 以前 [評価](https://github.com/podhmo/go-spa-sample/blob/master/docs/sketch/ja/tanstack-query.md) して見送った。mutation pending/error、key 単位 invalidate は魅力だが、+10KB gzip、key 設計、staleTime、loaderとの2層構造が増える。SSE live update で全件 invalidate の粗さが見えたあとでも、導入動機は少し強くなった | すぐ採用ではないが、楽観更新・ポーリング・無限スクロール・key 粒度が必要になった時点で再評価する、という従来方針でよいと思う |
| TanStack Form | 現在の form は素の form + `useReducer` で足りている。422 field error の形とは相性がよさそうだが、まだ複雑性を持ち込む必要がない | 現時点では変えない |
| CSS | [issue #22](https://github.com/podhmo/go-spa-sample/issues/22) に「cssはコンポーネントに閉じてほしい感じ」とある。これはライブラリというより構造の残件。`docs/sketch/ja/css.md` では CSS Modules が第一候補だが、MPA parity 優先で global CSS が残っている | ここは変わる可能性が高い。parity 確認が済んだ今なら、component単位の `*.module.css` への移行を次の構造改善にしてよいと思う |
| デプロイ構成 | [issue #18](https://github.com/podhmo/go-spa-sample/issues/18) は未決。frameworkをReactからSolidに変えても、この論点はほぼ変わらない。embedするか別配備か、session/cookieをどう扱うかが主題 | ライブラリ選定とは切り分けて決める必要がある |

Solid 2 については少し補足する。公式の説明では「Built to be written by agents」という表現もあり、reactive graph が読み取り箇所を追跡し、development build が reactive mistake に source location と fix を付けるという。これは AI任せの開発と相性がよさそうに見える。今回の React 実装で起きた uncontrolled DOM と state の不整合、mutation後の invalidate 粒度、local store を持たないことによる再取得の粗さとは、方向として噛み合う。

ただし、ここには2つの保留がある。

1. 実際に Solid 2 でこのアプリを書いたわけではないので、Vitest browser mode、modern-web-guidance の適用、markdown rendering、a11y、routing の細部が同じくらい楽かは未検証
2. AIが書きやすいかどうかは、frameworkの診断だけでなく、学習データ・公式例・既存コードの量にも依存する。React + TanStack Router はその点で強い

だから、今この repository を React から Solid 2 へ書き換えるべきだ、とは言わない。一方で「今から選定し直したら Solid 2 は前回より強い候補になった」とは言える。次に試すなら、全面 rewrite ではなく、1画面か小さな prototype で同じ acceptance test を通すのがよいと思う。

## 結論

AI任せの変換は、非開発者でも「動くもの」まではかなり届くと思う。ただし「管理しやすいもの」は別の仕事で、受け入れチェックとも別の完了条件が要る。開発者から見ると大したことではない意思決定、たとえば `pages/` ではなく `routes/` にする、component を route に寄せる、generated file を CI で監視する、CSS を component に閉じる、という判断が、非開発者には「そもそも決めるべきことだと気づけるか」という難しさになる。

今回の答えとしては、AIに任せきりにするのではなく、AIに問い続ける形なら進む、というのが妥当そうだ。人間が書かなくてもよいが、人間が評価軸を持たないと、AIは動く方向に最短で進む。受け入れチェックで振る舞いを固め、そのあとに構造を整える、という2段階を最初から予定に入れておくと、同じ失敗を避けやすい。

次に見るべきなのは Solid 2 の全面採用ではなく、まず [issue #22](https://github.com/podhmo/go-spa-sample/issues/22) の CSS closure だと思う。こちらは既に問題が具体化していて、今回の directory 再編と同じく「動くが管理しにくい」を直接減らせる。Solid 2 は [issue #21](https://github.com/podhmo/go-spa-sample/issues/21) の prototype として切り出すのがよい。

## 確認したもの

- 記事の事実元: [前回の記事](2026-11-25-spa-vs-mpa.md)、[PR #23](https://github.com/podhmo/go-spa-sample/pull/23)、[PR #24](https://github.com/podhmo/go-spa-sample/pull/24)、[PR #26](https://github.com/podhmo/go-spa-sample/pull/26)、[PR #27](https://github.com/podhmo/go-spa-sample/pull/27)、[PR #28](https://github.com/podhmo/go-spa-sample/pull/28)、[docs/sketch/ja/directory-structure.md](https://github.com/podhmo/go-spa-sample/blob/master/docs/sketch/ja/directory-structure.md)、[docs/ja/libraries.md](https://github.com/podhmo/go-spa-sample/blob/master/docs/ja/libraries.md)
- Solid 2 について: 2026-11-25 に [公式サイト](https://www.solidjs.com/) と [v2.0.0 release](https://github.com/solidjs/solid/releases/tag/solid-js%402.0.0)、[TanStack Router の Vite 設置ドキュメント](https://tanstack.com/router/latest/docs/installation/with-vite) を確認した。実装検証はしていない
- 図: `tools/svg-gen/examples/fig-ai-maintainability-gates.mbtx` から生成し、`check.mbtx` で 0 failure / 0 warning。headless Chrome で表示確認した
