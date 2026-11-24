# 放置のしやすさの比較

「書き終わったあとどれくらい放っておけるか」という観点で、元の MPA 版とこの SPA 版を比べる。

## 依存面積

| | MPA ([podhmo/go-classic-mpa-sample](https://github.com/podhmo/go-classic-mpa-sample)) | SPA ([podhmo/go-spa-sample](https://github.com/podhmo/go-spa-sample)) |
| :--- | :--- | :--- |
| Go 直接依存 | 3 (goldmark-alert, goldmark/v2, modernc.org/sqlite) | 2 (x/crypto, modernc.org/sqlite) |
| npm 直接依存 | 0（package.json 自体が無い） | 16（prod 6 + dev 10） |
| node_modules 実数 | 0 | 197 ディレクトリ |
| クライアント JS | 手書き 18 ファイル（依存なし） | React 19 + TSX 29 ファイル |
| テンプレート | 25 | 0（JSX） |

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="31.100000000000023 0 381.4 154" width="381" height="154" role="img" aria-label="放置のしやすさに効く依存面積。SPA は npm 直接依存16個から node_modules 実数が約200に膨らむ">
<rect x="176" y="118" width="208" height="26" rx="8" fill="currentColor" fill-opacity="0.08" stroke="none"/>
<text x="172" y="19" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor">MPA: Go 直接依存</text>
<rect x="180" y="10" width="3.045685279187817" height="18" fill="#3B82C4" fill-opacity="0.45" stroke="#3B82C4" stroke-width="1"/>
<text x="189.0456852791878" y="19" font-size="10" dominant-baseline="central" fill="currentColor" opacity="0.7">3</text>
<text x="172" y="47" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor">MPA: npm パッケージ</text>
<rect x="180" y="38" width="0" height="18" fill="currentColor" fill-opacity="0.45" stroke="currentColor" stroke-width="1"/>
<text x="186" y="47" font-size="10" dominant-baseline="central" fill="currentColor" opacity="0.7">0</text>
<text x="172" y="75" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor">SPA: Go 直接依存</text>
<rect x="180" y="66" width="2.030456852791878" height="18" fill="#D55E00" fill-opacity="0.45" stroke="#D55E00" stroke-width="1"/>
<text x="188.03045685279187" y="75" font-size="10" dominant-baseline="central" fill="currentColor" opacity="0.7">2</text>
<text x="172" y="103" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor">SPA: npm 直接依存</text>
<rect x="180" y="94" width="16.243654822335024" height="18" fill="#D55E00" fill-opacity="0.45" stroke="#D55E00" stroke-width="1"/>
<text x="202.24365482233503" y="103" font-size="10" dominant-baseline="central" fill="currentColor" opacity="0.7">16</text>
<text x="172" y="131" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor">SPA: node_modules 実数</text>
<rect x="180" y="122" width="200" height="18" fill="#D55E00" fill-opacity="0.45" stroke="#D55E00" stroke-width="1"/>
<text x="386" y="131" font-size="10" dominant-baseline="central" fill="currentColor" opacity="0.7">197</text>
</svg>
```

最下段の薄い帯が node_modules の実数。直接依存の16個が間接を含めて約200になる。棒はプロジェクトごとに色分け（青系が MPA、橙系が SPA — MPA 2行目は 0 なので棒自体が見えない）。

## dependabot は要るか

- MPA: Go 3 依存のみで全部 mature（goldmark は機能的に枯れている、modernc.org/sqlite は CGo なしの standard lib 的立ち位置）。加えて `package.json` が無いので npm audit の対象が存在しない。`govulncheck` を時々回す程度で十分。dependabot を置く意義は薄い
- SPA: npm 面積が圧倒的に大きいので dependabot または renovate は実質必須。`package-lock.json`（315 の resolved エントリ）は commit 済みで再現ビルドは可能だが、古い lockfile そのものが audit で赤くなる。prod 依存を react + router + markdown 系の6個に絞ったのは、放置耐性の観点では正しい選択だと思う。dev 依存（vite/vitest/typescript/oxlint/playwright）はバージョンが回るのが速い分、手を入れないと腐る

## 依存ライブラリの終了リスク

両者共通は modernc.org/sqlite。メンテが止まっても「既に動くバイナリを作れる」ので致命的ではない。そもそも Go のバージョンも sqlite のバージョンも固定しておいて特に困ることはなく、セキュリティアップデート以外で追従する必要はない。追従が必要になるのはライブラリが終了し、かつセキュリティ修正が出たときくらい、と考えるのが妥当だろう。

SPA 固有のリスク:

- TanStack Router — v1 系でまだ動きが速い。useBlocker、loader invalidate、scrollRestoration を深く使っているので、破壊的変更の影響範囲は広い
- react-markdown + remark 系 — unified/mdast の ecosystem。メジャーバンプ時に plugin 間の整合を見る必要がある
- vitest browser mode + playwright — dev 依存だが、browser mode の API（page.getByRole 等）は変わりやすい領域

MPA 固有のリスクは、むしろ「依存しない」ことの裏側: 手書き JS 18 ファイルは外部変更の影響を受けないが、ブラウザ API の非推奨化（Element.startViewTransition、Invoker Commands、closedby 等の新しめの API）には自分で追従しないと静かに退化する。ただしすべて progressive enhancement なので退化しても基本機能は動く、という設計になっている。

## 補足: CI の有無は本質的ではない

MPA は `.github/` が無く CI 自体が存在しない。SPA は `go + web` の CI workflow がある。ただしこれは技術選定とは無関係の単なる不足事項で、MPA にも後から足せばよいだけの話。SPA 化で得た性質でも MPA 化で失った性質でもないので、放置のしやすさの比較からは外して考えるのが正しい。最初はここを「MPA の盲点」と書いていたが、指摘を受けて修正した。

## 結論

「ビルドとランタイムを放っておけるか」で言えば MPA が圧倒的に楽。単一バイナリ + embed + 依存3個 + JS は全部自前、という構成は文字通り「何も更新しなくても何年も動く」。

SPA は lockfile があるので再現ビルド自体はできるが、npm 面積が大きい分だけ audit 警告や dependabot の対応コストが発生する（CI は前述のとおり技術選定と無関係なので比較には入れない）。放置したいなら prod deps の薄さが命なので、今後「便利だから」で依存を増やすときは npm 面積の増分を意識するとよい。dependabot を入れるなら SPA 側だけで足り、MPA は govulncheck の定期実行で十分、というのが今回の整理の答え。
