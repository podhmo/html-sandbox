# 調査メモ: esa をコーディングエージェントに開放する

esa を `gh` コマンドのような感覚でコーディングエージェントから操作したい、という要求の調査と検証の記録。記事の作成・編集・コメントの取得・コメントの投稿をエージェントのツールとして使える状態を目指した。

結論: **esa 公式リモートMCPサーバー (`https://mcp.esa.io/`) を Devin CLI の MCP サーバーとして登録するのが最も簡単**。Devin 上で記事作成・編集・コメント投稿・コメント取得まで実際に動作確認できた。

## 選択肢の比較

| 方式 | 認証 | 導入の手軽さ | 備考 |
| --- | --- | --- | --- |
| リモートMCP (公式β) | OAuth (ユーザー単位) | URLを登録してログインするだけ | Ownerの許可が前提。Devin公式対応済み |
| ローカルMCP (`esaio/esa-mcp-server`) | PAT (ESA_ACCESS_TOKEN) | docker/npx が必要 | STDIO版。リモート版と同一のツール群 |
| REST API v1 + PAT | PAT | curlやスクリプトを自分で書く | 最も原始的。gh風に使うならCLIを自作する形 |

リモートMCPが公開されたことで「Dockerやnpmのインストールとアクセストークンの設定」が不要になった、というのが公式の売り。エージェント用途でも同じことが言えて、PATの発行・管理・権限スコープの調整が不要になる。

