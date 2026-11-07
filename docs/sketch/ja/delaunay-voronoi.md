# 調査メモ: ドロネー三角形分割とボロノイ図

自己完結的な解説記事（前提知識から書き起こす）を作るための事前調査。
裏テーマは「もっと図を使った記事」: 幾何は計算できる対象なので、
`tools/svg-gen` の生成器内で実際に Delaunay / Voronoi を計算して描く方針を取る
（スパイク済み、下記「図の生成方法」参照）。

元になった雑な下書き（チャットの要約）に含まれていた誤りの精査結果も最初に置く。

## 下書きの精査（直す必要がある点）

- 誤り: 「ドロネー辺は、両端点を結ぶ線分を直径とする円が他の点を含まない」。
  これは Gabriel 辺の定義。Delaunay 辺の正しい特徴づけは
  「p, q を通り、内部に他の点を含まない円（=空円）が存在する」こと。
  直径円が空ならその円が証人になるので Gabriel 辺 ⇒ Delaunay 辺だが、逆は成り立たない
  （CGAL の文書も "The Gabriel property is stronger than the Delaunay property" と明記）。
- 精度不足: 「最小角の最大化により細長い三角形が避けられる」。
  正確には「同一点群の全三角形分割の中で最小角を最大化する」であって、
  点群の配置が強制する細長さは消えない。良質メッシュには点の追加
  （Delaunay refinement、後述）が別途必要。
- 精度不足: 「ハーフトーン処理に応用」。正確には、重心ボロノイ分割
  （CVT: centroidal Voronoi tessellation）を Lloyd 反復で作る stippling / blue noise の話。
  Delaunay ではなく Voronoi 側の応用。
- 下書きに無いが記事で押さえたい点:
  - 双対辺は互いに垂直だが、交わるとは限らない（後述「双対性の細部」）。
  - 個数の公式（三角形分割は全部同じ数）。
  - 局所 Delaunay ⟹ 大域 Delaunay（flip アルゴリズムの正当性の核）。
  - 最近接グラフ群の包含列と、グラフとしてのスパナ性。

## 前提知識の棚卸し（記事で先に説明するもの）

- 垂直二等分線: 2 点から等距離にある点の軌跡。ボロノイ辺の素。
- 外接円・外心: 非共線な 3 点を通る円は一意。ボロノイ頂点 = 外心。
- 凸包: 点集合の三角形分割は凸包全体を覆う。無限ボロノイセル ⟺ 凸包上の点。
- 三角形分割の定義: 点集合を頂点とする、辺が交差しない極大の平面グラフ。
- 一般位置（general position）の仮定: 3 点が同一直線上にない、4 点が同一円周上にない。
  これが無いと一意性が崩れる（後述「退化」）。
- 双対グラフの感覚: 「隣り合うもの同士を結ぶ」。本文中の図でその場説明で足りそう。
- 数え上げに使う Euler の公式 V − E + F = 2（一節だけで済む）。
- アルゴリズム節の道具: 行列式による in-circle 判定、放物面 z = x² + y² への持ち上げ。

## ボロノイ図の要点

- 定義: サイト pᵢ のセル = { x | ∀j≠i: d(x, pᵢ) ≤ d(x, pⱼ) }。
  「最も近いサイト」で平面を割り分ける。Dirichlet tessellation（1850）、
  Thiessen polygons（気象, 1911）とも呼ばれる。Voronoi は 1908 年頃に n 次元で定式化。
- セルは半平面の共通部分なので凸。内部サイトは有界な凸多角形、凸包上のサイトは無限セル。
- 辺は 2 サイトの垂直二等分線の一部。頂点は 3 サイトの外接円の中心（外心）。
- サイズ上界（一般位置, n ≥ 3）: 頂点 ≤ 2n − 5、辺 ≤ 3n − 6。
  後述の三角形個数公式と双対で一致する。
- 「Voronoi 頂点 v がサイト p,q,r のセルの交点 ⟺ v は p,q,r を通る空円の中心」:
  v は p,q,r から等距離で、他のどのサイトよりも近い —— これが双対性の中身。

## ドロネー三角形分割の要点

3 つの等価な入口（記事はこの順で繋ぐと自然）:

