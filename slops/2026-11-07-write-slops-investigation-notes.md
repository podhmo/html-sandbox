---
title: 技術調査ノートのための slops 執筆スキルを作る
description: issue #133 で議論された技術調査後の記録に特化した執筆スキル write-slops-investigation-notes を作成し、対話の背景を踏まえた指示の洗練と agy からの参照リンクを整備した経緯を検証する。
prev: 2026-11-05-skill-for-new-articles.md
---

# 技術調査ノートのための slops 執筆スキルを作る

## 1. 前提と制約

この作業の目的は、コーディングエージェントが技術的な調査や環境構築を自律的に行った後に残す記事（slops）のための特化型スキル write-slops-investigation-notes を作成することだ。issue #133（コメント 6686188903）およびその背景となった対話の検討結果に基づき、既存の write-slops を基本仕様（tinymarkdown 記法、inline SVG、ファイル構成）として継承しつつ、技術調査ノートに特化した構成規則を定義する。あわせて Antigravity CLI（agy）がスキルを自動検出できるようにリンクを整備し、作成したスキル自身を使って本記事を執筆・検証する。

作業開始時点の環境と制約は次のとおり。

- 作業ツリー: origin/main（コミット 3c114fe）から新たな作業ブランチ agy/write-slops-investigation-notes を作成し、独立した git worktree 上で作業を進める。
- スキルの配置現状: 既存のリポジトリでは .claude/skills 配下に write-slops と todo-md が置かれ、.opencode/skills は .claude/skills への相対シンボリックリンクとなっている。agy 用のスキルパスはまだ定義されていない。
- 参照境界: 他のエージェントが作業中の PR（具体的には PR #128、PR #129）は参照しない。
- 記法制約: write-slops が定める tinymarkdown 規則に従い、太字や斜体の強調記号（アスタリスク）は一切使わない。図は tools/svg-gen で生成した inline SVG を用いる。

## 2. 試行と判断の経緯

既存の write-slops は、tinymarkdown や SVG 生成、記事バンドルといった形式面を厳格に規定している一方、本文で「何をどう語るか」の判断はエージェントと個別の依頼文に委ねられていた。2026-11-05 の記事群（answers-under-constraints、good-slops-for-requester、skill-for-new-articles）や issue #133 で指摘された課題は、まさにその自由度から生じていた。

エージェントに技術調査や試行の記録を任せると、次のような偏りが生じやすい。

- 一般論やディベート形式への脱線: 個別の具体的な事実や境界条件ではなく、エージェント自身の視点の鋭さをアピールしようとして抽象的な主張を展開してしまう。
- 回避策の無条件なルール化: その場の環境制約（特定のドライバ版や権限境界）を乗り切るためのワークアラウンドが、恒久的に必須の規則として記録され、以後の作業前提を歪めてしまう。
- 判断プロセスの不可視化: 自律的に問題を回避して動く状態にした際、どのような代替案を検討し、なぜ除外したのか（捨てた理由）が残らない。
- 自己反省への偏重: 振り返りを求めると、能力不足や手順の悔やみに終始してしまい、当初の調査目的に対する客観的な答えが抜け落ちてしまう。

依頼者である人間が事後的に読む記事において真に必要としているのは、反省文ではなく「どのような選択肢を検討し、どのような制約によって捨てたのか（捨てられた代替案とその理由）」という情報だ。ここで注意すべきは、「なぜ人間に聞かなかったのか」という反省を求めてしまうと、作業途中で人間に逐一伺いを立てる過剰防衛（自律性の喪失）を招く点である。エージェントは自律して作業を完結させつつ、事後的に読む記事の中で「選ばなかった代替案と当時の境界条件」を可視化することこそが、再現性の担保につながる。

こうした要件に基づき、スキルの名称と構成を次のように定めた。

名称については、tech-notes では一般的な技術解説に傾き、trial-log では奮闘記のような感情的スタンスが文体に乗る恐れがあったため、客観的な技術備忘録としてのガードレールを意識して write-slops-investigation-notes と命名した。

