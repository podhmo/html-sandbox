---
title: インタプリタの次に REPL（対話シェル）を作り、そのあとに補完機能を作った話
description: Go インタプリタ minigo に REPL の TAB 補完を実装した記録。「処理系があるなら補完は軽い仕事に見える」が正しいのは最初の数十行だけで、残りは文脈解釈・副作用ポリシー・Go 意味論の細部という地味な穴埋めだった。どこまでが簡単で、どこからが面倒で、処理系側に何が必要になったかを実装単位（stacked PR 9 本）で説明する。
prev: 2026-11-22-stacked-prs-merge-overnight.md
---

# インタプリタの次に REPL（対話シェル）を作り、そのあとに補完機能を作った話

> [!NOTE]
> 執筆: Devin。補完機能の設計・実装・実機検証まで同一セッションで実施。作業対象は [podhmo/minigo](https://github.com/podhmo/minigo)。成果は GitHub の stacked PR 9 本（[Stack #1409](https://github.com/podhmo/minigo/pull/1409)）と、別切り出しのガード 1 本（[#1415](https://github.com/podhmo/minigo/pull/1415)）。執筆時点で全 PR はレビュー待ちで、まだマージされていない。

## 前提: 処理系の次に「REPL」を作るとはどういうことか

REPL は Read-Eval-Print Loop の略で、一行読んで、評価して、結果を表示し、また読む、というループのこと。ただ実態としては「対話シェル」と呼ぶ方が近い。ループの中身はインタプリタ本体がすでに持っている評価器を呼ぶだけなので、処理系が出来上がったあとに REPL を作るというのは、評価の話というより UI と状態管理の話になる。

実際に必要になるものを並べると次の通り。

- 行入力の編集。端末を raw mode にして、カーソル移動・履歴・キー入力を自分で処理する。minigo は `term.MakeRaw` + `term.NewTerminal`（`x/term`）で組んでいて、TAB 補完もここにフックとして入る（`AutoCompleteCallback`）
- 宣言が蓄積する場所。`var x = 1` を打ったら次の行で `x` が見える必要がある。minigo は scratch package という一時パッケージを持ち、REPL の各行はそこへ宣言として積まれる
- 一行ずつの評価と結果表示。式なら値を、宣言なら登録だけして、エラーは潰さず表示する
- メタコマンド。`:help`、`:eval`、`:comp` のような言語外の操作。補完の確認用に `:comp <text>` という「TAB と同じ経路を通って候補を表示する」コマンドを今回足した

ここまでが REPL。TAB 補完はこの REPL の、行入力編集の部分にぶら下がる機能になる。

## 本題: 補完を作るとはどういうことか

TAB が押されたときにやること自体は単純で、カーソルより左のテキストを見て、末尾のトークンに続けられる名前の候補を返すだけだ。`strings.To` と打って TAB を押せば `ToLower` `ToUpper` `ToTitle` …と続く、あれ。

今回作ったものの内部はこういう流れになっている。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 358.50000000000006 486" width="359" height="486" role="img" aria-label="TAB completion pipeline: context scan, two base-resolution tiers, member enumeration, splice">
<rect x="170" y="0" width="124.95000000000002" height="56" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="232.47500000000002" y="19.549999999999997" font-size="13" text-anchor="middle" dominant-baseline="central" fill="currentColor">`strings.To`</text>
<text x="232.47500000000002" y="36.45" font-size="13" text-anchor="middle" dominant-baseline="central" fill="currentColor">line + cursor</text>
<rect x="170" y="82" width="139.25000000000003" height="56" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="239.625" y="101.55" font-size="13" text-anchor="middle" dominant-baseline="central" fill="currentColor">completeContext</text>
<text x="239.625" y="118.45" font-size="13" text-anchor="middle" dominant-baseline="central" fill="currentColor">scanner offsets</text>
<rect x="170" y="164" width="167.85000000000005" height="56" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="253.925" y="183.55" font-size="13" text-anchor="middle" dominant-baseline="central" fill="currentColor">resolveBase</text>
<text x="253.925" y="200.45" font-size="13" text-anchor="middle" dominant-baseline="central" fill="currentColor">what is left of `.`</text>
<rect x="10" y="92" width="140" height="36" rx="8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 3" opacity="0.85"/>
<text x="80" y="110" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.85">no candidates</text>
<rect x="0" y="246" width="124.95000000000002" height="56" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="62.47500000000001" y="265.55" font-size="13" text-anchor="middle" dominant-baseline="central" fill="currentColor">resolveExpr</text>
<text x="62.47500000000001" y="282.45" font-size="13" text-anchor="middle" dominant-baseline="central" fill="currentColor">AST walk only</text>
<rect x="184.95000000000002" y="246" width="153.55000000000004" height="56" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="261.725" y="265.55" font-size="13" text-anchor="middle" dominant-baseline="central" fill="currentColor">evalBase (opt-in)</text>
<text x="261.725" y="282.45" font-size="13" text-anchor="middle" dominant-baseline="central" fill="currentColor">EvalExpr + memo</text>
<rect x="170" y="328" width="160.70000000000005" height="56" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="250.35000000000002" y="347.55" font-size="13" text-anchor="middle" dominant-baseline="central" fill="currentColor">members / keys</text>
<text x="250.35000000000002" y="364.45" font-size="13" text-anchor="middle" dominant-baseline="central" fill="currentColor">dedupe + Ambiguous</text>
<rect x="170" y="410" width="124.95000000000002" height="56" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="232.47500000000002" y="429.55" font-size="13" text-anchor="middle" dominant-baseline="central" fill="currentColor">splice prefix</text>
<text x="232.47500000000002" y="446.45" font-size="13" text-anchor="middle" dominant-baseline="central" fill="currentColor">or list</text>
<path d="M233.27046944906314 58.89261617841137 L238.82953055093688 79.10738382158863" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M232.53809036289215 71.50341904258973 L238.82953055093688 79.10738382158863 L240.34815404460284 69.35565153011929" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M241.07075624931647 140.62864772602995 L252.47924375068354 161.37135227397005" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M244.59330057259373 155.43718003245743 L252.47924375068354 161.37135227397005 L251.69064943287455 151.533638159303" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M250.95228789753878 220.4037112283311 L65.44771210246122 245.5962887716689" fill="none" stroke="#00A876" stroke-width="1.5"/><path d="M73.82083825159786 240.3719937483529 L65.44771210246122 245.5962887716689 L74.91085856809188 248.3983164249982" fill="none" stroke="#00A876" stroke-width="1.5"/>
<path d="M254.78704365669904 222.87347885566345 L260.862956343301 243.12652114433655" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="5 3"/><path d="M254.3976289180582 235.6698435138899 L260.862956343301 243.12652114433655 L262.15602182834954 233.3423256408025" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="5 3"/>
<path d="M65.44667852035293 302.41125025431364 L247.3783214796471 327.58874974568636" fill="none" stroke="#00A876" stroke-width="1.5"/><path d="M237.90809807526492 330.3667649852219 L247.3783214796471 327.58874974568636 L239.01847376191174 322.34323298026897" fill="none" stroke="#00A876" stroke-width="1.5"/>
<path d="M260.5225434979409 304.74847200470657 L251.55245650205916 325.25152799529343" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="5 3"/><path d="M251.44938880188263 315.3827957033939 L251.55245650205916 325.25152799529343 L258.87026321459035 318.6294282589535" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="5 3"/>
<path d="M248.6504135313388 386.4721257725981 L234.1745864686612 407.5278742274019" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M235.93597608163734 397.817055176915 L234.1745864686612 407.5278742274019 L242.61071566765222 402.40593864230027" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M167 110 L153 110" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="5 3"/><path d="M162 105.95 L153 110 L162 114.05" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="5 3"/>
</svg>
```

図は `tools/svg-gen` の PALETTE（colorful オプション）で生成した `examples/fig-repl-completion-pipe.ts` の出力。上から順に文脈解釈・基底式の解決・メンバー列挙と流れて、resolveBase の下で緑の「AST を歩くだけ」の静的解決と、朱色の破線の「実際に式を評価する」opt-in tier に分かれる。左側の破線が「この文脈では候補を出さない」という抑止出口。スマートフォンの表示幅でも潰れないよう縦長のレイアウトにしてある。

### 一番基礎的な補完は本当に手軽

`strings.` の右側はパッケージのメンバー表を引くだけ、`x.` は変数 `x` の型からフィールドとメソッドを列挙するだけ。処理系にはすでに「このパッケージに何があるか」「この型に何があるか」を答える inspect の機構があり、REPL にはすでに「いま宣言されている変数」の表がある。この 2 つを繋ぐと、もう `pkg.` と `var.` は動く。ここは本当に数十行から数百行で作れるし、「補完を作る」の見通しが良く見える理由はたぶんここ。

prefix フィルタ（`strings.To` で `To*` だけ残す）と、候補の共通接頭辞を splice する処理（全候補が `ToLower`/`ToUpper` なら `strings.To` → 共通部分までは自動で継ぎ足す）も基礎のうち。

### そこから先が地味に面倒になる

面倒さは「候補を出す」ではなく「どの文脈かを判定する」ところに集中する。カーソル位置のテキストは構文として閉じていないことが多く、末尾が何を意味するかを scanner で offset を拾いながら判定する必要がある。今回実際に分岐した文脈はこのくらいある。

| 打ち込み途中の形 | 文脈 | やること |
| --- | --- | --- |
| `strings.To` | セレクタ末尾 | パッケージ/値/型のメンバーを prefix で絞る |
| `m["a` | 未閉鎖の index + 文字列リテラル内 | 生きている map の文字列キーを出す |
| `m[k.` | 未閉鎖の index 内 | 何も出さない（`getMap()[u.` は base 評価自体を止める） |
| `map[str` | 型のブラケット内 | 型候補（抑止せず） |
| `import "str` | import 文字列内 | パッケージパス候補 |
| `x.`（`var x = f()`） | 宣言型なし変数 | 初期化式の形から型を推論して member 化 |

さらに、`.` の左が識別子とは限らないのが本当の難所。`f().`、`m[k].`、`a+b.` のように base が式だと、静的に「どんな値が来るか」が分からない。ここで選択肢が 2 つに割れる。

- 静的に歩ける所だけ歩いて、分からない式は諦める（副作用ゼロ、安全）
- その式を実際に評価して、返ってきた値のメンバーを出す（`getMap()["` で `getMap()` が本当に走る）

後者は便利だが、TAB を押すたびにユーザーのコードが実行される。副作用がある関数なら、補完のたびに副作用が走る。これはポリシーの問題なので、IPython の `evaluation` 設定に倣って 2 段階の `EvalPolicy` にした。デフォルトの `EvalMinimal` は AST を歩くだけでユーザーコードを一切実行しない、`:eval on` で `EvalBase` に切り替えると未解決の base を `EvalExpr` で評価する。

そして評価するなら回数も問題になる。`getMap()["` で TAB を 3 回押せば `getMap()` が 3 回走るのは嫌なので、base 式のソース文字列をキーに結果をメモ化した。変数を書き換えたら古い値を見続けるので、`EvalLine`・`Load`・`Enter`・`Leave`・`Pin`・`Unpin` など状態を変える入口すべてで `noteMutation()` でメモを捨てる。

残りは Go 意味論の細部。

- 同じ深さの embed が同名フィールドを持つと、Go ではそのセレクタはコンパイルエラー（ambiguous）。候補には出るべきだが「書けない」ので `Candidate.Ambiguous` フラグを立て、一覧では `Name!` と表示してヒントと分かるようにした
- dot-import した型名は Detail 上も本来のパッケージ名で綴る（`func(*strings.Builder)` と出てほしい）
- `strings.Compare` など `fn*` アダプタ経由の builtin は内部表現が「アダプタ」なのでシグネチャを描けなかった。実体と同型の Go 関数が存在するものには `Target`（reflect 対象）を付与して Detail に `func Compare func(string, string) int` と出るようにした（約 160 件。`Target` は arity チェックと引数 marshal にも効くので副次的に呼び出しも厳密になる）

## 補完を作ると処理系側に必要になるもの

「REPL に UI を足す」に見えて、実際には処理系側への要求が多い。今回必要になったものを列挙すると:

- パッケージ・型・スコープの introspection（decl 一覧、member 列挙、promoted メンバー探索に深さの概念）
- 式の 2 系統の解決。静的に runtime.Value / TypeDef を返す `resolveExpr` と、任意式を実行する `EvalExpr`
- REPL の内部状態への読み取り。変数セルの中身（live map のキーを列挙するには実値が要る）、scratch package の decl 表、import 一覧
- 状態変更フック。メモを無効化するために「REPL の状態が変わる入口」の一覧と、そこへの 1 行挿入
- `Candidate` という返り値型への拡張余地（`Detail` で表示を太らせる、`Ambiguous` で意味論の旗を立てる）

逆にいうと、補完を書くとインタプリタの introspection 周りの穴が網羅的に見つかる。今回も「型宣言のない変数」「promoted の衝突」「adapter builtin の Target 不在」という形で、全部補完経由で見つかった。

## 今回やったこと

作業は GitHub の stacked PRs で 1 項目 1 PR に分けて積んだ。各層は下の層の上にだけ乗るので、下から順にマージされる想定。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-19.499999999999986 0 444.5 336.4" width="445" height="336" role="img" aria-label="nine stacked pull requests layered on main, merging bottom-up">
<rect x="70" y="250" width="345" height="30" rx="4" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="80" y="265" font-size="12" dominant-baseline="central" fill="currentColor">#1407</text>
<text x="132" y="265" font-size="12" dominant-baseline="central" fill="currentColor">EvalBase tier (eval the selector base)</text>
<rect x="70" y="220" width="345" height="30" rx="4" fill="none" stroke="#E69F00" stroke-width="1.5"/>
<text x="80" y="235" font-size="12" dominant-baseline="central" fill="currentColor">#1408</text>
<text x="132" y="235" font-size="12" dominant-baseline="central" fill="currentColor">map string-key candidates</text>
<rect x="70" y="190" width="345" height="30" rx="4" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="80" y="205" font-size="12" dominant-baseline="central" fill="currentColor">#1410</text>
<text x="132" y="205" font-size="12" dominant-baseline="central" fill="currentColor">untyped `var x = f()` inference</text>
<rect x="70" y="160" width="345" height="30" rx="4" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="80" y="175" font-size="12" dominant-baseline="central" fill="currentColor">#1411</text>
<text x="132" y="175" font-size="12" dominant-baseline="central" fill="currentColor">Ambiguous flag on promoted members</text>
<rect x="70" y="130" width="345" height="30" rx="4" fill="none" stroke="#CC79A7" stroke-width="1.5"/>
<text x="80" y="145" font-size="12" dominant-baseline="central" fill="currentColor">#1412</text>
<text x="132" y="145" font-size="12" dominant-baseline="central" fill="currentColor">Detail spelled by the real home</text>
<rect x="70" y="100" width="345" height="30" rx="4" fill="none" stroke="#56B4E9" stroke-width="1.5"/>
<text x="80" y="115" font-size="12" dominant-baseline="central" fill="currentColor">#1413</text>
<text x="132" y="115" font-size="12" dominant-baseline="central" fill="currentColor">no members inside an index slot</text>
<rect x="70" y="70" width="345" height="30" rx="4" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="80" y="85" font-size="12" dominant-baseline="central" fill="currentColor">#1414</text>
<text x="132" y="85" font-size="12" dominant-baseline="central" fill="currentColor">Detail for fn* builtins (~160)</text>
<rect x="70" y="40" width="345" height="30" rx="4" fill="none" stroke="#E69F00" stroke-width="1.5"/>
<text x="80" y="55" font-size="12" dominant-baseline="central" fill="currentColor">#1416</text>
<text x="132" y="55" font-size="12" dominant-baseline="central" fill="currentColor">`!` marker in listings</text>
<rect x="70" y="10" width="345" height="30" rx="4" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="80" y="25" font-size="12" dominant-baseline="central" fill="currentColor">#1417</text>
<text x="132" y="25" font-size="12" dominant-baseline="central" fill="currentColor">eval memoization</text>
<rect x="70" y="288" width="345" height="24" rx="4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.7"/>
<text x="80" y="300" font-size="12" dominant-baseline="central" fill="currentColor" opacity="0.7">main</text>
<path d="M40 277 L40 15" fill="none" stroke="#3B82C4" stroke-width="2"/><path d="M44.05 24 L40 15 L35.95 24" fill="none" stroke="#3B82C4" stroke-width="2"/>
<text x="40" y="324" font-size="12" text-anchor="middle" fill="currentColor" opacity="0.8">lands bottom-up</text>
</svg>

```

各 PR の内容は次の通り。番号順が下からの積み順でもある。

- [#1407](https://github.com/podhmo/minigo/pull/1407): EvalBase tier。静的解決に失敗した selector base を `EvalExpr` で評価する（opt-in）
- [#1408](https://github.com/podhmo/minigo/pull/1408): `m["` で live map の文字列キーを候補化
- [#1410](https://github.com/podhmo/minigo/pull/1410): 外部パッケージの `var x = f()`（宣言型なし）を初期化式の形から推論
- [#1411](https://github.com/podhmo/minigo/pull/1411): 同深 promoted メンバーの衝突に `Candidate.Ambiguous`
- [#1412](https://github.com/podhmo/minigo/pull/1412): Detail の型名を本来の home で綴る（dot-import 対応）
- [#1413](https://github.com/podhmo/minigo/pull/1413): 未閉鎖 index スロット内の `.` 末尾を抑止
- [#1414](https://github.com/podhmo/minigo/pull/1414): `fn*` adapter builtin 約 160 件に実体の `Target` を付与して Detail を描画
- [#1416](https://github.com/podhmo/minigo/pull/1416): Ambiguous 候補を一覧で `!` サフィックス表示
- [#1417](https://github.com/podhmo/minigo/pull/1417): EvalBase の評価結果を base ソース文字列でメモ化

別立ての [#1415](https://github.com/podhmo/minigo/pull/1415) は、#1414 のレビューで見つかった「env サンドボックス経由の builtin に `Target` を付けるとテンプレートの `FuncMap` 経路で制限を迂回できてしまう」問題への再発防止ガードで、スタックとは独立して main から切っている。

実機検証は pty で REPL を起動して実際に TAB を打つ方法と、`:comp` メタコマンド（TAB と同じ `r.complete` を通る非 TTY プローブ）で候補・Detail・`!` マーカーを確認する方法の両方で行った。`getMap()["` ではカウンタ変数を見て評価回数が 1 回でメモ化が効いていること、`var` 代入で無効化されることも確認済み。

## おわりに

「処理系があるなら REPL は薄い」「REPL があるなら補完は名前表を引くだけ」という見通しは最初の数十行では正しい。残りの実装は文脈解釈（どこにカーソルがいるか）と意味論（その候補は本当に書けるか）と副作用ポリシー（評価してよいか、何回か）の穴埋めで、どれも個別には小さいが、処理系の introspection と評価器の性能にそのまま依存する。このスタック自体は実験扱いで TODO には "may not merge" とあるので、マージされなくても「補完を作ると処理系のどこが見えるか」という地図としては意味があると思っている。
