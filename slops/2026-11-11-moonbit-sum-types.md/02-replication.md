# 追試: 本文と PR #160 の検証を繰り返す

> [!NOTE]
> 執筆: Claude Code。2026-11-11 に main（`dcc55bd`、#160-#164 を含む）で行った。

本文の「検証」と PR #160 の Test plan に書かれた主張を、手元でもう一度確かめた。

## make check

`moonbit/` で `make check` を2回実行した。1回目の途中で moon が更新されたので、2回目は更新後のツールチェーン（moon 0.1.20261104、moonc v0.10.20）で実行した。

- どちらも成功。`moon test` は 112 件すべて pass、JS パーサのテストは 5 件 pass
- `moon fmt --check`、wasm-gc と native の `moon check`、`experiments/` の `moon check` も通った
- `.mbti` と `preview.wasm` に差分は出なかった

本文の「112テスト」と一致する。

## make compare

Go の blog（`go run ./examples/blog`）と Worker（`make dev`）をローカルで立てて比較した。

最初の実行では 12 パス中 10 パスが違った。差はすべて `og:url` で、Go 側は `http://localhost:8080/...`、Worker 側は `wrangler.jsonc` の `BASE_URL` である `https://blog.podhmo.workers.dev/...` を出していた。Go 側を `-base-url https://blog.podhmo.workers.dev` で起動し直すと差は消えた。本文はこの手順に触れていないので、再現するときはこのフラグが要る。

- 既定の 12 パス: 0 差分
- `/slops/` と `/posts/` の一覧から辿れる記事 40 パス（バンドル、`<details>`、脚注、アラート、svg フェンスを含む）: 0 差分
- 本文の「`<ol start>` の出力も Go 側と一致」: 40 パスを Go 側で取得して `<ol start=` を探すと `/posts/wsl-opencode` だけが該当した。このパスは既定の 12 パスに含まれ、差分は無かった。加えて、Go の `server_test.go` と MoonBit の `site_test.mbt` が同じ期待値 `<ol start="3">...` を持っている

## wasm-pair の `<ol>`

本文の「wasm-pair の HTML 側は `<ol>` を一度も描いていなかった」を、#160 の直前のコミットで確かめた。`experiments/wasm-pair/html/html.mbt` の `list` は項目の `num` を読まずに `@picoel.list`（`<ul>`）を返していた。現在は `kind` が `ordered` のとき `<ol>` を出し、`start` が 1 でなければ属性を付ける。

## 確かめなかったこと

- Cloudflare 上にデプロイした Worker との比較。ローカルの `wrangler dev` だけで比べた
- 本文の「過剰適用しないと決めたもの」のうち `Post.members` の判断（#165 で試して見送った経緯）は、PR の中身を読んでいない。結論の妥当性は [指針](01-guidelines.md) の「しない方が 7」に照らして同意できる、というところまで
