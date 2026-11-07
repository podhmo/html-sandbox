---
title: 点の集まりに「隣」を入れる —— ボロノイ図とドロネー三角形分割
description: 散らばった点だけから「どれがどれの隣か」を引き出す2つの構造、ボロノイ図とドロネー三角形分割を垂直二等分線から自己完結で。全18図はすべて同じ10個の点から、図ごとの小さなジェネレータが実際の幾何を計算して描いた。
prev: ../2026-11-07-investigation-note-skill.md
---

# 点の集まりに「隣」を入れる —— ボロノイ図とドロネー三角形分割

> [!NOTE]
> 執筆: Devin（SWE-2 Max）。図はすべて `tools/svg-gen` のジェネレータが実際の幾何を計算して描いたもの。

散らばった10個の点だけがあるとする。点そのものには順番もつながりもない。この「ただの点の集まり」に対して、誰が誰の隣なのかを自然に決める方法が2つある。領域で考えるボロノイ図と、辺で考えるドロネー三角形分割だ。

「隣」が欲しい場面は多い。標高点の間を補間する地形モデル、板や流体を小さな要素に割るメッシュ生成、そして点の集まりをそのまま絵に変換する生成系アート。どれも最初の一歩は、この点だけの集合から構造を引き出すところだ。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="25 25 170 170" width="170" height="170" role="img" aria-label="the shared input: ten points, no structure yet">
<circle cx="45" cy="60" r="3.5" fill="currentColor"/>
<circle cx="95" cy="35" r="3.5" fill="currentColor"/>
<circle cx="140" cy="70" r="3.5" fill="currentColor"/>
<circle cx="70" cy="115" r="3.5" fill="currentColor"/>
<circle cx="120" cy="130" r="3.5" fill="currentColor"/>
<circle cx="35" cy="145" r="3.5" fill="currentColor"/>
<circle cx="175" cy="45" r="3.5" fill="currentColor"/>
<circle cx="185" cy="115" r="3.5" fill="currentColor"/>
<circle cx="65" cy="185" r="3.5" fill="currentColor"/>
<circle cx="150" cy="175" r="3.5" fill="currentColor"/>
</svg>
```

この記事では垂直二等分線から始めて、2つの構造が同じものの表裏（双対）であるところまでを図で追う。以降の図はすべてこの10点を使い回し、凡例も記事全体で統一する。実線がドロネー側（三角形分割の辺）、破線がボロノイ側（セルの境界や二等分線）、太線は注目する要素、朱系のマークは「違反・ダメ」の印だ。

## 準備: 4つの道具

### 垂直二等分線

2点から等距離にある点の集まりは1本の直線になる。垂直二等分線だ。線の上ならどこへ動いても2点からの距離は等しい。

この直線は平面を2つの半分に割る。ある点側の半分（半平面という）は「もう一方の点よりその点に近い場所」の全体で、これがあとでボロノイ図のセルを組み立てる部品になる。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="60 0 120 180" width="120" height="180" role="img" aria-label="perpendicular bisector: locus of points equidistant from two sites">
<path d="M162.625 10 L74.625 170" fill="none" stroke="currentColor" stroke-width="2"/>
<circle cx="70" cy="60" r="4" fill="#3B82C4"/>
<circle cx="170" cy="115" r="4" fill="#E69F00"/>
<path d="M141.686343739747 48.07028410955088 L70 60" fill="none" stroke="#3B82C4" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.6"/>
<path d="M141.686343739747 48.07028410955088 L170 115" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.6"/>
<circle cx="141.686343739747" cy="48.07028410955088" r="2.5" fill="currentColor"/>
<path d="M93.49446876253143 135.6918749772156 L70 60" fill="none" stroke="#3B82C4" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.6"/>
<path d="M93.49446876253143 135.6918749772156 L170 115" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.6"/>
<circle cx="93.49446876253143" cy="135.6918749772156" r="2.5" fill="currentColor"/>
</svg>
```

### 外接円と外心

一直線に並ばない3点を通る円はただ1つある。2つの辺の垂直二等分線は必ず1点で交わり、その点は3点すべてから等距離にある。この点を外心、できる円を外接円という。あとで何度も出るので覚えておきたい道具だ。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 250 250" width="250" height="250" role="img" aria-label="three non-collinear sites: two bisectors meet at the circumcenter, one circle through all three">
<path d="M99.34210526315789 0 L75.13157894736842 230" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
<path d="M230 210.6521739130435 L0 60.652173913043484" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
<circle cx="86.98608137044968" cy="117.38222698072805" r="71.10239800536839" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="45" cy="60" r="4" fill="#3B82C4"/>
<path d="M45 60 L86.98608137044968 117.38222698072805" fill="none" stroke="#3B82C4" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.5"/>
<circle cx="140" cy="70" r="4" fill="#E69F00"/>
<path d="M140 70 L86.98608137044968 117.38222698072805" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.5"/>
<circle cx="65" cy="185" r="4" fill="#00A876"/>
<path d="M65 185 L86.98608137044968 117.38222698072805" fill="none" stroke="#00A876" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.5"/>
<circle cx="86.98608137044968" cy="117.38222698072805" r="3" fill="currentColor"/>
<text x="94.98608137044968" y="117.38222698072805" font-size="12" dominant-baseline="central" fill="currentColor">外心</text>
</svg>
```

### 凸包

点集合を全部含む最小の凸多角形。凸とは「内部のどの2点を結ぶ線分も外にはみ出さない」ことで、ゴム紐を外側から締めた形と思えばよい。三角形分割はこの内側全体を覆う。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="25 25 170 170" width="170" height="170" role="img" aria-label="convex hull: the boundary every triangulation must cover">
<path d="M35 145 L45 60" fill="none" stroke="#00A876" stroke-width="2"/>
<path d="M45 60 L95 35" fill="none" stroke="#00A876" stroke-width="2"/>
<path d="M95 35 L175 45" fill="none" stroke="#00A876" stroke-width="2"/>
<path d="M175 45 L185 115" fill="none" stroke="#00A876" stroke-width="2"/>
<path d="M185 115 L150 175" fill="none" stroke="#00A876" stroke-width="2"/>
<path d="M150 175 L65 185" fill="none" stroke="#00A876" stroke-width="2"/>
<path d="M65 185 L35 145" fill="none" stroke="#00A876" stroke-width="2"/>
<circle cx="45" cy="60" r="3.5" fill="currentColor"/>
<circle cx="95" cy="35" r="3.5" fill="currentColor"/>
<circle cx="140" cy="70" r="3.5" fill="currentColor"/>
<circle cx="70" cy="115" r="3.5" fill="currentColor"/>
<circle cx="120" cy="130" r="3.5" fill="currentColor"/>
<circle cx="35" cy="145" r="3.5" fill="currentColor"/>
<circle cx="175" cy="45" r="3.5" fill="currentColor"/>
<circle cx="185" cy="115" r="3.5" fill="currentColor"/>
<circle cx="65" cy="185" r="3.5" fill="currentColor"/>
<circle cx="150" cy="175" r="3.5" fill="currentColor"/>
</svg>
```

### 三角形分割

点を頂点とし、交差しない辺で凸包を三角形に埋め尽くしたもの。辺が途中で交わるのは認めない。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="25 25 472.19999999999993 212.4" width="472" height="212" role="img" aria-label="valid triangulation vs a chord that crosses existing edges">
<path d="M95 35 L45 60" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M45 60 L70 115" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M70 115 L95 35" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M140 70 L95 35" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M95 35 L70 115" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M70 115 L140 70" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M140 70 L70 115" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M70 115 L120 130" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M120 130 L140 70" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M70 115 L45 60" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M45 60 L35 145" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M35 145 L70 115" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M95 35 L140 70" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M140 70 L175 45" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M175 45 L95 35" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M140 70 L120 130" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M120 130 L185 115" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M185 115 L140 70" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M175 45 L140 70" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M140 70 L185 115" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M185 115 L175 45" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M120 130 L70 115" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M70 115 L65 185" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M65 185 L120 130" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M70 115 L35 145" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M35 145 L65 185" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M65 185 L70 115" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M185 115 L120 130" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M120 130 L150 175" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M150 175 L185 115" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M120 130 L65 185" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M65 185 L150 175" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M150 175 L120 130" fill="none" stroke="currentColor" stroke-width="1.2"/>
<circle cx="45" cy="60" r="3.5" fill="currentColor"/>
<circle cx="95" cy="35" r="3.5" fill="currentColor"/>
<circle cx="140" cy="70" r="3.5" fill="currentColor"/>
<circle cx="70" cy="115" r="3.5" fill="currentColor"/>
<circle cx="120" cy="130" r="3.5" fill="currentColor"/>
<circle cx="35" cy="145" r="3.5" fill="currentColor"/>
<circle cx="175" cy="45" r="3.5" fill="currentColor"/>
<circle cx="185" cy="115" r="3.5" fill="currentColor"/>
<circle cx="65" cy="185" r="3.5" fill="currentColor"/>
<circle cx="150" cy="175" r="3.5" fill="currentColor"/>
<text x="115" y="225" font-size="12" text-anchor="middle" fill="currentColor" opacity="0.7">a triangulation</text>
<path d="M355 35 L305 60" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M305 60 L330 115" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M330 115 L355 35" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M400 70 L355 35" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M355 35 L330 115" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M330 115 L400 70" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M400 70 L330 115" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M330 115 L380 130" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M380 130 L400 70" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M330 115 L305 60" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M305 60 L295 145" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M295 145 L330 115" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M355 35 L400 70" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M400 70 L435 45" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M435 45 L355 35" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M400 70 L380 130" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M380 130 L445 115" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M445 115 L400 70" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M435 45 L400 70" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M400 70 L445 115" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M445 115 L435 45" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M380 130 L330 115" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M330 115 L325 185" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M325 185 L380 130" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M330 115 L295 145" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M295 145 L325 185" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M325 185 L330 115" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M445 115 L380 130" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M380 130 L410 175" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M410 175 L445 115" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M380 130 L325 185" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M325 185 L410 175" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M410 175 L380 130" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>
<path d="M305 60 L380 130" fill="none" stroke="#D55E00" stroke-width="2.5"/>
<circle cx="342.5" cy="75" r="4" fill="none" stroke="#D55E00" stroke-width="2"/>
<circle cx="365" cy="92.5" r="4" fill="none" stroke="#D55E00" stroke-width="2"/>
<circle cx="305" cy="60" r="3.5" fill="currentColor"/>
<circle cx="355" cy="35" r="3.5" fill="currentColor"/>
<circle cx="400" cy="70" r="3.5" fill="currentColor"/>
<circle cx="330" cy="115" r="3.5" fill="currentColor"/>
<circle cx="380" cy="130" r="3.5" fill="currentColor"/>
<circle cx="295" cy="145" r="3.5" fill="currentColor"/>
<circle cx="435" cy="45" r="3.5" fill="currentColor"/>
<circle cx="445" cy="115" r="3.5" fill="currentColor"/>
<circle cx="325" cy="185" r="3.5" fill="currentColor"/>
<circle cx="410" cy="175" r="3.5" fill="currentColor"/>
<text x="375" y="225" font-size="12" text-anchor="middle" fill="currentColor" opacity="0.7">crossing edge: not a triangulation</text>
</svg>
```

ついでに1つ仮定を置く。以降の話では点群が「一般位置」にある、すなわち3点が同一直線上にない・4点が同一円周上にないとする。これが崩れると話が分岐するのだが、詳しくは後半の退化の節に回す。

## ボロノイ図: 一番近い点で割り分ける

各サイト（母点）に対して「そのサイトが一番近い領域」を割り当てたものがボロノイ図だ。「サイト s に一番近い」領域は、他のサイト t それぞれについて「t より s に近い半平面」を全部掛け合わせたものになる。境界は垂直二等分線なので、セルは半平面の交わりとして切り取られていく。凸な形同士の交わりは凸なので、セルは必ず凸だ。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 235 252.4" width="235" height="252" role="img" aria-label="one Voronoi cell: intersection of the near half-planes cut by bisectors to the site's neighbors">
<path d="M10 109.0909090909091 L225 11.36363636363636" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.55"/>
<circle cx="45" cy="60" r="3.5" fill="currentColor"/>
<path d="M10 52.34375 L225 119.53125" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.55"/>
<circle cx="95" cy="35" r="3.5" fill="currentColor"/>
<path d="M51.964285714285715 10 L186.96428571428572 220" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.55"/>
<circle cx="140" cy="70" r="3.5" fill="currentColor"/>
<path d="M128.75 10 L65.75 220" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.55"/>
<circle cx="120" cy="130" r="3.5" fill="currentColor"/>
<path d="M129.64285714285717 220 L10 80.41666666666666" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.55"/>
<circle cx="35" cy="145" r="3.5" fill="currentColor"/>
<path d="M225 161.25 L10 145.89285714285714" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.55"/>
<circle cx="65" cy="185" r="3.5" fill="currentColor"/>
<circle cx="175" cy="45" r="3.5" fill="currentColor" fill-opacity="0.3"/>
<circle cx="185" cy="115" r="3.5" fill="currentColor" fill-opacity="0.3"/>
<circle cx="150" cy="175" r="3.5" fill="currentColor" fill-opacity="0.3"/>
<polygon points="69.8,150.2 27.7,101.1 84,75.5 96.6,79.4 104.3,91.4 86.3,151.3" fill="#00A876" fill-opacity="0.18" stroke="#00A876" stroke-width="2"/>
<circle cx="70" cy="115" r="4" fill="#00A876"/>
<text x="115" y="240" font-size="12" text-anchor="middle" fill="currentColor" opacity="0.7">cell = half-planes kept</text>
</svg>
```

