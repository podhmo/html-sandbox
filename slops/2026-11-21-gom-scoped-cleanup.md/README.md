---
title: Gom に defer を入れずに、defer が解いていた問題を解く — Scope の設計・実装・見つかったこと
description: Go の defer は何を解いているのかを Go 標準ライブラリで数え、Gom ではそれを明示的なスコープハンドル Scope として解いた。インタビューで決めた論点、静的な脱出検査とその修飾 @noescape、生成 Go をネイティブの defer に落とす最適化、実装とレビューで見つかった穴、まだ足りないものをまとめる。
prev: ../2026-11-21-ghost-function-in-report.md
---

# Gom に defer を入れずに、defer が解いていた問題を解く

> [!NOTE]
> 執筆: Devin。調査・設計の聞き取り・実装・レビュー対応を 1 つのDevinセッションで行い、その記録から書いた。図版 2 点もDevinが `tools/svg-gen` で生成した模式図で、計測値ではない。対象の PR は podhmo がマージする前提で、マージ済みとして書いている。

## 何をしたか

[podhmo/gom](https://github.com/podhmo/gom) は Go へトランスパイルする式指向の関数型言語である。依頼はこうだった。「gom に defer に類する機能を追加したい。これは gom に go の defer を導入するということではなく、go が defer により解いていた問題を解くという話をしている」。

依頼には 2 つの注文が付いていた。

- `if` の中の defer は、高階関数のローンパターンでは対応しづらいはずだ
- named return と defer を組み合わせた Go の副作用的な振る舞いはキモい。ただ、それでしか対応できないケースがある。Gom の流儀で書けるようにしたい（変換後の Go に named return と defer が現れるのは構わない）

作業は 5 つの PR に分かれた。

| PR | 内容 |
| --- | --- |
| [#90](https://github.com/podhmo/gom/pull/90) | 実験。Go 標準ライブラリの defer の集計と、候補 (A)〜(E) の試作 |
| [#91](https://github.com/podhmo/gom/pull/91) | SC-1。組み込みの `Scope` 型と、ランタイムのスタックで動く `Scope` モジュール |
| [#93](https://github.com/podhmo/gom/pull/93) | SC-2。`Scope` の値が外へ逃げないことの静的検査（E0418）と、`.gomi` の `@noescape(f)` |
| [#94](https://github.com/podhmo/gom/pull/94) | SC-3。同じ Go 関数内の登録を、生成 Go のネイティブの `defer` に落とす |
| [#96](https://github.com/podhmo/gom/pull/96) | 実装中に見つけた、関数型で具体化した多相の組み込み関数の生成 Go の不具合の修正 |

利用者が書くものは最終的にこうなった。

```gom
fn work (need: Bool) -> Result Int GoError =
  Scope.run_result <| fn s -> {
    Scope.defer s (fn () -> say "always")
    if need { Scope.on_err s (fn () -> say "rollback") }
    Scope.defer_err s (fn () -> Ok ())
    Ok 1
  }
```

`Scope.run_result` がスコープを開き、ラムダの引数 `s` がそのスコープのハンドルになる。`if` の中で登録した `on_err` も、`if` を抜けた時点ではなく本体の終わりで走る。

## Go の defer は何を解いているのか

最初に、Go 1.27 の `$GOROOT/src`（テスト以外）の defer を AST で分類した。

| 分類 | 件数 |
| --- | ---: |
| defer 文 | 1876 |
| 関数のトップレベルにあるもの | 1423 (75.9%) |
| `if` の中にあるもの | 381 (20.3%) |
| そのうち、登録が分岐の外まで生きるもの | 360 |
| 2 個以上の defer を持つ関数 | 224 |
| defer される closure が named result を読む | 64 |
| defer される closure が named result を書く | 61 |
| closure の中で `recover` するもの | 72 |

named result の読み書きは識別子の綴りで数えた。同名の局所変数に隠された場合も数えているので、64 と 61 は上限値である。

集計から、解くべき問題を 9 つに分けた。

| # | 問題 | Go での形 |
| --- | --- | --- |
| P1 | 取得したものを全出口で、逆順に解放する | `defer f.Close()` |
| P2 | 条件付きで取得し、分岐の外まで持つ | `if c { mu.Lock(); defer mu.Unlock() }` |
| P3 | 可変状態を一時的に変えて戻す | `defer func() { x.f = old }()` |
| P4 | 反復ごとの寿命 | ループ内の `defer cancel()`（実際は関数の終わりまで溜まる） |
| P5 | cleanup の失敗を結果へ合流する | closure が named `err` を書く |
| P6 | 失敗したときだけ巻き戻す | closure が named `err` を読む |
| P7 | panic でも cleanup を走らせる | defer 全般 |
| P8 | panic を捕まえて error にする | `recover` |
| P9 | 出口で結果を観測・加工する | named result を読む・包み直す |

P8 は、Gom の仕様が recover を提供しないので対象外にした。残りの 8 つが対応すべき範囲である。

## if の中の defer と、候補の比較

依頼の言うとおり、P2 が設計を分けた。`if` の中で取得して登録したものは、`if` を抜けても生きていなければならない。Go の defer は関数単位で溜まるので、これが自然に書ける。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -25 846.5 345" width="847" height="345" role="img" aria-label="three bars over program order: a block-scoped defer closes f when the if ends, before it is used; Go's function-scoped defer keeps it until the function ends; Scope.run keeps it until the explicit scope body ends">
<text x="0" y="0" font-size="15" fill="currentColor">if の中で開いた f はいつ閉じられるか</text>
<text x="0" y="20" font-size="11" fill="currentColor" opacity="0.65">横軸はプログラムの実行順。帯は f が開いている区間（模式図）</text>
<path d="M170 60 L170 310" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 4" opacity="0.35"/>
<text x="170" y="46" font-size="11" text-anchor="middle" fill="currentColor">関数の</text>
<text x="170" y="60" font-size="11" text-anchor="middle" fill="currentColor">はじめ</text>
<path d="M290 60 L290 310" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 4" opacity="0.35"/>
<text x="290" y="46" font-size="11" text-anchor="middle" fill="currentColor">if c {</text>
<text x="290" y="60" font-size="11" text-anchor="middle" fill="currentColor">f を開く</text>
<path d="M420 60 L420 310" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 4" opacity="0.35"/>
<text x="420" y="46" font-size="11" text-anchor="middle" fill="currentColor">if を</text>
<text x="420" y="60" font-size="11" text-anchor="middle" fill="currentColor">抜ける</text>
<path d="M550 60 L550 310" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 4" opacity="0.35"/>
<text x="550" y="46" font-size="11" text-anchor="middle" fill="currentColor">f を</text>
<text x="550" y="60" font-size="11" text-anchor="middle" fill="currentColor">使う</text>
<path d="M680 60 L680 310" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 4" opacity="0.35"/>
<text x="680" y="46" font-size="11" text-anchor="middle" fill="currentColor">Scope の</text>
<text x="680" y="60" font-size="11" text-anchor="middle" fill="currentColor">終わり</text>
<path d="M810 60 L810 310" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 4" opacity="0.35"/>
<text x="810" y="46" font-size="11" text-anchor="middle" fill="currentColor">関数の</text>
<text x="810" y="60" font-size="11" text-anchor="middle" fill="currentColor">終わり</text>
<text x="150" y="94" font-size="12" text-anchor="end" fill="currentColor">(B) ブロック末尾</text>
<text x="150" y="110" font-size="11" text-anchor="end" fill="currentColor" opacity="0.75">で走る defer</text>
<rect x="290" y="91" width="130" height="18" rx="4" fill="#D55E00" fill-opacity="0.45" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="5 3"/>
<text x="550" y="101" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">閉じた後に使う</text>
<path d="M504 112 L596 112" fill="none" stroke="#D55E00" stroke-width="2"/>
<text x="150" y="164" font-size="12" text-anchor="end" fill="currentColor">(C) Go の defer</text>
<text x="150" y="180" font-size="11" text-anchor="end" fill="currentColor" opacity="0.75">（関数スコープ）</text>
<rect x="290" y="161" width="520" height="18" rx="4" fill="#3B82C4" fill-opacity="0.45" stroke="#3B82C4" stroke-width="1.5"/>
<text x="150" y="234" font-size="12" text-anchor="end" fill="currentColor">(E) Scope.run</text>
<text x="150" y="250" font-size="11" text-anchor="end" fill="currentColor" opacity="0.75">（明示的な境界）</text>
<rect x="290" y="231" width="390" height="18" rx="4" fill="#00A876" fill-opacity="0.45" stroke="#00A876" stroke-width="1.5"/>
<path d="M210 266 L680 266" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M210 261 L210 271" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M680 261 L680 271" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="445" y="282" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.8">Scope.run &lt;| fn s -&gt; { ... } の本体</text>
</svg>
```

試作した候補は 5 つあった。

| 案 | 結果 |
| --- | --- |
| (A) 今日の Gom で書くローンパターン | `if` の中で取得すると、残りの処理を両方の枝へ渡す形になる。panic するとロックが漏れることもテストで確かめた |
| (B) ブロックの終わりで走る defer | 図の一番上の帯。`if` を抜けた時点で閉じてしまう。集計の 360 件がこれに当たる |
| (C) Go と同じ関数単位の defer | ラムダや末尾呼び出しのループ化で、関数の境界が暗黙に動く。named result も利用者に見えてしまう |
| (D) 明示的なスコープハンドル `with_scope (fn s -> ...)` | 当時のコンパイラのままで動いた。`if` の中からも登録できる |
| (E) (D) をコンパイラ組み込みにする | 採用した案 |

(D) と (E) の要点は、スコープの境界を関数ではなく値として明示することである。登録先がハンドル `s` なので、`if` の中・`match` の枝・ループの中のどこから登録しても、行き先はスコープの終わりになる。境界はラムダの終わりなので、Gom のラムダや末尾呼び出しの変換で動くこともない。

## named return + defer の「キモさ」への答え

Go で named result を defer が書き換えるのは、関数の出口が複数あり、どの出口でも結果を加工したいからである。Gom は式指向で、`try` の脱出先もスコープの本体ラムダの境界になる。スコープ全体が 1 つの式なので、出口は 1 つにまとまる。

そのため P9 の結果の加工は、スコープの外で `|> Result.map_err ...` と書けば済む。cleanup の側から結果に触る必要が残るのは、P5 の close エラーの合流と P6 の rollback の 2 つだけだった。この 2 つを `defer_err` と `on_err` が受け持つ。named result と defer は、生成 Go の中にだけ出てくる。

## インタビューで決めたこと

podhmo は (E) を選んだ。残りの論点については、背景と代替案を付けた確認を 1 問ずつ求めた。結果は次のとおり。

| 問い | 決定 | 退けた案と理由 |
| --- | --- | --- |
| cleanup が失敗したときの結果 | 本体の Err を優先し、cleanup 同士は実行順に `errors.Join` | 最初のエラーだけ残す案は、後の失敗が消える。全部を Join する案は、主原因が埋もれる |
| `GoError` 以外のエラー型での合流 | `defer_err` は `GoError` に限る | 結合関数を受け取る版は future work。型クラスは不採用なので、辞書を明示的に渡す API になる |
| `on_err` を panic でも走らせるか | 走らせる。問題が出たら把握して見直す | 走らせない案は、panic の後に tx が開いたまま残る |
| `s` が外へ逃げることの扱い | 静的に「逃げない値」として制限する | 実行時検査だけの案は、誤りが実行するまで分からない |
| 逃げないことの判定 | 同じパッケージ内は推論し、`.gomi` の境界だけ注釈する。Go の関数は常に逃げる扱い | 全部に注釈を書かせる案は手間が大きい。許可リスト案は、自作の高階関数に渡せない |
| 綴り | 関数と module API だけ。糖衣は困ってから | Go の struct literal 対応と同じ扱い |
| `.gomi` の注釈の書き方 | 宣言に付ける属性 `@noescape(f)` | 引数の型に付ける印は、型の文法が増える |

## なぜ修飾が必要になるのか

`s` は普通の値なので、返したり、record に入れたり、`Task.spawn` するラムダに捕まえさせたりできてしまう。スコープが閉じた後に `Scope.defer s ...` を呼んでも、その cleanup を走らせる者はいない。SC-1 のランタイムは、閉じた後の登録を panic にしている。それを型検査の段階で拒否するのが、SC-2 の E0418 である。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -25 713.3999999999999 403.2" width="713" height="403" role="img" aria-label="a dashed region for the Scope.run body holds the accepted uses of s (registration, passing to a helper, a non-escaping List.iter lambda, an immediate call, an eager argument); arrows cross its edge to the rejected uses (returning s, storing it, Task.spawn, an outer cleanup capturing it, a partial application holding it)">
<text x="0" y="0" font-size="15" fill="currentColor">Scope のハンドル s が行ってよい場所</text>
<text x="0" y="20" font-size="11" fill="currentColor" opacity="0.65">破線の枠が Scope.run の本体。枠の外へ s を運ぶものは E0418</text>
<rect x="0" y="44" width="330" height="300" rx="8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="6 4"/>
<text x="14" y="66" font-size="12" fill="currentColor">Scope.run &lt;| fn s -&gt; { ... }</text>
<rect x="20" y="92" width="216.7999999999999" height="36" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="128.39999999999995" y="110" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">Scope.defer s (fn () -&gt; ...)</text>
<rect x="20" y="142" width="98" height="36" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="69" y="160" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">helper s r</text>
<rect x="20" y="192" width="243.19999999999987" height="36" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="141.59999999999994" y="210" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">List.iter (fn x -&gt; ... s ...) xs</text>
<rect x="20" y="242" width="183.79999999999993" height="36" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="111.89999999999996" y="260" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">(fn () -&gt; ... s ...) ()</text>
<rect x="20" y="292" width="111.19999999999999" height="36" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="75.6" y="310" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">add (read s)</text>
<rect x="440" y="78" width="84.80000000000001" height="36" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="4 3"/>
<text x="482.4" y="96" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">return s</text>
<path d="M303 96 L437 96" fill="none" stroke="#D55E00" stroke-width="1.5"/><path d="M428 100.05 L437 96 L428 91.95" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<rect x="440" y="134" width="177.19999999999993" height="36" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="4 3"/>
<text x="528.5999999999999" y="152" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">{ scope = s } / Some s</text>
<path d="M303 152 L437 152" fill="none" stroke="#D55E00" stroke-width="1.5"/><path d="M428 156.05 L437 152 L428 147.95" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<rect x="440" y="190" width="236.59999999999988" height="36" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="4 3"/>
<text x="558.3" y="208" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">Task.spawn (fn () -&gt; ... s ...)</text>
<path d="M303 208 L437 208" fill="none" stroke="#D55E00" stroke-width="1.5"/><path d="M428 212.05 L437 208 L428 203.95" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<rect x="440" y="246" width="253.39999999999992" height="36" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="4 3"/>
<text x="566.6999999999999" y="264" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">外側の Scope の cleanup が s を捕捉</text>
<path d="M303 264 L437 264" fill="none" stroke="#D55E00" stroke-width="1.5"/><path d="M428 268.05 L437 264 L428 259.95" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<rect x="440" y="302" width="186.2" height="36" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="4 3"/>
<text x="533.1" y="320" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">reg s（s を持つ部分適用）</text>
<path d="M303 320 L437 320" fill="none" stroke="#D55E00" stroke-width="1.5"/><path d="M428 324.05 L437 320 L428 315.95" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="344" y="366" font-size="11" fill="currentColor" opacity="0.75">枠を越える矢印 = Scope が閉じた後まで s が残る</text>
</svg>
```

ただし、捕捉そのものは禁止できない。`List.iter (fn x -> ... s ...)` のように、その場で呼ばれて外へ残らないラムダから登録できることが、(D)/(E) を選んだ理由だからである。そこで「受け取ったラムダを保存も返却もしない引数」を見分ける必要が出てくる。これが修飾の正体である。

- 同じパッケージの `fn` は、本体から推論する。関数型の引数をすべて「逃げない」候補にし、逃げる使い方をした引数を外していく。変化がなくなるまで繰り返すので、再帰や相互再帰でも推論できる（最大不動点）。
- パッケージの外は本体が見えない。そこで `.gomi` に `@noescape(f)` と書いて約束させる。実装側の推論がその約束を守っていなければ E0608、存在しない引数名なら E0419 になる。`gom info` は推論結果を下書きに出す。
- Go の関数は本体を解析できないので、常に「逃げる」扱いにした。

```gomi
@noescape(f)
fn iter (f: a -> Unit) (xs: List a) -> Unit
```

標準ライブラリの `List.iter`・`map`・`fold` などにも、この属性を付けた。

綴りにもう 1 つ修飾が増えた。Gom の型はメソッドを持たないので、実験の `s.Defer f` ではなく、モジュールで修飾した `Scope.defer s f` と書く。

## 実装中に新たに分かったこと

実装と自動レビュー（Devin Review）の往復で、最初の設計にはなかった規則がいくつも増えた。

| 見つかったこと | どう対応したか |
| --- | --- |
| cleanup のラムダは、登録した呼び出しより後（スコープが閉じるとき）に走る。外側のスコープの cleanup が内側の `s` を捕まえると、内側が閉じた後に登録が起きる | 一度は「逃げない」と印を付けた cleanup の引数を、「逃げる」扱いに直した。逃げないのは `run` / `run_result` の本体だけである |
| 部分適用 `reg s` は、ラムダと同じく `s` を持ち続ける。`reg (if c { s } else { s })` のように計算した `s` も同じ | 未飽和の部分適用が `Scope` を持つときは、捕捉と同じ規則で扱う。一方 `add (read s)` の引数はその場で評価されて `Int` しか残らないので許す |
| パイプでコンストラクタへ渡すと、引数の検査をすり抜けた | `Scope` を含む型のフィールドを、`type` 宣言の時点で拒否する |
| `later (x: a) ...` のような多相関数は、型に現れない形で `s` を持てる | 多相関数の型引数に `Scope` を入れること自体を拒否する |
| パッケージが独自の `Scope` 型を宣言すると、推論ごと止まり、無関係な `@noescape` が E0608 になった | 推論は続け、組み込みの `Scope` に関する報告だけを止める |
| SC-3 で、`on_err` を持つ素の `Scope.run` の本体を `try` が抜けると、「完了したか」のフラグが失敗と読み違える | その形はネイティブの `defer` に落とさず、ランタイムのスタックに残す |
| `Scope.on_err s j.undo` のように cleanup をフィールドから読むと、ネイティブ版では読む時点がスコープの終わりにずれた | 登録の時点で一時変数に束縛してから `defer` する |
| Core IR にノードを 1 つ足すと、全列挙の型 switch のすべてに case が要る。`go build` では気づけない | `make check-sumtype` で漏れを洗い出した |

SC-3 が出す生成 Go は、実験で手書きした目標形とほぼ同じになった。`on_err` か `defer_err` があるときだけ named result が出る。下は生成 Go から骨組みだけを抜き出し、コメントを足したものである。

```go
tmp := func(_ struct{}) (res result.Result[int64, error]) {
	done := false
	var cerrs []error
	defer func() { result.ScopeFold(&res, cerrs) }() // 最後に走り、cleanup のエラーを Ok に合流
	defer tmp1(struct{}{})                           // Scope.defer
	if c {
		defer func() {
			if !done || !res.IsOk() { tmp2(struct{}{}) } // Scope.on_err
		}()
	}
	defer func() { cerrs = result.ScopeCollect(cerrs, tmp3(struct{}{})) }() // Scope.defer_err
	// ...
	res = result.Ok[int64, error](tmp5)
	done = true
	return res
}
```

ネイティブに落とせるのは、`s` が登録の第 1 引数としてだけ使われ、しかも登録が本体と同じ Go 関数内（`if` / `match` の枝やループを含む）にある場合である。`s` を helper に渡すなど、それ以外の本体はランタイムのスタックで動く。同じシナリオを両方の経路で実行し、出力が一致することをテストで確かめている。

### 途中で見つかった別の穴

SC-2 のテストを足している途中で、関数型の値を返す `Scope.run` の生成 Go がコンパイルできないと分かった。

```gom
fn f () -> Int -> Int = Scope.run (fn s -> add 1)
```

調べると、Scope 固有の問題ではなかった。`Task.spawn` も同じように壊れる。Go 側で実装した多相の組み込み関数で、型変数を関数型で具体化すると壊れるのである。原因は、組み込み関数の宣言側の引数の型が lowering に渡っていなかったことだった。具体化後の `Scope -> Int -> Int` から、コールバックを 2 引数と数えていた。[PR #96](https://github.com/podhmo/gom/pull/96) で、宣言側の型から数えるように直した。

生成 Go がビルドできるかを確かめる仕組みは、もともとあった。テストの fixture をすべて種にする `FuzzCompile` が、生成 Go を `go/types` で型検査している。すり抜けたのは、型変数を関数型で具体化する fixture が 1 つもなかったからである。fixture を足した今は、同じ壊れ方をすれば落ちる。もっと手前で止める仕組み（Core IR の検証器が、Go に渡すコールバックの形を Go 側の宣言と照合する）は、podhmo の判断で future work に入れた。

## Gom にまだ足りないもの

- recover がない。そのため、panic のときに `on_err` が走ることには実行テストがない。生成 Go の完了フラグの作りで扱っているだけである
- `defer_err` は `GoError` に限られる。独自のエラー型で cleanup のエラーを合流するには、結合関数を受け取る API が要る（future work）
- 取得と登録を 1 行で書く糖衣がない。`let f = try (os.Open p) |> s.closing` のような形は、困ってから考えることになっている
- Go の関数は常に「逃げる」扱いなので、`s` を捕まえたラムダを Go の高階関数には渡せない。Go 側に注釈を書く手段はない
- ネイティブの `defer` に落ちるのは、上に書いた形の本体だけである。`s` を helper に渡す本体は、ランタイムのスタックのまま動く
- Go に渡すコールバックの形を Core IR の段階で検査する仕組みは future work である

## 例を足すなら

この機能を説明する例には、P1・P5・P6 が 1 つの関数にそろう「一時ファイル経由のコピー」が良いと考えた。下のコードは `gom run` で実際に動かし、`copied` と出ることを確かめた。生成 Go には `defer` が 3 つ出る。

```gom
package main

import go "fmt"
import go "os"

fn say (m: String) -> Unit = ignore (fmt.Println m)

// Copy src to dst through a temporary file: the temp file is removed
// when anything fails, both files are closed on every exit, and a
// failing Close of the written file turns an Ok into an Err.
fn copy_file (src: String) (dst: String) -> Result Unit GoError =
  Scope.run_result <| fn s -> {
    let data = try os.ReadFile(src)
    let tmp = "${dst}.tmp"
    let w = try os.Create(tmp)
    Scope.on_err s (fn () -> ignore (os.Remove(tmp)))
    Scope.defer_err s (fn () -> w.Close())
    let _ = try w.Write(data)
    try os.Rename(tmp, dst)
    Ok ()
  }

fn main () -> Unit = match copy_file "main.gom" "copy.out" {
  Ok _ -> say "copied"
  Err e -> say "failed: ${e}"
}
```

この 1 本から、次のことが読み取れる。

- `try` で途中から抜けても、`w` は閉じられる（P1）
- `w.Close()` の失敗が、Ok だった結果を Err に変える（P5）
- 失敗したときだけ一時ファイルを消す（P6）

例を増やすなら、残りの問題を 1 つずつ見せるのが良い。

- 条件付きのロック。`if need { mu.Lock(); Scope.defer s (fn () -> mu.Unlock()) }` で、P2 の形をそのまま見せる
- ファイル一覧の処理。反復ごとに `Scope.run_result` を開き、各ファイルがその反復の終わりで閉じることを見せる（P4。Go のループ内 defer は関数の終わりまで溜まるので、Go との違いが出る）
- 逃げる例を並べて E0418 を見せる。`return s`、`Task.spawn` に渡すラムダ、外側の cleanup が内側の `s` を捕まえる例
