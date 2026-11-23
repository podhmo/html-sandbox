# ローカル開発の vendoring がなぜ動くか

> [!NOTE]
> 執筆: Devin。根拠は `crates/moonutil/src/moon_dir.rs` の `MoonHomeLayout` と `crates/mooncake/src/registry.rs`。実装は html-sandbox の `tools/svg-gen/vendor.sh`。

## registry が要求する2つの成果物

moon がローカルでレジストリを引くとき、参照先は `~/.moon/registry/`（正確には `MOON_HOME/registry/`）に固定される。その下に2種類のファイルがある。

- `index/user/<owner>/<module>.index`: git index 用の JSON-lines。各行が1バージョンのエントリで、`name`、`version`、`checksum` を含む。`cached_latest_version` が読むのはこれ
- `cache/<owner>/<module>/<version>.zip`: publish 済みソースのアーカイブ。`download_archives` が読むもの。解凍される前に checksum で検証される

vendoring とは、この2つを `moon package` の出力から手で作ること。svg-gen の `vendor.sh` では、`moon package` が作る `_build/publish/<name>-<ver>.zip` を `registry/cache/<owner>/<module>/<ver>.zip` に置き、sha256 を計算して `index/user/<owner>/<module>.index` を1行の JSON-lines で書き出す。

## 動く理由

2つ揃うと、`resolve_cached_unversioned_path` が index から最新版を引けるので「`podhmo/svg-gen` のバージョン無し import」が通り、sync の段階で `registry/cache` の zip が checksum 付きで検証・展開される。moon の見方では、mooncakes に publish 済みのモジュールと区別がつかない。publish 後は同じ `import { "podhmo/svg-gen" }` がそのままリモートの index と cache を引くので、import の書き方を変えずに vendoring をやめられる。

## 失敗しやすい点

- チェックサムが index と一致しないと sync で reject される。`vendor.sh` は `sha256sum`（無ければ `shasum -a 256`）で zip の hash を計算して index に書き込む。空チェックサムだと import 時に落ちるので、checksum コマンドが見つからない環境では明示的に失敗させる
- ライブラリの API を変えて `vendor.sh` を流さないと、`.mooncakes` に古い版が残ったまま `.mbtx` が解決する。index の checksum が変わると `moon clean --dep-cache` で stale な dep graph を消す必要がある
- 複数の `.mbtx` が同じ `.mooncakes` を共有するのではなく、ファイルごとに `_build/<file>.mbtx/.mooncakes/` が作られる。index が更新されても各ファイルの `.mooncakes` はそのまま残るので、library を頻繁に変えるなら再 sync が要る

## 視点

vendoring は hack ではなく「registry が要求する形をローカルに作る」作業だ。moon 側は `MOON_HOME` 直下のレイアウトしか見ないので、`~/.moon/registry/` に正しい index と cache を置けば、後は publish と同じ経路を通る。
