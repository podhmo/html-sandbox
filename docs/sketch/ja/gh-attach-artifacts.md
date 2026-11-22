# 調査メモ: gh で画像・issue artifacts を投稿する

issue や PR に対して、Markdown の本文だけでは収まらない情報 (画像・長文ドキュメント・HTML・リンク集) を gh コマンドから共有する方法の整理。

結論: **画像・動画は `--attach`、Markdown/HTML ドキュメントやリンクは `gh issue artifact` (preview) で投げられる**。どちらも issue/PR を開いた人がブラウザ上でそのまま見られる形になる。

対象バージョン: gh 2.104.0。issue <https://github.com/podhmo/html-sandbox/issues/189> で動作確認済み。

## 使い分け

| 共有したいもの | コマンド | 表示され方 |
| --- | --- | --- |
| 画像・動画 | `gh issue comment --attach` 等 | コメント内にインライン表示 |
| Markdown / HTML ドキュメント | `gh issue artifact create <file>` | issue に紐づく独立ドキュメント |
| リンク | `gh issue artifact create <url>` | issue に紐づくリンクカード |
| CI のビルド成果物 | `gh run download` (別物) | Actions artifacts。今回の話題ではない |

`gh issue artifact` で扱う "issue artifacts" は **GitHub Actions の artifacts ではない**。issue に添付される Markdown ドキュメント、HTML ドキュメント、リンクのこと。preview 機能なので仕様変更の可能性あり。

## 画像・動画: `--attach`

以下のコマンドすべてで同じ `--attach` が使える:

- `gh issue create` / `gh issue edit` / `gh issue comment`
- `gh pr create` / `gh pr comment`
- `gh issue artifact create` / `gh issue artifact edit` (artifact 本文中の画像用)

```bash
# コメントに画像を添付 (本文で参照しなくても末尾に追加される)
gh issue comment 123 --attach ./screenshot.png

# alt テキストはパスのあとに # で書く
gh issue comment 123 --attach './login.png#The login error state'

# 本文から参照すると参照先URLがアップロード済みアセットに書き換わる
gh issue comment 123 -b 'エラー画面: ![error](./login.png)' --attach ./login.png

# 複数ファイルはフラグを繰り返す (1コマンド最大50ファイル)
gh pr comment 13 --attach ./before.png --attach ./after.png
```

挙動のポイント:

- `--body-file` を使う場合、本文中の相対パスは **body-file のあるディレクトリ基準** (なければ cwd) で解決される
- 動画はプレイヤーとして描画される。alt テキストは持てない (`#` を付けても無効)
- `create`/`edit` で一部の添付だけ失敗しても、成功分で作成・更新は行われる (終了コードは非0、URLは stdout に出る)

## ドキュメント・リンク: `gh issue artifact` (preview)

サブコマンド: `create` / `edit` / `list` / `view` / `download` / `delete`

### 作る

```bash
# ファイルからドキュメントを作る (名前はファイル名)
gh issue artifact create 142 signin-plan.md

# # で名前を指定できる
gh issue artifact create 142 'signin-plan.md#Sign-in plan'

# .html は HTML ドキュメント (type: embedded_html) になる
gh issue artifact create 142 menu-prototype.html

# URL を渡すとリンク artifact になる (名前はホスト名、--name で上書き)
# ただし --name は「1つだけ作るとき」限定。複数引数と併用するとエラー
gh issue artifact create 142 https://example.com/runbook --name 'Staging runbook'

# stdin / --body から直接作る
cat order-sync.log | gh issue artifact create 142 --body-file - --name 'Order sync log'

# ドキュメント中の画像も一緒にアップロードできる
gh issue artifact create 142 signin-plan.md --attach ./signin-flow.png
```

### 見る・直す・消す

```bash
gh issue artifact list 142                      # 一覧 (--json も可)
gh issue artifact view 142 2                    # 内容を表示 (--version で履歴も見える)
gh issue artifact view 142 2 --web              # ブラウザで開く

gh issue artifact edit 142 2 --body-file new.md # 内容を差し替え (type は変わらない)
gh issue artifact edit 142 2 --name 'v2'        # リネーム
gh issue artifact edit 142 2 --restore-version 5  # 旧版に戻す

gh issue artifact download 142                  # 全件ダウンロード (<number>-<name> で保存)
gh issue artifact download 142 2 --output -     # 1件を stdout に

gh issue artifact delete 142 2 --yes            # 削除 (復元不可)
```

### 型と注意点

- artifact の type: `generic` (Markdown等) / `embedded_html` / `link` / `plan` (現在は generic と同じ扱い)。`--type` で上書き可
- `create` の出力は `created\t<number>\t<name>\t<source>` のTSV形式 (実測)
- 複数ファイル・URLをまとめて渡せるが `--name` はそのとき使えない。個別に名前を付けたい場合は `file#name` 構文か、1件ずつ実行する
- **type は作成時に決まり edit では変えられない**。link の新しい内容は http(s) URL か `.url` ファイルのみ
- 名前に使えない文字 (括弧など) があり、`plan (1).md` → `plan 1.md` のように自動で除去される
- artifact は編集履歴 (versions) を持つ。`view --version` / `download --version` で旧版を参照できる
- `--restore-version N` で旧版に戻せる。上書きではなく「旧版の内容を持つ新バージョン」として追加される (実測: v1→v2→restore→v3)
- `--json versions` で履歴一覧を取れるが `number` フィールドは null で返る (v2.104.0 実測)。バージョン番号は `view` の `version:` 行を見るのが確実

## どちらを使うか

- コメントに図を1枚添えるだけ → `--attach` で十分
- Markdown の範囲を超える情報 (長い調査メモ、描画済みHTMLレポート、参考URLの束) を issue に残したい → `gh issue artifact`。コメントを汚さず独立したドキュメントとして管理でき、編集履歴も残る
- artifact は preview 機能のため、スクリプトに組み込む場合は仕様変更に注意

## 動作確認メモ (issue #189)

- `issue create --attach`: 本文の `![red](/tmp/test-red.png)` がアップロード済みアセットURLに書き換わることを確認
- `artifact create`: `.md`→`generic`、`.html`→`embedded_html`、URL→`link` に自動振り分け。stdin (`--body-file -`) も可
- `artifact edit --body-file` で版が上がり、`view --version 1` / `download --version 1` で初版を取得できた
- `artifact edit --restore-version 1` で v3 として復元された
