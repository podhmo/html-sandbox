> [!NOTE]
> 執筆: Devin（SWE-2 Max）。このメンバーは集計結果の転載で、[issue #169](https://github.com/podhmo/html-sandbox/issues/169) の集計コメントと同じ数値。

## 全体集計（全規則）

| | メンバー数 | 総文字数 | 候補数 | 密度 (候補/千字) | warn | info |
|---|---|---|---|---|---|---|
| Devin（SWE-2） | 33 | 71,215 | 201 | 2.82 | 99 | 102 |
| Claude Code（Opus 5.5） | 20 | 43,737 | 128 | 2.93 | 13 | 115 |
| Codex（GPT-6.1 Sol） | 3 | 3,643 | 12 | 3.29 | 2 | 10 |
| opencode（DeepSeek V4 Flash） | 1 | 3,910 | 18 | 4.60 | 1 | 17 |
| 不明 | 2 | 8,350 | 20 | 2.40 | 0 | 20 |
| 全体 | 59 | 130,855 | 379 | 2.90 | 115 | 264 |

error は全執筆者 0 件。

## 規則別の分布（全規則）

括弧内は正規化値（候補数/千字）。メンバー数と文字数が Devin 71k 字 vs Codex 3.6k 字と大きく違うので、比較は正規化値で見る。

| 規則 | Devin | Claude | Codex | opencode | 不明 |
|---|---|---|---|---|---|
| pause_comma | 36 (0.51) | 80 (1.83) | 9 (2.47) | 6 (1.53) | 12 (1.44) |
| negative_parallelism | 41 (0.58) | 21 (0.48) | 1 (0.27) | 6 (1.53) | 7 (0.84) |
| excess_list | 24 (0.34) | 8 (0.18) | 2 (0.55) | 1 (0.26) | 0 |
| dash_decoration | 28 (0.39) | 2 (0.05) | 0 | 0 | 0 |
| trailing_colon | 24 (0.34) | 0 | 0 | 0 | 0 |
| calque | 8 (0.11) | 8 (0.18) | 0 | 4 (1.02) | 0 |
| slop_vocabulary | 11 (0.15) | 2 (0.05) | 0 | 0 | 0 |
| negative_parallelism_density | 5 (0.07) | 4 (0.09) | 0 | 1 (0.26) | 1 (0.12) |
| metaphor_label | 8 (0.11) | 0 | 0 | 0 | 0 |
| metaphor_verb | 3 (0.04) | 0 | 0 | 0 | 0 |
| katakana_term | 2 (0.03) | 1 (0.02) | 0 | 0 | 0 |
| dash_insertion | 3 (0.04) | 0 | 0 | 0 | 0 |
| emoji_prohibited | 3 (0.04) | 0 | 0 | 0 | 0 |
| meta_filler | 2 (0.03) | 0 | 0 | 0 | 0 |
| translated_term | 1 (0.01) | 1 (0.02) | 0 | 0 | 0 |
| short_summary_heading | 1 (0.01) | 0 | 0 | 0 | 0 |
| renyo_noun | 1 (0.01) | 0 | 0 | 0 | 0 |
| summary_restatement | 0 | 1 (0.02) | 0 | 0 | 0 |

## 除外版集計（機械的変換・訳語既知の 9 規則を除外）

除外した規則: pause_comma, excess_list, dash_decoration, dash_insertion, trailing_colon, calque, emoji_prohibited, translated_term, katakana_term。

| | メンバー数 | 総文字数 | 残り候補 | 密度 (候補/千字) | warn | info |
|---|---|---|---|---|---|---|
| Devin（SWE-2） | 33 | 71,215 | 72 | 1.01 | 16 | 56 |
| Claude Code（Opus 5.5） | 20 | 43,737 | 28 | 0.64 | 2 | 26 |
| Codex（GPT-6.1 Sol） | 3 | 3,643 | 1 | 0.27 | 0 | 1 |
| opencode（DeepSeek V4 Flash） | 1 | 3,910 | 7 | 1.79 | 0 | 7 |
| 不明 | 2 | 8,350 | 8 | 0.96 | 0 | 8 |
| 全体 | 59 | 130,855 | 116 | 0.89 | 18 | 98 |

## 残り規則別の分布（除外版）

| 規則 | Devin | Claude | Codex | opencode | 不明 |
|---|---|---|---|---|---|
| negative_parallelism | 41 (0.58) | 21 (0.48) | 1 (0.27) | 6 (1.53) | 7 (0.84) |
| negative_parallelism_density | 5 (0.07) | 4 (0.09) | 0 | 1 (0.26) | 1 (0.12) |
| slop_vocabulary | 11 (0.15) | 2 (0.05) | 0 | 0 | 0 |
| metaphor_label | 8 (0.11) | 0 | 0 | 0 | 0 |
| metaphor_verb | 3 (0.04) | 0 | 0 | 0 | 0 |
| meta_filler | 2 (0.03) | 0 | 0 | 0 | 0 |
| renyo_noun | 1 (0.01) | 0 | 0 | 0 | 0 |
| short_summary_heading | 1 (0.01) | 0 | 0 | 0 | 0 |
| summary_restatement | 0 | 1 (0.02) | 0 | 0 | 0 |

## 規則の意味（ヒット総数順）

| 規則 | 検出するもの | severity |
|---|---|---|
| pause_comma | 「間を作るだけの読点」（短い主題・主語・目的語の直後） | info |
| negative_parallelism | 「AではなくB」の否定対比。誤解の訂正は残す | info |
| excess_list | 箇条書き比率が高い文・節 | warn |
| dash_decoration | em dash・罫線の装飾的な使い方 | warn |
| trailing_colon | 文末の装飾コロン | warn |
| calque | 直訳語（機械の動作の擬人化、場所のたとえ、一語ずつ写しなど 5 型） | info |
| slop_vocabulary | AI っぽい比喩的語彙（装置・ゲート・温度感等） | info |
| negative_parallelism_density | 否定対比の文書単位の密度 | info |
| metaphor_label | 比喩的な節見出し | info |
| metaphor_verb | 比喩動詞（「効く」「溶かす」「潰す」型） | warn |
| katakana_term | カタカナ語自体が訳語のもの | info |
| dash_insertion | 文へのダッシュ挿入 | warn |
| emoji_prohibited | 絵文字 | warn |
| meta_filler | 「重要なのは」型の前置フィラー | info |
| translated_term | 漢字訳語（版・回帰など） | info |
| short_summary_heading | 「まとめ」的な短い見出し | info |
| renyo_noun | 連用形名詞（「結果の確かめ」型） | info |
| summary_restatement | 「まとめると」型の言い直し締め | info |