参考: [esa公式のリモートMCPサーバーをβ公開しました](https://docs.esa.io/posts/584), [esaio/esa-mcp-server](https://github.com/esaio/esa-mcp-server), [esa API v1](https://docs.esa.io/posts/102)

## リモートMCPサーバーの仕様

- エンドポイント: `https://mcp.esa.io/` (Streamable HTTP)
- 認証: OAuth。未認証アクセスは `401` + `WWW-Authenticate: Bearer resource_metadata="https://mcp.esa.io/.well-known/oauth-protected-resource"` を返す (RFC 9728 準拠)
- 認可サーバー: `https://api.esa.io` (`.well-known/oauth-authorization-server` で確認)
  - Dynamic Client Registration (`/oauth/dcr`) 対応 → クライアント登録不要で `devin mcp login` が自動で client_id を発行する
  - PKCE (S256), refresh_token 対応
- 要求スコープ: `mcp`
- アクセス制御: チームOwnerが「SETTINGS > API・アプリ・MCP > アクセス設定 > リモートMCPサーバー」で4段階から選択
  - すべてのアクセスを許可する / ポリシーにより制限する / ポリシー+Owner承認 / すべてブロック (**デフォルト**)
  - デフォルトの許可スコープ: `admin:comment read:post write:post read:category read:tag read:attachment read:team read:member` (ポリシーで変更可)
- 監査ログ: 「SETTINGS > API・アプリ・MCP > 監査ログ」でMCP経由のアクセス履歴を確認可能
- 対応クライアント: Claude Desktop, ChatGPT, **Devin**
- β版: 仕様は予告なく変更される場合あり

## Devin CLI での設定手順 (実施済み)

```bash
# ユーザー全体に適用 (~/.config/devin/mcp_config.json)
devin mcp add -s user esa https://mcp.esa.io/
```

`add` 時点で401を検出して OAuth フローが自動開始される。ブラウザで認可URLを開き、esaにログイン → チーム選択 → 承認すると `localhost:8765/callback` にコードが返ってきてトークン保存完了。タイムアウトした場合は:

```bash
devin mcp login esa
```

でURLを再発行できる。認証後、このリポジトリのセッションでも即座に `esa` サーバーのツールが見えるようになった (再起動不要だった)。

生成された設定 (`~/.config/devin/mcp_config.json`):

```json
{
  "mcpServers": {
    "esa": { "url": "https://mcp.esa.io/", "transport": "http" }
  }
}
```

## 動作確認結果

チーム `<workspace>` に対して以下をすべて成功させた (2026-11-11)。

| 操作 | ツール | 結果 |
| --- | --- | --- |
| チーム一覧 | `esa_get_teams` | `<workspace>` を取得 |
| 統計 | `esa_get_team_stats` | 217記事/816コメント等 |
| 検索 | `esa_search_posts` | 記事一覧を返却 (body_md は truncate される) |
| 記事作成 | `esa_create_post` | [posts/218](https://<workspace>.esa.io/posts/218) をWIP作成 |
| 記事編集 | `esa_append_post` / `esa_update_post` | 追記・全文更新とも成功 |
| コメント投稿 | `esa_create_comment` | 投稿成功 |
| コメント更新 | `esa_update_comment` | `bodyMd` 差し替え成功 |
| コメント削除 | `esa_delete_comment` | 削除成功 |
| コメント取得 | `esa_get_post_comments` / `esa_get_comment` | 一覧・個別とも取得 |
| 画像入りコメント | `esa_create_comment` | Markdown `![](url)` で埋め込み成功 (posts/218 に残してある) |

提供ツールは28個で STDIO 版と同一: チーム/記事/コメント/カテゴリ/添付ファイル/ヘルプの系を網羅。`esa_ship_post`, `esa_archive_post`, `esa_rollback_post_revision` といった運用系もある。

### 画像・添付ファイルについて

- **画像の埋め込みはできる**: 記事・コメントの本文にMarkdown `![](<url>)` を書けば描画される (esaホスト `img.esa.io` でも外部URLでも)。実際に画像付きコメントを投稿・取得・削除まで確認した
- **新規アップロードはできない**: 添付系ツールは `esa_get_attachment` (取得専用。画像は30MB以下ならbase64、それ以外は署名付きURLを返す) のみで、**アップロード用ツールが存在しない**。新しい画像を使うにはesaの画面で先にアップロードしてURLを得る運用になる
- 蛇足: クライアント側で interrupt した `esa_create_comment` がサーバー側では成立していた (孤児コメントが残った)。書き込み系を中断した場合は冪等でないので、あとで対象を確認して掃除すること

### 引数の注意点

- `esa_append_post` / `esa_prepend_post` の本文引数は `bodyMd` ではなく **`content`** (バリデーションエラーで判明)
- `esa_get_post` はデフォルトで本文を truncate する。全文が必要なときは `truncate: false`
- 検索クエリは esa 固有の構文 (`created:>YYYY-MM-DD`, `in:category`, `wip:false` 等)。`after:` `before:` は使えない

## OpenCode でも確認 (v2.2.5)

```bash
opencode mcp add esa --global --url https://mcp.esa.io/   # ~/.config/opencode/opencode.json
opencode mcp auth esa                                    # URL発行 → ブラウザで承認
opencode mcp list                                        # ✓ esa connected
```

DCR+PKCE は devin と同じ流れ。コールバックは `127.0.0.1:<ephemeral port>/callback`。ブラウザがコールバックに到達できない環境向けに「リダイレクト先URLをプロンプトに貼り付ける」代替入力があるのは devin にない便利さ (SSH越しなどで有効)。接続後 `opencode run` でツール呼び出しを試そうとしたが、既定モデル (opencode zen の gemini-4-carbon) の残高不足で未確認。`mcp list` の connected まで確認済み。

## WSL2 でのOAuthブラウザ問題

今回の環境は Windows interop を切っている (`explorer.exe`/`powershell.exe` 不可) + デフォルトブラウザ未設定のため、`devin mcp login` が出すURLを開く手段がなかった。解決手順:

1. Puppeteer の Chrome (`~/.cache/puppeteer/chrome/linux-*/chrome-linux64/chrome`) を使いたかったが `libnspr4.so` 等5ライブラリ不足
2. sudo 不可のため `apt-get download libnss3 libnspr4 libasound2t64` で deb を取得し `dpkg-deb -x` で `/tmp/chromelibs` に展開 (システムインストール不要)
3. `LD_LIBRARY_PATH=/tmp/chromelibs/usr/lib/x86_64-linux-gnu chrome <URL>` で WSLg 経由のGUI起動に成功

失敗した別解: nix で `nss nspr alsa-lib` を入れて `LD_LIBRARY_PATH=~/.nix-profile/lib` とすると、profile 内の nix glibc (`librt.so.1`) が system glibc と衝突して起動しない。ディストリ native の deb 展開が正解だった。

恒久的には `BROWSER` 環境変数か `xdg-open` の仕組みに上記ラッパースクリプトを噛ませるのが良さそう。

## 関連

- 非開発者向けの導入まとめ記事: https://<workspace>.esa.io/posts/218 (このメモの検証で作ったテスト記事を再利用して書いた)

## `gh` 的な使い方 (JSON取得) について

**方針: MCP のみで使うことにした (PAT は発行しない)**。以下は調査の記録。

- セッション内では `esa_get_post` が構造化JSONを返す (`gh pr view --json` 相当)
- シェルから直接叩くには REST API v1 + PAT + `curl | jq`:
  `curl -s -H "Authorization: Bearer $ESA_TOKEN" https://api.esa.io/v1/teams/<workspace>/posts/218 | jq .`
  APIレスポンスはMCP版よりフィールドが多い (`number`, `full_name`, `body_html`, `message`, `tags` 等)
- devin の OAuth トークンは `~/.local/share/devin/mcp/oauth/<hash>.json` に保存 (`access_token`, `refresh_token`, `expires_at`)。ただし `scope: mcp` のため **API v1 直接叩きは 403** で使えない (実測)。gh的な用途には PAT v2 を別途発行する
- esa 公式の `gh` 相当CLIは存在しない。コミュニティ製はあるが PAT + curl/jq が無難

## トークンの寿命

- 保存場所: `~/.local/share/devin/mcp/oauth/<hash>.json` (`server_name`, `client_id`, `access_token`, `refresh_token`, `expires_at`)
- **アクセストークンの寿命は約2時間** (発行 23:32 → `expires_at` 翌01:32、実測値)
- `refresh_token` があり、Devin CLI が自動リフレッシュするので通常は期限を意識不要
- 再認証が必要なのはリフレッシュ失敗時や管理者による取り消し時のみ → `devin mcp logout esa && devin mcp login esa`

## エージェント用スキル

`.agents/skills/esa/SKILL.md` を作成した。esa のURL (`https://<team>.esa.io/posts/<n>`) が貼られたときに `teamName`/`postNumber` に分解して MCP ツールを呼ぶ手順、リクエスト→ツールの対応表、引数の落とし穴 (`content`, `commentId`)、画像はURL埋め込みのみ可・新規アップロード不可、認証切れ時の誘導を記載。セッションで利用されていることを確認済み。

## 残課題・メモ

- OAuthトークン: アクセストークンは約2時間で切れるが refresh_token で自動更新される。失効時のみ `devin mcp logout esa && devin mcp login esa` で再認証
- チームポリシーが「すべてブロック」の場合はOwnerの変更が先 (このチームは許可済みだった)
- `devin mcp login` は5分程度でコールバック待ちがタイムアウトする。ブラウザ準備が先
- 監査ログでエージェントの操作を追跡できるので、チーム運用でも安心材料になる

## 作成したスキルのメモ

このリポジトリにそのまま載せる気が起きなかったので、ここにメモとして残しておくことにする。

./agents/skills/esa/SKILL.md

```md
---
name: esa
description: Work with esa posts and comments through the `esa` MCP server (https://mcp.esa.io/). Use whenever the user shares an esa.io URL or asks to list, read, create, edit, or comment on esa articles.
---

# esa via MCP

The `esa` remote MCP server is configured. Always use its tools for
`*.esa.io` content — never webfetch and never `curl` to api.esa.io
(the MCP OAuth token is scope-limited to the MCP endpoint and gets 403
on the REST API).

## URL → arguments

`https://<team>.esa.io/posts/<number>` maps to `teamName=<team>`,
`postNumber=<number>`. A `#comment-<id>` fragment is the `commentId`.

## Request → tool

- "list posts / recent posts": `esa_search_posts` with `query: ""`
  (or a query — esa syntax: `in:category`, `on:category`, `tag:x`,
  `wip:false`, `created:>YYYY-MM-DD`; space = AND, `OR` supported)
- "get post N" / URL given: `esa_get_post` (body truncated by default;
  `truncate: false` for the full body)
- "get post + its comments": `esa_get_post` + `esa_get_post_comments`
- "comments across the team": `esa_get_team_comments`
- "create a post": `esa_create_post` (`name`, `bodyMd`, `tags`,
  `category`, `wip`)
- "edit a post": `esa_update_post` (full rewrite) or
  `esa_append_post` / `esa_prepend_post` (arg is **`content`**, not
  `bodyMd`)
- "comment": `esa_create_comment` / `esa_update_comment` /
  `esa_delete_comment` (arg is **`commentId`**, not `id`)
- team context: `esa_get_teams`, `esa_get_team_stats`,
  `esa_get_team_members`, `esa_get_team_tags`,
  `esa_get_top_categories`, `esa_get_all_category_paths`

## Images / attachments

- `esa_get_attachment` is retrieval-only. There is **no upload tool**,
  so new files cannot be attached via MCP.
- Posts/comments CAN embed images that already have a URL: use normal
  Markdown (`![](https://img.esa.io/...)`). Verified on comments.
- To use a new local image: tell the user to upload it in the esa UI
  first, then reference the resulting URL.

## Errors

- Auth required / tools missing → tell the user to run
  `devin mcp login esa` and open the printed URL in a browser
  (OpenCode: `opencode mcp auth esa`).
- Unknown team name → call `esa_get_teams` first and pick from the
  result.
```
