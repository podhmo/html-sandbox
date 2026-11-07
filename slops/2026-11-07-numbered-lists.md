---
title: 耐えかねて番号付きリストを実装した
description: tinymarkdown で N. の番号付きリストを許可した記録。/preview 用の文書を他の AI に書かせると、禁止を指定しても番号付きリストを出力してくるので、parser 側で受け入れることにした。Go と MoonBit 両方の実装・描画の変更と検証の結果。次は * の強調を直す normalizer の予定。
prev: 2026-11-07-delaunay-voronoi.md
---

# 耐えかねて番号付きリストを実装した

> [!NOTE]
> 執筆: Devin。

## 依頼と前提

[issue #141](https://github.com/podhmo/html-sandbox/issues/141)「tinymarkdownで番号付きリストを許可する」（本文は空）を TODO.md に追加しつつ実装してほしい、という依頼。あわせて、write-slops のスキルなど tinymarkdown を説明している場所で「番号付きリストに頼らない」としていた指定を解除してほしい、ともあった。

issue に書かれていない理由を途中で教えてもらった。`/preview` に貼る文書を他の AI に「tinymarkdown で扱える範囲で出力して」と依頼しても、番号付きリストを出力しがちだから。プロンプトの指定を強めるのではなく、parser 側で受け入れる方針を取った。同じ確認の流れで「go/moonbit 両方実装する」とも明示された。

前提として、tinymarkdown の実装は Go（`go/pkg/tinymarkdown`）と MoonBit（`moonbit/pkg/tinymarkdown`）の二つある。描画はブログの Go 側 `views.go` と MoonBit 側 `views.mbt` が持ち、`/preview` は MoonBit 製の wasm（`go/examples/blog/internal/site/assets/preview.wasm`、コミット対象）を使う。既存の posts と slops には `1. ` で始まる行が多数あり、それらは段落として出ていた。実装すれば `<ol>` に変わるが、それが目的の効果なので回帰ではないと判断した。

## やったこと

### 設計: Item に番号を持たせる

`Item` に `Num`（MoonBit 側は `num`）を足す形にした。`- ` と `* ` の項目は 0、`N. ` の項目はその番号が入る。描画はリストの先頭項目が `Num > 0` なら `<ol>` にし、先頭の番号が 1 でなければ `start` 属性を付ける。途中の項目の番号はパース結果には残るが、HTML の番号づけには使わない（`<li>` が連番になるのは HTML の側）。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="6 6 403.8 300.8" width="404" height="301" role="img" aria-label="a list run's first item marker picks &lt;ol&gt; or &lt;ul&gt;; later markers only tag their own li">
<circle cx="16" cy="24" r="4.5" fill="#3B82C4"/>
<text x="28" y="28" font-size="12" fill="currentColor">"N. " (num &gt; 0)</text>
<circle cx="170" cy="24" r="4.5" fill="#E69F00"/>
<text x="182" y="28" font-size="12" fill="currentColor">"- " / "* " (num = 0)</text>
<circle cx="16" cy="66" r="4.5" fill="#3B82C4"/>
<text x="30" y="70" font-size="14" fill="currentColor">3. c</text>
<text x="110" y="70" font-size="12" fill="currentColor" opacity="0.7">num=3</text>
<circle cx="16" cy="88" r="4.5" fill="#3B82C4"/>
<text x="30" y="92" font-size="14" fill="currentColor">4. d</text>
<text x="110" y="92" font-size="12" fill="currentColor" opacity="0.7">num=4</text>
<rect x="260" y="54" width="139.8" height="34" rx="8" fill="none" stroke="#3B82C4" stroke-width="2"/>
<text x="329.9" y="71" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">&lt;ol start="3"&gt;</text>
<path d="M155.9957201845184 66.18498704557956 L254.0064197232224 70.72251943163067" fill="none" stroke="#3B82C4" stroke-width="2"/><path d="M244.82874992440668 74.35196526590154 L254.0064197232224 70.72251943163067 L245.2033486917053 66.2606318922518" fill="none" stroke="#3B82C4" stroke-width="2"/>
<circle cx="16" cy="146" r="4.5" fill="#3B82C4"/>
<text x="30" y="150" font-size="14" fill="currentColor">1. x</text>
<text x="110" y="150" font-size="12" fill="currentColor" opacity="0.7">num=1</text>
<circle cx="16" cy="168" r="4.5" fill="#E69F00"/>
<text x="30" y="172" font-size="14" fill="currentColor">- y</text>
<text x="110" y="172" font-size="12" fill="currentColor" opacity="0.7">num=0</text>
<circle cx="16" cy="190" r="4.5" fill="#E69F00"/>
<text x="30" y="194" font-size="14" fill="currentColor">- z</text>
<text x="110" y="194" font-size="12" fill="currentColor" opacity="0.7">num=0</text>
<rect x="260" y="134" width="62.800000000000004" height="34" rx="8" fill="none" stroke="#3B82C4" stroke-width="2"/>
<text x="291.4" y="151" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">&lt;ol&gt;</text>
<path d="M155.9957201845184 146.18498704557956 L254.0064197232224 150.72251943163067" fill="none" stroke="#3B82C4" stroke-width="2"/><path d="M244.82874992440668 154.35196526590155 L254.0064197232224 150.72251943163067 L245.2033486917053 146.26063189225178" fill="none" stroke="#3B82C4" stroke-width="2"/>
<circle cx="16" cy="246" r="4.5" fill="#E69F00"/>
<text x="30" y="250" font-size="14" fill="currentColor">- x</text>
<text x="110" y="250" font-size="12" fill="currentColor" opacity="0.7">num=0</text>
<circle cx="16" cy="268" r="4.5" fill="#3B82C4"/>
<text x="30" y="272" font-size="14" fill="currentColor">1. y</text>
<text x="110" y="272" font-size="12" fill="currentColor" opacity="0.7">num=1</text>
<circle cx="16" cy="290" r="4.5" fill="#E69F00"/>
<text x="30" y="294" font-size="14" fill="currentColor">- z</text>
<text x="110" y="294" font-size="12" fill="currentColor" opacity="0.7">num=0</text>
<rect x="260" y="234" width="62.800000000000004" height="34" rx="8" fill="none" stroke="#E69F00" stroke-width="2"/>
<text x="291.4" y="251" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">&lt;ul&gt;</text>
<path d="M155.9957201845184 246.18498704557956 L254.0064197232224 250.72251943163067" fill="none" stroke="#E69F00" stroke-width="2"/><path d="M244.82874992440668 254.35196526590155 L254.0064197232224 250.72251943163067 L245.2033486917053 246.26063189225178" fill="none" stroke="#3B82C4" stroke-width="2"/>
</svg>
```

色は palette のオプション（svg-gen の colorful）で、点はマーカーの種類、枠と矢印は決めた側の項目の色を引き継ぐ。三番目の組がこのルールの効きどころで、`- ` が先頭なら途中に `1. ` があっても `<ul>` のまま、各項目は `<li>` になる。

### マーカーの規則

`- ` `* ` と同じ仕組みで `N. ` を受理する。桁数は CommonMark に合わせて最大 9。受け付けないのは次のもの。

- `0. `（0 は番号にならないので段落テキストのまま）
- `1.` のようにマーカーのあとに空白がないもの
- `1) `（今回は対象外。AI が書きがちなのは `1. ` の形なので）
- 10 桁以上

`007. ` のようなゼロ埋めは `num=7` として受理する。ネストは従来どおりインデントで決まり、マーカーの種類は問わない。継続行も従来どおり項目テキストの一部になる。

### 実装の順番

1. Go のパーサ。`- `/`* ` の判定を `listItem` という補助関数にまとめ、`N. ` の判定をそこに足した。`Item` と内部の `rawItem` に `Num`/`num` を足し、テストに番号付き・混在・ネスト・拒否ケースを追加。既存テストにあった `1. step` という行の期待値を段落からリストに直した
2. Go の描画。`renderList` で先頭の `Num > 0` なら `<ol>`（1 以外なら `start`）、子リストは再帰。`parse-markdown` のダンプは `item N "text"` と番号を出すようにした
3. MoonBit のパーサ。`Item` に `num: Int32`、`RawItem` に `num`、ジェネレートされるインターフェース `pkg.generated.mbti` を更新。テストも Go と同じ観点で追加
4. MoonBit の描画と連携。`render_list` を同じ規則に、JS ブリッジ `js.mbt` は `num` を JS オブジェクトに出し、wasm-pair と browser-render の experiments も追従
5. `preview.wasm` を `make -C go generate` で再生成。MoonBit 側の `embedded.mbt` はビルド時生成で gitignore 対象と分かり、コミット不要だった
6. 文書類。パッケージ doc（両言語）、`docs/sketch/ja/blog.md`、`parse-markdown/README.md` の記述を更新し、write-slops の SKILL.md・preview 用プロンプト・バンドル README から「番号付きリストに頼らない」の指定を外して `1. ` を許可と明記
7. TODO.md の #141 エントリを `[x]` に

途中の失敗で結果に効いたものはないが、あったものとして、edit の `old_string` が何度かずれてそのたびに現行ファイルを読み直したこと、テスト編集で関数シグネチャを一時的に消してしまったこと、MoonBit の JS スナップショットに `"num":0` が増えて一度落ちたこと、`site_test.mbt` の長い行で `moon fmt` を掛け直したことがある。

実装とは別に、`make -C go check` が `gofmt -l .` で失敗することを見つけた。原因は埋め込み記事の添付 `04-main.go`（`2026-10-30-pi-sarashina-dogfooding.md` のバンドル）の末尾空白で、今回の変更とは無関係の既存の問題だった。TODO.md に別エントリとして起票している。

## 依頼への答え

`N. ` のリストが Go・MoonBit 両方で `<ol>` として出るようになった（先頭が 1 以外なら `start` 付き）。混在・ネスト・引用内のリストも動き、`/preview` 側も `preview.wasm` の再生成で同じ振る舞いになった。write-slops 系の文書から番号付きリストの禁止は外れている。

検証は以下のとおり。

- `go test ./...` が全パッケージ pass。新規の `TestPostNumberedList` が `<ol><li>a</li>...` と `<ol start="3">` のネストを検査する
- `moon test` が 112/112 pass、`moon check` が wasm-gc・native の両方 pass
- `parse-markdown` の実出力で `item 1 "a"`、`item 2 "b"` と番号が出ることを確認

依頼で残っている部分はない。作業ツリーは未コミットのまま残っている。`make -C go check` は上の無関係な gofmt の問題で今も落ちる（別 TODO）。

## 余談

- この記事そのものがドッグフーディングになっていて、「実装の順番」の節は `1. ` で書いている。以前なら段落に潰れていたはずのものが、今は `<ol>` として出ているはず。
- 設計で別案としてあった `OrderedList` の型分離は、混在マーカーを一つのリストにまとめる既存の並び・ネスト構造をそのまま使えることと、`Item` がネストの単位であることから、`Num` を足す形に負けた。`Num` が 0 か正かで分岐するだけで型を増やさずに済むのも材料だった。
- `slops/2026-10-15-tinymarkdown.md` には「番号付きリストはない」という当時の仕様説明が残っている。日付付きの記録なので書き換えなかった。
- `1) ` を対象外にしたのは、動機が「AI が `1. ` を書きがち」という問題への対応で、`1) ` まで広げる必然がなかったから。CommonMark は `1) ` もリストなので、必要になれば足せる位置にはある。
- 記事の図を作っているときに、svg-gen の `check.ts` が `<text>` の中身を `&lt;` エスケープ後の文字数で幅を見積もっていて、`<ol>` ラベルが偽陽性で FAIL になった。デコードしてから測るように直した。
- 次は [issue #142](https://github.com/podhmo/html-sandbox/issues/142) の予定。`*` による強調をプロンプトで禁止する代わりに、gofmt のように通すだけで `*` を外す normalizer を作る話で、「禁止しても出てくるものを受け入れるか整形する」という方向は今回と同じ系統になる。
- 追記: 予告の normalizer は同日に [tools/slops-fmt](../tools/slops-fmt) として入った。`*` のランを CommonMark の flanking ルールで開閉判定し、同じ長さ同士でペアにして外す。中身が `<svg` で始まるラベルなしフェンスへの `svg` 補完も同じツールに入れた。「句読点に両側を挟まれた `*` はデリミタにしない」というルールを足したのが収穫で、これがないと `fig-*.ts` が 2 つ並んだだけの文から `*` が消える。意図的にラベルを外しておく反例は、フェンス本体の先頭行をコメントにして対象から外す形にした。slops/ 全体に流して `**` の残っていた 11 ファイルを直し、この記事自身も通してクリーンであることを確認した。
