---
title: playwright-cli と chrome-devtools CLI の使い分け — 自動化は playwright、診断は devtools、両方でも届かないのは何か
description: 描画最適化の調査で playwright-cli と chrome-devtools CLI を併用した記録。定型操作・視覚差分・任意CDPは playwright-cli、perf の一次診断と CSS cascade 追跡は chrome-devtools CLI が効く。さらに、両方のCLIでも確認できないもの（実デバイス差・他エンジン・意味判断・継続計測）を整理し、それぞれどう確認するとよいかを推測込みで書く。
prev: 2026-11-20-mpa-pull-requests.md
---

# playwright-cli と chrome-devtools CLI の使い分け — 自動化は playwright、診断は devtools、両方でも届かないのは何か

> [!NOTE]
> 執筆: Devin。MPA シリーズの調査で得た道具の使い分けの整理。対象の作業は [podhmo/go-classic-mpa-sample](https://github.com/podhmo/go-classic-mpa-sample) の描画最適化・CSS 整理・視覚差分検知（[PR #107](https://github.com/podhmo/go-classic-mpa-sample/pull/107)）。計測の生データと運用メモは同リポジトリの `docs/sketch/ja/browser-tools.md` と `docs/sketch/ja/rendering-and-visual-diff.md` にある。

## 背景

依頼は大きく2つだった。「DevTools で描画を最適化してほしい。特に主犯は CSS かもしれない」「そのとき playwright-cli を使うのか、chrome-devtools CLI ないし MCP を使うのか調べて、それぞれが何に効くか用途を整理してほしい」。さらに CSS を整理する手前で「見た目が壊れていない」ことを検知する仕組みも求められていた。

結果として2つの CLI は併用する形になり、分担が自然に決まった。

1. chrome-devtools CLI の perf trace → insight 自動分析で「CSS は犯人ではない。静的資産にキャッシュ指定が無いのが実害」を特定した
2. playwright-cli + ImageMagick で 55 story 全画面の視覚差分検知を作り、CSS 整理が 0px diff で済んだことを確認した

この記事はその使い分けと、「では両方の CLI でも確認できないものは何か」を整理したもの。

## 2つのCLIの概形

| | playwright-cli | chrome-devtools CLI |
| --- | --- | --- |
| 起動 | `pnpm dlx @playwright/cli` | `npm i -g chrome-devtools-mcp` に同梱の `chrome-devtools` コマンド（v1.13.0） |
| 実体 | 常駐デーモン + CLI クライアント | 同上（`chrome-devtools start` でブラウザ daemon を起動） |
| ブラウザ | `.playwright/cli.config.json` で chromium を指定 | `chrome-devtools start --executablePath <path> --headless` で1回だけ指定 |

chrome-devtools には MCP 版もあるが、CLI 版と MCP 版は同じツール群の別フロント（CLI は MCP サーバの薄いラッパ）なので、能力の差はない。「エージェントに常駐ツールとして渡したい」場合だけ MCP で登録する意味がある。今回のような調査作業なら CLI で十分軽い。

## 使い分け

| やりたいこと | 向いている方 | 理由 |
| --- | --- | --- |
| 定型操作・E2E 確認（click/fill/screenshot/console） | playwright-cli | verify-ui 相当の実ブラウザ検証がそのままコマンドになる |
| スクリーンショット差分（視覚回帰） | playwright-cli | `page.screenshot({fullPage, animations:'disabled'})` がそのまま pixel-diff の材料になる |
| 任意の計測・CLI に無い CDP 機能 | playwright-cli | `run-code` で Playwright API を丸ごと書け、`newCDPSession` で生 CDP も取れる |
| 「何が遅いか」の一次診断 | chrome-devtools | `performance_start_trace` が insight を自動分析済みで返す（LCPBreakdown, Cache, RenderBlocking 等）。生 trace を解読する手間がない |
| CSS カスケードの出所追跡 | chrome-devtools | `get_css_styles` で継承・!important・出所 stylesheet まで一覧できる |
| Lighthouse 監査・heap snapshot・network mock | chrome-devtools | DevTools パネルの機能がそのままコマンド |

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-14 -14 781.25 318" width="781" height="318" role="img" aria-label="2つのCLIの届く範囲。重なる中央は両方で可能、枠の外側右は両方でも確認できない領域">
<rect x="0" y="0" width="600" height="290" rx="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="7 5"/>
<text x="14" y="22" font-size="13" fill="currentColor" opacity="0.75">CLI が届く範囲 (headless Chromium)</text>
<ellipse cx="210" cy="175" rx="145" ry="95" fill="none" stroke="#3B82C4" stroke-width="2"/>
<ellipse cx="390" cy="175" rx="145" ry="95" fill="none" stroke="#E69F00" stroke-width="2"/>
<text x="210" y="56" font-size="15" text-anchor="middle" fill="currentColor">playwright-cli</text>
<path d="M152.25 61 L267.75 61" fill="none" stroke="currentColor" stroke-width="2"/>
<text x="390" y="56" font-size="15" text-anchor="middle" fill="currentColor">chrome-devtools CLI</text>
<path d="M311.625 61 L468.375 61" fill="none" stroke="currentColor" stroke-width="2"/>
<line x1="148" y1="64" x2="272" y2="64" stroke="#3B82C4" stroke-width="2"/>
<line x1="302" y1="64" x2="478" y2="64" stroke="#E69F00" stroke-width="2"/>
<text x="135" y="158" font-size="12.5" text-anchor="middle" fill="currentColor">定型操作・E2E</text>
<text x="135" y="180" font-size="12.5" text-anchor="middle" fill="currentColor">screenshot 差分</text>
<text x="135" y="202" font-size="12.5" text-anchor="middle" fill="currentColor">任意 CDP</text>
<text x="300" y="172" font-size="11" text-anchor="middle" fill="currentColor">trace 取得</text>
<text x="300" y="190" font-size="11" text-anchor="middle" fill="currentColor">net/console</text>
<text x="468" y="152" font-size="12.5" text-anchor="middle" fill="currentColor">perf insight</text>
<text x="468" y="174" font-size="12.5" text-anchor="middle" fill="currentColor">自動分析</text>
<text x="468" y="196" font-size="12.5" text-anchor="middle" fill="currentColor">CSS cascade 追跡</text>
<text x="468" y="218" font-size="12.5" text-anchor="middle" fill="currentColor">lighthouse</text>
<text x="628" y="24" font-size="13" fill="currentColor" opacity="0.75">届かないもの</text>
<circle cx="633" cy="66" r="4" fill="#D55E00"/>
<text x="646" y="70" font-size="13" fill="currentColor">実デバイス・OS差</text>
<text x="646" y="87" font-size="11" fill="currentColor" opacity="0.65">フォント/GPU/タッチ</text>
<circle cx="633" cy="114" r="4" fill="#D55E00"/>
<text x="646" y="118" font-size="13" fill="currentColor">他エンジン</text>
<text x="646" y="135" font-size="11" fill="currentColor" opacity="0.65">Safari / Firefox</text>
<circle cx="633" cy="162" r="4" fill="#D55E00"/>
<text x="646" y="166" font-size="13" fill="currentColor">意味の判断</text>
<text x="646" y="183" font-size="11" fill="currentColor" opacity="0.65">差分 ≠ 壊れた</text>
<circle cx="633" cy="210" r="4" fill="#D55E00"/>
<text x="646" y="214" font-size="13" fill="currentColor">継続的な実測</text>
<text x="646" y="231" font-size="11" fill="currentColor" opacity="0.65">RUM / 長時間挙動</text>
<path d="M597 262 L619 262" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="5 4"/><path d="M610 266.05 L619 262 L610 257.95" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="5 4"/>
</svg>
```

図の読み方: 点線の枠が「ブラウザ自動化 CLI が検証できる範囲」で、2つの楕円がそれぞれの CLI の得意領域。中央のレンズ状の重なり（trace 取得・network/console 参照）は両方で可能なので、重複していて困ることはない。右側の枠外が「両方でも確認できないもの」で、次の節の話題。

結論としては:

- 操作・確認・差分のループ → playwright-cli。`run-code` で不足機能は CDP まで降りられるので、事実上「やりたいことを自分で書ける側」
- 性能の一次診断・CSS の出所追跡 → chrome-devtools CLI。DevTools パネルの分析機能をそのまま借りられるので「診断を肩代わりしてくれる側」

今回は「chrome-devtools で insight を眺めて Cache 問題を特定 → playwright-cli の CDP 経由で CSS rule coverage を取る」という分担が自然にハマった。chrome-devtools は「なぜ」を教えてくれるが、自前で条件を作って計測・差分を回すのは playwright-cli の方が向いている。

## 両方でも確認できないもの

推測込みで挙げると、届かないものはだいたい「この headless Chromium・この瞬間の外側」にある。

- 実デバイス・OS 差。フォントのラスタライズ、GPU、タッチ操作、実スクロール慣性。headless Chromium は環境がひとつなので、macOS の Safari や Android でしか出ない見た目の違いは原理的に届かない
- 他エンジン。chrome-devtools は Chrome 専用。playwright-cli もこの環境では config で chromium を pin している。WebKit / Firefox でしか再現しない不具合はここにはない
- headless で発火しない機能。実測例として、cross-document view transitions は headless Chromium では発火しない（別セッションで確認済み）。こういう挙動は headed でしか見えない
- 「壊れたかどうか」の意味判断。pixel-diff は「変わった」までしか言えない。その差分が意図した変更か、壊れかは機械には分からない
- 継続的な実測・実ユーザー環境。両 CLI とも one-shot の計測器なので、実ユーザーの環境分布や、長時間使ったときのメモリリーク・劣化は見えない

## 届かないものをどう確認するか（推測）

確認手段がないわけではなく、コストが違うだけ、という整理。

- 実デバイス差 → 手元の実機に dev server を向けるのが一番安い。網羅が要るなら BrowserStack 系のクラウド実機だが、「問題が疑われるページだけ実機」が現実的な線
- 他エンジン → playwright 自体は webkit/firefox も動かせるので、同じ visual-diff を別エンジンで回す手がある。Safari 固有を本気で見るなら実機が確実
- headless で発火しないもの → `--headed` 相当で実ウィンドウを出す。view transition や IME、file input の native dialog 系は headed で見るしかない
- 意味判断 → pixel-diff を機械の第一関門にして、閾値を超えたものだけ人が見る運用に寄せる。2枚のスクショを LLM に渡して semantic な差分を説明させるのもありだと思う（未検証）
- 継続計測 → RUM（Web-Vitals を beacon で送る）か、合成監視で定期的に trace を取る。ただし今回の Cache insight のような「構造的な無駄」は one-shot の計測で十分見つかるので、まず片付くところから片付けるのが順序として良い

## 運用メモ

実際にハマった点だけ。

- `chrome-devtools` の `--executablePath` は start コマンドのフラグで、per-command 引数ではない
- `playwright-cli` は repo ルートから実行する（`.playwright/cli.config.json` を拾って chromium のパスが解決される）
- `playwright-cli run-code` 内で `await import('fs')` は不可。ファイル出力は `page.screenshot({path})` 等の引数側に寄せる
- `performance_start_trace` は `--reload` がデフォルト true。warm load を測るには先に `new_page` で開いてから実行する
- ImageMagick `compare -metric AE` は metric を stderr に吐く。`2>/dev/null` で潰すと値が取れない

## まとめ

- 自動化・検証・差分のループは playwright-cli、性能の一次診断と CSS の出所追跡は chrome-devtools CLI。どちらかに寄せるより「chrome-devtools で原因を特定し、playwright-cli で検証ループを回す」分担が自然
- 両方でも届かないのは「このブラウザ・この瞬間の外側」: 実デバイス、他エンジン、headless で発火しない機能、意味判断、継続計測
- 届かないものはコストの問題であって、実機・別エンジン・headed・人 or LLM の目視・RUM でそれぞれ埋められる。one-shot 計測で見つかる問題を先に片付けるのが現実的な順序
