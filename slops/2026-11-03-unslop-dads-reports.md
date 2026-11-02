---
title: unslop をDADS製レポートに適用してみた — slopゼロ判定と、残ったdirectionの問い
description: heydamir/unslop(デザイナーのレッドライン的に「AIっぽいUI」を直すスキル)を読み解き、先に作った5種のデジタル庁デザインシステム製レポートに監査を走らせた記録。兆候はほぼ検出されず、残ったのは craft ではなく direction(世界観)の問いだった。
prev: 2026-11-03-html-report-variations.md
---

# unslop をDADS製レポートに適用してみた — slopゼロ判定と、残ったdirectionの問い

[unslop](https://github.com/heydamir/unslop) は Damir Sokolovsky([@heydamir](https://x.com/heydamir))が作った Claude Code / Codex 用のスキル(CC BY 4.0)。X 上の [Unslopping シリーズ](https://x.com/heydamir/status/2115063463063998736)を元にしている。「vibecoded な、AIっぽい見た目の UI」を「そのプロダクト固有の、デザインされた画面」に直すためのもの。

## 何をしてるか

中身はレッドラインレビューの型化だった:

1. 画面を見る(可能ならスクショ)
2. 監査 — [signs.md](https://github.com/heydamir/unslop/blob/main/skills/unslop/references/signs.md) の兆候カタログを1つずつ確認し、見つけた兆候を場所つきで列挙
3. 量を判定 — heavy(多数)/ light(polish mode)/ no slop
4. Direction を5行で書く — Product(何を誰に)/ Character(禁止語彙あり: clean, modern, sleek 等)/ World(プロダクトの属する世界)/ Moments(色を乗せる1-2箇所)/ Signature(固有の小さな詳細)。ユーザーに見せて止まる
5. 9パスで順に直す — spacing → color → icons → copy → type → layout → details → visuals → motion
6. チェックリストで確認、レポート

重要なのは「slop を消すのは半分」という設計で、「どのプロダクトの画面か分からないクリーンな画面」も失敗として扱う点。Direction はトレンドからではなくプロダクト自身から導くルールになっている。監査の兆候カタログは手触りが具体的で、「紫〜青のグラデーション」「絵文字ラベル」「何でもAI✨」「+12%!!(比較対象がない数値)」「全要素がピル形」など、AI生成UIにありがちな型が網羅されている。

## 5種のDADSレポートにかけてみた

対象は[前回作ったレポート5種](https://github.com/podhmo/html-sandbox/issues/117)(dads-html で生成、架空データ)。監査はコード走査とレンダリング済みスクショの両方で行った。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="18 68 698.4000000000004 196.4" width="698" height="196" role="img" aria-label="unslop pipeline with the no-slop exit where the DADS reports land">
<rect x="30" y="80" width="129.3" height="40" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="94.65" y="100" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">監査
signs.md</text>
<rect x="190" y="80" width="140.5" height="40" rx="8" fill="none" stroke="#E69F00" stroke-width="1.5"/>
<text x="260.25" y="100" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">slopの
量を判定</text>
<rect x="350" y="80" width="146.10000000000002" height="40" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="423.05" y="100" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">Direction
(5行)</text>
<rect x="520" y="80" width="95.7" height="40" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="567.85" y="100" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">9パス修正</text>
<path d="M162.3 100 L187 100" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M178 104.05 L187 100 L178 95.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M333.5 100 L347 100" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M338 104.05 L347 100 L338 95.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M499.1 100 L517 100" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M508 104.05 L517 100 L508 95.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<rect x="190" y="180" width="183.20000000000005" height="40" rx="8" fill="none" stroke="#CC79A7" stroke-width="1.5"/>
<text x="281.6" y="200" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">no slop
→ polishのみ</text>
<path d="M261.2557259683957 122.82639616410978 L280.5942740316043 177.17360383589022" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 4"/><path d="M273.76146130486893 170.0521454008951 L280.5942740316043 177.17360383589022 L281.39273094796533 167.33668528622664" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 4"/>
<text x="240" y="155" font-size="12" fill="currentColor">DADSレポート5種はここ</text>
<text x="30" y="250" font-size="12" fill="currentColor" opacity="0.8">抜けているもの: 型ごとの「世界」(個人メモに行政デザイン)・テンプレート同一感 — craft ではなく direction の領分</text>
</svg>
```

結果は「no slop」。監査の兆候カタログで該当したものがほぼなかった:

- 紫/バイオレットのグラデーション、グロー、radiant wash — なし(検出された gradient は dads-scroll-shadow の白フェードと影のみ、意図的なもの)
- 絵文字アイコン、✨、🔥 — なし(使ったのは → 程度)
- weight 800/900 の見出し、大文字トラッキング、イタリック強調 — なし
- 「!」、ハイプ語(革命的/シームレス/魔法)、比較対象のない数値 — なし
- animate-pulse、transition-all、parallax — なし
- 等幅カード・全要素ピル — なし(DADS のコンポーネント自体が制約を持っている)

当たり前といえば当たり前で、コンポーネントカタログ型スキルは signs の大部分を構造的に出さない — 紫グラデや絵文字アイコンを書く余地がそもそもカタログに無い。監査で引っかかるとすれば私がコンポーネントの外に自分で書いた部分だけで、今回は事実/推定ラベルの色付けなど最小限しか足していなかった。

## 残った指摘 — template look と direction

signs.md の最後には「slop ではないが、クリーンアップした画面が陥るテンプレート感」という節がある。ここに1つ引っかかった: 「Every product getting the same layout, type and palette」。5種のレポートは全部同じ DADS の顔をしている。週報と個人メモが同じ行政のクロームで包まれているのは、unslop の言葉で言えば direction がプロダクト(=レポートの型と読者)由来になっていない、という指摘になる。

個人メモの direction をこの手続き通りに書くと:

- Product: 自分用の考えメモ(未来の自分が索引して読む)
- Character: 素早い、薄い、書き散らかし
- World: 紙と鉛筆の脇、メモ帳
- Moments: タグや日付くらい
- Signature: 「未整理」バッジや取り消し線的な雑さ

これに対して DADS は「Public、正確、公式」な世界で、world が明確に違う。つまり監査は通るが direction 評価でずれが出る — craft の問題ではなく direction の領分。スキルの節の主張どおり「監査は通るが固有性がない」状態。

## 提案(未適用)

スキルの no slop ブランチは「同意があれば適用、なければ止まる」なので、変更はせず提案だけ:

1. 型カタログに direction を入れる。レポート型ごとに World と Signature を1行ずつ用意し、コンポーネント選定の前に direction を確定させる — 前回記事の「型カタログ」案と自然に噛み合う
2. 個人メモだけ DADS をやめて、pico.css 級の薄い系統で作り直す価値がある(テーゼ/アンチテーゼの幅を出す目的なら、同じデザインシステムで無理やり作るのは方向性の犠牲になる)
3. 数値の tabular-nums と日付フォーマット統一の確認(軽微)

## 正直な評価

unslop は「AIっぽい画面の兆候カタログ + direction の立て方 + 修正順序」という構造で、前回記事で「検証の3ティア」と呼んだもののティア3(人間工学側)を型化したものに近い。強いのは兆候が具体値つき(紫グラデは名前で列挙、weight 800/900、letter-spacing の負値)なので、監査が機械化しやすいこと。

一方で対象は「画面」(ダッシュボード・アプリ・ランディング)で、文書レポートには signs の多くのグループが最初から非該当になる。レポート用スキルを作るなら、文書版の signs が要る — 「読者の問いに答える順序か」「型とデザインの世界が合っているか」は unslop の direction チェックが一番近い型だった。

デザインシステム生成物が slop 監査を通るのは予想通りだったが、「監査を通る ≠ direction が合っている」という二層の評価が自然に出せたのは収穫。次にレポートスキルを作るなら、生成前に direction の5行を書く工程を組み込みたい。
