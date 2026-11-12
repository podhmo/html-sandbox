# 日本語 NLP 計測環境のメモ (issue #172)

形態素・係受け・文書構造の特徴量を slops 全メンバーに対して計算したときの、環境構築方法と利用時の落とし穴の記録。スクリプトは `tools/slops-metrics/measure.py`、出力は `tools/slops-metrics/out/`。

## 環境設定の方法

この環境 (WSL2) のシステム Python は 3.14 で、spaCy 系の wheel がまだ無い可能性があるため `uv` で 3.12 を用意する。pip ではなく uv で入れると速い。

```sh
cd tools/slops-metrics
uv venv --python 3.12 .venv
uv pip install -r requirements.txt   # ginza / ja-ginza / markdown-it-py を固定
```

実行:

```sh
.venv/bin/python measure.py
```

- `out/members.jsonl`: メンバーごとの全指標
- `out/report.md`: 著者別集計 + claude-vs-devin の Cohen's d ランキング (issue コメントの表のもと)

## クリーンアップ

実験環境を消すとき:

- `tools/slops-metrics/.venv` — `rm -rf .venv` で削除。再現は `uv venv --python 3.12 .venv && uv pip install -r requirements.txt` でいつでもできる
- `tools/slops-metrics/out/` — 再生成できるが、issue コメントの表のもとになっているので残してある
- JUMAN 試行の残骸: `apt-get download` + `dpkg -x` で `/tmp/juman-local` に展開し、`.jumanrc` を `/tmp/juman-local/.jumanrc` と `~/.jumanrc` に置いた。計測には使っていないので両方削除済み (juman は HOME かカレントの `.jumanrc` を読む。`~/.jumanrc` を残すと存在しない /tmp の辞書を指す設定が残って他の利用を壊すので注意)
- uv が入れた Python 3.12 自体を消すなら `uv python uninstall 3.12` (他の用途で使っていなければ)

## 利用時の落とし穴

### パッケージ構成

- **`pip install ginza` だけではモデルが入らない**。`spacy.load("ja_ginza")` が E050 で落ちる。`ja-ginza` (= モデルパッケージ) の明示インストールが必要。requirements に両方書いてある
- GiNZA を入れると sudachipy + sudachidict-core が依存で来る。形態素の補助解析 (連用形名詞の推定) に同じ tokenizer をそのまま使える
- **markdown-it-py の `gfm-like` は linkify を有効にする**が `linkify-it-py` は別パッケージ。要らないなら `MarkdownIt("commonmark").enable("table")` にする (slops の表は GitHub 風パイプなので table だけで足りる)

### spaCy / GiNZA の API

- **`token.head` は毎回新しい Token オブジェクトを返す**。`h is not t` や `h.head is h` の同一性比較は常に偽になり、根まで辿るループが止まらない (depth がカンストする)。**必ず `.i` (index) で比較する**
- GiNZA の `doc.user_data` に文節・節の情報が入る:
  - `bunsetu_heads`: 各文節の先頭 token index のタプル
  - `clauses`: {節の head token index: 節内 token index のリスト}。文の中の key 数 = 節数/文
  - `clause_heads`: token index → 所属節の head index
- `ginza.bunsetu_spans(doc)` で文節の Span が取れる。「読点が文節末にあるか」は `、の次 token が文節先頭か` で照合できる
- 品詞タグは UniDic 系 (`名詞-普通名詞-サ変可能` 等)。サ変名詞は `サ変可能` で拾えるが、**連用形名詞 (「確かめ」型) は `名詞-普通名詞-一般` で一般名詞と区別が付かない** → 別途推定が必要 (後述)
- UD dep ラベル: 主語は `nsubj`/`csubj`、節っぽい従属は `advcl`/`acl`/`ccomp`/`xcomp`。「は」主題は `case` として名詞に付く

### 日本語 NLP ツールの選択

連用形名詞化・意味カテゴリを決定的に取りたくて JUMAN 系も試したが、この環境 (sudo なし) では挫折:

- **JUMAN (apt の juman 7.0)**: `apt-get download` + `dpkg -x` で非 root ローカル展開はできる。バイナリは動くが、`.jumanrc` でローカルの文法・辞書を指定しても解析結果が空 (EOS のみ) になる。原因追及は打ち切り
- **JUMAN++/KNP**: Ubuntu 26.04 の apt にパッケージ自体が無い。ソースビルドは実験フェーズの費用を超える
- **CaboCha**: 同上

→ GiNZA の UD 係受け + Sudachi の辞書情報で近似する方針に落ち着いた。

## 推定系の特徴量

### 無生物主語+動作動詞 (Clark, Martin & Mahowald 論文の特徴の写し)

`nsubj`/`csubj` で、主語の lemma が小さな有生リスト (私・人・ユーザー等) に無い → 無生物主語。その head が `VERB` で軽動詞 (ある/いる/なる/する/できる/である 等) でなければ「動作動詞」とみなす。passive や慣用的な無生物主語も混ざる雑さはあるが、全著者に同一の歪みなので比較には使う。

### 名詞積み上げ・連体修飾

- 名詞積み上げ: 連続する `NOUN` token で各々が `compound`/`nmod` で繋がる run が 3 以上 (日本語の漢語連結の近似)
- 連体修飾: `acl` dep の数と、その subtree の token 数 (>=5 を長い修飾として別カウント)

### 連用形名詞の推定

「確かめ」型のヒューリスティック:

1. 候補は `名詞-普通名詞-一般` で末尾がひらがな (送りがなのある形だけに絞る)
2. `表層+る` (一段・ラ行五段) と `末尾をウ段に置換` (五段: い→う, き→く, …) を Sudachi で単語 tokenize し、1 形態素かつ `動詞` なら連用形名詞とみなす
3. 誤爆として `なし` (なすと同形), `はず`, `わけ` (わける), `ほう` (ほうる), `とも`, `つの`, `あり` をストップリストで除外

検出例: 問い, 答え, 違い, 扱い, まとめ, 組み立て, 区切り, 見立て, 引き継ぎ, 読み上げ, 使い分け, 試し, 感じ — おおむね精密。「の+連用形」のサブセットは、その名詞が `の` 付き nmod 子を持つかで判定。

## 文の単位とテキスト抽出

- markdown-it-py の block token を辿り、kind を判定: paragraph / list_item / blockquote / heading / table_cell / fence / html
- **prose = paragraph + list_item + blockquote** のテキストだけを GiNZA にかける (見出し・表セルは文としての性質が違うので文系指標からは外し、面積比側に回す)
- `[!NOTE]` 等のアラートマーカーは剥がす。inline では text / code_inline / link テキストを結合 (リンク先 URL は捨てる)
- `執筆:` 行も blockquote の prose として解析対象に含む (1 メンバーあたり 1 行以下で影響は小さいと判断)
- コード fence と ` ```svg ` fence は面積のみ計測 (svg は図なのでコードと分離して記録)

## 帰属の決め方

#169 と同じルール: メンバー自身の `執筆:` 行 → 無ければバンドル README の `執筆:` を継承。`おそらく`/`たぶん` 付きは unknown。`writing-slops/03-svg-pitfalls` と `moonbit-sum-types/01-guidelines` は Claude に上書き (#169 と同じ)。

今回の対象は 65 メンバー。#169 時点の 59 に `2026-11-12-what-the-lint-missed.md` の 6 メンバーが増えた分 (全て Devin 帰属)。このバンドルは他記事の引用・diff を多く含む点だけ注意。
