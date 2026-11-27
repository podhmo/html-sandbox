---
title: figure-docs 150図の写経から、svg-gen に curve / connector / text / chart を足した記録
description: issue #200 の調査として figure-docs の business/dev references 150図を svg-gen で写経し、不足していた必須級4機能を stacked PR で実装した。手書きの path 文字列や baseline 計算を書き手へ戻さないために、どういう記述が必要になり、どういう表示ができるようになったかを、colorfulな生成図と検証結果つきで残す。
prev: 2026-11-27-minigo-memory-projection.md
---

# figure-docs 150図の写経から、svg-gen に curve / connector / text / chart を足した記録

> [!NOTE]
> 執筆: Devin。対象は [podhmo/html-sandbox](https://github.com/podhmo/html-sandbox) の [PR #207](https://github.com/podhmo/html-sandbox/pull/207) から [PR #211](https://github.com/podhmo/html-sandbox/pull/211) までの stack。図は `tools/svg-gen` の colorful オプションを使う生成結果で、`PALETTE` の色をデータ系列や部品の区別に使っている。本文は作業を行ったセッションの記録と、merge 後の main で再実行した検証結果にもとづく。

## 依頼と前提

最初の依頼は、[issue #200](https://github.com/podhmo/html-sandbox/issues/200) の一環として、`tools/svg-gen` が [u-ichi/agent-plugins](https://github.com/u-ichi/agent-plugins) の figure-docs references にある図を描けるか確認することだった。対象は `business.html` の 112 図と `dev.html` の 38 図、あわせて 150 図。まず `examples/figure-docs/` の中で全部描き、不足している機能を洗い出してほしい、というものだった。

途中で方向が 2 回足された。

1. 不足機能を「必須級 / あれば嬉しい / 最悪なくても頑張れる」に分けて `docs/sketch/ja` に残し、必要なものを `TODO.md` に乗せる。
2. TODO の必須級 4 件を 1 件ずつ実装し、GitHub stacked PR に積む。各機能を使って examples も書き換える。

この記事は 2 つめまで終わった状態の記録である。前提として、PR の作成と push はこちらで行ったが、merge はしない運用だった。最終的な merge はユーザーが行った。実装対象はライブラリ本体だけでなく、生成例と lint も含む。figure-docs の写経 probe は「svg-gen らしい図」の例ではなく、upstream の座標・色・120x80 viewport を残した primitive coverage の監査である。

## 最初にやったこと: 150図を機械写経する

最初の [PR #207](https://github.com/podhmo/html-sandbox/pull/207) では、upstream commit `c10dce2` の HTML から各 SVG を読み、最も近い svg-gen primitive へ機械的に写経する `.mbtx` を 150 個生成した。写経の前に低レベル primitive 自体が足りず、この PR で fixed viewBox、fill/opacity つきの rect/ellipse/polygon/polyline/path、text color などを足している。

結果は 150/150 図の生成に成功した。初期の lint は FAIL 0、WARN 300 で、内訳は literal color 150、text なし 120、curve command unchecked 30 だった。literal color は写経対象の固定色をそのまま残したため意図的で、text なしも元の小さな見本が label を持たないだけだった。実質的な警告は curve command unchecked である。

この監査は [figure-docs の参照図を svg-gen で描いたときの不足機能](https://github.com/podhmo/html-sandbox/blob/main/docs/sketch/ja/figure-docs-svg-gen-audit.md) に残した。その後の優先度分類は [figure-docs 向け svg-gen 機能の優先度分類](https://github.com/podhmo/html-sandbox/blob/main/docs/sketch/ja/figure-docs-svg-gen-priority.md) にある。必須級と判定したのは次の 4 件だった。

1. typed curve/path builder と curve-aware lint
2. connector / arrowhead / port / edge label
3. baseline-aware な text measurement / placement
4. basic chart builder（bar/column/area/pie）

その後、TODO のこの 4 件を [PR #208](https://github.com/podhmo/html-sandbox/pull/208) から [PR #211](https://github.com/podhmo/html-sandbox/pull/211) まで 1 件ずつ実装した。各 PR では対応する example を追加または更新し、レビューで見つかった path parser、connector routing、label clearance、record field の問題も修正した。失敗の詳細は本線ではなく後半の余談に寄せる。

以下では、それぞれについて「どういう記述が必要になったか」と「どういう表示ができるようになったか」を並べる。

## 1. curve: path 文字列ではなく、形の意味を書く

前の状態でも `path` はあった。ただしそれは SVG の `d` 文字列を受け取る escape hatch に近く、pie slice や滑らかな系列を書くには、作者が arc parameter や Bézier 制御点を直接書く必要だった。しかも viewBox 推定用の `covered` 点列を別途渡すので、同じ幾何を二重に管理していた。

[PR #208](https://github.com/podhmo/html-sandbox/pull/208) で入れたのは `PathBuilder` である。move/line/cubic/quadratic/arc/close を型付きで積み、Bézier は制御点の convex hull、arc は sampling した点を covered points へ入れる。あわせて `polyline_path`、Catmull-Rom の `smooth_path`、`pie_slice`、`donut_slice` を足した。

必要な記述は「SVG コマンド列」ではなく「通りたい点列」「中心と半径と角度」になった。

```moonbit
let slice = @svg.pie_slice(80.0, 85.0, 42.0, start=-90.0, end=45.0)
c.draw_path(slice, fill=c.color(0), fill_opacity=Some(0.35))

let line = @svg.smooth_path(points)
c.draw_path(line, width=2.5, color=c.color(0))
```

生成される見た目は次の通りである。円グラフとドーナツの slice は角度から弧を引き、下の系列は点列を通る滑らかな曲線になっている。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 -1 268 229" width="268" height="229" role="img" aria-label="Typed path builder: pie and donut slices plus a smooth curve through points">
<text x="20" y="22" font-size="13" fill="currentColor">pie / donut slices</text>
<path d="M80 85 L80 43 A42 42 0 0 1 109.698484809835 114.698484809835 Z" fill="#3B82C4" fill-opacity="0.35" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M80 85 L109.698484809835 114.698484809835 A42 42 0 0 1 40.53290992699185 99.3648460196781 Z" fill="#E69F00" fill-opacity="0.35" stroke="#E69F00" stroke-width="1.5"/>
<path d="M80 85 L40.53290992699185 99.3648460196781 A42 42 0 0 1 79.99999999999999 43 Z" fill="#00A876" fill-opacity="0.35" stroke="#00A876" stroke-width="1.5"/>
<path d="M205 43 A42 42 0 1 1 197.70677653798893 126.36192562651274 L201.52703644666138 104.69615506024417 A20 20 0 1 0 205 65 Z" fill="#D55E00" fill-opacity="0.35" stroke="#D55E00" stroke-width="1.5"/>
<path d="M197.70677653798893 126.36192562651274 A42 42 0 0 1 205 43 L205 65 A20 20 0 0 0 201.52703644666138 104.69615506024417 Z" fill="#CC79A7" fill-opacity="0.35" stroke="#CC79A7" stroke-width="1.5"/>
<text x="20" y="158" font-size="13" fill="currentColor">smooth path through points</text>
<path d="M30 215 L65 190 L100 205 L140 174 L180 198 L225 181 L265 205" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.35"/>
<path d="M30 215 C35.833333333333336 210.83333333333334 53.333333333333336 191.66666666666666 65 190 C76.66666666666667 188.33333333333334 87.5 207.66666666666666 100 205 C112.5 202.33333333333334 126.66666666666667 175.16666666666666 140 174 C153.33333333333334 172.83333333333334 165.83333333333334 196.83333333333334 180 198 C194.16666666666666 199.16666666666666 210.83333333333334 179.83333333333334 225 181 C239.16666666666666 182.16666666666666 258.3333333333333 201 265 205" fill="none" stroke="#3B82C4" stroke-width="2.5"/>
<circle cx="30" cy="215" r="3" fill="currentColor" stroke="currentColor" stroke-width="0"/>
<circle cx="65" cy="190" r="3" fill="currentColor" stroke="currentColor" stroke-width="0"/>
<circle cx="100" cy="205" r="3" fill="currentColor" stroke="currentColor" stroke-width="0"/>
<circle cx="140" cy="174" r="3" fill="currentColor" stroke="currentColor" stroke-width="0"/>
<circle cx="180" cy="198" r="3" fill="currentColor" stroke="currentColor" stroke-width="0"/>
<circle cx="225" cy="181" r="3" fill="currentColor" stroke="currentColor" stroke-width="0"/>
<circle cx="265" cy="205" r="3" fill="currentColor" stroke="currentColor" stroke-width="0"/>
</svg>
```

lint 側も `check.mbtx` が C/S/Q/T/A の absolute/relative を読むようになった。figure-docs の監査で残っていた curve unchecked 30 件は消え、150 図の警告は 300 件から 270 件へ減った。残る 270 件は、写経した literal color と text のない小図なので、能力不足ではない。

## 2. connector: 矢印の端点ではなく、shape の辺と向きを書く

概念図で頻繁に必要なのは「この箱からあの箱へ線を引く」ことだが、前の API では座標と `via` を渡す必要があった。closed arrowhead もなく、flowchart や sequence diagram に多い塗りつぶし三角は手組みだった。

[PR #209](https://github.com/podhmo/html-sandbox/pull/209) では、`port`、orthogonal elbow、closed triangle head、`connect`、`point_along` を足した。必要な記述は「from 点、to 点、折れ点」ではなく、「どの shape のどの辺から、どの shape のどの辺へ入るか」になった。

```moonbit
c.connect(api, @svg.E, svc, @svg.W, label=Some("validate"))
c.connect(svc, @svg.S, db, @svg.N, label=Some("persist"))

let p = c.port(svc, @svg.E, t=0.72)
c.arrow(p, target, head_kind=@svg.Closed)
```

`t` は辺の上の位置で、複数の線が出入りするときに port を中央からずらせる。生成図では、水平に出る接続と垂直に出る接続で自動的に orthogonal な折れ方が変わり、終端は closed triangle になっている。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="8.799999999999997 20 479.75 218" width="480" height="218" role="img" aria-label="Ports, orthogonal connectors, closed arrowheads, and edge labels">
<rect x="20" y="30" width="110" height="62" rx="8" fill="none" stroke="currentColor" stroke-width="2"/>
<text x="75" y="51.9" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">api</text>
<text x="75" y="70.1" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">handler</text>
<rect x="240" y="30" width="110" height="62" rx="8" fill="none" stroke="currentColor" stroke-width="2"/>
<text x="295" y="61" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">service</text>
<rect x="245" y="170" width="100" height="58" rx="8" fill="none" stroke="currentColor" stroke-width="2"/>
<text x="295" y="199" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">database</text>
<rect x="20" y="170" width="110" height="58" rx="8" fill="none" stroke="currentColor" stroke-width="2"/>
<text x="75" y="199" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">worker</text>
<path d="M133 61 L237 61" fill="none" stroke="#3B82C4" stroke-width="1.5"/><path d="M228 65.05 L237 61 L228 56.95 Z" fill="#3B82C4" stroke="#3B82C4" stroke-width="1.5"/>
<text x="185" y="83" font-size="12" text-anchor="middle" fill="currentColor">validate</text>
<path d="M295 95 L295 167" fill="none" stroke="#E69F00" stroke-width="1.5"/><path d="M290.95 158 L295 167 L299.05 158 Z" fill="#E69F00" stroke="#E69F00" stroke-width="1.5"/>
<text x="261.9" y="135.8" font-size="12" text-anchor="middle" fill="currentColor">persist</text>
<path d="M75 95 L75 167" fill="none" stroke="#56B4E9" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.75"/><path d="M70.95 158 L75 167 L79.05 158 Z" fill="#56B4E9" stroke="#56B4E9" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.75"/>
<text x="41.9" y="135.8" font-size="12" text-anchor="middle" fill="currentColor">enqueue</text>
<path d="M133 199 L242 199" fill="none" stroke="#00A876" stroke-width="1.5"/><path d="M233 203.05 L242 199 L233 194.95 Z" fill="#00A876" stroke="#00A876" stroke-width="1.5"/>
<text x="187.5" y="221" font-size="12" text-anchor="middle" fill="currentColor">write</text>
<path d="M352.68328157299976 75.98164078649988 L407.31671842700024 103.29835921350012" fill="none" stroke="#3B82C4" stroke-width="1.5"/><path d="M397.4556586462262 102.89586697755016 L407.31671842700024 103.29835921350012 L401.07808876977583 95.65100673045083 Z" fill="#3B82C4" stroke="#3B82C4" stroke-width="1.5"/>
<text x="412" y="104.64" font-size="11" fill="currentColor">biased port</text>
</svg>
```

この API は constraint solver ではない。例えば左右の port の高さが大きくずれた場合、必ずしも「辺に垂直に入る」美しい経路にはならない。現状は単純な HV/VH routing で、複雑な回避や交差削減は後の話である。

## 3. text: baseline を明示して、shape/edge の外側に置く

SVG の `text(x, y)` の `y` は baseline である。前の `below(shape, gap)` は shape 下端の y を返すだけなので、そこへそのまま text を置くと、glyph の上端が shape 側へ食い込みやすかった。上側は偶然ごまかせても、下側で崩れる。

[PR #210](https://github.com/podhmo/html-sandbox/pull/210) では、`text_metrics` / `text_block_metrics` と、`label_side` / `label_edge` を足した。必要な記述は「どの shape のどちら側か」「connector の何割の位置か」と文字列であり、baseline の補正はライブラリ側に移った。

```moonbit
c.label_side(node, @svg.S, "south / no overlap")
c.label_edge([a, b], t=0.5, "edge label\nwith ascent", offset=18.0)
```

下側の label は、shape 下端から gap を取ったあと、さらに ascent 分だけ baseline を下げる。edge label は connector 上の normalized arc length を anchor にし、その位置を通る線分の法線方向へ、推定した text box の端まで clearance を取る。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="47.599999999999994 39.6 319.58061972953465 196.0929239585583" width="320" height="196" role="img" aria-label="Baseline-aware labels around shapes and edges">
<rect x="90" y="70" width="120" height="64" rx="8" fill="none" stroke="currentColor" stroke-width="2"/>
<text x="150" y="102" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">shape</text>
<text x="150" y="61.6" font-size="12" text-anchor="middle" fill="currentColor">north / baseline-aware</text>
<text x="150" y="152" font-size="12" text-anchor="middle" fill="currentColor">south / no overlap</text>
<text x="84" y="106.8" font-size="12" text-anchor="end" fill="currentColor">west</text>
<text x="216" y="106.8" font-size="12" fill="currentColor">east</text>
<rect x="240" y="72" width="92.39999999999998" height="14.4" rx="0" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.5"/>
<text x="240" y="84" font-size="12" fill="currentColor">measured label</text>
<path d="M252.8193802704653 151.0252291892601 L357.18061972953467 188.9747708107399" fill="none" stroke="#CC79A7" stroke-width="2"/><path d="M347.3384195126376 189.70524660808772 L357.18061972953467 188.9747708107399 L350.1065383236399 182.0929198778314 Z" fill="#CC79A7" stroke="#CC79A7" stroke-width="2"/>
<text x="289.984391287797" y="208.89292395855827" font-size="12" text-anchor="middle" fill="currentColor">edge label</text>
<text x="289.984391287797" y="223.29292395855828" font-size="12" text-anchor="middle" fill="currentColor">with ascent</text>
</svg>
```

ここでいう measurement はフォント実測ではない。ASCII/CJK の幅を粗く推定し、ascent/descent も SVG font-size から決めた近似である。それでも「baseline を shape 端と混同する」という構造的な事故は減らせる。dense な表や自動折り返しが必要な図では、まだ不十分である。

## 4. chart: 棒の長さ・積み上げ・面をデータから組む

前から `Plot` には axes、series、step、dots、histogram、heatmap などがあった。一方、business references に多い grouped/stacked/diverging bar、area/band、pie/donut は、primitive で「描けないことはない」が毎回手組みだった。

[PR #211](https://github.com/podhmo/html-sandbox/pull/211) では、`Canvas::bar_chart`、`Plot::area`、`Plot::band` を足した。pie/donut については [PR #208](https://github.com/podhmo/html-sandbox/pull/208) の slice builder がそのまま geometry 側の土台になっている。

棒グラフで必要な記述は、カテゴリ名と系列値、layout だけになった。

```moonbit
let desktop = @svg.BarSeries("desktop", [42.0, 55.0, 49.0, 68.0])
let mobile = @svg.BarSeries("mobile", [30.0, 38.0, 51.0, 57.0])

c.bar_chart(20.0, 42.0, 290.0, 130.0, labels, [desktop, mobile])
c.bar_chart(
  70.0, 245.0, 240.0, 130.0,
  labels,
  [desktop, mobile],
  layout=@svg.Stacked,
  horizontal=true,
)
```

area/band は data coordinates を受け取り、plot の scale で pixel に変換する。

```moonbit
p.area(days, p50, baseline=0.0, color=c.color(0), opacity=0.08)
p.band(days, p50, p90, color=c.color(3), opacity=0.12)
```

生成例では、grouped columns、stacked horizontal bars、diverging bar、all-zero diverging fallback を並べている。zero line と scale endpoint は値から計算される。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4.9 -3 724.4 401.8" width="724" height="402" role="img" aria-label="Grouped, stacked, and diverging bar chart builders">
<text x="20" y="20" font-size="13" fill="currentColor">grouped columns</text>
<rect x="20" y="42" width="290" height="130" rx="0" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.35"/>
<path d="M20 172 L310 172" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="15" y="45" font-size="9" text-anchor="end" fill="currentColor" opacity="0.6">68</text>
<text x="15" y="172" font-size="9" text-anchor="end" fill="currentColor" opacity="0.6">0</text>
<text x="56.25" y="184" font-size="10" text-anchor="middle" fill="currentColor">Q1</text>
<rect x="30.875" y="91.70588235294117" width="25.375" height="80.29411764705883" rx="0" fill="#3B82C4" fill-opacity="0.45" stroke="#3B82C4" stroke-width="1.5"/>
<rect x="56.25" y="114.64705882352942" width="25.375" height="57.35294117647058" rx="0" fill="#E69F00" fill-opacity="0.45" stroke="#E69F00" stroke-width="1.5"/>
<text x="128.75" y="184" font-size="10" text-anchor="middle" fill="currentColor">Q2</text>
<rect x="103.375" y="66.85294117647058" width="25.375" height="105.14705882352942" rx="0" fill="#3B82C4" fill-opacity="0.45" stroke="#3B82C4" stroke-width="1.5"/>
<rect x="128.75" y="99.35294117647058" width="25.375" height="72.64705882352942" rx="0" fill="#E69F00" fill-opacity="0.45" stroke="#E69F00" stroke-width="1.5"/>
<text x="201.25" y="184" font-size="10" text-anchor="middle" fill="currentColor">Q3</text>
<rect x="175.875" y="78.32352941176471" width="25.375" height="93.67647058823529" rx="0" fill="#3B82C4" fill-opacity="0.45" stroke="#3B82C4" stroke-width="1.5"/>
<rect x="201.25" y="74.5" width="25.375" height="97.5" rx="0" fill="#E69F00" fill-opacity="0.45" stroke="#E69F00" stroke-width="1.5"/>
<text x="273.75" y="184" font-size="10" text-anchor="middle" fill="currentColor">Q4</text>
<rect x="248.375" y="42" width="25.375" height="130" rx="0" fill="#3B82C4" fill-opacity="0.45" stroke="#3B82C4" stroke-width="1.5"/>
<rect x="273.75" y="63.029411764705884" width="25.375" height="108.97058823529412" rx="0" fill="#E69F00" fill-opacity="0.45" stroke="#E69F00" stroke-width="1.5"/>
<rect x="318" y="13" width="8" height="8" rx="0" fill="#3B82C4" fill-opacity="0.45" stroke="#3B82C4" stroke-width="1.5"/>
<text x="330" y="21" font-size="10" fill="currentColor">desktop</text>
<rect x="318" y="26" width="8" height="8" rx="0" fill="#E69F00" fill-opacity="0.45" stroke="#E69F00" stroke-width="1.5"/>
<text x="330" y="34" font-size="10" fill="currentColor">mobile</text>
<text x="20" y="225" font-size="13" fill="currentColor">stacked horizontal bars</text>
<rect x="70" y="245" width="240" height="130" rx="0" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.35"/>
<path d="M70 245 L70 375" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="70" y="387" font-size="9" fill="currentColor" opacity="0.6">0</text>
<text x="310" y="387" font-size="9" text-anchor="end" fill="currentColor" opacity="0.6">125</text>
<text x="65" y="261.25" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor">Q1</text>
<rect x="70" y="252.3125" width="80.63999999999999" height="17.875" rx="0" fill="#3B82C4" fill-opacity="0.45" stroke="#3B82C4" stroke-width="1.5"/>
<rect x="150.64" y="252.3125" width="57.599999999999994" height="17.875" rx="0" fill="#E69F00" fill-opacity="0.45" stroke="#E69F00" stroke-width="1.5"/>
<text x="65" y="293.75" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor">Q2</text>
<rect x="70" y="284.8125" width="105.6" height="17.875" rx="0" fill="#3B82C4" fill-opacity="0.45" stroke="#3B82C4" stroke-width="1.5"/>
<rect x="175.6" y="284.8125" width="72.96000000000001" height="17.875" rx="0" fill="#E69F00" fill-opacity="0.45" stroke="#E69F00" stroke-width="1.5"/>
<text x="65" y="326.25" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor">Q3</text>
<rect x="70" y="317.3125" width="94.07999999999998" height="17.875" rx="0" fill="#3B82C4" fill-opacity="0.45" stroke="#3B82C4" stroke-width="1.5"/>
<rect x="164.07999999999998" y="317.3125" width="97.92000000000002" height="17.875" rx="0" fill="#E69F00" fill-opacity="0.45" stroke="#E69F00" stroke-width="1.5"/>
<text x="65" y="358.75" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor">Q4</text>
<rect x="70" y="349.8125" width="130.56" height="17.875" rx="0" fill="#3B82C4" fill-opacity="0.45" stroke="#3B82C4" stroke-width="1.5"/>
<rect x="200.56" y="349.8125" width="109.44" height="17.875" rx="0" fill="#E69F00" fill-opacity="0.45" stroke="#E69F00" stroke-width="1.5"/>
<rect x="318" y="216" width="8" height="8" rx="0" fill="#3B82C4" fill-opacity="0.45" stroke="#3B82C4" stroke-width="1.5"/>
<text x="330" y="224" font-size="10" fill="currentColor">desktop</text>
<rect x="318" y="229" width="8" height="8" rx="0" fill="#E69F00" fill-opacity="0.45" stroke="#E69F00" stroke-width="1.5"/>
<text x="330" y="237" font-size="10" fill="currentColor">mobile</text>
<text x="390" y="20" font-size="13" fill="currentColor">diverging bar</text>
<rect x="450" y="42" width="190" height="130" rx="0" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.35"/>
<path d="M545 42 L545 172" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="450" y="184" font-size="9" fill="currentColor" opacity="0.6">-31</text>
<text x="640" y="184" font-size="9" text-anchor="end" fill="currentColor" opacity="0.6">31</text>
<text x="445" y="58.25" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor">Q1</text>
<rect x="545" y="46.875" width="73.54838709677415" height="22.75" rx="0" fill="#3B82C4" fill-opacity="0.45" stroke="#3B82C4" stroke-width="1.5"/>
<text x="445" y="90.75" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor">Q2</text>
<rect x="508.2258064516129" y="79.375" width="36.774193548387075" height="22.75" rx="0" fill="#3B82C4" fill-opacity="0.45" stroke="#3B82C4" stroke-width="1.5"/>
<text x="445" y="123.25" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor">Q3</text>
<rect x="545" y="111.875" width="95" height="22.75" rx="0" fill="#3B82C4" fill-opacity="0.45" stroke="#3B82C4" stroke-width="1.5"/>
<text x="445" y="155.75" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor">Q4</text>
<rect x="459.19354838709677" y="144.375" width="85.80645161290323" height="22.75" rx="0" fill="#3B82C4" fill-opacity="0.45" stroke="#3B82C4" stroke-width="1.5"/>
<rect x="648" y="26" width="8" height="8" rx="0" fill="#3B82C4" fill-opacity="0.45" stroke="#3B82C4" stroke-width="1.5"/>
<text x="660" y="34" font-size="10" fill="currentColor">net score</text>
<text x="390" y="225" font-size="13" fill="currentColor">all-zero diverging fallback</text>
<rect x="450" y="245" width="190" height="80" rx="0" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.35"/>
<path d="M545 245 L545 325" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="450" y="337" font-size="9" fill="currentColor" opacity="0.6">-1</text>
<text x="640" y="337" font-size="9" text-anchor="end" fill="currentColor" opacity="0.6">1</text>
<text x="445" y="265" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor">A</text>
<rect x="545" y="251" width="0" height="28" rx="0" fill="#3B82C4" fill-opacity="0.45" stroke="#3B82C4" stroke-width="1.5"/>
<text x="445" y="305" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor">B</text>
<rect x="545" y="291" width="0" height="28" rx="0" fill="#3B82C4" fill-opacity="0.45" stroke="#3B82C4" stroke-width="1.5"/>
<rect x="648" y="229" width="8" height="8" rx="0" fill="#3B82C4" fill-opacity="0.45" stroke="#3B82C4" stroke-width="1.5"/>
<text x="660" y="237" font-size="10" fill="currentColor">zero</text>
</svg>
```

`bar_chart` はまだ小さな builder である。`Plot` のような ticks/grid/title/subtitle/footnote 全体は持たず、scale endpoint と legend を簡単に出すだけである。記事用の小さな categorical chart を素直に書く層であって、既存の `Plot` を置き換えるものではない。

## 結果

merge 後の main で再実行した検証は次の通りである。

| 検証 | 結果 |
| --- | --- |
| `make -C tools/svg-gen check` | 94 files, 0 failures, 6 warnings |
| `make -C tools/svg-gen figure-docs-check` | 150 files, 0 failures, 270 warnings |
| figure-docs probe | business 112 + dev 38 = 150/150 図を生成 |
| stacked PR | [PR #207](https://github.com/podhmo/html-sandbox/pull/207) から [PR #211](https://github.com/podhmo/html-sandbox/pull/211) まで全て merge 済み |

6 warnings は text を持たない既存の幾何図例である。figure-docs の 270 warnings は、写経元の literal color と text のない thumbnail に対応する。lint が落ちているわけではなく、意図的に残した写経条件である。

PR ごとの結果は次の通りである。

| PR | 入ったもの | 変わった記述 |
| --- | --- | --- |
| [PR #207](https://github.com/podhmo/html-sandbox/pull/207) | 150図 probe、低レベル primitive、監査・優先度分類 | raw を使わずに primitive 写経できる土台ができた |
| [PR #208](https://github.com/podhmo/html-sandbox/pull/208) | `PathBuilder`, `smooth_path`, `pie_slice`, `donut_slice`, curve-aware lint | `d` 文字列ではなく点列・中心・半径・角度で書ける |
| [PR #209](https://github.com/podhmo/html-sandbox/pull/209) | closed arrowhead、port、orthogonal connector、edge label anchor | 端点座標ではなく shape の辺と向きで書ける |
| [PR #210](https://github.com/podhmo/html-sandbox/pull/210) | `text_metrics`, `label_side`, `label_edge` | baseline を手計算せず shape/edge の外側へ置ける |
| [PR #211](https://github.com/podhmo/html-sandbox/pull/211) | grouped/stacked/diverging bar、area/band | 棒の積み上げや面をデータから組める |

`TODO.md` の親項目「svg-gen に figure-docs の必須級機能を入れる」と子 4 件は完了になっている。

## 後の話: まだ不足しているもの

必須級は入ったが、「figure-docs にある図の類型を全部気持ちよく書ける」状態ではない。残っているものは大きく 4 層ある。

### 1. 図の部品化とレイアウト

group/transform/reusable symbol がない。`.mbtx` はコードなので loop と function で逃げられるが、small multiples、isotype、KPI tree、比較表では local coordinates で部品を再利用したい。table/grid/lane layout もなく、RACI、CI/CD、gantt、flame graph、timing diagram では列幅・行高・cell padding を毎回揃える必要がある。

### 2. semantic な dev diagram helper

sequence diagram の lifeline/activation/alt frame、ER の crow's foot、deployment の cylinder/cloud/boundary、git graph、trace/flame span、requirement table などはまだ primitive の組み合わせである。dev references の図は写経できても、新規作成時の語彙は足りない。これらは connector、text、table/layout の上に作るべきものなので、今回の土台が先だった。

### 3. 色の意味

`PALETTE` は categorical な 6 色で、今回の図のように系列や部品の区別には使える。ただし sequential/diverging scale、heatmap の色階調、positive/negative/neutral の semantic color はない。diverging bar も、現状は「その系列の色」で描かれるので、正負を色で分けたい図では利用側が工夫する必要がある。dark/light 両対応の色 role は別途必要である。

colorful にしたことで図は見やすくなったが、色 index はあくまでカテゴリの区別であって意味ではない、という注意は残る。`c.color(2)` が positive を意味するわけではない。

### 4. chart と text の完成度

pie/donut は slice builder であって、label、legend、percent placement を持つ pie chart ではない。radar、parallel coordinates、violin、OHLC/stock、slope、lollipop、waterfall、sankey/chord なども未実装である。sankey/chord/network の自動 layout は、描画 primitive とは別の大きな問題になる。

text も近似 measurement で、bold、wrap、inline style、正確なフォント実測はない。edge label は線からの clearance を取るが、他の label や shape との衝突回避はしない。connector routing も HV/VH の単純なもので、障害物回避や交差削減はしない。

これらの分類は [優先度分類](https://github.com/podhmo/html-sandbox/blob/main/docs/sketch/ja/figure-docs-svg-gen-priority.md) の「あれば嬉しい」「最悪なくても頑張れる」に対応する。少なくとも geographic map、contour、business framework template、network/sankey/chord の自動 layout は、svg-gen 本体へ入れる範囲を別途決めた方がよい。

## 余談: レポートに書いていなかったが気になったことと pitfalls

### vendor した package が古いと、存在しない API に見える

`.mbtx` は local registry 経由で `podhmo/svg-gen` を import する。ライブラリを編集しただけでは examples から新しい API が見えず、`Value donut_slice not found` や `Canvas has no method draw_path` が出た。原因はコードではなく vendor 済み zip の stale cache だった。`./vendor.sh` を挟んでから `moon run` する必要がある。MoonBit のローカル package 開発としては少し意外な失敗で、今後も API を足すたびに踏みやすい。

### path tokenizer は uppercase だけで lowercase を忘れやすい

curve-aware lint の初版は C/S/Q/T/A を読むつもりで、実際には regex が lowercase の `c/s/q/t` を落としていた。`M0 0Z c1 1 2 2 3 3` のような valid な相対曲線で、`c` が token にならず数字だけが残り、直前の `Z` の malformed 引数に見えた。SVG では uppercase/lowercase で意味が変わるので、対応表だけでなく tokenizer もペアで確認する必要がある。

### `Z` の後ろに数字があると parser が止まらなかった

レビューで見つかったもう 1 件は、`Z` の arity が 0 のときに入力 token を消費しない無限ループだった。lint が停止しないので、後続ファイルも検査されない。小さな parser でも、arity 0 の command と malformed token の組み合わせは進行保証を確認した方がよい。

### 水平/垂直に揃った connector は、自動折れ点が退化する

HV routing は `(to.x, from.y)` を折れ点にする。from/to が水平に揃っていると、この点は終点と同じになり、最後の segment 長が 0 になって arrowhead の向きがつぶれた。最初はラベルが target shape に重なる lint FAIL として見えたが、根は degenerate corner だった。折れ点は「自動で足す」だけでなく、from/to と一致したら落とす必要がある。

### edge label は midpoint に置けばよいものではない

最初の label は elbow に置き、そのあと最初の segment の中点に移した。それでも足りず、最終的には normalized arc length の位置を含む segment を探し、その segment の法線方向へ text box の projected half size + clearance だけ離す形になった。2 行 label では、中心までの距離を 10px にしても線が box を通る。オフセットは中心ではなく box の端から測る、という違いが効いた。

### circle/ellipse の port は curved outline ではない

`Shape` は x/y/w/h の bounding box なので、`port` も bounding box の辺に置かれる。circle や ellipse の right edge で `t=0.75` にすると、実際の曲線の外に出る。API コメントには bounding-box port であることを明記したが、本当に curved outline へ接続したい場合は shape に種類情報が要る。今は持っていない。

### MoonBit の record 型推論は、同じ field 集合で衝突する

`BarSeries` を最初 `{ label, values }` にしたところ、既存の `BoxGroup` と同じ field 集合になり、関係なさそうな `data.mbt` で ambiguous record type のエラーが出た。`BarSeries` の field を `name` に変えて解決した。ライブラリに public record を足すとき、field 名の集合は API 表面だけでなく型推論の衝突でもある。

### arc/bounds はまだ近似的である

Bézier は制御点の convex hull を使うので保守的だが、arc は endpoint-to-center conversion のあと 32 点を sampling して bounds に入れている。通常の図では十分でも、極端な半径や細い stroke では exact extrema とわずかにずれる可能性がある。canvas 側に padding があるため今回は問題にならなかったが、厳密な図では arc の解析的な bounds が欲しい。

### colorful にすると、写経 lint の warning の意味が逆に見える

figure-docs probe の literal color warnings は意図的に残っている。一方で新規の図では `c.color(i)` を使うべきなので、同じ warning が「能力不足」「写経方針」「実際の配色ミス」のどれなのかは文脈依存になる。生成 probe と handwritten example を別 target にしているのはこのためだが、警告数だけ見ると読み違えやすい。

### 既存 example の deprecation warning が混ざる

`fig-chart-series.mbtx` の検証中に、既存コードの `to_array` deprecation warning が出た。今回の変更とは独立なので直していない。 warnings をゼロに保つ運用ではないので、新しい警告なのか既存の警告なのかを diff で意識する必要がある。

これらのうち図の作成者が踏みやすいものは、[SVG pitfalls](2026-10-27-writing-slops.md/03-svg-pitfalls.md) にも短く記録した。

## 終わりに

今回の作業で、svg-gen は「小さな概念図を primitive で描くもの」から、figure-docs の代表的な図族に必要な最低限の語彙を持つものへ進んだ。重要なのは機能数よりも、書き手が座標や制御点や baseline を二重に管理しなくてよくなったことだ。写経で 150/150 描けることは出発点で、実際の価値は新規の図を書くときの記述が短くなったことにある。

一方で、今回入れたのはあくまで必須級の土台である。semantic diagram helper、table/layout、色 scale、rich text、高度な chart は残っている。次に何を優先するかはこの記事では決めず、[優先度分類](https://github.com/podhmo/html-sandbox/blob/main/docs/sketch/ja/figure-docs-svg-gen-priority.md) に戻って選ぶ段階である。
