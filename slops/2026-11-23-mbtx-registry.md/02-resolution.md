# バージョン無し import の解決

> [!NOTE]
> 執筆: Devin。根拠は `crates/mooncake/src/registry.rs`、`crates/mooncake/src/registry/path.rs`、`crates/mooncake/src/registry/client.rs`。

## 「registry しか import できない」の理由

`.mbtx` の import が通る形は `moonbitlang/core` と `user/module[@ver][/pkg]` の2種類だけで、ファイルシステムのパスや `moon.work` での参照は文法レベルで存在しない。`split_mbtx_import_path` がパスを分解してレジストリ座標（モジュール名とバージョン）にしか落とさないので、「リポジトリ内のローカルパッケージを相対パスで読む」は記述不能になっている。`.mbtx` が「単一ファイルで完結するスクリプト」を目指す設計の結果だ。

## バージョン無しはローカル index のみ

`user/module` の形は `Registry::resolve_cached_unversioned_path` に入る。この関数は `cached_latest_version(module)` を呼ぶだけで、ネットワークには出ない。ドキュメントコメントにも「Does not refresh registry metadata」と明記されている。

`cached_latest_version` の答えはローカル index から来る。デフォルトでは git ベースの index で、`~/.moon/registry/index/user/<owner>/<name>.index` という JSON-lines ファイルの中身が使われる（`MoonHomeLayout::registry_index_file`）。index が古ければ `moon update` で同期する。バージョン無し import が解決できないときのエラーメッセージも「run `moon update` if needed」と案内する。

一方 `user/module@version` の形はバージョンがパスに含まれるので、index の存在を必要としない。ピン留めされた import は index が空でも解決できる。

## index 以外のバックエンド

`RegistryClient::configured`（client.rs）は設定を読んで metadata backend を選ぶ。`MOON_REGISTRY_API=1` が環境にあれば HTTP の metadata backend（API endpoint から最新版を問い合わせる）になり、無ければ git index backend になる。`moon login` の credentials もここで読まれ、読めなくても警告を出して匿名アクセスで続行する。

## 実効的な意味

バージョン無し import の解決は「ローカルの index キャッシュを引く」以上のことをしない。だから、registry に公開されていないモジュールは原則 import できないし、index に載っていても cache に実体が無ければ sync 段階で落ちる。この仕組みがあるおかげで、index ファイルと cache アーカイブという2つの成果物を手で置けば、publish せずに import を通せる。それが vendoring の話（04）。
