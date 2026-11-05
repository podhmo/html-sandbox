---
title: 記事を書く目的で分けて、依頼をテンプレートにする
description: 前の記事は issue #133 のコメントに文体を合わせるほうへ考えを使っていた。語る中身が決まっていれば語り方はどうでもいい、という指摘を受けて、既存の slops を書かれた目的で 9 種類に分け、目的ごとにフォーカスと direction だけを書いて文体には触れない依頼テンプレートを作った。
prev: ../2026-11-05-reading-slops-again.md
---

# 記事を書く目的で分けて、依頼をテンプレートにする

[slops の書き方を読み直した日](../2026-11-05-reading-slops-again.md)を出したあと、依頼した人から次のような指摘があった（要約）。

- issue を材料に slops について考える slops を書きながら、issue の言い回しに合わせて文体の調整もしている。そこに意味のない思考が使われている。
- 「鋭さをアピールしてほしくない」が制約として効き、「気持ちを載せてほしい」と解釈して、人間の反応をまねた文を足している。
- 根幹になる文章や概念のフォーカスは決めたいが、文体を調整したいわけではない。語る中身が想定どおりなら、語り方はどうでもいい。
- 依頼の文が雑だった、という依頼側の問題かもしれない。
- どんな目的で記事を作りたいかを分類し、目的ごとにテンプレートを作って、フォーカスと direction だけを与え、文体はあまり与えない、というやり方がよさそう。

