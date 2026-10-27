---
title: 記事を足したら、Workers の subrequest の上限を超えた
description: MoonBit 版のブログの Worker が "Too many subrequests" で止まった原因と、記事と文書を1つのファイルにまとめて直した経緯。
---

# 記事を足したら、Workers の subrequest の上限を超えた

[AI 小説の記事の図を描き直した PR #89](https://github.com/podhmo/html-sandbox/pull/89) をマージしたあと、`make deploy` で MoonBit 版のブログを Cloudflare Workers に配備した。すると https://blog.podhmo.workers.dev/ が、ページの代わりに次の一行を返すようになった。

```
Too many subrequests by single Worker invocation. To configure this limit, refer to https://developers.cloudflare.com/workers/wrangler/configuration/#limits
```

ユーザーの見立ては「以前の調査で、限界が来たら考えるとしていた Static Assets の制限を超えた」というものだった。この記事は、その原因と直し方の記録だ。

## 予告されていた失敗

MoonBit 版の Worker は、記事と文書を Wasm に埋め込まず、Static Assets に置いている。新しい isolate の最初のリクエストで、ファイルの一覧 `files.txt` と、そこに並ぶファイルを `ASSETS` バインディングから1つずつ取得し、Wasm に渡していた。

この形にしたときの[調査レポート](../docs/sketch/ja/moonbit-static-assets.md)は、最後に未解決の問いを残していた。`ASSETS` への取得が subrequest の上限（無料プランで 50）に数えられるなら、記事と文書が増えると最初のリクエストが失敗しうる、というものだ。今回、それがそのまま起きた。

## 進め方

ユーザーの指示で、issue の登録から調査・修正・手元での確認・コミットまでを、新しく起動したサブエージェントに任せた。このセッションの Claude Code は、それまでに分かっていたことを渡し、戻ってきた報告を確かめる側に回った。

渡したのは次のことだ。

- 壊れているのは MoonBit 版の Worker であること（`make deploy` があるのは `moonbit/Makefile` だけ）
- 最初のリクエストで、`files.txt` と全ファイルを1つずつ取得していること
- 前回の調査レポートに、上の未解決の問いがあること
- 直し方の候補（1つのファイルにまとめる、上限を上げる、必要な分だけ読む、Wasm に埋め込み直す）。どれにするかは決めずに渡し、比べて選ぶよう頼んだ
- push と配備はせず、issue も閉じないこと

一つ失敗もあった。サブエージェントを起動する前に、こちらで途中まで書き換えていた `content.sh` を元に戻すつもりが、パスを間違えて戻せていなかった。気づいてすぐに戻し、サブエージェントには「その書き換えを前提にせず、HEAD から読み直して」と伝えた。

## 原因

サブエージェントは [issue #92](https://github.com/podhmo/html-sandbox/issues/92) を立て、マージの時点ごとに内容のファイル数を数えた。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 230" width="520" height="230" role="img" aria-label="最初のリクエストでの ASSETS への取得回数は、#87 で 43、#88 で 46、#89 で 54 と増えて上限の 50 を超え、修正後は 1 回になった">
  <g stroke="currentColor" fill="none">
    <path d="M70 30V190H500" stroke-width="1"/>
    <path d="M70 65H500" stroke-width="1.5" stroke-dasharray="6 4"/>
  </g>
  <g fill="currentColor" fill-opacity="0.55" stroke="currentColor">
    <rect x="95" y="82.5" width="60" height="107.5"/>
    <rect x="200" y="75" width="60" height="115"/>
    <rect x="305" y="55" width="60" height="135" fill-opacity="0.85"/>
    <rect x="410" y="187.5" width="60" height="2.5"/>
  </g>
  <g fill="currentColor" font-size="11" text-anchor="middle">
    <text x="159" y="93" text-anchor="start">43</text>
    <text x="264" y="86" text-anchor="start">46</text>
    <text x="369" y="53" text-anchor="start">54</text>
    <text x="474" y="186" text-anchor="start">1</text>
    <text x="125" y="206">#87</text>
    <text x="230" y="206">#88</text>
    <text x="335" y="206">#89</text>
    <text x="440" y="206">修正後</text>
    <text x="285" y="224">マージした時点（最初のリクエストでの取得回数）</text>
  </g>
  <g fill="currentColor" font-size="11">
    <text x="64" y="69" text-anchor="end">50</text>
    <text x="64" y="194" text-anchor="end">0</text>
    <text x="76" y="59">無料プランの subrequest の上限</text>
  </g>
</svg>
```

最初のリクエストでの取得回数は `files.txt` の1回を含む。#88 までは 50 を下回っていたが、#89 で 53 ファイル、54 回になった。失敗が始まった時期と合い、Worker にはほかに subrequest を出すコードがない。

Cloudflare のドキュメントでは、subrequest は「Fetch API や R2、KV、D1 などへのリクエスト」で、上限は1回の呼び出しあたり無料プランで 50、有料プランで 10,000 だった。wrangler の `limits.subrequests` で上限を変えられるが、無料プランの最大は 50 のままだ。

`ASSETS` への取得が数えられるかどうかは、Static Assets のドキュメントには書かれていなかった。Service bindings のドキュメントには、バインディング経由のリクエストは上限に数えるとある。`ASSETS` も同じ種類のバインディングなので同じ扱いと考えられ、本番の失敗とも合う。上限は配備した Cloudflare の上でだけ課され、手元の `wrangler dev` では課されないことも書かれていた。

## 直し方

ビルド時に、記事と文書を1つのファイル `content.bin` にまとめるようにした。形式は、ファイルごとに `<バイト数> <パス>` のヘッダー1行と、中身のバイト列を並べただけのものだ。Worker はこれを1回だけ取得し、`unpack` で分けて、これまでどおり Wasm に渡す。取得は記事の数によらず1回になる。

Wasm のコードは変えていないので、Wasm の大きさも `make dev` と `make deploy` の手順も変わらない。プレビューページ用の `/preview.wasm` も、これまでどおり同じディレクトリからそのまま返している。

選ばなかった案は次のとおり。

- 上限を上げる：無料プランでは 50 より上げられない。有料プランにしても、記事が増えるたびに上限へ近づく形は変わらない。
- ページごとに必要なファイルだけ読む：トップページや一覧にはすべての記事のタイトルと日付が要るので、最初のリクエストで結局すべてを読む。
- Wasm に埋め込み直す：記事を足すたびに Wasm が太るのを避けるために外へ出したので、戻す理由がない。
- JSON にまとめる：今の記事や文書はテキストなので運べはする。ただ、Wasm にはもともとファイルごとのバイト列を渡しているので、バイト列のまま並べて切り出すほうが、文字列への変換を挟まずに済む。

修正は `4ac38e7` としてコミットされた。コメントと README、前回の調査レポートへの追記も同じコミットに入っている。

## 確かめたこと

サブエージェントの報告によると、次のことを確かめている。

- `content.bin` を `unpack` で分けると、53 ファイルの名前が前の `files.txt` と同じ順で並び、中身も元のファイルとバイト単位で一致した。途中で切れたファイルは、どのファイルが切れているかを示すエラーになった。
- `make dev` で、トップページ、一覧、記事の束のページ、束のメンバーの生ファイル、文書、プレビューのページと `/preview.wasm` が、期待した Content-Type で返った。
- `env.ASSETS.fetch` を数えるコードを一時的に足して動かすと、最初のリクエストで1回、その後のページで0回だった（確認のあとで外した）。最初の数え方は誤っていて、どのリクエストも0回と出ていたので、直して数え直したという。
- 自分で起動した Go 版のブログと `make compare` で比べ、トップページと一覧からリンクされた 44 のパスと記事の生ファイルが一致した。ユーザーが動かしていた 8080 番のサーバーには触れていない。

報告をそのまま受け取らず、このセッションでもコミットの中身と `unpack` のコードを読んだ。`content.sh` を作業用ディレクトリに向けて実行し、`worker.mjs` の `unpack` で分けて、53 ファイルがすべて元のファイルとバイト単位で一致することも確かめた。

報告を読み直して直したところもある。調査レポートへの追記で、JSON を選ばなかった理由が「記事の束には画像など文字列でないファイルも入りうる」になっていた。けれども束は PNG や JPEG のようなバイナリーのファイルを扱わない。理由を「文字列への変換を挟まずに切り出せる」に書き直した。あわせて、`files.txt` のことを書いたままだった古い[Wasm のレポート](../docs/sketch/ja/moonbit-workers-wasm.md)に、その後の変更を注記した。

## 確かめていないこと

- 本番で直ったかどうか。手元の `wrangler dev` は上限を課さないので、失敗そのものは手元で再現できない。配備してから確かめる。
- `make -s check` は最後まで通らなかった。`moon info` が、コミット済みの `.mbti` ファイル6つを書き換えるためだ（`Int32` が `Int` になる）。サブエージェントは、修正を退避した HEAD でも同じ6ファイルが同じように書き換わることを確かめている。この手元の moon のツールチェーンと、`.mbti` を生成したときのものが合っていないためで、今回の修正とは関係がない。それより前のテストや検査は通っている。

## 残ること

- `make -C moonbit deploy` で配備し、https://blog.podhmo.workers.dev/ が表示されることを確かめてから issue #92 を閉じる。
- `content.bin` は今 600 KB 余りで、Static Assets のファイル1つの上限は 25 MiB だ。それに近づく前に分け方を考える。
- `.mbti` の書き換えは、moon のツールチェーンを揃えて解消する。
