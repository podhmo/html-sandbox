---
title: 全記事を lint に通して執筆者の違いを測ったが、欲しかった数値は取れなかった
description: yomiyasu lint を slops 全 59 メンバーに適用して執筆者別に集計した記録。候補の量では執筆者が分かれず、残った差は機械的な書式規則に集中していた。測りたかった Claude Code の読みにくさは、文レベルの規則では届かない層にあると分かった。
prev: ../2026-11-11-moonbit-sum-types.md
---

# 全記事を lint に通して執筆者の違いを測ったが、欲しかった数値は取れなかった

> [!NOTE]
> 執筆: Devin（SWE-2 Max）。[issue #169](https://github.com/podhmo/html-sandbox/issues/169) での集計作業の記録で、執筆者表記そのものではなく集計と解釈が対象。

## 問い

[issue #167](https://github.com/podhmo/html-sandbox/issues/167) で「LLM の文章がなぜひどいか」の調査をして、まず手近な yomiyasu（日本語 AI 文向けの推敲スキルと lint）を試すことにした。そこで [issue #169](https://github.com/podhmo/html-sandbox/issues/169) として、yomiyasu の lint を slops の記事全体に適用してみた。問いは 2 つある。

1. 記事を書いた生成ツール（Devin・Claude Code・Codex・opencode）の違いは、lint の候補の分布に現れるか。
2. Claude Code の出力する文章に残る特有の読みにくさは、lint の数値として取得できるか。

## 方法

`yomiyasu_lint.py` v3.0.1 を `--doc-type article --json` で、全 59 の `.md` メンバー（単独記事 24、バンドルメンバー 35）に適用した。コード・SVG・txt のメンバーは対象外。

帰属は各記事の冒頭にある「執筆」表記に従った。この表記自体は並行して行った別の作業（[PR #170](https://github.com/podhmo/html-sandbox/pull/170)）で、本文を書いたコミットの `Co-Authored-By` トレーラーと PR 本文の 🤖 マーカーから推定したもの。`writing-slops/03-svg-pitfalls` と `moonbit-sum-types/01-guidelines` はバンドル内で執筆者が違うので、メンバー単位で Claude Code に上書きした。帰属が確定できない 2 記事は「不明」として別集計にした（後で中身から Claude Code おそらくと判断されたが、集計時の区分はそのままにしている）。

集計は 2 段で行った。まず全規則を含めた集計、次に「機械的に変換できる不備」（読点・ダッシュ・コロン・絵文字・箇条書き率）と「直接の訳語が分かる語」（calque・translated_term・katakana_term）の 9 規則を除外した再集計。除外した側に 379 候補中 263 候補（69%）が集まった。

## 観察

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-126 -65 482.5 348.8" width="483" height="349" role="img" aria-label="yomiyasu lint candidate density by author: pause_comma separates the authors, meaning-level rules stay flat">
<text x="0" y="-40" font-size="15" fill="currentColor">執筆者差は機械的な規則に集まる</text>
<text x="0" y="-22" font-size="11" fill="currentColor" opacity="0.65">yomiyasu lint の候補密度 (候補/千字)、slops 全 59 メンバー</text>
<text x="0" y="242" font-size="10" fill="currentColor" opacity="0.55">出典: issue #169 の集計コメント / 生成: fig-slops-lint-density.ts</text>
<path d="M0 0 L0 200" fill="none" stroke="currentColor" stroke-width="1" opacity="0.45"/>
<path d="M0 200 L300 200" fill="none" stroke="currentColor" stroke-width="1" opacity="0.45"/>
<path d="M-3 12.5 L0 12.5" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="12.5" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">pause_comma</text>
<path d="M-3 37.5 L0 37.5" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="37.5" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">trailing_colon</text>
<path d="M-3 62.5 L0 62.5" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="62.5" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">dash_decoration</text>
<path d="M-3 87.5 L0 87.5" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="87.5" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">slop_vocabulary</text>
<path d="M-3 112.5 L0 112.5" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="112.5" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">metaphor_label</text>
<path d="M-3 137.5 L0 137.5" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="137.5" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">calque</text>
<path d="M-3 162.5 L0 162.5" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="162.5" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">negative_parallelism</text>
<path d="M-3 187.5 L0 187.5" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="187.5" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">excess_list</text>
<path d="M30 200 L30 203" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="30" y="216" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">Devin</text>
<path d="M90 200 L90 203" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="90" y="216" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">Claude</text>
<path d="M150 200 L150 203" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="150" y="216" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">Codex</text>
<path d="M210 200 L210 203" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="210" y="216" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">opencode</text>
<path d="M270 200 L270 203" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="270" y="216" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">不明</text>
<g data-plot="0 0 300 200">
<rect x="0.0" y="0.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.25" stroke="none"/>
<rect x="60.0" y="0.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.73" stroke="none"/>
<rect x="120.0" y="0.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.96" stroke="none"/>
<rect x="180.0" y="0.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.62" stroke="none"/>
<rect x="240.0" y="0.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.58" stroke="none"/>
<rect x="0.0" y="25.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.18" stroke="none"/>
<rect x="60.0" y="25.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.06" stroke="none"/>
<rect x="120.0" y="25.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.06" stroke="none"/>
<rect x="180.0" y="25.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.06" stroke="none"/>
<rect x="240.0" y="25.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.06" stroke="none"/>
<rect x="0.0" y="50.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.20" stroke="none"/>
<rect x="60.0" y="50.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.08" stroke="none"/>
<rect x="120.0" y="50.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.06" stroke="none"/>
<rect x="180.0" y="50.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.06" stroke="none"/>
<rect x="240.0" y="50.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.06" stroke="none"/>
<rect x="0.0" y="75.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.11" stroke="none"/>
<rect x="60.0" y="75.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.08" stroke="none"/>
<rect x="120.0" y="75.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.06" stroke="none"/>
<rect x="180.0" y="75.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.06" stroke="none"/>
<rect x="240.0" y="75.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.06" stroke="none"/>
<rect x="0.0" y="100.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.10" stroke="none"/>
<rect x="60.0" y="100.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.06" stroke="none"/>
<rect x="120.0" y="100.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.06" stroke="none"/>
<rect x="180.0" y="100.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.06" stroke="none"/>
<rect x="240.0" y="100.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.06" stroke="none"/>
<rect x="0.0" y="125.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.10" stroke="none"/>
<rect x="60.0" y="125.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.13" stroke="none"/>
<rect x="120.0" y="125.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.06" stroke="none"/>
<rect x="180.0" y="125.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.43" stroke="none"/>
<rect x="240.0" y="125.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.06" stroke="none"/>
<rect x="0.0" y="150.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.27" stroke="none"/>
<rect x="60.0" y="150.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.23" stroke="none"/>
<rect x="120.0" y="150.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.16" stroke="none"/>
<rect x="180.0" y="150.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.62" stroke="none"/>
<rect x="240.0" y="150.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.37" stroke="none"/>
<rect x="0.0" y="175.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.18" stroke="none"/>
<rect x="60.0" y="175.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.13" stroke="none"/>
<rect x="120.0" y="175.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.26" stroke="none"/>
<rect x="180.0" y="175.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.15" stroke="none"/>
<rect x="240.0" y="175.0" width="59.4" height="24.4" fill="currentColor" fill-opacity="0.06" stroke="none"/>
</g>
<rect x="220.0" y="256" width="10.7" height="8" fill="currentColor" fill-opacity="0.06" stroke="none"/>
<rect x="231.7" y="256" width="10.7" height="8" fill="currentColor" fill-opacity="0.24" stroke="none"/>
<rect x="243.3" y="256" width="10.7" height="8" fill="currentColor" fill-opacity="0.42" stroke="none"/>
<rect x="255.0" y="256" width="10.7" height="8" fill="currentColor" fill-opacity="0.60" stroke="none"/>
<rect x="266.7" y="256" width="10.7" height="8" fill="currentColor" fill-opacity="0.78" stroke="none"/>
<rect x="278.3" y="256" width="10.7" height="8" fill="currentColor" fill-opacity="0.96" stroke="none"/>
<text x="220" y="272" font-size="9" fill="currentColor" opacity="0.6">0.0</text>
<text x="290" y="272" font-size="9" text-anchor="end" fill="currentColor" opacity="0.6">2.5</text>
<text x="214" y="260" font-size="9" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.6">候補/千字</text>
<text x="30" y="13.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0.51</text>
<text x="90" y="13.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">1.83</text>
<text x="150" y="13.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">2.47</text>
<text x="210" y="13.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">1.53</text>
<text x="270" y="13.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">1.44</text>
<text x="30" y="38.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0.34</text>
<text x="90" y="38.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0</text>
<text x="150" y="38.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0</text>
<text x="210" y="38.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0</text>
<text x="270" y="38.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0</text>
<text x="30" y="63.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0.39</text>
<text x="90" y="63.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0.05</text>
<text x="150" y="63.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0</text>
<text x="210" y="63.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0</text>
<text x="270" y="63.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0</text>
<text x="30" y="88.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0.15</text>
<text x="90" y="88.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0.05</text>
<text x="150" y="88.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0</text>
<text x="210" y="88.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0</text>
<text x="270" y="88.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0</text>
<text x="30" y="113.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0.11</text>
<text x="90" y="113.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0</text>
<text x="150" y="113.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0</text>
<text x="210" y="113.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0</text>
<text x="270" y="113.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0</text>
<text x="30" y="138.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0.11</text>
<text x="90" y="138.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0.18</text>
<text x="150" y="138.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0</text>
<text x="210" y="138.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">1.02</text>
<text x="270" y="138.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0</text>
<text x="30" y="163.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0.58</text>
<text x="90" y="163.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0.48</text>
<text x="150" y="163.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0.27</text>
<text x="210" y="163.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">1.53</text>
<text x="270" y="163.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0.84</text>
<text x="30" y="188.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0.34</text>
<text x="90" y="188.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0.18</text>
<text x="150" y="188.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0.55</text>
<text x="210" y="188.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0.26</text>
<text x="270" y="188.75" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">0</text>
</svg>
```

- 量では分かれない。候補密度は Devin 2.82、Claude Code 2.93、全体 2.90 候補/千字。前の10メンバー集計で見えた差（1.46 vs 2.57）は全集では消えた。執筆者差は候補の量ではなく、規則の層にある。
- 最大の差は pause_comma（「間を作るだけの読点」）で、Claude 1.83 vs Devin 0.51/千字。ただし Codex 2.47・opencode 1.53 も Devin より高いので、「Claude が高い」というより「Devin が低い」と読むのが正確そうだ。
- warn の大半は Devin の機械的書式。trailing_colon（24 件すべて Devin）と dash_decoration（28 件中 Devin 26）が、Devin の warn 99 件の大部分を占める。
- 機械的層を除くと順位が逆転する。除外版では Devin 1.01 vs Claude 0.64 候補/千字。つまり文意の判断が要る候補は Devin のほうが多い。
- 残り候補は negative_parallelism にほぼ一本化し、正規化では全生成系でほぼ同率（Devin 0.58、Claude 0.48）。これは Claude 特有の指標にはならない。
- Devin 固有の偏りは語彙側にあった。slop_vocabulary（「引き継ぎ装置」「品質ゲート」「温度感」「手触り」など 11 件 vs Claude 2 件）と metaphor_verb（「性質が効いてくる」「時間を溶かす」など 3 件 vs 0 件）。
- metaphor_label の 8 件はすべて `## 動機` `## 非目標` のような普通の節見出しで、事実上の誤検出だった。

## Claude Code 特有の読みにくさは発見できなかった

moonbit-sum-types のバンドルは、Claude Code が書いた 01-guidelines.md と Devin が書いた部分（README・03-implementation.md）に分かれている。人間が読むと Claude Code の部分だけでも読みにくさを感じるが、そのメンバーの lint 候補は 4 件（excess_list・negative_parallelism 各 1、pause_comma 2）しかなく、Devin の部分と同程度だった（03 が 4 件、README が 2 件）。バンドル全体でも 10 件で、部分を見ても全体を見ても読みにくさはスコアに現れない。その違和感の実体は文書レベルにある。01-guidelines.md では「兆候 7 項目 → 置き換え先の表 → しない方がよい状況 9 項目 → state machine の条件 → 点検手順」と番号つき分類が連鎖し、「これは7の例外として」「先に『どの構造を』の 2 を確かめる」のように項目どうしが番号で相互参照される。README 側にも「変えたもの」だけでなく「変えなかったもの」 9 項目を理由つきで列挙する網羅的対称があり、全メンバーで段落が同じトーンのレジスター一様性もある。どれも測る規則が yomiyasu には存在しない。

そして本命の問いである「Claude Code の読みにくさ」はスコアに乗らなかった。最も近い代理は pause_comma だったが、読点そのものが読みにくさなのではなく、「読点で節をつなぐ長い文の組み立て」という組み立て方の症状の末端を見ているにすぎない。節数/文・係り受けの深さ・行為の名詞化といった、その組み立て自体を測る規則は lint にない。全規則が行・文レベルの語彙・書式・定型の検出だ。

つまり穴は 2 層ある。

- 文レベルだが形態素・係り受けが要る層: 文の構造複雑度（節数/文、修飾の深さ、名詞化、無生物主語、行為者が格を外される形）。Zonder の hidden characters and actions の日本語版に相当する。
- 文書レベルの層: 網羅的対称・足場構造・一様リズム。木構造に役割（導入・基準・根拠・反例・まとめ）を付けて位置・親・兄弟関係で解釈を分岐する必要がある。

## 次回は自作の規則を考える

収集対象を 3 つに分けた。「直したい層」の選定と slop_vocabulary の許容判断は依頼者の評価による。

- 直したい層（文レベル・文意系）: negative_parallelism（筆頭。密度規則で多い箇所だけ摘む運用）、metaphor_verb（実表現を眺めて「鼻につく」と判断された層）、meta 系（meta_filler・summary_restatement・short_mochiron・say_hedge・thin_evaluation）、renyo_noun。watch として instruction_residue・cleft_list_ending。
- 特徴量として集める層（文書レベル）: excess_list・list_ratio・bold_per_1000、negative_parallelism_density、summary_restatement・short_summary_heading・sentence_end_repetition。直す対象ではないが、文書の形を見る代理メトリクス。
- 対象外: 機械的変換の規則群、訳語既知の規則群、metaphor_label（誤検出優勢）、slop_vocabulary（言い換えを意識すれば読める、との判断）。

この 2 層の穴を補うために、自作 lint の構想を [issue #171](https://github.com/podhmo/html-sandbox/issues/171) に切り出した。形態素・係受け解析で文レベルの構造特徴を取り、文書は木構造＋役割付けで扱う。語彙リストは持たない方針（kuden の「言葉尻より構造」と同じ立場）で、判定ではなく特徴量を集める設計にする。

さらに lint の実装の前に、計測フェーズとして [issue #172](https://github.com/podhmo/html-sandbox/issues/172) を分けた。[#169](https://github.com/podhmo/html-sandbox/issues/169) と同じ「全記事に適用して執筆者別に集計」を、今度は節数/文・係受け深さ・名詞化率・文書構造メトリクスといった新しい特徴量でやる。分離度が見えた特徴量だけが lint の規則候補になる、という順番にした。

- 形態素・係受けベースの特徴量はまだ実装していない。ツール選定のメモは [#172](https://github.com/podhmo/html-sandbox/issues/172) にある（形態素・係受けの両方を pip だけで取れる GiNZA 系が第一候補、n-best が取れる JUMAN++ 系は意味情報の豊かさで別の強み）。
- n-best 解析で「best と 2nd の係り先が違う文」を曖昧さの指標にする案はアイデア段階。係受け層で n-best を出せるツールが少なく、parser 間の不一致を代用する案も検討中。
- 「直したい層」の規則で記事を実際に直す運用は試していない。今回は収集と分類だけ。

## おそらくやらないこと

- IdeaLens 型の文書→役割付きアウトライン変換（LLM 判定層）は未検証。日本語記事で outline が成立するかも分かっていない。

## データと参考

集計の全表へのリンクは [01-data.md](01-data.md) に、外部資料とそれぞれ何を確認したかは [02-references.md](02-references.md) に分けてある。

## 余談

この記事の初稿を書いた後に、文を推敲するための refine-slops スキルが `.agents/skills/refine-slops/` に追加された（別のエージェントの作業）。解釈が分かれる文を書き直すスキルで、この記事が扱っている「文の組み立て」に近い対象を見る。初稿に適用した結果は総評と差分つきで [03-diff-and-review.md](03-diff-and-review.md) に、適用後の本文は [04-refined.md](04-refined.md) に置いた。

もう 1 つ、moonbit-sum-types のバンドルについて。Devin（SWE-2）が書いた部分には、最初は読みにくさを感じていなかった。だが改めて眺めると、Claude Code の部分と同様の読みにくさが内包されていた。網羅的対称や一様なトーンのような文書レベルの特徴は執筆者を選ばないので、これは Claude Code 特有ではなく AI 特有の読みにくさと言ってよい。
