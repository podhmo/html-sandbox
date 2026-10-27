# 調査レポート: MoonBit 版のブログの文章を Wasm の外に出す

TODO.md の「MoonBit 版のブログで、記事や文書を足しても Wasm が太らないようにする」の調査と実装。
今の MoonBit 版は、記事、`TODO.md`、`docs/**/*.md` を Wasm に埋め込んでいるので、書くたびに Wasm が大きくなる。
`wrangler deploy` と `make dev` だけで済む今の手軽さを保ったまま、文章を Wasm の外に出す方法を調べ、`/tmp` の小さな spike で確かめ、`moonbit/examples/blog` に実装した。
以下は、調査したときの記録に、実装と結果を足したもの。

## 結論

- **Workers の Static Assets を使う。** `wrangler.jsonc` に `assets` を書くだけで、同じ `wrangler deploy` で文章がアップロードされ、`wrangler dev` でもそのまま動く。R2 や KV のような別の作成やアップロードの手順は要らない。アセットへのリクエストと保存に料金はかからない。
- **Total Upload（Worker の大きさ）にはアセットが入らない。** spike では 11 ファイルのアセットを置いても、Total Upload は Worker の JS の 1.02 KiB だけだった。
- **`run_worker_first: true` にすれば、今のルーティングは何も変わらない。** すべてのリクエストが今までどおり Worker に届き、Worker は binding（`env.ASSETS.fetch()`）でだけ文章を読む。`/posts/hello.md` のようなパスに、アセットがそのまま返ることはない。
- **最初の一歩は「Worker の起動後の最初のリクエストで、全部の文章を取って Wasm に渡す」でよい。** Wasm の中は今と同じく同期のまま、埋め込みの代わりに受け取ったファイルから `Site` を作る。目録はファイル名の一覧だけなので、シェルで作れる。リクエストごとに必要なファイルだけを取る形は、文章がずっと増えてから考える。
- 埋め込みをやめると、Wasm は約 249 KB から 100 KB 強になる見込み（埋め込んだ文章が約 134 KB）。記事を足しても Wasm は変わらない。

## 今の大きさ

2026-10-15 の main（記事 5 本）で測った。

| もの | 大きさ |
| --- | --- |
| Wasm（`moon build --target wasm-gc --release`） | 249,111 B |
| 記事（`go/examples/blog/posts/*.md`）の合計 | 12,929 B |
| `TODO.md` と `docs/**/*.md` の合計 | 120,932 B |
| 生成した `posts/embedded.mbt` / `repodocs/embedded.mbt` / `assets/embedded.mbt` | 14,480 B / 136,193 B / 3,300 B |
| wrangler の Total Upload | 244.97 KiB（gzip 後 80.58 KiB） |

太る原因は、記事よりも文書（特に `docs/sketch/ja/` のレポート）のほうが大きい。

## 候補

| 方法 | 手軽さ | Wasm の大きさ | 備考 |
| --- | --- | --- | --- |
| 今のまま埋め込む | 最も手軽 | 文章に比例して増える | 64 MiB の上限まではまだ遠い |
| Static Assets | `wrangler.jsonc` に数行。デプロイの手順は同じ | 文章に関係なく一定 | 第一候補 |
| R2 | バケットの作成と、文章のアップロードの手順が別に要る | 一定 | デプロイと文章の更新が別々になる。`wrangler dev` では別のローカルのバケットになる |
| KV | R2 と同じく、別に書き込む手順が要る | 一定 | 結果整合なので、デプロイ直後に古い文章が見えうる |
| 文章を圧縮して埋め込む | 手軽 | 増え方が緩やかになるだけ | 展開のコードが要る。`DecompressionStream` は JS の側にしかない |
| ビルド時にすべてのページを HTML にする | Static Assets と同じ | Wasm がリクエスト時に要らなくなる | Wasm で動かすというこのブログの目的から外れる |

## Static Assets について確かめたこと

### ドキュメント

