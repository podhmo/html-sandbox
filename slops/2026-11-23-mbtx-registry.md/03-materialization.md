# 依存の実体化: 合成モジュールと .mooncakes

> [!NOTE]
> 執筆: Devin。根拠は `crates/moonbuild/src/prepare/single_file.rs`、`crates/mooncake/src/pkg/sync.rs`、`crates/moonutil/src/dirs.rs`。実測値は html-sandbox の `tools/svg-gen/_build/` にある生成物。

## 合成モジュール

front matter から得た `module → version` の対は `auto_sync_for_single_file_rr` で合成 MoonMod に突っ込まれる。名前は `SINGLE_FILE_TEST_MODULE`、バージョンは `0.0.1`、deps には import から得たモジュールだけが入る。つまり `.mbtx` ファイルは「その場で作った1モジュールの唯一のパッケージ」としてビルド系に渡される。

## sync

`sync_roots` が通常の依存解決を回す。推移的な依存もここで解決される（例えば `podhmo/svg-gen` を import すると、それが依存する `moonbitlang/async` なども降ってくる）。解決に使うのも同じ registry で、index の JSON-lines と cache の source archive が読まれる。

## 配置先

single-file project の `PackageDirs` では、`target_dir` はファイル名を含む。`prepare_target_dir(package_dirs.target_dir.join(file_name))` なので、`moon run fig-x.mbtx` の成果物は `<source_dir>/_build/fig-x.mbtx/` 以下に作られる。`mooncakes_dir = target_dir.join(".mooncakes")` なので、依存パッケージは `<source_dir>/_build/fig-x.mbtx/.mooncakes/` に materialize される。

実際の配置を html-sandbox で確認すると、`_build/check.mbtx/.mooncakes/` の下に `podhmo/svg-gen/` と `moonbitlang/async/` のソースツリーが展開され、`.moon-lock` も同じ場所に置かれている。moon のライブラリも一般のリポジトリと同じように `moon.work` や `moon.mod` ごと展開されるので、中身を直接読むことができる。

## lock

`.mooncakes/.moon-lock` に解決済みの依存グラフが残る。チェックサムが変わるとこの lock が stale になるので、`moon clean --dep-cache` で消す。vendoring の話（04）で出てくる。
