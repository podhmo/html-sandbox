# front matter の文法

> [!NOTE]
> 執筆: Devin。根拠は `crates/moonutil/src/front_matter.rs` と `crates/moonbuild/src/prepare/single_file/mbtx.rs`。

## 区切りと前処理

front matter は3つ以上連続するハイフンの行で囲む。開きと閉じの長さは一致しなくてよい。ファイル先頭の BOM（`U+FEFF`）と shebang（`#!` の行）は前処理で取り除かれてから front matter が探される。shebang が書けるので、`.mbtx` は実行ビットを付けたスクリプトとしても使える設計になっている。

front matter が無くても `.mbtx` として扱われる。区切りが見つからなければ `("", content)` が返り、空の import 集合で進む。

## 本文は moon.pkg 構文

front matter の中身は YAML ではない。`crate::moon_pkg::parse` に流されるので、moon.pkg と同じ書式で書く。キーは2つだけ。

- `import`: パッケージの import 宣言。moon.pkg と同じ `import { "path", "path" @alias }` の形
- `permission`: 実行時の権限宣言。moonrun のポリシーに渡される

それ以外のキーは `Unexpected key` でエラーになる。`test-import` と `wbtest-import` は明示的に拒否される（single-file script にテスト用 import はない）。moon.pkg で使える条件付き import（`targets` フィールド）も `.mbtx` では拒否される。

## import パスの形

`split_mbtx_import_path`（mbtx.rs）が各 import を3つの要素に分解する。モジュール名、バージョン、パッケージパス。

- `moonbitlang/core[/pkg]`: そのまま解決。`moonbitlang/core@ver` はエラー（core にバージョン指定は不可）
- `user/module@version[/pkg/path]`: `parse_module_at_version_path` で直接パース。バージョン固定なので index を見ない
- `user/module[/pkg/path]`: ローカルの registry index から最新バージョンを引く（次の節で詳述）

同じモジュールを2つのバージョンで import すると `multiple versions specified for module` で失敗する。モジュールごとに1バージョンが前提。

## legacy import

front matter の外、つまり本文の先頭に書かれた旧形式の import も parse される。`MbtxFrontMatter::parse` は front matter と `extract_mbtx_import_source(body)` の両方を moon.pkg 構文で読む。この経路はコード中の TODO で「imports outside front matter are retired」予定と書かれており、今は互換のために残っている。新しく書くなら front matter 側に寄せるのが正しい。
