---
title: .mbtx の import はどう解決されるか
description: moon run file.mbtx が front matter の import をどう解決するかを moon (moonbitlang/moon) のソースで調べた記録。front matter の文法、バージョン解決に使うローカルレジストリ index、依存の実体化先 .mooncakes、そしてローカル開発用の vendoring がなぜ動くのか。
prev: ../2026-11-23-moonbit-port-for-quality.md
---

# .mbtx の import はどう解決されるか

> [!NOTE]
> 執筆: Devin。調査対象は [moonbitlang/moon](https://github.com/moonbitlang/moon)（読んだ版は moon 0.1.20261119、commit 738607b）。動機は[svg-gen の MoonBit 移植](../2026-11-23-moonbit-port-for-quality.md)で出てきた「.mbtx は registry のモジュールしか import できない」という制約の裏側を確かめること。

## 問いと結論

`.mbtx` スクリプトの先頭に書く `import { "podhmo/svg-gen" @s }` は、誰がどう解決しているのか。moon（CLI）がやるのか、コンパイラ（moonc）がやるのか。

結論は moon CLI 側。`crates/moonbuild/src/prepare/single_file/` が front matter を読んで依存を解決し、`mooncake` がレジストリからソースを取って `.mooncakes/` に展開する。コンパイラには解決済みのパッケージパスしか渡らない。レジストリという概念を持つのは moon のビルド系だけだ。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 30 682 145.8" width="682" height="146" role="img" aria-label="how moon run resolves .mbtx imports: parse front matter, resolve via the registry index, sync the cache, materialize .mooncakes, then compile">
<rect x="10" y="40" width="110" height="44" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="65" y="62" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">1. front matter</text>
<text x="65" y="100" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">moon.pkg syntax</text>
<rect x="148" y="40" width="110" height="44" rx="8" fill="none" stroke="#E69F00" stroke-width="1.5"/>
<text x="203" y="62" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">2. resolve</text>
<text x="203" y="100" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">registry index</text>
<path d="M124 62 L144 62" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/><path d="M135 66.05 L144 62 L135 57.95" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/>
<rect x="286" y="40" width="110" height="44" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="341" y="62" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">3. sync</text>
<text x="341" y="100" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">registry cache</text>
<path d="M262 62 L282 62" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/><path d="M273 66.05 L282 62 L273 57.95" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/>
<rect x="424" y="40" width="110" height="44" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="479" y="62" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">4. materialize</text>
<text x="479" y="100" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">.mooncakes/</text>
<path d="M400 62 L420 62" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/><path d="M411 66.05 L420 62 L411 57.95" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/>
<rect x="562" y="40" width="110" height="44" rx="8" fill="none" stroke="#CC79A7" stroke-width="1.5"/>
<text x="617" y="62" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">5. compile</text>
<text x="617" y="100" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">moonc</text>
<path d="M538 62 L558 62" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/><path d="M549 66.05 L558 62 L549 57.95" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/>
<text x="340" y="150" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">stages 1-4: moon CLI (moonbuild + mooncake)</text>
<text x="340" y="164" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">stage 5: the compiler sees only resolved package paths</text>
</svg>
```

## メンバー

- [01-front-matter](01-front-matter.md): front matter の文法。`import` と `permission` だけが許される moon.pkg 構文、受け付けるパスの形
- [02-resolution](02-resolution.md): バージョン無しの import がローカル index だけを見て解決される話。`@version` を書けば index 不要
- [03-materialization](03-materialization.md): 解決した依存が `_build/<file>.mbtx/.mooncakes/` に展開される仕組み。合成モジュールと lock file
- [04-vendoring](04-vendoring.md): ローカル vendoring がなぜ動くのか。registry が要求する2つの成果物を手で用意する話

## 背景の確認

`moon run` に `.mbt` を渡すと deprecated 警告が出る。`moonbuild/src/prepare/single_file.rs` で「Standalone `.mbt` files are deprecated. Use `.mbtx` for scripts and declare imports in front matter.」と warning を出している。`.md`（MbtMd）はまた別の front matter 形式（`moonbit` セクションに deps/import/backend）を持つ。
