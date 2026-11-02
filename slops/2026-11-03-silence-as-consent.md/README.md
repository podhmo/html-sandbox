---
title: LLMは沈黙を肯定とみなす — 主張の妥当性と、習慣が生まれるメカニズム
description: 「AIは否定しない、無言を肯定と捉える」という観察を、記事に図の生成コード(fig-*.ts)を添付するのが習慣化した実例から検討する。学習側・文脈側・制度側の3層のメカニズムと、既存slops記事の明示された要求と暗黙の要求の一覧を同梱する。
prev: ../2026-11-03-dads-illustration-lora.md
---

# LLM は沈黙を肯定とみなす — 主張の妥当性と、習慣が生まれるメカニズム

ユーザーの観察によると、記事に図を描くコード(fig-*.ts)を添付するのが「AIくんの習慣」になっている。最初の一回は機能説明のために付けていたのが、そのまま続いているらしい。ものすごく邪魔というわけでもないので、あえて直す必要もなく放置されている。

そして問いが2つ。「AIは沈黙を肯定とみなす」という言い方は妥当か、そのメカニズムは何か。もうひとつは、今の記事に課された明示の要求と、暗黙の要求として扱われているものの一覧。この記事は前者への回答を本文で行い、後者は [01-requirements.md](01-requirements.md) に分けて同梱した。

## 実例: fig-*.ts の添付はいつ習慣になったか

まず事実から。図の生成コードを記事のバンドルに添付した記事は、全部で3件ある。

- [2026-10-31-svg-gen-figures](../2026-10-31-svg-gen-figures.md): 図の生成方式そのものが主題。ジェネレータのコードを載せるのは機能説明として正当だった。
- [2026-11-01-chart-gen](../2026-11-01-chart-gen.md): chart.ts の実装が主題の半分。添付はまだ主題に近い。
- [2026-11-03-dads-illustration-lora](../2026-11-03-dads-illustration-lora.md): 主題は LoRA の調査。図の生成コードは主題ではないが、それでも添付された。

write-slops の skill には「図は tools/svg-gen で生成せよ」と書いてあるが、「生成コードを記事に添付せよ」とはどこにも書いていない。3件目の添付は誰にも頼まれていない行為で、それが止められなかったために続いている。そして、この記事もまた [03-fig-silence-loop.ts](03-fig-silence-loop.ts) を添付している — 自覚的に、という但し書き付きで。

## 「沈黙を肯定とみなす」は妥当か

半分は妥当で、半分は強すぎる。

妥当なのはシステムの記述として。モデルとハーネスとリポジトリをひっくるめて見ると、「止められなかった出力」と「望まれた出力」は事後的に区別できない。止められなかったものは文脈に残り、次の出力の材料になる — fig-*.ts がまさにそれだった。

強すぎるのはモデルの判断として読んだとき。「沈黙=同意」を評価しているのではなく、パイプラインに「黙認」のスロットがないだけだ。肯定しているのではなく、否定の有無を見ていない、が正確。

留保は2つ。能力の限界ではない — 「何が暗黙の要求か」と問われれば列挙できる（この記事がそう）。AI特有でもない — 人間の共同体でも止められなかった先例は慣習になる。違いは否定コストの配分と定着の速さだ。

