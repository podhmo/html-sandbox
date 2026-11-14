---
title: 文単位の特徴量を測ったら執筆者は分かれたが、文章単位の読みにくさはまだ先にある
description: issue #172 の計測記録。GiNZA(形態素・係受け・文節)と markdown-it-py(文書構造)で 60 以上の特徴量を slops 全 65 メンバーから取り、執筆者別に集計した。Claude Code の「節を読点でつなぐ」署名は記事の目的で層別しても残ったが、係受け深さはジャンルで消えた。届いたのは文単位まで。
prev: ../2026-11-12-what-the-lint-missed.md
next: ../2026-11-14-mpa-modern-web-guidance.md
---

# 文単位の特徴量を測ったら執筆者は分かれたが、文章単位の読みにくさはまだ先にある

> [!NOTE]
> 執筆: Devin（SWE-2 Max）。[issue #172](https://github.com/podhmo/html-sandbox/issues/172) での計測作業の記録で、前の記事 ([what-the-lint-missed](../2026-11-12-what-the-lint-missed.md/)) の続き。

## 問い

前回、[issue #169](https://github.com/podhmo/html-sandbox/issues/169) で yomiyasu lint の候補を執筆者別に集計した。結果は、差は機械的な書式規則に集中し、lint の文レベル規則では読みにくさの実体に届かないというものだった。[issue #172](https://github.com/podhmo/html-sandbox/issues/172) では、lint が持っていない層、つまり形態素・係受け・文書構造の特徴量を自分で集めて、もう一度「全記事に適用して執筆者別に眺める」をやった。問いは 2 つある。

1. どの特徴量で執筆者が分かれるか。Claude Code だけ優位に多い指標があるか。
2. 分かれた差は読みにくさに関係するのか、それともただの癖か。

作業の途中で依頼者から条件が 2 つ追加された。1 つは「claude も codex も多い指標は、AI 共有の読みにくさを示しているかもしれない」という指摘で、[issue #167](https://github.com/podhmo/html-sandbox/issues/167) の調査メモで挙がっていた論文特徴との対応を測ることになった。もう 1 つは「差はモデルではなく記事のテーマ由来かもしれない」という交絡の可能性で、予備実験 [slops-use-case-templates](../2026-11-05-slops-use-case-templates.md/) の目的分類を統制変数に使うことになった。

## 方法

計測スクリプトは `tools/slops-metrics/measure.py`。markdown-it-py (`commonmark` + table) で Markdown の構造を取り、prose 部分(段落・リスト項目・引用)だけを GiNZA 5.3.0 に通した。GiNZA からは形態素(Sudachi/UniDic)・UD 係受け・文節・節の情報が取れる。見出しと表セルは文指標からは外して面積計算にだけ含め、コード・SVG フェンスは構造面積として数えるだけにした。

対象は全 65 メンバー(devin 39, claude 20, codex 3, opencode 1, 不明 2)。帰属はメンバーの「執筆」表記に従い、表記がなければバンドル README から継承し、「おそらく」付きは不明とした。出現数は prose 文字数あたりの密度(件/千字)に正規化し、執筆者間の差はメンバー平均の Cohen's d で見る。正規化と効果量の形式は [issue #169](https://github.com/podhmo/html-sandbox/issues/169) と揃えた。

集めた特徴量は約 60 個で、3 層ある。

- 形態素: サ変名詞、連用形名詞(推定)、「の」連結、読点の位置、て形接続、接続詞、形式名詞、括弧、カタカナ・漢字率、文末カテゴリ。
- 係受け: 節数/文、文節数/文、係受け深さ、係り距離、従属節・連体修飾節の密度、主語の推定(無生物か、動作動詞を伴うか)、名詞3連積み上げ。
- 文書構造: 段落・セクション長のばらつき、見出しレベル飛び、コード/SVG/表の面積比、文数/段落、主題交代率、番号つき相互参照。

途中で失敗したものも記録してある。JUMAN はローカル展開まではできたが、解析が EOS しか返さなかったので断念した。連用形名詞は Sudachi への再解析ヒューリスティックで推定に変えた。spaCy の `token.head` はアクセスごとに新しいラッパーを返すので `is` 比較だと係受け深さが上限に張り付いた。index (`.i`) で比較する形に直した。帰属の判定順を間違えて codex が 0 件になった。環境まわりの詳細とクリーンアップは `docs/sketch/ja/slops-172-measure.md` に書いた。

## 観察

文単位の指標では、執筆者ははっきり分かれた。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-111.5 -65 504.85 488.8" width="505" height="489" role="img" aria-label="claude-vs-devin effect sizes overall vs within the 変更の報告 genre: the clause-chaining signature persists, dependency depth collapses">
<text x="0" y="-40" font-size="15" fill="currentColor">ジャンルを統制しても執筆者差は残る</text>
<text x="0" y="-22" font-size="11" fill="currentColor" opacity="0.65">claude−devin の Cohen's d。右列は「変更の報告」内のみ (各6メンバー)</text>
<text x="0" y="382" font-size="10" fill="currentColor" opacity="0.55">出典: issue #172 集計 / tools/slops-metrics measure.py, genre.py</text>
<path d="M0 0 L0 340" fill="none" stroke="currentColor" stroke-width="1" opacity="0.45"/>
<path d="M0 340 L220 340" fill="none" stroke="currentColor" stroke-width="1" opacity="0.45"/>
<path d="M-3 13.076923076923094 L0 13.076923076923094" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="13.076923076923094" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">節数/文</text>
<path d="M-3 39.230769230769226 L0 39.230769230769226" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="39.230769230769226" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">文末:「た」率</text>
<path d="M-3 65.38461538461536 L0 65.38461538461536" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="65.38461538461536" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">読点@文節末</text>
<path d="M-3 91.53846153846155 L0 91.53846153846155" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="91.53846153846155" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">読点</text>
<path d="M-3 117.69230769230768 L0 117.69230769230768" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="117.69230769230768" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">接続詞</text>
<path d="M-3 143.84615384615387 L0 143.84615384615387" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="143.84615384615387" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">形式名詞</text>
<path d="M-3 170 L0 170" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="170" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">無生物主語+動作動詞</text>
<path d="M-3 196.15384615384616 L0 196.15384615384616" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="196.15384615384616" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">連用形+読点</text>
<path d="M-3 222.30769230769232 L0 222.30769230769232" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="222.30769230769232" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">て形接続</text>
<path d="M-3 248.46153846153845 L0 248.46153846153845" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="248.46153846153845" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">係受け深さ平均</text>
<path d="M-3 274.61538461538464 L0 274.61538461538464" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="274.61538461538464" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">名詞3連積み上げ</text>
<path d="M-3 300.7692307692308 L0 300.7692307692308" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="300.7692307692308" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">サ変名詞</text>
<path d="M-3 326.9230769230769 L0 326.9230769230769" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="326.9230769230769" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">文末:体言止め率</text>
<path d="M55 340 L55 343" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="55" y="356" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">全体 (65)</text>
<path d="M165 340 L165 343" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="165" y="356" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">変更の報告 (6v6)</text>
<g data-plot="0 0 220 340">
<rect x="0.0" y="0.0" width="109.4" height="25.6" fill="currentColor" fill-opacity="0.34" stroke="none"/>
<rect x="110.0" y="0.0" width="109.4" height="25.6" fill="currentColor" fill-opacity="0.50" stroke="none"/>
<rect x="0.0" y="26.2" width="109.4" height="25.6" fill="currentColor" fill-opacity="0.40" stroke="none"/>
<rect x="110.0" y="26.2" width="109.4" height="25.6" fill="currentColor" fill-opacity="0.24" stroke="none"/>
<rect x="0.0" y="52.3" width="109.4" height="25.6" fill="currentColor" fill-opacity="0.33" stroke="none"/>
<rect x="110.0" y="52.3" width="109.4" height="25.6" fill="currentColor" fill-opacity="0.39" stroke="none"/>
<rect x="0.0" y="78.5" width="109.4" height="25.6" fill="currentColor" fill-opacity="0.29" stroke="none"/>
<rect x="110.0" y="78.5" width="109.4" height="25.6" fill="currentColor" fill-opacity="0.40" stroke="none"/>
<rect x="0.0" y="104.6" width="109.4" height="25.6" fill="currentColor" fill-opacity="0.24" stroke="none"/>
<rect x="110.0" y="104.6" width="109.4" height="25.6" fill="currentColor" fill-opacity="0.38" stroke="none"/>
<rect x="0.0" y="130.8" width="109.4" height="25.6" fill="currentColor" fill-opacity="0.20" stroke="none"/>
<rect x="110.0" y="130.8" width="109.4" height="25.6" fill="currentColor" fill-opacity="0.35" stroke="none"/>
<rect x="0.0" y="156.9" width="109.4" height="25.6" fill="currentColor" fill-opacity="0.25" stroke="none"/>
<rect x="110.0" y="156.9" width="109.4" height="25.6" fill="currentColor" fill-opacity="0.17" stroke="none"/>
<rect x="0.0" y="183.1" width="109.4" height="25.6" fill="currentColor" fill-opacity="0.29" stroke="none"/>
<rect x="110.0" y="183.1" width="109.4" height="25.6" fill="currentColor" fill-opacity="0.14" stroke="none"/>
<rect x="0.0" y="209.2" width="109.4" height="25.6" fill="currentColor" fill-opacity="0.25" stroke="none"/>
<rect x="110.0" y="209.2" width="109.4" height="25.6" fill="currentColor" fill-opacity="0.14" stroke="none"/>
<rect x="0.0" y="235.4" width="109.4" height="25.6" fill="currentColor" fill-opacity="0.20" stroke="none"/>
<rect x="110.0" y="235.4" width="109.4" height="25.6" fill="currentColor" fill-opacity="0.06" stroke="none"/>
<rect x="0.0" y="261.5" width="109.4" height="25.6" fill="currentColor" fill-opacity="0.24" stroke="none"/>
<rect x="110.0" y="261.5" width="109.4" height="25.6" fill="currentColor" fill-opacity="0.39" stroke="none"/>
<rect x="0.0" y="287.7" width="109.4" height="25.6" fill="currentColor" fill-opacity="0.39" stroke="none"/>
<rect x="110.0" y="287.7" width="109.4" height="25.6" fill="currentColor" fill-opacity="0.59" stroke="none"/>
<rect x="0.0" y="313.8" width="109.4" height="25.6" fill="currentColor" fill-opacity="0.30" stroke="none"/>
<rect x="110.0" y="313.8" width="109.4" height="25.6" fill="currentColor" fill-opacity="0.96" stroke="none"/>
</g>
<rect x="140.0" y="396" width="10.7" height="8" fill="currentColor" fill-opacity="0.06" stroke="none"/>
<rect x="151.7" y="396" width="10.7" height="8" fill="currentColor" fill-opacity="0.24" stroke="none"/>
<rect x="163.3" y="396" width="10.7" height="8" fill="currentColor" fill-opacity="0.42" stroke="none"/>
<rect x="175.0" y="396" width="10.7" height="8" fill="currentColor" fill-opacity="0.60" stroke="none"/>
<rect x="186.7" y="396" width="10.7" height="8" fill="currentColor" fill-opacity="0.78" stroke="none"/>
<rect x="198.3" y="396" width="10.7" height="8" fill="currentColor" fill-opacity="0.96" stroke="none"/>
<text x="140" y="412" font-size="9" fill="currentColor" opacity="0.6">0.1</text>
<text x="210" y="412" font-size="9" text-anchor="end" fill="currentColor" opacity="0.6">2.9</text>
<text x="134" y="400" font-size="9" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.6">|d|</text>
<text x="55" y="14.384615384615385" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">+0.95</text>
<text x="165" y="14.384615384615385" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">+1.43</text>
<text x="55" y="40.53846153846154" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">+1.12</text>
<text x="165" y="40.53846153846154" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">+0.63</text>
<text x="55" y="66.69230769230768" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">+0.90</text>
<text x="165" y="66.69230769230768" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">+1.10</text>
<text x="55" y="92.84615384615384" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">+0.80</text>
<text x="165" y="92.84615384615384" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">+1.12</text>
<text x="55" y="118.99999999999999" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">+0.63</text>
<text x="165" y="118.99999999999999" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">+1.07</text>
<text x="55" y="145.15384615384613" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">+0.52</text>
<text x="165" y="145.15384615384613" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">+0.96</text>
<text x="55" y="171.3076923076923" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">+0.65</text>
<text x="165" y="171.3076923076923" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">+0.42</text>
<text x="55" y="197.46153846153845" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">+0.79</text>
<text x="165" y="197.46153846153845" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">+0.32</text>
<text x="55" y="223.61538461538464" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">+0.67</text>
<text x="165" y="223.61538461538464" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">+0.31</text>
<text x="55" y="249.76923076923077" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">+0.51</text>
<text x="165" y="249.76923076923077" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">+0.07</text>
<text x="55" y="275.92307692307696" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">-0.62</text>
<text x="165" y="275.92307692307696" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">-1.11</text>
<text x="55" y="302.0769230769231" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">-1.11</text>
<text x="165" y="302.0769230769231" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">-1.73</text>
<text x="55" y="328.2307692307692" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">-0.81</text>
<text x="165" y="328.2307692307692" font-size="8" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.8">-2.87</text>
<path d="M0 261.53846153846155 L220 261.53846153846155" fill="none" stroke="currentColor" stroke-width="1" opacity="0.45"/>
<text x="-6" y="130.76923076923077" font-size="9" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.6">claude 側が高い</text>
<text x="-6" y="300.7692307692308" font-size="9" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.6">devin 側が高い</text>
</svg>
```

- claude 側の署名は「節を読点でつなぐ」型。文末「た」率 (28% vs 13%, d+1.12)、節数/文 (1.80 vs 1.52, d+0.95)、読点@文節末 (d+0.90)、読点 (d+0.80)、連用形+読点 (d+0.79)、て形接続 (d+0.67)、文節数/文 (d+0.65)、接続詞 (d+0.63)、形式名詞 (d+0.52)。
- devin 側にも別の署名がある。サ変名詞 (d−1.11)、括弧 (d−1.03)、形態素/文節 (d−0.95)、文末の体言止め率 (36% vs 18%, d−0.81)、名詞3連積み上げ (d−0.62)。claude が「節接続型」で devin が「名詞密度型」という対称的な形。
- 読点・連用形+読点・て形接続は codex が claude をさらに上回るので「claude 固有」ではない。AI 共有の節接続スタイルの強い版と読むのが正確そうだ。
- 論文特徴との対応で一番まっすぐだったのは無生物主語+動作動詞(「記事は〜書いている」「見出しが開く」型)で、claude 12.2 > codex 10.6 > devin 9.4 件/千字だった。名詞積み上げは逆に devin が最多 (1.91 vs 0.47)。係り距離には差がなかった。なお論文 (Clark, Martin & Mahowald, arXiv:2610.29162) 自体は未読で、ここで言う「論文特徴」は [issue #167](https://github.com/podhmo/html-sandbox/issues/167) の調査メモ内の要約から取った特徴名であり、元論文の定義そのものではない。

論文との対応を見たあと、「記事のテーマによるものかもしれない」という依頼者の指摘でジャンル統制を行った。[use-cases 記事](../2026-11-05-slops-use-case-templates.md/) の目的分類を流用し、それ以降の 7 記事は同じ基準でこちらが仮分類した。メンバーは所属記事の目的を継承する。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-106 -65 523.0000000000002 477.3" width="523" height="477" role="img" aria-label="comma density by genre and author: devin ranges 10 to 27 across genres while claude stays high in every shared genre">
<text x="0" y="-40" font-size="15" fill="currentColor">読点密度はジャンルでも大きく動く</text>
<text x="0" y="-22" font-size="11" fill="currentColor" opacity="0.65">読点/千字のメンバー平均を記事の目的別に。devin/claude/codex は色分けの点</text>
<text x="0" y="382" font-size="10" fill="currentColor" opacity="0.55">出典: issue #172 集計 / tools/slops-metrics genre.py。n=1 の点あり</text>
<path d="M0 0 L0 340" fill="none" stroke="currentColor" stroke-width="1" opacity="0.45"/>
<path d="M0 340 L300 340" fill="none" stroke="currentColor" stroke-width="1" opacity="0.45"/>
<path d="M-3 13.076923076923094 L0 13.076923076923094" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="13.076923076923094" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">書き方そのもの*</text>
<path d="M-3 39.230769230769226 L0 39.230769230769226" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="39.230769230769226" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">書き方そのもの</text>
<path d="M-3 65.38461538461536 L0 65.38461538461536" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="65.38461538461536" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">詰まった経緯</text>
<path d="M-3 91.53846153846155 L0 91.53846153846155" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="91.53846153846155" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">主張の検討</text>
<path d="M-3 117.69230769230768 L0 117.69230769230768" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="117.69230769230768" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">他人の成果物を読む</text>
<path d="M-3 143.84615384615387 L0 143.84615384615387" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="143.84615384615387" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">変更の報告</text>
<path d="M-3 170 L0 170" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="170" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">実験・比較</text>
<path d="M-3 196.15384615384616 L0 196.15384615384616" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="196.15384615384616" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">変更の報告*</text>
<path d="M-3 222.30769230769232 L0 222.30769230769232" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="222.30769230769232" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">実験・比較*</text>
<path d="M-3 248.46153846153845 L0 248.46153846153845" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="248.46153846153845" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">主張の検討*</text>
<path d="M-3 274.61538461538464 L0 274.61538461538464" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="274.61538461538464" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">実現性の調査</text>
<path d="M-3 300.7692307692308 L0 300.7692307692308" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="300.7692307692308" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">任せた作業の記録</text>
<path d="M-3 326.9230769230769 L0 326.9230769230769" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="-6" y="326.9230769230769" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">記法の見本</text>
<path d="M11.538461538461538 340 L11.538461538461538 343" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="11.538461538461538" y="356" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">0</text>
<path d="M59.61538461538462 340 L59.61538461538462 343" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="59.61538461538462" y="356" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">5</text>
<path d="M107.6923076923077 340 L107.6923076923077 343" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="107.6923076923077" y="356" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">10</text>
<path d="M155.76923076923077 340 L155.76923076923077 343" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="155.76923076923077" y="356" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">15</text>
<path d="M203.84615384615387 340 L203.84615384615387 343" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="203.84615384615387" y="356" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">20</text>
<path d="M251.92307692307693 340 L251.92307692307693 343" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="251.92307692307693" y="356" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">25</text>
<path d="M300 340 L300 343" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="300" y="356" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">30</text>
<g data-plot="0 0 300 340">
<circle cx="266.9230769230769" cy="13.076923076923094" r="3.2" fill="#E69F00" fill-opacity="0.5" stroke="none"/>
<circle cx="266.53846153846155" cy="39.230769230769226" r="3.2" fill="#3B82C4" fill-opacity="0.5" stroke="none"/>
<circle cx="224.51923076923075" cy="39.230769230769226" r="3.2" fill="#E69F00" fill-opacity="0.5" stroke="none"/>
<circle cx="261.6346153846154" cy="39.230769230769226" r="3.2" fill="#00A876" fill-opacity="0.5" stroke="none"/>
<circle cx="226.9230769230769" cy="65.38461538461536" r="3.2" fill="#E69F00" fill-opacity="0.5" stroke="none"/>
<circle cx="197.69230769230768" cy="91.53846153846155" r="3.2" fill="#3B82C4" fill-opacity="0.5" stroke="none"/>
<circle cx="195.5769230769231" cy="117.69230769230768" r="3.2" fill="#3B82C4" fill-opacity="0.5" stroke="none"/>
<circle cx="192.01923076923075" cy="143.84615384615387" r="3.2" fill="#3B82C4" fill-opacity="0.5" stroke="none"/>
<circle cx="246.53846153846158" cy="143.84615384615387" r="3.2" fill="#E69F00" fill-opacity="0.5" stroke="none"/>
<circle cx="158.3653846153846" cy="170" r="3.2" fill="#3B82C4" fill-opacity="0.5" stroke="none"/>
<circle cx="261.4423076923077" cy="170" r="3.2" fill="#E69F00" fill-opacity="0.5" stroke="none"/>
<circle cx="150" cy="196.15384615384616" r="3.2" fill="#3B82C4" fill-opacity="0.5" stroke="none"/>
<circle cx="191.4423076923077" cy="196.15384615384616" r="3.2" fill="#E69F00" fill-opacity="0.5" stroke="none"/>
<circle cx="147.21153846153845" cy="222.30769230769232" r="3.2" fill="#3B82C4" fill-opacity="0.5" stroke="none"/>
<circle cx="145.48076923076923" cy="248.46153846153845" r="3.2" fill="#3B82C4" fill-opacity="0.5" stroke="none"/>
<circle cx="132.5" cy="274.61538461538464" r="3.2" fill="#3B82C4" fill-opacity="0.5" stroke="none"/>
<circle cx="107.59615384615385" cy="300.7692307692308" r="3.2" fill="#3B82C4" fill-opacity="0.5" stroke="none"/>
<circle cx="11.538461538461538" cy="326.9230769230769" r="3.2" fill="#3B82C4" fill-opacity="0.5" stroke="none"/>
<circle cx="144.42307692307693" cy="326.9230769230769" r="3.2" fill="#E69F00" fill-opacity="0.5" stroke="none"/>
</g>
<circle cx="150" cy="396" r="3.2" fill="#3B82C4" stroke="none"/>
<text x="157" y="396" font-size="9" dominant-baseline="central" fill="currentColor" opacity="0.7">devin</text>
<circle cx="200" cy="396" r="3.2" fill="#E69F00" stroke="none"/>
<text x="207" y="396" font-size="9" dominant-baseline="central" fill="currentColor" opacity="0.7">claude</text>
<circle cx="250" cy="396" r="3.2" fill="#00A876" stroke="none"/>
<text x="257" y="396" font-size="9" dominant-baseline="central" fill="currentColor" opacity="0.7">codex</text>
</svg>
```

- 構成自体は大きく偏っている。devin は 9 ジャンルに散らばり、claude は「変更の報告」系と「書き方そのもの」系に集中し、「詰まった経緯」は claude のみ、「主張の検討」「任せた作業の記録」「実現性の調査」「他人の成果物を読む」は devin のみ。
- それでも「変更の報告」内だけ (devin 6 / claude 6) に絞ると、節接続系の差は残るどころか大きくなるものが多い(節数/文 d+1.43、読点 d+1.12、接続詞 d+1.07、形式名詞 d+0.96)。文末「た」も +0.63 で残る。devin 側の署名も全部残る(体言止め −2.87、サ変名詞 −1.73、名詞3連 −1.11)。
- 一方で消えたものもある。係受け深さ平均は +0.51 → +0.07 に消失した。この差は著者差ではなくジャンル構成の産物だった可能性が高い。連用形+読点・て形接続も +0.79→+0.32、+0.67→+0.31 に縮む。「どうつなぐか」の形はジャンルの影響を受けるが、「いくつつなぐか」の量は残る、という読みになる。
- ジャンル自体も値を大きく動かす。devin 単独でも読点密度は 10.0(任せた作業)から 26.5(書き方そのもの)まで 2.6 倍動く。「書き方そのもの」は両著者とも読点が多いジャンルで、そのジャンルの devin 平均は claude の「変更の報告」平均を上回る。つまり絶対値はジャンル+著者の合成で、著者差はジャンル内でも一貫して上乗せされている、が正確な構図っぽい。
- バンドル内の文書の役割でも変わる。skill-for-new-articles では README(内省)が読点密度 30.9 なのに member(報告)が 13.5-14.5 と半分以下だった。同じ claude でも「どの役割の文書を書いているか」で値が倍になる。

## 分かったことと分からなかったこと

問い 1 には答えられた。claude だけ優位に多い指標は存在し、それは節接続系(節数/文・読点@文節末・接続詞・形式名詞・文末「た」)に集約される。少なくとも「変更の報告」という同一ジャンル内では再現するので、ジャンルの交絡だけでは説明できない。逆に係受け深さはジャンルで消えたので、規則候補からは外すべきだ。

問い 2 は半分だけ。「ただの癖か読みにくさか」はこのデータだけでは判別できない。一番まっすぐだった論文対応(無生物主語+動作動詞)は claude > codex > devin の順で論文の主張と整合するが、ジャンル内では +0.42 に弱まる。正解の読みやすさ評価がない限り、差が出た指標が読みにくさの原因なのか、無関係な癖なのかは分からないままだ。

そして依頼者が指摘したように、今回届いたのは文単位だった。前回本命と考えた文書レベルの特徴(網羅的対称・一様リズム・足場構造)に対応するプロキシとして、段落・セクション長のばらつき、構造面積比、見出しレベル飛び、主題交代率を入れていたが、どれも分離がほぼなかった(|d| ≤ 0.2 程度)。これは「文書レベルに差がない」ではなく「この測り方はその層に届いていない」と読むのが妥当で、網羅的対称は項目に役割を付けないと検出できない。文書単位の計測は別の方法が要る。

## 測っていないこと・測れなかったこと

- 統制できたのは実質 6v6。他のジャンルは claude-only か devin-only が多く、そこでは検証できない。7 記事はこちらの仮分類で、use-cases 記事の分類自体もタイトルと見出しからの手動ラベルだ。
- codex 3・opencode 1・不明 2 ではジャンル内比較が不可能。codex の 3 メンバーは全部「書き方そのもの」にあり、devin と同じくらい読点が多いが、そのジャンル自体が読点の多いジャンルなので単純な読みはできない。
- 連用形名詞と無生物主語の判定はヒューリスティックによる推定だ。後者には「見出しが開く」のような慣用的・受動的な構文も混ざる。検出例の目視も限られたサンプルにとどまる。
- 文書単位の検証は今回の方法では未達成だ。役割付きアウトライン(IdeaLens 型)のような、段落に役割を付けてから見る測り方は試していない。文書単位を測るなら次はその方向になる。
- この記事は集計後に書かれたので 65 メンバーに含まれない。

## データと参考

集計表の全文は [issue #172](https://github.com/podhmo/html-sandbox/issues/172) のコメントと `tools/slops-metrics/out/` にある。

- [計測結果と分離度ランキング](https://github.com/podhmo/html-sandbox/issues/172#issuecomment-6814724865) / [第一弾の読み](https://github.com/podhmo/html-sandbox/issues/172#issuecomment-6814729098)
- [論文特徴との対応](https://github.com/podhmo/html-sandbox/issues/172#issuecomment-6814971661)
- [ジャンル統制の分析](https://github.com/podhmo/html-sandbox/issues/172#issuecomment-6815282354)
- 生データ: `tools/slops-metrics/out/members.jsonl`、集計 `out/report.md`、ジャンル別 `out/genre.md`
- 抜粋の表は [01-tables.md](01-tables.md) に、環境の構築と落とし穴は `docs/sketch/ja/slops-172-measure.md` にある。

## 余談

- spaCy の罠は再現しやすいので書き残す。`token.head` はアクセスのたびに新しい Token ラッパーを返すので、`h is not t` が永遠に真になって係受け深さが上限 40 に張り付いた。デバッグ中は「head グラフに循環がある」ように見えて、原因に辿り着くまでに一番時間がかかった。
- 図の「書き方そのもの」では claude(n=1) が devin 平均を下回っている(22.2 vs 26.5)。ジャンルの力が強い場所では著者差は縮むか逆転しうる。「claude だから読点が多い」ではなく「そのジャンルで claude はさらに多い」という形だ。
- 次に全件を測り直したとき、この記事の署名が調査対象の claude 寄りか、この記事を書いた devin 寄りか出るはずで、それ自体が 1 つのチェックになる。

## 追記: この記事自身を測った

余談のチェックを先にやってみた。65 メンバー集計とは別に、このバンドルの 2 メンバーだけに同じスクリプトを単独で走らせた(`out/` の集計には含めていない)。測定対象は推敲パス適用後の本文だ。01-tables.md は prose が 302 字・7 文しかなく指標としてはノイズ相当なので、対象は実質 README(4,712 字・118 文)だけになる。

| 指標 | この記事 | devin 平均 | claude 平均 |
|---|---|---|---|
| 節数/文 | 1.51 | 1.52 | 1.80 |
| 文節数/文 | 6.59 | 6.49 | 7.69 |
| 係受け深さ平均 | 3.98 | 3.97 | 4.38 |
| 読点 (件/千字) | 20.8 | 16.9 | 23.6 |
| 連用形+読点 (件/千字) | 3.0 | 1.3 | 2.4 |
| て形接続 (件/千字) | 4.7 | 8.6 | 12.3 |
| 接続詞 (件/千字) | 2.8 | 1.7 | 2.6 |
| 形式名詞 (件/千字) | 2.8 | 3.6 | 5.6 |
| 文末「た」率 | 0.23 | 0.13 | 0.28 |
| 文末体言止め率 | 0.25 | 0.36 | 0.18 |
| サ変名詞 share | 0.18 | 0.20 | 0.14 |
| 名詞3連 (件/千字) | 2.8 | 1.9 | 0.5 |
| 括弧 (件/千字) | 17.2 | 12.7 | 7.5 |
| 無生物主語+動作動詞 (件/千字) | 10.8 | 8.7 | 11.2 |

読みは「骨格は devin、文末と読点は claude 寄りの中間」だった。節数・文節数・係受け深さ・サ変 share・無生物主語 share はほぼ devin 平均に重なる。一方で読点・連用形+読点・接続詞・文末「た」率は claude 側に寄り、て形接続と形式名詞は両著者の平均を下回る。名詞3連と括弧は devin 平均をさらに上回るので、devin 側の署名はむしろ強めに出ている。「絶対値はジャンル+著者の合成」に従えば、devin の骨格の上にこの記事のジャンル(調査報告)が読点を上乗せした形だ。n=1 で著者は devin なので、claude 寄りに見える部分がジャンルの影響なのか個体差なのかは分からない。

推敲パス適用前の本文(commit `e1ccbcd` 時点)にも同じ測定をしてみた。claude 寄りに見えた部分は推敲前からほぼ同じ値で、読点 21.2・連用形+読点 2.8・接続詞 2.6・無生物主語+動作動詞 11.0 件/千字だった。推敲で動いたのは文末の分布だけで、体言止め率が 0.33 → 0.25、「た」率が 0.18 → 0.23 に変わっている。体言止めの文を「だ」「だった」で終わる形に直した分で、密度系や構造系は誤差の範囲だった。つまり claude 寄りに見える読点・接続詞は推敲の産物ではなく、初稿の時点でこの記事にあった傾向になる。