全体を描くとこうなる。内部のサイトのセルは有界な凸多角形、凸包の上に乗ったサイトのセルは無限に伸びる。外側には対になるサイトがいないので、境界が閉じないのだ。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 250 250" width="250" height="250" role="img" aria-label="the Voronoi diagram: every point of the plane assigned to its nearest site">
<path d="M83.98148148148148 75.46296296296296 L46.25 0" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3"/>
<path d="M83.98148148148148 75.46296296296296 L27.686915887850468 101.05140186915888" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3"/>
<path d="M83.98148148148148 75.46296296296296 L96.57821229050279 79.39944134078212" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3"/>
<path d="M96.57821229050279 79.39944134078212 L136.48936170212767 28.085106382978722" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3"/>
<path d="M96.57821229050279 79.39944134078212 L104.31818181818181 91.43939393939394" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3"/>
<path d="M104.31818181818181 91.43939393939394 L86.34615384615384 151.34615384615384" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3"/>
<path d="M104.31818181818181 91.43939393939394 L148.75 106.25" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3"/>
<path d="M27.686915887850468 101.05140186915888 L0 97.79411764705883" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3"/>
<path d="M27.686915887850468 101.05140186915888 L69.78260869565217 150.16304347826087" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3"/>
<path d="M136.48936170212767 28.085106382978722 L174.16666666666666 80.83333333333333" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3"/>
<path d="M136.48936170212767 28.085106382978722 L140 0" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3"/>
<path d="M148.75 106.25 L156.16666666666666 138.38888888888889" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3"/>
<path d="M148.75 106.25 L174.16666666666666 80.83333333333333" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3"/>
<path d="M174.16666666666666 80.83333333333333 L230 72.85714285714285" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3"/>
<path d="M86.34615384615384 151.34615384615384 L69.78260869565217 150.16304347826087" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3"/>
<path d="M86.34615384615384 151.34615384615384 L106.5 171.5" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3"/>
<path d="M69.78260869565217 150.16304347826087 L0 202.5" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3"/>
<path d="M156.16666666666666 138.38888888888889 L106.5 171.5" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3"/>
<path d="M156.16666666666666 138.38888888888889 L230 181.45833333333334" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3"/>
<path d="M106.5 171.5 L113.38235294117646 230" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3"/>
<polygon points="69.8,150.2 27.7,101.1 84,75.5 96.6,79.4 104.3,91.4 86.3,151.3" fill="#E69F00" fill-opacity="0.12"/>
<circle cx="45" cy="60" r="3.5" fill="currentColor"/>
<circle cx="95" cy="35" r="3.5" fill="currentColor"/>
<circle cx="140" cy="70" r="3.5" fill="currentColor"/>
<circle cx="70" cy="115" r="3.5" fill="currentColor"/>
<circle cx="120" cy="130" r="3.5" fill="currentColor"/>
<circle cx="35" cy="145" r="3.5" fill="currentColor"/>
<circle cx="175" cy="45" r="3.5" fill="currentColor"/>
<circle cx="185" cy="115" r="3.5" fill="currentColor"/>
<circle cx="65" cy="185" r="3.5" fill="currentColor"/>
<circle cx="150" cy="175" r="3.5" fill="currentColor"/>
</svg>
```

ここで重要な観察。セルの角（ボロノイ頂点）は3つのセルが接する点で、3サイトから等距離にある。つまり3サイトの外接円の中心だ。しかもその円の中に他のサイトは入らない。入っていたらそのサイトの方が近いので、この点は3サイトのセルの接点にはなりえない。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -23.976549411636626 250 263.9765494116366" width="250" height="264" role="img" aria-label="a Voronoi vertex sits at the circumcenter of its three sites; the circle contains no other site">
<path d="M83.98148148148148 75.46296296296296 L46.25 0" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
<path d="M83.98148148148148 75.46296296296296 L27.686915887850468 101.05140186915888" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
<path d="M83.98148148148148 75.46296296296296 L96.57821229050279 79.39944134078212" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
<path d="M96.57821229050279 79.39944134078212 L136.48936170212767 28.085106382978722" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
<path d="M96.57821229050279 79.39944134078212 L104.31818181818181 91.43939393939394" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
<path d="M104.31818181818181 91.43939393939394 L86.34615384615384 151.34615384615384" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
<path d="M104.31818181818181 91.43939393939394 L148.75 106.25" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
<path d="M27.686915887850468 101.05140186915888 L0 97.79411764705883" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
<path d="M27.686915887850468 101.05140186915888 L69.78260869565217 150.16304347826087" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
<path d="M136.48936170212767 28.085106382978722 L174.16666666666666 80.83333333333333" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
<path d="M136.48936170212767 28.085106382978722 L140 0" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
<path d="M148.75 106.25 L156.16666666666666 138.38888888888889" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
<path d="M148.75 106.25 L174.16666666666666 80.83333333333333" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
<path d="M174.16666666666666 80.83333333333333 L230 72.85714285714285" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
<path d="M86.34615384615384 151.34615384615384 L69.78260869565217 150.16304347826087" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
<path d="M86.34615384615384 151.34615384615384 L106.5 171.5" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
<path d="M69.78260869565217 150.16304347826087 L0 202.5" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
<path d="M156.16666666666666 138.38888888888889 L106.5 171.5" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
<path d="M156.16666666666666 138.38888888888889 L230 181.45833333333334" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
<path d="M106.5 171.5 L113.38235294117646 230" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
<circle cx="136.48936170212767" cy="28.085106382978722" r="42.06165579461535" fill="none" stroke="currentColor" stroke-width="1.5"/>
<circle cx="95" cy="35" r="4" fill="#3B82C4"/>
<path d="M95 35 L136.48936170212767 28.085106382978722" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.5"/>
<circle cx="140" cy="70" r="4" fill="#3B82C4"/>
<path d="M140 70 L136.48936170212767 28.085106382978722" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.5"/>
<circle cx="175" cy="45" r="4" fill="#3B82C4"/>
<path d="M175 45 L136.48936170212767 28.085106382978722" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.5"/>
<circle cx="45" cy="60" r="3.5" fill="currentColor"/>
<circle cx="70" cy="115" r="3.5" fill="currentColor"/>
<circle cx="120" cy="130" r="3.5" fill="currentColor"/>
<circle cx="35" cy="145" r="3.5" fill="currentColor"/>
<circle cx="185" cy="115" r="3.5" fill="currentColor"/>
<circle cx="65" cy="185" r="3.5" fill="currentColor"/>
<circle cx="150" cy="175" r="3.5" fill="currentColor"/>
<circle cx="136.48936170212767" cy="28.085106382978722" r="3" fill="currentColor"/>
</svg>
```

## ドロネー三角形分割: 双対を取る

ボロノイ図ができたら、隣り合うセルの持ち主同士を全部結ぶ。それがドロネー三角形分割で、ボロノイ図の双対グラフになる。「双対」は役割の取り換えのことで、ボロノイ側のセル（領域）がドロネー側の頂点（サイト）に、セル同士の共有辺がドロネーの辺に、3セルの接点がドロネーの三角形に対応する。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-5.07160059419348 -23.976549411636626 319.554728849371 336.8454670677303" width="320" height="337" role="img" aria-label="Delaunay triangulation (solid) and its dual Voronoi diagram (dashed); one empty circumcircle shown">
<path d="M83.98148148148148 75.46296296296296 L68.18801525045743 43.87603050091485" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.8"/>
<path d="M83.98148148148148 75.46296296296296 L27.686915887850468 101.05140186915888" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.8"/>
<path d="M83.98148148148148 75.46296296296296 L96.57821229050279 79.39944134078212" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.8"/>
<path d="M96.57821229050279 79.39944134078212 L136.48936170212767 28.085106382978722" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.8"/>
<path d="M96.57821229050279 79.39944134078212 L104.31818181818181 91.43939393939394" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.8"/>
<path d="M104.31818181818181 91.43939393939394 L86.34615384615384 151.34615384615384" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.8"/>
<path d="M104.31818181818181 91.43939393939394 L148.75 106.25" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.8"/>
<path d="M27.686915887850468 101.05140186915888 L4.92839940580652 98.3739293418596" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.8"/>
<path d="M27.686915887850468 101.05140186915888 L69.78260869565217 150.16304347826087" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.8"/>
<path d="M136.48936170212767 28.085106382978722 L174.16666666666666 80.83333333333333" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.8"/>
<path d="M136.48936170212767 28.085106382978722 L139.34018205336253 5.278543573099853" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.8"/>
<path d="M148.75 106.25 L156.16666666666666 138.38888888888889" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.8"/>
<path d="M148.75 106.25 L174.16666666666666 80.83333333333333" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.8"/>
<path d="M174.16666666666666 80.83333333333333 L304.4831282551775 62.216695963546066" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.8"/>
<path d="M86.34615384615384 151.34615384615384 L69.78260869565217 150.16304347826087" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.8"/>
<path d="M86.34615384615384 151.34615384615384 L106.5 171.5" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.8"/>
<path d="M69.78260869565217 150.16304347826087 L37.563347180616006 174.327489614538" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.8"/>
<path d="M156.16666666666666 138.38888888888889 L106.5 171.5" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.8"/>
<path d="M156.16666666666666 138.38888888888889 L284.94144663812153 213.5075105389042" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.8"/>
<path d="M106.5 171.5 L121.95516678306984 302.8689176560937" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.8"/>
<path d="M95 35 L45 60" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M45 60 L70 115" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M70 115 L95 35" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M140 70 L95 35" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M95 35 L70 115" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M70 115 L140 70" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M140 70 L70 115" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M70 115 L120 130" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M120 130 L140 70" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M70 115 L45 60" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M45 60 L35 145" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M35 145 L70 115" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M95 35 L140 70" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M140 70 L175 45" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M175 45 L95 35" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M140 70 L120 130" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M120 130 L185 115" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M185 115 L140 70" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M175 45 L140 70" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M140 70 L185 115" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M185 115 L175 45" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M120 130 L70 115" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M70 115 L65 185" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M65 185 L120 130" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M70 115 L35 145" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M35 145 L65 185" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M65 185 L70 115" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M185 115 L120 130" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M120 130 L150 175" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M150 175 L185 115" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M120 130 L65 185" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M65 185 L150 175" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<path d="M150 175 L120 130" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<circle cx="136.48936170212767" cy="28.085106382978722" r="42.06165579461535" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.45"/>
<circle cx="136.48936170212767" cy="28.085106382978722" r="2.5" fill="currentColor"/>
<circle cx="45" cy="60" r="3" fill="currentColor"/>
<circle cx="95" cy="35" r="3" fill="currentColor"/>
<circle cx="140" cy="70" r="3" fill="currentColor"/>
<circle cx="70" cy="115" r="3" fill="currentColor"/>
<circle cx="120" cy="130" r="3" fill="currentColor"/>
<circle cx="35" cy="145" r="3" fill="currentColor"/>
<circle cx="175" cy="45" r="3" fill="currentColor"/>
<circle cx="185" cy="115" r="3" fill="currentColor"/>
<circle cx="65" cy="185" r="3" fill="currentColor"/>
<circle cx="150" cy="175" r="3" fill="currentColor"/>
</svg>
```

この三角形分割には3つの顔がある。

- いまの定義（ボロノイ図の双対）
- 空円性: 各三角形の外接円の内部に、他のサイトを含まない
- 最小角の最大化: 全部の角を小さい順に並べた角度ベクトルを辞書式に最大化する

空円性が双対と一致するのは、さっきの観察の裏返しだ。セルが接する ⟺ その3サイトを通る空の円がある ⟺ 対応する三角形ができる。逆に言うと、外接円にサイトが入ってしまう分割はドロネーではない。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="25 23.526593042748743 454.0999999999999 203.87340695725126" width="454" height="204" role="img" aria-label="empty circumcircle: every Delaunay triangle's circumcircle contains no other site (left); the other diagonal puts a site inside (right)">
<path d="M45 60 L95 35" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M95 35 L70 115" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M70 115 L35 145" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M35 145 L45 60" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M45 60 L70 115" fill="none" stroke="#3B82C4" stroke-width="1.2"/>
<circle cx="83.98148148148148" cy="75.46296296296296" r="41.93636992021422" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
<circle cx="45" cy="60" r="3.5" fill="currentColor"/>
<circle cx="95" cy="35" r="3.5" fill="currentColor"/>
<circle cx="70" cy="115" r="3.5" fill="currentColor"/>
<circle cx="35" cy="145" r="3.5" fill="currentColor"/>
<text x="120" y="215" font-size="12" text-anchor="middle" fill="currentColor" opacity="0.7">empty circle</text>
<path d="M305 60 L355 35" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M355 35 L330 115" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M330 115 L295 145" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M295 145 L305 60" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M355 35 L295 145" fill="none" stroke="#D55E00" stroke-width="2"/>
<circle cx="361.09375" cy="109.6875" r="74.93568205676452" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="5 3"/>
<circle cx="305" cy="60" r="3.5" fill="currentColor"/>
<circle cx="355" cy="35" r="3.5" fill="currentColor"/>
<circle cx="295" cy="145" r="3.5" fill="currentColor"/>
<circle cx="330" cy="115" r="3.5" fill="#D55E00"/>
<text x="380" y="215" font-size="12" text-anchor="middle" fill="currentColor" opacity="0.7">a site inside: not Delaunay</text>
</svg>
```