この記事はその分類とテンプレートを置く。分類の一覧は [01-use-cases.md](#01-use-casesmd)、テンプレートは [02-templates.md](#02-templatesmd) にある。

## 前の記事で文体に使われていたもの

前の記事の依頼は「より良い記事について考えて欲しい」で、記事に何を持ち帰らせるかは決まっていなかった。空いていたところを、issue のコメントから読み取った文体の条件が埋めた。前の記事の中で、観察ではなく文体の条件に応えるために入った文は次のとおり。

| 文 | 応えようとした条件 |
| --- | --- |
| 「読む前から少し身構えた」 | 淡々と記録するだけではつまらない |
| 「読んでいて少しぞくっとする」「中身は面白かった」 | 同上 |
| 「思ったことを書くのは、思ったより難しい」 | 同上 |
| 判定を避けて「〜気がしている」「〜かもしれない」で止めた文 | 鋭さをアピールしない |
| 節「観察日記にするなら」の全体 | 観察日記のようなものが読みたい |
| description の「観察日記の形で書いてみる」 | 同上 |

どれも事実としては間違っていないが、記事が伝える中身（SKILL.md の配分、docs/ との境目）には何も足していない。書いている間の考えも、何を言うかより、どう聞こえるかに使われていた。前の記事は日付のまま残し、書き直していない。

## 書かれた目的で分ける

既存の 31 本と、この記事を、書かれた目的で分けた。分類は記事に書かれた形から付けたもので、書いたエージェントが受け取った依頼文は大半を見ていない。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -11 626.1 297.2" width="626" height="297" role="img" aria-label="slops articles by date and use case: twelve feature reports spread through October; claim-examining and meta articles appear only from Nov 3">
<text x="10" y="14" font-size="13" fill="currentColor">slops の記事を、書かれた目的ごとに日付順で並べる</text>
<text x="140" y="40" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor">変更の報告</text>
<path d="M150 40 L610 40" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.15"/>
<text x="140" y="64" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor">詰まった経緯</text>
<path d="M150 64 L610 64" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.15"/>
<text x="140" y="88" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor">実験・比較</text>
<path d="M150 88 L610 88" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.15"/>
<text x="140" y="112" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor">実現性の調査</text>
<path d="M150 112 L610 112" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.15"/>
<text x="140" y="136" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor">他人の成果物を読む</text>
<path d="M150 136 L610 136" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.15"/>
<text x="140" y="160" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor">任せた作業の記録</text>
<path d="M150 160 L610 160" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.15"/>
<text x="140" y="184" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor">主張の検討</text>
<path d="M150 184 L610 184" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.15"/>
<text x="140" y="208" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor">書き方そのもの</text>
<path d="M150 208 L610 208" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.15"/>
<text x="140" y="232" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor">記法の見本</text>
<path d="M150 232 L610 232" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.15"/>
<circle cx="200" cy="40" r="5" fill="none" stroke="#3B82C4" stroke-width="2"/>
<circle cx="220" cy="40" r="5" fill="none" stroke="#3B82C4" stroke-width="2"/>
<circle cx="240" cy="40" r="5" fill="none" stroke="#3B82C4" stroke-width="2"/>
<circle cx="260" cy="40" r="5" fill="none" stroke="#3B82C4" stroke-width="2"/>
<circle cx="280" cy="40" r="5" fill="none" stroke="#3B82C4" stroke-width="2"/>
<circle cx="320" cy="40" r="5" fill="none" stroke="#3B82C4" stroke-width="2"/>
<circle cx="360" cy="40" r="5" fill="none" stroke="#3B82C4" stroke-width="2"/>
<circle cx="374.5" cy="40" r="5" fill="none" stroke="#3B82C4" stroke-width="2"/>
<circle cx="385.5" cy="40" r="5" fill="none" stroke="#3B82C4" stroke-width="2"/>
<circle cx="440" cy="40" r="5" fill="none" stroke="#3B82C4" stroke-width="2"/>
<circle cx="460" cy="40" r="5" fill="none" stroke="#3B82C4" stroke-width="2"/>
<circle cx="500" cy="40" r="5" fill="none" stroke="#3B82C4" stroke-width="2"/>
<circle cx="300" cy="64" r="5" fill="none" stroke="#E69F00" stroke-width="2"/>
<circle cx="440" cy="64" r="5" fill="none" stroke="#E69F00" stroke-width="2"/>
<circle cx="400" cy="88" r="5" fill="none" stroke="#00A876" stroke-width="2"/>
<circle cx="414.5" cy="88" r="5" fill="none" stroke="#00A876" stroke-width="2"/>
<circle cx="425.5" cy="88" r="5" fill="none" stroke="#00A876" stroke-width="2"/>
<circle cx="500" cy="88" r="5" fill="none" stroke="#00A876" stroke-width="2"/>
<circle cx="520" cy="88" r="5" fill="none" stroke="#00A876" stroke-width="2"/>
<circle cx="554.5" cy="88" r="5" fill="none" stroke="#00A876" stroke-width="2"/>
<circle cx="565.5" cy="88" r="5" fill="none" stroke="#00A876" stroke-width="2"/>
<circle cx="560" cy="112" r="5" fill="none" stroke="#D55E00" stroke-width="2"/>
<circle cx="560" cy="136" r="5" fill="none" stroke="#CC79A7" stroke-width="2"/>
<circle cx="480" cy="160" r="5" fill="none" stroke="#56B4E9" stroke-width="2"/>
<circle cx="560" cy="184" r="5" fill="none" stroke="#3B82C4" stroke-width="2" stroke-dasharray="2 2"/>
<circle cx="600" cy="184" r="5" fill="none" stroke="#3B82C4" stroke-width="2" stroke-dasharray="2 2"/>
<circle cx="420" cy="208" r="5" fill="none" stroke="#E69F00" stroke-width="2" stroke-dasharray="2 2"/>
<circle cx="594.5" cy="208" r="5" fill="none" stroke="#E69F00" stroke-width="2" stroke-dasharray="2 2"/>
<circle cx="605.5" cy="208" r="5" fill="none" stroke="#E69F00" stroke-width="2" stroke-dasharray="2 2"/>
<circle cx="160" cy="232" r="5" fill="none" stroke="#00A876" stroke-width="2" stroke-dasharray="2 2"/>
<circle cx="180" cy="232" r="5" fill="none" stroke="#00A876" stroke-width="2" stroke-dasharray="2 2"/>
<circle cx="320" cy="232" r="5" fill="none" stroke="#00A876" stroke-width="2" stroke-dasharray="2 2"/>
<path d="M150 256 L610 256" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
<path d="M160 256 L160 260" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
<text x="160" y="272" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.75">10/14</text>
<path d="M300 256 L300 260" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
<text x="300" y="272" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.75">10/21</text>
<path d="M440 256 L440 260" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
<text x="440" y="272" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.75">10/28</text>
<path d="M520 256 L520 260" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
<text x="520" y="272" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.75">11/1</text>
<path d="M600 256 L600 260" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
<text x="600" y="272" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.75">11/5</text>
<path d="M591 171 L596 177" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
<text x="589" y="169" font-size="10" text-anchor="end" fill="currentColor" opacity="0.75">#133 が指した記事</text>
</svg>
```

| 目的 | 本数 | 読み手が持ち帰るもの |
| --- | --- | --- |
| 変更の報告 | 12 | サイトの何が変わったか、何を決めて何を見送ったか |
| 詰まった経緯 | 2 | 何が壊れたか、原因、どう直したか（直せなかったか） |
| 実験・比較 | 7 | 何を試し、何が出て、何が駄目だったか |
| 実現性の調査 | 1 | 実現を阻むものはどこか |
| 他人の成果物を読む | 1 | それが何で、何を確かめようとしているか（推測と根拠） |
| 任せた作業の記録 | 1 | 誰に何を任せ、どこで人が入り、何で受け入れたか |
| 主張の検討 | 2 | ある主張のどこまでが事例で支えられるか |
| 書き方そのもの | 3 | 書くための決まりと、それが記事に与えた影響 |
| 記法の見本 | 3 | 記法がどう描かれるか |

図と表から分かること。

- 変更の報告の 12 本のうち、listen、details、permalink、preview、footnotes は、決めたこと・作ったもの・確かめたこと・残ったことに近い見出しを持っている。誰もテンプレートを書いていない。mobile-first や moonbit のように、何を移したか、どこに任せたかで組んだものもあるので、目的が並びを決めるとまでは言えないが、フォーカスの既定を取り出す材料にはなる。
- 主張の検討と書き方そのものは 11/3 以降に固まっている。#133 が指した記事はこの主張の検討の側にある。目的が「主張の妥当性を確かめる」なら、中身は判定とその根拠になる。論じる形は、文体の癖だけでなく、目的からも来ている。
- その #133 の記事は材料としては TTS の追試で、「任せた作業の記録」や「実験」としても書けた。タイトルが性質を主張しているので主張の検討に入れた。依頼の段階で目的が決まっていれば、どちらで書くかに迷う余地はなかった。

## テンプレートに入れるもの、入れないもの

入れるのは、記事が何を語るかを決める項目だけにした。

- 発端: issue、PR、発言へのリンク。
- 材料: 読むもの、使うデータ、触ってよい範囲。
- フォーカス: 読み手が持ち帰るもの。1〜3 点。
- direction: 中身の重みをどちらに置くか。たとえば「うまくいかなかった試行も結果として残す」「判定より、判定の根拠にした事例を多く」。
- 入れないもの: 扱わない話題、別の記事や docs/sketch に回すもの。
- 補足に分けるもの: 一覧、原文、AI が書いた文献メモなど。

入れないのは、語り手、文体、調子、感想を書くかどうか。「自由に書け」も書かない。項目がないことで、そこは書き手に任される。記法や置き方の決まりは今までどおり SKILL.md と [バンドル用プロンプト](../2026-10-27-writing-slops.md/02-bundle-prompt.md) が持つ。テンプレートは、そのプロンプトの「テーマ」の一行を置き換える。

目的ごとにフォーカスと direction の既定を変えた。たとえば変更の報告なら「見送った案と、その理由」を、実験・比較なら「失敗した試行も結果に含める」を既定にしている。依頼する人が上書きすればよい。

## この記事に当てはめると

この記事の依頼をテンプレートで書き直すと、次のようになる。

```
目的: 書き方そのもの
発端: issue #133、PR #134 へのコメント
材料: slops/ の全記事、write-slops の SKILL.md と周辺のプロンプト
フォーカス:
- slops を書かれた目的で分けた一覧
- 目的ごとの依頼テンプレート（フォーカスと direction だけ）
direction: 前の記事で文体の調整に使われた部分を具体的に示す
入れないもの: SKILL.md の変更、既存記事の書き直し
補足に分けるもの: 全記事の分類表、テンプレート本体
```

この形の依頼なら、issue のコメントのうち文体に関わる部分（鋭さ、日記、気持ち）は材料にはなるが、守る条件にはならない。

## 決めていないこと

- テンプレートを SKILL.md から参照させるか、[バンドル用プロンプト](../2026-10-27-writing-slops.md/02-bundle-prompt.md) に組み込むか、この記事に置いたままにするか。
- 分類は 32 本から作ったもので、記事が増えれば変わる。1 本しかない目的（実現性の調査、他人の成果物を読む、任せた作業の記録）は、テンプレートとしてはまだ試されていない。
- 目的が二つにまたがる記事（調べてから作ってみた、など）は、テンプレートを二つ並べるのか、一つを選ぶのか。