1. 双対: 隣接するボロノイセルのサイト同士を結んだ直線グラフ。
2. 空円性（empty circumcircle）: 各三角形の外接円の内部に他の点を含まない。
3. 最適性: 全三角形分割の中で、全角を昇順に並べた角度ベクトルを辞書式最大化
   （⟹ 最小角の最大化。Sibson 1978）。

基本性質:

- 辺の特徴づけ: pq が Delaunay 辺 ⟺ p,q を通る空円が存在する
  （「少なくとも 1 つの空円」。直径円である必要はない —— 精査項番1）。
- 三角形の特徴づけ: pqr が Delaunay 三角形 ⟺ 外接円が空。
- 個数公式: h = 凸包上の点数とすると、三角形 T = 2n − 2 − h、辺 E = 3n − 3 − h。
  どの三角形分割でも同じ数（Euler の公式から。スパイクの assert で検算済み）。
- 局所 ⟹ 大域（Delaunay lemma）: 全ての内部辺が局所 Delaunay
  （両側の三角形で、向かいの頂点が相手の外接円に入らない）なら全体が Delaunay。
  flip アルゴリズムの正当性の核。証明は「外接円が空でなければ違反辺が連鎖して見つかる」方向。
- 一意性: 一般位置なら一意。4 点以上の共円があると、その多角形の三角化の取り方だけ複数ある。
- 最適性の内訳（何を最適化し、何をしないか）:
  - する: 角度ベクトルの辞書式最大化（= 最小角最大化）、
    外接円半径列の辞書式最小化（= 最大外接円の最小化）。
  - しない: 最大角の最小化、辺長総和の最小化（minimum weight triangulation は別問題）、
    最長辺の最小化。
  - 副産物: 分割が全部非鈍角（外心が三角形内）ならそれは Delaunay。
- グラフとしての性質:
  - 包含列: NNG ⊆ EMST ⊆ RNG ⊆ GG ⊆ DT
    （最近接グラフ ⊆ ユークリッド最小全域木 ⊆ 相対近傍グラフ ⊆ Gabriel グラフ ⊆ Delaunay）。
    「どんな点の最近接点も Delaunay 隣接」「MST の辺は全部 Delaunay に含まれる」は
    応用で効く事実。
  - スパナ性: DT は t-スパナ（辺上最短路 / 直線距離 ≤ t）。Keil–Gutwin 1992 で t ≤ 2.42、
    Xia 2013 で t < 1.998。下界は 1.5932（Xia–Zhang）。
    2026-09 の arXiv プレプリント（2609.07979）は上界 1.5949 を主張し、
    下界との差 < 0.002 を謳う —— 査読前かつ新しすぎるので「未検証の最近結果」として扱う。
  - 平面グラフで次数 6 前後、無限セルに対応する凸包辺を含む。

## 双対性の細部（下書きに無い論点）

- Delaunay 辺とその双対 Voronoi 辺は互いに垂直（Voronoi 辺は垂直二等分線上にある）が、
  線分としては交わるとは限らない。鈍角三角形では外心が三角形の外に出る。
- pq が Gabriel 辺 ⟺ 双対 Voronoi 辺が pq と交わる。
  最小の反例: 鈍角三角形 1 個。最長辺 pq は Delaunay（外接円は空）だが、
  直径円は向かいの鈍角頂点を含む（円周角の定理で鈍角 ⟺ 直径円内）ので Gabriel でない。
  訂正ネタとして図にしやすい。
- 退化時の対応: 4 点共円では Voronoi 頂点の次数が 4 になり、
  対応する Delaunay 面は四角形（三角化の取り方 = 対角線の取り方）。

## 退化の扱い

- 4 点以上の共円: Delaunay が一意でない。どの対角線も空円性を満たす。
- 3 点以上の共線: 面積 0 の三角形が生じうる。
- 重複点: 前処理で除去。
- 実装上の対策: 記号摂動（SoS: Simulation of Simplicity, Edelsbrunner–Mücke 1990）で
  一般位置に仮想的に戻す、または非一意を受け入れて任意に割る。
- 数値誤差: float の in-circle 判定は共円近傍で不安定 → 厳密・適応精度の述語
  （Shewchuk の robust predicates が定番）。記事では一言触れる程度で。

## アルゴリズム概観

