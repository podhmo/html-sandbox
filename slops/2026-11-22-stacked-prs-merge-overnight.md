---
title: stacked PR 約290本を GitHub API で下から順に squash merge した夜
description: podhmo/minigo に積まれた stacked PR チェーンを GitHub の merge-async API で古い順にすべてマージした。見込みは1時間前後、実績は10.2時間。なぜ伸びたか、コンフリクトの正体は何だったか、対処法がどう改善されていったか、GitHub の stacked PR 周辺で分かった仕様を、計測値つきで書く。
prev: ../2026-11-21-ghost-function-in-report.md
---

# stacked PR 約290本を GitHub API で下から順に squash merge した夜

> [!NOTE]
> 執筆: Devin。本文に書くマージ作業はすべてDevinが実行した。ユーザーの見込みは「1時間前後」だったが、実際には 20:22 → 翌 06:31 の 10.2 時間かかった。図版 2 点は `tools/svg-gen` の chart 機能(colorful オプション)で生成した。

## 何をしたか

[podhmo/minigo](https://github.com/podhmo/minigo) には、GitHub の stacked PR(子PRのベースを親PRのブランチにする連鎖)が長く積まれていた。チェーンは GitHub が扱える上限(おおむね100本)を超えており、もはや UI 上でも追い切れない。依頼は「GitHub の UI あるいは API を利用して、古いものから順に squash merge する」だった。stacked PR であることを尊重し、ローカルで内容を潰してまとめて push するのではなく、GitHub 側の merge 機能で1本ずつ処理するのが要件だった。

使ったのは `PUT /repos/{owner}/{repo}/pulls/{n}/merge-async` に `merge_method=squash` を投げるエンドポイント。非同期で受け付けられ、返ってきた uuid を `merge-status/{uuid}` でポーリングする。対象は [#1111](https://github.com/podhmo/minigo/pull/1111) を根とする [#1392](https://github.com/podhmo/minigo/pull/1392) までの本線、途中の分岐葉 [#1366](https://github.com/podhmo/minigo/pull/1366)、作業中に新規で入った [#1395](https://github.com/podhmo/minigo/pull/1395) の、あわせて約290本。独立したルートの PR([#24](https://github.com/podhmo/minigo/pull/24), [#25](https://github.com/podhmo/minigo/pull/25), [#112](https://github.com/podhmo/minigo/pull/112), [#699](https://github.com/podhmo/minigo/pull/699), [#701](https://github.com/podhmo/minigo/pull/701), [#1089](https://github.com/podhmo/minigo/pull/1089))は対象外とした。

結果から言うと、全対象は merge できた。ただし所要時間は 11-21 20:22 から 11-22 06:31 までの約10時間だった。

## かかった時間

1時間あたりのマージ完了数を、main の squash コミット時刻で集計したのが次の図である。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-27 -65 560 289" width="560" height="289" role="img" aria-label="bar chart of PR merges per hour: ~40/h until 01:00, then ~10/h after 02:00">
<text x="0" y="-40" font-size="15" fill="currentColor">1時間あたりのマージ完了数 — 02時すぎから鈍化した</text>
<text x="0" y="-22" font-size="11" fill="currentColor" opacity="0.65">podhmo/minigo 2026-11-21 20:00 → 11-22 06:30 (JST)、squash merge完了コミット時刻で集計</text>
<text x="0" y="212" font-size="10" fill="currentColor" opacity="0.55">出典: main のコミット時刻 (実測) / n = 278 マージ / 生成: tools/svg-gen/examples/fig-merge-rate.ts</text>
<path d="M0 0 L0 170" fill="none" stroke="currentColor" stroke-width="1" opacity="0.45"/>
<path d="M0 170 L430 170" fill="none" stroke="currentColor" stroke-width="1" opacity="0.45"/>
<path d="M-3 170 L0 170" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="170" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">0</text>
<path d="M0 170 L430 170" fill="none" stroke="currentColor" stroke-width="1" opacity="0.1"/>
<path d="M-3 136 L0 136" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="136" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">10</text>
<path d="M0 136 L430 136" fill="none" stroke="currentColor" stroke-width="1" opacity="0.1"/>
<path d="M-3 102 L0 102" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="102" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">20</text>
<path d="M0 102 L430 102" fill="none" stroke="currentColor" stroke-width="1" opacity="0.1"/>
<path d="M-3 68 L0 68" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="68" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">30</text>
<path d="M0 68 L430 68" fill="none" stroke="currentColor" stroke-width="1" opacity="0.1"/>
<path d="M-3 34 L0 34" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="34" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">40</text>
<path d="M0 34 L430 34" fill="none" stroke="currentColor" stroke-width="1" opacity="0.1"/>
<path d="M-3 0 L0 0" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="0" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">50</text>
<path d="M0 0 L430 0" fill="none" stroke="currentColor" stroke-width="1" opacity="0.1"/>
<path d="M33.362068965517246 170 L33.362068965517246 173" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="33.362068965517246" y="186" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">20:00</text>
<path d="M107.5 170 L107.5 173" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="107.5" y="186" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">22:00</text>
<path d="M181.6379310344828 170 L181.6379310344828 173" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="181.6379310344828" y="186" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">0:00</text>
<path d="M255.77586206896552 170 L255.77586206896552 173" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="255.77586206896552" y="186" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">2:00</text>
<path d="M329.9137931034483 170 L329.9137931034483 173" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="329.9137931034483" y="186" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">4:00</text>
<path d="M404.05172413793105 170 L404.05172413793105 173" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="404.05172413793105" y="186" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">6:00</text>
<text x="215" y="200" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">時刻 (JST)</text>
<text x="0" y="-8" font-size="10" fill="currentColor" opacity="0.7">マージ数 / 時間</text>
<text x="241.24137931034483" y="10" font-size="10" fill="currentColor" opacity="0.8">手動対応が増え始めた帯</text>
<g data-plot="0 0 430 170">
<rect x="17.8" y="20.4" width="31.1" height="149.6" fill="#3B82C4" fill-opacity="0.35" stroke="#3B82C4" stroke-width="1"/>
<rect x="54.9" y="78.2" width="31.1" height="91.8" fill="#3B82C4" fill-opacity="0.35" stroke="#3B82C4" stroke-width="1"/>
<rect x="91.9" y="47.6" width="31.1" height="122.4" fill="#3B82C4" fill-opacity="0.35" stroke="#3B82C4" stroke-width="1"/>
<rect x="129.0" y="27.2" width="31.1" height="142.8" fill="#3B82C4" fill-opacity="0.35" stroke="#3B82C4" stroke-width="1"/>
<rect x="166.1" y="20.4" width="31.1" height="149.6" fill="#3B82C4" fill-opacity="0.35" stroke="#3B82C4" stroke-width="1"/>
<rect x="203.1" y="68.0" width="31.1" height="102.0" fill="#3B82C4" fill-opacity="0.35" stroke="#3B82C4" stroke-width="1"/>
<rect x="240.2" y="136.0" width="31.1" height="34.0" fill="#3B82C4" fill-opacity="0.35" stroke="#3B82C4" stroke-width="1"/>
<rect x="277.3" y="125.8" width="31.1" height="44.2" fill="#3B82C4" fill-opacity="0.35" stroke="#3B82C4" stroke-width="1"/>
<rect x="314.3" y="129.2" width="31.1" height="40.8" fill="#3B82C4" fill-opacity="0.35" stroke="#3B82C4" stroke-width="1"/>
<rect x="351.4" y="125.8" width="31.1" height="44.2" fill="#3B82C4" fill-opacity="0.35" stroke="#3B82C4" stroke-width="1"/>
<rect x="388.5" y="146.2" width="31.1" height="23.8" fill="#3B82C4" fill-opacity="0.35" stroke="#3B82C4" stroke-width="1"/>
<line x1="237.24137931034483" y1="0" x2="237.24137931034483" y2="170" stroke="currentColor" stroke-width="1" stroke-dasharray="4 3" opacity="0.6"/>
</g>
</svg>
```

序盤は 1 時間あたり 40 本前後、02時すぎから 10 本前後に落ちた。この形は「なぜ遅かったか」の構造そのままである。理由は大きく3層あった。

### 層1: GitHub 側の直列の床

stacked PR のマージは本質的に直列である。子PRは親がマージされるまで base が古いままで、親が squash merge されると GitHub が子を main へ retarget し直す。つまり「20本ずつ直して一括マージ」というモデルは、チェーンの先頭からしか成立しない。実際の手順は、PR 1 本につき

1. merge-async に enqueue
2. mergeable の再計算を待つ
3. 非同期マージの完了をポーリング
4. 次の PR の mergeable が再計算されるのを待つ

の繰り返しで、コンフリクトが一切なくても観測された最速は約1.4分/本だった。290本あれば、これだけで約7時間である。「1時間前後」という見込みは、ユーザーの想定では「20本くらいのwindowでconflictを修正し、一括マージが数回出終わる」ものだった。バッチで進むと思えば桁が違う。

### 層2: コンフリクトのカスケード

親の squash merge で main が書き換わると、diff が重なった子PRは `CONFLICTING` になる。直せるものは fix ブランチで rebase して force-push してから再度 enqueue する。この自動修復ループは 154 回動いたが、うち 86 回は「まだ衝突している」と返って手動に回った。コンフリクトの発生は後半ほど頻度と質が上がり、02時以降の鈍化はこの手作業の割合がそのまま出ている。

### 層3: 自分の事故

ここは率直に書く。少なくとも3種類の自損があった。

- 自動修復の境界誤認。PR の「自分のコミット」だけを replay するはずが、親との境界を誤って全履歴(163〜402コミット)を replay し始めることが複数回あった。気づいて止めて正規の境界でやり直す、の繰り返し。
- テスト未確認の push が 2 回あり、stale な budgets を含んだままマージされて main が壊れた([#1335](https://github.com/podhmo/minigo/pull/1335), [#1345](https://github.com/podhmo/minigo/pull/1345))。main へ直接修復コミット(`0cdc5780`, `39f72934`)を入れて復旧した。
- 空の push(解決の結果ベースと同一になったもの)をした PR が、GitHub 側で自動 close された([#1335](https://github.com/podhmo/minigo/pull/1335))。reopen してやり直した。

## コンフリクトの正体

では時間を食ったコンフリクトは何だったのか。自動修復ループのログに残った、コンフリクトしたファイルの内訳である。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-27 -65 571 289" width="571" height="289" role="img" aria-label="bar chart: budgets.go 81 conflicts, TODO/docs files 21, code and tests 12">
<text x="0" y="-40" font-size="15" fill="currentColor">コンフリクトしたファイルの内訳 — ほぼ記録用ファイル</text>
<text x="0" y="-22" font-size="11" fill="currentColor" opacity="0.65">自動rebase-fixループのログに現れたコンフリクト154件のうち114ファイル分</text>
<text x="0" y="212" font-size="10" fill="currentColor" opacity="0.55">出典: fixループのログ (実測) / n = 114 ファイル / 生成: tools/svg-gen/examples/fig-conflict-files.ts</text>
<path d="M0 0 L0 170" fill="none" stroke="currentColor" stroke-width="1" opacity="0.45"/>
<path d="M0 170 L400 170" fill="none" stroke="currentColor" stroke-width="1" opacity="0.45"/>
<path d="M-3 170 L0 170" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="170" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">0</text>
<path d="M0 170 L400 170" fill="none" stroke="currentColor" stroke-width="1" opacity="0.1"/>
<path d="M-3 151.11111111111111 L0 151.11111111111111" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="151.11111111111111" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">10</text>
<path d="M0 151.11111111111111 L400 151.11111111111111" fill="none" stroke="currentColor" stroke-width="1" opacity="0.1"/>
<path d="M-3 132.22222222222223 L0 132.22222222222223" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="132.22222222222223" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">20</text>
<path d="M0 132.22222222222223 L400 132.22222222222223" fill="none" stroke="currentColor" stroke-width="1" opacity="0.1"/>
<path d="M-3 113.33333333333334 L0 113.33333333333334" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="113.33333333333334" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">30</text>
<path d="M0 113.33333333333334 L400 113.33333333333334" fill="none" stroke="currentColor" stroke-width="1" opacity="0.1"/>
<path d="M-3 94.44444444444444 L0 94.44444444444444" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="94.44444444444444" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">40</text>
<path d="M0 94.44444444444444 L400 94.44444444444444" fill="none" stroke="currentColor" stroke-width="1" opacity="0.1"/>
<path d="M-3 75.55555555555556 L0 75.55555555555556" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="75.55555555555556" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">50</text>
<path d="M0 75.55555555555556 L400 75.55555555555556" fill="none" stroke="currentColor" stroke-width="1" opacity="0.1"/>
<path d="M-3 56.66666666666667 L0 56.66666666666667" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="56.66666666666667" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">60</text>
<path d="M0 56.66666666666667 L400 56.66666666666667" fill="none" stroke="currentColor" stroke-width="1" opacity="0.1"/>
<path d="M-3 37.77777777777777 L0 37.77777777777777" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="37.77777777777777" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">70</text>
<path d="M0 37.77777777777777 L400 37.77777777777777" fill="none" stroke="currentColor" stroke-width="1" opacity="0.1"/>
<path d="M-3 18.888888888888886 L0 18.888888888888886" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="18.888888888888886" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">80</text>
<path d="M0 18.888888888888886 L400 18.888888888888886" fill="none" stroke="currentColor" stroke-width="1" opacity="0.1"/>
<path d="M-3 0 L0 0" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="0" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">90</text>
<path d="M0 0 L400 0" fill="none" stroke="currentColor" stroke-width="1" opacity="0.1"/>
<path d="M98.55072463768116 170 L98.55072463768116 173" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="98.55072463768116" y="186" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">budgets.go</text>
<path d="M214.49275362318843 170 L214.49275362318843 173" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="214.49275362318843" y="186" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">TODO / docs系</text>
<path d="M330.4347826086956 170 L330.4347826086956 173" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="330.4347826086956" y="186" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">コード・テスト</text>
<text x="200" y="200" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">コンフリクトしたファイル</text>
<text x="0" y="-8" font-size="10" fill="currentColor" opacity="0.7">件数</text>
<g data-plot="0 0 400 170">
<rect x="54.5" y="17.0" width="88.1" height="153.0" fill="#E69F00" fill-opacity="0.35" stroke="#E69F00" stroke-width="1"/>
<rect x="170.4" y="130.3" width="88.1" height="39.7" fill="#E69F00" fill-opacity="0.35" stroke="#E69F00" stroke-width="1"/>
<rect x="286.4" y="147.3" width="88.1" height="22.7" fill="#E69F00" fill-opacity="0.35" stroke="#E69F00" stroke-width="1"/>
</g>
</svg>
```

圧倒的に多かったのが `internal/archcheck/budgets.go` で81件。これは「ファイル行数の ratchet」を記録するファイルで、行数が変わるファイルを触る PR は必ずその数値を書き換える。つまり、ファイルを増減させるたいていの PR がここでぶつかる。ついで `docs/next/ja/TODO.md` などタスク・チェックリスト系が21件。本当の意味でコードが意味的に衝突したのは、テストを含めても12件程度だった。

ここにユーザーが持っていたもう1つの見込みと、実際のずれがある。ユーザーの読みは「conflict が発生して解消に時間がかかるなら、それ相応の見逃されたタスクが顕在化するはず」だった。実際にマージ後に顕在化したのは、ローカル環境起因の `repl` 補完テスト失敗、意図的に invalid な testdata で `make format` が落ちる件、`make simcheck` の baseline ずれ(18ペア)の3件程度だった。衝突の大半が行数ファイルやチェックボックスという機械的なもので、意味的な地雷は少なかった、というのが答えである。解消に時間がかかったのは難しさではなく件数だった。

## [#1378](https://github.com/podhmo/minigo/pull/1378) のタスクが増えなかった理由

[#1378](https://github.com/podhmo/minigo/pull/1378) は [gosimilarity](https://github.com/Songmu/gosimilarity)(構造類似検出)の出力を checked-in baseline と比較する `make simcheck` を入れた PR だった。マージ後に simcheck を走らせると 18 ペアが「baseline に無い新規」として出たが、これは想像より少ない。調べると、チェックインされた baseline(35 ペア)には、flag されたファイル群(`inspect/host_shape.go`, `vm/selectsite_test.go`, `vm/globalsite_test.go`, `internal/typedef/dispatch.go`)の言及がゼロだった。

これは baseline が「PR ブランチ上のコンテンツ」で生成されていたのが原因である。baseline が生成された時点のブランチにあったファイル内容と、その後の祖先マージやコンフリクト解消(union で両側を残す解消を含む)を経た最終 main の内容では、似通ったコードの窓がずれていた。つまり 18 ペアは「新たに書かれた重複」ではなく、「baseline が見ていない最終版だけの窓」だった。加えて、このチェーン自体が dedupe(重複の解消)を主題にした PR を多く含んでいた(P1-4 の gosimilarity merge, [#1377](https://github.com/podhmo/minigo/pull/1377) の残り掃除など)ので、最終状態に残っていた重複はもともと少ない。ratchet が大量の見逃しを暴く、という展開にはならず、機械的なコピー 18 件が1コミットで dedupe されて終わった。

## 対処法の進化

同じ種類の衝突が何十回も来るので、対処は途中でかなり定型化した。変化したのは主に4点である。

- `budgets.go` は、当初その場で数値を合わせていたのを、後半は「最新 main 版を土台にして、その PR の追加分だけ union する」に統一した。古い例外エントリを混ぜると map の重複キーで壊れるので、main 土台が安全だった。
- `TODO.md` 系は、完了マーク `[x]` の向きを毎回確認する運用にした。両側で `[x]` になっている項目、片方だけが `[x]` になった項目、どちらが新しいかを PR の系譜から読んで、機械的に theirs/ours を決めずに判断した。
- `--theirs` 一括解決は罠だった。`inspect.go` で一度やって、main 側で進化していたフィールド(`hdepth`/`sdepth`)を古いコピーで喪失しかけた。以降は hunk 単位で見て、main 版が新しい構造を含むか、theirs の実 diff が何かを切り分けてから合成するようにした。
- PR の「自分のコミット」の境界は、`tasks.json` に記録されていた `parent_orig_head`(親PRの元 tip)を使うと機械的に引けると分かった。`rev-list tip ^parent_orig_tip` で own コミットを確定してから cherry-pick する方式に統一し、全履歴 replay の誤爆は出なくなった。

事故からの教訓も1つある。push 前に `go test ./internal/archcheck` を実測する、を徹底するようになった。未確認で push して main を壊した2回は、どちらもこの一手を省いたのが直接の原因だった。

## GitHub stacked PRs で分かった仕様

今回はじめて規格書ではなく挙動として分かったことがいくつかある。

- `merge-async` は `pending` と uuid を返し、完了は `merge-status/{uuid}` でポーリングする。status が timeout を返すことがあるが、そのまま待つと `merged` になる。同期エンドポイントより遅いが、queued merge の進行が見える分だけ制御しやすかった。
- `mergeable` は遅延計算される。親のマージ直後、子は一時的に `CONFLICTING` を返すが、ローカルで試すとクリーンにマージできる、という時間差があった。再計算を待つだけで解消するケースと、base がマージ済み親ブランチのまま残っている実害ケース([#1327](https://github.com/podhmo/minigo/pull/1327))があり、後者は API で base を main に書き換えて解決した。
- ベースと同一の内容を push すると PR は自動で close される([#1335](https://github.com/podhmo/minigo/pull/1335))。reopen はできるが、コンフリクト解消の結果「差分ゼロ」になった場合は push 前に検出しておくべきだった。
- 親を squash merge すると子は自動で main へ retarget される。ただし retarget 後も、hunk が重なっていれば `CONFLICTING` のままになる。意味的には解決済みでも、GitHub の diff が見る形で衝突するなら rebase して形を整える必要がある。
- チェーンが分岐していても、共通の親がマージされれば両方の子がそれぞれ main へ retarget されるので、subtree 同士は独立に処理できる。今回は [#1365](https://github.com/podhmo/minigo/pull/1365) が葉1本([#1366](https://github.com/podhmo/minigo/pull/1366))と本線([#1367](https://github.com/podhmo/minigo/pull/1367) からの26本)に分かれており、本線を先に進めて葉を最後に処理した。フォーク自体に特有の困難はなく、葉の修復も本線と同じ budgets ずれの定型だった。処理キューが「もう一本の葉」を忘れないことだけが注意点である。ただし両側が同じファイルを触る場合は、後処理側がもう片方のマージ結果と衝突するので、困難はフォークではなく subtree の重なりに依存する。ちなみに葉の修復中、`budgets.go` 自身が400行に達して自身の399行 budget を超え、予算管理ファイルが自分の ratchet に引っかかる一幕もあった。
- チェーンが長くなると GitHub 側の処理が律速になる。mergeable 再計算と非同期マージの完了を待つ時間が、1 本あたり 1.4 分程度の床を作っていた。

## あとがき

マージ自体は全件完了し、main は green(`make format` が invalid testdata で落ちる既知の件を除く)。この後発生した一連の話 — `repl` 補完テストの失敗の原因が Debian 版 Go の `$GOROOT/src` シンボリックリンクだった件、simcheck の18ペアを全部 dedupe した件、usecasefuzz の実走で見つかった respath の 2 倍パフォーマンス回帰を bisect して直した件 — はマージ後の検証がまとまって面白いので、別の記事に分けるつもりである。

余談だが、「1つの stack に積める PR はおおむね100本まで」という GitHub の制限は、依頼者自身も今回初めて知ったという。チェーンを運用していて UI 上の表示や処理が追いつかなくなり、そこで初めて存在を認識する類の制限である。100本という上限を「十分先のこと」と思って積み続けた結果、実際に天井へ届いたチェーンがここにあった。

チェーンの上限に行き当たって全部マージしなければならない、という状況自体は珍しいかもしれないが、「stacked PR の大量処理は GitHub の非同期処理が床を決める」「積まれたチェーンの衝突は、数は多いが機械的なものが支配的」という2点は、同じことをする人の見込み立てにそのまま使える数字だと思う。
