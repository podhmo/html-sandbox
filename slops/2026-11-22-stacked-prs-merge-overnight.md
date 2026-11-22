---
title: stacked PR 約290本を GitHub API で下から順に squash merge した夜
description: podhmo/minigo に積まれた stacked PR チェーンを GitHub の merge-async API で古い順にすべてマージした。見込みは1時間前後、実績は10.2時間。なぜ伸びたか、コンフリクトの正体は何だったか、対処法がどう改善されていったか、GitHub の stacked PR 周辺で分かった仕様を、計測値つきで書く。
prev: ../2026-11-21-ghost-function-in-report.md
---

# stacked PR 約290本を GitHub API で下から順に squash merge した夜

> [!NOTE]
> 執筆: Devin。本文に書くマージ作業はすべてDevinが実行した。ユーザーの見込みは「1時間前後」だったが、実際には 20:22 → 翌 06:31 の 10.2 時間かかった。図版 3 点は `tools/svg-gen` で生成した(棒グラフ 2 点は chart 機能の colorful オプション、ツール連携図は Canvas 直描き)。

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

圧倒的に多かったのが [`internal/archcheck/budgets.go`](https://github.com/podhmo/minigo/blob/ba5f23c0/internal/archcheck/budgets.go) で81件[^budgets]。これは「ファイル行数の ratchet」を記録するファイルで、行数が変わるファイルを触る PR は必ずその数値を書き換える。つまり、ファイルを増減させるたいていの PR がここでぶつかる。ついで `docs/next/ja/TODO.md` などタスク・チェックリスト系が21件。本当の意味でコードが意味的に衝突したのは、テストを含めても12件程度だった。

ここにユーザーが持っていたもう1つの見込みと、実際のずれがある。ユーザーの読みは「conflict が発生して解消に時間がかかるなら、それ相応の見逃されたタスクが顕在化するはず」だった。実際にマージ後に顕在化したのは、ローカル環境起因の `repl` 補完テスト失敗、意図的に invalid な testdata で `make format` が落ちる件、`make simcheck` の baseline ずれ(18ペア)の3件程度だった。衝突の大半が行数ファイルやチェックボックスという機械的なもので、意味的な地雷は少なかった、というのが答えである。解消に時間がかかったのは難しさではなく件数だった。

### そもそも conflict はなぜ起きたか

後から振り返ると、squash merge の連鎖そのものは衝突をほぼ生まない。子PRの3-way mergeの merge-base は親の squash 前 tip(子の祖先として残っている)なので、ブランチの内容と squash 結果が同じなら `base == ours` で機械的にマージできる。綺麗な stack であれば、squash だけでは衝突しない。

実際に衝突を生んでいたのは修復プロセスの方だった。`--union` で両側の行を残す、`--theirs` で片側を取る、`fix_budgets()` が実測値で数値を書き換える、といった解決は「親の本来の内容とは異なる内容」を main に流し込む。下流の子の merge-base は親の元の tip のままなので、修復が触った行を子も触っていれば必ず衝突する。「修復 → merge → 次の子が再び衝突 → また修復」というループの構造的原因はここにある。つまり衝突の大部分は、squash collapse ではなく修復差分の cascade だった。

これに budgets.go のような「全リポジトリ横断ファイル」が掛け合わさる。行数 ratchet はあらゆるPRが同じ行領域を書き換えるので、セマンティックに無関係な変更同士でもテキスト上は確実に重なる。下に積んだ PR がレビューで更新されれば、更新が子の変更領域とテキスト上重なったときだけ衝突が起きる — 起きない保証はないが、必ず起きるわけでもない。「レビュー待ちの間に次を積む」という運用自体が衝突を内包するワークフローであり、Graphite や git-spr が「親が変わったら子を restack する」作業を自動化するのはまさにこのためである。今回はそういうツールなしの290本だったので、その作業が `restack.py` という形で表面化した。

なお GitHub の検知については、されていなかったわけではない。`mergeable=CONFLICTING` がちゃんと立ち、修復のトリガーとして使えた。ただし制約が2つある: 判定は常に「現在の base」に対してのみ行われ、stacked 中の base=親ブランチでは構造上ほぼ常に clean で、衝突は親の merge → retarget の瞬間まで顕在化しない。そして mergeable は遅延計算+キャッシュなので、retarget 直後は `UNKNOWN` や古い値が返る時間窓がある。検知はできるが事後で、eventually consistent という形だった。

### budgets.go の設計自体も問題では

ここまで書くと、[budgets.go](https://github.com/podhmo/minigo/blob/ba5f23c0/internal/archcheck/budgets.go) の仕組みそのものに問題があるという見方が自然に出てくる。[`TestFileBudgetsMatchRepo`](https://github.com/podhmo/minigo/blob/ba5f23c0/internal/archcheck/archcheck_test.go#L88) は `budget == 実測行数` の完全一致を要求する。つまりこのファイルの正しい内容は「リポジトリ全体の状態の関数」であり、どこかのPRがファイルの行数を変えるたびに、飛行中の他PRの budgets.go は全域で stale になる。ファイルサイズを変えるほぼ全PRがこのファイルを編集するので、これは実質的に全PRを直列化するグローバルロックである。

結果は2つの形で現れた。1つは今回の81件の衝突という「PRごとの修復コミット」ルート。もう1つは、CIが古いbaseの時点でgreenだったPRがそのままマージされると、stale な budgets.go が main に着地して `TestFileBudgetsMatchRepo` が赤くなる「静かな破壊」ルート — 実際に2回発生し、修復コミット(`0cdc5780`, `39f72934`)で対処した。ratchet の意図(ファイルの静かな肥大化を止める)は正当だが、完全一致のミラーファイルという表現が並行開発と相性が悪い。同じ構造のファイルは他にもあり、`similarity-baseline.json` や `TODO.md` の `[x]` マークも「リポジトリ全体の状態の関数である checked-in ファイル」として同じ種類の hotspot になる。

この問題は minigo 側の issue として記録した: [#1396](https://github.com/podhmo/minigo/issues/1396)。差分スコープ化・base 相対 ratchet・パッケージ分割・merge 時の自動再生成、といった緩和の方向もそこにまとめてある。TODO.md の対応エントリもこの issue へのリンクになっている。

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

## /tmp に置いた使い捨てツール

自動化の実体は、すべて `/tmp` に置いた捨てスクリプトだった。全体像を先に図で示す。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="18 18 1033.1999999999998 381.4" width="1033" height="381" role="img" aria-label="throwaway /tmp tooling: scan, queue, merge loop, supervisor, repair">
<rect x="30" y="30" width="109.00000000000001" height="36" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="84.5" y="48" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">gh pr list</text>
<rect x="30" y="90" width="93.60000000000002" height="36" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="76.80000000000001" y="108" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">prs.json</text>
<path d="M83.58351371490441 68.85658062886937 L77.7164862850956 87.14341937113063" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M76.60956129140872 77.3364209996435 L77.7164862850956 87.14341937113063 L84.322328989356 79.81093396940157" fill="none" stroke="currentColor" stroke-width="1.5"/>
<rect x="30" y="150" width="132.10000000000002" height="36" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="96.05000000000001" y="168" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">git ls-remote</text>
<rect x="30" y="210" width="139.8" height="40" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="99.9" y="220.9" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">orig_heads.txt</text>
<text x="99.9" y="239.1" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">252 tips</text>
<path d="M96.5251748772956 188.96212910521928 L99.42482512270442 207.03787089478072" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M94.00042619877163 198.79296966347198 L99.42482512270442 207.03787089478072 L101.99817478286366 197.50999749477387" fill="none" stroke="currentColor" stroke-width="1.5"/>
<rect x="230" y="140" width="209.09999999999997" height="52" rx="8" fill="none" stroke="#E69F00" stroke-width="1.5"/>
<text x="334.54999999999995" y="156.9" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">tasks.json</text>
<text x="334.54999999999995" y="175.1" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">{num,head,parent_num,…}</text>
<path d="M126.60000000000002 108 L205 108 L205 166 L227 166" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M218 170.05 L227 166 L218 161.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M172.79977748636705 229.963461906378 L334 228 L334.5041720147209 194.99964994553787" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M338.4162154853599 204.06046756227815 L334.5041720147209 194.99964994553787 L330.31716063240765 203.93673200202474" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="30" y="270" font-size="12" fill="currentColor" opacity="0.75">走査: base→head の解決 + tip凍結 → トポロジカル順のキュー</text>
<rect x="460" y="120" width="124.40000000000002" height="52" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="522.2" y="136.9" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">mergeall.py</text>
<text x="522.2" y="155.1" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">enqueue→poll</text>
<path d="M441.26747506566403 163.92586118118274 L457.83252493433594 148.07413881881726" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M454.1301871427471 157.2226466139155 L457.83252493433594 148.07413881881726 L448.5300123319405 151.3704639366226" fill="none" stroke="currentColor" stroke-width="1.5"/>
<rect x="460" y="195" width="147.50000000000003" height="36" rx="8" fill="none" stroke="#E69F00" stroke-width="1.5"/>
<text x="533.75" y="213" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">merge_done.json</text>
<path d="M523.5463012763248 174.68094626454285 L532.4036987236752 192.31905373545715" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M524.7455174375681 186.09372166486705 L532.4036987236752 192.31905373545715 L531.9840723518338 182.45870821879012" fill="none" stroke="currentColor" stroke-width="1.5"/>
<rect x="460" y="245" width="124.40000000000002" height="36" rx="8" fill="none" stroke="#E69F00" stroke-width="1.5"/>
<text x="522.2" y="263" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">mergeall.log</text>
<path d="M531.8408511356133 233.31411983562023 L524.1091488643867 242.68588016437977" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M526.7125336794594 233.16616969059703 L524.1091488643867 242.68588016437977 L532.9606572356341 238.3208716244411" fill="none" stroke="currentColor" stroke-width="1.5"/>
<rect x="640" y="50" width="116.70000000000002" height="90" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="698.35" y="76.8" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">GitHub</text>
<text x="698.35" y="95" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">merge-async</text>
<text x="698.35" y="113.2" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">squash</text>
<path d="M584.9208904213467 142.12977091518482 L636.0992862340373 95.185558928724" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M632.2045368622122 104.25382377546661 L636.0992862340373 95.185558928724 L626.7292230439342 98.28465812259894" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M639.4791095786533 98.87022908481516 L588.3007137659627 145.81444107127598" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M592.1954631377878 136.74617622453337 L588.3007137659627 145.81444107127598 L597.6707769560658 142.71534187740104" fill="none" stroke="currentColor" stroke-width="1.5"/>
<rect x="640" y="195" width="116" height="40" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="698" y="205.9" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">drive.py</text>
<text x="698" y="224.1" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">終盤の単発版</text>
<path d="M698.0190905225512 192.00006074195682 L698.3309094774488 142.99993925804318" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 4"/><path d="M702.3235559081536 152.02552923761684 L698.3309094774488 142.99993925804318 L694.223719911437 151.97398482672864" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 4"/>
<rect x="230" y="285" width="137.7" height="44" rx="8" fill="none" stroke="#CC79A7" stroke-width="1.5"/>
<text x="298.85" y="297.9" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">watchmerge.sh</text>
<text x="298.85" y="316.1" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">再起動+衝突検出</text>
<path d="M457 263 L420 263 L420 307 L370.7 307" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M379.7 302.95 L370.7 307 L379.7 311.05" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="230" y="258" font-size="12" fill="currentColor" opacity="0.75">log: merge conflict</text>
<rect x="430" y="295" width="232.19999999999993" height="56" rx="8" fill="none" stroke="#56B4E9" stroke-width="1.5"/>
<text x="546.0999999999999" y="313.9" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">fixconflict.py / fixone.sh</text>
<text x="546.0999999999999" y="332.1" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">(restack.py, fix_budgets)</text>
<path d="M370.6057036547169 307.7462481296223 L427.0942963452831 322.2537518703777" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M417.36975040614226 323.93770741537855 L427.0942963452831 322.2537518703777 L419.3846203561225 316.0923075476429" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M665.1999999999999 323 L850 323 L850 95 L759.7 95" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M768.7 90.95 L759.7 95 L768.7 99.05" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="858" y="215" font-size="12" fill="currentColor" opacity="0.75">force-push → mergeableに戻す</text>
<text x="30" y="370" font-size="12" fill="currentColor" opacity="0.75">青=走査  橙=状態/キュー  緑=ドライバ  紫=監督  空色=修復  朱=GitHub</text>
<text x="430" y="385" font-size="12" fill="currentColor" opacity="0.75">修復ルール: budgets→--theirs, TODO→--union+dedupe / それ以外は停止して人間へ</text>
</svg>
```

土台の `/tmp/tasks.json` は次のように作った。

- `gh pr list --json number,baseRefName,headRefName` で open PR を全件取得(`/tmp/prs.json`)
- `headRefName → PR番号` の対応表を作り、各 PR の `baseRefName` がどの PR の head かを解決して親子関係を復元。`base=main` がルート(6件見つかり、本命は [#1111](https://github.com/podhmo/minigo/pull/1111))、同じ親を持つ子が2本ある点がフォーク([#1365](https://github.com/podhmo/minigo/pull/1365) → [#1366](https://github.com/podhmo/minigo/pull/1366) と [#1367](https://github.com/podhmo/minigo/pull/1367))
- `git ls-remote` で全 devin/* ブランチの tip SHA を採取(`/tmp/orig_heads.txt`、252件)
- チェーンをトポロジカル順に並べ、`{num, head, head_orig, parent_num, parent_orig_head}` の行を書き出したものが `tasks.json`(232件。生成時点では #1157 まで処理済みだったので、残り全部が入っている)

`head_orig` と `parent_orig_head`(走査時点の tip の記録)が後の自動化の要になった。親が squash merge・ブランチ書き換えで消えても、`rev-list tip ^parent_orig_tip` で「その PR 自身のコミット」を機械的に確定できる。

その上に載せたツールは次の5つである。

- `mergeall.py` — 本線ドライバ。`tasks.json` 順に `PUT merge-async squash` を投げ、返ってきた uuid を `merge-status` でポーリング。timeout でも merged まで待つか再 enqueue する。`merge_done.json` に進捗を記録して中断・再開可能にした
- `watchmerge.sh` — 監督ループ。`mergeall.py` が死んだら再起動し、ログに merge conflict が出たら `fixconflict.py` をその PR へ走らせる。修復後も同じ PR が衝突したままなら「人間に返す」と記録して先へ進む
- `restack.py` / `fixconflict.py` / `fixone.sh` — 衝突修復の3世代。`rebase --onto` で own コミットを親の新 tip へ載せる方式から、cherry-pick で1個ずつ積む方式へ。いずれも budgets.go は `--theirs`、TODO.md は `--union` + 重複行除去で自動解決し、それ以外のファイルが衝突したら止まる設計は共通だった
- `drive.py` — 終盤の単発ドライバ。1 PR ぶん enqueue → ポーリングだけを回す
- `fix_budgets()`(restack 系スクリプト内の関数) — `go test ./internal/archcheck` の失敗文面を正規表現でパースし、`budgets.go` の該当行の数値を実測値へ書き換えるループ。これが budgets ずれ 81 件を機械化できた理由である

要するに「状態ファイル(tasks.json / state.json / done.json)+ 失敗ログを読んで立て直す監督スクリプト + 衝突種別ごとの機械解決」という、長時間稼働前提の雑な自動化だった。雑であるが故に全履歴 replay のような誤爆も起きたわけだが、修復ルールをファイル種別で切り分けられたのは効いた。

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

[^budgets]: budgets.go は「ファイル → 行数」の map をリポジトリに checked-in する行数 ratchet(M1-4、ファイル分割キャンペーンの成果を守るガード)。`make archcheck` と `go test ./internal/archcheck` の `TestFileBudgetsMatchRepo` が、全エントリと実測値の完全一致を要求する(増減どちらでも fail、新規ファイルは未登録で fail、削除ファイルの残存も fail)。ファイルを増やす変更をするときは、該当エントリを実測値に更新するか、あるいはファイルを分割するかを選ぶ — という運用で「うっかり肥大化したファイル」を検出するのが目的の仕組み。なお PR 向け CI には別途、merge-base の budgets と比べて既存エントリを増やしていないか見る相対 ratchet もある。
