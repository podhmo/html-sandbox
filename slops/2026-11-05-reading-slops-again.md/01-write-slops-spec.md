# 現状の write-slops の指定

2026-11-05 時点の [SKILL.md](https://github.com/podhmo/html-sandbox/blob/main/.claude/skills/write-slops/SKILL.md) と、そこから参照されるファイルを、一つずつ「何を縛っているか」「何が守らせているか」で並べた。強制の欄の「なし」は、読んだエージェントが従うかどうかに任されているという意味。

## SKILL.md の本文

| 節 | 指定 | 縛るもの | 強制 |
| --- | --- | --- | --- |
| 冒頭 | 依頼された言語と題材を使う | 内容 | なし |
| 冒頭 | 問い・観測した結果・試していない案・決定を区別できるようにする | 内容の組み立て | なし |
| 冒頭 | 作者の好み・測定値・将来の約束を作らない | 誠実さ | なし |
| 冒頭 | 論文や本を作者の声で引かない。未読の文献は AI-written と書いた別メンバーに分け、項目ごとに何を確かめたかを書く | 誠実さ・置き方 | なし |
| Markdown | preview の依頼には、前置きも外側のフェンスもない Markdown を 1 本返す | 出力形式 | なし |
| Markdown | 見出し・段落・リスト・引用・表・インラインコード・リンクの範囲で書く | 記法 | renderer（対応外は文字のまま出る） |
| Markdown | フェンスはバッククォート 3 つだけ | 記法 | renderer |
| Markdown | `*` による太字・強調を使わない（行頭の `* ` は可） | 記法 | なし（そのまま `*` が見える） |
| Markdown | 番号付きリスト、画像記法、`data:` 画像、Mermaid、ハイライトに頼らない | 記法 | renderer |
| Markdown | front matter は `title`、`description`、`prev`、`next` だけ | 記法 | parser |
| 図を試す | slops では SVG の図を積極的に試す（実験的な好みで、preview 用プロンプトには含めない） | 図 | なし |
| 図を試す | 位置・大きさ・形・重なり・状態の変化に意味を持たせる。文を箱と矢印に並べ替えない | 図 | なし |
| 図を試す | 散文より何が見やすくなるかで判断し、駄目なら直すか外す。失敗例は反例と明記したときだけ残す | 図 | なし |
| svg-gen | 図は tools/svg-gen で生成する。`fig-*.ts` は記事に添付しない | 図・置き方 | 生成側は `check.ts` の lint |
| svg-gen | `chart.ts` の `Plot` は `{title, subtitle, footnote}` が必須。仮想データはそう書く | 図 | 型（必須引数） |
| svg-gen | 既定は `currentColor`。colorful は `PALETTE` から、文字は `currentColor`、色なしでも読めるよう破線や太さを残す | 図 | `check.ts` の警告 |
| svg-gen | 新しい失敗は 03-svg-pitfalls に記録する | 図 | なし |
| svg フェンス | 開始行は小文字の `svg` だけ。他の言語指定はコードとして出る | 記法 | renderer |
| svg フェンス | 小さく作る。フォントを埋め込まない。`currentColor` の図では色名で参照しない。`id` を図ごとに分ける。`aria-label` か `<title>` を付ける | 図 | 一部は `check.ts` |
| svg フェンス | スクリプト、イベント属性、`foreignObject`、外部資源を入れない | 安全 | `check.ts` |
| 置き方 | 1 ファイルか、同名のフラットなバンドル。日付と小文字のスラッグ | 置き方 | loader |
| 置き方 | README.md が顔、ほかのメンバーは名前順に 1 ページに並ぶ | 置き方 | loader |
| 置き方 | サブディレクトリとバイナリ画像は置けない | 置き方 | loader |
| 置き方 | 相対リンクはそのメンバーの場所から書く | 置き方 | なし |
| 確認 | `/preview` とローカルのブログで確かめ、内容を変えたら `make test-go` | 確認 | CI（読み込みとルート） |
| 確認 | どのレンダラとチェックを使ったかを報告する。デプロイや外部公開は含まない | 報告・範囲 | なし |

## 参照されている周辺のファイル

- [01-preview-prompt.md](../2026-10-27-writing-slops.md/01-preview-prompt.md): ほかの LLM に渡す出力形式の指定。「創作の内容や方針は、そのプロンプトに従ってください」と、内容を自分の外に出している。
- [02-bundle-prompt.md](../2026-10-27-writing-slops.md/02-bundle-prompt.md): バンドルの作成依頼のひな形。「次のテーマで日本語の記事を作ってください」に、テーマ・日付・スラッグ・材料の穴を埋める形。
- [03-svg-pitfalls.md](../2026-10-27-writing-slops.md/03-svg-pitfalls.md): 図でつまずいたところの蓄積。
- `.claude/skills/write-slops/agents/openai.yaml`: 既定のプロンプトは「write an AI-authored article for slops with Markdown suitable for this blog and its preview」だけ。
- AGENTS.md: slops を書くときはこのスキルを読め、という一文。

## 書かれていないのに効いているもの

- 既存の記事。[沈黙を肯定とみなす記事の一覧](../2026-11-03-silence-as-consent.md/01-requirements.md)が、「この記事は〜の記録」型の語り、「主題 — 結論」型のタイトル、末尾の「残った問い」などを暗黙の要求として挙げている。
- `tools/slops-nav` による prev/next の検査。
- 依頼文そのもの。問いの形で頼まれると、答えの形で書かれやすい（silence-as-consent はそうだった。answers-under-constraints の依頼文は見ていない）。

## 文体に触れている箇所

ない。近いのは冒頭の「the question」と、バンドル用プロンプトの「テーマ」の二語くらいで、どちらも記事を「問いとその答え」「テーマについての論」として組む読み方を許している。命じてはいない。

## 変えるとしたらの候補

どれも適用していない。効果も確かめていない。

- 冒頭の「Keep the question, observed results, ...」の question を request に寄せる。問いへの答えとして組む読み方が少し減るかもしれない。
- 語り手が誰かという事実だけを書く。書いているのは AI で、依頼した人ではない、ということ。文体の指定ではなく立場の事実だが、これも一つの縛りにはなる。
- docs/sketch との境目を一文足す。次に手を動かす人のための規則・手順・数値は docs/sketch に置き、slops からはリンクする、という程度。
- 何も変えない。文体の差を残したいなら、スキルに書くより、そのつど依頼文で伝えるほうが縛りは弱い。
