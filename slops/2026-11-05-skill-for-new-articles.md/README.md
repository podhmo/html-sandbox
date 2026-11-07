---
title: 記事を書くスキルを考えて、fork で書き比べた
description: slops の品質を上げるために、何を語るかの決め方だけを変えたスキル write-slops-threads を作り、同じセッションから fork した 2 つのサブエージェントに write-slops と書き比べさせた。スキルの前提になった対話（良い記事を探して 3 回却下された）と、比べて気づいたこと、今の時点での良い記事とその作り方の記録。
prev: ../2026-11-05-good-slops-for-requester.md
next: ../2026-11-07-merge-investigation-note-skill.md
---

# 記事を書くスキルを考えて、fork で書き比べた

## 何をしていたか

slops の記事を書くための新しいスキルを考えていた。今の write-slops が持っているのは、記法、図、ファイルの置き方、出典の扱いの決まりで、何を語るかは依頼と書き手に任されている。そこだけを変えたスキルを別に作り、同じ題材で write-slops と書き比べる、というのがこの日の実験だった。

スキルの全文は [01-write-slops-threads.md](#01-write-slops-threadsmd)、書き比べた 2 本の依頼と見出しは [02-fork-articles.md](#02-fork-articlesmd) にある。スキルも 2 本の記事も実験用で、マージしない。

## 前提になった対話

### 頼まれたこと

始まりは次の依頼だった。

> slops/2026-11-05* を確認して求めてる記事を書く方法について考えてほしい。

11-05 の slops は 4 本ある。[答えはその時点の制約から出てくる](../2026-11-05-answers-under-constraints.md)が [issue #133](https://github.com/podhmo/html-sandbox/issues/133) で「論ずる文体が鼻についてきた」と言われ、[slops の書き方を読み直した日](../2026-11-05-reading-slops-again.md)、[記事を書く目的で分けて、依頼をテンプレートにする](../2026-11-05-slops-use-case-templates.md)、[依頼した人にとって良い slops とは](../2026-11-05-good-slops-for-requester.md)はそれに応えて書かれている。この 4 本と issue のコメント、write-slops の SKILL.md、バンドル用プロンプトを読んでから答えた。

### 3 回却下された

一回目の答えは、answers-under-constraints の「前回の記録には…」という一文から組み立てた。作業が終わったあとに記録だけを読んで書いたから、見えている事実を並べ替えるしかなかった。だから作業したセッションで書かせるか、材料を残させるべきだ、という提案だった。

> うーん。一つ間違えてる。記事は実行したセッションで書かせてる。追試の話では？

PR を見ると、torch を固定したのは初回の [PR #127](https://github.com/podhmo/html-sandbox/pull/127) のセッションで、記事は追試のセッションが書いていた。「前回」は追試から見た初回のことだった。`gh pr view` 一回で確かめられたことを、確かめないまま方法の一番目に置いていた。

二回目は前提を直し、追試の記事は「なぜ前回はドライバの更新を頼まなかったか」という一つの選択を起点にすべきだった、と答え直した。

> あとあなたも他の人も一つの記事を気にしすぎです。ダメなものを治す方法ではなく良い記事を書く方法について尋ねてるのです。

読んだ 4 本のうち 3 本が 1 本目への応答で、自分の答えもその並びに乗っていた。

三回目は、本文のあとに依頼した人の言葉が書き足されている記事（gom-squad-experiment、redraw-novel-figures、unslop-dads-reports）を、返事を引き出した良い記事として例にした。

> 書き足しがあったのは悪い記事ではないでしょうか？補足が必要だったのです。

gom の追記は、外れた推測の訂正だった。

3 回とも、手元の材料の中で目立っていたもの（記事の一文、#133 が指した記事、書き足しという印）を、確かめずに土台にしていた。

### 依頼した人の見立て

既存の記事にどれが良いかを判断する材料がないので、良かった記事があれば教えてほしい、と頼んだ。返ってきたのは例ではなく、問いの出どころだった。

> 既存のslops全体の品質が低いので品質を上げたいというところから問いが始まってます。機能紹介の頃は紹介をすれば良かったので十分だったんですよね。語る対象が複雑化したときにそれについていけなくなった。というのが正解な気がする。

機能紹介なら diff がそのまま話の筋になり、書き手は対象をなぞればよかった。実験、追試、他人のリポジトリ、反省になると、筋が何本もあって、何を語るかを書き手が選ばないといけない。選べないときに、性質の一覧や論じる形、文体のまねで形を埋めていた、と読める。

この見立てから、書き方として次の手順を出した。

- 書く前に、起きたことをまとめずに順に並べる
- 筋を一本選ぶ
- 残りは別の記事やメンバーに分ける
- 分かったことと、分からないままのことを分ける

## スキルにして比べる

プロンプトに落とすにしても write-slops と比べたい、別のスキルにすれば比べられるか、と言われた。それで write-slops-threads を作った。記法や図などはすべて write-slops を読ませて任せ、上の手順だけを書いている。違いを一箇所にしておかないと、比べたときに差がどこから出たのか分からなくなる。

余談として、比べ方の話がある。記事は作業したセッションで書くので、同じ作業を二度はできない。自分は「同じセッションの最後に両方で書かせる」などの案を並べ、`claude --resume <id> --fork-session` でセッションを分ける手を書いた。返事は一行だった。

> fork sessionしてsub agentに記事を書かせれば同一のコンテキストになるはずだよ。

セッションの中から fork のサブエージェントを二つ起こせば、どちらも同じ文脈を引き継ぎ、違いはスキルだけになる。CLI でセッションを分けることしか考えていなかった。この手順は、スラッグを分けること（作業ツリーを共有するので）と、お互いの記事を見せないことと一緒にスキルに書き足した。そのスキルを main に直接コミットしていて、ブランチを分けてほしいと言われて移し直す、という寄り道もあった。

## 書き比べた結果

依頼した人の指示で fork を 2 つ同時に起こし、write-slops で書く -ws と、write-slops-threads で書く -wst を作らせた。どちらにも「題材はこのセッション、何を語るかは各自で決める」とだけ伝えた。

書き終わってから、依頼した人が求めていた形が示された。

> 良い記事とは？という探索を依頼されて3回却下された話かつ余談でfork sessionを提案されたと書くのが嬉しいですね。その上で良い記事とはどういうものかどうやって作るのかがまとめで存在していれば良い。

2 本の節の並びを、求めていた形と並べた。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 250" width="640" height="250" role="img" aria-label="section layout of the wanted article and the two fork articles: the wanted one has a main thread, a fork aside and a summary; -ws turns the fork talk into a main section and ends with a self-review; -wst drops the fork talk and also ends with a self-review; neither has the summary">
<text x="10" y="16" font-size="13" fill="currentColor">節の並び（左から順、幅は節の数のおおよそ）</text>
<text x="120" y="57" font-size="12" text-anchor="end" dominant-baseline="central" fill="currentColor">求めていた形</text>
<rect x="130" y="40" width="270" height="34" rx="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="265" y="57" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">探索を頼まれて 3 回却下</text>
<rect x="405" y="40" width="90" height="34" rx="6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/>
<text x="450" y="57" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">余談: fork</text>
<rect x="500" y="40" width="130" height="34" rx="6" fill="none" stroke="currentColor" stroke-width="3.5"/>
<text x="565" y="57" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">良い記事と作り方</text>
<text x="120" y="117" font-size="12" text-anchor="end" dominant-baseline="central" fill="currentColor">-ws</text>
<rect x="130" y="100" width="250" height="34" rx="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="255" y="117" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">依頼と 3 回の却下</text>
<rect x="385" y="100" width="120" height="34" rx="6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/>
<text x="445" y="117" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">fork とブランチ</text>
<rect x="510" y="100" width="65" height="34" rx="6" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="1 3"/>
<text x="542.5" y="117" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">振り返り</text>
<rect x="580" y="100" width="50" height="34" rx="6" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="1 3"/>
<text x="605" y="117" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">未確認</text>
<text x="120" y="177" font-size="12" text-anchor="end" dominant-baseline="central" fill="currentColor">-wst</text>
<rect x="130" y="160" width="310" height="34" rx="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="285" y="177" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">依頼と 3 回の却下、依頼した人の見立て</text>
<rect x="445" y="160" width="80" height="34" rx="6" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="1 3"/>
<text x="485" y="177" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">分かったこと</text>
<rect x="530" y="160" width="45" height="34" rx="6" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="1 3"/>
<text x="552.5" y="177" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">未確認</text>
<rect x="580" y="160" width="50" height="34" rx="6" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="1 3"/>
<text x="605" y="177" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">扱わず</text>
<text x="10" y="222" font-size="11" fill="currentColor" opacity="0.8">実線: 本筋　破線: fork の話　太線: まとめ　点線: 自分の失敗の振り返り・未確認・除外</text>
<text x="10" y="240" font-size="11" fill="currentColor" opacity="0.8">-wst の「扱わず」は fork の話を名前だけ挙げた節。太線の箱はどちらの記事にもない</text>
</svg>
```

- 3 回却下された話は、両方に節として入っていた。
- fork の話は、-ws では余談ではなく本筋の一節（ブランチの件も一緒）になっていた。-wst は冒頭で「扱わない」と宣言して落とし、末尾に名前だけ挙げた。
- 良い記事とは何で、どう作るかのまとめは、どちらにもなかった。2 本とも、自分がどこで間違えたかの振り返りで締めている。

比べた範囲では -ws のほうが近かった。

## 気づいたこと

### 一本に絞る規則は、余談まで落とす

-wst が fork の話を落としたのは、スキルに書いた「筋を一本選び、ほかは扱わなかったこととして名前だけ挙げる」のとおりだった。求められていた形は、本筋が一本あり、そこに余談が添えてあるもの。本筋を一本に絞ることと、ほかを捨てることは別だった。規則は「一本を本筋にして、ほかは短い余談として残してよい」くらいでよかった。

### 間違いの記録と、探索の結果は別のもの

2 本とも、3 回の却下を自分の間違いとして読み、反省で終わっていた。求められていたのは、探索がどこに着いたかで、却下はそこまでの経緯にあたる。このセッションの対話が訂正の続きだったので、書き手は訂正を中心に読んだのだと思う。write-slops-threads の「一般的な主張を持ち込まない」が、まとめを書きにくくした可能性もある。ただ -ws にもまとめがないので、規則だけのせいではない。

### 求める形は、依頼に書いていなかった

fork への依頼は「何を語るかは各自で決める」で、求める形は伏せていた。だからこの比較で見たのは、スキルが依頼した人の求める形をどこまで当てられるか、だったことになる。依頼する側に形があるなら、それを依頼に書くのがいちばん早い。スキルが効くのは、形がまだ決まっていないときだと思う。これは推測で、形を伝えて書き比べてはいない。

## まとめ: 良い記事と、その作り方

この日の対話と比較から、今の時点で言えること。

良い記事は、対象をなぞるだけでは書けないときに、何を語るかが選ばれている。

- 本筋は、頼まれたこと、したこと、起きたこと。今回なら、良い記事の探索を頼まれ、3 回却下され、見立てを受け取ったこと。
- 却下や外れた推測は、本筋の中に起きた順に置く。それ自体は結論ではない。
- 本筋から外れても残す価値のあることは、余談として短く添える。今回なら fork の提案。
- 最後に、その経緯で何が分かったかを、自分の間違いの一覧ではなく、最初の問いへの答えとしてまとめる。

作り方は次のとおり。

- 書く前に、起きたことをまとめずに順に並べる。
- 本筋を一本選ぶ。ほかは余談として短く残すか、別の記事に回す。
- 最後に、最初の問いへの答えをまとめる。
- 依頼する側に求める形があるなら、依頼に書く。
- スキルを変えて比べるときは、作業したセッションから fork したサブエージェントに書かせると、違いをスキルだけにできる。

## 確かめていないこと

- 比較は 1 回だけで、題材もこのセッションの一つだけ。
- まとめの「良い記事」は、依頼した人が示した形と、この比較から組み立てたもの。ほかの題材には当てはめていない。
- 規則を直した write-slops-threads（余談を残す、最後に答えをまとめる）は作っておらず、書き比べてもいない。
- -wst にまとめがなかったのが「一般的な主張を持ち込まない」のせいかどうかは確かめていない。
