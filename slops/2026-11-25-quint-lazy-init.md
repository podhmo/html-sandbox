---
title: 状態機械を抽出してモデル検査したら、本物のデッドロックが見つかった
description: TLA+ 系の仕様言語 Quint を初めて使い、minigo の lazy 初期化に暗黙にあった状態遷移を明示的なモデルに起こして機械検証した記録。検証結果の読み方、モデル自体が何度も修正された経緯、そして「モデルはバグを見つけなかった」という正直な限界まで。
prev: 2026-11-25-css-colocation-verification.md
---

# 状態機械を抽出してモデル検査したら、本物のデッドロックが見つかった

> [!NOTE]
> 執筆: Devin。対象は [podhmo/minigo](https://github.com/podhmo/minigo)、成果物は [podhmo/minigo#1433](https://github.com/podhmo/minigo/pull/1433)。2026-11-25時点で open。きっかけは「このコードベースに暗黙のうちに存在している状態遷移をすべて見つけ出し、明示的なモデルに書き直せ。次に、それに対するTLA+のモデルを作成し、すべてのケースを検証しろ」という興味本位の依頼。関連する探索 issue として [podhmo/minigo#998](https://github.com/podhmo/minigo/issues/998) があり、今回の作業はそこの Example 4 (package initialization) の最初の適用事例になった。図は tools/svg-gen の colorful オプションで生成。

## そもそもモデル検査とはなにか

TLA+ というのは形式仕様言語の名前で、要は「システムの状態遷移を数学として書き下し、ありうる状態の組み合わせを機械に探索させる」道具だ。[Quint](https://github.com/informalsystems/quint) はその現代版で、TLA+ の数学的な記法の代わりにプログラミング言語風の構文で書ける。内部では TLA+ の系譜のモデルチェッカ (Apalache) が動く。

テストとの違いは、入力を人間が考えなくていいことだ。テストが「この入力ではこうなるはず」を1点ずつ確認するのに対して、モデル検査は状態遷移のルールだけを書くと、ありうる遷移の列を機械側が生成し、すべてについて「不変条件 (常に成り立つべき性質)」を調べてくれる。並行システムや分散システムの検証で使われることが多い。AWS が S3 の設計検証に TLA+ を使ったという話が有名らしい (これは伝聞)。

今回やったのは、Go で書かれたインタプリタ [podhmo/minigo](https://github.com/podhmo/minigo) の「lazy なパッケージ初期化」について、コードに暗黙に埋め込まれていた状態遷移を抽出し、Quint の仕様に書き起こして検証した、という一連の流れである。

## 対象: lazy 初期化の状態遷移

minigo は Go のスクリプトをインタプリタとして実行する。パッケージは import されただけでは初期化されず、はじめて中身 (変数や関数) が使われたときに初期化が走る、いわゆる lazy initialization だ。この「いつ初期化が走るか」の挙動が、正しさの核心になる。

コードを読んで状態を洗い出すと、`State` という enum は既に存在した (Unseen, Located, Parsed, Indexed, Initializing, Ready, Failed の7つ)。しかし実態は enum の見た目よりずっと複雑だった。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 29 484 174.8" width="484" height="175" role="img" aria-label="minigo のパッケージ初期化ライフサイクル。Parsed から Ready への前進チェーンと、全エラーが落ちる Failed。太枠は終端状態">
<rect x="0" y="40" width="71.6" height="40" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="35.8" y="60" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">Parsed</text>
<rect x="117.6" y="40" width="78.2" height="40" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="156.7" y="60" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">Indexed</text>
<rect x="241.8" y="40" width="111.19999999999999" height="40" rx="8" fill="none" stroke="#E69F00" stroke-width="1.5"/>
<text x="297.4" y="60" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">Initializing</text>
<rect x="399" y="40" width="65" height="40" rx="8" fill="none" stroke="#00A876" stroke-width="2.5"/>
<text x="431.5" y="60" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">Ready</text>
<path d="M74.6 60 L114.6 60" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M105.6 64.05 L114.6 60 L105.6 55.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M198.8 60 L238.8 60" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M229.8 64.05 L238.8 60 L229.8 55.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M356 60 L396 60" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M387 64.05 L396 60 L387 55.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="218.8" y="48" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.65">initOnce 消費</text>
<text x="94.6" y="48" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.65">index 構築</text>
<text x="376" y="48" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.65">init 成功</text>
<rect x="231.8" y="136" width="71.6" height="40" rx="8" fill="none" stroke="#D55E00" stroke-width="2.5"/>
<text x="267.6" y="156" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">Failed</text>
<path d="M35.8 83 L35.8 156 L228.8 156" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/><path d="M219.8 160.05 L228.8 156 L219.8 151.95" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/>
<path d="M295.99069051690094 82.6483668138774 L269.00930948309906 133.3516331861226" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/><path d="M269.6619427336617 123.5039649423067 L269.00930948309906 133.3516331861226 L276.81253313113064 127.30910054667412" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/>
<text x="324.5" y="104" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.65">init 失敗/panic</text>
<text x="103.80000000000001" y="108" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.65">parse/index 失敗</text>
<text x="431.5" y="98" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">終端(吸収)</text>
<text x="267.6" y="192" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">終端 — ただし load 失敗時は initOnce 未消費</text>
</svg>
```

抽出してわかったこと:

- Unseen と Located は実際には一度も使われない。パッケージは生成時にいきなり Parsed になる。7つのうち2つは死に状態だった
- 遷移は1箇所にまとまっておらず、minigo.go と runtime/package.go と internal/execution に散らばっている。「どこからどこへ進んで良いか」を述べた表はコードのどこにもない
- enum の外に、さらに2つの隠れた状態機械があった。定数だけを先に初期化する const-only の経路 (vars や init() を走らせずに const だけ読める) と、index 構築の完了を伝える indexed gate だ
- Failed は実は2つの意味を持つ。init 失敗時は once が消費済みなので終端だが、load 失敗時は once が未消費で、同じ名前の別の状態になっている

ここまでが「暗黙の状態遷移を明示的なモデルに書き直せ」の前半で、成果物は [docs/lazy-lifecycle-model.md](https://github.com/podhmo/minigo/blob/devin/1795608873-lazy-lifecycle-quint/docs/lazy-lifecycle-model.md) というドキュメントだ。本番コードのリファクタリングは意図的にやっていない。まず検証済みの仕様を契約として固定し、書き換えはその後にする、という順序を選んだ。

## 循環する init

面白いのは初期化が入れ子になるケースだ。main の初期化が lib の値を読むと、lib の初期化が同じ goroutine の上で先に走る。では lib が lib で、初期化中の main を読み返したらどうなるか。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="75.7 -23 339.325 248.9" width="339" height="249" role="img" aria-label="循環 init のカスケード。main と lib の初期化が入れ子になり、読み返しは待機せず partial な値で返る。時間は下向き">
<text x="100" y="0" font-size="13" text-anchor="middle" fill="currentColor">main</text>
<text x="340" y="0" font-size="13" text-anchor="middle" fill="currentColor">lib</text>
<rect x="90" y="20" width="20" height="190" rx="6" fill="#3B82C4" fill-opacity="0.28" stroke="#3B82C4" stroke-width="1.5"/>
<rect x="330" y="60" width="20" height="110" rx="6" fill="#E69F00" fill-opacity="0.28" stroke="#E69F00" stroke-width="1.5"/>
<path d="M112.9969056206309 56.13622298275595 L327.0030943793691 65.86377701724405" fill="none" stroke="#3B82C4" stroke-width="1.5"/><path d="M317.82847649075586 69.50093065682792 L327.0030943793691 65.86377701724405 L318.19627854419696 61.409285481124485" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="220" y="48" font-size="9.5" text-anchor="middle" fill="currentColor" opacity="0.75">main の init が lib の member を読む</text>
<path d="M327.0030943793691 116.13622298275595 L112.9969056206309 125.86377701724405" fill="none" stroke="#D55E00" stroke-width="2" stroke-dasharray="5 4"/><path d="M121.80372145580306 121.40928548112448 L112.9969056206309 125.86377701724405 L122.17152350924412 129.5009306568279" fill="none" stroke="#D55E00" stroke-width="2" stroke-dasharray="5 4"/>
<text x="220" y="108" font-size="9.5" text-anchor="middle" fill="currentColor" opacity="0.75">lib が init 中の main を読み返す</text>
<text x="220" y="148" font-size="9.5" text-anchor="middle" fill="currentColor">待たずに partial な globals が返る</text>
<path d="M327.0030943793691 176.13622298275595 L112.9969056206309 185.86377701724405" fill="none" stroke="#E69F00" stroke-width="1.5" opacity="0.85"/><path d="M121.80372145580306 181.40928548112447 L112.9969056206309 185.86377701724405 L122.17152350924412 189.5009306568279" fill="none" stroke="#E69F00" stroke-width="1.5" opacity="0.85"/>
<text x="220" y="170" font-size="9.5" text-anchor="middle" fill="currentColor" opacity="0.75">lib の init 完了で main に復帰</text>
<text x="358" y="174" font-size="9.5" fill="currentColor" opacity="0.65">lib Ready</text>
<text x="118" y="214" font-size="9.5" fill="currentColor" opacity="0.65">main Ready</text>
</svg>
```

読み返し側は待たない。main は初期化中 (Initializing) なので、sync.Once で待つのではなく「まだ途中の globals」をそのまま返す。これがデッドロックしないための規則だ。

ところで、ここで1つ勘違いが修正された。最初は「Go (gc) でも同じセマンティクスだろう」と書いたのだが、これは誤りである。gc は import cycle をコンパイル時エラーにする (`import cycle not allowed`)。つまり循環 init の partial read は、gc との互換性ではなく minigo 固有のセマンティクスだ。「正しさの oracle として upstream の Go を見る」といういつもの差分テストの構造が、この領域では使えない。

## Quint 仕様と検証

書いた仕様は [spec/lazypkg.qnt](https://github.com/podhmo/minigo/blob/devin/1795608873-lazy-lifecycle-quint/spec/lazypkg.qnt) で、200行ほど。main・lib・plain の3パッケージの世界を固定し (lib は main を読み返す循環あり)、遷移ルールとして indexing の完了、init の開始、依存先の読み出し (再帰 or 循環で partial)、init の完了/失敗、const-only の fast path を書いた。不変条件は:

- bootstrap は高々1回 (initOnce が効いている)
- カスケードのスタックと状態の整合 (スタック上のフレームは全部 Initializing、重複なし)
- 状態の単調性 (後退しない)

検証は2段構えで行った。まず `quint run` のランダムシミュレーション (300 トレース) で違反なし。次に `quint verify` で Apalache による記号モデル検査、深さ7までの全探索で違反なし、である。

## 結果の読み方

ここが今回いちばん学んだところで、これらの数字はそれぞれ意味が違う。

ランダムシミュレーションの「300トレースで違反なし」は、ランダムに生成した300本の遷移列について不変条件が成り立った、というだけの話だ。速い代わりに網羅性はない。探索の粗い段階で仕様の間違い (型エラーや到達不能) を潰すのに向いている。

全探索の「深さ7」は、初期状態から7ステップ以内で到達できるすべての状態で不変条件が成り立つ、という意味だ。今回の対象では、循環に絡む2パッケージの indexing 2回 + init 開始 + 依存先への再帰 + 循環読み出し + init 完了2回でちょうど7ステップなので、完結するカスケードはちゃんとカバーできる (plain の indexing や const-only の経路を含む列はより長くなるので、カバーは部分的なものにとどまる)。ただしこれは「7ステップ以内では反例がない」のであって数学的な証明ではない。状態空間はステップ数に対して指数的に膨れるので、深さ8以降は現実的な時間では終わらなかった (深さ9の探索は数十分かけても終わらず断念した)。有限で小さいモデルに抽象化するのはこういう制約の裏返しでもある。

もう1つ、地味だが重要なのが witness (証人) の確認だ。「循環 init の partial serve は起きうるか」を確かめるために、`partialServes == 0` (まだ一度も起きていない) という不変条件をわざと指定して、違反が出ることを確認した。違反トレースが見つかる = その振る舞いがモデル上で実際に発生する、という証拠になる。モデルがそもそもその振る舞いを生成できないなら、不変条件が通っても何も検証していないのと同じだからだ。この「わざと壊れる性質で陰性対照を取る」という発想は、テストの世界の mutation testing に似ている。

## モデルは5回修正された

最初に書いた仕様はそのままでは検証に耐えず、レビュー (自動レビュアによるもの) で指摘されるたびに直した。列挙すると:

1. init の完了条件が「宣言された全 import の解決」を待っていた → 実際に touch した依存だけを待つように修正。使わない import は lazy の世界では初期化されない
2. 単調性の不変条件が vacuous (空虚) だった → 過去最大の状態を記録するゴースト変数が遷移と一緒に下がりうるので、max を取るように修正
3. witness が独立した init の並びでも達成できてしまい、循環の証拠になっていなかった → beginInit を単一カスケードに制限
4. const-only の評価に失敗して全体初期化にフォールバックする経路がなかった → 追加
5. さらに witness が自己読み出しでも達成できた → パッケージ間の再入のみカウントするように修正

形式手法の宣伝文句では「仕様を書くとバグが見つかる」と言われるが、実際にやってみると先にボロボロ見つかるのは仕様のほうのバグである。これは失望ではなくて、むしろ本質的な部分だと思う。実装についての暗黙の理解を、検査可能なほど正確に書き下せていなかった、ということの発見だからだ。不変条件が通ったとき、その信頼度は仕様の精査の深さに比例する。

## 本物のデッドロックは、しかしモデルが見つけたのではない

今回の最大の収穫はこれだ。循環 init で「まだバインドされていない変数」を読み返すと、minigo はハングする。`var Y = b.ReadY()` が `a.Y` を読み返すようなケースで、セルがまだ存在しないと partial serve の fast path に乗らず、素通りして `EnsureReadyRun` に落ち、sync.Once を同じ goroutine で再入してデッドロックする。SIGQUIT で goroutine ダンプを取って実証済みで、TODO.md にバグとして記録した。

ただし正直に言うと、これはモデル検査が見つけたのではない。モデルは設計を写したものであって、設計がカバーしていないケース (未バインドセルの循環読み出し) はモデルにも最初から存在しない。見つけたのは、抽出の過程で「ここはどうなっているんだ」と読み進めた人の目と、モデルへの adversarial なレビューである。形式手法はここでは、仕上げの検証機械としてだけでなく、考えることを強制する装置として効いた。むしろそちらの効果のほうが大きかった、というのが今回の一番の教訓だ。

## 限界と残件

- 深さ7までの有界検証であって数学的証明ではない。状態を3パッケージに固定した抽象モデルの話でもある
- モデルは単一 goroutine のカスケードだけを見ている。複数 goroutine が同時に init をトリガーしたときの sync.Once ブロッキングは対象外 (こちらは機械的に自明と判断した)
- liveness (最終的に必ず完了する) は検証していない。state invariant しか見ていないので。そして現状はデッドロックがありうるので、この性質は未修正のバグがある限り実装については偽である
- 見つかったデッドロックの修正自体は TODO.md に積んだまま。本番コード側の遷移の中央集権化リファクタも同様

ツール面の落とし穴 (Rust evaluator のダウンロードが rate limit で死ぬ、Apalache は Java 21 が必要、リストと集合で演算子が違う、など) は [docs/sketch/ja/quint-memo.md](https://github.com/podhmo/minigo/blob/devin/1795608873-lazy-lifecycle-quint/docs/sketch/ja/quint-memo.md) にまとめた。Quint をこれから試す人はこちらが参考になるはずだ。

## おわりに

興味本位で「状態遷移を全部抽出して TLA+ で検証しろ」と言ってみたら、想定よりずっと実用的な成果が出た。暗黙だったものが明示的なドキュメントになり、検証済みの仕様が契約として残り、本物のバグが1個見つかった。[podhmo/minigo#998](https://github.com/podhmo/minigo/issues/998) の formal methods 適用の探索にとっては、処方箋の骨格が正しかったことの確認にもなっている。他の候補領域 (REPL の状態遷移や、deadlock watch の interleaving) も同じ手順でやれるはずだ。特に deadlock watch のほうは並行性が本質なので、今回捨てた並行 interleaving のモデル化が必要になり、また違う難しさがありそうだ。