3つ目の顔は最適性。全部の三角形の角を集めて小さい順に並べた列を角度ベクトルという。2つの分割を比べるときは、先頭（最小角）が大きい方が勝ちで、同じなら次の角同士を見る、という辞書式の比較をする。ドロネーは、同じ点集合の全三角形分割の中でこの順序の最適解になる。特に最小角が最大になるので「細長い三角形が避けられる」とよく言われるが、あくまで同じ点集合の中での最適なので、点の配置が強制する細さは消えないことに注意したい。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="25 25 430 202.2" width="430" height="202" role="img" aria-label="Delaunay maximizes the minimum angle; the other diagonal leaves a smaller one">
<path d="M45 60 L95 35" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M95 35 L70 115" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M70 115 L45 60" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M45 60 L70 115" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M70 115 L35 145" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M35 145 L45 60" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M54.1 80.0 L53.4 80.3 L52.7 80.6 L52.0 80.9 L51.3 81.1 L50.6 81.3 L49.9 81.5 L49.1 81.6 L48.4 81.7 L47.7 81.8 L46.9 81.9 L46.2 82.0 L45.4 82.0 L44.7 82.0 L43.9 82.0 L43.2 81.9 L42.4 81.8" fill="none" stroke="#D55E00" stroke-width="2.5"/>
<text x="50.549124738172395" y="95.56975139975262" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">31°</text>
<circle cx="45" cy="60" r="3.5" fill="currentColor"/>
<circle cx="95" cy="35" r="3.5" fill="currentColor"/>
<circle cx="140" cy="70" r="3.5" fill="currentColor"/>
<circle cx="70" cy="115" r="3.5" fill="currentColor"/>
<circle cx="120" cy="130" r="3.5" fill="currentColor"/>
<circle cx="35" cy="145" r="3.5" fill="currentColor"/>
<circle cx="175" cy="45" r="3.5" fill="currentColor"/>
<circle cx="185" cy="115" r="3.5" fill="currentColor"/>
<circle cx="65" cy="185" r="3.5" fill="currentColor"/>
<circle cx="150" cy="175" r="3.5" fill="currentColor"/>
<text x="112" y="215" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.7">Delaunay</text>
<path d="M305 60 L355 35" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M355 35 L295 145" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M295 145 L305 60" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M355 35 L330 115" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M330 115 L295 145" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M295 145 L355 35" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M348.4 56.0 L348.2 55.9 L347.9 55.8 L347.7 55.7 L347.4 55.7 L347.2 55.6 L346.9 55.5 L346.7 55.4 L346.4 55.3 L346.2 55.1 L345.9 55.0 L345.7 54.9 L345.4 54.8 L345.2 54.7 L344.9 54.6 L344.7 54.4 L344.5 54.3" fill="none" stroke="#D55E00" stroke-width="2.5"/>
<text x="340.9439506614411" y="68.1425327485996" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">11°</text>
<circle cx="305" cy="60" r="3.5" fill="currentColor"/>
<circle cx="355" cy="35" r="3.5" fill="currentColor"/>
<circle cx="400" cy="70" r="3.5" fill="currentColor"/>
<circle cx="330" cy="115" r="3.5" fill="currentColor"/>
<circle cx="380" cy="130" r="3.5" fill="currentColor"/>
<circle cx="295" cy="145" r="3.5" fill="currentColor"/>
<circle cx="435" cy="45" r="3.5" fill="currentColor"/>
<circle cx="445" cy="115" r="3.5" fill="currentColor"/>
<circle cx="325" cy="185" r="3.5" fill="currentColor"/>
<circle cx="410" cy="175" r="3.5" fill="currentColor"/>
<text x="372" y="215" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.7">other diagonal</text>
</svg>
```

個数も公式で決まる。n 個の点のうち凸包上にあるものを h 個とすると、どんな三角形分割でも同じ数になる。平面グラフの Euler の公式（頂点−辺+面=2）に「内側の面は全部三角形」という条件を入れると出る式だ。

| 量 | 式 | この10点の場合 |
| --- | --- | --- |
| 三角形の数 | 2n − 2 − h | 11 |
| 辺の数 | 3n − 3 − h | 20 |

修復の仕組みもシンプルだ。外接円にサイトが入ってしまう「違法」な辺は、両側の三角形が作る四角形の対角線を入れ替えるだけで直せる。この操作をエッジフリップと呼ぶ。そして「全ての内部辺が局所的に空円条件を満たせば、全体がドロネー」という Delaunay の補題がある。違法な辺をフリップすると必ず角度ベクトルが改善し、改善は有限回で止まるので、止まったときには違法な辺が残っていない。つまりどんな三角形分割からでも、フリップの連鎖でドロネーに辿り着く。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="16.15806794323548 23.52659304274875 431.3419320567645 203.67340695725125" width="431" height="204" role="img" aria-label="edge flip: an illegal diagonal (site inside the circumcircle) is swapped for the Delaunay one">
<path d="M45 60 L95 35" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M95 35 L70 115" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M70 115 L35 145" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M35 145 L45 60" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M95 35 L35 145" fill="none" stroke="#D55E00" stroke-width="2.5"/>
<circle cx="101.09375" cy="109.6875" r="74.93568205676452" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="5 3" opacity="0.8"/>
<circle cx="45" cy="60" r="3.5" fill="currentColor"/>
<circle cx="95" cy="35" r="3.5" fill="currentColor"/>
<circle cx="70" cy="115" r="3.5" fill="currentColor"/>
<circle cx="35" cy="145" r="3.5" fill="currentColor"/>
<text x="112" y="215" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.7">illegal: site inside</text>
<path d="M243 105 L255 105" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M246 109.05 L255 105 L246 100.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M310 60 L360 35" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M360 35 L335 115" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M335 115 L300 145" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M300 145 L310 60" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M310 60 L335 115" fill="none" stroke="#3B82C4" stroke-width="2.5"/>
<circle cx="348.98148148148147" cy="75.46296296296296" r="41.93636992021421" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
<circle cx="292.6869158878505" cy="101.05140186915888" r="44.552895269528165" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
<circle cx="310" cy="60" r="3.5" fill="currentColor"/>
<circle cx="360" cy="35" r="3.5" fill="currentColor"/>
<circle cx="335" cy="115" r="3.5" fill="currentColor"/>
<circle cx="300" cy="145" r="3.5" fill="currentColor"/>
<text x="377" y="215" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.7">legal: circles empty</text>
</svg>
```

## 双対の細部と退化

ドロネー辺の正確な特徴づけを確認しておこう。辺 pq がドロネーなのは「p, q を通る空円が存在する」ときで、「両端点を直径とする円が空」ではない。後者はより強い条件で、その辺は Gabriel 辺と呼ばれる別物だ（Gabriel ならドロネーだが、逆は成り立たない）。最小の反例は鈍角三角形1枚: 最長辺は外接円が空なのでドロネーだが、直径円は向かいの鈍角頂点を含む。円周角の定理で、直径を見込む角は円周上ならちょうど90°、円の内側からだと鈍角になる。だから鈍角の対辺は Gabriel になれない。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="33.849999999999994 50.9556876849735 177.3 180.088624630053" width="177" height="180" role="img" aria-label="longest edge of an obtuse triangle: its circumcircle is empty (Delaunay) but its diameter circle holds the third vertex (not Gabriel)">
<path d="M55 130 L190 130" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M190 130 L125 80" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M125 80 L55 130" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M55 130 L190 130" fill="none" stroke="#3B82C4" stroke-width="3"/>
<circle cx="122.5" cy="150.5" r="70.5443123150265" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
<circle cx="122.5" cy="130" r="67.5" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="5 3"/>
<circle cx="55" cy="130" r="4" fill="currentColor"/>
<circle cx="190" cy="130" r="4" fill="currentColor"/>
<circle cx="125" cy="80" r="4" fill="#D55E00"/>
<text x="122.5" y="211.5" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.7">diameter circle contains r</text>
<text x="122.5" y="71.9556876849735" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.7">circumcircle: empty</text>
</svg>
```

ドロネー辺とその双対ボロノイ辺は互いに垂直だが、線分としては交わらないこともある。上の例がまさにそうで、ボロノイ側の辺は鈍角三角形の外側に飛び出してしまう。

退化の話。4点が同一円周上にあるとドロネーは一意でない。どちらの対角線を取っても外接円は同じ大きな円（=空）なので、どちらも合法だ。対応するボロノイ頂点は3つではなく4つのセルが接する点になる。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="27 17 436 210.2" width="436" height="210" role="img" aria-label="four cocircular sites: both diagonals give legal Delaunay triangulations">
<circle cx="115" cy="105" r="78" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.45"/>
<path d="M191.81500473495223 118.54455785802057 L101.45544214197943 181.81500473495223" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M101.45544214197943 181.81500473495223 L39.65778554945267 84.81211448200341" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M39.65778554945267 84.81211448200341 L135.18788551799665 29.657785549452683" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M135.18788551799665 29.657785549452683 L191.81500473495223 118.54455785802057" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M191.81500473495223 118.54455785802057 L39.65778554945267 84.81211448200341" fill="none" stroke="#3B82C4" stroke-width="2.5"/>
<circle cx="191.81500473495223" cy="118.54455785802057" r="3.5" fill="currentColor"/>
<circle cx="101.45544214197943" cy="181.81500473495223" r="3.5" fill="currentColor"/>
<circle cx="39.65778554945267" cy="84.81211448200341" r="3.5" fill="currentColor"/>
<circle cx="135.18788551799665" cy="29.657785549452683" r="3.5" fill="currentColor"/>
<circle cx="375" cy="105" r="78" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.45"/>
<path d="M451.81500473495225 118.54455785802057 L361.45544214197946 181.81500473495223" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M361.45544214197946 181.81500473495223 L299.6577855494527 84.81211448200341" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M299.6577855494527 84.81211448200341 L395.1878855179966 29.657785549452683" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M395.1878855179966 29.657785549452683 L451.81500473495225 118.54455785802057" fill="none" stroke="currentColor" stroke-width="1.2"/>
<path d="M361.45544214197946 181.81500473495223 L395.1878855179966 29.657785549452683" fill="none" stroke="#3B82C4" stroke-width="2.5"/>
<circle cx="451.81500473495225" cy="118.54455785802057" r="3.5" fill="currentColor"/>
<circle cx="361.45544214197946" cy="181.81500473495223" r="3.5" fill="currentColor"/>
<circle cx="299.6577855494527" cy="84.81211448200341" r="3.5" fill="currentColor"/>
<circle cx="395.1878855179966" cy="29.657785549452683" r="3.5" fill="currentColor"/>
<circle cx="115" cy="105" r="3.5" fill="#D55E00"/>
<circle cx="375" cy="105" r="3.5" fill="#D55E00"/>
<text x="115" y="215" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.7">diagonal A</text>
<text x="375" y="215" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.7">diagonal B</text>
</svg>
```

ほかにも3点以上の共線や重複点が退化になる。実装上は記号摂動（点を無限小だけずらしたと仮想的に思うことで退化を消す技法）で扱うか、非一意であることを受け入れて任意に決める。あと「点 d が三角形の外接円に入るか」という円内判定は、座標から組める行列式の符号1つで書けるのだが、浮動小数点だと共円に近い入力で符号を取り違えるので、まともな実装では厳密な述語を使うのが定石だ。

## 作り方

中心となる操作はさっきのフリップだが、全体を一気に作る方法もいくつかある。概観だけ。

