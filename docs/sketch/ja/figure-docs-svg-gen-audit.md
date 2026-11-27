# figure-docs の参照図を svg-gen で描いたときの不足機能

2026-11-27。[issue #200](https://github.com/podhmo/html-sandbox/issues/200) の調査。
対象は `u-ichi/agent-plugins` の figure-docs references、commit
[`c10dce2`](https://github.com/u-ichi/agent-plugins/tree/c10dce225fe205bdacb64f754cc5b6fc61ead8f2/plugins/figure-docs/skills/figure-docs/references)
の `business.html`（112 図）と `dev.html`（38 図）の計 150 図。

## 方法と結果

`tools/svg-gen/examples/figure-docs/generate.py` で、参照 HTML の各 SVG 要素を
最も近い svg-gen primitive へ機械的に写経する `.mbtx` を 150 個生成した。
座標・色・固定の 120x80 viewport をそのまま残したのは、図を再設計すると
「ライブラリに足りないもの」ではなく「書き手が変えたもの」が混ざるため。
つまり、この pass は svg-gen らしい図の例ではなく、primitive coverage の監査である。

結果:

- `make -C tools/svg-gen -j8 figure-docs-svg`: 150/150 件の SVG を生成できた
- `moon run check.mbtx build/figure-docs/*.svg`: FAIL 0、WARN 300
- WARN の内訳: literal color 150、text なし 120、curve command unchecked 30
- literal color は参照図の固定色を写経したため意図的。text なしも、元の小さい
  見本がラベルを持たないだけなので能力不足ではない
- curve command unchecked は lint 側の実質的な不足（後述）

生成結果については、150/150 件で参照 SVG と生成 SVG の要素種別ごとの数が一致
することを確認した（`line` だけは svg-gen が `path` として出すので、その変換を
正規化して比較）。gallery では、少なくとも先頭の business 図群が参照と生成結果で
視覚的に一致することも確認した。

## 写経の前に足りなかった primitive

初期の svg-gen は concept figure 向けの `box`/`circle`/`text`/`line`/`arrow` と
chart 向けの `Plot` が中心で、参照図の写経には次が足りなかった。今回の branch
では、これらは escape hatch の `raw` に頼らず書けるように追加済みである。

| 不足していたもの | 参照図での使われ方 | 追加した API |
| --- | --- | --- |
| 固定 viewBox | すべての参照図が 120x80 の thumbnail 座標系 | `ViewBox`, `render(viewbox=...)` |
| 塗りつぶしできる矩形 | bar、background band、frame、table cell など 847 要素 | `rect(fill=...)` |
| 楕円 | contour map など 4 要素 | `ellipse` |
| polygon / polyline | closed arrowhead、radar、area、flow shape など 138 要素 | `polygon`, `polyline` |
| fill/stroke の独立した opacity | venn、contour、確からしさ表現など | `fill_opacity`, `stroke_opacity` |
| path の fill | pie/donut/sankey/chord/violin など 30 要素 | `path(fill=...)` |
| text の色指定 | 参照図の小さな grey label | `text(color=...)` |

要素数は生成済み `.mbtx` 内の呼び出し数。business/dev 合計では
`rect` 847、`circle` 335、`line` 339、`polygon` 103、`polyline` 35、
`path` 30、`text` 127、`ellipse` 4 だった。

## 残っている不足

### 1. curve は「書ける」が「組み立てられない」

`path` は raw な `d` 文字列を受け取るので、C/S/Q/A を含む図も写経はできる。
ただし pie/donut の arc、violin の滑らかな密度形、sankey/chord の ribbon では、
作者が制御点や arc parameter を直接書く必要がある。これは svg-gen の前提だった
「LLM が座標を手書きして失敗する」状態に近い。

必要なもの:

- line/cubic/quadratic を point 列から組む typed path builder
- arc/pie slice/donut slice helper
- 少なくとも endpoint/control point から bounds を推定する仕組み
- `check.mbtx` の C/S/Q/A 対応（今回 30 件の WARN になったもの）

### 2. 矢印と connector が弱い

dev references では 84 個の polygon が主に closed arrowhead として使われている。
現在の `arrow` は open-V の head だけなので、sequence diagram や flowchart の
塗りつぶし三角 arrowhead を primitive では書けない。`via` で折れ線はできるが、
orthogonal connector、port、edge label、再配置はすべて作者側の計算になる。

必要なもの:

- closed/filled arrowhead（少なくとも triangle）
- orthogonal elbow connector（水平→垂直→水平などの型）
- shape edge 上の port 指定（今の N/S/E/W より細かい位置）
- edge label の auto placement はなくても、anchor 計算 helper は欲しい

### 3. 図形の reuse / composition がない

参照 SVG 自体は `<g>` も `transform` も使っていないので、写経には不要だった。
ただし pictogram、small multiples、sequence diagram、KPI tree、比較表のような
繰り返しの多い図を人間/LLM が新規に書くときは、同じ部品を translate/scale して
置く仕組みがないと座標の二重管理になる。

必要なもの:

- group と transform（少なくとも translate）
- reusable symbol / template 相当の仕組み
- small-multiple 用の grid layout helper

### 4. chart primitive は一部だけある

`Plot` には axes、series、step、dots、boxplot、histogram、heatmap などがある。
そのため line/scatter/histogram/boxplot/heatmap 系は土台がある。一方、今回の
business references に多い次の形は、primitive を組み合わせる前の「図の種類」
としては足りない。

- column/bar 系: vertical column、grouped/stacked/diverging bar、population pyramid、Pareto
- area/band 系: area chart、surplus/deficit、fan chart、confidence band
- 割合系: pie、donut、treemap、marimekko、proportional stacked bar
- 特殊な系列: slope、lollipop、bullet、OHLC/stock、radar、parallel coordinates、violin
- layout 系: calendar heatmap、sparkline、small multiples、isotype/gridplot
- flow/network 系: sankey、chord、network

線や矩形で「描けないことはない」が、データから長さ・積み上げ・色・軸を
一貫させる helper がないと、図ごとの手仕事になる。

### 5. dev diagram 用の semantic shape がない

dev references は primitive の写経では全部描けたが、新規作成時に欲しい semantic
helper が多い。

- sequence diagram: lifeline、activation bar、alt/loop frame
- ER/DFD: crow's foot、entity table、trust boundary、process/data store
- deployment/cloud: cylinder、cloud、network boundary、nested container
- timing/git/release: lane、milestone、branch/merge edge、gantt bar
- trace/flame: span 階層、flame rect 積層
- 比較表/RACI/requirement: table/grid、cell、列幅と text measurement

### 6. 色の抽象が足りない

参照図は light theme 固定色なので、写経では 150/150 件が literal color WARN に
なる。これは写経方針どおりだが、再設計時に必要なものも見える。

現在の `PALETTE` は categorical 6 色だけなので、sequential/diverging scale、
heatmap の色階調、positive/negative/neutral の semantic color がない。
ダークテーマと両立させるには、単なる hex 指定ではなく theme-aware な色 role が
必要になる。

### 7. text は最小限

今回の参照図が使うのは small size、anchor、fill color だけなので写経には足りる。
実際の framework diagram では、bold、複数行の wrapping、部分 styling、
正確な text measurement が必要になる。現状の幅推定は ASCII/CJK の粗い近似で、
表や dense diagram では溢れ検出も近似に依存する。

## 結論

低レベル写経という意味では、今回追加した primitive によって 150/150 図は
svg-gen で生成できる。ただし「これらの図を楽に書かせられるか」という意味では
まだ足りない。優先度が高いのは curve/path builder、closed arrowhead と elbow
connector、group/transform、bar/area/pie 系の chart primitive、そして curve-aware
lint。地理図・contour・sankey/chord/network の自動 layout アルゴリズムは、
svg-gen に入れる範囲を別途決めるべき大きめの領域である。
