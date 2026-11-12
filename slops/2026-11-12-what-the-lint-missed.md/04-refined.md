## refine-slops スキルの適用結果

> [!NOTE]
> 執筆: Devin（SWE-2 Max）。README.md の初稿に `.agents/skills/refine-slops/` を適用した後の本文。内容は README と同じで、文の形だけが変わっている。差分と残した判断は [03-diff-and-review.md](#03-diff-and-reviewmd)。図は本文と同じものがこの位置に入る。

### 問い

[issue #167](https://github.com/podhmo/html-sandbox/issues/167) で「LLM の文章がなぜひどいか」の調査をして、まず手近な yomiyasu（日本語 AI 文向けの推敲スキルと lint）を試すことにした。[issue #169](https://github.com/podhmo/html-sandbox/issues/169) では、yomiyasu の lint を slops の記事全体に適用してみた。問いは 2 つある。

1. 記事を書いた生成ツール（Devin・Claude Code・Codex・opencode）の違いは、lint の候補の分布に現れるか。
2. Claude Code の出力する文章に残る特有の読みにくさは、lint の数値として取得できるか。

### 方法

`yomiyasu_lint.py` v3.0.1 を `--doc-type article --json` で、全 59 の `.md` メンバー（単独記事 24、バンドルメンバー 35）に適用した。コード・SVG・txt のメンバーは対象外。

帰属は各記事の冒頭にある「執筆」表記に従った。この表記は別の作業（[PR #170](https://github.com/podhmo/html-sandbox/pull/170)）で全記事に付けたもので、値は本文を書いたコミットの `Co-Authored-By` トレーラーと PR 本文の 🤖 マーカーから推定している。`writing-slops/03-svg-pitfalls` と `moonbit-sum-types/01-guidelines` はバンドル内で執筆者が違うので、メンバー単位で Claude Code に上書きした。帰属が確定できない 2 記事は「不明」として別集計にした。この 2 記事は後で中身から Claude Code おそらくと判断されたが、集計時の区分はそのままにしている。

集計は 2 段で行った。最初に全規則を含めて集計し、次に「機械的に変換できる不備」（読点・ダッシュ・コロン・絵文字・箇条書き率）と「直接の訳語が分かる語」（calque・translated_term・katakana_term）の 9 規則を除外して再集計した。除外した側に 379 候補中 263 候補（69%）が集まった。

### 観察

（ここに本文と同じヒートマップ図が入る）

- 量では分かれない。候補密度は Devin 2.82、Claude Code 2.93、全体 2.90 候補/千字。この issue の最初に行った 10 メンバー対象の集計で見えた差（1.46 vs 2.57）は、全集では消えた。執筆者差は候補の量ではなく、規則の層にある。
- 最大の差は pause_comma（「間を作るだけの読点」）で、Claude 1.83 vs Devin 0.51/千字。ただし Codex 2.47・opencode 1.53 も Devin より高いので、「Claude が高い」というより「Devin が低い」と読むのが正確そうだ。
- warn の大半は Devin の機械的な書式不備だった。trailing_colon（24 件すべて Devin）と dash_decoration（28 件中 Devin 26）が、Devin の warn 99 件の大部分を占める。
- 機械的層を除くと順位が逆転する。除外版では Devin 1.01 vs Claude 0.64 候補/千字。つまり文意の判断が要る候補は Devin のほうが多い。
- 残り候補は negative_parallelism にほぼ一本化し、正規化では全生成系でほぼ同率（Devin 0.58、Claude 0.48）。これは Claude 特有の指標にはならない。
- Devin 固有の偏りは語彙側にあった。slop_vocabulary（「引き継ぎ装置」「品質ゲート」「温度感」「手触り」など 11 件 vs Claude 2 件）と metaphor_verb（「性質が効いてくる」「時間を溶かす」など 3 件 vs 0 件）。
- metaphor_label の 8 件はすべて `## 動機` `## 非目標` のような普通の節見出しで、事実上の誤検出だった。

### Claude Code 特有の読みにくさは発見できなかった

moonbit-sum-types のバンドルは、Claude Code が書いた 01-guidelines.md と Devin が書いた部分（README・03-implementation.md）に分かれている。人間が読むと Claude Code の部分だけでも読みにくさを感じるが、そのメンバーの lint 候補は 4 件しかない。内訳は excess_list と negative_parallelism が 1 件ずつ、pause_comma が 2 件だ。Devin の部分と同程度で、03 が 4 件、README が 2 件だった。バンドル全体でも 10 件で、部分を見ても全体を見ても読みにくさはスコアに現れない。違和感の実体は文書レベルにある。01-guidelines.md では兆候 7 項目から置き換え先の表、しない方がよい状況 9 項目、state machine の条件、点検手順へと番号つき分類が連鎖し、「これは7の例外として」「先に『どの構造を』の 2 を確かめる」のように項目どうしが番号で相互参照される。README 側にも「変えたもの」だけでなく「変えなかったもの」 9 項目を理由つきで列挙する網羅的対称があり、全メンバーで段落のトーンが一様だ。どれも測る規則が yomiyasu には存在しない。

そして本命の問いである「Claude Code の読みにくさ」はスコアに乗らなかった。最も近い代理は pause_comma だったが、読点そのものが読みにくさなのではなく、長い文を読点でつなぐ組み立てが生む症状の末端を拾っているにすぎない。節数/文・係り受けの深さ・行為の名詞化といった、その組み立て自体を測る規則は lint にない。全規則が行・文レベルの語彙・書式・定型の検出だ。

つまり穴は 2 層ある。

- 文レベルだが形態素・係り受けが要る層: 文の構造複雑度（節数/文、修飾の深さ、名詞化、無生物主語、行為者が格から外される形）。Zonder の hidden characters and actions の日本語版に相当する。
- 文書レベルの層: 網羅的対称・足場構造・一様リズム。木構造に役割（導入・基準・根拠・反例・まとめ）を付けて位置・親・兄弟関係で解釈を分岐する必要がある。

### 次回は自作の規則を考える

収集対象を 3 つに分けた。「直したい層」の選定と slop_vocabulary の許容判断は依頼者の評価に基づく。

- 直したい層（文レベル・文意系）: negative_parallelism（筆頭。密度規則で多い箇所だけ摘む運用）、metaphor_verb（実表現を眺めて「鼻につく」と判断された層）、meta 系（meta_filler・summary_restatement・short_mochiron・say_hedge・thin_evaluation）、renyo_noun。watch として instruction_residue・cleft_list_ending。
- 特徴量として集める層（文書レベル）: excess_list・list_ratio・bold_per_1000、negative_parallelism_density、summary_restatement・short_summary_heading・sentence_end_repetition。直す対象ではないが、文書の形を見る代理メトリクス。
- 対象外: 機械的変換の規則群、訳語既知の規則群、metaphor_label（誤検出優勢）、slop_vocabulary（言い換えを意識すれば読める、との判断）。

この 2 層の穴を補うために、自作 lint の構想を [issue #171](https://github.com/podhmo/html-sandbox/issues/171) に切り出した。形態素・係受け解析で文レベルの構造特徴を取り、文書は木構造＋役割付けで扱う。語彙リストは持たない方針で、これは kuden の「言葉尻より構造」と同じ立場だ。判定ではなく特徴量を集める設計にする。

さらに lint の実装の前に、計測フェーズとして [issue #172](https://github.com/podhmo/html-sandbox/issues/172) を分けた。[issue #169](https://github.com/podhmo/html-sandbox/issues/169) と同じ「全記事に適用して執筆者別に集計」を、今度は節数/文・係受け深さ・名詞化率・文書構造メトリクスといった新しい特徴量でやる。分離度が見えた特徴量だけが lint の規則候補になる、という順番にした。

- 形態素・係受けベースの特徴量はまだ実装していない。ツール選定のメモは [#172](https://github.com/podhmo/html-sandbox/issues/172) にある。形態素・係受けの両方を pip だけで取れる GiNZA 系が第一候補で、n-best が取れる JUMAN++ 系は意味情報の豊かさが別の強みになる。
- n-best 解析で「best と 2nd の係り先が違う文」を曖昧さの指標にする案はアイデア段階。係受け層で n-best を出せるツールが少なく、parser 間の不一致を代用する案も検討中。
- 「直したい層」の規則で記事を実際に直す運用は試していない。今回は収集と分類だけ。

### おそらくやらないこと

- IdeaLens 型の文書→役割付きアウトライン変換を LLM 判定層に使う案は未検証。日本語記事で outline が成立するかも分かっていない。

### データと参考

集計の全表へのリンクは [01-data.md](01-data.md) に、外部資料とそれぞれ何を確認したかは [02-references.md](02-references.md) に分けてある。

### 余談

Devin（SWE-2）が書いた部分には、最初は読みにくさを感じていなかった。だが改めて眺めると、Claude Code の部分と同様の読みにくさが内包されていた。網羅的対称や一様なトーンのような文書レベルの特徴は執筆者を選ばない。これは Claude Code 特有ではなく AI 特有の読みにくさと言ってよい。