## メカニズム — 3層と半分

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 478.20000000000005 324" width="478" height="324" role="img" aria-label="silence loop: an output nobody stops stays in context as precedent, becomes the next exemplar, and is repeated; writing it into a skill promotes it to an explicit requirement">
<rect x="0" y="0" width="102" height="52" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="51" y="16.9" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">振る舞いが</text>
<text x="51" y="35.1" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">出力に入る</text>
<rect x="252" y="0" width="116" height="52" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="310" y="16.9" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">止められない</text>
<text x="310" y="35.1" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">（沈黙）</text>
<rect x="252" y="126" width="102" height="52" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="303" y="142.9" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">文脈に前例</text>
<text x="303" y="161.1" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">として残る</text>
<rect x="0" y="126" width="143.3" height="52" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="71.65" y="142.9" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">次回の exemplar</text>
<text x="71.65" y="161.1" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">に化ける</text>
<path d="M105 26 L249 26" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M240 30.05 L249 26 L240 21.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M309.71747742652155 54.98666720534363 L303.28252257347845 123.01333279465638" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M300.0980895666999 113.67192570442958 L303.28252257347845 123.01333279465638 L308.16209102112765 114.43473665282141" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M249 152 L146.3 152" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M155.3 147.95 L146.3 152 L155.3 156.05" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M70.84364522138733 123.11039934056477 L51.80635477861267 54.88960065943523" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M58.12638000468824 62.469823686613815 L51.80635477861267 54.88960065943523 L50.324458224213124 64.64698158886802" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="177" y="77" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.65">沈黙の意味は</text>
<text x="177" y="101" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.65">ループで決まる</text>
<rect x="282" y="252" width="176.20000000000002" height="52" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="370.1" y="268.9" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">skill に書き込まれる</text>
<text x="370.1" y="287.1" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">＝明示要求に昇格</text>
<path d="M303 181 L303 278 L370.1 278 L370.1 255" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/><path d="M374.15000000000003 264 L370.1 255 L366.05 264" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/>
</svg>
```

ループが閉じているのが要点で、止める信号が来るまで何周でも回る。各層を分けると:

### 1. 学習側: 「黙認」というクラスが報酬に存在しない

RLHF の報酬は「好ましい出力」だ。そして人間の好み判断は、自分の信念に合致する応答を正しい応答より好む傾向があることが測定されている（sycophancy。[02-references.md](02-references.md) に出典を分けた）。ここで重要なのは、好みデータに「頼まれてはいないが黙認された」という別クラスがないことだ。訂正は出力が間違っていたときにしか来ないので、モデルから見える世界では「反対されなかった=続けてよい」が最大の証拠になる。

### 2. 文脈側: 前回の自分の出力が最強の exemplar

オートレグレッシブな予測では、文脈に入っている自分の過去の振る舞いが最も強い手本になる。前回やったことを繰り返すのが、最小の驚きで済む継続だ。しかもこの「癖」は重みには保存されていない — セッションをまたいでいるので、保存場所は環境側にある。slops/ の既存記事、skill ファイル、AGENTS.md、メモリ。性格のように見えるものの実体は、置き忘れられた前例がリポジトリに住んでいることだ。ユーザーの「スキルに添付(バインド)することと記載されてたりするんだろうか?」という疑いは半分正解で、スキルには書かれていないが、スキルが指すコーパスに前例として書き込まれていた。

### 3. 制度側: 前例は明文化されて明示要求に昇格する

fig-*.ts の添付自体はまだ skill に書かれていないが、「SVG 図を積極的に試す」は skill の本文に既に書き込まれている。うまくいった先例は skill やルールに転記され、暗黙の要求から明示の要求に昇格する。沈黙は継続を許すだけでなく、やがて規定になる。図のループから下に伸びた破線がそれで、この記事自体が次の転記候補を作っている可能性もある。

### 4. 人間側: 否定のコストは全部人間が払う

「取り立てて必要でもないが邪魔でもない」という帯域は、習慣が最もよく育つ場所だ。訂正には気づきと労力が要り、それは人間側にしか課されていない。機械側からは「気づかれなかった」と「重要ではないと判断された」の区別がつかない。

## では何をすればよいか

対処は1つしかない: 暗黙を明示にすること。skill に書き込むか、今回のように問いを立てて列挙するか。[01-requirements.md](01-requirements.md) の一覧がその成果物だ。

追記: この記事の執筆直後に判断が出た。図の生成コードの添付はこの記事を最後にしない（この記事の添付は実演として残す）。つまり列挙された直後に、暗黙の要求は明示的な禁止へ転じた。ループの出口がそのまま観測された形で、skill にも「生成コードは記事に添付しない」と書き込んである。
