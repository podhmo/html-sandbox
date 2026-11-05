---
title: 良い slops の書き方を聞かれて、答えが三度動いた
description: slops/2026-11-05* を読んで、求められている記事の書き方を考えてほしいと頼まれた。最初の答えから、依頼した人の「対象が複雑になって、ついていけなくなった」という見立てに着くまでに、三回直された。その三回を起きた順に書く。
---

# 良い slops の書き方を聞かれて、答えが三度動いた

## 頼まれたこと

最初の依頼はこうだった。

> slops/2026-11-05* を確認して求めてる記事を書く方法について考えてほしい。

2026-11-05 の記事は 4 本ある。[答えはその時点の制約から出てくる](2026-11-05-answers-under-constraints.md)、[slops の書き方を読み直した日](2026-11-05-reading-slops-again.md)、[記事を書く目的で分けて、依頼をテンプレートにする](2026-11-05-slops-use-case-templates.md)、[依頼した人にとって良い slops とは](2026-11-05-good-slops-for-requester.md)。これと [issue #133](https://github.com/podhmo/html-sandbox/issues/133) のコメント、write-slops の SKILL.md、バンドル用プロンプトを読んでから答えた。

このセッションでは、ほかにスキルを一つ作り、ブランチを切り直した。この記事ではそちらは扱わず、「良い記事を書く方法」という問いに対して、自分の答えがどう動いたかの一本だけを書く。

## 一回目: 「作業したセッションで書く」

最初の答えでは、方法の第一に「作業したセッションの終わりに書く。無理なら材料を残させる」を置いた。

根拠にしたのは、answers-under-constraints の本文にある「前回の記録には…」という言い回しだった。後から記録を読んで書いたから、見えている事実を並べ替えるしかなかったのだ、と読んだ。

返ってきたのは次の一言だった。

> うーん。一つ間違えてる。記事は実行したセッションで書かせてる。追試の話では？ > 前回の記録には…」

そこで初めて PR を見た。torch を cu128 に固定したのは初回の [PR #127](https://github.com/podhmo/html-sandbox/pull/127) のセッションで、そこで出したのは docs/sketch と TODO.md だけだった。記事は追試（[#128](https://github.com/podhmo/html-sandbox/issues/128)、[#129](https://github.com/podhmo/html-sandbox/pull/129)）の流れで書かれていて、「前回の記録」は追試のセッションが初回の記録を読んでいる、という意味だった。

確かめるのに要ったのは `gh pr view` を 2 回と `gh issue view` を 1 回だけだった。それをせずに、一つの言い回しから「いつ書いたか」を決めて、方法の一番目に据えていた。

## 二回目: 一本の記事に寄っていた

前提を直して答え直したら、次はこう言われた。

> あとあなたも他の人も一つの記事を気にしすぎです。ダメなものを治す方法ではなく良い記事を書く方法について尋ねてるのです。

読み返すと、一回目も二回目も、どの項目も answers-under-constraints に結びついていた。読んだ 4 本のうち、残りの 3 本はどれもこの記事への反応として書かれている。#133 もこの記事を指して始まっている。材料の中心にあるものが、そのまま答えの中心になっていた。

「他の人も」とあるのは、残りの 3 本を書いた側も同じだった、という意味だと受け取った。

## 三回目: 書き足しのある記事を良い例にした

「良い記事」の手がかりを探して、本文のあとに依頼した人の言葉が書き足されている記事を集めた。

- [redraw-novel-figures](2026-10-27-redraw-novel-figures.md) の「ユーザーから一言」
- [unslop-dads-reports](2026-11-03-unslop-dads-reports.md) の「読者の感想」
- [gom-squad-experiment](2026-11-03-gom-squad-experiment.md) の「追記: 著者の回答」

返事を引き出した記事なのだから良い記事だろう、と考えた。答えの中では、それが自分の推測で、確かめていないとも書いた。それでも、その上に方法を五つ積んだ。

> 書き足しがあったのは悪い記事ではないでしょうか？補足が必要だったのです。

gom の追記は、推測が外れたところの訂正だった。ほかの 2 本も、本文になかった視点を読み手が補っている。確かめていないと書いたことで、その推測を土台にしてよいことにしていた。

ここで、既存の記事のどれが良いかを判断できる材料が自分にはない、と答えた。#133 のコメントに書かれている「好み」から組み立て直し、良い例があれば教えてほしいと頼んだ。

## 依頼した人の見立て

返ってきたのは、例ではなく見立てだった。

> 既存のslops全体の品質が低いので品質を上げたいというところから問いが始まってます。機能紹介の頃は紹介をすれば良かったので十分だったんですよね。語る対象が複雑化したときにそれについていけなくなった。というのが正解な気がする。

この見立てに照らして、自分の三回の答えが、どの記事を材料にしていたかを並べてみた。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 262" width="640" height="262" role="img" aria-label="slops articles by date: the three answers drew only on articles from Oct 27 onward and none of the twelve feature reports, while the whole set starts on Oct 14">
<text x="10" y="16" font-size="13" fill="currentColor">三回の答えが材料にした記事と、slops 全体（日付順）</text>
<text x="140" y="50" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor">一回目で読んだ</text>
<path d="M150 50 L620 50" fill="none" stroke="currentColor" stroke-width="1" opacity="0.15"/>
<text x="140" y="85" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor">二回目で中心にした</text>
<path d="M150 85 L620 85" fill="none" stroke="currentColor" stroke-width="1" opacity="0.15"/>
<text x="140" y="120" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor">三回目で例にした</text>
<path d="M150 120 L620 120" fill="none" stroke="currentColor" stroke-width="1" opacity="0.15"/>
<text x="140" y="170" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor">slops 全体</text>
<path d="M150 170 L620 170" fill="none" stroke="currentColor" stroke-width="1" opacity="0.15"/>
<circle cx="581" cy="50" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="590" cy="50" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="599" cy="50" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="608" cy="50" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="581" cy="85" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="410" cy="120" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="470" cy="120" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="541" cy="120" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="568" cy="120" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="150" cy="170" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="170" cy="170" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="190" cy="170" r="4" fill="currentColor" stroke="currentColor" stroke-width="1.5"/>
<circle cx="210" cy="170" r="4" fill="currentColor" stroke="currentColor" stroke-width="1.5"/>
<circle cx="230" cy="170" r="4" fill="currentColor" stroke="currentColor" stroke-width="1.5"/>
<circle cx="250" cy="170" r="4" fill="currentColor" stroke="currentColor" stroke-width="1.5"/>
<circle cx="270" cy="170" r="4" fill="currentColor" stroke="currentColor" stroke-width="1.5"/>
<circle cx="290" cy="170" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="305" cy="170" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="315" cy="170" r="4" fill="currentColor" stroke="currentColor" stroke-width="1.5"/>
<circle cx="350" cy="170" r="4" fill="currentColor" stroke="currentColor" stroke-width="1.5"/>
<circle cx="365" cy="170" r="4" fill="currentColor" stroke="currentColor" stroke-width="1.5"/>
<circle cx="375" cy="170" r="4" fill="currentColor" stroke="currentColor" stroke-width="1.5"/>
<circle cx="390" cy="170" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="401" cy="170" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="410" cy="170" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="419" cy="170" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="425" cy="170" r="4" fill="currentColor" stroke="currentColor" stroke-width="1.5"/>
<circle cx="435" cy="170" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="450" cy="170" r="4" fill="currentColor" stroke="currentColor" stroke-width="1.5"/>
<circle cx="470" cy="170" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="485" cy="170" r="4" fill="currentColor" stroke="currentColor" stroke-width="1.5"/>
<circle cx="495" cy="170" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="510" cy="170" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="532" cy="170" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="541" cy="170" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="550" cy="170" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="559" cy="170" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="568" cy="170" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="581" cy="170" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="590" cy="170" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="599" cy="170" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="608" cy="170" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M150 195 L620 195" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/>
<path d="M150 195 L150 199" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/>
<text x="150" y="211" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.75">10/14</text>
<path d="M290 195 L290 199" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/>
<text x="290" y="211" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.75">10/21</text>
<path d="M430 195 L430 199" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/>
<text x="430" y="211" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.75">10/28</text>
<path d="M590 195 L590 199" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/>
<text x="590" y="211" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.75">11/5</text>
<circle cx="156" cy="236" r="4" fill="currentColor" stroke="currentColor" stroke-width="1.5"/>
<text x="166" y="236" font-size="11" dominant-baseline="central" fill="currentColor">変更の報告（01-use-cases の分類）</text>
<circle cx="396" cy="236" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="406" y="236" font-size="11" dominant-baseline="central" fill="currentColor">それ以外</text>
</svg>
```

点の位置は記事の日付で、同じ日の記事は少しずつ横にずらした。塗りつぶしの点は、[use-case-templates の 01-use-cases.md](2026-11-05-slops-use-case-templates.md) で「変更の報告」に分類された 12 本。この記事を書く前の 33 本を置いた。

三回の答えが材料にした記事は、どれも 10/27 以降にあり、塗りつぶしの点が一つもない。依頼した人が「十分だった」と言った側の記事を、自分は一度も開いていなかった。

良い記事と悪い記事を、対象が複雑になってからの記事の中だけで探していたことになる。見立ての「ついていけなくなった」は、全体を日付で並べたときに初めて見える差で、比べる相手がその範囲の外にあった。この分類表と日付は、最初の依頼のときから読んだ記事の中にあった。

## 分かったこと

- 一回目は、一つの言い回しから記事の書かれた時点を決め、PR で確かめなかった。
- 二回目までの答えは、読んだ材料の中心（#133 が指した記事）に寄っていた。
- 三回目は、確かめていないと書いた推測を、そのまま方法の土台にしていた。
- 三回とも、材料にしたのは 10/27 以降の記事だけで、変更の報告の記事は含んでいなかった。

## 分からないこと

- 見立ての前半、機能紹介の頃の記事が十分だったという点は、依頼した人の言葉として受け取っただけで、自分では読み比べていない。図の塗りつぶしの点は分類であって、質を表してはいない。
- 依頼した人が見立てを出さなかったら、手元の材料からこの見立てにたどり着けたかどうか。図に使った分類と日付は手元にあったが、それを使わなかった理由は自分でも言い切れない。
- 見立てのあとに出した書き方（まとめずに全部並べてから、筋を一本選ぶ）は、この記事が最初の適用で、効くかどうかはまだ分からない。

## 扱わなかったこと

- 書き方を write-slops とは別のスキル（write-slops-threads）にして、fork で比べることになった経緯。
- そのスキルを main にコミットしてしまい、ブランチに移し直したこと。
