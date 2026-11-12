# issue #172 計測環境メモ

形態素・係受け・文書構造の特徴量を slops 全メンバーに対して計算したときの環境構築と判断の記録。スクリプトは `tools/slops-metrics/measure.py`、出力は `tools/slops-metrics/out/`。

## 環境

- Python は `uv` で 3.12 を用意（システムの 3.14 だと spaCy 系の wheel が無い可能性を避けた）
- `tools/slops-metrics/` に `uv venv --python 3.12 .venv` で仮想環境
- 依存は `requirements.txt` に固定: ginza 5.3.0 / ja-ginza 5.3.0 / markdown-it-py 4.3.0
  - `uv pip install -r requirements.txt` で入る。ginza 単体ではモデルが入らず `ja-ginza` の明示インストールが必要だった
  - markdown-it-py は `commonmark` + `.enable("table")` を使用。`gfm-like` だと linkify が有効になり別途 `linkify-it-py` が必要になるため
- GiNZA が sudachipy 0.6.11 + sudachidict-core を連れてくるので、形態素の補助解析（連用形名詞の推定）にも同じ tokenizer を使える

## 没になった選択肢

- **JUMAN (apt の juman 7.0)**: 連用形名詞化・意味カテゴリを決定的に取りたくて `apt-get download` + `dpkg -x` で非 root ローカル展開を試した。バイナリは動くが `.jumanrc` の文法・辞書ファイル指定では解析が空（EOS のみ）になり、原因追及を打ち切った。sudo なしの制約内では見送り
- **JUMAN++/KNP**: パッケージ自体が apt に無く、ソースビルドは実験フェーズの費用を超えるので対象外
- **CaboCha**: 同上

## 連用形名詞の推定

GiNZA では「確かめ」型は `名詞-普通名詞-一般` で一般名詞と区別が付かない。以下のヒューリスティックで近似:

1. 候補は `名詞-普通名詞-一般` で末尾がひらがな（送りがなのある形だけに絞る）
2. `表層+る`（一段・ラ行五段）と `末尾をウ段に置換`（五段: い→う, き→く, …）を Sudachi で単語 tokenize し、1 形態素かつ `動詞` なら連用形名詞とみなす
3. 誤爆として `なし`（なすと同形）, `はず`, `わけ`（わける）, `ほう`（ほうる）, `とも`, `つの`, `あり` をストップリストで除外

検出例: 問い, 答え, 違い, 扱い, まとめ, 組み立て, 区切り, 見立て, 引き継ぎ, 読み上げ, 使い分け, 試し, 感じ — おおむね精密。「の+連用形」のサブセットは、その名詞が `の` 付き nmod 子を持つかで判定。

## 文の単位とテキスト抽出

- markdown-it-py の block token を辿り、kind を判定: paragraph / list_item / blockquote / heading / table_cell / fence / html
- **prose = paragraph + list_item + blockquote** のテキストだけを GiNZA にかける（見出し・表セルは文としての性質が違うので文系指標からは外し、面積比側に回す）
- `[!NOTE]` 等のアラートマーカーは剥がす。inline では text / code_inline / link テキストを結合（リンク先 URL は捨てる）
- `執筆:` 行も blockquote の prose として解析対象に含む（1 メンバーあたり 1 行以下で影響は小さいと判断）
- コード fence と ` ```svg ` fence は面積のみ計測（svg は図なのでコードと分離して記録）

## 帰属の決め方

#169 と同じルール: メンバー自身の `執筆:` 行 → 無ければバンドル README の `執筆:` を継承。`おそらく`/`たぶん` 付きは unknown。`writing-slops/03-svg-pitfalls` と `moonbit-sum-types/01-guidelines` は Claude に上書き（#169 と同じ）。

今回の対象は 65 メンバー。#169 時点の 59 に `2026-11-12-what-the-lint-missed.md` の 6 メンバーが増えた分（全て Devin 帰属）。このバンドルは他記事の引用・diff を多く含む点だけ注意。

## 実行

```
cd tools/slops-metrics
.venv/bin/python measure.py
```

- `out/members.jsonl`: メンバーごとの全指標
- `out/report.md`: 著者別集計 + claude-vs-devin の Cohen's d ランキング（issue コメントの表のもと）

## つまづきメモ

- spaCy の `token.head` は毎回新しい Token オブジェクトを返す。`h is not t` / `h.head is h` という同一性比較は常に False/True になり depth が無限ループする。**必ず `.i` で比較する**
- GiNZA の `doc.user_data` は `bunsetu_heads`（文節先頭 token index）, `clauses`（節 head → token index 列）, `clause_heads` を持つ。節数/文は `clauses` の key で数える
- 文節は `ginza.bunsetu_spans(doc)` で span が取れ、読点が文節末（次 token が文節頭）かの照合に使う