逐次添加（Bowyer–Watson）は実装が素直でよく使われる。新しい点を1つ入れ、その点を内包する外接円を持つ三角形を全部消し、残った穴（cavity）の境界を新しい点に縫い付ける。上の図のジェネレータ自体、このアルゴリズムを数十行で書いたものが動いている。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="25 25 430 205.2" width="430" height="205" role="img" aria-label="Bowyer-Watson step: remove triangles whose circumcircle contains the new point, then stitch the cavity to it">
<path d="M95 35 L45 60" fill="none" stroke="currentColor" stroke-width="1" opacity="0.35"/>
<path d="M45 60 L120 130" fill="none" stroke="currentColor" stroke-width="1" opacity="0.35"/>
<path d="M120 130 L95 35" fill="none" stroke="currentColor" stroke-width="1" opacity="0.35"/>
<path d="M140 70 L95 35" fill="none" stroke="currentColor" stroke-width="1" opacity="0.35"/>
<path d="M95 35 L120 130" fill="none" stroke="currentColor" stroke-width="1" opacity="0.35"/>
<path d="M120 130 L140 70" fill="none" stroke="currentColor" stroke-width="1" opacity="0.35"/>
<path d="M120 130 L45 60" fill="none" stroke="currentColor" stroke-width="1" opacity="0.35"/>
<path d="M45 60 L35 145" fill="none" stroke="currentColor" stroke-width="1" opacity="0.35"/>
<path d="M35 145 L120 130" fill="none" stroke="currentColor" stroke-width="1" opacity="0.35"/>
<path d="M95 35 L140 70" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M140 70 L175 45" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M175 45 L95 35" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M140 70 L120 130" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M120 130 L185 115" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M185 115 L140 70" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M175 45 L140 70" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M140 70 L185 115" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M185 115 L175 45" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M120 130 L35 145" fill="none" stroke="currentColor" stroke-width="1" opacity="0.35"/>
<path d="M35 145 L65 185" fill="none" stroke="currentColor" stroke-width="1" opacity="0.35"/>
<path d="M65 185 L120 130" fill="none" stroke="currentColor" stroke-width="1" opacity="0.35"/>
<path d="M185 115 L120 130" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M120 130 L150 175" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M150 175 L185 115" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M120 130 L65 185" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M65 185 L150 175" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M150 175 L120 130" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<polygon points="95,35 45,60 120,130" fill="#D55E00" fill-opacity="0.15"/>
<polygon points="140,70 95,35 120,130" fill="#D55E00" fill-opacity="0.15"/>
<polygon points="120,130 45,60 35,145" fill="#D55E00" fill-opacity="0.15"/>
<polygon points="120,130 35,145 65,185" fill="#D55E00" fill-opacity="0.15"/>
<path d="M95 35 L45 60" fill="none" stroke="#3B82C4" stroke-width="2.5"/>
<path d="M140 70 L95 35" fill="none" stroke="#3B82C4" stroke-width="2.5"/>
<path d="M120 130 L140 70" fill="none" stroke="#3B82C4" stroke-width="2.5"/>
<path d="M45 60 L35 145" fill="none" stroke="#3B82C4" stroke-width="2.5"/>
<path d="M35 145 L65 185" fill="none" stroke="#3B82C4" stroke-width="2.5"/>
<path d="M65 185 L120 130" fill="none" stroke="#3B82C4" stroke-width="2.5"/>
<circle cx="45" cy="60" r="3.5" fill="currentColor"/>
<circle cx="95" cy="35" r="3.5" fill="currentColor"/>
<circle cx="140" cy="70" r="3.5" fill="currentColor"/>
<circle cx="120" cy="130" r="3.5" fill="currentColor"/>
<circle cx="35" cy="145" r="3.5" fill="currentColor"/>
<circle cx="175" cy="45" r="3.5" fill="currentColor"/>
<circle cx="185" cy="115" r="3.5" fill="currentColor"/>
<circle cx="65" cy="185" r="3.5" fill="currentColor"/>
<circle cx="150" cy="175" r="3.5" fill="currentColor"/>
<circle cx="70" cy="115" r="3.5" fill="#D55E00"/>
<text x="115" y="218" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.7">point falls in cavity</text>
<path d="M355 35 L400 70" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M400 70 L435 45" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M435 45 L355 35" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M400 70 L380 130" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M380 130 L445 115" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M445 115 L400 70" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M435 45 L400 70" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M400 70 L445 115" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M445 115 L435 45" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M445 115 L380 130" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M380 130 L410 175" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M410 175 L445 115" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M380 130 L325 185" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M325 185 L410 175" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M410 175 L380 130" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
<path d="M355 35 L305 60" fill="none" stroke="#3B82C4" stroke-width="2.5"/>
<path d="M355 35 L330 115" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M305 60 L330 115" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M400 70 L355 35" fill="none" stroke="#3B82C4" stroke-width="2.5"/>
<path d="M400 70 L330 115" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M355 35 L330 115" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M380 130 L400 70" fill="none" stroke="#3B82C4" stroke-width="2.5"/>
<path d="M380 130 L330 115" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M400 70 L330 115" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M305 60 L295 145" fill="none" stroke="#3B82C4" stroke-width="2.5"/>
<path d="M305 60 L330 115" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M295 145 L330 115" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M295 145 L325 185" fill="none" stroke="#3B82C4" stroke-width="2.5"/>
<path d="M295 145 L330 115" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M325 185 L330 115" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M325 185 L380 130" fill="none" stroke="#3B82C4" stroke-width="2.5"/>
<path d="M325 185 L330 115" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M380 130 L330 115" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<circle cx="305" cy="60" r="3.5" fill="currentColor"/>
<circle cx="355" cy="35" r="3.5" fill="currentColor"/>
<circle cx="400" cy="70" r="3.5" fill="currentColor"/>
<circle cx="380" cy="130" r="3.5" fill="currentColor"/>
<circle cx="295" cy="145" r="3.5" fill="currentColor"/>
<circle cx="435" cy="45" r="3.5" fill="currentColor"/>
<circle cx="445" cy="115" r="3.5" fill="currentColor"/>
<circle cx="325" cy="185" r="3.5" fill="currentColor"/>
<circle cx="410" cy="175" r="3.5" fill="currentColor"/>
<circle cx="330" cy="115" r="3.5" fill="#D55E00"/>
<text x="375" y="218" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.7">retriangulated</text>
</svg>
```

掃引線（Fortune）はボロノイ図を直接作る。放物線は「1点（焦点）と1直線（準線）から等距離にある点の集まり」なので、焦点=サイト・準線=掃引線として立てた放物線の上の点は、サイトと掃引線のちょうど真ん中にいる。サイトごとにこの放物線を立てると、それらの山なりの天辺（beach line）が掃引線の進行とともにボロノイ辺を吐いていく。放物線同士が交差する位置がちょうどボロノイ頂点だ。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -18.029779411764707 250 228.0297794117647" width="250" height="228" role="img" aria-label="Fortune's sweep: site parabolas (dashed), their top envelope is the beach line (thick), breakpoints trace Voronoi edges">
<path d="M0.0 122.8 L1.4 123.2 L2.9 123.7 L4.3 124.1 L5.8 124.5 L7.2 124.9 L8.6 125.3 L10.1 125.6 L11.5 126.0 L12.9 126.3 L14.4 126.7 L15.8 127.0 L17.3 127.2 L18.7 127.5 L20.1 127.8 L21.6 128.0 L23.0 128.3 L24.4 128.5 L25.9 128.7 L27.3 128.9 L28.8 129.1 L30.2 129.2 L31.6 129.4 L33.1 129.5 L34.5 129.6 L35.9 129.7 L37.4 129.8 L38.8 129.9 L40.3 129.9 L41.7 130.0 L43.1 130.0 L44.6 130.0 L46.0 130.0 L47.4 130.0 L48.9 129.9 L50.3 129.9 L51.8 129.8 L53.2 129.8 L54.6 129.7 L56.1 129.6 L57.5 129.4 L58.9 129.3 L60.4 129.2 L61.8 129.0 L63.3 128.8 L64.7 128.6 L66.1 128.4 L67.6 128.2 L69.0 127.9 L70.4 127.7 L71.9 127.4 L73.3 127.1 L74.8 126.8 L76.2 126.5 L77.6 126.2 L79.1 125.9 L80.5 125.5 L81.9 125.1 L83.4 124.7 L84.8 124.3 L86.3 123.9 L87.7 123.5 L89.1 123.0 L90.6 122.6 L92.0 122.1 L93.4 121.6 L94.9 121.1 L96.3 120.6 L97.8 120.1 L99.2 119.5 L100.6 118.9 L102.1 118.4 L103.5 117.8 L104.9 117.2 L106.4 116.5 L107.8 115.9 L109.3 115.3 L110.7 114.6 L112.1 113.9 L113.6 113.2 L115.0 112.5 L116.4 111.8 L117.9 111.0 L119.3 110.3 L120.8 109.5 L122.2 108.7 L123.6 107.9 L125.1 107.1 L126.5 106.3 L127.9 105.4 L129.4 104.6 L130.8 103.7 L132.3 102.8 L133.7 101.9 L135.1 101.0 L136.6 100.1 L138.0 99.1 L139.4 98.1 L140.9 97.2 L142.3 96.2 L143.8 95.2 L145.2 94.2 L146.6 93.1 L148.1 92.1 L149.5 91.0 L150.9 89.9 L152.4 88.8 L153.8 87.7 L155.3 86.6 L156.7 85.4 L158.1 84.3 L159.6 83.1 L161.0 81.9 L162.4 80.7 L163.9 79.5 L165.3 78.3 L166.8 77.1 L168.2 75.8 L169.6 74.5 L171.1 73.2 L172.5 71.9 L173.9 70.6 L175.4 69.3 L176.8 67.9 L178.3 66.6 L179.7 65.2 L181.1 63.8 L182.6 62.4 L184.0 61.0 L185.4 59.6 L186.9 58.1 L188.3 56.6 L189.8 55.2 L191.2 53.7 L192.6 52.2 L194.1 50.6 L195.5 49.1 L196.9 47.6 L198.4 46.0 L199.8 44.4 L201.3 42.8 L202.7 41.2 L204.1 39.6 L205.6 37.9 L207.0 36.3 L208.4 34.6 L209.9 32.9 L211.3 31.2 L212.8 29.5 L214.2 27.8 L215.6 26.0 L217.1 24.3 L218.5 22.5 L219.9 20.7 L221.4 18.9 L222.8 17.1 L224.3 15.2 L225.7 13.4 L227.1 11.5 L228.6 9.7 L230.0 7.8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.25"/>
<path d="M0.0 90.2 L1.4 91.0 L2.9 91.8 L4.3 92.6 L5.8 93.4 L7.2 94.1 L8.6 94.9 L10.1 95.6 L11.5 96.4 L12.9 97.1 L14.4 97.8 L15.8 98.5 L17.3 99.2 L18.7 99.9 L20.1 100.5 L21.6 101.2 L23.0 101.8 L24.4 102.4 L25.9 103.0 L27.3 103.6 L28.8 104.2 L30.2 104.8 L31.6 105.3 L33.1 105.9 L34.5 106.4 L35.9 106.9 L37.4 107.4 L38.8 107.9 L40.3 108.4 L41.7 108.9 L43.1 109.3 L44.6 109.8 L46.0 110.2 L47.4 110.6 L48.9 111.1 L50.3 111.4 L51.8 111.8 L53.2 112.2 L54.6 112.6 L56.1 112.9 L57.5 113.2 L58.9 113.6 L60.4 113.9 L61.8 114.2 L63.3 114.4 L64.7 114.7 L66.1 115.0 L67.6 115.2 L69.0 115.5 L70.4 115.7 L71.9 115.9 L73.3 116.1 L74.8 116.3 L76.2 116.4 L77.6 116.6 L79.1 116.7 L80.5 116.9 L81.9 117.0 L83.4 117.1 L84.8 117.2 L86.3 117.3 L87.7 117.3 L89.1 117.4 L90.6 117.4 L92.0 117.5 L93.4 117.5 L94.9 117.5 L96.3 117.5 L97.8 117.5 L99.2 117.4 L100.6 117.4 L102.1 117.3 L103.5 117.3 L104.9 117.2 L106.4 117.1 L107.8 117.0 L109.3 116.9 L110.7 116.8 L112.1 116.6 L113.6 116.5 L115.0 116.3 L116.4 116.1 L117.9 115.9 L119.3 115.7 L120.8 115.5 L122.2 115.3 L123.6 115.0 L125.1 114.8 L126.5 114.5 L127.9 114.2 L129.4 113.9 L130.8 113.6 L132.3 113.3 L133.7 113.0 L135.1 112.6 L136.6 112.3 L138.0 111.9 L139.4 111.5 L140.9 111.1 L142.3 110.7 L143.8 110.3 L145.2 109.9 L146.6 109.4 L148.1 109.0 L149.5 108.5 L150.9 108.0 L152.4 107.5 L153.8 107.0 L155.3 106.5 L156.7 106.0 L158.1 105.4 L159.6 104.9 L161.0 104.3 L162.4 103.7 L163.9 103.1 L165.3 102.5 L166.8 101.9 L168.2 101.3 L169.6 100.6 L171.1 100.0 L172.5 99.3 L173.9 98.6 L175.4 97.9 L176.8 97.2 L178.3 96.5 L179.7 95.8 L181.1 95.0 L182.6 94.3 L184.0 93.5 L185.4 92.7 L186.9 91.9 L188.3 91.1 L189.8 90.3 L191.2 89.5 L192.6 88.6 L194.1 87.8 L195.5 86.9 L196.9 86.0 L198.4 85.1 L199.8 84.2 L201.3 83.3 L202.7 82.4 L204.1 81.4 L205.6 80.5 L207.0 79.5 L208.4 78.5 L209.9 77.5 L211.3 76.5 L212.8 75.5 L214.2 74.5 L215.6 73.4 L217.1 72.4 L218.5 71.3 L219.9 70.2 L221.4 69.1 L222.8 68.0 L224.3 66.9 L225.7 65.7 L227.1 64.6 L228.6 63.4 L230.0 62.3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.25"/>
<path d="M0.0 59.6 L1.4 61.2 L2.9 62.7 L4.3 64.2 L5.8 65.7 L7.2 67.2 L8.6 68.6 L10.1 70.1 L11.5 71.5 L12.9 72.9 L14.4 74.3 L15.8 75.7 L17.3 77.0 L18.7 78.4 L20.1 79.7 L21.6 81.0 L23.0 82.3 L24.4 83.6 L25.9 84.9 L27.3 86.2 L28.8 87.4 L30.2 88.6 L31.6 89.8 L33.1 91.0 L34.5 92.2 L35.9 93.3 L37.4 94.5 L38.8 95.6 L40.3 96.7 L41.7 97.8 L43.1 98.9 L44.6 100.0 L46.0 101.0 L47.4 102.0 L48.9 103.1 L50.3 104.1 L51.8 105.0 L53.2 106.0 L54.6 107.0 L56.1 107.9 L57.5 108.8 L58.9 109.7 L60.4 110.6 L61.8 111.5 L63.3 112.3 L64.7 113.2 L66.1 114.0 L67.6 114.8 L69.0 115.6 L70.4 116.4 L71.9 117.1 L73.3 117.9 L74.8 118.6 L76.2 119.3 L77.6 120.0 L79.1 120.7 L80.5 121.4 L81.9 122.0 L83.4 122.7 L84.8 123.3 L86.3 123.9 L87.7 124.5 L89.1 125.0 L90.6 125.6 L92.0 126.1 L93.4 126.7 L94.9 127.2 L96.3 127.7 L97.8 128.1 L99.2 128.6 L100.6 129.0 L102.1 129.5 L103.5 129.9 L104.9 130.3 L106.4 130.7 L107.8 131.0 L109.3 131.4 L110.7 131.7 L112.1 132.0 L113.6 132.3 L115.0 132.6 L116.4 132.9 L117.9 133.1 L119.3 133.4 L120.8 133.6 L122.2 133.8 L123.6 134.0 L125.1 134.1 L126.5 134.3 L127.9 134.4 L129.4 134.6 L130.8 134.7 L132.3 134.8 L133.7 134.8 L135.1 134.9 L136.6 135.0 L138.0 135.0 L139.4 135.0 L140.9 135.0 L142.3 135.0 L143.8 134.9 L145.2 134.9 L146.6 134.8 L148.1 134.7 L149.5 134.7 L150.9 134.5 L152.4 134.4 L153.8 134.3 L155.3 134.1 L156.7 133.9 L158.1 133.7 L159.6 133.5 L161.0 133.3 L162.4 133.1 L163.9 132.8 L165.3 132.5 L166.8 132.2 L168.2 131.9 L169.6 131.6 L171.1 131.3 L172.5 130.9 L173.9 130.6 L175.4 130.2 L176.8 129.8 L178.3 129.4 L179.7 128.9 L181.1 128.5 L182.6 128.0 L184.0 127.6 L185.4 127.1 L186.9 126.5 L188.3 126.0 L189.8 125.5 L191.2 124.9 L192.6 124.3 L194.1 123.8 L195.5 123.2 L196.9 122.5 L198.4 121.9 L199.8 121.2 L201.3 120.6 L202.7 119.9 L204.1 119.2 L205.6 118.5 L207.0 117.7 L208.4 117.0 L209.9 116.2 L211.3 115.4 L212.8 114.6 L214.2 113.8 L215.6 113.0 L217.1 112.2 L218.5 111.3 L219.9 110.4 L221.4 109.5 L222.8 108.6 L224.3 107.7 L225.7 106.8 L227.1 105.8 L228.6 104.8 L230.0 103.8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.25"/>
<path d="M0.0 128.7 L1.4 129.8 L2.9 131.0 L4.3 132.1 L5.8 133.2 L7.2 134.3 L8.6 135.3 L10.1 136.4 L11.5 137.4 L12.9 138.3 L14.4 139.3 L15.8 140.2 L17.3 141.1 L18.7 142.0 L20.1 142.9 L21.6 143.7 L23.0 144.5 L24.4 145.3 L25.9 146.0 L27.3 146.8 L28.8 147.5 L30.2 148.2 L31.6 148.8 L33.1 149.5 L34.5 150.1 L35.9 150.7 L37.4 151.2 L38.8 151.8 L40.3 152.3 L41.7 152.8 L43.1 153.3 L44.6 153.7 L46.0 154.1 L47.4 154.5 L48.9 154.9 L50.3 155.2 L51.8 155.5 L53.2 155.8 L54.6 156.1 L56.1 156.4 L57.5 156.6 L58.9 156.8 L60.4 157.0 L61.8 157.1 L63.3 157.2 L64.7 157.3 L66.1 157.4 L67.6 157.5 L69.0 157.5 L70.4 157.5 L71.9 157.5 L73.3 157.4 L74.8 157.4 L76.2 157.3 L77.6 157.2 L79.1 157.0 L80.5 156.9 L81.9 156.7 L83.4 156.4 L84.8 156.2 L86.3 155.9 L87.7 155.7 L89.1 155.3 L90.6 155.0 L92.0 154.7 L93.4 154.3 L94.9 153.9 L96.3 153.4 L97.8 153.0 L99.2 152.5 L100.6 152.0 L102.1 151.5 L103.5 150.9 L104.9 150.3 L106.4 149.7 L107.8 149.1 L109.3 148.4 L110.7 147.8 L112.1 147.1 L113.6 146.3 L115.0 145.6 L116.4 144.8 L117.9 144.0 L119.3 143.2 L120.8 142.3 L122.2 141.5 L123.6 140.6 L125.1 139.7 L126.5 138.7 L127.9 137.8 L129.4 136.8 L130.8 135.7 L132.3 134.7 L133.7 133.6 L135.1 132.6 L136.6 131.4 L138.0 130.3 L139.4 129.1 L140.9 128.0 L142.3 126.7 L143.8 125.5 L145.2 124.2 L146.6 123.0 L148.1 121.7 L149.5 120.3 L150.9 119.0 L152.4 117.6 L153.8 116.2 L155.3 114.7 L156.7 113.3 L158.1 111.8 L159.6 110.3 L161.0 108.8 L162.4 107.2 L163.9 105.7 L165.3 104.1 L166.8 102.4 L168.2 100.8 L169.6 99.1 L171.1 97.4 L172.5 95.7 L173.9 94.0 L175.4 92.2 L176.8 90.4 L178.3 88.6 L179.7 86.7 L181.1 84.9 L182.6 83.0 L184.0 81.1 L185.4 79.1 L186.9 77.1 L188.3 75.2 L189.8 73.1 L191.2 71.1 L192.6 69.0 L194.1 67.0 L195.5 64.9 L196.9 62.7 L198.4 60.6 L199.8 58.4 L201.3 56.2 L202.7 53.9 L204.1 51.7 L205.6 49.4 L207.0 47.1 L208.4 44.8 L209.9 42.4 L211.3 40.0 L212.8 37.6 L214.2 35.2 L215.6 32.8 L217.1 30.3 L218.5 27.8 L219.9 25.3 L221.4 22.7 L222.8 20.1 L224.3 17.5 L225.7 14.9 L227.1 12.3 L228.6 9.6 L230.0 6.9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.25"/>
<path d="M0.0 62.1 L1.4 64.6 L2.9 67.0 L4.3 69.4 L5.8 71.8 L7.2 74.1 L8.6 76.4 L10.1 78.7 L11.5 80.9 L12.9 83.1 L14.4 85.3 L15.8 87.5 L17.3 89.6 L18.7 91.7 L20.1 93.7 L21.6 95.8 L23.0 97.8 L24.4 99.8 L25.9 101.7 L27.3 103.6 L28.8 105.5 L30.2 107.4 L31.6 109.2 L33.1 111.0 L34.5 112.8 L35.9 114.5 L37.4 116.2 L38.8 117.9 L40.3 119.6 L41.7 121.2 L43.1 122.8 L44.6 124.4 L46.0 125.9 L47.4 127.4 L48.9 128.9 L50.3 130.3 L51.8 131.7 L53.2 133.1 L54.6 134.5 L56.1 135.8 L57.5 137.1 L58.9 138.4 L60.4 139.6 L61.8 140.8 L63.3 142.0 L64.7 143.1 L66.1 144.3 L67.6 145.4 L69.0 146.4 L70.4 147.5 L71.9 148.5 L73.3 149.4 L74.8 150.4 L76.2 151.3 L77.6 152.2 L79.1 153.0 L80.5 153.9 L81.9 154.7 L83.4 155.4 L84.8 156.2 L86.3 156.9 L87.7 157.5 L89.1 158.2 L90.6 158.8 L92.0 159.4 L93.4 160.0 L94.9 160.5 L96.3 161.0 L97.8 161.5 L99.2 161.9 L100.6 162.3 L102.1 162.7 L103.5 163.1 L104.9 163.4 L106.4 163.7 L107.8 163.9 L109.3 164.2 L110.7 164.4 L112.1 164.6 L113.6 164.7 L115.0 164.8 L116.4 164.9 L117.9 165.0 L119.3 165.0 L120.8 165.0 L122.2 165.0 L123.6 164.9 L125.1 164.8 L126.5 164.7 L127.9 164.5 L129.4 164.4 L130.8 164.2 L132.3 163.9 L133.7 163.7 L135.1 163.4 L136.6 163.0 L138.0 162.7 L139.4 162.3 L140.9 161.9 L142.3 161.4 L143.8 161.0 L145.2 160.5 L146.6 159.9 L148.1 159.4 L149.5 158.8 L150.9 158.2 L152.4 157.5 L153.8 156.8 L155.3 156.1 L156.7 155.4 L158.1 154.6 L159.6 153.8 L161.0 153.0 L162.4 152.1 L163.9 151.2 L165.3 150.3 L166.8 149.4 L168.2 148.4 L169.6 147.4 L171.1 146.4 L172.5 145.3 L173.9 144.2 L175.4 143.1 L176.8 141.9 L178.3 140.8 L179.7 139.6 L181.1 138.3 L182.6 137.0 L184.0 135.7 L185.4 134.4 L186.9 133.1 L188.3 131.7 L189.8 130.2 L191.2 128.8 L192.6 127.3 L194.1 125.8 L195.5 124.3 L196.9 122.7 L198.4 121.1 L199.8 119.5 L201.3 117.8 L202.7 116.2 L204.1 114.4 L205.6 112.7 L207.0 110.9 L208.4 109.1 L209.9 107.3 L211.3 105.4 L212.8 103.6 L214.2 101.6 L215.6 99.7 L217.1 97.7 L218.5 95.7 L219.9 93.7 L221.4 91.6 L222.8 89.5 L224.3 87.4 L225.7 85.2 L227.1 83.0 L228.6 80.8 L230.0 78.6" fill="none" stroke="#00A876" stroke-width="1.5" stroke-dasharray="5 3" opacity="0.8"/>
<path d="M0.0 161.4 L1.4 162.3 L2.9 163.1 L4.3 163.9 L5.8 164.7 L7.2 165.5 L8.6 166.2 L10.1 166.8 L11.5 167.5 L12.9 168.1 L14.4 168.6 L15.8 169.2 L17.3 169.6 L18.7 170.1 L20.1 170.5 L21.6 170.9 L23.0 171.2 L24.4 171.5 L25.9 171.7 L27.3 172.0 L28.8 172.1 L30.2 172.3 L31.6 172.4 L33.1 172.5 L34.5 172.5 L35.9 172.5 L37.4 172.4 L38.8 172.4 L40.3 172.2 L41.7 172.1 L43.1 171.9 L44.6 171.7 L46.0 171.4 L47.4 171.1 L48.9 170.7 L50.3 170.4 L51.8 169.9 L53.2 169.5 L54.6 169.0 L56.1 168.5 L57.5 167.9 L58.9 167.3 L60.4 166.6 L61.8 166.0 L63.3 165.2 L64.7 164.5 L66.1 163.7 L67.6 162.9 L69.0 162.0 L70.4 161.1 L71.9 160.1 L73.3 159.2 L74.8 158.1 L76.2 157.1 L77.6 156.0 L79.1 154.8 L80.5 153.7 L81.9 152.5 L83.4 151.2 L84.8 149.9 L86.3 148.6 L87.7 147.3 L89.1 145.9 L90.6 144.4 L92.0 143.0 L93.4 141.5 L94.9 139.9 L96.3 138.3 L97.8 136.7 L99.2 135.0 L100.6 133.3 L102.1 131.6 L103.5 129.8 L104.9 128.0 L106.4 126.2 L107.8 124.3 L109.3 122.4 L110.7 120.4 L112.1 118.4 L113.6 116.4 L115.0 114.3 L116.4 112.2 L117.9 110.1 L119.3 107.9 L120.8 105.7 L122.2 103.4 L123.6 101.1 L125.1 98.8 L126.5 96.4 L127.9 94.0 L129.4 91.5 L130.8 89.0 L132.3 86.5 L133.7 84.0 L135.1 81.4 L136.6 78.7 L138.0 76.1 L139.4 73.3 L140.9 70.6 L142.3 67.8 L143.8 65.0 L145.2 62.1 L146.6 59.2 L148.1 56.3 L149.5 53.3 L150.9 50.3 L152.4 47.3 L153.8 44.2 L155.3 41.0 L156.7 37.9 L158.1 34.7 L159.6 31.4 L161.0 28.2 L162.4 24.9 L163.9 21.5 L165.3 18.1 L166.8 14.7 L168.2 11.2 L169.6 7.7 L171.1 4.2 L172.5 0.6 L173.9 -3.0 L175.4 -6.6" fill="none" stroke="#3B82C4" stroke-width="1.5" stroke-dasharray="5 3" opacity="0.8"/>
<path d="M0.0 23.7 L1.4 25.3 L2.9 26.9 L4.3 28.5 L5.8 30.1 L7.2 31.7 L8.6 33.2 L10.1 34.7 L11.5 36.3 L12.9 37.8 L14.4 39.3 L15.8 40.8 L17.3 42.2 L18.7 43.7 L20.1 45.1 L21.6 46.6 L23.0 48.0 L24.4 49.4 L25.9 50.8 L27.3 52.1 L28.8 53.5 L30.2 54.9 L31.6 56.2 L33.1 57.5 L34.5 58.8 L35.9 60.1 L37.4 61.4 L38.8 62.7 L40.3 63.9 L41.7 65.2 L43.1 66.4 L44.6 67.6 L46.0 68.8 L47.4 70.0 L48.9 71.2 L50.3 72.3 L51.8 73.5 L53.2 74.6 L54.6 75.8 L56.1 76.9 L57.5 78.0 L58.9 79.0 L60.4 80.1 L61.8 81.2 L63.3 82.2 L64.7 83.2 L66.1 84.3 L67.6 85.3 L69.0 86.3 L70.4 87.2 L71.9 88.2 L73.3 89.1 L74.8 90.1 L76.2 91.0 L77.6 91.9 L79.1 92.8 L80.5 93.7 L81.9 94.6 L83.4 95.4 L84.8 96.3 L86.3 97.1 L87.7 97.9 L89.1 98.7 L90.6 99.5 L92.0 100.3 L93.4 101.0 L94.9 101.8 L96.3 102.5 L97.8 103.2 L99.2 104.0 L100.6 104.7 L102.1 105.3 L103.5 106.0 L104.9 106.7 L106.4 107.3 L107.8 107.9 L109.3 108.6 L110.7 109.2 L112.1 109.7 L113.6 110.3 L115.0 110.9 L116.4 111.4 L117.9 112.0 L119.3 112.5 L120.8 113.0 L122.2 113.5 L123.6 114.0 L125.1 114.5 L126.5 114.9 L127.9 115.4 L129.4 115.8 L130.8 116.2 L132.3 116.6 L133.7 117.0 L135.1 117.4 L136.6 117.7 L138.0 118.1 L139.4 118.4 L140.9 118.7 L142.3 119.1 L143.8 119.3 L145.2 119.6 L146.6 119.9 L148.1 120.2 L149.5 120.4 L150.9 120.6 L152.4 120.8 L153.8 121.1 L155.3 121.2 L156.7 121.4 L158.1 121.6 L159.6 121.7 L161.0 121.9 L162.4 122.0 L163.9 122.1 L165.3 122.2 L166.8 122.3 L168.2 122.4 L169.6 122.4 L171.1 122.4 L172.5 122.5 L173.9 122.5 L175.4 122.5 L176.8 122.5 L178.3 122.5 L179.7 122.4 L181.1 122.4 L182.6 122.3 L184.0 122.2 L185.4 122.1 L186.9 122.0 L188.3 121.9 L189.8 121.8 L191.2 121.7 L192.6 121.5 L194.1 121.3 L195.5 121.1 L196.9 120.9 L198.4 120.7 L199.8 120.5 L201.3 120.3 L202.7 120.0 L204.1 119.8 L205.6 119.5 L207.0 119.2 L208.4 118.9 L209.9 118.6 L211.3 118.2 L212.8 117.9 L214.2 117.5 L215.6 117.2 L217.1 116.8 L218.5 116.4 L219.9 116.0 L221.4 115.6 L222.8 115.1 L224.3 114.7 L225.7 114.2 L227.1 113.7 L228.6 113.2 L230.0 112.7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.25"/>
<path d="M17.3 -8.0 L18.7 -5.2 L20.1 -2.4 L21.6 0.4 L23.0 3.1 L24.4 5.9 L25.9 8.6 L27.3 11.2 L28.8 13.9 L30.2 16.5 L31.6 19.1 L33.1 21.7 L34.5 24.3 L35.9 26.8 L37.4 29.3 L38.8 31.8 L40.3 34.2 L41.7 36.7 L43.1 39.1 L44.6 41.5 L46.0 43.8 L47.4 46.2 L48.9 48.5 L50.3 50.8 L51.8 53.1 L53.2 55.3 L54.6 57.5 L56.1 59.7 L57.5 61.9 L58.9 64.0 L60.4 66.1 L61.8 68.2 L63.3 70.3 L64.7 72.4 L66.1 74.4 L67.6 76.4 L69.0 78.3 L70.4 80.3 L71.9 82.2 L73.3 84.1 L74.8 86.0 L76.2 87.9 L77.6 89.7 L79.1 91.5 L80.5 93.3 L81.9 95.0 L83.4 96.7 L84.8 98.5 L86.3 100.1 L87.7 101.8 L89.1 103.4 L90.6 105.0 L92.0 106.6 L93.4 108.2 L94.9 109.7 L96.3 111.2 L97.8 112.7 L99.2 114.2 L100.6 115.6 L102.1 117.0 L103.5 118.4 L104.9 119.8 L106.4 121.1 L107.8 122.5 L109.3 123.7 L110.7 125.0 L112.1 126.3 L113.6 127.5 L115.0 128.7 L116.4 129.8 L117.9 131.0 L119.3 132.1 L120.8 133.2 L122.2 134.3 L123.6 135.3 L125.1 136.4 L126.5 137.4 L127.9 138.3 L129.4 139.3 L130.8 140.2 L132.3 141.1 L133.7 142.0 L135.1 142.9 L136.6 143.7 L138.0 144.5 L139.4 145.3 L140.9 146.0 L142.3 146.8 L143.8 147.5 L145.2 148.2 L146.6 148.8 L148.1 149.5 L149.5 150.1 L150.9 150.7 L152.4 151.2 L153.8 151.8 L155.3 152.3 L156.7 152.8 L158.1 153.3 L159.6 153.7 L161.0 154.1 L162.4 154.5 L163.9 154.9 L165.3 155.2 L166.8 155.5 L168.2 155.8 L169.6 156.1 L171.1 156.4 L172.5 156.6 L173.9 156.8 L175.4 157.0 L176.8 157.1 L178.3 157.2 L179.7 157.3 L181.1 157.4 L182.6 157.5 L184.0 157.5 L185.4 157.5 L186.9 157.5 L188.3 157.4 L189.8 157.4 L191.2 157.3 L192.6 157.2 L194.1 157.0 L195.5 156.9 L196.9 156.7 L198.4 156.4 L199.8 156.2 L201.3 155.9 L202.7 155.7 L204.1 155.3 L205.6 155.0 L207.0 154.7 L208.4 154.3 L209.9 153.9 L211.3 153.4 L212.8 153.0 L214.2 152.5 L215.6 152.0 L217.1 151.5 L218.5 150.9 L219.9 150.3 L221.4 149.7 L222.8 149.1 L224.3 148.4 L225.7 147.8 L227.1 147.1 L228.6 146.3 L230.0 145.6" fill="none" stroke="#CC79A7" stroke-width="1.5" stroke-dasharray="5 3" opacity="0.8"/>
<path d="M0.0 51.7 L1.4 57.8 L2.9 63.8 L4.3 69.7 L5.8 75.5 L7.2 81.1 L8.6 86.6 L10.1 91.9 L11.5 97.1 L12.9 102.1 L14.4 107.1 L15.8 111.9 L17.3 116.5 L18.7 121.0 L20.1 125.4 L21.6 129.6 L23.0 133.7 L24.4 137.7 L25.9 141.5 L27.3 145.2 L28.8 148.7 L30.2 152.1 L31.6 155.4 L33.1 158.5 L34.5 161.5 L35.9 164.3 L37.4 167.1 L38.8 169.6 L40.3 172.1 L41.7 174.4 L43.1 176.5 L44.6 178.6 L46.0 180.5 L47.4 182.2 L48.9 183.8 L50.3 185.3 L51.8 186.6 L53.2 187.8 L54.6 188.9 L56.1 189.8 L57.5 190.6 L58.9 191.3 L60.4 191.8 L61.8 192.2 L63.3 192.4 L64.7 192.5 L66.1 192.5 L67.6 192.3 L69.0 192.0 L70.4 191.5 L71.9 190.9 L73.3 190.2 L74.8 189.3 L76.2 188.3 L77.6 187.2 L79.1 185.9 L80.5 184.5 L81.9 182.9 L83.4 181.2 L84.8 179.4 L86.3 177.4 L87.7 175.3 L89.1 173.1 L90.6 170.7 L92.0 168.2 L93.4 165.5 L94.9 162.7 L96.3 159.8 L97.8 156.7 L99.2 153.5 L100.6 150.2 L102.1 146.7 L103.5 143.1 L104.9 139.3 L106.4 135.4 L107.8 131.4 L109.3 127.2 L110.7 122.9 L112.1 118.5 L113.6 113.9 L115.0 109.2 L116.4 104.3 L117.9 99.3 L119.3 94.2 L120.8 88.9 L122.2 83.5 L123.6 77.9 L125.1 72.2 L126.5 66.4 L127.9 60.5 L129.4 54.4 L130.8 48.1 L132.3 41.7 L133.7 35.2 L135.1 28.6 L136.6 21.8 L138.0 14.9 L139.4 7.8 L140.9 0.6 L142.3 -6.7" fill="none" stroke="#E69F00" stroke-width="1.5" stroke-dasharray="5 3" opacity="0.8"/>
<path d="M51.8 -5.6 L53.2 0.0 L54.6 5.6 L56.1 11.0 L57.5 16.4 L58.9 21.7 L60.4 26.8 L61.8 32.0 L63.3 37.0 L64.7 41.9 L66.1 46.8 L67.6 51.6 L69.0 56.3 L70.4 60.9 L71.9 65.4 L73.3 69.9 L74.8 74.2 L76.2 78.5 L77.6 82.7 L79.1 86.9 L80.5 90.9 L81.9 94.8 L83.4 98.7 L84.8 102.5 L86.3 106.2 L87.7 109.8 L89.1 113.4 L90.6 116.8 L92.0 120.2 L93.4 123.5 L94.9 126.7 L96.3 129.9 L97.8 132.9 L99.2 135.9 L100.6 138.7 L102.1 141.5 L103.5 144.3 L104.9 146.9 L106.4 149.4 L107.8 151.9 L109.3 154.3 L110.7 156.6 L112.1 158.8 L113.6 160.9 L115.0 163.0 L116.4 165.0 L117.9 166.9 L119.3 168.7 L120.8 170.4 L122.2 172.0 L123.6 173.6 L125.1 175.1 L126.5 176.5 L127.9 177.8 L129.4 179.0 L130.8 180.1 L132.3 181.2 L133.7 182.2 L135.1 183.1 L136.6 183.9 L138.0 184.6 L139.4 185.3 L140.9 185.8 L142.3 186.3 L143.8 186.7 L145.2 187.0 L146.6 187.3 L148.1 187.4 L149.5 187.5 L150.9 187.5 L152.4 187.4 L153.8 187.2 L155.3 186.9 L156.7 186.6 L158.1 186.2 L159.6 185.7 L161.0 185.1 L162.4 184.4 L163.9 183.6 L165.3 182.8 L166.8 181.9 L168.2 180.9 L169.6 179.8 L171.1 178.6 L172.5 177.4 L173.9 176.0 L175.4 174.6 L176.8 173.1 L178.3 171.5 L179.7 169.9 L181.1 168.1 L182.6 166.3 L184.0 164.4 L185.4 162.4 L186.9 160.3 L188.3 158.1 L189.8 155.9 L191.2 153.6 L192.6 151.2 L194.1 148.7 L195.5 146.1 L196.9 143.4 L198.4 140.7 L199.8 137.9 L201.3 135.0 L202.7 132.0 L204.1 128.9 L205.6 125.8 L207.0 122.5 L208.4 119.2 L209.9 115.8 L211.3 112.3 L212.8 108.7 L214.2 105.1 L215.6 101.4 L217.1 97.6 L218.5 93.7 L219.9 89.7 L221.4 85.6 L222.8 81.5 L224.3 77.2 L225.7 72.9 L227.1 68.5 L228.6 64.1 L230.0 59.5" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="5 3" opacity="0.8"/>
<circle cx="45" cy="60" r="3.5" fill="currentColor"/>
<circle cx="95" cy="35" r="3.5" fill="currentColor"/>
<circle cx="140" cy="70" r="3.5" fill="currentColor"/>
<circle cx="70" cy="115" r="3.5" fill="currentColor"/>
<circle cx="120" cy="130" r="4" fill="#00A876"/>
<circle cx="35" cy="145" r="4" fill="#3B82C4"/>
<circle cx="175" cy="45" r="3.5" fill="currentColor"/>
<circle cx="185" cy="115" r="4" fill="#CC79A7"/>
<circle cx="65" cy="185" r="4" fill="#E69F00"/>
<circle cx="150" cy="175" r="4" fill="#D55E00"/>
<path d="M0.0 161.4 L0.4 161.6 L0.8 161.8 L1.1 162.1 L1.5 162.3 L1.9 162.5 L2.3 162.8 L2.7 163.0 L3.1 163.2 L3.5 163.5 L3.8 163.7 L4.2 163.9 L4.6 164.1 L5.0 164.3 L5.4 164.5 L5.8 164.7 L6.1 164.9 L6.5 165.1 L6.9 165.3 L7.3 165.5 L7.7 165.7 L8.1 165.9 L8.4 166.1 L8.8 166.3 L9.2 166.4 L9.6 166.6 L10.0 166.8 L10.3 167.0 L10.7 167.1 L11.1 167.3 L11.5 167.5 L11.9 167.6 L12.3 167.8 L12.7 168.0 L13.0 168.1 L13.4 168.3 L13.8 168.4 L14.2 168.6 L14.6 168.7 L14.9 168.8 L15.3 169.0 L15.7 169.1 L16.1 169.3 L16.5 169.4 L16.9 169.5 L17.3 169.6 L17.6 169.8 L18.0 169.9 L18.4 170.0 L18.8 170.1 L19.2 170.2 L19.6 170.3 L19.9 170.4 L20.3 170.5 L20.7 170.6 L21.1 170.7 L21.5 170.8 L21.9 170.9 L22.2 171.0 L22.6 171.1 L23.0 171.2 L23.4 171.3 L23.8 171.4 L24.1 171.4 L24.5 171.5 L24.9 171.6 L25.3 171.6 L25.7 171.7 L26.1 171.8 L26.4 171.8 L26.8 171.9 L27.2 171.9 L27.6 172.0 L28.0 172.1 L28.4 172.1 L28.8 172.1 L29.1 172.2 L29.5 172.2 L29.9 172.3 L30.3 172.3 L30.7 172.3 L31.1 172.4 L31.4 172.4 L31.8 172.4 L32.2 172.4 L32.6 172.4 L33.0 172.5 L33.4 172.5 L33.7 172.5 L34.1 172.5 L34.5 172.5 L34.9 172.5 L35.3 172.5 L35.6 172.5 L36.0 172.5 L36.4 172.5 L36.8 172.5 L37.2 172.5 L37.6 172.4 L38.0 172.4 L38.3 172.4 L38.7 172.4 L39.1 172.3 L39.5 172.3 L39.9 172.3 L40.3 172.2 L40.6 172.7 L41.0 173.3 L41.4 173.9 L41.8 174.5 L42.2 175.1 L42.5 175.7 L42.9 176.3 L43.3 176.8 L43.7 177.4 L44.1 177.9 L44.5 178.4 L44.9 179.0 L45.2 179.5 L45.6 180.0 L46.0 180.5 L46.4 180.9 L46.8 181.4 L47.1 181.9 L47.5 182.3 L47.9 182.8 L48.3 183.2 L48.7 183.6 L49.1 184.0 L49.5 184.4 L49.8 184.8 L50.2 185.2 L50.6 185.6 L51.0 186.0 L51.4 186.3 L51.8 186.6 L52.1 187.0 L52.5 187.3 L52.9 187.6 L53.3 187.9 L53.7 188.2 L54.0 188.5 L54.4 188.8 L54.8 189.0 L55.2 189.3 L55.6 189.5 L56.0 189.8 L56.4 190.0 L56.7 190.2 L57.1 190.4 L57.5 190.6 L57.9 190.8 L58.3 191.0 L58.6 191.2 L59.0 191.3 L59.4 191.5 L59.8 191.6 L60.2 191.7 L60.6 191.8 L61.0 192.0 L61.3 192.1 L61.7 192.1 L62.1 192.2 L62.5 192.3 L62.9 192.3 L63.3 192.4 L63.6 192.4 L64.0 192.5 L64.4 192.5 L64.8 192.5 L65.2 192.5 L65.5 192.5 L65.9 192.5 L66.3 192.4 L66.7 192.4 L67.1 192.4 L67.5 192.3 L67.8 192.2 L68.2 192.2 L68.6 192.1 L69.0 192.0 L69.4 191.9 L69.8 191.7 L70.2 191.6 L70.5 191.5 L70.9 191.3 L71.3 191.2 L71.7 191.0 L72.1 190.8 L72.5 190.6 L72.8 190.5 L73.2 190.2 L73.6 190.0 L74.0 189.8 L74.4 189.6 L74.8 189.3 L75.1 189.1 L75.5 188.8 L75.9 188.5 L76.3 188.3 L76.7 188.0 L77.0 187.7 L77.4 187.3 L77.8 187.0 L78.2 186.7 L78.6 186.3 L79.0 186.0 L79.3 185.6 L79.7 185.3 L80.1 184.9 L80.5 184.5 L80.9 184.1 L81.3 183.7 L81.7 183.3 L82.0 182.8 L82.4 182.4 L82.8 181.9 L83.2 181.5 L83.6 181.0 L84.0 180.5 L84.3 180.0 L84.7 179.5 L85.1 179.0 L85.5 178.5 L85.9 178.0 L86.3 177.4 L86.6 176.9 L87.0 176.3 L87.4 175.8 L87.8 175.2 L88.2 174.6 L88.5 174.0 L88.9 173.4 L89.3 172.8 L89.7 172.2 L90.1 171.5 L90.5 170.9 L90.8 170.2 L91.2 169.6 L91.6 168.9 L92.0 168.2 L92.4 167.5 L92.8 166.8 L93.2 166.1 L93.5 165.4 L93.9 164.6 L94.3 163.9 L94.7 163.1 L95.1 162.4 L95.5 161.6 L95.8 160.8 L96.2 161.0 L96.6 161.1 L97.0 161.2 L97.4 161.3 L97.8 161.5 L98.1 161.6 L98.5 161.7 L98.9 161.8 L99.3 161.9 L99.7 162.0 L100.0 162.2 L100.4 162.3 L100.8 162.4 L101.2 162.5 L101.6 162.6 L102.0 162.7 L102.3 162.8 L102.7 162.9 L103.1 163.0 L103.5 163.1 L103.9 163.1 L104.3 163.2 L104.7 163.3 L105.0 163.4 L105.4 163.5 L105.8 163.6 L106.2 163.6 L106.6 163.7 L107.0 163.8 L107.3 163.9 L107.7 163.9 L108.1 164.0 L108.5 164.1 L108.9 164.1 L109.3 164.2 L109.6 164.2 L110.0 164.3 L110.4 164.3 L110.8 164.4 L111.2 164.4 L111.5 164.5 L111.9 164.5 L112.3 164.6 L112.7 164.6 L113.1 164.7 L113.5 164.7 L113.8 164.7 L114.2 164.8 L114.6 164.8 L115.0 164.8 L115.4 164.8 L115.8 164.9 L116.2 164.9 L116.5 165.1 L116.9 165.6 L117.3 166.1 L117.7 166.6 L118.1 167.1 L118.5 167.6 L118.8 168.1 L119.2 168.5 L119.6 169.0 L120.0 169.5 L120.4 169.9 L120.8 170.4 L121.1 170.8 L121.5 171.3 L121.9 171.7 L122.3 172.1 L122.7 172.6 L123.0 173.0 L123.4 173.4 L123.8 173.8 L124.2 174.2 L124.6 174.6 L125.0 175.0 L125.3 175.3 L125.7 175.7 L126.1 176.1 L126.5 176.5 L126.9 176.8 L127.3 177.2 L127.7 177.5 L128.0 177.8 L128.4 178.2 L128.8 178.5 L129.2 178.8 L129.6 179.1 L129.9 179.5 L130.3 179.8 L130.7 180.1 L131.1 180.4 L131.5 180.6 L131.9 180.9 L132.3 181.2 L132.6 181.5 L133.0 181.7 L133.4 182.0 L133.8 182.2 L134.2 182.5 L134.6 182.7 L134.9 183.0 L135.3 183.2 L135.7 183.4 L136.1 183.6 L136.5 183.8 L136.8 184.0 L137.2 184.2 L137.6 184.4 L138.0 184.6 L138.4 184.8 L138.8 185.0 L139.2 185.1 L139.5 185.3 L139.9 185.5 L140.3 185.6 L140.7 185.8 L141.1 185.9 L141.4 186.0 L141.8 186.2 L142.2 186.3 L142.6 186.4 L143.0 186.5 L143.4 186.6 L143.8 186.7 L144.1 186.8 L144.5 186.9 L144.9 187.0 L145.3 187.1 L145.7 187.1 L146.1 187.2 L146.4 187.2 L146.8 187.3 L147.2 187.3 L147.6 187.4 L148.0 187.4 L148.3 187.4 L148.7 187.5 L149.1 187.5 L149.5 187.5 L149.9 187.5 L150.3 187.5 L150.7 187.5 L151.0 187.5 L151.4 187.5 L151.8 187.4 L152.2 187.4 L152.6 187.4 L152.9 187.3 L153.3 187.3 L153.7 187.2 L154.1 187.2 L154.5 187.1 L154.9 187.0 L155.3 186.9 L155.6 186.9 L156.0 186.8 L156.4 186.7 L156.8 186.6 L157.2 186.5 L157.6 186.4 L157.9 186.2 L158.3 186.1 L158.7 186.0 L159.1 185.8 L159.5 185.7 L159.8 185.6 L160.2 185.4 L160.6 185.2 L161.0 185.1 L161.4 184.9 L161.8 184.7 L162.2 184.5 L162.5 184.4 L162.9 184.2 L163.3 184.0 L163.7 183.8 L164.1 183.5 L164.4 183.3 L164.8 183.1 L165.2 182.9 L165.6 182.6 L166.0 182.4 L166.4 182.1 L166.8 181.9 L167.1 181.6 L167.5 181.4 L167.9 181.1 L168.3 180.8 L168.7 180.5 L169.1 180.2 L169.4 179.9 L169.8 179.6 L170.2 179.3 L170.6 179.0 L171.0 178.7 L171.3 178.4 L171.7 178.1 L172.1 177.7 L172.5 177.4 L172.9 177.0 L173.3 176.7 L173.7 176.3 L174.0 175.9 L174.4 175.6 L174.8 175.2 L175.2 174.8 L175.6 174.4 L175.9 174.0 L176.3 173.6 L176.7 173.2 L177.1 172.8 L177.5 172.4 L177.9 172.0 L178.3 171.5 L178.6 171.1 L179.0 170.7 L179.4 170.2 L179.8 169.8 L180.2 169.3 L180.6 168.8 L180.9 168.4 L181.3 167.9 L181.7 167.4 L182.1 166.9 L182.5 166.4 L182.8 165.9 L183.2 165.4 L183.6 164.9 L184.0 164.4 L184.4 163.9 L184.8 163.3 L185.2 162.8 L185.5 162.2 L185.9 161.7 L186.3 161.1 L186.7 160.6 L187.1 160.0 L187.4 159.4 L187.8 158.9 L188.2 158.3 L188.6 157.7 L189.0 157.4 L189.4 157.4 L189.8 157.4 L190.1 157.3 L190.5 157.3 L190.9 157.3 L191.3 157.3 L191.7 157.2 L192.1 157.2 L192.4 157.2 L192.8 157.1 L193.2 157.1 L193.6 157.1 L194.0 157.0 L194.3 157.0 L194.7 156.9 L195.1 156.9 L195.5 156.9 L195.9 156.8 L196.3 156.8 L196.7 156.7 L197.0 156.6 L197.4 156.6 L197.8 156.5 L198.2 156.5 L198.6 156.4 L198.9 156.4 L199.3 156.3 L199.7 156.2 L200.1 156.2 L200.5 156.1 L200.9 156.0 L201.3 155.9 L201.6 155.9 L202.0 155.8 L202.4 155.7 L202.8 155.6 L203.2 155.6 L203.6 155.5 L203.9 155.4 L204.3 155.3 L204.7 155.2 L205.1 155.1 L205.5 155.0 L205.8 154.9 L206.2 154.8 L206.6 154.8 L207.0 154.7 L207.4 154.6 L207.8 154.5 L208.2 154.3 L208.5 154.2 L208.9 154.1 L209.3 154.0 L209.7 153.9 L210.1 153.8 L210.4 153.7 L210.8 153.6 L211.2 153.5 L211.6 153.3 L212.0 153.2 L212.4 153.1 L212.8 153.0 L213.1 152.8 L213.5 152.7 L213.9 152.6 L214.3 152.5 L214.7 152.3 L215.1 152.2 L215.4 152.1 L215.8 151.9 L216.2 151.8 L216.6 151.6 L217.0 151.5 L217.3 151.3 L217.7 151.2 L218.1 151.0 L218.5 150.9 L218.9 150.7 L219.3 150.6 L219.7 150.4 L220.0 150.3 L220.4 150.1 L220.8 150.0 L221.2 149.8 L221.6 149.6 L221.9 149.5 L222.3 149.3 L222.7 149.1 L223.1 149.0 L223.5 148.8 L223.9 148.6 L224.3 148.4 L224.6 148.3 L225.0 148.1 L225.4 147.9 L225.8 147.7 L226.2 147.5 L226.6 147.3 L226.9 147.2 L227.3 147.0 L227.7 146.8 L228.1 146.6 L228.5 146.4 L228.8 146.2 L229.2 146.0 L229.6 145.8 L230.0 145.6" fill="none" stroke="currentColor" stroke-width="3"/>
<path d="M0 200 L230 200" fill="none" stroke="#56B4E9" stroke-width="2"/>
<circle cx="40.6" cy="172.7" r="3" fill="#D55E00"/>
<circle cx="95.8" cy="160.8" r="3" fill="#D55E00"/>
<circle cx="116.5" cy="165.1" r="3" fill="#D55E00"/>
<circle cx="189.0" cy="157.4" r="3" fill="#D55E00"/>
<text x="224" y="192" font-size="11" text-anchor="end" fill="currentColor" opacity="0.7">sweep</text>
</svg>
```

