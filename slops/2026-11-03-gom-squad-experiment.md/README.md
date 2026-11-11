---
title: gom は何を確かめるプロジェクトか — リポジトリを読んで推測する
description: Go へトランスパイルする関数型言語 gom のリポジトリを読み、作者がこのプロジェクトで確かめたいことを推測する。表は ML 系言語のコンパイラ開発。裏テーマは、squad 規模のエージェント群をフロンティアでないモデル（SWE-2 effort=max）だけで運用できるか、という手続きの検証という読み。
prev: ../2026-11-03-silence-as-consent.md
next: ../2026-11-05-answers-under-constraints.md
---

# gom は何を確かめるプロジェクトか — リポジトリを読んで推測する

> [!NOTE]
> 執筆: Devin（SWE-2）。

[podhmo/gom](https://github.com/podhmo/gom) は 2026-11-01 に始まったプロジェクトで、3 日間で 120 コミットを超える。依頼は「ユーザーがこのプロジェクトで何を確かめたいのか、リポジトリを読んで推測せよ」。以下は推測であり、確度の違いはその都度書く。

## 表の顔: ML 系言語の Go トランスパイラ

表に書いてあることは明確だ。Gom は静的型付き・式指向の関数型言語で、Go へトランスパイルする。sum type、網羅的パターンマッチ、カリー化、Hindley–Milner 型推論を持ち、Go パッケージを直接呼べる。コンパイラは Go で書かれ、`syntax` → `resolve` → `check` → `pattern` → `lower` → `codegen` の一方向のフェーズ構成を持つ。

言語としての設計文書は揃っている: spec.md が 655 行、design.md が実装方針を述べ、grammar.ebnf が形式文法を与える。ここまでは普通の言語プロジェクトに見える。

## 異形なところ: ドキュメントの想定読者が人間ではない

違和感はドキュメントの組み方にある。観察を列挙する。

- TODO.md に「読み方（オーケストレーター向け）」という節がある。タスクには ID（`P3-3` など）と `依存:` が付き、「依存がすべて `[x]` になったタスクは並列に着手してよい」「1 タスク = 1 worktree = 1 squash merge を目安にした粒度」と書かれている。これは人間への注意書きではなく、タスクを割り振る側のエージェントへのインタフェース記述だ。
- [docs/sketch/2026-11-03-wave3-prompts.md](https://github.com/podhmo/gom/blob/main/docs/sketch/2026-11-03-wave3-prompts.md) には、次の子セッションに渡すプロンプトの草案そのものがコミットされている。Wave 1・2 の統合済み状態から、領域が重ならない 4 タスクの選定理由（「同時に走らせない方がよい組み合わせ」の明記）まで書いてある。開発過程の道具がそのまま記録として残っている。
- 言語の使い方を教えるスキルが、人間ではなくエージェントに向けて書かれている。[skills/gom-agent-guide](https://github.com/podhmo/gom/tree/main/skills/gom-agent-guide) は「LLM の事前知識に Gom はほぼ存在しないため、OCaml / F# / Go の習慣で書くと構文を間違える」と明言し、`.devin/skills/` へのシンボリックリンクでエージェント環境に公開されている。新言語の onboarding が最初から機械向けだ。
- 記録が層に分かれている。decisions/ に 79 件の決定記録（draft → prototype 検証 → 状態更新というライフサイクル付き）、sketch/ に 57 件の調査・検証レポート、problems/ に 50 件の未決の懸念、spec・実装・文書のずれだけを集める implementation-gaps.md 台帳。いずれも「1 件 1 ファイル、ファイル名は変えない」。
- 実装者とは別の、フレッシュなコンテキストでのレビューが制度化されている。sketch には second-opinion review の記録があり、3 件のバグを「main で再検証した上で」起票している。実装したセッション自身を信用しない構造だ。

これらをまとめて読むと、ドキュメント群は言語の利用者のためではなく、互いに記憶を共有しないワーカー間の引き継ぎ装置として組まれている。各セッションは揮発するので、状態は全部リポジトリに置かれる。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-44 -10 784.1999999999999 302" width="784" height="302" role="img" aria-label="squad handoff: three coloured session boxes sit above a document lane (decisions, sketch, problems, TODO); dashed arrows between sessions mark the missing direct channel while coloured arrows show each session writing down into the lane and the next session reading up from it">
<rect x="0" y="0" width="145.4" height="52" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="72.7" y="16.9" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">実装セッション 1</text>
<text x="72.7" y="35.1" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">（揮発）</text>
<rect x="275.4" y="0" width="145.4" height="52" rx="8" fill="none" stroke="#E69F00" stroke-width="1.5"/>
<text x="348.09999999999997" y="16.9" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">実装セッション 2</text>
<text x="348.09999999999997" y="35.1" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">（揮発）</text>
<rect x="550.8" y="0" width="145.4" height="52" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="623.5" y="16.9" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">実装セッション 3</text>
<text x="623.5" y="35.1" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">（揮発）</text>
<path d="M148.4 26 L272.4 26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.5"/><path d="M263.4 30.05 L272.4 26 L263.4 21.95" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.5"/>
<path d="M423.79999999999995 26 L547.8 26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.5"/><path d="M538.8 30.05 L547.8 26 L538.8 21.95" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.5"/>
<text x="210.4" y="12" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.65">記憶は</text>
<text x="210.4" y="40" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.65">渡らない</text>
<text x="485.79999999999995" y="12" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.65">記憶は</text>
<text x="485.79999999999995" y="40" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.65">渡らない</text>
<rect x="-34" y="156" width="764.1999999999999" height="126" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="348.09999999999997" y="176" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.7">docs/ + TODO.md = 文脈を共有しないエージェントの共有メモリ</text>
<rect x="-16" y="200" width="171.54999999999998" height="60" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="69.77499999999999" y="222.2" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">decisions/</text>
<text x="69.77499999999999" y="237.8" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">決定の記録</text>
<rect x="169.54999999999998" y="200" width="171.54999999999998" height="60" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="255.325" y="222.2" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">sketch/</text>
<text x="255.325" y="237.8" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">検証レポート</text>
<rect x="355.09999999999997" y="200" width="171.54999999999998" height="60" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="440.87499999999994" y="222.2" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">problems/</text>
<text x="440.87499999999994" y="237.8" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">未決の懸念</text>
<rect x="540.65" y="200" width="171.54999999999998" height="60" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="626.425" y="222.2" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">TODO.md</text>
<text x="626.425" y="237.8" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">タスク＋依存</text>
<path d="M72.7 55 L72.7 153" fill="none" stroke="#3B82C4" stroke-width="1.5"/><path d="M68.65 144 L72.7 153 L76.75 144" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="82.7" y="104" font-size="11" dominant-baseline="central" fill="currentColor" opacity="0.65">書く</text>
<path d="M336.09999999999997 153 L336.09999999999997 55" fill="none" stroke="#E69F00" stroke-width="1.5"/><path d="M340.15 64 L336.09999999999997 55 L332.04999999999995 64" fill="none" stroke="#E69F00" stroke-width="1.5"/>
<path d="M360.09999999999997 55 L360.09999999999997 153" fill="none" stroke="#E69F00" stroke-width="1.5"/><path d="M356.04999999999995 144 L360.09999999999997 153 L364.15 144" fill="none" stroke="#E69F00" stroke-width="1.5"/>
<path d="M611.5 153 L611.5 55" fill="none" stroke="#00A876" stroke-width="1.5"/><path d="M615.55 64 L611.5 55 L607.45 64" fill="none" stroke="#00A876" stroke-width="1.5"/>
<path d="M635.5 55 L635.5 153" fill="none" stroke="#00A876" stroke-width="1.5"/><path d="M631.45 144 L635.5 153 L639.55 144" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="326.09999999999997" y="92" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.65">読む</text>
<text x="370.09999999999997" y="92" font-size="11" dominant-baseline="central" fill="currentColor" opacity="0.65">書く</text>
</svg>
```

破線は「存在しない経路」だ。セッション間でコンテキストは直接渡らず、すべて下の共有メモリを経由する。リポジトリのドキュメント分層がそのまま、分隊の神経系になっている。

## 推測: 確かめているのは「手続きでモデルの強さを代替できるか」

ここからは推測だが、裏付けは作者自身の投稿にある。作者は「AI エージェント、スクワッドくらいなら率いたことがあるが swarm はまだない」「スクワッド的な数だと最近のフロンティアモデルは何もしなくても制御してくれる感がある。たとえばオーケストレーターを opus にすればいけて、SWE-2 だとちょっと工夫が必要」という趣旨のことを書いている。

そして運用条件は「Devin の SWE-2 local use が無料なので全部 SWE-2 effort=max」。つまりこのプロジェクトは、強いモデルなら無手順で回る規模の分隊を、弱いモデルに手続きを積んで回せるかを試す条件付きの実験として読める。

投稿にあった工夫の各項目は、リポジトリに対応物を見つけられる。

| 投稿での工夫 | リポジトリ内の対応物 |
| --- | --- |
| 厳格化レビュー、同一モデルでの継続 | 実装者とは別のフレッシュなセッションによるレビューが手順化（sketch の second-opinion review、wave3-prompts の「実装完了と報告したらフレッシュな子セッションにレビュー」） |
| タスクを掴んで離さない | 「大筋で破綻がなければ TODO に追加してマージする」という指示の改版、V-4 follow-up のような残課題の TODO 逃がし |
| 変な方向に行ったまま帰らない | エージェントとタスク自体を捨てて 1 からやり直す運用（追記メモの実例: サブエージェントが作業停止 → main が不備を受け入れて TODO 分解・マージ判断） |
| 失敗の記録を残して探索範囲を変えて再入 | docs/sketch の検証レポート、problems/ の懸念ファイル、knownBugs / knownDivergences レジストリ — 「このアプローチは駄目だったという記録を残すのも成果のひとつ」 |

ひとつ留意点は、これらが「指示として書かれた」だけではなく「版を重ねている」ことだ。メモにはプロンプトの v1 と v2 があり、v2 では「サブエージェントがタスクを抱えたまま作業が止まる」という実際の失敗を踏まえて、マージ判断と TODO 分解の指示が追加されている。つまり手続き自体も被験者であり、実験中に改訂されている。

## なぜ題材がコンパイラなのか

コンパイラは、エージェント分隊の制御実験の被験体として都合がよい。推測の根拠はリポジトリ内の検証装置の密度だ。

- 仕様の規則ごとに `testdata/spec/` に fixture があり、生成コードの変更は `testdata/golden/` で差分を pin する
- V-3 は gomgen（文法ベースのランダムプログラム生成器）が作るプログラムを eval とコンパイルの両方で実行して stdout/診断を差分比較する。divergence はバグ確定ではなく両側の仕様確認が要るので専用レジストリで管理される
- V-4 は生成器が型を保証した witness span に対し、check の推論結果を instance 照合するプロパティテスト
- V-5 は `gom fmt` を生成シードで回し続ける冪等性・往復一致の fuzz

要点は「正しさが機械的に判定できる」ことだ。エージェントの成果を人間が diff ごとに読まなくても、テストが品質ゲートとして機能する — そしてゲートの設計自体が実験の一部だ。「厳しいゲートを置けば弱いモデルでも通るか」を測るには、そもそもゲートが存在する題材が要る。意味論もちょうどよく難しい: HM 推論、評価順の保存、Go との境界コピーはいずれも「だいたい動く」が「正確に動く」とは違う領域で、簡単すぎて何も測れない題材ではない。

## 留保

推測はここまでだが、外れている余地を残しておく。

- 言語そのものへの関心を主動機とする可能性は十分ある。spec の丁寧さ（構文・型・エラーメッセージ形式まで規定）は、実験台だけのために書くには手が込んでいる。表と裏は排他ではなく、プロジェクトは両方を一度に確かめられる形に組まれている、がより安全な読みかもしれない。
- 「全部 SWE-2」という条件は投稿とメモに依拠しており、リポジトリ自体にはモデル名が書かれていない。記録からは「どのモデルがどの仕事をしたか」は判別できない — それ自体が「手続きがモデルを代替した」主張の検証を難しくする点でもある（→ 追記で訂正あり）。
- swarm ではなく squad の検証に留まっている。投稿の言い方でも「スクワッドくらいなら率いたことがある」で、gom はその既知の範囲の延長だ。swarm の経験がまだないなら、これは次の規模への布石という読みもある。

確度の高い部分は「ドキュメントがエージェント間引き継ぎ装置として設計されている」までで、「手続きによるモデル代替の検証」は投稿との照合による推測、被験体選択の理由づけはこの記事の補強だ。

## 追記: 著者の回答

記事公開後、作者本人から回答をもらった。外れていた部分と訂正をそのまま記す。

外れ・不足していた軸: 「存在しない言語への認識力」の測定。 教科書の流用ではない toy 言語を題材にしたのは、モデルが事前知識のない言語にどうアクセスするかを把握するためだったという。MoonBit では（認知度がありモデルが強い状態で）同種の確認を既にしていたので、全く新しい言語での振る舞いが対照になる。この読みだと gom-agent-guide の位置づけも一段階深い — 単なる onboarding ではなく、「事前知識ゼロ」を補う足場そのものが被検物だった。

訂正: 「全部 SWE-2」の範囲。 コードは基本的に全部 SWE-2 で書かれているが、最初のドキュメント（spec.md・design.md）は SWE-2 ではない。正確な実験条件は「言語の骨格は別モデルが設計し、コンパイラ実装は SWE-2 が担う」だった。この記事が指摘した「spec の丁寧さは実験台だけのために書くには手が込んでいる」という違和感は、ここに由来する — 設計文書は実験の被験体ではなく、実験を支える固定具だった。

当たっていた部分。 ドキュメントをエージェント間の引き継ぎ装置として組んだ点、「手続きでモデルの強さを代替できるか」の検証枠、そして spec/design の入念さが本物だった点は本人の言葉で確認された。加えて個人的な動機として、仕事では Go を書くが関数型・式志向の言語の方が好み、という面もあるとのこと — 表の顔（Go へのトランスパイラ）と裏の実験が、作者の嗜好で一致している。

結果としてこのプロジェクトは少なくとも3つのことを一度に確かめている: 新しい言語を作ること（表）、モデルが未知の言語に適応できるか（認識力）、弱いモデルの分隊を手続きで回せるか（制御）。この記事の推測は後者ふたつのうち制御側だけを捉えていた。

観察と含意の対応表は [01-evidence.md](01-evidence.md) に分けた。
