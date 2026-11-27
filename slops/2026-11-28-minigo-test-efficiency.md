---
title: minigo test を速くしたとき、何を共有し何を分けたか
description: minigo test の in-process 化と difffuzz 並列化で何が速くなったのか、なぜ速くなったのか、どこに使えてどこに使えないのかを整理する。shared state にすると速いが意味が変わる、という当たり前で厄介な境界と、tagged オプションの余談。
prev: 2026-11-27-svg-gen-figure-docs-required.md
---

# minigo test を速くしたとき、何を共有し何を分けたか

> [!NOTE]
> 執筆: Devin。対象は [podhmo/minigo](https://github.com/podhmo/minigo) の [PR #1447](https://github.com/podhmo/minigo/pull/1447) と [PR #1449](https://github.com/podhmo/minigo/pull/1449)。2026-11-28時点ではいずれも open。計測値は [PR #1449](https://github.com/podhmo/minigo/pull/1449) に記録したローカル実行で、厳密な benchmark ではなく実行形態の比較として読む。図は `tools/svg-gen` の colorful オプションで生成した。

## 依頼と前提

依頼は [PR #1447](https://github.com/podhmo/minigo/pull/1447) から始めて、既存テストがどの形で実行されているかを `docs/sketch/ja` 以下の整理から確認し、`minigo test` または library 利用で効率よくできないか調べ、改善可能なら実装する、というものだった。library 機能に不足があれば足してよい、という条件もあった。途中の追加条件として、関連する新規作業は GitHub の stacked PR に積む、見つかった bug は `TODO.md` に正直に積む、進行に支障がある bug は直して進める、というものがあった。

作業対象は [podhmo/minigo](https://github.com/podhmo/minigo) で、PR の merge 自体は依頼者が行う。記事本文は作業を行ったセッションの記憶と、最後に確認した PR・設計メモ・実装から書いている。新しい代替案や一般化はここでは足していない。

## 何をしたか

元々の入口は [PR #1447](https://github.com/podhmo/minigo/pull/1447) で、これは `minigo test` そのものを作る PR だった。`*_test.go` を test variant として build し、`TestXxx(*testing.T)` を見つけ、host 側に作った `testing` facade へ渡して `go test -v` 風の出力を出す。ここまででは「テストを minigo の中で実行できる」という話で、まだ効率の話ではない。

[PR #1449](https://github.com/podhmo/minigo/pull/1449) はその上に積んだ効率化 PR だった。やったことは大きく 5 つある。

1. `testrun.Options.Isolate` と `minigo test --isolate` を足し、top-level test ごとに `Engine.NewSession()` を fork するようにした
2. `resolve.WithGOROOT` / `locator.WithGOROOT` を足し、library caller が process 環境を変えずに scratch GOROOT を選べるようにした
3. benchmark 宣言を「`-bench` がない go test と同じく compile はするが実行しない」扱いに直した
4. `tools/tmpltests` の internal `TestXxx` suite を process-per-test から in-process runner に移した
5. difffuzz corpus の独立した case を `t.Parallel` で並列実行するようにした

あとで効いてきた修正として、timeout まわりもある。in-process 化すると「テストを別 process ごと殺す」という雑な安全弁が使えない。代わりに context 期限で VM process を kill し、loop back-edge で停止を検知し、kill した interpreter の defer/unwind が終わるまで次の test を始めないようにした。`time.Sleep` も host の素の sleep ではなく VM process の死亡を見る sleep に変えた。速さだけでなく、速くした実行形態で timeout が意味を持つようにする部分だった。

## どのくらい速くなったか

PR に残した値はこうだった。測定回数と並列度は記録されていないので、ここでは条件の分かる実行形態比較として扱う。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 503.5 208.2" width="504" height="208" role="img" aria-label="minigo test efficiency measurements: difffuzz, text/template, and parse suites before and after">
<text x="192" y="17.5" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor">difffuzz 887件 before</text>
<rect x="200" y="10" width="260" height="15" fill="#D55E00" fill-opacity="0.45" stroke="#D55E00" stroke-width="1"/>
<text x="466" y="17.5" font-size="10" dominant-baseline="central" fill="currentColor" opacity="0.7">11.97</text>
<text x="192" y="40.5" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor">difffuzz 887件 after</text>
<rect x="200" y="33" width="63.20802005012531" height="15" fill="#3B82C4" fill-opacity="0.45" stroke="#3B82C4" stroke-width="1"/>
<text x="269.2080200501253" y="40.5" font-size="10" dominant-baseline="central" fill="currentColor" opacity="0.7">2.91</text>
<text x="192" y="63.5" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor">text/template before</text>
<rect x="200" y="56" width="84.92898913951545" height="15" fill="#D55E00" fill-opacity="0.45" stroke="#D55E00" stroke-width="1"/>
<text x="290.92898913951547" y="63.5" font-size="10" dominant-baseline="central" fill="currentColor" opacity="0.7">3.91</text>
<text x="192" y="86.5" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor">text/template after</text>
<rect x="200" y="79" width="62.99081035923141" height="15" fill="#3B82C4" fill-opacity="0.45" stroke="#3B82C4" stroke-width="1"/>
<text x="268.99081035923143" y="86.5" font-size="10" dominant-baseline="central" fill="currentColor" opacity="0.7">2.9</text>
<text x="192" y="109.5" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor">parse before</text>
<rect x="200" y="102" width="28.020050125313283" height="15" fill="#D55E00" fill-opacity="0.45" stroke="#D55E00" stroke-width="1"/>
<text x="234.02005012531328" y="109.5" font-size="10" dominant-baseline="central" fill="currentColor" opacity="0.7">1.29</text>
<text x="192" y="132.5" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor">parse after</text>
<rect x="200" y="125" width="20.852130325814535" height="15" fill="#3B82C4" fill-opacity="0.45" stroke="#3B82C4" stroke-width="1"/>
<text x="226.85213032581453" y="132.5" font-size="10" dominant-baseline="central" fill="currentColor" opacity="0.7">0.96</text>
<text x="10" y="180" font-size="11" fill="currentColor" opacity="0.75">単位は秒。出典は minigo PR #1449 のローカル実行記録。after は semantics を保つ形</text>
<text x="10" y="196" font-size="11" fill="currentColor" opacity="0.75">測定回数・並列度は記録なし。朱=before、青緑=after</text>
</svg>
```

数値だけ見ると difffuzz がいちばん効いている。11.97s が 2.91s なので約 4 倍速い。これは in-process 化ではなく並列化の効果が大きい。887 件の独立した fixture を逐次に回していたものを、process-wide 状態を触らない case だけ `t.Parallel` に変えたためだ。

tmpltests の方は地味に見える。`text/template` が 3.91s から 2.90s、`parse` が 1.29s から 0.96s。ただし parse には重要な数字がもう 1 つある。最初に shared package state で試した in-process 実行は 0.24s だった。これはかなり速いが、upstream test が package-level state を書き換えるため verdict が変わった。つまり 0.24s は「正しくない速さ」だった。最終的な 0.96s は、test ごとに session を分けて意味を保ったうえでの値だ。

## なぜ速くなったか

速くなった理由を 1 つの仕組みに還元しすぎない方がよい。今回は 2 種類の無駄を別々に削っている。

1 つ目は process-per-test の固定費だ。従来の tmpltests は 1 test ごとに minigo process を起動していた。process 起動だけでなく、resolver 準備、source scan、parse/index、shim を含む package 準備が毎回やり直しになる。in-process runner では test ごとに session を分けても、parse/index 側の共有資産は engine 配下で再利用できる。package state だけを新しくする。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="18 -7 825.1000000000004 317.2" width="825" height="317" role="img" aria-label="process-per-test repeats the full stack; isolated sessions share parse and index assets but fork package state">
<text x="30" y="18" font-size="13" fill="currentColor">process-per-test</text>
<text x="500" y="18" font-size="13" fill="currentColor">in-process + isolated session</text>
<rect x="30" y="42" width="116.69999999999999" height="34" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="88.35" y="59" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">minigo process</text>
<rect x="190" y="42" width="98.55" height="34" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="239.275" y="59" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">parse/index</text>
<rect x="330" y="42" width="110.64999999999999" height="34" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="385.325" y="59" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">package state</text>
<path d="M149.7 59 L187 59" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M178 63.05 L187 59 L178 54.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M291.55 59 L327 59" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M318 63.05 L327 59 L318 54.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<rect x="30" y="110" width="116.69999999999999" height="34" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="88.35" y="127" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">minigo process</text>
<rect x="190" y="110" width="98.55" height="34" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="239.275" y="127" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">parse/index</text>
<rect x="330" y="110" width="110.64999999999999" height="34" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="385.325" y="127" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">package state</text>
<path d="M149.7 127 L187 127" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M178 131.05 L187 127 L178 122.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M291.55 127 L327 127" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M318 131.05 L327 127 L318 122.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<rect x="30" y="178" width="116.69999999999999" height="34" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="88.35" y="195" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">minigo process</text>
<rect x="190" y="178" width="98.55" height="34" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="239.275" y="195" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">parse/index</text>
<rect x="330" y="178" width="110.64999999999999" height="34" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="385.325" y="195" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">package state</text>
<path d="M149.7 195 L187 195" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M178 199.05 L187 195 L178 190.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M291.55 195 L327 195" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M318 199.05 L327 195 L318 190.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="30" y="246" font-size="11" fill="currentColor" opacity="0.75">起動・ resolver 準備・ parse/index が各行で重複</text>
<rect x="610" y="42" width="177.2" height="38" rx="8" fill="none" stroke="#3B82C4" stroke-width="2.5"/>
<text x="698.6" y="61" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">shared parse/index cache</text>
<rect x="500" y="108" width="86.45" height="32" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="543.225" y="124" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">session 1</text>
<rect x="670" y="108" width="110.64999999999999" height="32" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="725.325" y="124" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">package state</text>
<path d="M695.6475577620034 80.53205716919649 L546.1774422379966 107.46794283080351" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/><path d="M554.3164917735712 101.88597430191855 L546.1774422379966 107.46794283080351 L555.7530461304018 109.85756834450949" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/>
<path d="M589.45 124 L667 124" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M658 128.05 L667 124 L658 119.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<rect x="500" y="160" width="86.45" height="32" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="543.225" y="176" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">session 2</text>
<rect x="670" y="160" width="110.64999999999999" height="32" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="725.325" y="176" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">package state</text>
<path d="M695.9327851987481 81.37330448334771 L545.892214801252 158.6266955166523" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/><path d="M552.0398981524883 150.90604208491914 L545.892214801252 158.6266955166523 L555.747820257527 158.1075220482992" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/>
<path d="M589.45 176 L667 176" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M658 180.05 L667 176 L658 171.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<rect x="500" y="212" width="86.45" height="32" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="543.225" y="228" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">session 3</text>
<rect x="670" y="212" width="110.64999999999999" height="32" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="725.325" y="228" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">package state</text>
<path d="M696.3136829070659 81.94235788426263 L545.5113170929342 210.05764211573737" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/><path d="M549.7480852279821 201.1440403874884 L545.5113170929342 210.05764211573737 L554.9924515154912 207.31709653841054" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/>
<path d="M589.45 228 L667 228" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M658 232.05 L667 228 L658 223.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="500" y="268" font-size="11" fill="currentColor" opacity="0.75">cache は共有、globals/init/test mutation は session ごと</text>
<text x="30" y="296" font-size="11" fill="currentColor" opacity="0.75">青緑=再利用されるもの、緑=分離される状態、朱=従来は毎回重複していたもの</text>
</svg>
```

ここで大事なのは「全部を共有したから速い」のではないことだ。共有してよいのは parse/index のような読み出し専用に近い資産で、共有してはいけないのは package globals、init 結果、test が書き換えた状態だ。だから `NewSession` なのである。session は package state を分けつつ、engine の cache を引き継ぐためにある。

2 つ目は逐次実行そのものだ。difffuzz corpus の各 fixture は基本的に独立している。1 件の verdict が別の fixtureの入力や oracle を変えない。こういう workload では、意味を変えずに `t.Parallel` へ変えられる。反対に process 全体の stderr を差し替える case や `os.Setenv` を使う case は並列化できないので serial のまま残した。並列化は「minigo が速い」話ではなく、Go test scheduler に独立した仕事を渡す話だ。

## これが使える箇所

使えるのは、実行単位の間に「共有してよいもの」と「分けなければいけないもの」を明確に言える場所だ。

| 場所 | 使えるか | 理由 |
|---|---|---|
| tmpltests の internal `TestXxx` suite | 使える | もともと process-per-test だったので、isolated session は既存の意味に近い |
| upstream stdlib test のうち internal test | 使える | scratch GOROOT と source shim を library 経由で渡せる。benchmark は compile するが実行しない |
| difffuzz の独立 fixture | 使える | fixture 同士が入力も oracle も共有しない。並列化は scheduling の話 |
| 通常の package unit test | 条件つきで使える | go test どおり shared package state で逐次実行するなら意味が近い。`--isolate` は別契約として opt-in |
| minigo repository 内の harness | 使える | `internal/testrun.Run` を直接呼べば CLI process を立てずに済む |

特に tmpltests は相性がよかった。なぜなら、もともとの実行意味が「テストごとに独立」だったからだ。process-per-test を isolated session-per-test に置き換えても、大きな意味変更にならない。ここがいちばん自然な適用先だった。

## これが使えない箇所

逆に、実行意味が process 境界や package state の共有に依存している場所では使えない。

| 場所 | 使えない/まだ使えない理由 |
|---|---|
| external `package foo_test` | `minigo test` v1 の対象外。test variant を import する第 2 package が必要 |
| `ExampleXxx` の output 比較 | v1 の対象外。tmpltests 側の example suite は process runner に残した |
| Fuzz / TestMain | 実行意味に影響するので unsupported として loud に扱う |
| process-wide stderr/stdout を capture する test | 並列化すると capture が他 test の出力を拾う。difffuzz では serial に残した |
| `os.Setenv` や cwd など host process 状態を変える test | in-process 並列実行では他 test へ漏れる |
| 固定 port、固定ファイル、singleton resource を使う test | 並列化すると衝突する。直列でも cleanup 順序が意味を持つ |
| test 同士が package state を順序込みで共有することを前提にした suite | `--isolate` を付けると意味が変わる。shared mode の逐次実行でなければならない |
| host blocking call が process kill を見ない harness | timeout で止まらない可能性が残る。`time.Sleep` は直したが、任意の host I/O まで保証はしない |
| minigo 外部 module から `internal/testrun` を直接 import する harness | Go の internal package 規則で import できない。外部からは CLI 経由か、公開 API として切り出す変更が必要 |

「in-process なら速い」ではなく、「process 境界が持っていた隔離性を必要としないなら速い」という方が正しい。

## テストの意味を壊す条件

ここがいちばん大事なところだと思う。実行を速くする方法はいくらでもあるが、意味を壊したら test ではなくなる。

### 全部を 1 つの package state で回す

これはいちばん速く、そしていちばん危ない。package-level variable を mutate する test が 1 つあるだけで、後続 test の初期状態が変わる。upstream test は普通にこの種の状態を持つ。parse suite で 0.24s まで行ったが verdict が変わったのはこのためだった。shared mode は go test の既定意味に近い一方、process-per-test の代替としては弱い。

### isolated session を go test の既定意味と混同する

`--isolate` は便利だが、go test の既定ではない。go test は package init 1 回、test は同じ package state を逐次で共有する。isolated session は test ごとに package state を fork する。tmpltests のように「もともと 1 test 1 process」だった harness には合うが、go test と同じ意味を期待する場所に無断で適用すると意味が変わる。

### process-wide 状態を見落として並列化する

stderr capture、環境変数、cwd、固定 port、共有ファイル、グローバルな logging hook などは、test コード上は独立に見えても process 内では共有だ。並列化で test の意味が変わる典型はこれ。difffuzz では `want.stderr` を持つ case と `os.Setenv(` を含む case を serial に残した。完全な静的判定ではないが、この corpus では実害のある境界だった。

### timeout が実行を止めない

in-process 化で process kill が使えなくなると、timeout は「レポート上の期限」でしかなくなる。loop が回り続ければ後続 test は遅れ、cleanup が後続 test と重なればファイル削除や状態変更が衝突する。今回は VM process kill、loop back-edge check、unwind 完了待ち、`time.Sleep` の中断を入れた。それでも host 側で block したまま process 死亡を見ない操作は残りうる。

### benchmark の扱いを雑にする

`BenchmarkXxx` がファイルに存在することと、benchmark を実行することは別だ。`-bench` なしの go test は benchmark を compile するが実行しない。存在しただけで suite を fail にすると upstream stdlib test を取り込めない。逆に benchmark の結果を期待している場所では、今の `minigo test` はそもそも用途に合わない。

### verdict の oracle を変える

difffuzz は host `go` の出力と比較する differential test なので、実行方法を変えても oracle を変えてはいけない。tmpltests も upstream test の PASS/FAIL/PANIC 分布を維持する必要がある。速くした結果、全部 PASS になったのに元々 1 件 PANIC だったものまで消えたら、それは改善ではなく検査能力の喪失だ。今回 text/template は 45 PASS + 既存の `TestExecute` panic を維持した、という確認が重要だった。

## 余談: tagged オプションはなぜ要るのか

`--tagged` は効率化とは関係ないが、`minigo test` の設計で出てきた面白いオプションだ。

`--tags` は go test の `-tags` に近い。build constraint を変えるだけで、実行する test 集合そのものは絞らない。`//go:build story` のファイルを build に含めるが、build に入った untagged test も普通に走る。

一方、storybook 的な使い方では「`story` tag の下にだけある test helper と test を選びたい」ことがある。こちらは build を変えるだけでは足りない。実行集合も tag-gated なファイル由来の test に絞りたい。これが `--tagged <tag>` で、`<tag>` を build に足しつつ、plain build では選ばれず tag 付き build でだけ選ばれるファイルに宣言された test だけを実行対象にする。untagged test も build には含めるので helper の compile は保てるが、実行は skip 扱いになる。

つまり `--tags` は「世界を変える」フラグ、`--tagged` は「世界を変えたうえで、その世界にだけある test を選ぶ」フラグだ。go test にない機能なので名前を分けたのは正しいと思う。混ぜると、build tag を足しただけなのに untagged test が走らない、という驚きが出る。

## 残っている境界

現時点でも、`minigo test` は go test の完全互換ではない。external test package、Example output、Fuzz、TestMain、benchmark 実行はこれからの領域だ。timeout も interpreter の制御下にある実行には効くが、process 死亡を見ない任意の host blocking call までは保証しない。

それでも今回の効率化で分かったのは、速くする前に「もとの実行形態が何を隔離していたか」を書き出す必要がある、ということだ。process-per-test は遅いが、隔離の意味がはっきりしている。in-process session はその意味を残せるところでは強い。difffuzz の並列化も同じで、独立な fixture にだけ適用すれば速い。逆に、意味を壊す共有をすればもっと速くできるが、それは test の価値を下げる。

## 確認したもの

- [PR #1449](https://github.com/podhmo/minigo/pull/1449) の説明に記録された計測値と verdict 維持の記述
- `docs/sketch/plan-efficient-test-execution.md` の現状整理と採用/不採用の設計
- `docs/sketch/ja/exploration-minigo-test.md` の `minigo test` 設計、`--tags` / `--tagged` の分離
- `internal/testrun/run.go` / `internal/testrun/scan_gate.go` / `difffuzz_test.go` / `tools/tmpltests` の実装
- `make format`、`make lint`、`make test`、対象 race test、[PR #1449](https://github.com/podhmo/minigo/pull/1449) の CI 4 件

この記事自体の図は `tools/svg-gen/examples/fig-minigo-test-speed.mbtx` と `tools/svg-gen/examples/fig-minigo-test-isolation.mbtx` から生成した。
