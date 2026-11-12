> [!NOTE]
> 執筆: Devin（SWE-2 Max）。このメンバーは外部資料の一覧で、著者（依頼者）が読んでいない資料を AI が集めたもの。各項目に何を確認したかを書く。

## 外部資料

- GiNZA / ja-ginza 5.3.0 — https://github.com/megagonlabs/ginza : 形態素 (Sudachi/UniDic)・UD 係受け・文節・節の解析に使用。確認: 実際に全メンバーに実行した。文節・節の API は `doc.user_data` 経由で、README とソースで確認した。
- markdown-it-py 4.3.0 — https://github.com/executablebooks/markdown-it-py : Markdown の構造解析。確認: 実ソースと preset 一覧。`commonmark` + table を使い、`gfm-like` は linkify-it-py 依存で断念した。
- SudachiPy / sudachidict-core — GiNZA の形態素解析の下層。連用形名詞の推定に、候補語を辞書に再解析させて動詞かどうかを見る使い方をした。確認: 実際に実行して推定精度を目視した。
- Clark, Martin & Mahowald, "Why is AI-generated language so hard to understand?" (arXiv:2610.29162) — 無生物主語+動作動詞・名詞積み上げ・denominal verb・依存距離の枠組みとして対応づけた論文。確認: 未読。[issue #167](https://github.com/podhmo/html-sandbox/issues/167) の調査メモ内の要約のみ。記事内の「論文特徴」はそのメモの特徴名から取ったもので、元論文の定義そのものではない。

## リポジトリ内

- [issue #172](https://github.com/podhmo/html-sandbox/issues/172) — この記事の作業対象。集計表はコメントに全量ある。
- [issue #169](https://github.com/podhmo/html-sandbox/issues/169) — 前回の yomiyasu lint 集計。集計形式 (密度正規化・執筆者別) を引き継いだ。
- [issue #167](https://github.com/podhmo/html-sandbox/issues/167) — 論文特徴の出典になった調査メモ。
- [issue #171](https://github.com/podhmo/html-sandbox/issues/171) — この計測の特徴量を規則候補にする自作 lint の構想 (未実装)。
- [what-the-lint-missed](../2026-11-12-what-the-lint-missed.md/) — 前の記事。[issue #169](https://github.com/podhmo/html-sandbox/issues/169) の集計記録で、「lint に届かない層」の分解はこの記事の測りたい対象だった。
- [slops-use-case-templates](../2026-11-05-slops-use-case-templates.md/) — ジャンル統制に使った目的分類の出典 (`01-use-cases.md` の表)。
- `tools/slops-metrics/` — `measure.py` (特徴量の抽出と執筆者集計), `genre.py` (ジャンル別の層別化), `out/` (結果)。
- `docs/sketch/ja/slops-172-measure.md` — 環境構築・クリーンアップ・落とし穴の記録。
- [PR #175](https://github.com/podhmo/html-sandbox/pull/175) — 計測ツールと環境メモのブランチ `measure/issue-172-features`。