| 手法 | 計算量 | メモ |
| --- | --- | --- |
| Lawson の flip | O(n²) flip・時間 | 任意分割から出発。違反辺の flip で角度ベクトルが単調増加して止まる。証明と実装の素朴さが魅力 |
| Bowyer–Watson（逐次添加） | 期待 O(n log n)、最悪 O(n²) | 超三角形 + 挿入点を含む外接円を持つ三角形の除去（cavity）+ 再三角化。~70 行で書ける（スパイク参照）。点の探索を DAG 履歴や Delaunay hierarchy で速くする |
| 分割統治（Guibas–Stolfi） | O(n log n) | 下半分・上半分を下から共通接線で縫い合わせる。実装は最難 |
| Fortune の掃引線 | O(n log n) | 放物線弧の beach line を掃引。Voronoi を直接作る。図にしやすい |
| 放物面リフト + 3次元凸包 | O(n log n) | (x,y) → (x,y,x²+y²) の下側凸包を射影。概念が美しい |

- 下界: Ω(n log n)（1 次元でもソートに帰着する）。
- in-circle 判定: 反時計回りの三角形 abc に対し、d が外接円の内部
  ⟺ 4×4 行列式 det[ (xᵢ, yᵢ, xᵢ²+yᵢ², 1); i = a,b,c,d ] > 0。
  リフトで言うと「d の持ち上げが abc の張る平面より下」。両者の対応も記事のネタ。
- 実用ライブラリ: scipy.spatial の Delaunay / Voronoi（Qhull 経由）で手元確認できる。

## 応用の整理

- メッシュ生成（FEM など）: 同一点群では Delaunay が角度的に最良の分割だが、
  品質保証には Steiner 点を足す Delaunay refinement（Chew 1993, Ruppert 1995;
  最小角 ~20.7° 級の保証）。境界を固定したい場合は制限 Delaunay（CDT:
  「可視な点に限り空円」に緩めたもの —— CGAL の表現）。
- 地形モデリング（TIN）: 標高点群 → 三角網 → 標高補間・等高線。
- 補間: natural neighbor（Sibson）補間 —— Voronoi セルの面積比で重みを決める。
- 最近接・探索: NNG ⊆ DT なので最近接候補は Delaunay 隣接に限定できる。
  点位置探索の walk は Delaunay 隣接を辿る。
- ネットワーク・経路: DT のスパナ性をバックボーンにした幾何ルーティング、
  Gabriel グラブによる平面化（GPSR 系）。Voronoi 辺は障害物サイトからの
  最大余白軌道（max-clearance roadmap）としてロボット経路計画でも使われる。
- 点群からの形状復元: alpha shapes（Delaunay の部分複体として定義）など。
- 画像・描画: CVT + Lloyd 反復による stippling / blue noise（精査項番3）。
- テリトリー分析: Thiessen ポリゴンの本来の使われ方（気象・生態）。
- メディアアート・生成系（実例、いずれもリンク先を確認済み）:
  - Voronoi セルの塗り分けはステンドグラス風、Delaunay のフラット塗りはローポリ風、
    という 2 つの定番の見た目。同一点群から両方作れるので双対の実感にもなる
    （図 G2、spike 済み）。
  - Golan Levin "Segmentation and Symptom" (2000): 雑誌のためのポートレートシリーズ、
    Voronoi の繊細な網目を被写体に重ねる。作者自身の動機付けの記述あり。
  - Raven Kwok "A Step Closer" (UCCA Edge, 2023): 来場者の顔から quad-tree の葉中心を
    サイトにして Voronoi を生成するインタラクティブ展示。Processing 製。
  - Jordi Majó "Delaunay Portraits"、John Kinstler の 3D スキャン+Voronoi 作品、
    Gorilla Sun の creative coding 記事（アート作例つき解説）。
  - 表現の幅: セル塗り分け、三角形フラット塗りのほか、CVT stippling（濃度→点密度）、
    Voronoi fracture（破砕エフェクト、VFX では Houdini の同名ノードとして有名）など。

## 拡張の方向（記事の「その先」に載せる候補）

- 3 次元: 空球性で四面体分割になるが、角度の最適性は消える。
  外接球が空でも sliver（ペラい四面体）が残る —— メッシュ生成が難しい理由。
  四面体数は最悪 Θ(n²)。
