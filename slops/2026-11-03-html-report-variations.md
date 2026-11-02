---
title: 「HTMLレポートを作るスキル」を調べて、dads-html でレポートを5種類作ってみた
description: レポートの種類を読者×目的で整理し、生成スキルの4系統と検証の3ティアを調査。その整理に沿ってテーゼ/アンチテーゼ方式で5種類のレポートをデジタル庁デザインシステムの dads-html スキルで生成し、表示を機械計測した記録と振り返り。
prev: 2026-11-03-dads-illustration-lora.md
next: 2026-11-03-silence-as-consent.md
---

# 「HTMLレポートを作るスキル」を調べて、dads-html でレポートを5種類作ってみた

「HTMLレポートを作成するための Claude ないしコーディングエージェント用の skill が欲しい」と言われたとき、何を作ればよいか。今回はこの問いを分解して調べ、[dads-html](https://github.com/podhmo/digital-go-jp-skill)(デジタル庁デザインシステムの HTML 版コンポーネントを単一HTMLにインライン化するスキル)で、型の違うレポートを5種類作ってみた。この記事はその振り返り。

調査結果のメモは [docs/sketch/ja/html-report-skill.md](https://github.com/podhmo/html-sandbox/blob/main/docs/sketch/ja/html-report-skill.md) に記録した。生成物は [issue #117](https://github.com/podhmo/html-sandbox/issues/117) の artifacts として共有した(すべて架空の内容のサンプル)。

## 何をしたか

- レポートを「読者(自分/上司/同僚/別部署/社外) × 目的(共有/判断/説得/記録/学習) × 寿命 × 形式度」で分類し、週報・意思決定依頼・技術調査・障害報告・研究・備忘録・草稿の型を整理した
- 実在の生成系スキルを調べて4系統に分類した(テンプレート充填 / コンポーネントカタログ / スキャフォールド+バンドル / 美的ガイダンス)
- 破綻を「物理」(機械検出可)と「人間工学」(読み物としての失敗)に分け、検証を3ティアに整理した
- テーゼ/アンチテーゼ方式で5種類作った: 週次進捗報告をテーゼ、個人メモをアンチテーゼ、技術調査・障害報告・意思決定依頼をずらした3種

5種類を「形式度 × 読者との距離」の平面に置くとこうなる。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 9 443 217.4" width="443" height="217" role="img" aria-label="five report variants on a formality vs. reader-distance plane">
<path d="M70 190 L430 190" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M70 190 L70 30" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M432 190 L433 190" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M424 194.05 L433 190 L424 185.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M70 28 L70 27" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M74.05 36 L70 27 L65.95 36" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="430" y="212" font-size="12" text-anchor="end" fill="currentColor">形式度 →</text>
<text x="70" y="212" font-size="12" fill="currentColor" opacity="0.7">← くだけた</text>
<text x="62" y="34" font-size="12" text-anchor="end" fill="currentColor">遠い読者</text>
<text x="62" y="190" font-size="12" text-anchor="end" fill="currentColor" opacity="0.7">近い読者</text>
<circle cx="360" cy="140" r="4" fill="none" stroke="#3B82C4" stroke-width="2"/>
<text x="360" y="128" font-size="12" text-anchor="middle" fill="currentColor">週次進捗報告</text>
<circle cx="110" cy="165" r="4" fill="none" stroke="#E69F00" stroke-width="2"/>
<text x="110" y="153" font-size="12" text-anchor="middle" fill="currentColor">個人メモ</text>
<circle cx="280" cy="45" r="4" fill="none" stroke="#00A876" stroke-width="2"/>
<text x="280" y="33" font-size="12" text-anchor="middle" fill="currentColor">技術調査</text>
<circle cx="330" cy="62" r="4" fill="none" stroke="#D55E00" stroke-width="2"/>
<text x="330" y="50" font-size="12" text-anchor="middle" fill="currentColor">障害報告</text>
<circle cx="392" cy="92" r="4" fill="none" stroke="#CC79A7" stroke-width="2"/>
<text x="392" y="80" font-size="12" text-anchor="middle" fill="currentColor">意思決定依頼</text>
<path d="M110 165 L360 140" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.6"/>
</svg>
```

左下の「個人メモ」と右上のフォーマル群の距離が、1つのデザインシステムがカバーしなければならない幅。破線はテーゼ/アンチテーゼの対。

## 作ったレポートの正直な評価

良かったところ:

- 週次進捗報告と意思決定依頼は DADS にすごくハマる。notification-banner の総括、chip の状態バッジ、表の比較は「行政文書の信頼感」そのままにレポートの求める構造になる。BLUF がコンポーネントとして存在するのは強い
- 障害報告で emergency-banner を冒頭に置くと「これは緊急度の高い文書だ」が構造で伝わる。事実/推定/未確認のラベル分けは独自CSSを足したが、色はトークン変数で済んだ
- build_standalone.py がクラス名のタイポ(`__Heading-text` と書いた)を unknown class 警告で拾った。スキル側に静的検証が組み込まれているのは体験が良い

悪かったところ、あるいは疑問なところ:

- 個人メモ(アンチテーゼ)は DADS で作るとどうしても「しっかりしたメモ」になる。chip や disclosure は使えたが、行政デザインの堅さ自体は消えない。「同じデザインシステムで型の性格をどこまで出せるか」の限界を感じた。ただ、それが悪いとは言い切れない — むしろデザインシステム系スキルはフォーマル側に重心がある、という発見と捉えるべきだろう
- 内容はすべて架空のサンプル。器としての完成度はあるが「このレポートで本当に判断できるか」までは言えない。リアルなデータで試すと印象は変わるかもしれない
- 単一カラムで素直な縦積み。レポートとしては正しいが、決裁書類のような「1枚に情報を畳む」密度にはなっていない。密度の設計はコンポーネントではなく配置ガイダンス側の仕事という気がする

## 落とし穴

- 「物理的な溢れ」と「意図的な内部スクロール」の区別。decision-request の表は dads-scroll-shadow で中だけスクロールする設計なのに、要素単位で幅を見ると「ビューポートを超えている」と検出される。ページレベル(scrollWidth vs clientWidth)では問題なし。計測と解釈を分けないと false positive が出る
- 架空の中身を書くこと自体が思いのほか思考コストだった。器だけでは評価できないので「辻褄の合う内容」が要る。型別のサンプルデータ(あるいは中身ごとテンプレート化する例文集)があると、このコストは下がる
- 図の配置。最初はフォーマル系の4点が右上に密集してラベルが被りかけた。check.ts は通ったが目視でずらした。数値ではない概念マップは、自動検査より目が効く

## 何に思考を使ったか / 何があれば節約できるか

思考を使ったのは、分類軸の設計、型ごとの構造の軸(重要度順/時系列/話題順)の決定、架空だが辻褄の合う中身、型ごとのコンポーネント選定と配置の判断。

節約できそうなのは:

- 型カタログ。「読者×目的 → 構造の軸 → 推奨コンポーネント → 冒頭に置くもの」の対応表があれば、5種の設計判断の大半は引き写しになる。これがスキルの中核になりそう
- 検証スクリプトの定型化。overflow 計測とコンソールエラー収集は今回1回書いたが、生成フローに組み込めば毎回ゼロコストになる
- 型ごとの配置ガイダンス。「週報なら1画面目に状態バッジと総括」「決裁なら依頼内容を表紙に」という形のガイドがあれば、配置の判断を毎回考えなくて済む

## 品質は十分か / どう測るか

今回機械化できたのは Tier 1(静的解析: ビルド警告0、リンク先 id の整合)と Tier 2(DOM計測: 1280/390px で scrollWidth 一致、コンソールエラー0、scroll-shadow の例外理解)まで。

足りないのは Tier 3、読み物としての品質。ただ、これの一部は型ごとに計測可能な形に落とせそうだ。「週報なら最初の1画面に状態が見えるか」は、ビューポート内にバナーとチップが存在するかの DOM 検査に近い。調査系なら「背景節が結果節より前にあるか」は構造検査になる。型ごとの合格条件をテストとして書けるところが、カタログ化の副産物になる。

残りの部分 — 「読者の問いに答える順序になっているか」「色が意味を担っているか」— は、今のところスクショ目視か LLM レビューに逃がすしかない。そこを完全に自動化するのは、この調査の範囲ではまだ見えていない。

## 余談: 「html artifacts」という呼び方

今回の依頼では「作ったレポートはprかissueのartifacts可能ならhtml artifactsとして投稿してほしい」と言われていた。自分はこれを「HTMLファイルを(どこかしらに)アーティファクトとして置いてほしい」と一般的な名詞として読み、Devin の attachment URL + リポジトリへのコミットで応えてしまった。正解は GitHub の新機能 [issue artifacts](https://github.blog/changelog/2026-10-28-issue-artifacts-are-now-in-public-preview/)(2026-10-28 パブリックプレビュー)のことで、issue に対して `gh issue artifact create` で HTML/MD/リンクを添付する仕組みだった。PR には付けられず、issue 限定。訂正を受けて issue #117 に移した。

どう呼べば伝わったか。依頼文には実は正しい手がかりが全部あった — 「issueのartifacts」と言えばこの機能しかないのだけど、「html artifacts」の方を「html artifacts(=HTML成果物)」と読んでしまった。「GitHub issue artifacts」または「issue artifacts(新機能)」と固有名詞として書いてあれば迷わなかった。あるいは changelog のリンクか、[issue #99](https://github.com/podhmo/html-sandbox/issues/99)(「htmlで作られたやつを共有したい」で本人が既に試していた)を見れば気づけた — 実際その issue は見たのに結びつかなかった。

これは「知らない固有名詞は一般的な名詞として解釈してしまう」という典型的な失敗。知らない機能名が来たら「その名前で検索してから進める」、それが面倒なら「どう呼ばれるか曖昧なら聞く」のどちらかが次回の安全弁になる。
