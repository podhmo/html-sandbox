執筆: Devin（SWE-2 Max）。このメンバーは、著者が読んでいない参照を AI が集めた一覧。各項目に何を確認したかを書く。記事本体の主張（教科書レベルの定義・性質）は、このリポジトリの調査メモ `docs/sketch/ja/delaunay-voronoi.md` に整理してある。

# 参照（AI が集めたもの）

- UPC DCCG の講義スライド "Delaunay Triangulation of Point Sets": Delaunay 辺・三角形の空円による特徴づけ、平面性、共円時の pre-triangulation を確認（該当スライドを閲覧）。
  https://dccg.upc.edu/people/vera/wp-content/uploads/2012/10/DAG-Delaunay.pdf
- CGAL 2D Triangulations / Mesh マニュアル: 「Gabriel 辺 = 直径円が空」「The Gabriel property is stronger than the Delaunay property」、制限 Delaunay の「可視な点」の定義を確認。
  https://doc.cgal.org/Manual/latest/doc_html/cgal_manual/Mesh_2/Chapter_main.html
- Shewchuk のメッシュ教科書 chapter 2 草稿 "Two-dimensional Delaunay triangulations": empty circumdisk の定義、Delaunay 辺の "at least one empty open circumdisk"、CDT の位置づけを確認。
  https://people.eecs.berkeley.edu/~jrs/papers/meshbook/chapter2.pdf
- Bowdoin CS3250 の講義ノート: Delaunay の補題、角度ベクトルの辞書式最大化、フリップ O(n²) を確認。
  https://tildesites.bowdoin.edu/~ltoma/teaching/cs3250-CompGeom/spring17/Lectures/notes-delaunay.pdf
- Xia, "The Stretch Factor of the Delaunay Triangulation Is Less Than 1.998": abstract で上界 1.998（Keil–Gutwin 1989 の 2.42 の改善）を確認。
  https://arxiv.org/abs/1103.4361
- "The Stretch Factor of Planar Delaunay Triangulations Is Nearly Determined"（arXiv 2609.07979）: abstract で上界 1.5949・下界 1.5932 との差 <0.002 の主張を確認。2026-09 の新しいプレプリントで、査読状況・正しさは未検証。
  https://arxiv.org/pdf/2609.07979.pdf
- graphclasses.org "Gabriel": 相対近傍グラフ ⊆ Urquhart ⊆ Gabriel ⊆ Delaunay の包含列を確認。
  https://www.graphclasses.org/classes/gc_1222.html

## メディアアートの実例（ページの概要を確認）

- Golan Levin, "Segmentation and Symptom" (2000): Voronoi の網目をポートレートに重ねた作品。作者自身の動機の記述つき。
  https://www.flong.com/archive/projects/zoo/index.html
- Raven Kwok, "A Step Closer" (UCCA Edge, 2023): 来場者の顔から quad-tree の葉中心をサイトにして Voronoi を生成するインタラクティブ展示。Processing 製。
  https://ravenkwok.com/a-step-closer-ucca-edge/
- Jordi Majó, "Delaunay Portraits": ドロネー条件を満たす三角形網によるポートレート。
  http://majo.com/triangle.html
- John Kinstler: 3D スキャンした頭部の点群から Voronoi パターンを作ったシリーズ。
  https://johnkinstler.com/artwork/821895-It%27s%20All%20In%20My%20Head%20%28front%29.html
- Gorilla Sun の作例つき解説 "Delaunay Triangulation and Voronoi Diagrams"（creative coding）。
  https://www.gorillasun.de/blog/delaunay-triangulation-and-voronoi-diagrams/

## 記憶ベースで書いた事項（原典は未確認）

Voronoi 図のサイズ上界（頂点 ≤ 2n−5、辺 ≤ 3n−6）、Euler 公式による個数公式、一般位置での一意性、Delaunay の補題、Lawson のフリップ、Bowyer–Watson、Guibas–Stolfi の分割統治、Fortune 掃引線（1987）、Brown の放物面リフト（1979）、in-circle 行列式、SoS、Ruppert・Chew の Delaunay refinement（角度 ~20.7° 級の保証）、alpha shapes、natural neighbor 補間、3次元の sliver 問題と Θ(n²)、NNG・EMST・RNG 側の包含関係、歴史（Dirichlet 1850・Voronoi 1908・Thiessen 1911・Delaunay 1934 "Sur la sphère vide"）。

いずれも教科書常識レベル（de Berg らの計算幾何テキスト系）として扱ったが、原典の個別確認はしていない。
