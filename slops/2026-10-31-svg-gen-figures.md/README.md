---
title: SVG を手書きせず、図ごとの小さなジェネレータを書く実験
description: issue #96「LLMはsvg手描きがあまり強くない」への試作。座標を直接書く代わりに、形と関係だけを書く使い捨てジェネレータ (experiments/svg-gen) を図ごとに作る方式と、その生成物のギャラリー。
prev: ../2026-10-31-footnotes.md
---

# SVG を手書きせず、図ごとの小さなジェネレータを書く実験

LLM は SVG を直接書くのがあまり得意ではない。座標を文字どおり手で書くため、「線が箱に届いていない」「ラベルが viewBox からはみ出す」といった破綻が起きる。[issue #96](https://github.com/podhmo/html-sandbox/issues/96) の話題だ。

一方で概念図は同じ形式で量産するものではないので、mermaid や d2 のような一律の記法を採るより、「図ごとに小さなジェネレータを書いて実行する」方が相性がよい。そう考えて `experiments/svg-gen/` に試作したものが、この記事のギャラリーに並べた図になる。

要点は「同じ座標を二度書かない」ことだけだ。箱の位置は変数が持ち、矢印の端点は `anchor(shape, "e")` が箱のジオメトリから計算し、viewBox は描いたものすべてから自動で決まる。生の SVG に慣れていない人間が書いても、線がつながらない絵には構造上ならない。

## 図1: 基本形 (fig-loop)

ラベルから箱の幅を引く `w: "auto"`、アンカー間の矢印、箱の手前で止まる `gap`、折れ線の `via`、そして「行が揃っている」「check 箱が上段にある」という空間関係を `assert` に残した最小例。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-30 -34 354.6 168" width="355" height="168" role="img" aria-label="generate, render, then check and fix loop">
<rect x="0" y="80" width="70.5" height="44" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="35.25" y="102" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">Input</text>
<rect x="110.5" y="80" width="85.9" height="44" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="153.45" y="102" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">Convert</text>
<rect x="236.4" y="80" width="78.20000000000002" height="44" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="275.5" y="102" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">Output</text>
<rect x="110.5" y="-24" width="116.70000000000002" height="44" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="168.85000000000002" y="-2" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">Check + fix</text>
<path d="M73.5 102 L107.5 102" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M98.5 106.05 L107.5 102 L98.5 97.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M199.4 102 L233.4 102" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M224.4 106.05 L233.4 102 L224.4 97.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M275.5 77 L275.5 -2 L230.20000000000002 -2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M239.20000000000002 -6.05 L230.20000000000002 -2 L239.20000000000002 2.05" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M107.5 -2 L-20 -2 L-20 80 L32.25 80" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/><path d="M23.25 84.05 L32.25 80 L23.25 75.95" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/>
</svg>
```

## 図2: 実記事の図の再現 (fig-sarashina)

[pi-sarashina の記事](../2026-10-30-pi-sarashina-dogfooding.md)の監督図を generator で描き直したもの。元の図は pi agent → trace-proxy → Sarashina API がリクエスト方向の矢印だけだったので、`split` オプションで往復の2本にした。上がリクエスト、下がレスポンスというシーケンス図の慣例に合わせてある。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 10 549.85 268" width="550" height="268" role="img" aria-label="作業の構造: 人は Devin に指示するだけで、Devin が拡張を実装し、pi を実行・監督する。pi は拡張をロードしてプロキシ越しに Sarashina API を呼びながら Go のファイルを書く">
<rect x="20" y="20" width="45" height="40" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="42.5" y="40" font-size="13" text-anchor="middle" dominant-baseline="central" fill="currentColor">人</text>
<rect x="135" y="20" width="96.35" height="40" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="183.175" y="40" font-size="13" text-anchor="middle" dominant-baseline="central" fill="currentColor">Devin CLI</text>
<rect x="291.35" y="20" width="150.95000000000002" height="40" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="366.82500000000005" y="40" font-size="13" text-anchor="middle" dominant-baseline="central" fill="currentColor">pi-sarashina 拡張</text>
<rect x="135" y="130" width="89.19999999999999" height="44" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="179.6" y="152" font-size="13" text-anchor="middle" dominant-baseline="central" fill="currentColor">pi agent</text>
<rect x="274.2" y="130" width="144.19999999999996" height="44" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="346.29999999999995" y="152" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">trace-proxy :8787</text>
<rect x="463.4" y="130" width="86.45" height="44" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="506.625" y="144.85" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">Sarashina</text>
<text x="506.625" y="159.15" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">API</text>
<rect x="135" y="228" width="124.39999999999998" height="40" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="197.2" y="248" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">main.go, *.txt</text>
<path d="M68 40 L132 40" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M123 44.05 L132 40 L123 35.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="100" y="32" font-size="11" text-anchor="middle" fill="currentColor">指示</text>
<path d="M234.35 40 L288.35 40" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M279.35 44.05 L288.35 40 L279.35 35.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="261.35" y="32" font-size="11" text-anchor="middle" fill="currentColor">実装</text>
<path d="M183.0219851379614 62.99609520075636 L179.7530148620386 127.00390479924364" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/><path d="M176.1673309271334 117.8090491332224 L179.7530148620386 127.00390479924364 L184.25678796917558 118.22218926072671" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/>
<text x="173.3875" y="95" font-size="11" text-anchor="end" fill="currentColor">実行・監督</text>
<path d="M366.82500000000005 63 L366.82500000000005 86 L219.6 86 L219.6 130 L182.6 130" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/><path d="M191.6 125.95 L182.6 130 L191.6 134.05" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/>
<text x="321.82500000000005" y="78" font-size="11" text-anchor="middle" fill="currentColor">pi -e でロード</text>
<path d="M227.2 146 L271.2 146" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M262.2 150.05 L271.2 146 L262.2 141.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M271.2 158 L227.2 158" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M236.2 153.95 L227.2 158 L236.2 162.05" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M421.4 146 L460.4 146" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M451.4 150.05 L460.4 146 L451.4 141.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M460.4 158 L421.4 158" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M430.4 153.95 L421.4 158 L430.4 162.05" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="249.2" y="138" font-size="11" text-anchor="middle" fill="currentColor">HTTP</text>
<text x="440.9" y="138" font-size="10" text-anchor="middle" fill="currentColor">HTTPS</text>
<path d="M180.52964662377536 176.85232486840175 L196.2703533762246 225.14767513159825" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M189.63077493255608 217.84572346848978 L196.2703533762246 225.14767513159825 L197.33205207724077 215.33567758429626" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="196.39999999999998" y="201" font-size="11" fill="currentColor">write/edit</text>
</svg>
```

## 図3: 強弱 (fig-focus, fig-highlight)

`opacity` で周辺を薄くする focus + context は以前から効果が確認できていた。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -14 450 194" width="450" height="194" role="img" aria-label="one package in focus, related packages dimmed">
<rect x="140" y="60" width="130" height="46" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="205" y="83" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">focus pkg</text>
<rect x="-10" y="60" width="110" height="46" rx="8" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.35"/>
<text x="45" y="83" font-size="13" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.35">users of it</text>
<rect x="140" y="-4" width="130" height="40" rx="8" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.35"/>
<text x="205" y="16" font-size="13" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.35">a library</text>
<rect x="310" y="60" width="110" height="46" rx="8" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.35"/>
<text x="365" y="83" font-size="13" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.35">its tests</text>
<rect x="140" y="130" width="130" height="40" rx="8" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.35"/>
<text x="205" y="150" font-size="13" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.35">the app</text>
<path d="M137 83 L103 83" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.35"/><path d="M112 78.95 L103 83 L112 87.05" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.35"/>
<path d="M205 57 L205 39" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.35"/><path d="M209.05 48 L205 39 L200.95 48" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.35"/>
<path d="M273 83 L307 83" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.35"/><path d="M298 87.05 L307 83 L298 78.95" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.35"/>
<path d="M205 109 L205 127" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.35"/><path d="M200.95 118 L205 127 L209.05 118" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.35"/>
</svg>
```

強調側は「主張が強すぎないもの」を探した。posts の図では平たい灰色の帯が別の意味と取り違えられる失敗があったので、強調には「強調」という一つの意味だけを持たせる。半透明の `currentColor` 塗り (wash)、点線の囲み (ring)、線幅、ラベルの下線を並べた比較。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="43.20000000000002 -17 366.79999999999995 323" width="367" height="323" role="img" aria-label="five low-key ways to emphasize a box">
<rect x="288" y="-7" width="112" height="54" rx="11" fill="currentColor" fill-opacity="0.06" stroke="none"/>
<rect x="288" y="57" width="112" height="54" rx="11" fill="currentColor" fill-opacity="0.12" stroke="none"/>
<rect x="288" y="121" width="112" height="54" rx="11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/>
<text x="150" y="20" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.6">wash 0.06</text>
<rect x="170" y="0" width="65" height="40" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="202.5" y="20" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">plain</text>
<rect x="295" y="0" width="98" height="40" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="344" y="20" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">emphasized</text>
<path d="M238 20 L292 20" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M283 24.05 L292 20 L283 15.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="150" y="84" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.6">wash 0.12</text>
<rect x="170" y="64" width="65" height="40" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="202.5" y="84" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">plain</text>
<rect x="295" y="64" width="98" height="40" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="344" y="84" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">emphasized</text>
<path d="M238 84 L292 84" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M283 88.05 L292 84 L283 79.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="150" y="148" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.6">dashed ring</text>
<rect x="170" y="128" width="65" height="40" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="202.5" y="148" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">plain</text>
<rect x="295" y="128" width="98" height="40" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="344" y="148" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">emphasized</text>
<path d="M238 148 L292 148" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M283 152.05 L292 148 L283 143.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="150" y="212" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.6">thick stroke</text>
<rect x="170" y="192" width="65" height="40" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="202.5" y="212" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">plain</text>
<rect x="295" y="192" width="98" height="40" rx="8" fill="none" stroke="currentColor" stroke-width="2.5"/>
<text x="344" y="212" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">emphasized</text>
<path d="M238 212 L292 212" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M283 216.05 L292 212 L283 207.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="150" y="276" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.6">underlined label</text>
<rect x="170" y="256" width="65" height="40" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="202.5" y="276" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">plain</text>
<rect x="295" y="256" width="98" height="40" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="344" y="276" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">emphasized</text>
<path d="M311 286.4 L377 286.4" fill="none" stroke="currentColor" stroke-width="2"/>
<path d="M238 276 L292 276" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M283 280.05 L292 276 L283 271.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
</svg>
```

どれも色リテラルを使わないので、ダークテーマでも自然に反転する。

## 図4: データの図 (fig-bench)

ベンチマークの棒グラフのように「値から長さを決める」図は、ジェネレータ方式と特に相性がよい。バーの長さは値から計算されるので、縮尺を間違えようがない。#85 の実測(同じグラフを各レンダラで描いたときの SVG サイズ)を横棒グラフにしたもの。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -37 500.9999999999999 227" width="501" height="227" role="img" aria-label="SVG file size by renderer and layout">
<rect x="150.59999999999994" y="-4" width="123.74112734864302" height="28" rx="8" fill="currentColor" fill-opacity="0.08" stroke="none"/>
<text x="146.59999999999994" y="10" font-size="12" text-anchor="end" dominant-baseline="central" fill="currentColor">beautiful-mermaid elk</text>
<rect x="154.59999999999994" y="0" width="115.74112734864302" height="20" fill="currentColor" fill-opacity="0.45" stroke="currentColor" stroke-width="1"/>
<text x="276.34112734864294" y="10" font-size="11" dominant-baseline="central" fill="currentColor" opacity="0.7">19.8 KiB</text>
<text x="146.59999999999994" y="42" font-size="12" text-anchor="end" dominant-baseline="central" fill="currentColor">d2 tala</text>
<rect x="154.59999999999994" y="32" width="121.58663883089771" height="20" fill="currentColor" fill-opacity="0.45" stroke="currentColor" stroke-width="1"/>
<text x="282.18663883089766" y="42" font-size="11" dominant-baseline="central" fill="currentColor" opacity="0.7">20.8 KiB</text>
<text x="146.59999999999994" y="74" font-size="12" text-anchor="end" dominant-baseline="central" fill="currentColor">d2 dagre</text>
<rect x="154.59999999999994" y="64" width="128.01670146137786" height="20" fill="currentColor" fill-opacity="0.45" stroke="currentColor" stroke-width="1"/>
<text x="288.61670146137783" y="74" font-size="11" dominant-baseline="central" fill="currentColor" opacity="0.7">21.9 KiB</text>
<text x="146.59999999999994" y="106" font-size="12" text-anchor="end" dominant-baseline="central" fill="currentColor">d2 elk</text>
<rect x="154.59999999999994" y="96" width="130.35490605427975" height="20" fill="currentColor" fill-opacity="0.45" stroke="currentColor" stroke-width="1"/>
<text x="290.9549060542797" y="106" font-size="11" dominant-baseline="central" fill="currentColor" opacity="0.7">22.3 KiB</text>
<text x="146.59999999999994" y="138" font-size="12" text-anchor="end" dominant-baseline="central" fill="currentColor">mermaid elk</text>
<rect x="154.59999999999994" y="128" width="274.15448851774534" height="20" fill="currentColor" fill-opacity="0.45" stroke="currentColor" stroke-width="1"/>
<text x="434.75448851774524" y="138" font-size="11" dominant-baseline="central" fill="currentColor" opacity="0.7">46.9 KiB</text>
<text x="146.59999999999994" y="170" font-size="12" text-anchor="end" dominant-baseline="central" fill="currentColor">mermaid dagre</text>
<rect x="154.59999999999994" y="160" width="280" height="20" fill="currentColor" fill-opacity="0.45" stroke="currentColor" stroke-width="1"/>
<text x="440.5999999999999" y="170" font-size="11" dominant-baseline="central" fill="currentColor" opacity="0.7">47.9 KiB</text>
<text x="160" y="-16" font-size="11" fill="currentColor" opacity="0.6">SVG size for the same graph (smaller is better)</text>
</svg>
```

## 破綻しにくさの根拠

- `anchor` / `rightOf` / `below` など、配置はすべて形状から計算される
- `box(x, y, "auto", h, {label})` は推定文字幅 + 余白で箱を決めるのでラベルがはみ出せない
- viewBox はテキストの推定 bbox を含む全要素から導出されるので、要素が外に出ない
- 出力は `currentColor` と素の `<text>` なので、検索可能でテーマに追従する
- 図が依存する空間関係はジェネレータ内の `assert` で検査できる

## 検証

`check.ts` という lint を [writing-slops の反省記録](../2026-10-27-writing-slops.md) (03-svg-pitfalls) から作り、`make check` で全図に通している。拾えるのは viewBox 外の要素、箱からはみ出すテキスト、重複 id、currentColor への literal color 混入、フェンスで使えない構文までで、「意味として正しいか」(軸の反転など) は相変わらず目視が要る。見た目は rsvg-convert の PNG と、このブログの実ページに差し込んだものを headless Chrome でライト/ダーク両テーマ撮影して確認した。

## メンバー

図のジェネレータと共有ヘルパーをこの記事のメンバーとして同梱した (`experiments/svg-gen` のコピー)。

- [01-fig-loop.ts](01-fig-loop.ts) — 図1のジェネレータ
- [02-fig-sarashina.ts](02-fig-sarashina.ts) — 図2のジェネレータ
- [03-fig-focus.ts](03-fig-focus.ts) / [04-fig-highlight.ts](04-fig-highlight.ts) — 図3のジェネレータ
- [05-fig-bench.ts](05-fig-bench.ts) — 図4のジェネレータ
- [svg.ts](svg.ts) — 共有ヘルパー

## 未解決

- 束を1ページに並べたときの id 衝突は lint がファイル単位なので見えていない
- ジェネレータは使い捨て前提なので、共有ヘルパーを育てすぎると本末転倒になる。薄く保つ方針
