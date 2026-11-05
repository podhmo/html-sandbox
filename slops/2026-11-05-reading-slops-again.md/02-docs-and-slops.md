# docs/ と slops/ の使い分け

2026-11-05 時点のリポジトリにあるものを並べた。言語の決まりは AGENTS.md による。slops が日本語なのは AGENTS.md の決まりではなく、これまでの慣例。

| 場所 | 言語 | 主な書き手 | 読み手 | 書き直すか | 中身 |
| --- | --- | --- | --- | --- | --- |
| posts/ | 日本語 | podhmo | ブログの読者 | 書いた時点のまま | 人間の記事 |
| docs/*.md | 英語 | エージェント | このリポジトリで作業する人とエージェント | 最新に保つ | 開発の手順（develop.md） |
| docs/ja/ | 日本語 | エージェント | 同上 | 最新に保つ | 設計（design.md、layout.md） |
| docs/sketch/ja/ | 日本語 | エージェント | 次に同じことをする人とエージェント | 追試や訂正で書き直す | 調査メモ・探索メモ・実験レポート・ガイド。制約、何が通って何が通らないか、手順、後片付け、試していないもの |
| slops/ | 日本語 | AI | 何が起きたかを知りたい人 | 日付のまま。足すときは追記として足す | 起きたことの記録と、その解釈 |
| TODO.md | 日本語 | 人とエージェント | 次にタスクを拾う人 | 常に更新 | これからやること |

docs/sketch/ja の見出しは「調査メモ:」「探索メモ:」「調査レポート:」「実験レポート:」「ガイド:」で始まっていて、それだけで種類が分かる。slops の見出しにはそういう前置きがない。

## 同じ作業から両方が書かれた組

| 作業 | docs/sketch/ja | slops | PR |
| --- | --- | --- | --- |
| 図・グラフのガイドライン | figure-guidelines.md | 2026-11-01-chart-gen | [#114](https://github.com/podhmo/html-sandbox/pull/114) |
| HTML レポートのスキル | html-report-skill.md | 2026-11-03-html-report-variations | [#116](https://github.com/podhmo/html-sandbox/pull/116) |
| DADS イラストの LoRA | dads-illustration-lora.md | 2026-11-03-dads-illustration-lora | [#120](https://github.com/podhmo/html-sandbox/pull/120) |
| WSL2 の TTS | tts-wsl2.md | 2026-11-05-answers-under-constraints | [#127](https://github.com/podhmo/html-sandbox/pull/127)、[#129](https://github.com/podhmo/html-sandbox/pull/129) → [#131](https://github.com/podhmo/html-sandbox/pull/131) |

前の 3 組は同じ PR で両方が入っている。sketch 側が調べた結果と手順で、slops 側がその経緯や振り返り。TTS の組だけは、sketch が 2 回書き直されたあとで、別の PR として slops が書かれた。

## 境目にあるもの

- answers-under-constraints の「記録の側でできること」: 規則に条件を書く、計測値に回数を添える、といった書き方の決まり。次に手を動かす人のための内容で、同じことは tts-wsl2.md の追試の節に入っている。slops には「追試でそう書き直した」という出来事があれば足りる。
- silence-as-consent の [01-requirements.md](../2026-11-03-silence-as-consent.md/01-requirements.md): 明示と暗黙の要求の一覧。運用のルールとして使うならスキルや docs の側だが、ある日の観測として日付付きで残すなら slops で合っている。今は後者として読める。
- tts-wsl2.md の冒頭にある「依頼は〜というものだった」: sketch にも依頼の記録はある。sketch は依頼を前提条件として書き、slops は依頼を出来事として書く、という違いになりそう。

## 迷ったときの目安

- 読んだ人がそれを実行するなら sketch。
- 数値が変わったら書き換えるなら sketch。書き換えずに「あとでこうなった」と書き足すなら slops。
- 依頼した人とのやりとりや、そのとき思ったことが話の中心なら slops。
- 「自分は」と書きたくなったら、たぶん slops。
