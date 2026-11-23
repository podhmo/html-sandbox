# .mbtx の import はどう解決されるか

> [!NOTE]
> 執筆: Devin。調査対象は [moonbitlang/moon](https://github.com/moonbitlang/moon)（読んだ版は moon 0.1.20261119、commit 738607b）。動機は本記事の作業で出てきた「.mbtx は registry のモジュールしか import できない」という制約の裏側を確かめること。

## 問いと結論

`.mbtx` スクリプトの先頭に書く `import { "podhmo/svg-gen" @svg }` は、誰がどう解決しているのか。moon（CLI）がやるのか、コンパイラ（moonc）がやるのか。

結論は moon CLI 側。`crates/moonbuild/src/prepare/single_file/` が front matter を読んで依存を解決し、`mooncake` がレジストリからソースを取って `.mooncakes/` に展開する。コンパイラには解決済みのパッケージパスしか渡らない。レジストリという概念を持つのは moon のビルド系だけだ。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 30 682 145.8" width="682" height="146" role="img" aria-label="how moon run resolves .mbtx imports: parse front matter, resolve via the registry index, sync the cache, materialize .mooncakes, then compile">
<rect x="10" y="40" width="110" height="44" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="65" y="62" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">1. front matter</text>
<text x="65" y="100" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">moon.pkg syntax</text>
<rect x="148" y="40" width="110" height="44" rx="8" fill="none" stroke="#E69F00" stroke-width="1.5"/>
<text x="203" y="62" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">2. resolve</text>
<text x="203" y="100" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">registry index</text>
<path d="M124 62 L144 62" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/><path d="M135 66.05 L144 62 L135 57.95" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/>
<rect x="286" y="40" width="110" height="44" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="341" y="62" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">3. sync</text>
<text x="341" y="100" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">registry cache</text>
<path d="M262 62 L282 62" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/><path d="M273 66.05 L282 62 L273 57.95" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/>
<rect x="424" y="40" width="110" height="44" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="479" y="62" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">4. materialize</text>
<text x="479" y="100" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">.mooncakes/</text>
<path d="M400 62 L420 62" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/><path d="M411 66.05 L420 62 L411 57.95" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/>
<rect x="562" y="40" width="110" height="44" rx="8" fill="none" stroke="#CC79A7" stroke-width="1.5"/>
<text x="617" y="62" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">5. compile</text>
<text x="617" y="100" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">moonc</text>
<path d="M538 62 L558 62" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/><path d="M549 66.05 L558 62 L549 57.95" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/>
<text x="340" y="150" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">stages 1-4: moon CLI (moonbuild + mooncake)</text>
<text x="340" y="164" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">stage 5: the compiler sees only resolved package paths</text>
</svg>
```

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 30 682 145.8" width="682" height="146" role="img" aria-label="how moon run resolves .mbtx imports: parse front matter, resolve via the registry index, sync the cache, materialize .mooncakes, then compile">
<rect x="10" y="40" width="110" height="44" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="65" y="62" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">1. front matter</text>
<text x="65" y="100" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">moon.pkg syntax</text>
<rect x="148" y="40" width="110" height="44" rx="8" fill="none" stroke="#E69F00" stroke-width="1.5"/>
<text x="203" y="62" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">2. resolve</text>
<text x="203" y="100" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">registry index</text>
<path d="M124 62 L144 62" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/><path d="M135 66.05 L144 62 L135 57.95" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/>
<rect x="286" y="40" width="110" height="44" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="341" y="62" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">3. sync</text>
<text x="341" y="100" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">registry cache</text>
<path d="M262 62 L282 62" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/><path d="M273 66.05 L282 62 L273 57.95" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/>
<rect x="424" y="40" width="110" height="44" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="479" y="62" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">4. materialize</text>
<text x="479" y="100" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">.mooncakes/</text>
<path d="M400 62 L420 62" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/><path d="M411 66.05 L420 62 L411 57.95" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/>
<rect x="562" y="40" width="110" height="44" rx="8" fill="none" stroke="#CC79A7" stroke-width="1.5"/>
<text x="617" y="62" font-size="11" text-anchor="middle" dominant-baseline="central" fill="currentColor">5. compile</text>
<text x="617" y="100" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">moonc</text>
<path d="M538 62 L558 62" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/><path d="M549 66.05 L558 62 L549 57.95" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.7"/>
<text x="340" y="150" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">stages 1-4: moon CLI (moonbuild + mooncake)</text>
<text x="340" y="164" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.6">stage 5: the compiler sees only resolved package paths</text>
</svg>
```

## front matter の文法

### 区切りと前処理

front matter は3つ以上連続するハイフンの行で囲む。開きと閉じの長さは一致しなくてよい。ファイル先頭の BOM（`U+FEFF`）と shebang（`#!` の行）は前処理で取り除かれてから front matter が探される。shebang が書けるので、`.mbtx` は実行ビットを付けたスクリプトとしても使える設計になっている。

front matter が無くても `.mbtx` として扱われる。区切りが見つからなければ `("", content)` が返り、空の import 集合で進む。

### 本文は moon.pkg 構文

front matter の中身は YAML ではない。`crate::moon_pkg::parse` に流されるので、moon.pkg と同じ書式で書く。キーは2つだけ。

- `import`: パッケージの import 宣言。moon.pkg と同じ `import { "path", "path" @alias }` の形
- `permission`: 実行時の権限宣言。moonrun のポリシーに渡される

それ以外のキーは `Unexpected key` でエラーになる。`test-import` と `wbtest-import` は明示的に拒否される（single-file script にテスト用 import はない）。moon.pkg で使える条件付き import（`targets` フィールド）も `.mbtx` では拒否される。

### import パスの形

`split_mbtx_import_path`（mbtx.rs）が各 import を3つの要素に分解する。モジュール名、バージョン、パッケージパス。

- `moonbitlang/core[/pkg]`: そのまま解決。`moonbitlang/core@ver` はエラー（core にバージョン指定は不可）
- `user/module@version[/pkg/path]`: `parse_module_at_version_path` で直接パース。バージョン固定なので index を見ない
- `user/module[/pkg/path]`: ローカルの registry index から最新バージョンを引く（次の節で詳述）

同じモジュールを2つのバージョンで import すると `multiple versions specified for module` で失敗する。モジュールごとに1バージョンが前提。

### legacy import

front matter の外、つまり本文の先頭に書かれた旧形式の import も parse される。`MbtxFrontMatter::parse` は front matter と `extract_mbtx_import_source(body)` の両方を moon.pkg 構文で読む。この経路はコード中の TODO で「imports outside front matter are retired」予定と書かれており、今は互換のために残っている。新しく書くなら front matter 側に寄せるのが正しい。

## バージョン無し import の解決

### 「registry しか import できない」の理由

`.mbtx` の import が通る形は `moonbitlang/core` と `user/module[@ver][/pkg]` の2種類だけで、ファイルシステムのパスや `moon.work` での参照は文法レベルで存在しない。`split_mbtx_import_path` がパスを分解してレジストリ座標（モジュール名とバージョン）にしか落とさないので、「リポジトリ内のローカルパッケージを相対パスで読む」は記述不能になっている。`.mbtx` が「単一ファイルで完結するスクリプト」を目指す設計の結果だ。

### バージョン無しはローカル index のみ

`user/module` の形は `Registry::resolve_cached_unversioned_path` に入る。この関数は `cached_latest_version(module)` を呼ぶだけで、ネットワークには出ない。ドキュメントコメントにも「Does not refresh registry metadata」と明記されている。

`cached_latest_version` の答えはローカル index から来る。デフォルトでは git ベースの index で、`~/.moon/registry/index/user/<owner>/<name>.index` という JSON-lines ファイルの中身が使われる（`MoonHomeLayout::registry_index_file`）。index が古ければ `moon update` で同期する。バージョン無し import が解決できないときのエラーメッセージも「run `moon update` if needed」と案内する。

一方 `user/module@version` の形はバージョンがパスに含まれるので、index の存在を必要としない。ピン留めされた import は index が空でも解決できる。

### index 以外のバックエンド

`RegistryClient::configured`（client.rs）は設定を読んで metadata backend を選ぶ。`MOON_REGISTRY_API=1` が環境にあれば HTTP の metadata backend（API endpoint から最新版を問い合わせる）になり、無ければ git index backend になる。`moon login` の credentials もここで読まれ、読めなくても警告を出して匿名アクセスで続行する。

### 実効的な意味

バージョン無し import の解決は「ローカルの index キャッシュを引く」以上のことをしない。だから、registry に公開されていないモジュールは原則 import できないし、index に載っていても cache に実体が無ければ sync 段階で落ちる。この仕組みがあるおかげで、index ファイルと cache アーカイブという2つの成果物を手で置けば、publish せずに import を通せる。それが 「ローカル開発の vendoring」節。

## 依存の実体化: 合成モジュールと .mooncakes

### 合成モジュール

front matter から得た `module → version` の対は `auto_sync_for_single_file_rr` で合成 MoonMod に突っ込まれる。名前は `SINGLE_FILE_TEST_MODULE`、バージョンは `0.0.1`、deps には import から得たモジュールだけが入る。つまり `.mbtx` ファイルは「その場で作った1モジュールの唯一のパッケージ」としてビルド系に渡される。

### sync

`sync_roots` が通常の依存解決を回す。推移的な依存もここで解決される（例えば `podhmo/svg-gen` を import すると、それが依存する `moonbitlang/async` なども降ってくる）。解決に使うのも同じ registry で、index の JSON-lines と cache の source archive が読まれる。

### 配置先

single-file project の `PackageDirs` では、`target_dir` はファイル名を含む。`prepare_target_dir(package_dirs.target_dir.join(file_name))` なので、`moon run fig-x.mbtx` の成果物は `<source_dir>/_build/fig-x.mbtx/` 以下に作られる。`mooncakes_dir = target_dir.join(".mooncakes")` なので、依存パッケージは `<source_dir>/_build/fig-x.mbtx/.mooncakes/` に materialize される。

実際の配置を html-sandbox で確認すると、`_build/check.mbtx/.mooncakes/` の下に `podhmo/svg-gen/` と `moonbitlang/async/` のソースツリーが展開され、`.moon-lock` も同じ場所に置かれている。moon のライブラリも一般のリポジトリと同じように `moon.work` や `moon.mod` ごと展開されるので、中身を直接読むことができる。

### lock

`.mooncakes/.moon-lock` に解決済みの依存グラフが残る。チェックサムが変わるとこの lock が stale になるので、`moon clean --dep-cache` で消す。「ローカル開発の vendoring」節で触れる。

## ローカル開発の vendoring がなぜ動くか

### registry が要求する2つの成果物

moon がローカルでレジストリを引くとき、参照先は `~/.moon/registry/`（正確には `MOON_HOME/registry/`）に固定される。その下に2種類のファイルがある。

- `index/user/<owner>/<module>.index`: git index 用の JSON-lines。各行が1バージョンのエントリで、`name`、`version`、`checksum` を含む。`cached_latest_version` が読むのはこれ
- `cache/<owner>/<module>/<version>.zip`: publish 済みソースのアーカイブ。`download_archives` が読むもの。解凍される前に checksum で検証される

vendoring とは、この2つを `moon package` の出力から手で作ること。svg-gen の `vendor.sh` では、`moon package` が作る `_build/publish/<name>-<ver>.zip` を `registry/cache/<owner>/<module>/<ver>.zip` に置き、sha256 を計算して `index/user/<owner>/<module>.index` を1行の JSON-lines で書き出す。

### 動く理由

2つ揃うと、`resolve_cached_unversioned_path` が index から最新版を引けるので「`podhmo/svg-gen` のバージョン無し import」が通り、sync の段階で `registry/cache` の zip が checksum 付きで検証・展開される。moon の見方では、mooncakes に publish 済みのモジュールと区別がつかない。publish 後は同じ `import { "podhmo/svg-gen" }` がそのままリモートの index と cache を引くので、import の書き方を変えずに vendoring をやめられる。

### 失敗しやすい点

- チェックサムが index と一致しないと sync で reject される。`vendor.sh` は `sha256sum`（無ければ `shasum -a 256`）で zip の hash を計算して index に書き込む。空チェックサムだと import 時に落ちるので、checksum コマンドが見つからない環境では明示的に失敗させる
- ライブラリの API を変えて `vendor.sh` を流さないと、`.mooncakes` に古い版が残ったまま `.mbtx` が解決する。index の checksum が変わると `moon clean --dep-cache` で stale な dep graph を消す必要がある
- 複数の `.mbtx` が同じ `.mooncakes` を共有するのではなく、ファイルごとに `_build/<file>.mbtx/.mooncakes/` が作られる。index が更新されても各ファイルの `.mooncakes` はそのまま残るので、library を頻繁に変えるなら再 sync が要る

### 視点

vendoring は hack ではなく「registry が要求する形をローカルに作る」作業だ。moon 側は `MOON_HOME` 直下のレイアウトしか見ないので、`~/.moon/registry/` に正しい index と cache を置けば、後は publish と同じ経路を通る。

## 背景の確認

`moon run` に `.mbt` を渡すと deprecated 警告が出る。`moonbuild/src/prepare/single_file.rs` で「Standalone `.mbt` files are deprecated. Use `.mbtx` for scripts and declare imports in front matter.」と warning を出している。`.md`（MbtMd）はまた別の front matter 形式（`moonbit` セクションに deps/import/backend）を持つ。
