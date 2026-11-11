> [!NOTE]
> 執筆: Devin（SWE-2 Max）。このメンバーは外部資料の一覧で、著者（依頼者）が読んでいない資料を AI が集めたもの。各項目に何を確認したかを書く。

## 外部資料

- yomiyasu — https://github.com/nanaism/yomiyasu : 日本語 AI 文の推敲スキルと lint。確認: lint スクリプト `yomiyasu_lint.py` v3.0.1 の実ソース（規則一覧・severity・判定ロジック）と SKILL.md。ローカルの `~/ghq` チェックアウトで確認した。
- Zonder Labs「AI Slop Has a Name」 — https://zonderlabs.com/slop : 欠陥の類型（hidden characters and actions 等）の元になった記事。確認: 記事本文。issue #167 の調査メモ経由だが、本文中の類型名と主張は記事そのものを読んで取った。
- kuden — https://github.com/shokai/agent-skills : 「語の禁止表ではなく文の構造を見ろ」という立場のスキル群。確認: 9 個の SKILL.md すべて（issue #167 の調査メモ）。
- IdeaLens (Rajendhran et al., arXiv:2610.06778) — 文書を discourse role + 内容のアウトラインに変換して idea provenance を判定する研究。確認: 論文と公開リポジトリ（GitHub: RishanthRajendhran/IdeaLens）の feature bank の定義（issue #167 の調査メモ）。
- Williams『Style: Toward Clarity and Grace』 — 「character/action」の修辞学的な元。確認: 未読。Zonder 記事と yomiyasu の解説経由の言及のみ。
- Clark et al.（LLM 文体の心理言語学的研究） — 依存距離・uniform information density の枠組みとして引用されている。確認: 未読。issue #167 の調査メモ内の言及のみ。
- 蔡盛植（2014、動詞連用形の構文論的研究） — renyo_noun 規則の線引きの根拠として yomiyasu が挙げる。確認: 未読。yomiyasu 経由の言及のみ。

## リポジトリ内

- issue #167「LLMの文章がひどい理由を整理したい」 — 先行調査（Zonder・yomiyasu・kuden・IdeaLens のメモ）。
- issue #169「slops 記事への yomiyasu lint 適用による執筆者別の分布調査」 — この記事の集計データの出典（closed）。
- PR #170 — 全記事への執筆者表記の付与（集計の帰属データとして使用）。
- issue #171 — 自作 lint の構想（届かない層を埋めるツール）。
- issue #172 — lint 実装の前の計測フェーズ（特徴量の集計とツール選定メモ）。
- TODO.md — 「隠れたキャラクター・文書構造を検査する自作 lint を作る」のタスクとして登録済み。