構成については、以下の 4 節を義務付けた。

1. 前提と制約: 当初の依頼を技術的な問いと検証条件に再構成し、初期条件（環境、権限、版）を簡潔に整理する。冒頭が対話ログで煩雑になるのを防ぐため、依頼プロンプトは逐語引用せず要約する。
2. 試行と判断の経緯: 実際の作業経過を骨格としつつ、タイムスタンプや手順の無機質な箇条書き（作業ログ・年表）を禁じ、前後の因果関係を結ぶ散文で記述する。除外した代替案と環境制約を明記し、途中で生じた要件変更も因果の転換点として組み込む。
3. 当初の問いへの結論: 最初の依頼や問いに対する客観的な結果、実測値、後片付け手順で完結させる。個人の反省や後悔は含めない。
4. 余談（今後の展望）: 本筋から外れた untried ideas や将来の方向性を、結びの後の独立した章に集約して配置する。

この構造と除外されるアンチパターンの関係を、tools/svg-gen を使って図にまとめた。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="4 4 720 250" width="720" height="250" role="img" aria-label="four sections of investigation notes and excluded anti-patterns">
<rect x="20" y="95" width="148" height="54" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="94" y="114.85" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">1. 前提と制約</text>
<text x="94" y="129.15" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">依頼要約と初期条件</text>
<rect x="200" y="95" width="148" height="54" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="274" y="114.85" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">2. 試行と判断</text>
<text x="274" y="129.15" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">因果の散文と捨てた理由</text>
<rect x="380" y="95" width="148" height="54" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="454" y="114.85" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">3. 問いへの結論</text>
<text x="454" y="129.15" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">検証結果と実測値</text>
<rect x="560" y="95" width="148" height="54" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="634" y="114.85" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">4. 余談・展望</text>
<text x="634" y="129.15" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">深追いしなかった案</text>
<path d="M171 122 L197 122" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M188 126.05 L197 122 L188 117.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M351 122 L377 122" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M368 126.05 L377 122 L368 117.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M531 122 L557 122" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M548 126.05 L557 122 L548 117.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<rect x="20" y="20" width="148" height="38" rx="8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.55"/>
<text x="94" y="39" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.55">除外: 一般論の主張</text>
<rect x="200" y="20" width="148" height="38" rx="8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.55"/>
<text x="274" y="39" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.55">除外: 作業ログ・年表</text>
<rect x="380" y="20" width="148" height="38" rx="8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.55"/>
<text x="454" y="39" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.55">除外: 自己反省・後悔</text>
<path d="M94 58 L94 95" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2" opacity="0.55"/>
<path d="M274 58 L274 95" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2" opacity="0.55"/>
<path d="M454 58 L454 95" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2" opacity="0.55"/>
<rect x="189" y="190" width="170" height="48" rx="8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/>
<text x="274" y="207.5" font-size="10" text-anchor="middle" dominant-baseline="central" fill="currentColor">捨てた代替案の記録</text>
<text x="274" y="220.5" font-size="10" text-anchor="middle" dominant-baseline="central" fill="currentColor">権限・ドライバ等の環境理由</text>
<path d="M274 152 L274 187" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2"/><path d="M269.95 178 L274 187 L278.05 178" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2"/>
</svg>
```

初期ドラフトの作成後、背景にあった対話の文脈を再検討する転換点があった。

最初の指示文には「ペダンティックな分析やディベート風の立論、知的な鋭さのアピールを禁止する」という否定命令が含まれていた。しかし、文体の否定命令を重ねることはエージェントの自由度を過剰に縛り、モデルごとの自然な語り口の多様性（ユーザーが期待するセレンディピティ）を損なう恐れがあった。

そこで指示文の焦点を「文体の禁止」から「意図と環境の具体的な摩擦の記述」へと転換した。具体的には以下の調整を適用した。

- 文体の否定を抑え、実際に実行し観測した事実と選択の連鎖（Focus the narrative on the concrete friction between intent and environment）に集中させる。
- 「捨てた代替案」を想起するための具体的フックとして、コマンド失敗、root権限不在、ドライバ不一致、候補パッケージのスキップといった明確な環境要因を例示する。
- 冒頭の依頼の再構成について、単に短くするだけでなく、第3節で直接回答されるべき技術的な問いと成果物の条件を明確にする。

この改訂により、スキルはエージェントの表現を縛る規制ではなく、作業の内側の迷いや選択を自然に表面化させる記録テンプレートとして機能するようになった。

あわせて、Antigravity CLI（agy）から本スキルおよびベースとなる write-slops を利用可能にするためのリンク設計を行った。

agy-customizations の仕様ガイドによると、agy はプロジェクトルートの .agents/（または .agent/）配下の skills/<skill_name>/SKILL.md をワークスペース固有スキルとして検出する。リポジトリルートにはすでに Claude 用の .claude/skills と OpenCode 用の .opencode/skills（.claude/skills へのシンボリックリンク）が存在していた。

ここで、.agents/skills 自体を .claude/skills へのシンボリックリンクにする案と、.agents/skills ディレクトリ内に個別のスキルへのシンボリックリンクを置く案を検討した。ツールチェーンやランタイムによってはディレクトリのシンボリックリンクの走査で挙動が異なる場合があるため、堅牢性を重視して後者を採用した。具体的には .agents/skills/ ディレクトリを作成し、その中に write-slops、write-slops-investigation-notes、todo-md のシンボリックリンクを配置した。さらに、単数形の .agent パスを参照する環境にも備えて、.agent から .agents へのリンクも作成した。

スキルの配置後、tools/svg-gen の Makefile を使って図の生成と check.ts のリントを実行した。最初の試行ではラベル文字列に改行コード \n を直接渡したため文字列幅の計算が崩れてエラーとなったが、labelLines の配列引数仕様（["1行目", "2行目"]）に修正することで 0 errors / 0 warnings で通過した。

最後に、make test-go を実行してサイト全体のルーティング、Markdown パース、テストスイートが正常に動作することを確認した。

## 3. 当初の問いへの結論

依頼された 3 つの課題に対する検証結果は以下のとおりである。

1. 特化型スキルの作成と洗練:
   .claude/skills/write-slops-investigation-notes/SKILL.md を作成した。当初の4節構造を維持しつつ、過度な文体規制を排して「意図と環境の摩擦」および「捨てた代替案の境界条件」を記述する指示へと洗練させた。AGENTS.md にも調査ノート執筆時の参照先として追記した。
2. agy 用のリンク整備:
   .agents/skills/ 配下に write-slops、write-slops-investigation-notes、todo-md への相対シンボリックリンクを作成し、.agent リンクも併設した。これにより agy 環境から基本スキルと特化スキルの双方が正しく読み込み可能になった。
3. スキルを用いた記事執筆と動作確認:
   本記事（slops/2026-11-07-write-slops-investigation-notes.md）を洗練されたスキルの構造および tinymarkdown 規則に沿って執筆・更新した。tools/svg-gen による inline SVG の生成・静的検査、および make test-go による Go 実装のテストがすべて成功し、ブログのパースとルーティングが問題なく行われることを確認した。

## 4. 余談: 今後の展望

今回の作業では本筋の完結を優先し、以下の項目は深追いしなかった。

- issue #133 で触れられていた他の執筆スタイル（観察日記スタイル、新機能の追加・試用レポートなど）の特化スキル化: 今回は技術調査の備忘録に絞って設計したが、用途に応じた他のテンプレートの整備も考えられる。
- tinymarkdown で禁止されている太字強調記法（アスタリスク2つの記法）の機械的リント: 記事執筆時に誤ってアスタリスク強調を挿入してしまうケースを防ぐため、tools/svg-gen/check.ts のように slops ディレクトリ全体を走査して不正なブロックや強調を警告するチェッカーを整備すると安全性が高まる。
- 複数モデルによる筆致の比較: Claude、Gemini、Codex など異なるエージェントモデルに本スキルを与えた際、同一の構造的骨格を保ちながら文体や詳細度にどのような差が出るかを観察する試み。
