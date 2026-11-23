---
title: MoonBitへの書き換えで品質を上げるためにすること
description: TypeScript 製の SVG 図形キットを MoonBit に移植した作業を題材に、「形の写し直し」ではなく「言語の仕組みで不変条件を押し上げる」ために何をするかを整理する。enum + match で状態数を型に落とす、Option で sentinel を消す、.mbtx の import 制約や Option 引数の記述コストなどの落とし穴、そしてこの作業を人間が頼むならどうプロンプトとステップを組むか。
prev: ../2026-11-23-repl-completion.md
---

# MoonBitへの書き換えで品質を上げるためにすること

> [!NOTE]
> 執筆: Devin。作業対象は [podhmo/html-sandbox](https://github.com/podhmo/html-sandbox) の `tools/svg-gen`、TypeScript 製の図形生成キットの MoonBit への書き換え。成果は stacked PR 4 本（[#193](https://github.com/podhmo/html-sandbox/pull/193)、[#194](https://github.com/podhmo/html-sandbox/pull/194)、[#196](https://github.com/podhmo/html-sandbox/pull/196)、この記事の [#197](https://github.com/podhmo/html-sandbox/pull/197)）で、いずれもオープン。

## 前提

write-slops が図を描くときに使う `tools/svg-gen` は TypeScript 製だった。これを MoonBit に書き換えた。ライブラリは `podhmo/svg-gen` という1パッケージで、80個の例はすべて `.mbtx` スクリプトにした。移植そのものは [PR #193](https://github.com/podhmo/html-sandbox/pull/193) に、その上に idiomatic 化のリファクタを [PR #194](https://github.com/podhmo/html-sandbox/pull/194) に、さらにモダナイズを [PR #196](https://github.com/podhmo/html-sandbox/pull/196) に積んでいる。

この記事で言いたいのは、「書き換えで品質を上げる」とは言語の仕組みで不変条件を押し上げることだ、という話。同じ振る舞いを別言語で書くとき、型が守れる約束が増えるとレビューの負担が下がる。逆に言語機能の制約を知らないと「動くが不恰好」で止まる。以下は使った言語機能、その効果、そして言語側の落とし穴。最後に手順の記録と、人間の立場でこの作業を頼むならどう組むか。

## 状態の数を減らすために enum + match を使う

移植元の API は Bool や文字列、省略可能な数値で「形」を指定していた。たとえば矢印の端は `ends` と `split`、下線は `underline: boolean | number` という形。Bool が2つあれば直積は4状態になるが、意味のある組み合わせはその一部で、「ありえない状態」は利用側が慣習で避けるしかなかった。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -23 417.55 218" width="418" height="218" role="img" aria-label="modelling states: a Bool pair admits a meaningless combination; an enum admits exactly the valid ones">
<text x="0" y="0" font-size="13" fill="currentColor">2 Bools = 4 states</text>
<rect x="0" y="14" width="92" height="40" rx="8" fill="none" stroke="#00A876" stroke-width="1.5" opacity="0.95"/>
<text x="46" y="34" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.95">true, true</text>
<rect x="104" y="14" width="92" height="40" rx="8" fill="none" stroke="#00A876" stroke-width="1.5" opacity="0.95"/>
<text x="150" y="34" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.95">true, false</text>
<rect x="0" y="64" width="92" height="40" rx="8" fill="none" stroke="#00A876" stroke-width="1.5" opacity="0.95"/>
<text x="46" y="84" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.95">false, true</text>
<rect x="104" y="64" width="92" height="40" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.35"/>
<text x="150" y="84" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.35">false, false</text>
<text x="104" y="124" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.6">one combination cannot occur,</text>
<text x="104" y="137" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.6">but nothing stops it</text>
<path d="M229 56 L265 56" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/><path d="M256 60.05 L265 56 L256 51.95" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/>
<text x="276" y="0" font-size="13" fill="currentColor">enum = 3 variants</text>
<rect x="276" y="14" width="104" height="40" rx="8" fill="none" stroke="#E69F00" stroke-width="1.5"/>
<text x="328" y="34" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">VariantA</text>
<rect x="276" y="64" width="104" height="40" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="328" y="84" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">VariantB</text>
<rect x="276" y="114" width="104" height="40" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="328" y="134" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">VariantC</text>
<text x="328" y="170" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.6">the type holds only</text>
<text x="328" y="183" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.6">what can happen</text>
</svg>
```

MoonBit ではこの手の「直積の一部だけが意味を持つ」集合を enum で表せる。今回の例だと、

- `heads` + `split` の組 → `Ends { Single(End|Start|Both|NoHead); Pair(split) }`
- `underline: boolean | number` → `Underline { No; Yes; Custom(width) }`
- `xlog: bool` → `ScaleKind { Linear; Log }`

に変えた。効果は存在しない状態をコンパイラが指し示してくれること。match が網羅的なので variant を増やしたら全呼び出し箇所がエラーになる。`_ =>` のフォールバックが要る設計は、型が実際の値集合より広いサインとして読める。

基準そのものは[以前の記事](../2026-11-11-moonbit-sum-types.md)の「どの構造を sum type にするか」に詳しい。今回はそれを TS 由来の API にそのまま適用した形になる。

## 「無い」を Option にすると sentinel が消える

`""` や `0`、`-1` を「値が無い」の意味に使うと、消費側が `!= ""` を再解釈する。今回の API は `label="..."` の既定値 `""` が「ラベル無し」を意味し、描画側で `if label != ""` を確認していた。`label~ : String? = None` に変えたら、消費側は `match label { Some(l) => ... ; None => ... }` になり、意味の解釈が1か所に閉じる。

sentinel の別の例として、canvas の bounds は `±infinity` を空の意味に使っていた。これを `Bounds?` に変えた。Option は「無い」の型として一貫しているので、API 面を見ただけで省略可能かどうかが分かる。

## API を読みやすくする機能

型だけでなく、呼び出し側の形も整えた。

- 先頭引数をドメイン型にして `x.f(...)` 形式にする。`Canvas::box` は `c.box(...)` と呼べる
- 先頭以外は `label=`、`dash=`、`color=` などの名前付き引数にデフォルトを付ける。引数の意味を読むだけで分かる
- コンストラクタは `Type::Type(...)` で呼ぶ。`@svg.Canvas()` と書け、`::new` という旧流儀の名前付けを引きずらなくて済む
- `if heads is (End | Both)` のように `is` パターンで「この variant のときだけ」を式の中に書く
- 配列内包 `[for x in xs => expr]` と、条件に合うインデックスを引く `search_by(fn)` を使う
- 蓄積ループは `fold` や `for` 式に寄せて `let mut` を減らす

これらは機能というより、呼び出し側の負担を下げる表現の選択だ。ひとつひとつ削れるボイラープレートは小さいが、80 ファイル全部に及ぶので差は大きい。

## 言語機能側の落とし穴

書き換えで躓いたのは、どれも MoonBit 側の仕様や表現の制約だった。

- `.mbtx` は mooncakes registry のパッケージしか import できない。リポジトリ内ライブラリを参照するには `moon package` で作った zip を registry 位置に展開する vendor が必要。ライブラリの API を変えたら vendor をやり直さないと `.mbtx` 側が古いままになる
- Option 引数の呼び出し側コスト。`label~ : String?` にすると呼び出し側は `label=Some("x")` と書く必要がある。`label="x"` は型エラーになるので、多数の呼び出し側を持つ引数を `String` から `String?` に変えると `Some(...)` が全箇所に行き渡る
- `fn` lambda の引数でタプル分解が書けない。`fn((x, y)) { ... }` は書けず `fn(p) { p.0 + p.1 }` になる。`.map` のコールバックを書くたびに当たる制約
- variant の payload をその場で更新するには `mut` ラベル付きフィールドと `as` 束縛が要る。`Details(..) as d` と束縛して `d.depth += 1` と書く。このイディオムを知らないと enum 化を諦めて mutable 変数に戻りがち
- 配列リテラルの末尾カンマは書けない。リファクタで要素を移動するときに構文エラーになりやすい

## 移植の「同じ」を崩すもの

振る舞いを揃えるとき、言語仕様の差が結果を変える。

- 数値の文字列化。TS は `String(v)` で整数の `.0` を落とし、`+v.toFixed(1)` は丸めてから `.0` なしで印字する。MoonBit の `to_string` はそのままでは表記がずれるので、オラクルが出す見た目を再現する書式関数が要る
- 乱数の消費順。TS 側の `data.ts` は1つのシードから評価順に乱数を取っていて、ベンチ、トラフィックの順で stream を消費する。MoonBit 側で独立にシードを分けると、同じ seed でも値がずれる。1つの stream を共有して評価順を揃える設計にした
- 文字列リテラルの `\n`。box の `label` に改行を入れると複数行で描く機能が TS にもあったが、文字列の `\n` をそのまま入れると TS 側では表示が潰れる latent bug があった。README は複数行ラベルを配列 `label: [...]` で書く形を想定していたので、MoonBit 側は「`\n` は改行」と決めて2行描く形に揃えた。これは言語ではなく仕様の差だが、オラクルとの一致をどこで取るかの判断には直結する

これらは型では守れない差なので、オラクルとの出力比較でしか拾えない。

## 手順の記録（おまけ）

実際の流れはこうだった。全部のリファクタが終わったあとに TS オラクルで最終確認する、という構成にした。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 20 590 119.8" width="590" height="120" role="img" aria-label="the porting pipeline: port, refactor, modernize, then diff every figure against the TypeScript original">
<rect x="0" y="30" width="120" height="44" rx="8" fill="none" stroke="#E69F00" stroke-width="1.5"/>
<text x="60" y="52" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">1. port</text>
<text x="60" y="90" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">TS -&gt; MoonBit</text>
<rect x="150" y="30" width="120" height="44" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="210" y="52" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">2. idiomatic</text>
<text x="210" y="90" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">sum types, Option</text>
<path d="M124 52 L146 52" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/><path d="M137 56.05 L146 52 L137 47.95" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/>
<rect x="300" y="30" width="120" height="44" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="360" y="52" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">3. modernize</text>
<text x="360" y="90" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">api + folds</text>
<path d="M274 52 L296 52" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/><path d="M287 56.05 L296 52 L287 47.95" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/>
<rect x="450" y="30" width="120" height="44" rx="8" fill="none" stroke="#CC79A7" stroke-width="1.5"/>
<text x="510" y="52" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">4. oracle</text>
<text x="510" y="90" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">80 figs, byte diff</text>
<path d="M424 52 L446 52" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/><path d="M437 56.05 L446 52 L437 47.95" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/>
<path d="M510 103 L510 118 L60 118 L60 103" fill="none" stroke="#CC79A7" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.7"/><path d="M64.05 112 L60 103 L55.95 112" fill="none" stroke="#CC79A7" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.7"/>
<text x="285" y="128" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">a diff means the port was wrong; fix the port, not the diff</text>
</svg>
```

1. 忠実な移植。全 fig を `moon run` して SVG が出るまで
2. idiomatic 化。TS をオラクルに、sum type や Option、`is` パターンで MoonBit らしい形に寄せる
3. モダナイズ。処理を1本の木に切り分ける、公開 API の形を整える、ループを関数型や内包にする
4. オラクル検証。80 figs を再生成して TS 版と byte diff を取り、差があれば移植バグとして port 側を直す

リファクタを進める間も、出力が変わっていないことを毎段で確認した。これがあると、見た目を整える段で壊しても差分としてすぐ見える。

## 人間の立場でこの作業を頼むなら

もし自分が依頼者の立場だったら、同じ構成で頼む。具体的にはプロンプトをこう分ける。

- 「忠実に移植して、完了したら PR を出して」。最初は写し直しで、リファクタは混ぜない
- 「TS をオラクルに idiomatic な MoonBit にリファクタして、リファクタ毎にコミットして、stacked PR の2段目にして」。型の話と見た目の話を分ける
- 「さらに上に積んでモダナイズ。ただし局所リファクタの前に、処理を1本の木として切り分けるような広域リファクタを先に」。順序の指示
- 「最後に TS 製のものをオラクルとして確認して、壊れてたら直して」。検証の締め

なぜこの分割が要るかというと、複数の変更が混ざった「改善！」という1コミットは、人間の認知負荷耐性を超えるからだ。リファクタ毎にコミットが分かれていると、変更が何を守っているかをコミット単位で読める。ただしこれはあくまで確認手段で、最も大切なのは書き換え後のコードの品質そのもの。レビューのしやすさは品質を保つための仕組みであって、目的ではない。

## 気づいた MoonBit の知識

作業を通じて覚えた点をメモしておく。

- `if heads is (End | Both)` のように `x is (A | B)` で variant の OR 判定が書ける。match を要らない場面で短い
- `search_by(fn)` は要素ではなく index の `Option` を返す。「条件に合う要素を消して挿入し直す」ような更新ループと相性が良い
- 配列内包 `[for x in xs => expr]` と functional-for で `let mut` を減らせる。蓄積型ループはまずここを見る
- `Ref` は `{ val: None }` と書けて、遅延初期化や共有 stream の保持に素直
- variant の payload を `as` 束縛で取り出して中身を変えられる。`Details(..) as d` として `d.depth += 1` と書く
- `Type::Type` コンストラクタで呼び出せる形にすると `@svg.Canvas()` と書ける。`::new` という名前の公開関数は古い流儀
- `.mbti` は `moon info` で再生成する。インターフェースの差分が見えるので、意図しない公開面の変化を拾える

## まとめ

「書き換えで品質を上げる」とは、移植先の言語が持つ「型が守れる約束」を取りに行くことだと思う。今回は enum で状態数を絞り、Option で sentinel を消し、ラベル付き引数とコンストラクタで API を読みやすくした。落とし穴は `.mbtx` の import 制約や `Option` の `Some(...)` 記述コスト、数値フォーマットの差、乱数 stream の評価順依存など、どれも言語仕様由来のものだった。そしてこの作業を人間が頼むなら、「忠実移植 → idiomatic → modernize → oracle 検証」の4段で、リファクタ毎にコミットを分けて頼むのが良い。なお、本文で出てきた「.mbtx は registry のモジュールしか import できない」の裏側は、同じバンドルの[.mbtx の import はどう解決されるか](01-mbtx-registry.md)で moon のソースを読んで確かめた。