- 制限 Delaunay（CDT）: 指定辺を残す緩和版。GIS・メッシュの実務はこちら。
- 重み付き: power diagram（Laguerre–Voronoi）⟺ 正則三角形分割。additively weighted
  は双曲線状の辺。
- 高次・別種: k-th order Voronoi、farthest-point Voronoi（双対は凸包上だけの
  farthest-point Delaunay）、anisotropic Voronoi。

## 記事の形と骨子（2026-11-07 決定案）

形:

- bundle `slops/YYYY-MM-DD-delaunay-voronoi.md/`。README.md が本編。
  著者未読の参照（Xia 2013、CGAL 文書、講義ノート、2026-09 プレプリント等）は
  write-slops のルールどおり「AI 集め」明示の別メンバー（例: `01-references.md`）
  に分け、各項目に何を確認したかを書く。図は inline の ```svg フェンスで本文に隣接させる
  （`.svg` メンバーにすると文章から離れるので今回は向かない）。
- 本文は日本語（既存 slops に揃える）。`next`/`prev` は隣の記事が決まってから。

colorful 方針（ユーザーの希望「colorful で記事にしたい」）:

- 色相は「分類・同一性」のみに使い、文章は currentColor のまま。
  記事全体で凡例を統一する:
  - Delaunay: 実線 + `c.color(0)`（青系）。Voronoi: 破線 + `c.color(1)`（橙系）。
  - 違反・警告・「これはダメ」のマーク: `c.color(3)`（朱系）+ 太線。
  - 特集する要素（注目の辺・三角形・サイト）: `c.color(2)`（緑系）または wash。
- dash/線幅の逃げ道を必ず併用する（色が消えても Voronoi=破線 vs Delaunay=実線で読める）。
- 1 図でサイト全員に別の色相は付けない（PALETTE は 6 色まで）。
  サイトの色分けが欲しい図（セルの持ち主を見せる図、Fortune の放物線）は
  サイト 4〜5 個の小さな別例を使い、本編の 10 点セットは色を絞って使う。
- スパイクの colorful 版（Delaunay 青実線 / Voronoi 橙破線）は描画・lint ともに OK。
  白背景 PNG で目視確認済み。

骨子（節ごとに「図の役割」と「本文の役割」を分けておく）:

| 節 | 内容 | 図 |
| --- | --- | --- |
| 0. 導入 | 「点しかない集合に『隣』を入れたい」という問い。応用を一言ずつ。2 つの構造が双対で出る予告 | 点群のみの図（全図共通の入力、初出） |
| 1. 準備 | 垂直二等分線 → 外接円と外心 → 凸包 → 三角形分割とは（例/非例）。各 2〜3 文 + 図。一般位置は「退化の節で」と予告のみ | 前提図 4 枚（小さく） |
| 2. ボロノイ図 | 最近接サイトで割り分ける定義（半平面の交わり）→ 性質（凸セル・辺・頂点・無限セル）→ 「頂点 = 3 サイトの空円の中心」まで | 半平面の交わり図 or 小数点の塗り分け図、全体図、頂点+外接円 |
| 3. ドロネー三角形分割 | 双対として定義（重ね図）→ 等価な言い換え: 空円性 → 3 つ目の顔: 最小角最大化 → 個数公式（表で） → flip という見方 | 重ね図、空円の正例/反例、最小角比較、flip 前後 |
| 4. 双対の細部と退化 | 辺は垂直だが交わらないことがある（Gabriel 辺との差、下書き誤りの訂正ネタ）。共円で非一意 | 鈍角三角形の小図、共円 4 点の 2 分割 |
| 5. 作り方 | Lawson flip（§3 の図を再利用）→ Bowyer–Watson → Fortune → 1D リフト。in-circle 判定と計算量は表 + 短文。「実際は scipy.spatial で一瞬」 | BW 1 ステップ、beach line、1D リフト |
| 6. 性質と応用 | 包含列 → スパナ一言 → 応用箇条書き（refinement/CDT/補間/ルーティング/CVT/alpha shapes、各 1〜2 文） | 包含列 small multiples |
| 7. その先 | 3 次元（sliver、Θ(n²)）、CDT、重み付き、高次。各 1〜2 文 | なし（表か文） |
| 8. まとめ | 3 行程度 | なし |

- 図の総数は 10〜14 枚想定。多いが裏テーマ（図の多い記事）そのものなので問題なし。
  ただし各図は「これが無いと文章で説明し直す必要がある」ものだけに絞る。
- 迷いどころ（書くときに決める）:
  - セル塗り分けのイメージは 10 点図では色相が足りないので、サイト 4〜5 個の小例を別途使うか。
  - アルゴリズム節の 3 図は全部入れるか、1〜2 枚に絞るか。
  - 最小角比較は角度アークの作画コストに見合うか（数値表の併記で軽くする手もある）。

## 図の一覧（骨子の節と対応）

| # | 節 | 図 | 伝えること | 生成メモ |
| --- | --- | --- | --- | --- |
| P0 | 0 | 点群のみ | 入力は点だけ | モノクロ |
| P1 | 1 | 垂直二等分線（2点 + 等距離点の軌跡） | 「等距離 = 1 本の線」 | 2 サイトを 2 色相 |
| P2 | 1 | 外接円と外心（3点 + 二等分線 2 本の交点） | 「3 点 → 中心が決まる」 | 3 サイトを 3 色相 |
| P3 | 1 | 凸包 | 「分割は外周まで覆う」 | hull 辺を 1 色相 |
| P4 | 1 | 三角形分割の例/非例 | 「交差なし・隙間なし」 | 小 2 パネル、違反辺を朱 |
| V1 | 2 | 半平面の交わり → 1 セル | セルは切り取られてできる | bisector 群 + セル wash |
| V2 | 2 | ボロノイ完成図（10点） | 分割の全体像 | 境界線のみ・モノクロ寄り |
| V3 | 2 | Voronoi 頂点 + 外接円 | 頂点 = 空円の中心（双対への橋） | スパイクのハイライト技法 |
| D1 | 3 | Voronoi + Delaunay 重ね図 | 双対の全体像 | スパイク済み・colorful 版も確認済み |
| D2 | 3 | 空円の正例/反例 | 「円内に点が入ると Delaunay でない」 | 反例の内部点を朱 |
| D3 | 3 | edge flip 前後 | 修復操作の見た目 | 違反辺 = 朱太線 → 正しい辺 = 青 |
| D4 | 3 | 最小角比較（2 分割並べ） | 最適性の 3 つ目の顔 | 最小角アーク + 度数、要検討 |
| X1 | 4 | Gabriel でない Delaunay 辺 | 辺の正しい特徴づけ（誤り訂正） | 鈍角三角形 + 直径円（朱） |
| X2 | 4 | 4 点共円 → 2 分割 | 非一意の最小例 | 対称 2 パネル |
| A1 | 5 | Bowyer–Watson 1 ステップ | cavity の除去と再三角化 | 中間状態を再利用、bad 三角形 wash |
| A2 | 5 | Fortune の beach line | 放物線弧 + 掃引線 | サイト 4〜5 個、放物線 = サイト色相 |
| A3 | 5 | 1D リフト | 放物線 + 下側凸包 = 隣接 | リフトの直感を 2D に留める図 |
| G1 | 6 | 包含列 small multiples | NNG ⊆ EMST ⊆ GG ⊆ DT（同一点群） | 4 パネル; 包含図は文の図式化になるので幾何図を並べる |
| G2 | 6 | メディアアート 2 パネル | ステンドグラス風（セル塗り分け）とローポリ風（三角形塗り分け）が同一点群から出る | 生成済み `fig-media-art.ts`。セルは半平面 clip（`voronoiCell`）、塗りは raw ポリゴン + PALETTE 順繰り |

- 「図にしない」判断の例: 個数公式・計算量比較・性質の整理は表、履歴の一言は文で済ませる。
- ラベル方針: サイトに p₁… を全部付けると散らかる。基本はドットのみ、
  特集する点・三角形だけに短いラベル。check.ts は <12px の形を「印」扱いするので
  ドットはラベル容器と衝突しない。
- 角度アーク・セル塗り・放物線は svg.ts に直接のプリミティブが無いので
  `path()` / `raw()` の逃避口を使う（chart.ts が同じことをしている前例あり）。

## 図の生成方法（スパイク結果）

`tools/svg-gen/examples/fig-voronoi-dual.ts`（本メモ作成時に追加）で実証:

- 生成器内で Bowyer–Watson（~70 行）を回して Delaunay を計算し、
  双対の Voronoi（隣接三角形の外心同士を結ぶ + 境界は外向き半直線）を描く。
- `assert` で「三角形数 = 2n−2−h（Euler + monotone chain の凸包で検算）」
  「全外接円が空」を検査。`make` 経由で check.ts も通る（text 無し警告のみ）。
- svg.ts の素性で足りた: `line`(via で折れ線), `circle`, `raw`(塗りドット), `path`(曲線の逃避口)。
  colorful 化も `color: c.color(i)` を stroke に渡すだけで済む
  （Delaunay = 青実線 / Voronoi = 橙破線で確認済み。サイトのドットは currentColor のまま）。
- 得た教訓: 境界の Voronoi 半直線はクリップ箱を決めて打ち切る
  （図の座標系で一定の B まで。サイト bbox の外に自然にはみ出す形）。
- 共有モジュール化（済）: `examples/geom.ts` に点集合 `SITES` / `FEW_SITES`、
  `circum`、`delaunay`（Bowyer–Watson）、`hull`（monotone chain）、`edgeAdjacency`、
  `voronoiCell`（矩形クリップ + 半平面逐次カット、Sutherland–Hodgman 式）を置いた。
  Makefile の依存に `examples/geom.ts` を追加済み。`fig-media-art.ts` がセル塗りつき
  ポリゴン（`raw` + `fill-opacity` + PALETTE 順繰り）の実例。
- 次の段取り: F1–F6 を同一点集合で量産する。セル塗り・放物線・角度アークは
  `raw`/`path` 経由で、`fig-media-art.ts` がポリゴン塗りの雛形になる。

## 出典

- UPC DCCG の講義スライド（Delaunay edge/triangle の空円特徴づけ）:
  https://dccg.upc.edu/people/vera/wp-content/uploads/2012/10/DAG-Delaunay.pdf
- CGAL 2D Triangulations / Mesh マニュアル（Delaunay 辺 vs Gabriel 辺、CDT の定義）:
  https://doc.cgal.org/Manual/latest/doc_html/cgal_manual/Mesh_2/Chapter_main.html
- Shewchuk "Delaunay Refinement Algorithms for Triangular Mesh Generation" の
  chapter 2 草稿（empty circumdisk、CDT 解説）:
  https://people.eecs.berkeley.edu/~jrs/papers/meshbook/chapter2.pdf
- Bowdoin CS3250 講義ノート（Delaunay lemma、角度ベクトル、flip O(n²)）:
  https://tildesites.bowdoin.edu/~ltoma/teaching/cs3250-CompGeom/spring17/Lectures/notes-delaunay.pdf
- Xia, "The Stretch Factor of the Delaunay Triangulation Is Less Than 1.998":
  https://arxiv.org/abs/1103.4361
- 2026-09 プレプリント（上限 1.5949 主張、未検証）:
  https://arxiv.org/pdf/2609.07979.pdf
- graphclasses.org Gabriel（NNG ⊆ … ⊆ Gabriel ⊆ Delaunay の包含列）:
  https://www.graphclasses.org/classes/gc_1222.html
- メディアアート実例（いずれも検索結果＋ページ概要を確認）:
  - Golan Levin, "Segmentation and Symptom" (2000): https://www.flong.com/archive/projects/zoo/index.html
  - Raven Kwok, "A Step Closer" (UCCA Edge, 2023): https://ravenkwok.com/a-step-closer-ucca-edge/
  - Jordi Majó, "Delaunay Portraits": http://majo.com/triangle.html
  - John Kinstler（3D スキャン + Voronoi）: https://johnkinstler.com/artwork/821895-It%27s%20All%20In%20My%20Head%20%28front%29.html
  - Gorilla Sun, "Delaunay Triangulation and Voronoi Diagrams"（作例つき解説記事）:
    https://www.gorillasun.de/blog/delaunay-triangulation-and-voronoi-diagrams/
- その他の基礎事項（Voronoi 上界 2n−5/3n−6、Fortune 1987、Guibas–Stolfi 1985、
  Brown 1979 のリフト、SoS、Ruppert/Chew、alpha shapes 等）は教科書常識レベルとして
  扱った（de Berg らの CGAA 等、原典の個別確認は未実施）。