放物面リフトは一番美しい見方。(x, y) の点を放物面 z = x²+y² の上の点 (x, y, x²+y²) に持ち上げると、ドロネーは持ち上げた点群の下側凸包（下から見上げたときに見える面）を射影したものになる。円が平面に、円内判定が「面の上下の比較」に化けるのがミソだ。1次元で書くと雰囲気が分かる: 1次元のドロネーはソート済みの隣接関係で、下側凸包はちょうど隣の点を結ぶ弦になる。間を飛ばす弦は、間の点がその下に出るので下側凸包にはならない。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="5 4.5 225 231.5" width="225" height="232" role="img" aria-label="1D lifting: points on x go up to the parabola x^2; the lower hull is exactly adjacent pairs — Delaunay in 1D is sorted adjacency">
<path d="M30.0 109.8 L31.6 112.7 L33.2 115.7 L34.8 118.5 L36.3 121.4 L37.9 124.2 L39.5 126.9 L41.1 129.6 L42.7 132.2 L44.3 134.8 L45.8 137.3 L47.4 139.8 L49.0 142.2 L50.6 144.6 L52.2 147.0 L53.8 149.2 L55.3 151.5 L56.9 153.6 L58.5 155.8 L60.1 157.9 L61.7 159.9 L63.3 161.9 L64.8 163.8 L66.4 165.7 L68.0 167.5 L69.6 169.3 L71.2 171.0 L72.8 172.7 L74.3 174.3 L75.9 175.9 L77.5 177.4 L79.1 178.9 L80.7 180.3 L82.3 181.7 L83.8 183.1 L85.4 184.3 L87.0 185.6 L88.6 186.7 L90.2 187.9 L91.8 188.9 L93.3 190.0 L94.9 190.9 L96.5 191.9 L98.1 192.8 L99.7 193.6 L101.3 194.4 L102.8 195.1 L104.4 195.8 L106.0 196.4 L107.6 197.0 L109.2 197.5 L110.8 198.0 L112.3 198.4 L113.9 198.8 L115.5 199.1 L117.1 199.4 L118.7 199.6 L120.3 199.8 L121.8 199.9 L123.4 200.0 L125.0 200.0 L126.6 200.0 L128.2 199.9 L129.8 199.8 L131.3 199.6 L132.9 199.4 L134.5 199.1 L136.1 198.8 L137.7 198.4 L139.3 198.0 L140.8 197.5 L142.4 197.0 L144.0 196.4 L145.6 195.8 L147.2 195.1 L148.8 194.4 L150.3 193.6 L151.9 192.8 L153.5 191.9 L155.1 190.9 L156.7 190.0 L158.3 188.9 L159.8 187.9 L161.4 186.7 L163.0 185.6 L164.6 184.3 L166.2 183.1 L167.8 181.7 L169.3 180.3 L170.9 178.9 L172.5 177.4 L174.1 175.9 L175.7 174.3 L177.3 172.7 L178.8 171.0 L180.4 169.3 L182.0 167.5 L183.6 165.7 L185.2 163.8 L186.8 161.9 L188.3 159.9 L189.9 157.9 L191.5 155.8 L193.1 153.6 L194.7 151.5 L196.3 149.2 L197.8 147.0 L199.4 144.6 L201.0 142.2 L202.6 139.8 L204.2 137.3 L205.8 134.8 L207.3 132.2 L208.9 129.6 L210.5 126.9 L212.1 124.2 L213.7 121.4 L215.3 118.5 L216.8 115.7 L218.4 112.7 L220.0 109.8" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/>
<path d="M30 200 L220 200" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M45 136 L70 169.75" fill="none" stroke="#3B82C4" stroke-width="3"/>
<path d="M45 214 Q57.5 226 70 214" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M70 169.75 L105 196" fill="none" stroke="#3B82C4" stroke-width="3"/>
<path d="M70 214 Q87.5 226 105 214" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M105 196 L150 193.75" fill="none" stroke="#3B82C4" stroke-width="3"/>
<path d="M105 214 Q127.5 226 150 214" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M150 193.75 L195 151" fill="none" stroke="#3B82C4" stroke-width="3"/>
<path d="M150 214 Q172.5 226 195 214" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M45 136 L105 196" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="5 3"/>
<path d="M45 200 L45 136" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.5"/>
<circle cx="45" cy="136" r="3.5" fill="currentColor"/>
<circle cx="45" cy="200" r="3.5" fill="currentColor"/>
<path d="M70 200 L70 169.75" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.5"/>
<circle cx="70" cy="169.75" r="3.5" fill="currentColor"/>
<circle cx="70" cy="200" r="3.5" fill="currentColor"/>
<path d="M105 200 L105 196" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.5"/>
<circle cx="105" cy="196" r="3.5" fill="currentColor"/>
<circle cx="105" cy="200" r="3.5" fill="currentColor"/>
<path d="M150 200 L150 193.75" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.5"/>
<circle cx="150" cy="193.75" r="3.5" fill="currentColor"/>
<circle cx="150" cy="200" r="3.5" fill="currentColor"/>
<path d="M195 200 L195 151" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.5"/>
<circle cx="195" cy="151" r="3.5" fill="currentColor"/>
<circle cx="195" cy="200" r="3.5" fill="currentColor"/>
<text x="15" y="200" font-size="11" dominant-baseline="central" fill="currentColor">x</text>
<text x="15" y="20" font-size="11" dominant-baseline="central" fill="currentColor">x²</text>
</svg>
```

計算量のまとめ。n は点の数で、O(...) は入力が増えたときの手間の増え方のおおよその見積もりだ。下界は Ω(n log n) で、1次元でもソートに帰着するのでこれより速くはならない。

| 手法 | 計算量 |
| --- | --- |
| Lawson のフリップ | O(n²) |
| Bowyer–Watson | 期待 O(n log n)、最悪 O(n²) |
| 分割統治（Guibas–Stolfi） | O(n log n) |
| Fortune | O(n log n) |
| 3次元凸包経由 | O(n log n) |

実用上はライブラリに任せればよい。Python なら `scipy.spatial` の `Delaunay` と `Voronoi`（Qhull 経由）で一瞬で出る。

## 性質と応用

ドロネーにはいくつもの近接グラフが包摂される。最近接グラフ ⊆ ユークリッド最小全域木 ⊆ 相対近傍グラフ ⊆ Gabriel グラフ ⊆ ドロネー、という包含列だ。同じ点群で並べると差が見える。

各グラフの定義はこんな感じで、内側ほど辺が疎になる。

- 最近接グラフ（NNG）: 各点から一番近い点へ辺を張る
- ユークリッド最小全域木（EMST）: 全点を総延長最小でつなぐ木
- 相対近傍グラフ（RNG）: 辺 pq について、p, q を中心・|pq| を半径とする2円の重なり（月形）に他の点がない
- Gabriel グラフ: 辺 pq を直径とする円の中に他の点がない

月形は直径円より細い領域なので RNG の条件の方がきつく、辺は少なくなる。Gabriel 辺はドロネー辺の絞り込みなので、全部がドロネーに含まれるのも自然だ。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 10 430 432.4" width="430" height="432" role="img" aria-label="proximity graph chain on one point set: NNG inside EMST inside Gabriel inside Delaunay">
<path d="M20 45 L70 20" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M115 55 L150 30" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M45 100 L10 130" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M45 100 L95 115" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M115 55 L160 100" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M10 130 L40 170" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M95 115 L125 160" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<circle cx="20" cy="45" r="3" fill="currentColor"/>
<circle cx="70" cy="20" r="3" fill="currentColor"/>
<circle cx="115" cy="55" r="3" fill="currentColor"/>
<circle cx="45" cy="100" r="3" fill="currentColor"/>
<circle cx="95" cy="115" r="3" fill="currentColor"/>
<circle cx="10" cy="130" r="3" fill="currentColor"/>
<circle cx="150" cy="30" r="3" fill="currentColor"/>
<circle cx="160" cy="100" r="3" fill="currentColor"/>
<circle cx="40" cy="170" r="3" fill="currentColor"/>
<circle cx="125" cy="160" r="3" fill="currentColor"/>
<text x="85" y="200" font-size="12" text-anchor="middle" fill="currentColor" opacity="0.7">NNG (7)</text>
<path d="M280 45 L330 20" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M330 20 L375 55" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M375 55 L410 30" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M280 45 L305 100" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M305 100 L270 130" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M270 130 L300 170" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M305 100 L355 115" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M355 115 L385 160" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M375 55 L420 100" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<circle cx="280" cy="45" r="3" fill="currentColor"/>
<circle cx="330" cy="20" r="3" fill="currentColor"/>
<circle cx="375" cy="55" r="3" fill="currentColor"/>
<circle cx="305" cy="100" r="3" fill="currentColor"/>
<circle cx="355" cy="115" r="3" fill="currentColor"/>
<circle cx="270" cy="130" r="3" fill="currentColor"/>
<circle cx="410" cy="30" r="3" fill="currentColor"/>
<circle cx="420" cy="100" r="3" fill="currentColor"/>
<circle cx="300" cy="170" r="3" fill="currentColor"/>
<circle cx="385" cy="160" r="3" fill="currentColor"/>
<text x="345" y="200" font-size="12" text-anchor="middle" fill="currentColor" opacity="0.7">EMST (9)</text>
<path d="M20 275 L70 250" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M20 275 L45 330" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M70 250 L115 285" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M45 330 L95 345" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M115 285 L95 345" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M45 330 L10 360" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M115 285 L150 260" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M95 345 L160 330" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M115 285 L160 330" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M150 260 L160 330" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M95 345 L40 400" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M10 360 L40 400" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M95 345 L125 390" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M160 330 L125 390" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M40 400 L125 390" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<circle cx="20" cy="275" r="3" fill="currentColor"/>
<circle cx="70" cy="250" r="3" fill="currentColor"/>
<circle cx="115" cy="285" r="3" fill="currentColor"/>
<circle cx="45" cy="330" r="3" fill="currentColor"/>
<circle cx="95" cy="345" r="3" fill="currentColor"/>
<circle cx="10" cy="360" r="3" fill="currentColor"/>
<circle cx="150" cy="260" r="3" fill="currentColor"/>
<circle cx="160" cy="330" r="3" fill="currentColor"/>
<circle cx="40" cy="400" r="3" fill="currentColor"/>
<circle cx="125" cy="390" r="3" fill="currentColor"/>
<text x="85" y="430" font-size="12" text-anchor="middle" fill="currentColor" opacity="0.7">Gabriel (15)</text>
<path d="M280 275 L330 250" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M280 275 L305 330" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M330 250 L305 330" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M330 250 L375 285" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M375 285 L305 330" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M305 330 L355 345" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M375 285 L355 345" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M280 275 L270 360" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M305 330 L270 360" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M375 285 L410 260" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M330 250 L410 260" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M355 345 L420 330" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M375 285 L420 330" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M410 260 L420 330" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M305 330 L300 400" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M355 345 L300 400" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M270 360 L300 400" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M355 345 L385 390" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M420 330 L385 390" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<path d="M300 400 L385 390" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<circle cx="280" cy="275" r="3" fill="currentColor"/>
<circle cx="330" cy="250" r="3" fill="currentColor"/>
<circle cx="375" cy="285" r="3" fill="currentColor"/>
<circle cx="305" cy="330" r="3" fill="currentColor"/>
<circle cx="355" cy="345" r="3" fill="currentColor"/>
<circle cx="270" cy="360" r="3" fill="currentColor"/>
<circle cx="410" cy="260" r="3" fill="currentColor"/>
<circle cx="420" cy="330" r="3" fill="currentColor"/>
<circle cx="300" cy="400" r="3" fill="currentColor"/>
<circle cx="385" cy="390" r="3" fill="currentColor"/>
<text x="345" y="430" font-size="12" text-anchor="middle" fill="currentColor" opacity="0.7">Delaunay (20)</text>
</svg>
```

