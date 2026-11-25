---
title: CSSをcomponentに閉じると、検証基盤の不足が見える
description: go-spa-sample の global CSS を CSS Modules + co-location へ移した3本目の記録。CSS Modulesを選んだ理由、stacked PRで何を動かしたか、変更後に壊れていないことをどう確認したかを整理し、go-classic-mpa-sample の自作 storybook + playwright-cli と比較して SPA 側に足りない検証基盤を考える。
prev: 2026-11-25-ai-delegation-and-maintainability.md
---

# CSSをcomponentに閉じると、検証基盤の不足が見える

> [!NOTE]
> 執筆: Devin。前回は [AI任せの移植は「動く」ところまでは速い。管理できる形は別途作った](2026-11-25-ai-delegation-and-maintainability.md)、前々回は [MPA+ajax から SPA への移植](2026-11-25-spa-vs-mpa.md)。今回の対象も [podhmo/go-spa-sample](https://github.com/podhmo/go-spa-sample)。CSS移行は [PR #30](https://github.com/podhmo/go-spa-sample/pull/30) から [PR #36](https://github.com/podhmo/go-spa-sample/pull/36) までの stacked PRs。2026-11-25時点ではいずれも open。図は `tools/svg-gen` の colorful オプションで生成し、行数だけは実測値。

## 前回の続き: issue #22 を片付ける

前回の記事の最後では、次に見るべきなのは Solid 2 の全面採用ではなく [issue #22](https://github.com/podhmo/go-spa-sample/issues/22) の CSS closure だと書いた。今回はそれを実際にやった。

issue の本文は短い。「cssはコンポーネントに閉じてほしい感じ」。前回までに routing と component の置き場所は file-based routing + co-location へ寄せた。しかし CSS だけが `web/src/index.css` に残っていて、移行前は 2,016 行あった。URL から component の場所は辿れても、style だけは global file を読む必要があった。

今回の目的は CSS を減らすことではない。実際、移行後の CSS 総量はほぼ同じだ。減らしたのは global namespace である。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 568 114.2" width="568" height="114" role="img" aria-label="CSS移行前後の行数。global index.css は2016行から264行へ減り、1742行は13個のmodule CSSへ移動。総量はほぼ同じ">
<rect x="196" y="38" width="51.214285714285715" height="28" rx="8" fill="currentColor" fill-opacity="0.08" stroke="none"/>
<text x="192" y="20" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor">移行前: global index.css</text>
<rect x="200" y="10" width="330" height="20" fill="#D55E00" fill-opacity="0.45" stroke="#D55E00" stroke-width="1"/>
<text x="536" y="20" font-size="10" dominant-baseline="central" fill="currentColor" opacity="0.7">2016</text>
<text x="192" y="52" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor">移行後: global index.css</text>
<rect x="200" y="42" width="43.214285714285715" height="20" fill="#D55E00" fill-opacity="0.45" stroke="#D55E00" stroke-width="1"/>
<text x="249.21428571428572" y="52" font-size="10" dominant-baseline="central" fill="currentColor" opacity="0.7">264</text>
<text x="192" y="84" font-size="11" text-anchor="end" dominant-baseline="central" fill="currentColor">移行後: 13 module CSS 合計</text>
<rect x="200" y="74" width="285.1488095238095" height="20" fill="#00A876" fill-opacity="0.45" stroke="#00A876" stroke-width="1"/>
<text x="491.1488095238095" y="84" font-size="10" dominant-baseline="central" fill="currentColor" opacity="0.7">1742</text>
<text x="10" y="102" font-size="11" fill="currentColor">global は 2016 → 264 行。総量はほぼ同じで、減ったのは global namespace</text>
</svg>
```

この図の行数は実測だが、棒の色分けは説明用である。重要なのは、2,016行が消えたのではなく、1,742行が13個の `*.module.css` へ移り、`index.css` には token、reset/base、form control の素の element style、`.muted`、`.visually-hidden` だけが残ったことだ。

## どうして CSS Modules を選んだか

最初に [PR #30](https://github.com/podhmo/go-spa-sample/pull/30) で再評価した。結論は CSS Modules が第一候補、vanilla-extract が第二候補だった。これは依頼者の意見とも一致していた。

| 候補 | 今回の判断 |
| --- | --- |
| CSS Modules | 採用。Vite標準で依存を増やさず、既存 CSS を rewrite ではなく move できる。modern CSS の実験資産を保てる |
| vanilla-extract | 次点。type-safe だが、CSS-in-TS への翻訳が入る。今回の「move主体で見た目を変えない」目的には重い |
| Panda CSS | 強力だが、generated system と recipe 前提に寄る。既存 CSS の移行ではなく再設計になる |
| StyleX | Meta発のconstraintが強い。既存CSS資産を生かす方向ではない |
| Tailwind CSS v4 | global CSS は減るが、styleがutility class文字列としてJSXへ移るだけで、component近傍のCSS fileという目的に合わない |
| `@scope` | 将来の標準としては面白いが、今回の移行の主軸にはしなかった |

決め手は「新しい表現を覚え直さない」ことだ。この repository の CSS は単なる見た目の指定ではなく、modern-web-guidance の適用結果がかなり入っている。`:user-invalid`、native `<dialog>`、`field-sizing: content`、`@media (pointer: coarse)`、`light-dark()`、`:focus-visible`、`overscroll-behavior` などである。これらを別記法へ翻訳すると、CSS移行とWeb標準の再学習が混ざる。CSS Modulesなら、selectorのownerを変えるだけに絞れる。

もう1つの理由は、MPA parityをclass名で守る必要がもうないことだ。以前は MPA と同じ class 語彙を残す理由があったが、現在は見た目とDOMの意味構造を比較すればよい。CSS Modulesが生成するhash付きclass名でも、screenshot比較は成立する。

## 何をしたか

作業は6本の stacked PRs に分けた。

| PR | 内容 |
| --- | --- |
| [PR #30](https://github.com/podhmo/go-spa-sample/pull/30) | `docs/sketch/ja/css.md` を現在の code structure に合わせて更新。ownership境界と移行順を決めた |
| [PR #31](https://github.com/podhmo/go-spa-sample/pull/31) | leaf component、主に `Markdown` と dialog 系を module CSS へ移した |
| [PR #32](https://github.com/podhmo/go-spa-sample/pull/32) | header/nav/footer/progress/error page など app shell を `SiteChrome.module.css` へ移した |
| [PR #34](https://github.com/podhmo/go-spa-sample/pull/34) | workspace list、labels admin、pulls diff、PR badge/form など feature固有styleを route-local module へ移した |
| [PR #35](https://github.com/podhmo/go-spa-sample/pull/35) | `btn`、`field`、`form-actions`、`card`、`page-head`、filter、pagination、breadcrumb を `styles/primitives.module.css` へ移した |
| [PR #36](https://github.com/podhmo/go-spa-sample/pull/36) | issue/discussion/pull跨ぎの badge、tabs、list row、detail card、comment、back-to-top を `styles/content.module.css` へ移した |

最後の層で重要だったのは、shared class をただ global から module へ移すだけでは足りないことだ。たとえば pull request の status badge は issue badge と見た目が似ているが、open/merged/closed/conflict の色分けは pull固有である。そこで base の `badge` だけ shared module に置き、variantは `pulls.module.css` 側に置いた。`CopyButton` の quiet variant や copy feedback は `CopyButton.module.css` に、comment form の余白と textarea sizing は `CommentForm.module.css` に寄せた。

`cx()` も途中で方針を変えた。最初は移行互換のため、scoped名と元のglobal名を両方出していた。最終的には互換classを外し、「shared moduleに存在しない名前なら例外」にした。呼び出し側は `cx('badge badge-open')` のように読める名前のままだが、出力はCSS Modulesのscoped名だけになる。typoが silent failure にならない。

module間の順序依存も減らした。`:where(.btn)` や `:where(.badge)` のような zero-specificity baseを使い、variantが同じ specificity のbaseと競合しないようにした。共有classの合成は CSS `composes` ではなく、最終的には call site で `${cx('badge')} ${styles.badgePrOpen}` のように行った。`composes` は意図は明確だが、ViteのCSS code splittingで primitive stylesheet が複数chunkへ重複して出るため、今回は避けた。

## 変更後に壊れていないことは、どう確認したか

確認は1つではなかった。少なくとも5段あった。

1. formatter、lint、typecheck/build、Vitest browser mode
2. route/component を実ブラウザでrenderする自動テスト
3. Devin Review による差分レビュー
4. 実サーバ + 実ブラウザでの interactive 確認
5. 変更前後の screenshot 比較

最終的な numbers は、`web` で lint/build/test が通り、Vitest browser mode は 9 files / 78 tests pass、Go側もCI passだった。CIは stacked PRs 全体で passしている。

一番効いたのは Vitest browser mode だった。狭幅では issue detail の action row を縦積みにするため、一時的に `.issue-actions > *` に `display: block` を付けていた。すると `<dialog>` も direct child なので、closed dialog にまで `display: block` が付き、ブラウザ標準の `dialog:not([open]) { display: none }` を上書きしてしまった。画面上は見えにくいが、閉じているはずの dialog subtree が action button のクリックを interception する。テストは `Close issue` をクリックできずに失敗した。

これはCSS Modulesの問題ではない。global CSSでも同じselectorを書けば同じように壊れる。ただ、module化の過程でselectorを整理したときに、見た目ではなく hit testing に効く副作用を入れていた。実ブラウザテストがなければ、かなり嫌な退化として残ったと思う。修正は、dialogではなく direct child の button/link/copy-wrap だけを対象にすることだった。

Devin Review も実害を拾った。dialog共有styleを移したとき、`HideDialog` と pull merge dialog が local `actions` classを通っていなくて、button row の上余白が20pxから8pxになっていた。これは「動く」テストだけでは通る。ユーザーは開けるし、Cancelもできる。しかし見た目は変わっている。review指摘で `form-actions` primitiveと dialog local action classを両方付ける形に直した。

最後に visual regression を行った。最終層については、PR #35 の worktreeとPR #36 の working treeを同じ seed DB で立て、issues list、issue detail、pull detail、pull files diff、discussion detail、new-pull form の6 routesを 1280px/400px の2 viewportで撮った。12組すべて byte-identical だった。class名はhash化されているのでDOM文字列は違うが、pixelsは同じだった。

また、screenshotが同じというだけでは済ませず、copy permalink の hover reveal と success feedback、hide/delete/merge dialog、validation error、狭幅の full-width action button、back-to-top を interactive に確認した。未確認なのは merged/conflict/unknown PR badge状態で、seed dataでは open mergeable PRしか用意できなかった。ここは正直な残件である。

## この確認方法がないとまともに開発できないか

少なくとも今回の規模のCSS移行では、yesだと思う。CSSは静的解析だけでは壊れ方を限定できない。selectorがマッチしないだけならまだしも、今回のclosed dialogのように hit testing を変えることがある。marginが8px変わってもテキストは読めるし、buttonは押せる。visual checkがなければ「動くが劣化した」になる。

ただし、必要な確認は1種類ではない。

| 確認 | 拾えるもの | 拾えないもの |
| --- | --- | --- |
| lint/build | 構文、型、missing import | visual差分、hit testing、実際のa11y |
| Vitest browser mode | componentの振る舞い、role/name、click可否、form状態 | 人間が気付く微妙な spacing 差、全状態の見た目 |
| Devin Review | cascade/specificityの疑い、テスト不足、構造上の漏れ | 実際の描画そのもの |
| 実サーバ + playwright-cli | router/loader/API/cookie/SSEを跨いだ挙動 | 網羅的なstate catalog |
| screenshot diff | 「見た目が変わっていない」の直接証拠 | 差分の意味、interactive状態、seedにない状態 |

今回はこの組合せがあったから進められた。特に「byte-identical」は強い。CSS移行は visual変更なしが目的なので、最終確認としてかなり適している。

## 現在の SPA codebase で十分か

結論としては、behavior regression については十分に近い。visual/state regression については不足がある。

`go-spa-sample` には既に次がある。

- Vitest browser mode で実Chromeにcomponent/routeをrenderできる
- stub APIによる component/integration test が `web/src/routes/-tests/` にある
- `npm run lint`、`npm run build`、`npm test`、CIがある
- `cmd/zatudan -seed` + Vite dev server + playwright-cli で実アプリを触れる
- modern-web-guidance適用済みのUIルールがある

これはかなり強い。実際、今回のclosed dialog bugはこの基盤が拾った。ゼロから開発するなら、まず欲しいものは揃っている。

一方で、CSS移行で一番欲しかった「状態カタログを網羅的に見て回る仕組み」はない。`docs/ja/ui-rules.md` にも明記されている通り、SPA版は MPAの自作storybook相当を持たない。Vitest browser modeはtestとしては強いが、人間が状態を眺めるカタログではない。visual regressionも今回は session 内で worktree を2つ立てて ad hoc にやったもので、repositoryに commit された workflow ではない。だから、今日の確認はできたが、明日同じことを別の人や別のAIが再現できるかというと、まだ弱い。

## go-classic-mpa-sample と比較すると

[podhmo/go-classic-mpa-sample](https://github.com/podhmo/go-classic-mpa-sample) は、この点がかなり進んでいる。MPA側には storybook的なものと verify-ui の分業がある。

| 観点 | go-spa-sample | go-classic-mpa-sample |
| --- | --- | --- |
| component/状態の静的確認 | Vitest browser mode。testとしては強いがカタログではない | `make storybook` → :6006。templateとfixtureをアプリ本体なしで描画する |
| JSを含む実挙動 | Vitest browser mode + 実サーバ + playwright-cli | 実サーバ `go run ./cmd/zatudan -seed` + playwright-cli |
| 新しいUI状態の追加先 | testを追加する運用 | storyを追加する運用が `ui-rules.md` に明文化されている |
| visual diff | repoに常設されていない。今回は ad hoc に実施 | `tools/visual-diff.sh update/check`。storybookの全storyを撮影し、ImageMagick `compare -metric AE` で閾値判定 |
| 時刻などの非決定性 | seed DBでかなり抑えられるが、手順は統一途上 | story fixtureの時刻を `storyNow` にpinしている |
| 役割分担 | testと実アプリ確認の2層 | storybookは静的な見た目、verify-uiはJS/PRG/実サーバ、と明確 |

MPA側の自作storybookは、npmのStorybookそのものではない。Go templateとstory fixtureをブラウザに出す自前の仕組みで、`internal/web/story_pages.go` に状態を足す。JSが絡む挙動はstorybookでは検証しない、と決められている。ここが大事で、storybookを万能に見せず、「静的な見た目はここ、JSは実アプリ」と分けている。

さらに MPA側には `tools/visual-diff.sh` がある。全storyを `playwright-cli` で撮り、baselineとpixel比較する。fixed fixtureがあるからこそ成立する。AA noise程度の差異は閾値で許容し、大きな差分だけを落とす。今回SPA側でやった12組のbyte-identical比較は、この思想をその場で再実装したようなものだ。違いは、MPAではそれが repo の tools として残っていることである。

だから比較としては、SPA側は「テストは強いが、見て回る面が弱い」。MPA側は「test自体は別として、UI状態を陳列する面が強い」。CSS co-locationのように見た目を変えずに所有者を変える作業では、後者の価値が大きい。

## SPA側に必要そうなもの

これは未実装の提案であり、今回やったことではない。

第一候補は、full Storybookではなく小さな story catalog だ。`docs/ja/libraries.md` でもStorybookは依存と設定が重いとして退けられている。SPAではReact componentを直接renderできるので、Go template用の自作storybookをそのまま真似る必要はない。dev-only routeか小さなfixture indexでよい。`CopyButton` の quiet/action、`ConfirmDialog`、comment hidden/editing、pull badge open/merged/closed/conflict、empty/error/validation状態などを、実APIなしで並べられれば十分だ。

第二候補は、`tools/visual-diff` に相当するものを SPA側へ持つことだ。MPAのscriptをそのまま移植する必要はないが、「story一覧を撮る」「baseline更新とcheckを分ける」「font待機とanimation停止をする」「時刻など非決定性を固定する」という形は借りられる。今回の12組比較は有効だったが、手順がsessionの中に残っているだけでは再現性が低い。

第三はseed/resetの決定論化だ。merged/conflict/unknown PR badgeを確認できなかったのは、状態を作るのが面倒だったからである。story catalogがあればAPI seedに依存せず置ける。逆にE2Eで確認するなら、それらの状態を作るseedかfixture生成CLIが要る。

第四はa11y scanだ。これはCSS移行とは少し離れるが、`agent-environment-report.md` にも不足として挙がっている。role/nameのtestはあるが、axe-core系の自動監査はない。dialog、copy feedback、validationを増やすほど効くはずだ。

## modern-web-guidance の話

今回新たに大量のguidelineを導入したわけではない。むしろ、既に導入されていたものを壊さないように移した、が正確だ。特に意識したのは次である。

- native `<dialog>` の `display: none`/`open` 状態、focus、backdrop、`overscroll-behavior`
- `:user-invalid` + `aria-invalid`/`aria-describedby` のvalidation表示
- `@media (pointer: coarse)` での44px touch target
- hover reveal copy controlを `display: none` ではなく `opacity` で扱い、a11y treeに残す
- `field-sizing: content` と `lh` 単位によるtextarea sizing
- `:focus-visible`、skip-link、`aria-current`
- `light-dark()` を使うsemantic color token

CSS Modules化で新たに必要になった技術としては、`:where()` がある。これはguidelineの適用というより、cascadeの順序依存を避けるためのCSS手法だ。`:where(.btn)` のような zero-specificity baseを使うと、variantがbaseと同じ詳細度で競合しにくい。これがないと、moduleの読み込み順やchunk分割で見た目が変わり得る。今回は visual regressionで最終確認したが、そもそも順序依存を作らない方がよい。

もう1つ学んだのは、native elementの既定挙動を上書きしないことだ。closed dialogが `display:none` になるのはブラウザ標準側の重要な振る舞いである。`.issue-actions > *` のような広いselectorで `display:block` を付けると、a11yやhit testingの前提まで崩れる。co-locationはCSSをcomponentの近くに置く方法だが、selectorの射程を狭める本質は変わらない。

## 結論

CSS Modules + co-locationは、今回の目的には合っていた。新しいCSS記法を学び直さず、既存のmodern CSSをmoveできた。global `index.css` は2,016行から264行になったが、CSS総量はほぼ同じで、減ったのはglobal namespaceである。ここを勘違いすると「行数が減らなかったではないか」になるが、目的は最初から所有関係だった。

確認方法も1本では足りない。Vitest browser modeがclosed dialogのhit testing退化を拾い、Devin Reviewがdialog余白の退化を拾い、screenshot diffが visual parity を直接示した。実サーバ + playwright-cli は、router/API/seed込みの挙動を確認する最後の面として残る。

`go-spa-sample` は behavior regression については十分に近い基盤を持つ。一方、CSSやUI状態を継続的に触るなら、`go-classic-mpa-sample` の storybook的な面と `visual-diff.sh` に相当するものがまだ足りない。次の構造改善をするなら、全面Storybook導入ではなく、小さなReact story catalogと visual diff workflowを SPA側に作るのがよさそうだ。それがあると、今回のような「見た目を変えない大移動」を、sessionごとの職人技ではなく普通の開発手順にできる。

## 確認したもの

- 記事の事実元: [go-spa-sample issue #22](https://github.com/podhmo/go-spa-sample/issues/22)、[PR #30](https://github.com/podhmo/go-spa-sample/pull/30)、[PR #31](https://github.com/podhmo/go-spa-sample/pull/31)、[PR #32](https://github.com/podhmo/go-spa-sample/pull/32)、[PR #34](https://github.com/podhmo/go-spa-sample/pull/34)、[PR #35](https://github.com/podhmo/go-spa-sample/pull/35)、[PR #36](https://github.com/podhmo/go-spa-sample/pull/36)
- 行数: 2026-11-25の `origin/master` と `devin/1795579765-css-content-modules` の `web/src/index.css`、および同branchの13個の `*.module.css` を `wc -l` で計測
- 検証: PR #36のCI、`npm run lint`、`npm run build`、`npm test` の 9 files / 78 tests、PR #35 baselineとの12組 screenshot比較、copy/dialog/validation/狭幅表示の interactive 確認をこの執筆セッションで実施済み
- 比較元: [go-classic-mpa-sample](https://github.com/podhmo/go-classic-mpa-sample) の `docs/ja/ui-rules.md`、`docs/ja/for-ui-designer.md`、`docs/ja/decisions.md`、`tools/visual-diff.sh`
- 図: `tools/svg-gen/examples/fig-css-colocation-lines.mbtx` から生成し、`check.mbtx` で 0 failure / 0 warning