[Static Assets](https://developers.cloudflare.com/workers/static-assets/)、[binding](https://developers.cloudflare.com/workers/static-assets/binding/)、[料金と制限](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)、[Workers の制限](https://developers.cloudflare.com/workers/platform/limits/) を読んだ。

- `assets` の設定は `directory`（置き場所）、`binding`（Worker から読むための名前。例は `ASSETS`）、`run_worker_first`。
- 既定（`run_worker_first: false`）では、パスがアセットに一致すると Worker を通さずにそのまま返す。`true` にするとすべてのリクエストが先に Worker に届く。パターンの配列で一部のパスだけにもできる。
- `env.ASSETS.fetch()` は Request、URL、文字列を受け取り、URL のホスト名は無視してパスだけで探す。
- 料金: 「Requests to static assets are free and unlimited」「There is no additional cost for storing Assets」。Worker を通るリクエストは今までどおり Workers の料金で数える。無料プランの上限を超えると、`run_worker_first` に一致するリクエストは 429 になる（今も全リクエストが Worker を通るので、条件は変わらない）。
- 制限: アセットのファイル数は Free で 20,000、Paid で 100,000。1 ファイルは 25 MiB まで。Worker 本体は非圧縮で 64 MiB まで。起動（グローバルスコープの評価）は 1 秒まで。
- アップロードしないファイルは、アセットのディレクトリの `.assetsignore`（`.gitignore` と同じ書き方）で指定できる。

### spike

`/tmp` に、記事 5 本と `docs/sketch/ja/*.md` 6 本を `content/` に置き、次の設定で確かめた（wrangler 4.148.0）。

```jsonc
{
  "name": "assets-spike",
  "main": "./worker.mjs",
  "compatibility_date": "2026-10-01",
  "assets": { "directory": "./content", "binding": "ASSETS", "run_worker_first": true }
}
```

`/raw/<path>` で `env.ASSETS.fetch(new URL(path, "https://assets.local"))` の結果を返し、`/many` で記事 5 本を `Promise.all` でまとめて取る Worker を書いた。

| 確かめたこと | 結果 |
| --- | --- |
| `wrangler deploy --dry-run` | `Read 11 files from the assets directory`、Total Upload は 1.02 KiB / gzip 0.50 KiB。アセットは含まれない |
| `/posts/2026-10-14-hello.md` を直接取る | Worker の応答が返った（`run_worker_first: true` が効いている） |
| binding で `.md` を取る | 200、`Content-Type: text/markdown; charset=utf-8`、本文はファイルのまま |
| 拡張子なしのパス、存在しないファイル | どちらも 404。`html_handling` は `.html` だけが対象で、`.md` が別名で見つかることはない |
| `wrangler dev` に 20 回の往復の中央値 | 何も取らない `/` が 1.1 ms、23 KB の文書を 1 つ取ると 1.5 ms、記事 5 本を並行して取ると 1.8 ms |

ローカルの workerd での数字なので、本番の速さはデプロイしてから測る必要がある。

## 設計の案

### 文章の置き場所

`moonbit/cloudflare/build/`（当時は `moonbit/workers/build/`）は、今も Wasm をコピーする、git で無視している置き場所になっている。ビルドのコマンドで、ここに `content/` を作って文章をコピーする。

- `content/posts/*.md`（`go/examples/blog/posts` から）
- `content/docs/TODO.md` と `content/docs/docs/**/*.md`（リポジトリから。パスは今の `repodocs` と同じ）
- `content/files.txt`: 上のファイルのパスの一覧（目録）

Static Assets には一覧を返す API がないので、目録は自分で作る。`find` と `sort` で足りる。`site.css` と `favicon.svg` は小さく、記事とともに増えるものでもないので、埋め込んだままでよい。

Go 版は今までどおり `go:embed` で埋め込む。変わるのは MoonBit 版だけ。

### Wasm への渡し方

今の `serve` は同期で、`worker.mjs` からパスを受け取ってその場で応答を作る。`env.ASSETS.fetch()` は非同期なので、Wasm から直接は呼べない。案は 3 つある。

案 1、**最初のリクエストで全部を渡す（推奨）**: Worker の起動後の最初のリクエストで、`worker.mjs` が `files.txt` とすべてのファイルを並行して取り、ファイル名と本文を順に Wasm に渡す（今の `path_push` と同じコード単位の受け渡しに、`file_name` と `file_body` のような export を足す）。Wasm はそれで `Site` を作り、以降は今と同じく同期で応答する。

- 今の `Site::embedded` は、埋め込んだファイルから最初の `serve` で `Site` を作っているので、その入力を差し替えるだけで済む。記事のリンクを解決するのに全部の文書の一覧が要る、という今の作りもそのまま使える。
- 代償は、Worker の起動後の最初のリクエストだけが、全部の文章を取る分だけ遅くなること。今の量（約 134 KB）なら、spike の数字から数 ms と見込む。isolate のメモリにも全文が載るが、これは今と同じ。

案 2、**JS がパスから要るファイルを決めて先に取る**: リクエストごとに 1 ファイルだけ取ればよいが、ルーティングの知識が `worker.mjs` に漏れる。一覧ページやリンクの解決には、結局全部の一覧と各記事の title / description が要る。

案 3、**Wasm が要るファイルを返し、JS が取って呼び直す**: ルーティングは Wasm に残るが、ABI が「応答」か「このファイルが要る」の 2 通りを返すようになる。一覧ページのために、title と description をビルド時に目録に入れておく必要もある（Go 版と同じ規則で作るには、`tinyfrontmatter` と `tinymarkdown` を使う native のコマンドが要る）。

案 1 は ABI に入力の export を足すだけで、Wasm の中のルーティングもレンダリングもそのまま使える。案 3 は、文章が数 MB になって最初のリクエストの遅れが気になってきたら考える。そのときは TODO.md の Future work の「Workers 用アダプターを最適な形に磨く」と一緒に設計する。

### 変わらないこと、変わること

- `make dev` と `make deploy` の使い方は変わらない。`wrangler dev` の `watch_dir` には、すでに記事と `docs/` が入っている。
- `make test` は、テスト用の文章を `Site` に直接渡すので、ネットワークも Assets も要らない。実装では、埋め込みをテストと `experiments/` に残した。
- 比較（`make compare`）は今までどおり、Go 版と一致することを確かめる物差しになる。

## 実装

2026-10-22 に、`moonbit/examples/blog/` に案 1 を実装した。

### 置き場所とビルド

| 場所 | 変更 |
| --- | --- |
| `examples/blog/scripts/content.sh` | 記事と文書を `examples/blog/cloudflare/build/content/` にコピーし、`files.txt` に一覧を書く。ファイルの選び方は `list-files.sh` に切り出し、`embed.sh` と共有する |
| `examples/blog/cloudflare/wrangler.jsonc` | `assets`（`directory: ./build/content`、`binding: ASSETS`、`run_worker_first: true`）を足した |
| `examples/blog/cloudflare/worker.mjs` | 初回リクエストで `files.txt` と全部のファイルを `ASSETS` から並行して取り、`app.load(files)` で Wasm に渡す。失敗したら 500 を返し、次のリクエストでやり直す |
| `examples/blog/worker/worker.mbt` | `file(n)` を export。`name\tcontent` を受け取り、`posts/` と `docs/` の下だけを受け付ける。`serve` は受け取ったファイルから最初のリクエストで `Site` を作る |
| `pkg/http/wasm/adapter.mjs` | `load(files)` を足した。`file(n)` を 1 ファイルずつ呼び、Wasm が返したエラーは `Error` にする |
| `pkg/http/wasm/wire.mbt` | `read_file`、`write_error`、`FileError` を足した |
| `examples/blog/site/` | `Site::embedded` をやめ、`load_posts` と `load_docs` は `(名前, 本文)` の組を受け取る。記事と文書の埋め込みはテストだけの依存にした |
| `experiments/adapter-abi/content/` | spike が使っていた `Site::embedded` の代わり。`site(base_url~)` を返す |
| `Makefile` | `embed` を `embed-posts`、`embed-repodocs`、`embed-assets` に分けた。`build` は `embed-assets` と `content` だけを実行し、`test` と `check` は今までどおり全部の `embed` を実行する |

`build/content/` は git で無視している（`files.txt` も含む）。記事を足したときに再生成が要るのは `build` だけで、テストは埋め込みを使うので `embed` が走る。

### Wasm への渡し方

`worker.mjs` は `files.txt` を取ってから、一覧の各ファイルを `Promise.all` で取る。それを `app.load()` に渡すと、`adapter.mjs` が 1 ファイルずつ `file(n)` を呼ぶ。`Site` は `serve` の最初の呼び出しで作る。`BASE_URL` はリクエストの env から来るので、`Site` の組み立てをリクエストの処理まで遅らせている。

`Site` の組み立てに失敗したときは、その内容を 500 の本文にして返す。`worker.mjs` 側も `ASSETS` の取得に失敗したら 500 を返し、`loading` を捨てて次のリクエストでやり直す。isolate が生きているあいだ、内容は取り直さない（Static Assets はデプロイのときしか変わらない）。

### サイズ

2026-10-22、投稿 10 本（バンドルの 3 ファイルを含めて 12 ファイル）と文書 21（`files.txt` を足して 34 ファイル、約 397 KB）での比較。変更前は `2a3cdf1` の worktree で測った。

| もの | 変更前 | 変更後 |
| --- | --- | --- |
| Wasm（`moon build --target wasm-gc --release`） | 649,223 B | 175,001 B |
| `app.wasm`（`wasm-opt -Oz` の後） | 615,994 B | 141,966 B |
| wrangler の Total Upload | 605.23 KiB（gzip 195.43 KiB） | 144.55 KiB（gzip 63.56 KiB） |

調査のときに「249 KB から 100 KB 強になる見込み」と書いたが、実際は 175 KB になった。文書が調査時より増えた（このレポート自身も入っている）のに、Wasm は記事と文書の量に比例しなくなった。`wrangler deploy --dry-run` は `Read 41 files from the assets directory` と言うが、これは 34 ファイルと 7 ディレクトリを数えたもので、Total Upload には入らない。

### 時間

Node.js 24 で、`worker.mjs` と同じ順序（`load` してから `call`）を実行して測った。内容は上の 34 ファイルのうち、`files.txt` を除く 33 ファイル。

| 処理 | 時間 |
| --- | --- |
| `app.load(files)`（33 ファイル、約 396 KB） | 7.66 ms |
| 最初の `app.call(/)`（`Site` の組み立てを含む） | 8.88 ms |
| 2 回目の `app.call(/)` | 0.26 ms |
| 一番大きい文書の `app.call` | 0.90 ms |

`wrangler dev` の往復時間（`curl` を 40 回送り、最初の 10 回を除いた 30 回の中央値）は、同じ `--persist-to` を指定した変更前と変更後で次になった。

| 条件 | 変更前 | 変更後 |
| --- | --- | --- |
| 起動後の最初のリクエスト（3 回の範囲） | 20〜23 ms | 62〜73 ms |
| 温まったあとの `/`（3 回の中央値の範囲） | 5.8〜5.9 ms | 6.1〜6.6 ms |

最初のリクエストだけ 40〜50 ms ほど遅い。内容の取得と `Site` の組み立ての分で、ローカルの workerd の数字なので、本番では未確認。温まったあとは 0.5 ms ほどで、リクエストごとの差はほぼない。

### 確かめたこと

- `make test`: MoonBit のテスト 93 件（ほかに JS ターゲットの 2 件）と、Node での統合テスト 10 件が通る。
- Go 版のブログ（`-debug -base-url https://blog.podhmo.workers.dev`）と 62 パスを比べ、`0 of 62 paths differ`。記事のページと `.md`、文書と `.md`、一覧、`/favicon.svg`、`/site.css`、存在しないパスを含む。
- `wrangler dev` を動かしたまま記事を 1 本足すと、20 秒ほどで新しい記事が 200 で返り、`app.wasm` の SHA-256 は変わらなかった。消すと `files.txt` から外れて 404 に戻った（ファイルは `build/content/` に残る。`make clean` で消える）。
- 記事の front matter に知らないキーを書くと、最初のリクエストが 500 になり、本文にそのキー名が出る（内容の誤りがリクエスト時に分かる）。

### つまずいたこと

**`wrangler dev` のビルドが重なる。** `watch_dir` のファイルを続けて変えると、前の `make build` が終わる前に次が始まる。最初の `content.sh` は出力を `rm -rf` してからコピーしていたので、そのあいだのリクエストが内容を見つけられなかった。`embed.sh` も `$out.tmp` という固定の名前を使っていたので、2 つのビルドが同じ一時ファイルを奪い合い、`mv: cannot stat '...embedded.mbt.tmp'` で失敗した。さらに、その途中で 0 バイトの `app.wasm` が置かれ、workerd が `CompileError` を返したことがある（開発中だけ）。

直し方:

- 一時ファイルの名前に `$$`（プロセスの ID）を足した（`embed.sh`、`embed-assets.sh`）。
- `content.sh` はファイルを出力の隣で作ってから `mv` で置き換え、`files.txt` を最後に書くようにした。ビルドの途中でも、壊れたファイルは見えない（新旧のファイルが混ざることはある）。
- `content.sh` は、消えた記事のファイルを消さずに `files.txt` から外すようにした。重なったビルドが互いのファイルを消す競合を避けるため。配信されないので、残っても害はない。

**計測の落とし穴。** 最初に `wrangler dev` の往復時間を比べたとき、変更後が 14 ms、変更前が 5.5 ms で、温まったあとも 8 ms も遅いように見えた。しかし、ブログのコードではなく `wrangler dev` の置き場所の問題だった。

- 変更前の worktree は `/tmp`（tmpfs）にあり、変更後はリポジトリ（ext4）にあった。
- `wrangler dev` はローカルの状態を `.wrangler/state` に持ち、リクエストごとにそこへ書く。tmpfs と ext4 でその費用が変わる。
- `ASSETS` を外して Wasm を呼ばずに 500 を返す経路でも 14 ms だったので、アプリの処理時間ではないと分かった。
- 両方に `--persist-to` で同じ tmpfs の場所を指定すると、6 ms 前後にそろった。

同じコードを `/tmp` に置いても速くなり、リポジトリの中の、中身が `return new Response("hi")` だけの Worker でも遅かった。ローカルの往復時間を比べるときは、状態の置き場所もそろえる必要がある。

**デプロイで古い JS と新しい Wasm が混ざった。** マージ直後に本番へデプロイしたところ、`https://blog.podhmo.workers.dev/` が 500 で `no content loaded: the host must call file for each asset` を返した。git 管理外の `build/` と `_build/` はブランチを切り替えても残るので、あるブランチで作った `app.wasm` と `content/` が残ったまま、別のブランチの `worker.mjs` でデプロイすると、この組み合わせになりうる。古い `worker.mjs` は `file` を呼ばないが、新しい Wasm は呼ばれる前提で `Site` を作るため、内容が空のまま最初のリクエストを迎える。

`main` を取り込んでからデプロイし直すと直り、Go 版との 62 パスの比較も一致した。CI のデプロイはクリーンな checkout なので起きない。ローカルでも同じことが起きないよう、`make deploy` は `make clean` に依存させ、毎回作り直してからデプロイするようにした（README の「Deploying」にも書いた）。

## 残る懸念

文章を Wasm から出したことで、記事を足しても Wasm は太らなくなった。代わりに、注意して見る場所が「Wasm のサイズ」から「isolate ごとの最初のリクエスト」に移った。

- 新しい isolate の最初のリクエストは、`files.txt` と 33 ファイルの取得、`file` の呼び出し、`Site` の組み立てを行う。ローカルでは 40〜50 ms かかる。
- これはリクエストごとではなく isolate ごとに起きる。同じ isolate に複数の利用者が当たれば 1 回で、別の isolate ならそれぞれ 1 回。isolate は一定時間で破棄されるので、時間を空けたアクセスや別の地域からのアクセスでは、また起こりやすい。
- そのため、記事や文書が増えて取得が重くなると、影響は「Wasm が大きい」ではなく「新しい isolate に当たったリクエストが遅い」「subrequest や CPU 時間の上限に近づく」という形で出る。
- 対策の候補は、内容を 1 つの JSON にまとめて取得を 1 回にする、ページ単位で遅延ロードする、`Site` の組み立てを軽くする、など。今の量（33 ファイル、約 396 KB）ではどれも要らない。

## 未確認

- 本番での、Worker の起動後の最初のリクエストの遅れ。ローカルでは 40 ms ほど増えた。
- `build/content/` を直接書き換えたときに、`wrangler dev` が isolate を作り直さずに反映するか。`posts/` や `docs/` を変えたときは `watch_dir` がビルドを起こすので反映される。
- アセットのファイル名に日本語などが入ったときの扱い（今の文章のファイル名は ASCII だけ）。
- 本番の Workers で、`ASSETS` からの 34 ファイルの取得がどのくらいかかるか。無料プランの CPU 時間の上限（10 ms）に対して、`Site` の組み立てがどこまで食うかも本番では測っていない。
- ~~`ASSETS` への 34 回の取得が subrequest の上限（無料プランで 50）に数えられるか。数えられるなら、記事と文書が増えると最初のリクエストが失敗しうる。~~ 数えられた。下の「追記: subrequest の上限」を参照。

## 追記: subrequest の上限（#92）

### 問い

`ASSETS` バインディングへの `fetch` は subrequest の上限に数えられるか。数えられるなら、記事と文書が増えたときにどうするか。

### 答え

数えられる。記事と文書をビルド時に 1 つのファイル `content.bin` にまとめ、Worker は最初のリクエストでそれを 1 回だけ取得するようにした。取得の回数は記事の数によらず 1 回になる。

### どう確かめたか

**本番で失敗した。** #89 をマージしたあとに `make -C moonbit deploy` したところ、`https://blog.podhmo.workers.dev/` が次を返した。

```
Too many subrequests by single Worker invocation. To configure this limit, refer to https://developers.cloudflare.com/workers/wrangler/configuration/#limits
```

そのときの `worker.mjs` は、`files.txt` と、そこに並ぶファイルを 1 つずつ `ASSETS` から取得していた。各コミットでの内容のファイル数（`list-files.sh` で数えた）と、最初のリクエストでの取得回数（`files.txt` を含む）は次のとおり。

| コミット | ファイル数 | 取得回数 |
| --- | --- | --- |
| ea2a55c (#87) | 42 | 43 |
| 79c2958 (#88) | 45 | 46 |
| 46a1c67 (#89) | 53 | 54 |

50 を超えたのは #89 からで、失敗が始まった時期と合う。ほかに subrequest を出すコードはないので、`ASSETS` への取得が数えられていたことになる。

**Cloudflare のドキュメント**（2026-10-27 に読んだ）。

- [Workers の Limits](https://developers.cloudflare.com/workers/platform/limits/): subrequest は "any request a Worker makes using the Fetch API or to Cloudflare services like R2, KV, or D1"。1 回の呼び出しあたり Free で 50、Paid で 10,000（最大 1000 万）。Static Assets のファイルは 1 つ 25 MiB まで、Worker のバージョンあたり Free で 20,000 ファイルまで。
- [Wrangler の設定の `limits`](https://developers.cloudflare.com/workers/wrangler/configuration/#limits): `subrequests` は "defaults to 50 for free accounts"、"The free account maximum is 50"。また "Limits are only enforced when deployed to Cloudflare's network, not in local development"。
- [Static Assets のバインディング](https://developers.cloudflare.com/workers/static-assets/binding/) と [Billing and limitations](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/): `ASSETS` への `fetch` が subrequest に数えられるかどうかは書かれていない。[Service bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/) には "Each request to a Worker via a Service binding counts toward your subrequest limit" とある。`ASSETS` も `Fetcher` のバインディングなので、同じ扱いと考えるのが自然で、本番の失敗とも合う。

**手元での確認。** `wrangler dev` は上限を課さない（上のドキュメントのとおり）ので、上限で失敗するかどうかは手元では再現できない。代わりに、一時的に `env.ASSETS.fetch` を数えるコードを `worker.mjs` に足して `make dev PORT=8798` で動かし、リクエストごとの取得回数を出した（確認のあとで外した）。

- 新しい isolate の最初のリクエスト（`/`）: 1 回（`content.bin`）
- 続く `/posts/`、`/slops/`、`/posts/why-ai-novel-is-bored`、`/posts/why-ai-novel-is-bored/article1.md`、`/docs/`: 0 回
- `/preview.wasm`: 1 回（これまでどおり `ASSETS` へそのまま渡す）

`content.bin` を `worker.mjs` の `unpack` で分けると、53 ファイルの名前が前の `files.txt` と同じ順で一致し、中身も元のファイルとバイト単位で一致した。Go 版と `make compare` で比べると、トップページと各一覧からリンクされた 44 パスと `article1.md` が一致した（`/preview.wasm` は比較ツールがバイナリを UTF-8 として読めずに両側でエラーになるので、`cmp` で元のファイルと同じことを確かめた）。

### 選ばなかった案

- **`limits.subrequests` を上げる。** Free の最大が 50 なので上げられない。Paid にしても、記事が増えるたびに上限へ近づく形は変わらない。
- **ページごとに必要なファイルだけ取得する。** トップページや一覧はすべての記事のタイトルと日付を要るので、最初のリクエストで結局すべてを読むことになる。
- **Wasm に埋め込み直す。** 記事を足すたびに Wasm が太るのを避けるために外へ出したので、戻す理由がない。
- **JSON にまとめる。** 記事の束には画像など文字列でないファイルも入りうる。`<size> <name>\n` のヘッダーと中身のバイト列を並べる形なら、そのまま `Uint8Array` の切り出しで Wasm に渡せる。

### 残ること

- `content.bin` は 1 ファイルなので、25 MiB の上限に近づいたら分ける必要がある。今は約 630 KB。
- 本番で直ったかは、デプロイしてから確かめる。