内側に含まれるものから、いくつか便利な性質が効いてくる。

- どの点の最近接点もドロネー隣接にあるので、最近接探索の候補は隣接だけに絞れる
- ユークリッド最小全域木の辺は全部ドロネーに含まれる
- ドロネーの辺だけを歩いても、どの2点間も直線距離の定数倍以内の道で行ける（t-スパナ）。この定数の上界は 1.998 未満と示されていて、最近では 1.6 程度まで絞る報告もある

応用をざっと。

- メッシュ生成: 有限要素法などの素地。ただしドロネー単体では点群の強制する細さが残るので、入力とは別に新しい点（Steiner 点）を賢く足していく Delaunay refinement で角度の下限を保証するのが実務。境界を固定したい場合は制限ドロネー（CDT）
- 地形モデリング（TIN）: 標高点群から三角網を作り、補間や等高線へ
- 補間: natural neighbor 補間はボロノイセルの面積比で重みを決める
- ネットワーク・経路: スパナ性を幾何ルーティングの足場に、Gabriel グラフは平面化に使われる。ボロノイ辺は障害物サイトからの最大余白軌道としてロボット経路計画でも使われる
- 形状復元: alpha shapes は、外接円の半径が基準値 α を超える三角形・辺を落としてできるドロネーの部分複体。α を絞るほど点群の輪郭が彫り出される
- 画像・描画: セルの重心にサイトを移す Lloyd 反復を繰り返すとセルが均等化する（重心ボロノイ分割、CVT）。サイトの密度を画像の濃淡に合わせれば stippling / blue noise になる

