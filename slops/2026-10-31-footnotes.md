---
title: このブログの Markdown に脚注を入れた
description: tinymarkdown が `[^label]` 参照と `[^label]: 本文` 定義を読むようになった。複数ファイルを 1 ページに描くときの採番とアンカーの決め方、削った機能と残した細かい挙動の記録。
prev: 2026-10-30-pi-sarashina-dogfooding.md
next: 2026-10-31-svg-gen-figures.md
---

# このブログの Markdown に脚注を入れた

issue #75「脚注を追加したい」に対応して、このブログの小さな Markdown 処理系（tinymarkdown）が脚注を読むようになった。Go と MoonBit の両方に同じ仕様で入れてある。この記事自体が脚注を使っているので、描画の確認も兼ねている[^meta]。

## 書き方

本文中に `[^ラベル]` と書くと上付きの番号になり、行頭から `[^ラベル]: 本文` と書いた行がその注の定義になる。番号は参照が初めて出てきた順に振られるので、定義の位置や順番とは無関係になる[^order]。定義は文書のどこに書いてもよく、この記事でもまとめて最後に置いている。

## 決めたこと

### 定義は文書の外に持つ

構文木では、定義行はブロック列に残らず `Document.Footnotes` に集まる。どこに書かれた定義でも文書全体で共有されるので、引用や `<details>` の中に書いた定義も拾われる[^nested]。同じラベルが二度出たら先に書いた方が勝つ。

### 描画は文書ごと

バンドルのページは、表のファイル（face）と各メンバーを 1 ページに並べて描く。脚注は文書ごとに採番し、アンカーは `fn`, `fn-1`, ... とページの見出しアンカー採番機から引いた接頭辞で分ける。なので 2 つのファイルがどちらも `[^1]` を使っていても、別々の注として `#fn:1` と `#fn-1:1` に分かれる。これが issue に書いた「複数ファイルを描画したときにどうなるか」の答えになった。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 240" width="560" height="240" aria-label="1 ページに描かれる 2 つの文書が、それぞれ自分の脚注一覧を持つ図">
  <rect x="20" y="20" width="250" height="90" fill="none" stroke="currentColor" stroke-width="1.5" rx="4"/>
  <text x="35" y="45" font-size="14" fill="currentColor">face（README.md）</text>
  <text x="35" y="70" font-size="13" fill="currentColor">本文 a[^1]</text>
  <rect x="45" y="80" width="200" height="20" fill="none" stroke="currentColor" stroke-dasharray="4 3" rx="3"/>
  <text x="55" y="95" font-size="12" fill="currentColor">footnotes（id="fn:1"）</text>
  <rect x="290" y="20" width="250" height="90" fill="none" stroke="currentColor" stroke-width="1.5" rx="4"/>
  <text x="305" y="45" font-size="14" fill="currentColor">member（x.md）</text>
  <text x="305" y="70" font-size="13" fill="currentColor">本文 b[^1]</text>
  <rect x="315" y="80" width="200" height="20" fill="none" stroke="currentColor" stroke-dasharray="4 3" rx="3"/>
  <text x="325" y="95" font-size="12" fill="currentColor">footnotes（id="fn-1:1"）</text>
  <text x="35" y="140" font-size="13" fill="currentColor">同じ [^1] でも、文書ごとに別の注・別のアンカー。</text>
  <text x="35" y="165" font-size="13" fill="currentColor">a[^1] → #fn:1、tは face の脚注 1</text>
  <text x="35" y="190" font-size="13" fill="currentColor">b[^1] → #fn-1:1、member の脚注 1</text>
</svg>
```

### 描画されないもの

- 定義がない参照 `[^なし]` は、機械的に解釈せず `[^なし]` の文字列のまま出す。未定義の注をリンクにしても行き先がないので、書いた人に分かる形で残す方がよいと判断した
- 逆に、参照されない定義は一覧にも出さない。どこからも跳べない注は読者に届かない[^dangling]
- ラベルの比較は大文字小文字を区別する。`[^A]` と `[^a]` は別物

### その他の細かい挙動

- `[^x](u)` は脚注ではなく、テキストが `^x` のリンクになる（`]` の直後に `(` があるため）
- コードスパンやリンクのテキストの中では `[^x]` は効かない
- 定義の本文は文書として再パースされるので、段落だけでなくリストやコードブロックも入る。バックリンクの `↩︎` は最後が段落ならその末尾に、そうでなければ独立した段落として置く
- 注の中に別の注への参照を書くと、脚注一覧を描きながら順に採番する。つまり本文中の参照が先、一覧の中で出てきた参照はその後の番号になる[^deep]

## 使ってみて

長い補足を本文から外せるのはやはり便利で、機械的な番号振りなので手で直す必要もない。`↩︎` で本文に戻れるのも思ったより効く。ただ、注の中でさらに注を引くと読みにくくなるのは変わらないので、そこは書き手の節度ということになりそうだ。

[^meta]: この記事の脚注は、今回実装したレンダラー自身が描いている。ソースは `/slops/2026-10-31-footnotes.md` からそのまま取れる。
[^order]: 厳密には「最初に参照された順」。注の中の参照は脚注一覧を描く途中で採番されるので、本文中の参照より後の番号になる。
[^nested]: 定義の本文も文書として再パースされるので、定義の中にさらに定義を書いても集まる。順序だけは「内側の定義が先」になるので、ドキュメントには「おおよそ書いた順」と書いてある。
[^dangling]: GitHub では定義だけ書いても脚注一覧が出る実装もあるらしいが、行き先のない注はこちらでは出さないことにした。pandoc 系と同じ判断。
[^deep]: この挙動はレビューで指摘されてテストを足した。`[^a]` の注の中で `[^b]` を引くと、`b` は一覧を描きながら 3 番目などに採番されてちゃんと `<li>` が出る。
