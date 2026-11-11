---
title: Goの形を脱いでMoonBitのsum typesに寄せた
description: issue #158 の対応で tinymarkdown と blog site を Go 風の struct + sentinel から MoonBit の enum / Option に書き直した記録。点検に使った基準、書き換えた箇所、あえて手を付けなかった過剰適用の例、実装中の気づき、範囲外で見つかった残りの候補まで。
prev: 2026-11-07-numbered-lists.md
---

# Goの形を脱いでMoonBitのsum typesに寄せた

> [!NOTE]
> 執筆: Devin。

## 依頼と前提

[issue #158](https://github.com/podhmo/html-sandbox/issues/158)「MoonBit 側のコードが Go の手続き的な形に引きずられていないか点検する」。発端は前回の[番号付きリストの記事](2026-11-07-numbered-lists.md)そのもので、あのとき入れた `Item.num` が「`num == 0` が箇条書きの印」という sentinel になっていた。Go に sum type がないので sentinel で代用するのは自然だが、それを MoonBit にそのまま写すと enum の利点（網羅性検査、不正状態の排除）を捨てることになる、という話。

方針は issue の中で決まっている。

- Go と MoonBit の実装を揃える必要はない。振る舞いは揃える。それぞれの言語で自然なコードを書く
- JS ブリッジ（`moonbit/pkg/tinymarkdown/js`）は薄いほどよい。出力の形は MoonBit の型に合わせてよい

つまり Go の `Item{Text, Num, Children}` はそのまま残し、MoonBit 側だけを書き換える。結果は [PR #160](https://github.com/podhmo/html-sandbox/pull/160)。

## 基準

[点検コメント](https://github.com/podhmo/html-sandbox/issues/158#issuecomment-6786904265)で決めた判断基準はこれ。

1. 排他な状態を Bool の組や sentinel 値（`""`、`0`、`-1`）で表さない。enum の variant にする
2. ある状態のときだけ意味を持つフィールドは、その variant の payload に入れる
3. 「無い」は Option で表す。`""` や `0` を「無い」の意味で使わない
4. 閉じた語彙の文字列は enum にし、HTML/JSON の境界で文字列に変換する
5. 性質はそれを持つものの型に置く（リストの種別はリストにあって項目にはない）
6. match は網羅させる。`_ =>` が要るのは型が値の集合より広いサイン
7. Go との一致は振る舞いで取る。型の形まで揃えない

逆に enum にしない方がよいものも最初に決めておく。範囲のある数値（見出しの level 1..5）と、外部入力そのもの（front matter の生の値、URL 文字列）。この「やらない側」を先に言語化しておくと機械的な書き換えを防げる。

## 前提のコード

変更前は Go 側と同じ構造を写していた。

```
pub(all) struct Item {
  text : String
  num : Int32            // "N. " の N、"- " / "* " なら 0
  children : Array[Item]
}
Block::List(Array[Item])
```

`num` は2つの役割を兼ねていた。0 なら箇条書きの印（sentinel）、正なら順序付きリストの開始番号（データ）。しかも「ol か ul か」はリスト全体の性質なのに項目に置かれていたので、描画側は毎回先頭項目を見て判断していた。

```
if items is [first, ..] && first.num > 0 { <ol> } else { <ul> }
```

この規則は `views.mbt` と `experiments/browser-render` に複写されていた。そして `children : Array[Item]` ではネストしたリストの種別を保持する場所がないので、各レベルでまた先頭項目を見るしかなかった。

スキャナも似た形だった。`para` `items` `quote` `table` の4つのバッファと `in_code` `in_details` `in_foot` の3つのフラグが並列に置かれ、モードごとの変数（`details_depth` `details_code` など）がフラグと無関係な場所に浮いていた。「同時に1つしかアクティブにならない」は実行を読んで初めて分かる不変条件で、型は何も言っていなかった。

他にも `Member { is_markdown, is_svg, meta, doc }`（フラグが立つときだけ意味を持つフィールド）、`prev`/`next`/`NavItem.href`/`CodeBlock.info`/`Details.summary` の `""` を「無い」の意味で使う表現、`Alert` の `kind : String` とそのフォールバック `_ => "Caution"` があった。

## 書き換えたこと

### リスト: 性質をリスト自身へ

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 6 680 284.2" width="680" height="284" role="img" aria-label="before: num on every Item doubles as the list kind; after: ItemList owns kind and Item.children points back at it">
<text x="24" y="30" font-size="14" fill="currentColor">before</text>
<path d="M24 34.8 L70.20000000000002 34.8" fill="none" stroke="currentColor" stroke-width="2"/>
<text x="26" y="44" font-size="13" fill="currentColor">Item</text>
<rect x="32" y="60" width="148" height="26" rx="4" fill="none" stroke="currentColor" stroke-width="1"/>
<text x="106" y="73" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">text : String</text>
<rect x="32" y="92" width="148" height="26" rx="4" fill="none" stroke="#E69F00" stroke-width="2"/>
<text x="106" y="105" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">num : Int32</text>
<rect x="32" y="124" width="148" height="26" rx="4" fill="none" stroke="currentColor" stroke-width="1"/>
<text x="106" y="137" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">children : Array[Item]</text>
<rect x="24" y="52" width="164" height="106" rx="8" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
<path d="M32 137 L12 137" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/>
<path d="M12 137 L12 105" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/>
<path d="M12 105 L24 105" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/><path d="M15 109.05 L24 105 L15 100.95" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/>
<rect x="32" y="178" width="148" height="26" rx="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="106" y="191" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">List(items)</text>
<path d="M106 176 L106 160" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M110.05 169 L106 160 L101.95 169" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="24" y="232" font-size="11" fill="currentColor" opacity="0.75">num == 0 marks bullet items</text>
<text x="24" y="248" font-size="11" fill="currentColor" opacity="0.75">render: items[0].num &gt; 0 ? &lt;ol&gt; : &lt;ul&gt;</text>
<text x="300" y="30" font-size="14" fill="currentColor">after</text>
<path d="M300 34.8 L338.5 34.8" fill="none" stroke="currentColor" stroke-width="2"/>
<text x="302" y="44" font-size="13" fill="currentColor">ItemList</text>
<rect x="308" y="60" width="148" height="26" rx="4" fill="none" stroke="#3B82C4" stroke-width="2"/>
<text x="382" y="73" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">kind : ListKind</text>
<rect x="308" y="92" width="148" height="26" rx="4" fill="none" stroke="currentColor" stroke-width="1"/>
<text x="382" y="105" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">items : Array[Item]</text>
<rect x="300" y="52" width="164" height="74" rx="8" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
<text x="302" y="148" font-size="13" fill="currentColor">Item</text>
<rect x="308" y="164" width="148" height="26" rx="4" fill="none" stroke="currentColor" stroke-width="1"/>
<text x="382" y="177" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">text : String</text>
<rect x="308" y="196" width="148" height="26" rx="4" fill="none" stroke="currentColor" stroke-width="1"/>
<text x="382" y="209" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">children : ItemList?</text>
<rect x="300" y="156" width="164" height="74" rx="8" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
<path d="M308 105 L284 105" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M284 105 L284 193" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M284 193 L300 193" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M291 197.05 L300 193 L291 188.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M308 209 L266 209" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/>
<path d="M266 209 L266 89" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/>
<path d="M266 89 L300 89" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/><path d="M291 93.05 L300 89 L291 84.95" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/>
<rect x="524" y="76" width="148" height="26" rx="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="598" y="89" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">List(item_list)</text>
<path d="M522 89 L466 89" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M475 84.95 L466 89 L475 93.05" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="300" y="262" font-size="11" fill="currentColor" opacity="0.75">kind = Bullet | Ordered(start~)</text>
<text x="300" y="278" font-size="11" fill="currentColor" opacity="0.75">render: match list.kind { ... }</text>
</svg>
```

```
pub(all) enum ListKind {
  Bullet
  Ordered(start~ : Int32)
}

pub(all) struct ItemList {
  kind : ListKind
  items : Array[Item]
}

pub(all) struct Item {
  text : String
  children : ItemList?
}
Block::List(ItemList)
```

ポイントは `num` を消したことより、`kind` を `ItemList` が持つようにしたこと。`children` を `ItemList?` にしたのでネストしたリストも自分の `kind` を持てる。描画は先頭項目を覗かずに `match list.kind` するだけになった。

```
match list.kind {
  Ordered(start=1) => @el.el(@el.ol, lis)
  Ordered(start~) =>
    @el.el(@el.ol, [@el.Attr(@el.AttrName("start"), "\{start}"), ..lis])
  Bullet => @picoel.list(lis)
}
```

### スキャナ: 1つしかアクティブになれないなら1つの値にする

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="14 6 940.35 254.2" width="940" height="254" role="img" aria-label="before: many slots, one live, kept by hand; after: two slots, variant carries its own vars">
<rect x="121" y="55" width="106" height="42" rx="11" fill="currentColor" fill-opacity="0.06" stroke="none"/>
<rect x="121" y="157" width="106" height="42" rx="11" fill="currentColor" fill-opacity="0.06" stroke="none"/>
<rect x="463" y="55" width="194" height="42" rx="11" fill="currentColor" fill-opacity="0.06" stroke="none"/>
<rect x="463" y="127" width="194" height="70" rx="11" fill="currentColor" fill-opacity="0.06" stroke="none"/>
<text x="24" y="30" font-size="14" fill="currentColor">before</text>
<path d="M24 34.8 L70.20000000000002 34.8" fill="none" stroke="currentColor" stroke-width="2"/>
<text x="24" y="54" font-size="12" fill="currentColor" opacity="0.7">pending buffers</text>
<rect x="24" y="62" width="92" height="28" rx="4" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/>
<text x="70" y="76" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.6">para []</text>
<rect x="128" y="62" width="92" height="28" rx="4" fill="none" stroke="#3B82C4" stroke-width="2"/>
<text x="174" y="76" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">items [it]</text>
<rect x="232" y="62" width="92" height="28" rx="4" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/>
<text x="278" y="76" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.6">quote []</text>
<rect x="336" y="62" width="92" height="28" rx="4" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/>
<text x="382" y="76" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.6">table []</text>
<text x="24" y="112" font-size="11" fill="currentColor" opacity="0.6">at most one non-empty</text>
<text x="24" y="156" font-size="12" fill="currentColor" opacity="0.7">mode flags + loose vars</text>
<rect x="24" y="164" width="92" height="28" rx="4" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/>
<text x="70" y="178" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.6">in_code</text>
<rect x="128" y="164" width="92" height="28" rx="4" fill="none" stroke="#3B82C4" stroke-width="2"/>
<text x="174" y="178" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">in_details</text>
<rect x="232" y="164" width="92" height="28" rx="4" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/>
<text x="278" y="178" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.6">in_foot</text>
<rect x="128" y="206" width="88" height="24" rx="4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.7"/>
<text x="172" y="218" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.7">details []</text>
<path d="M172 206 L174 192" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.5"/>
<rect x="224" y="206" width="88" height="24" rx="4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.7"/>
<text x="268" y="218" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.7">details_depth</text>
<path d="M268 206 L174 192" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.5"/>
<rect x="320" y="206" width="88" height="24" rx="4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.7"/>
<text x="364" y="218" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.7">details_code</text>
<path d="M364 206 L174 192" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.5"/>
<text x="24" y="248" font-size="11" fill="currentColor" opacity="0.6">one group active at a time — a rule kept by hand</text>
<text x="470" y="30" font-size="14" fill="currentColor">after</text>
<path d="M470 34.8 L508.5 34.8" fill="none" stroke="currentColor" stroke-width="2"/>
<text x="470" y="54" font-size="12" fill="currentColor" opacity="0.7">pending</text>
<rect x="470" y="62" width="180" height="28" rx="4" fill="none" stroke="#3B82C4" stroke-width="2"/>
<text x="560" y="76" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">Items([it])</text>
<text x="660" y="76" font-size="11" dominant-baseline="central" fill="currentColor" opacity="0.6">= one of Nothing | Para | Items | Quote | Table</text>
<text x="470" y="126" font-size="12" fill="currentColor" opacity="0.7">mode</text>
<rect x="470" y="134" width="180" height="56" rx="4" fill="none" stroke="#3B82C4" stroke-width="2"/>
<text x="560" y="154.2" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">Details {</text>
<text x="560" y="169.8" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">  depth, in_code, lines }</text>
<text x="660" y="162" font-size="11" dominant-baseline="central" fill="currentColor" opacity="0.6">= one of Normal | Code | Details | Footnote</text>
<text x="660" y="178" font-size="11" dominant-baseline="central" fill="currentColor" opacity="0.6">its vars ride inside the variant</text>
<text x="470" y="248" font-size="11" fill="currentColor" opacity="0.6">one slot each; the type keeps the rule</text>
</svg>
```

```
priv enum Pending {
  Nothing
  Para(Array[StringView])
  Items(Array[RawItem])
  Quote(Array[StringView])
  Table(Array[StringView])
}

priv enum Mode {
  Normal
  Code(info~ : StringView, indent~ : Int32, lines~ : Array[StringView])
  Details(mut depth~ : Int32, mut in_code~ : Bool, lines~ : Array[StringView])
  Footnote(label~ : String, mut blank~ : Int32, lines~ : Array[String])
}
```

調べてみると `scan` はブロックを push する前に必ずバッファを flush していたので、4つのバッファが同時に非空になることは最初からなかった。並列に見えた状態は実は1つの状態を4つの変数に分散させていただけで、`Pending` にすると不変条件が構造になる。モード側も同様で、`details_depth` のような「そのモードのときだけ存在する変数」は variant の payload に入れた。

variant の中身を更新するには `mut` ラベル付きフィールドと `as` 束縛を使う。`Details(..) as d` と束縛して `d.depth -= 1` と書く。パターン束縛自体はイミュータブルなので、このイディオムを知らないと enum 化を諦めて mutable 変数のままにしがちだと思う。

### その他一括

- `Member { is_markdown, is_svg, meta, doc }` → `body : MemberBody`（`Markdown(meta~, doc~) | Svg | Text`）。Markdown でないメンバーの `meta`/`doc` にダミー値を入れる必要がなくなった
- `Alert(kind~ : String)` → `AlertKind`（5 variant）。`_ => "Caution"` だったタイトル解決が網羅 match になり、6つ目の variant が増えたらコンパイルで気づける
- `collection : String` → `Collection { Posts; Slops }`。名前はパス生成の境界で `name()` する
- `PageMeta` の `url == ""` で OGP 無効 → `og : Og?`（`OgType { Website; Article }`）
- `prev`/`next`、`NavItem.href`、`CodeBlock.info`、`Details.summary`、`Footnotes.scope` → `String?`
- JS ブリッジと wasm-pair の出力も `ItemList` に合わせた（`kind`/`start` はリスト側、`children` は `null` 可）

## 過剰適用しないと決めたもの

基準に当てはまっても変えなかった、または変えない方がよいと判断したもの。ここを線引きしないと「全部 enum 化」という別の極端になる。

- 見出しの `level : Int32`（1..5）。enum にすると5 variant の単なる写しで、`Section` の構築側で変換コードが増えるだけ。範囲チェックは既にパーサがやっている
- `Request::param` が無いワイルドカードに `""` を返す。ルータが存在を保証した上で呼ぶ API で、Go の `r.PathValue` の慣用句でもある。`String?` にすると全呼び出し側に unwrap が増える割に得るものが薄い
- `Status` の `status_text` で未知のコードに `""` を返す。外部向けの表示用文字列で、ドメインの状態ではない
- `content.mbt` の `rank.unwrap_or(-1)`。`-1` は「order が無い記事は末尾に寄せる」ためのソート用の値で、状態ではない
- `Details` 内の `in_code : Bool`（payload 内に残した）。真の2値トグルで、別状態と組み合わさることはない。Bool を2つ並べて4状態を手で守る話とは別
- `wire.mbt` の `in_env : Bool`、`el` の `LineWriter.at_line_start`。同じく素直な2値
- `resolver(repo_files~ : Bool)`。GitHub へのフォールバックを切るかどうかの ON/OFF。名前付き引数で読み方が決まっている
- `router` の `Route.subtree : Bool`。型のフィールドの中のフラグではあるが、「subtree のときだけ意味を持つフィールド」が存在しない。`Exact | Subtree` の variant にしても命名が明瞭になるだけで、新たに守れる不変条件は増えない。フラグと状態固有のフィールド群が揃って初めて sum type 化の利になる
- `Post.members`/`Doc.members`。空配列が「単一ファイル」を表しているが、コレクションの空はパターンマッチ（`is [face, ..]` / `is []`）で素直に書ける。`Option` が要るのは `ItemList` のように「空を作るには必須フィールドの値を捏造しないといけない」型だけ。一度 `Array[Member]?` にしてみて（[#165](https://github.com/podhmo/html-sandbox/pull/165)）、この線引きで見送った

空文字列や `-1` が「無い」の意味でなく、値としての意味を持つなら残す。「`== ""` がある = 悪い」ではなく、「`""` が欠落を表していて呼び出し側がそれを再解釈しているか」が判断点だった。

## 実装中の気づき

- wasm-pair の HTML 側は `<ol>` を一度も描いていなかった。 ワイヤ形式が `num` を無視していたので全リストが `<ul>` になっていた。`kind`/`start` を型に乗せたら実験側に順序付きリストがタダで付いてきた。型の欠陥が潜在バグを隠していた例
- `Member::markdown() -> (meta, doc)?` で非 Markdown face が明示に。 これまでは空 `meta` + `parse("")` のフィールドを「face が Markdown でない」意味に使っていた
- `#derive` 移行が差分に混じった。 現行ツールチェーンの `moon fmt` が `derive(...)` を `#derive(...)` に書き換えるので、触っていないファイルもフォーマットされた。`moon fmt --check` が要求するので維持し、別コミットに分けた

## 検証

`make check` 相当はすべてグリーン（native + js ターゲットの112テスト、`moon fmt --check`、wasm-gc/native 両ターゲットの `moon check`、experiments、`.mbti` 再生成、`preview.wasm` 再ビルド）。Go 実装との振る舞い一致は `make compare` で、デフォルト12パスに番号付きリスト・バンドルメンバー・svg フェンス・`<details>`・脚注を含む追加パスを足して 0 差分。`<ol start>` の出力も Go 側と一致した。

## issue の範囲外で見つかった候補

依頼の延長で `moonbit/` 全体を走査した。基準に照らして残っていたものと、その後の対応（#160 の上に積んだ stacked PRs #161-#164。同じ一覧を TODO.md のタスクとしても管理）。

| 場所 | 形 | 結果 |
| ---- | --- | --- |
| `links.mbt` の `Ref` | 無い `scheme`/`query`/`fragment` を `""` で保持 | `String?`（[#161](https://github.com/podhmo/html-sandbox/pull/161)） |
| `nav.mbt` の `page_title` | 「サイトのページでない」に `""` を返し、呼び出し側が `"" =>` で分岐 | `String?`（[#163](https://github.com/podhmo/html-sandbox/pull/163)） |
| `views.mbt` の `PageMeta.title` | `""` が「トップページ=タイトル無し」で、`document_title`/`ogp` が `== ""` を再判定 | `String?`（#163） |
| worker 系の `base_url` + `site` | 「未ロード/ロード済み」を2つの `Ref` の同期で表現（worker.mbt、adapter-abi 各種） | `Unloaded \| Loaded` の enum に畳んだ（[#164](https://github.com/podhmo/html-sandbox/pull/164)） |
| `inline.mbt` の `closing_run` | 「見つからない」に `-1` を返す | `Int32?`（[#162](https://github.com/podhmo/html-sandbox/pull/162)） |
| `tinymarkdown.mbt` の `nest_items(parent=-1)` | 「親なし」に `-1`（今回のリファクタで残った） | `Int32?`（#162） |
| `content.mbt` の `Doc.members` | 空配列が「単一ファイル」、非空なら先頭が bundle の face | 見送り（上の線引き参照） |

逆に `pkg/el`（`Node`/`Tag`/`AttrName`）、`pkg/http`（`Body` enum、`Headers::get` の `String?`、`router` の `Segment` enum）、`tinyfrontmatter` は元から enum/Option を使えていて触るものがなかった。

## まとめ

Go と MoonBit が揃えるべきなのは振る舞いで、型の形は言語ごとに自然なものでよい。今回の変更は「Go の struct + sentinel をそのまま写していた」状態を「MoonBit の enum + Option で不変条件を型にする」方向に寄せたもので、規模としては AST・スキャナ・サイトモデル・JS ブリッジまで広かったが、やっていることは基準の機械的な適用だった。線引きの表を先に作っておいたおかげで「変えたもの」「変えなかったもの」の両方に一貫性を持たせられたと思う。