メディアアート方面での使われ方も面白い。セルの塗り分けはそのままステンドグラス風の見た目になり、三角形のフラット塗りはローポリ風になる。しかも同じ点群から両方出せる。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="5 5 470 235.4" width="470" height="235" role="img" aria-label="generative-art idioms from one point set: filled Voronoi cells (stained glass) and filled Delaunay triangles (low-poly)">
<polygon points="27.7,101.1 15.0,99.6 15.0,15.0 53.8,15.0 84.0,75.5" fill="#3B82C4" fill-opacity="0.35" stroke="currentColor" stroke-width="1"/>
<polygon points="136.5,28.1 96.6,79.4 84.0,75.5 53.8,15.0 138.1,15.0" fill="#E69F00" fill-opacity="0.35" stroke="currentColor" stroke-width="1"/>
<polygon points="174.2,80.8 148.8,106.2 104.3,91.4 96.6,79.4 136.5,28.1" fill="#00A876" fill-opacity="0.35" stroke="currentColor" stroke-width="1"/>
<polygon points="69.8,150.2 27.7,101.1 84.0,75.5 96.6,79.4 104.3,91.4 86.3,151.3" fill="#D55E00" fill-opacity="0.35" stroke="currentColor" stroke-width="1"/>
<polygon points="106.5,171.5 86.3,151.3 104.3,91.4 148.8,106.3 156.2,138.4" fill="#CC79A7" fill-opacity="0.35" stroke="currentColor" stroke-width="1"/>
<polygon points="15.0,191.3 15.0,99.6 27.7,101.1 69.8,150.2" fill="#56B4E9" fill-opacity="0.35" stroke="currentColor" stroke-width="1"/>
<polygon points="174.2,80.8 136.5,28.1 138.1,15.0 210.0,15.0 210.0,75.7" fill="#3B82C4" fill-opacity="0.35" stroke="currentColor" stroke-width="1"/>
<polygon points="156.2,138.4 148.8,106.2 174.2,80.8 210.0,75.7 210.0,169.8" fill="#E69F00" fill-opacity="0.35" stroke="currentColor" stroke-width="1"/>
<polygon points="15.0,191.3 69.8,150.2 86.3,151.3 106.5,171.5 111.0,210.0 15.0,210.0" fill="#00A876" fill-opacity="0.35" stroke="currentColor" stroke-width="1"/>
<polygon points="106.5,171.5 156.2,138.4 210.0,169.8 210.0,210.0 111.0,210.0" fill="#D55E00" fill-opacity="0.35" stroke="currentColor" stroke-width="1"/>
<text x="112" y="228" font-size="12" text-anchor="middle" fill="currentColor" opacity="0.7">Voronoi cells</text>
<polygon points="375.0,35.0 325.0,60.0 350.0,115.0" fill="#3B82C4" fill-opacity="0.45" stroke="currentColor" stroke-width="1"/>
<polygon points="420.0,70.0 375.0,35.0 350.0,115.0" fill="#E69F00" fill-opacity="0.45" stroke="currentColor" stroke-width="1"/>
<polygon points="420.0,70.0 350.0,115.0 400.0,130.0" fill="#00A876" fill-opacity="0.45" stroke="currentColor" stroke-width="1"/>
<polygon points="350.0,115.0 325.0,60.0 315.0,145.0" fill="#D55E00" fill-opacity="0.45" stroke="currentColor" stroke-width="1"/>
<polygon points="375.0,35.0 420.0,70.0 455.0,45.0" fill="#CC79A7" fill-opacity="0.45" stroke="currentColor" stroke-width="1"/>
<polygon points="420.0,70.0 400.0,130.0 465.0,115.0" fill="#56B4E9" fill-opacity="0.45" stroke="currentColor" stroke-width="1"/>
<polygon points="455.0,45.0 420.0,70.0 465.0,115.0" fill="#3B82C4" fill-opacity="0.45" stroke="currentColor" stroke-width="1"/>
<polygon points="400.0,130.0 350.0,115.0 345.0,185.0" fill="#E69F00" fill-opacity="0.45" stroke="currentColor" stroke-width="1"/>
<polygon points="350.0,115.0 315.0,145.0 345.0,185.0" fill="#00A876" fill-opacity="0.45" stroke="currentColor" stroke-width="1"/>
<polygon points="465.0,115.0 400.0,130.0 430.0,175.0" fill="#D55E00" fill-opacity="0.45" stroke="currentColor" stroke-width="1"/>
<polygon points="400.0,130.0 345.0,185.0 430.0,175.0" fill="#CC79A7" fill-opacity="0.45" stroke="currentColor" stroke-width="1"/>
<text x="392" y="228" font-size="12" text-anchor="middle" fill="currentColor" opacity="0.7">Delaunay triangles</text>
<circle cx="45" cy="60" r="3" fill="currentColor"/>
<circle cx="95" cy="35" r="3" fill="currentColor"/>
<circle cx="140" cy="70" r="3" fill="currentColor"/>
<circle cx="70" cy="115" r="3" fill="currentColor"/>
<circle cx="120" cy="130" r="3" fill="currentColor"/>
<circle cx="35" cy="145" r="3" fill="currentColor"/>
<circle cx="175" cy="45" r="3" fill="currentColor"/>
<circle cx="185" cy="115" r="3" fill="currentColor"/>
<circle cx="65" cy="185" r="3" fill="currentColor"/>
<circle cx="150" cy="175" r="3" fill="currentColor"/>
<circle cx="325" cy="60" r="3" fill="currentColor"/>
<circle cx="375" cy="35" r="3" fill="currentColor"/>
<circle cx="420" cy="70" r="3" fill="currentColor"/>
<circle cx="350" cy="115" r="3" fill="currentColor"/>
<circle cx="400" cy="130" r="3" fill="currentColor"/>
<circle cx="315" cy="145" r="3" fill="currentColor"/>
<circle cx="455" cy="45" r="3" fill="currentColor"/>
<circle cx="465" cy="115" r="3" fill="currentColor"/>
<circle cx="345" cy="185" r="3" fill="currentColor"/>
<circle cx="430" cy="175" r="3" fill="currentColor"/>
</svg>
```

実例もいくつかある。Golan Levin は Voronoi の網目をポートレートに重ねたシリーズを雑誌のために作っていて、Raven Kwok は来場者の顔からサイトを生成するインタラクティブ展示を UCCA に納めている。ローポリ風の Delaunay ポートレートは定番のジャンルだ。リンクは参照メンバーにまとめてある。

## その先

- 3次元: 空球性で四面体分割になる。ただし角度の最適性は消え、外接球が空でも sliver と呼ばれるペラい四面体が残る。四面体数は最悪 Θ(n²)
- 制限ドロネー（CDT）: 指定した辺を必ず残す緩和版。実務のメッシュや GIS はこちら
- 重み付き: サイトに重み（円の半径など）を持たせ、距離から重みを引いて比較する版。power diagram（Laguerre–Voronoi）と、それに双対する正則三角形分割に対応
- 高次ボロノイ: 「k 番目に近い点」で分割する版。その逆に「一番遠い点」での分割が farthest-point ボロノイ

## まとめ

- ボロノイ図は「一番近い点」で平面を割り分けたもの。セルの角は空の外接円の中心
- ドロネー三角形分割はその双対。空円性・最小角最大化と同じものの別の顔
- どちらも「ただの点」から隣接関係を引き出す仕組みで、だからこそメッシュ生成からメディアアートまで使い道が広い

参考にした資料は[別メンバー](01-references.md)にまとめてある（AI が集めたもの、各項目に確認範囲つき）。図の生成器は `tools/svg-gen/examples/fig-*.ts`、共有の点群と幾何プリミティブは同じく `examples/geom.ts` にある。
