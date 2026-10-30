---
title: pi 用 Sarashina 拡張を AI に書かせ、その Sarashina に Go ツールを書かせて受け入れテストした
description: private リポジトリ pi-lab の PR #30 の記録。Devin が pi-agent 用の Sarashina プロバイダ拡張 pi-sarashina を実装し、その拡張経由で Sarashina 自身に Go 製グラフ描画 CLI を書かせるドッグフーディングを行った。8 run の失敗の分類、22 回の 429 が全て Retry-After で復帰した実測、観測用ロギングプロキシの話。
prev: 2026-10-29-details.md
---

# pi 用 Sarashina 拡張を AI に書かせ、その Sarashina に Go ツールを書かせて受け入れテストした

private リポジトリ pi-lab の [PR #30](https://github.com/podhmo/pi-lab/pull/30)（private なのでリンク先は見えない）に入った作業の記録。PR に同梱されていた RESEARCH.md / NOTES.md / ARTICLE.md / TODO.md からまとめ直した。

やったことは 2 段構造になっている。

- 1 段目: Devin CLI に、コーディングエージェント pi（`@earendil-works/pi-coding-agent`）用の拡張パッケージ `pi-sarashina` を書かせた。Sarashina API（SB Intuitions、OpenAI Chat Completions 互換）を pi のモデルプロバイダとして登録するもの
- 2 段目: その拡張を pi にロードし、拡張経由で Sarashina のモデル自身に Go 製の TUI グラフ描画ツール `gratui` を実装させた。拡張の受け入れテストを、拡張が繋いだモデルの実作業で行う形

途中で挙動が見えずハマったので、pi と Sarashina API の間に自作のロギングプロキシを挟んで作業を進めた。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 292" width="560" role="img" aria-label="作業の構造: Devin が拡張を実装し、人が pi を指示・監督し、pi は拡張をロードしてプロキシ越しに Sarashina API を呼びながら Go のファイルを書く">
  <defs>
    <marker id="fig1-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="currentColor"/>
    </marker>
  </defs>
  <rect x="20" y="20" width="110" height="40" rx="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <text x="75" y="44" text-anchor="middle" font-size="13" fill="currentColor">Devin CLI</text>
  <rect x="200" y="20" width="170" height="40" rx="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <text x="285" y="44" text-anchor="middle" font-size="13" fill="currentColor">pi-sarashina 拡張</text>
  <line x1="132" y1="40" x2="196" y2="40" stroke="currentColor" stroke-width="1.5" marker-end="url(#fig1-arrow)"/>
  <text x="164" y="32" text-anchor="middle" font-size="11" fill="currentColor">実装</text>
  <line x1="285" y1="62" x2="285" y2="124" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#fig1-arrow)"/>
  <text x="293" y="95" font-size="11" fill="currentColor">pi -e でロード</text>
  <rect x="20" y="130" width="130" height="44" rx="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <text x="85" y="156" text-anchor="middle" font-size="12" fill="currentColor">人（指示・監督）</text>
  <rect x="200" y="130" width="100" height="44" rx="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <text x="250" y="156" text-anchor="middle" font-size="13" fill="currentColor">pi agent</text>
  <rect x="350" y="130" width="130" height="44" rx="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <text x="415" y="156" text-anchor="middle" font-size="12" fill="currentColor">trace-proxy :8787</text>
  <rect x="520" y="130" width="76" height="44" rx="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <text x="558" y="150" text-anchor="middle" font-size="11" fill="currentColor">Sarashina</text>
  <text x="558" y="164" text-anchor="middle" font-size="11" fill="currentColor">API</text>
  <line x1="152" y1="152" x2="196" y2="152" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#fig1-arrow)"/>
  <text x="174" y="142" text-anchor="middle" font-size="11" fill="currentColor">prompt</text>
  <line x1="302" y1="152" x2="346" y2="152" stroke="currentColor" stroke-width="1.5" marker-end="url(#fig1-arrow)"/>
  <text x="324" y="142" text-anchor="middle" font-size="11" fill="currentColor">HTTP</text>
  <line x1="482" y1="152" x2="516" y2="152" stroke="currentColor" stroke-width="1.5" marker-end="url(#fig1-arrow)"/>
  <text x="499" y="142" text-anchor="middle" font-size="10" fill="currentColor">HTTPS</text>
  <line x1="60" y1="128" x2="60" y2="64" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#fig1-arrow)"/>
  <text x="66" y="100" font-size="11" fill="currentColor">指示</text>
  <rect x="200" y="228" width="170" height="40" rx="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <text x="285" y="252" text-anchor="middle" font-size="12" fill="currentColor">main.go, *.txt</text>
  <line x1="250" y1="176" x2="250" y2="222" stroke="currentColor" stroke-width="1.5" marker-end="url(#fig1-arrow)"/>
  <text x="258" y="202" font-size="11" fill="currentColor">write/edit</text>
</svg>
```

この構造で面白いのは、検証対象と検証経路が同じものを通っている点だ。「プロバイダ拡張が正しく動くか」を確かめるのに、その拡張を通してモデルをエージェントとして働かせる。結果として、書いたばかりで未検証だった 429 リトライ実装が、テストの途中で自然に実地検証されることになった（後述）。

## 1 段目: pi-sarashina を作る

pi には拡張単位として「pi パッケージ」があり、`pi.registerProvider()` でモデルプロバイダを追加できる。Sarashina は OpenAI 互換なので `api: "openai-completions"` を指定すれば pi 標準のストリーミング実装が使え、独自実装は要らない——というのが調査段階の見立てで、概ねその通りになった。進め方は「調査を RESEARCH.md に集約 → 実装を子エージェントに委譲 → レビューと実測」という分業だった。

ただし「互換」をそのまま信じると動かない部分がいくつかあり、実測で初めて分かったことが多い。

- Sarashina は message `content` の配列形式（`[{"type":"text","text":...}]`）を `400 Invalid JSON` で弾く。API ドキュメントに書かれていない。pi は user メッセージを配列で送るので、そのままでは一切会話できなかった。リクエスト送信前の payload 書き換えで、テキストパーツを文字列に平坦化して解決した
- thinking モデルの `reasoning` フィールド（暗号化された base64）は、pi 側の既存機構でそのまま往復することが実測で確認できた。2 ターン目に reasoning 付きの assistant メッセージを送り返しても `reasoning could not be decrypted` にならず、思考コンテクストが継承される
- `sarashina3-guard`（モデレーション専用モデル）は `tools`/`tool_choice` を受け付けない（curl で実測 400）。pi は agent が tools を持つ限り必ず `tools` を送るので、guard のときだけ両フィールドを剥がす対応を入れた
- pi は `.env` を読まない。`$SARASHINA_API_KEY` の補間はプロセス環境変数だけを見るので、`set -a && . ./.env && set +a` してから起動する必要がある
- 未知プロバイダ向けの自動検出 compat フラグは `store`・`developer` ロール・tools の strict モード・`stream_options` を送る設定になっていた。Sarashina は未対応パラメータを無視するが「送らない」方針で全て false に倒した

リトライまわりが一番の発見だった。pi にはリトライが 3 層ある。

- provider/SDK 層: `Retry-After` を読んでその秒数だけ待つが、`maxRetries` デフォルト 0 で事実上 OFF
- compaction 専用層: 通常のターンには使われない
- エージェントループ層（デフォルト有効）: 429 を検出してターンをやり直すが、待ち時間は固定の 2s/4s/8s で `Retry-After` を見ない

Sarashina のレート制限は固定 60 秒窓（thinking/mini は約 30 RPM）なので、デフォルトの 2s/4s/8s リトライは全て同じ窓の中で尽きて「ほぼ確実に 3 回連続 429 → 約 14 秒で失敗」になる。そこで拡張側の `streamSimple` を標準実装への委譲ラップにして、呼び出し側が未設定のときだけ `maxRetries: 3` を適用し、sarashina 限定で `Retry-After` を尊重する層を有効化した。実装は [01-extension-index.ts](01-extension-index.ts) にまとまっている（Codex レビューを受けて、payload 書き換えもフックではなくこのラップ内の `onPayload` 合成に移し、どの経路から呼ばれてもバイパスされない構造にした）。

## 2 段目: Sarashina 自身に Go を書かせる

受け入れテストとして、適当にでっち上げたラフな設計書 [03-design.md](03-design.md) を渡し、「これを読んで設計書通りの Go ツールを実装してください」と pi 経由で Sarashina に指示した。設計書は `A -> B` 形式のエッジリストを層別レイアウトで `──▶` などの罫線で描く CLI という内容で、「細部は実装に任せる」「落ちないことが大事」などの曖昧さを意図的に残してある。

実行はロギングプロキシ経由。`SARASHINA_BASE_URL` というデバッグ用の環境変数を拡張に仕込んであり、これを `http://127.0.0.1:8787/v1` に向けると全トラフィックが [02-trace-proxy.mjs](02-trace-proxy.mjs)（約 50 行の Node スクリプト）を通る。リクエスト行・ステータス・`Retry-After`・SSE 各チャンクの到達時刻を記録する。

```
--> POST /v1/chat/completions body=32077B
<-- 429 /v1/chat/completions retry-after=35 +23ms
    +   176ms data: {"id":"chatcmpl-...","choices":[{"delta":{"content":...
    EOF /v1/chat/completions +603ms
```

### 8 run の記録

sarashina3-mini で 6 回、sarashina3.2-mini-thinking で 2 回走らせた。

| run | model | 結果 |
|-----|-------|------|
| 1 | mini | プロキシ無しで起動。ファイル 3 個を書いた後、無言で停滞。原因不明のまま kill |
| 2 | mini | トレース導入。309 リクエスト・429 9 回は全回復。生成した main.go にリテラル `\n` 混入で構文エラー。修復中にストリームが沈黙 → TCP ETIMEDOUT で pi 死亡 |
| 3 | mini | 即死。原因は自作プロキシのバグで ECONNREFUSED |
| 4 | mini | 修復指示で再起動するが、read/edit 失敗の無限ループに陥り kill |
| 5 | mini | 「edit 禁止・全体書き直し」の指示で一応「完成」。ただし検証するとサイクル入力で無限ループ、ファイル引数・フラグ・矢印描画は全て未実装 |
| 6 | mini | 不足を列挙して改善指示。書き直したがサイクル処理の同じバグを再現。途中でストリーム沈黙し kill |
| 7 | thinking | 継続指示。自分でサイクル入力テストを実行 → 自分が書いた無限ループバグで自分のテストがハング（7.6 CPU 分）。プロセスを kill すると再開するが同じテストを再実行して再度ハング、を 2 回繰り返して観察打ち切り |
| 8 | thinking | 生成物を全削除して最初から。実質合格（下記） |

### 失敗の分類

##### ソースへのリテラル `\n` 混入

ファイル書き込み時に `\n`（バックスラッシュ + n の 2 文字）を Go ソースへそのまま出力してしまい `go build` が通らない。run 2 と run 6 の両方で発生。「部分 edit ではなくファイル全体を一度に書き直せ」という指示で回避できた。このモデルでは破壊的編集より全量 write のほうが失敗率が低い。

##### read/edit の無限ループ

run 4 は壊れた `\n` を消そうと `edit` を連発したが、oldText がファイル上の実際のバイト列と一致せず毎回失敗した。すると `read` の offset を 1 ずつ下げながら同じ edit を数百回繰り返すループに入った（セッションの `~/.pi/agent/sessions/*.jsonl` で確認）。コンテキストは 226KB まで膨張し、30 RPM 制限に触れて 429 を連発した。pi にはツール呼び出しのループ検出がないので、監督側が止めるしかない。

##### SSE ストリームの途中沈黙

run 2 と run 6 で、SSE ストリームが数チャンク受信したところで応答が完全に停止し、pi は完了を待ち続けて数分後に TCP ETIMEDOUT で死亡した。基盤側（API または経路）の問題と見られる。run 1 の「無言の停滞」も同じ原因と推測されるが、プロキシが無くて観測できなかったので確証はない。緩和策として pi の `httpIdleTimeoutMs` 設定（デフォルト 300 秒）で切断を早められることは分かった。

##### 自作プロキシ自身のバグ

上流 ETIMEDOUT 時に `res.writeHead(502)` を呼んだが、ヘッダ送信済みで例外 → プロキシごとクラッシュし、次の run が ECONNREFUSED で即死した。「観測装置が観測対象を壊す」典型例。`res.headersSent` をチェックして `res.destroy(e)` にフォールバックする形に直した（このほか、クライアント切断時に上流の request/response を destroy する修正も入っている）。

##### 自己検証が浅い

run 5 は「完成しました」と報告したが、実際にはサイクル入力で無限ループ（設計書の「落ちないことが大事」に明確に違反）、ファイル引数・`--help`/`--version`/`--vertical` 未実装、エッジの罫線描画なし、という状態だった。「ビルドが通る + 一例が動く」までがこのモデルの完了基準で、設計書との突き合わせはしない。

##### 自分の無限ループに自分がハングする

run 7 でモデルは `./gratui`（標準入力を読む自作バイナリ）をサイクル入力付きで実行し、自分が書いた無限ループで 7.6 CPU 分ハングした。pi の bash ツールは完了を待ち続ける。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 170" width="420" role="img" aria-label="run 7 のループ: 自分が書いた main.go をテスト実行すると無限ループでハングし、kill して再実行してもまたハングする">
  <defs>
    <marker id="fig3-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="currentColor"/>
    </marker>
  </defs>
  <rect x="15" y="18" width="150" height="36" rx="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <text x="90" y="41" text-anchor="middle" font-size="12" fill="currentColor">自作の main.go</text>
  <rect x="230" y="18" width="170" height="36" rx="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <text x="315" y="34" text-anchor="middle" font-size="11" fill="currentColor">./gratui を実行</text>
  <text x="315" y="47" text-anchor="middle" font-size="11" fill="currentColor">（サイクル入力）</text>
  <rect x="230" y="120" width="170" height="36" rx="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <text x="315" y="136" text-anchor="middle" font-size="11" fill="currentColor">無限ループでハング</text>
  <text x="315" y="149" text-anchor="middle" font-size="11" fill="currentColor">（7.6 CPU 分）</text>
  <line x1="167" y1="36" x2="226" y2="36" stroke="currentColor" stroke-width="1.5" marker-end="url(#fig3-arrow)"/>
  <line x1="310" y1="56" x2="310" y2="114" stroke="currentColor" stroke-width="1.5" marker-end="url(#fig3-arrow)"/>
  <text x="318" y="90" font-size="11" fill="currentColor">無限ループ</text>
  <line x1="268" y1="114" x2="268" y2="62" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#fig3-arrow)"/>
  <text x="260" y="90" text-anchor="end" font-size="11" fill="currentColor">kill → 再実行（×2）</text>
</svg>
```

ハングした `./gratui` だけを kill すればよく、bash ツールが `Terminated: 15` を返すと pi は即座に次のターンへ進んだ（pi 自体を殺す必要はない）。ただし再開したモデルは同じテストを再実行して再度ハングした。プロンプトに「実行確認は timeout 付きで」と入れるのは有効だった。

### run 8: 実質合格

生成物を全削除し、sarashina3.2-mini-thinking（`--thinking medium`）+ 「自己検証は timeout 付きで」の指示で最初からやらせたところ、設計書の主要仕様を満たす 281 行の Go コードを 1 セッションで書き上げた（[04-main.go](04-main.go)）。

| 設計書の要求 | 結果 |
|---|---|
| `go build` で単一バイナリ・標準ライブラリのみ | OK |
| エッジリスト解析（`->`、`#` コメント、空行） | OK。さらに行内コメント・孤立ノード記法まで吸収 |
| 層別レイアウト + `──▶` 系の描画 | OK。Kahn 法で層割り、ノード `[A]` と矢印を描画。表現は独自の縦積みだが「それっぽく」の範囲と評価 |
| サイクル → 警告を出して落ちない | OK。`cycle detected` を出し残ノードを最終層へ。ハングなし |
| ファイル引数 / 標準入力 / `-` | OK |
| `--version` / `-h` / `--vertical` | OK |

実際の出力はこんな感じ（`05-example.txt` を食わせたもの。層ごとに 1 段ずつ縦に並ぶ表現になっている）。

```
[A]
      ──▶
   [B]
      ──▶
   [C]
      ──▶
   [D]
```

副産物として、モデルは検証用の入力ファイルを 3 個自作して残していた（[05-example.txt](05-example.txt) / [06-cycle.txt](06-cycle.txt) / [07-complex.txt](07-complex.txt)）。テスト資産を残す習慣は好印象だったという。

## 数値（トレースより）

- 総リクエスト: 約 845 回の `POST /v1/chat/completions`（run 2 が 309、run 4〜8 の合計が 536）
- 429 は 22 回発生し、全て `Retry-After` 指定秒（実測 21〜35 秒、60 秒窓の残り時間）だけ待って再送 → 200 で復帰した
- レスポンスタイム: mini はほぼ全て 1 秒以内。thinking でも数秒

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 110" width="540" role="img" aria-label="429 リトライのタイムライン: リクエストから 23ms で 429 retry-after=35 が返り、35 秒待って同じ body を再送すると 200 でストリーミングが始まる">
  <defs>
    <marker id="fig2-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="currentColor"/>
    </marker>
  </defs>
  <line x1="30" y1="62" x2="530" y2="62" stroke="currentColor" stroke-width="1.5" marker-end="url(#fig2-arrow)"/>
  <circle cx="70" cy="62" r="4" fill="currentColor"/>
  <text x="70" y="42" text-anchor="middle" font-size="11" fill="currentColor">POST</text>
  <text x="70" y="82" text-anchor="middle" font-size="10" fill="currentColor">t=0</text>
  <line x1="150" y1="54" x2="150" y2="70" stroke="currentColor" stroke-width="1.5"/>
  <text x="150" y="42" text-anchor="middle" font-size="11" fill="currentColor">429（retry-after=35）</text>
  <text x="150" y="82" text-anchor="middle" font-size="10" fill="currentColor">+23ms</text>
  <line x1="160" y1="62" x2="360" y2="62" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="260" y="82" text-anchor="middle" font-size="10" fill="currentColor">35 秒待機</text>
  <circle cx="380" cy="62" r="4" fill="currentColor"/>
  <text x="380" y="42" text-anchor="middle" font-size="11" fill="currentColor">同じ body を再送</text>
  <line x1="480" y1="54" x2="480" y2="70" stroke="currentColor" stroke-width="1.5"/>
  <text x="480" y="42" text-anchor="middle" font-size="11" fill="currentColor">200 → SSE</text>
</svg>
```

つまり、1 段目で「Sarashina の 60 秒窓には `Retry-After` を尊重する層が必要」と判断して入れたリトライ実装が、2 段目のエージェント実行中に 22 回発動して全て設計どおりに動いた。パッケージの TODO にあった「実 429 の踏み抜き検証は未実施」という項目は、この実験で解消された。受け入れテストがテスト対象の検証そのものになった格好だ。

## まとめと残課題

- sarashina3-mini 単独でのエージェント実行は 6 回中 5 回が収束しなかった（残る 1 回はプロキシのバグで即死）。ソースへのエスケープ混入という破壊的編集と、失敗時に同じ操作を繰り返す癖が致命的だった
- sarashina3.2-mini-thinking + クリーンな状態 + 「検証は timeout 付きで」の指示で実用圏内に入った。ただし thinking モデルの思考内容は暗号化されていて読めないので、「なぜ上手くいったか」の内訳はブラックボックスのまま
- エージェント基盤として、HTTP 可視化（プロキシ）+ セッション JSONL の追跡 + ハング時の部分的 kill という監督手段が必須だった。自律動作に任せきりだと run 1 のように原因不明のまま時間を溶かす
- 未解決: SSE ストリームが稀に途中で沈黙する問題（`httpIdleTimeoutMs` で緩和可能）、pi にツール呼び出しループ検出がない点、`.env` 非対応、cost=0 固定（無料枠前提）、モデル一覧のハードコード
- なお main で pi が 0.85.1 → 1.3.0 に bump された後に再検証済みで、extension 本体は変更不要だった

## このバンドルのファイル

- [01-extension-index.ts](01-extension-index.ts) — Devin が書いた pi-sarashina の拡張本体（218 行）
- [02-trace-proxy.mjs](02-trace-proxy.mjs) — 観測用ロギングプロキシ（56 行）
- [03-design.md](03-design.md) — モデルに渡したラフ設計書
- [04-main.go](04-main.go) — Sarashina が書いた gratui の成果物（281 行）
- [05-example.txt](05-example.txt) / [06-cycle.txt](06-cycle.txt) / [07-complex.txt](07-complex.txt) — モデルが自作した検証用入力
