# ガイド: `moon run --profile` / `moon test --profile` でプロファイルして改善する

本ガイドでは、MoonBit のネイティブ実行ファイルとテストをプロファイラにかけて分析し、ボトルネックを特定して修正し、再度計測するという一連の流れを、一つの手順書にまとめました。題材として、このガイドのために追加した [`moonbit/experiments/profile-demo`](https://github.com/podhmo/html-sandbox/tree/main/moonbit/experiments/profile-demo)（2,000行の文書をHTMLに変換する処理を、単純な実装と `StringBuilder` を使った実装で比較するもの）を使用しています。ここに記載されている手順通りに進めれば、他のドキュメントを参照しなくても同様の作業が可能です。

## 前提条件

- **対象**: `--target native` の MoonBit。`moon run --profile` と `moon test --profile` が対象です。
- **実測環境**: WSL2（`Linux 6.18.54.1-microsoft-standard-WSL2`, x86_64）、`moon 0.1.20261012 (748b63c 2026-10-12)`、`perf 6.18.54.1.g26d1ceb55087`。
- **注意点**: この環境では `moon run --profile` / `moon test --profile` の集計結果が空になります（詳細は §4）。そのため、「本来の使い方」（§1〜§3）と「この環境での代替手段」（§5）の両方を記載しています。どちらを使用するかは、§0 のチェックで判断してください。
- **調査記録**: 元の調査記録は [profiling.md](profiling.md) と [profiling-moonbit.md](profiling-moonbit.md) をご参照ください。

## 0. 事前確認：必要なもの

`moon run --profile` / `moon test --profile` はネイティブビルド専用で、OS のプロファイラを内部で呼び出します。

| OS | 使用プロファイラ | 必要なもの |
| --- | --- | --- |
| Linux | `perf` | `perf` が PATH にあり、DWARF のコールグラフを展開できること（libunwind / libdw） |
| macOS | `xcrun xctrace` | Xcode の Command Line Tools |

まず、これらを確認しましょう。Linux の場合：

```sh
moon version
perf --version
ldd "$(which perf)" | grep -E 'libdw|libunwind|libelf'   # コールグラフの展開に必要
cat /proc/sys/kernel/perf_event_paranoid                  # 2 以下であれば、一般ユーザーでも取得可能
```

`ldd` の出力が空の場合、本ガイドの環境と同様に `moon run --profile` / `moon test --profile` の集計結果が空になります（§4）。その際は §5 の方法を使用してください。

ただし `ldd` は目安にすぎません。この環境の `perf` は静的リンクなので、`ldd "$(which perf)"` は `not a dynamic executable` と表示します。このメッセージは標準エラー出力に出るため、上の `grep` を素通りして画面に残ります。「何も出力されない」場合だけでなく、この表示が出た場合もコールグラフは展開できません。確実に知りたい場合は `perf` 自身に聞きます。何か記録してから（§5 の `perf record` でかまいません）次を実行し、警告が出れば展開できません。

```sh
perf report -i <perf.data> --stdio
# Warning:
# Please install libunwind or libdw development packages during the perf build.
```

macOS の場合は `xcrun xctrace version` で確認します。

なお、`moon run --profile` は実行ファイル（`pkgtype(kind: "executable")` のパッケージ）にのみ使用可能です。ライブラリ内の関数を計測したい場合は、次のいずれかの方法を取ります。

- その関数を呼び出す小さなネイティブ実行ファイルを追加する（`profile-demo` の [`naive`](https://github.com/podhmo/html-sandbox/blob/main/moonbit/experiments/profile-demo/naive/main.mbt) / [`fast`](https://github.com/podhmo/html-sandbox/blob/main/moonbit/experiments/profile-demo/fast/main.mbt) が該当）。
- `moon test --profile` でテスト実行ファイルを計測する（重いテストを1つ用意しておく）。

### 計測用の実行ファイルの作り方

実行ファイルのパッケージは、`moon.pkg` に `pkgtype(kind: "executable")` を書いて作ります。`supported_targets` を `+native` に絞っておくと、他のターゲットのビルド対象になりません。`moon run --profile <名前>` の `<名前>` はパッケージの**ディレクトリ名**です。

```moonbit
// naive/moon.pkg
import {
  "moonbitlang/core/bench",
  "your/module/work",          // 計測したい関数を含むパッケージ
}

supported_targets = "+native"

pkgtype(kind: "executable")
```

`main.mbt` は、関数を繰り返し呼び出して結果を出力するだけのものです。`--` 以降の引数はそのまま渡されるので、行数と繰り返し回数を受け取れるようにしておくと、後から処理量を調整できます（§1）。出力する内容は次の3つです。プロファイラの集計が空になる環境（§4）では、この出力が唯一の手がかりになります。

- `bytes`: 出力のバイト数（実装を変えても変わらないことの確認）
- `checksum`: 出力内容のハッシュ（同上。`moon test` でも同じ値を検証する）
- `elapsed` と「1回あたりの時間」: 前後比較（§6）

```moonbit
// naive/main.mbt
fn main {
  let (lines, reps) = @work.workload_args(default_lines=2000, default_reps=70)
  let doc = @work.generate(lines)
  let mut bytes = 0
  let start = @bench.monotonic_clock_start()
  for i = 0; i < reps; i = i + 1 {
    bytes = @work.render_naive(doc).length()
  }
  let elapsed_us = @bench.monotonic_clock_end(start)
  let checksum = @work.checksum(@work.render_naive(doc))
  println(
    "naive: lines=\{lines} reps=\{reps} bytes=\{bytes} checksum=\{checksum} elapsed=\{elapsed_us}us (\{elapsed_us / reps.to_double()}us per rep)",
  )
}
```

## 1. 実行方法

`moonbit/experiments/profile-demo` を例に説明します。`--` 以降の引数は、実行ファイルに渡されます。

```sh
cd moonbit/experiments/profile-demo

# 実行ファイルを計測
moon run --profile naive -- 2000 70
moon run --profile fast  -- 2000 4000

# テスト実行ファイルを計測
moon test --profile
```

このディレクトリの [`Makefile`](https://github.com/podhmo/html-sandbox/blob/main/moonbit/experiments/profile-demo/Makefile) は、上記と同様の処理を簡潔に実行できます。

```sh
make profile       # moon run --profile naive -- 2000 70
make profile-fast  # moon run --profile fast  -- 2000 4000
make profile-test  # moon test --profile
```

`--profile` オプションは、以下の設定を自動的に適用します（`--target native` 以外は無効）。

- `--target native`
- `--release`（`--debug` も `--release` も未指定の場合）
- `--no-strip`（デバッグ情報を削除しない）

つまり、`--release --no-strip` で再ビルドした後、OS のプロファイラで実行されます。Linux では `perf` の以下の2つのコマンドが実行されます。

```sh
perf record --quiet -F 100 -e cpu-clock --call-graph dwarf -o <出力先>/perf.data -- <実行ファイル> <引数>
perf script -i <出力先>/perf.data        # この出力が <出力先>/perf-script.txt になる
```

- `-F 100`: 1秒間に100回サンプリング（1サンプル＝10msの重み）。
- `-e cpu-clock`: CPU時間のソフトウェアイベントを計測。
- `--call-graph dwarf`: スタックをDWARFで展開（関数の呼び出し関係を解析）。
- macOS では `xcrun xctrace record --template 'Time Profiler' ...` と `xctrace export --xpath '/trace-toc/run[@number="1"]/data/table[@schema="time-profile"]'` が実行されます。

`--no-strip` で作られた実行ファイルは `_build/native/release/build/<パッケージ>/<パッケージ>.exe` にあり、§5 の `nm` による名前解決はこれを対象にします。ここで注意が必要です。**`moon build --target native --release` を実行すると、同じパスの実行ファイルが strip された別物に差し替わります**（この環境ではサイズ 1249976 → 527616、Build ID も変化しました）。記録（§5 の `perf record`）と集計（`nm`）の間に通常のビルドを挟むと、名前解決が壊れます。**記録する前に実行ファイルをコピーしておいてください**（§5）。

計測時間は「100Hzで数秒」を目安に設定しています。`profile-demo` では、単純な実装が1回あたり約30msかかるため70回（約2.2秒）、高速な実装が1回あたり約0.53msかかるため4,000回（約2.1秒）としています。`make` の変数 `LINES` / `NAIVE_REPS` / `FAST_REPS` で調整可能です。

## 2. 出力内容

出力先は `_build/native/release/profile/<パッケージ>/<タイムスタンプ>/` です。実行ファイルの場合、以下のような構成になります。

```
_build/native/release/profile/naive/20261018-102156/
├── perf.data        # perf record の生データ（トレース）
├── perf-script.txt  # perf script の出力（サンプルをテキスト化）
├── stdout.txt       # 実行ファイルの標準出力
├── stderr.txt       # 実行ファイルの標準エラー
└── profile.json     # 集計結果（JSON）
```

`moon test --profile` は、テスト実行ファイルごとにサブディレクトリを作成し、全体の集計結果を親ディレクトリの `profile.json` にまとめます。

```
_build/native/release/profile/test/20261018-102353/
├── 001-work.blackbox_test/
│   ├── perf.data
│   ├── perf-script.txt
│   ├── stdout.txt
│   └── stderr.txt
└── profile.json      # 全テスト実行ファイルの集計結果
```

| ファイル | 内容 | 用途 |
| --- | --- | --- |
| `perf.data` | 生サンプル（アドレスとスタックを含む） | `perf report -i` でコールツリーを確認。`profile.json` で不足がある場合に使用 |
| `perf-script.txt` | `perf.data` をテキスト化 | 集計の根拠を確認。§5 の代替手順でも同様の形式を使用 |
| `stdout.txt` / `stderr.txt` | 実行ファイルの出力 | 実行時間・チェックサム・クラッシュの有無を確認 |
| `profile.json` | 集計結果（機械可読） | ランキングの確認（§3）。差分比較にはこれを使用 |

macOS の場合、`perf.data` / `perf-script.txt` の代わりに `profile.trace` と `time-profile.xml` が出力されます。

## 3. 結果の解釈

### ターミナル出力

`moon run --profile` は、集計結果を標準出力に表示します。まずは**サンプルが取得できた場合**の形です（数値は説明のための例で、環境により異なります）。

```
Profile: native Linux perf
Executables: 1
Samples: 418, sample weight: 10.00ms
Trace: .../perf.data
Program stdout: .../stdout.txt
Program stderr: .../stderr.txt

Top self time:
   12.3%    12.30ms     12  _M0...escape__naive
   11.0%    11.00ms     11  libc.so.6
   ...

Top inclusive time:
   30.0%    30.00ms     30  _M0...render__naive
   ...

Runtime leaf costs attributed to MoonBit callers:
    8.0%     8.00ms      8  _M0...render__naive <- _mi_page_malloc_zero
   ...

Detailed JSON report: .../profile.json
Inspect the full trace with perf:
  perf report -i .../perf.data
```

- `Top self time` などは4列で表示されます（上位12行まで）。左から割合（profiledサンプルに対する比率）、時間、サンプル数、シンボル名です。
- `Runtime leaf costs ...` の行だけは書式が異なり、`<自分の関数> <- <ランタイムの関数>` の形式で表示されます。

成功したかどうかの判定は `Samples:` の数だけです。**`Samples: 0` は失敗**（何も取得できていない）で、§4 の状態です。このときは上の形ではなく、次の形になります。

```
Samples: 0, sample weight: 10.00ms

Warnings:
  No profiled running samples with MoonBit/runtime symbols were found.

Top self time:
  no samples

Top inclusive time:
  no samples

Runtime leaf costs attributed to MoonBit callers:
  no attributed runtime leaf samples
```

この環境では §4 の理由でこの形になり、`Top self time` / `Top inclusive time` / `Runtime leaf costs ...` は**1行も表示されません**（§3 のうち、この環境で使えるのは `profile.json` と `stdout.txt` だけです）。§5 で読み替えます。

### サンプルの重み

100Hzでサンプリングするため、**1サンプル＝10ms** となります。`Samples: N` は「MoonBit/runtime のシンボルが残存したサンプル数」を指し、`profiled_time_ms = N × 10ms` で計算されます。`Samples: 0` の場合は、何も取得できていないことを意味します。

### 3つのランキング

`profile.json` の `rankings` には、以下の3つのランキングが格納されています。

1. **`self_time`**: 各サンプルのスタックの先頭（その時点で実行中の関数＝葉）をカウント。**その関数自身が消費した時間**を示します。まずはこれを確認してください。
2. **`inclusive_time`**: スタックに出現した関数を、1スタックにつき1回だけカウント。**その関数とそのすべての呼び出し先が消費した時間**を示します。「どこから手を入れるか」を判断する際に有効です。`main`、`____moonbit__main`、`@moonbitlang/async/` で始まるものはノイズとして除外されます。
3. **`runtime_leaf_attributed_to_user`**: 葉がランタイムの関数（`moonbit_*`、`_mi_*`、`mi_*`、または demangle 後に `stringview::` / `make_string` / `incref` / `decref` を含むもの）の場合、その上で最初に現れる `_M0*` の関数に加算。**ランタイム内の時間を、呼び出し元の関数に割り当てたもの**です。メモリ確保や文字列操作が重い場合に有効です。

カウント対象となるのは MoonBit 側のシンボルのみです。`_M0*`、`moonbit_*`、`_mi_*`、`mi_*`、`OUTLINED_FUNCTION_*`、`<deduplicated_symbol>`、`main` 以外は除外され、`samples_without_profile_symbols` にカウントされます。つまり、**libc 内だけで回っている時間はランキングに反映されません**。この点に注意してください。

### `profile.json`

```json
{
  "schema_version": 2,
  "report_kind": "moon.profile.agent",
  "producer": { "tool": "moon", "profiler_backend": "perf",
                "template": "cpu-clock DWARF call graph",
                "export_format": "perf script", "parser": "moon-perf-script-v1" },
  "target": { "command": "moon run --profile", "run_mode": "run", "backend": "native",
              "optimization_profile": "release", "executable": ".../naive.exe",
              "args": ["2000", "70"] },
  "artifacts": { "trace": ".../perf.data", "perf_script": ".../perf-script.txt",
                 "stdout": ".../stdout.txt", "stderr": ".../stderr.txt",
                 "json_report": ".../profile.json", "time_profile_xml": null },
  "summary": { "executables": 1, "observed_rows": 0, "running_samples": 0,
               "profiled_samples": 0, "sample_weight_ms": 10.0, "profiled_time_ms": 0.0 },
  "rankings": { "self_time": [], "inclusive_time": [],
                "runtime_leaf_attributed_to_user": [] },
  "observations": [],
  "data_quality": { "non_running_samples_ignored": 0, "missing_stack_samples": 0,
                    "samples_without_profile_symbols": 0,
                    "inclusive_symbols_suppressed_from_ranking": ["main", "____moonbit__main", "@moonbitlang/async/"],
                    "warnings": ["No profiled running samples with MoonBit/runtime symbols were found."] },
  "executables": [],
  "analysis_notes": ["self_time ranks leaf samples by the top frame in each sampled stack.", "..."]
}
```

- `summary` の数値は §3 の通りです。`observed_rows` は「ヘッダと認識されたサンプル行」、`running_samples` は「ヘッダが存在したサンプル」、`profiled_samples` は「シンボルが残存したサンプル」を指します。`observed_rows > running_samples > profiled_samples` の順に減少します。
- `rankings.*[]` の各要素は `rank` / `symbol`（demangle済み）/ `mangled_symbol`（生）/ `samples` / `time_ms` / `percent_of_profiled_samples` を含みます。
- `observations` は1位の結果について文章で説明したものです（`highest_self_time`、`highest_inclusive_time`）。
- `data_quality.warnings` はターミナルの `Warnings:` と同様です。
- `executables[]` は `moon test --profile` の場合のみ中身があり、実行ファイルごとの集計を保持します。
- `analysis_notes` はランキングの定義が記載されています。忘れてしまった場合はここを参照してください。

### 警告

- `profiled_samples == 0`: `No profiled running samples with MoonBit/runtime symbols were found.` → §4 の状態。
- `profiled_samples < 100`: `Only N profiled samples were collected; results may be noisy. Consider profiling a larger workload.`（`MIN_ACTIONABLE_SAMPLES = 100`。100Hzなら1秒分。負荷を増やして再計測を推奨）

### 生データの確認

ランキングで不十分な場合（呼び出しの木を確認したい場合）は、トレースを直接開きます。

```sh
perf report -i _build/native/release/profile/naive/20261018-102156/perf.data
```

この環境では、`perf report` も libdw が無いためコールツリーを表示できません（`Please install libunwind or libdw development packages during the perf build.` と警告されます）。§4 を参照してください。

## 4. この環境で集計が空になる理由

この環境では、`make profile`（`moon run --profile`）を実行すると `Samples: 0` となり、`profile.json` も空になります。

```console
$ moon run --profile naive -- 2000 70
Profile: native Linux perf
Executables: 1
Samples: 0, sample weight: 10.00ms
...
Warnings:
  No profiled running samples with MoonBit/runtime symbols were found.
```

原因は2つあり、いずれもこの環境の `perf` の問題です。

1. **DWARFのコールグラフが展開できない**: この `perf` は libunwind / libdw / libelf にリンクされていません。`--call-graph dwarf` は記録時にスタックの生データを `perf.data` にコピーし、展開は `perf script` 時に行います。libdw が無いため、その展開ができず、`perf-script.txt` のスタック行が空になります（`perf.data` は1.9MBあるにもかかわらず、テキストにはサンプルのヘッダしか表示されません）。展開できないのはスタックだけではありません。葉のアドレス（`ip`）だけを要求しても空になります。

   ```sh
   $ T=_build/native/release/profile/naive/20261018-102156
   $ perf script -i "$T/perf.data" -F ip
   # （空行だけが並ぶ）
   ```

   つまり、この `perf.data` にはスタックが無いだけでなく、**`ip` もシンボルもオブジェクトのパスも残っていません**。§5 の集計にそのまま使うことはできないので、`perf record` で取り直します（`--call-graph` を付けなければ `ip` は残ります）。
2. **`cpu-clock` にCPU属性がない**: このWSL2カーネルでは、`perf script` がCPU欄を出力できません。そのためヘッダが `comm pid timestamp:` となり、moonが要求する `[cpu]` が存在しないため、ヘッダと認識されません。`profile.json` の `observed_rows` が0になるのはこのためです。

確認方法：

```sh
$ ldd "$(which perf)"
	not a dynamic executable          # 静的リンク。libdw / libunwind / libelf は無い

# 出力先は profile.json の artifacts.trace。ここでは先ほどの実行結果を使用。
$ T=_build/native/release/profile/naive/20261018-102156
$ perf script -i "$T/perf.data" -F +cpu
Samples for 'cpu-clock:u' event do not have CPU attribute set. Cannot print 'cpu' field.

$ perf script -i "$T/perf.data" -F ip
# （空行だけ。葉のアドレスすら残っていない）

$ head -2 "$T/perf-script.txt"
naive.exe    4027  1813.266037:   10000000 cpu-clock:u:

# ↑ ヘッダの後にスタック行がなく、ヘッダにも [cpu] がない。
```

`perf` 自体はサンプルを取得できています（このとき233サンプル）。しかしこの `perf.data` には「スタックの展開」も「CPU欄」も「シンボルの解決」も、葉のアドレスすら残っていないため、集計には使えません。§5 では `--call-graph` を付けずに `perf record` で取り直し、取得できたサンプルを手動で集計する方法を紹介します。

## 5. 代替: `perf` と `nm` で self time を取る

`moon run --profile` が空の結果を返しても、`perf record` 自体は利用可能です。葉（スタックの先頭）のアドレスを `nm` で関数名に変換し、集計を行います。この処理を行うスクリプトが [`top.py`](https://github.com/podhmo/html-sandbox/blob/main/moonbit/experiments/profile-demo/top.py) で、**全文を付録A に掲載しています**。そのまま保存して使えます。

`perf record` に渡す実行ファイルは `_build/native/release/build/<パッケージ>/<パッケージ>.exe` です（`--profile` が `--release --no-strip` で作ったもの。§1）。先に注意したとおり通常のビルドで strip 版に差し替わるので、`moon run --profile` を1回実行して実行ファイルを作らせ、**先にコピーしてから**記録します。

```sh
cd moonbit/experiments/profile-demo

# 1. --profile に実行ファイルを作らせる（この時点の集計は空でよい）
moon run --profile naive -- 2000 70

# 2. 実行ファイルをコピーする（これ以降、記録と集計の間でビルドしない）
mkdir -p build
cp _build/native/release/build/naive/naive.exe build/naive.exe

# 3. 記録する（call graph は取得できないため、オプションを付けない）
perf record -e cpu-clock -F 100 -o build/naive.data -- build/naive.exe 2000 70

# 4. 集計する
python3 top.py build/naive.data
```

`perf record` の `--` の後ろには、コピーした実行ファイルと、`moon run --profile` に渡すのと同じ引数を書きます。`profile-demo` の [`Makefile`](https://github.com/podhmo/html-sandbox/blob/main/moonbit/experiments/profile-demo/Makefile) では、同じ手順が `make record` / `make top`（`fast` 版は `make record-fast` / `make top-fast`）になっています。`perf_event_paranoid` が 2 以下なら `sudo` は不要です（§0）。

実行ファイルをコピーし忘れた場合は、`perf.data` の `PERF_RECORD_MMAP` に実行ファイルのパスと Build ID が入っているので、そこから特定できます（コピーした実行ファイルと突き合わせれば、記録時と同じものかを確認できます）。

### `top.py` の仕組み

1. `perf script --show-mmap-events -i <data>` で、サンプルと各オブジェクトのロード位置を取得します。サンプル行は

   ```
   naive.exe   11084  5400.730022:   10000000 cpu-clock:u:   563fd9987b7c [unknown] (/path/to/naive.exe)
   ```

   の形です。葉のアドレス（`563fd9987b7c`）は16進ですが `0x` は付かず、オブジェクトのパスは**行末の丸括弧の中**に入ります。シンボル欄は `[unknown]` です（この `perf` はシンボルを解決できませんが、アドレスは残っています）。ロード位置は `PERF_RECORD_MMAP2` の行

   ```
   [0x563fd9969000(0x44000) @ 0x5000 <build id>]: r-xp /path/to/naive.exe
   ```

   から読みます。`(0x44000)` はマッピングの長さ、`@` の値はそのマッピングがファイルの何バイト目から始まるかを表します。
2. 葉のアドレスから、そのアドレスを含むマッピングの開始アドレスを引き、`@` の値を足すとファイル内オフセットになります。ロード位置は記録から読み取るため、**ASLR を無効化する必要はありません**。
3. `nm -n -S`（共有ライブラリの場合は `nm -D -n -S` も）でシンボル表を読み、オフセットを含む関数を探します。`-S` のサイズが 0 の場合は、次のシンボルの直前までとみなします。アドレスを持たない行（`U` など）は読み飛ばします。該当する関数がない場合は「そのオブジェクトのどこか」として `<オブジェクト名>+0x<オフセット>` の形でまとめます（libc の内部関数は動的シンボルに含まれないため、ここに落ちます）。
4. 出力の `samples:` は集計したサンプル数、`resolved:` は**「アドレスを既知のオブジェクトに帰属できたサンプル数」**、`unresolved:` は「どのオブジェクトかも分からなかったサンプル数」です。**関数名まで特定できたかどうかは見ていません**（`libc.so.6+0x1b0cab` のような行も `resolved` に数えます）。このため `resolved:` が多くても、上位が `+0x` 付きの行ばかりということが起きます。

call graph が取得できないため、**self time のみ**が算出されます。inclusive time は算出できません。以下の数値はこの環境の実測値で、マシンや実行のたびに数%〜十数%変動します。

### `naive` の結果

```console
$ make top
samples: 219  resolved: 216  unresolved: 3

 self%  samples  symbol
 12.79       28  libc.so.6+0x1b0ccd
 12.79       28  libc.so.6+0x1b0cdb
 11.87       26  libc.so.6+0x1b0cb2
 10.50       23  libc.so.6+0x1b0cab
  9.59       21  libc.so.6+0x1b0ce1
  9.13       20  libc.so.6+0x1b0cbf
  7.76       17  libc.so.6+0x1b0cd4
  5.94       13  libc.so.6+0x1b0cb9
  4.11        9  _mi_page_malloc_zero+0xd
  （中略）
  0.46        1  _M0FP36podhmo14profile_2ddemo4work13escape__naive+0xc4
  ...
```

上位8行はすべて libc 内の同一関数の異なるオフセット（0x1b0cab〜0x1b0ce1）で、合計で約81%を占めています。逆アセンブルすると `vmovdqu64` / `vmovdqa64` が連続するベクトル化されたメモリコピーのループで、glibc の `__memmove_*` に相当します（`objdump -d --start-address=0x1b0cab --stop-address=0x1b0ce1 /lib/x86_64-linux-gnu/libc.so.6` のようにして確認します）。この関数は動的シンボルに含まれないため、名前解決ができず、オブジェクト名とオフセットで表示されています。次に多いのは `_mi_page_malloc_zero`（mimalloc によるメモリ確保）で4%。つまり、**時間の大部分は「確保とコピー」に費やされている**ことが分かります。`escape__naive` 自身の出現は極めて少ないです。

`top.py` は `perf script` の生出力を読み取るだけなので、`moon run --profile` が生成した `perf.data` にも（`ip` さえ残っていれば）適用できます。ただし §4 のとおり、この環境の `perf.data` は `--call-graph dwarf` で記録されていて `ip` すら残っていないため、結果は得られません。上記のとおり `perf record` で取り直してください。

### `fast` の結果

```console
$ make top-fast
samples: 211  resolved: 210  unresolved: 1

 self%  samples  symbol
 27.01       57  moonbit_make_string+0x5c
  4.74       10  _M0FP36podhmo14profile_2ddemo4work14write__escaped+0x7d
  4.27        9  _M0FP36podhmo14profile_2ddemo4work14write__escaped+0x65
  3.79        8  _M0IPB13StringBuilderPB6Logger13write__string+0xa7
  3.32        7  _M0FP36podhmo14profile_2ddemo4work14write__escaped+0x62
  3.32        7  _M0IPB13StringBuilderPB6Logger11write__view+0xd5
  3.32        7  _M0IPB13StringBuilderPB6Logger13write__string+0x25
  ...
```

最も大きな割合を占めるのは `moonbit_make_string` の27%です。これは、1回の描画の最後に147KBの `String` を1つ生成する箇所（`StringBuilder::to_string`）に相当します。残りは `write_escaped`、`StringBuilder` の `write_string` / `write_view` などに数%ずつ分散しています（`has_prefix` が見えるかどうかなど、細部は実行のたびに変わります）。libc のメモリコピーはほとんど見られません。

## 6. 実例: `naive` を `fast` に直す

題材となるタスクは決まっています。2000行の Markdown 風文書を HTML に変換する処理です（7行に1つは見出し、残りは `<` `>` `&` `"` `'` を含む段落）。素朴な実装は以下の通りです。

```moonbit
// 1文字ずつエスケープし、その都度連結する
fn escape_naive(s : String) -> String {
  let mut out = ""
  for c in s {
    let esc = match c {
      '<' => "&lt;"
      '>' => "&gt;"
      '&' => "&amp;"
      '"' => "&#34;"
      '\'' => "&#39;"
      _ => c.to_string()
    }
    out = out + esc
  }
  out
}

// 1行ずつ連結する
pub fn render_naive(lines : Array[String]) -> String {
  let mut out = ""
  for line in lines {
    if line.has_prefix("## ") {
      out = out + "<h2>" + escape_naive(line[3:].to_owned()) + "</h2>\n"
    } else {
      out = out + "<p>" + escape_naive(line) + "</p>\n"
    }
  }
  out
}
```

`out = out + esc` という記述は、既存の文字列をすべて毎回コピーし直します。1行が $n$ 文字の場合、約 $n^2/2$ バイトのコピーが発生し、文書全体ではその二乗のオーダーでデータが移動します。§5 のプロファイル結果は、まさにこの問題を指し示しています（libc のメモリコピーが81%、確保が4%）。

改善後の実装では、1つの `StringBuilder` に書き込む方式を採用します。エスケープ処理は、「エスケープが必要な文字の間をまとめて書き込む」形にし、書き込み回数を文字数ではなく出現回数に抑えます。

```moonbit
fn write_escaped(sb : StringBuilder, s : StringView) -> Unit {
  let n = s.length()
  let mut start = 0
  let mut i = 0
  while i < n {
    let esc = match s[i] {
      '<' => "&lt;"
      '>' => "&gt;"
      '&' => "&amp;"
      '"' => "&#34;"
      '\'' => "&#39;"
      _ => { i = i + 1; continue }
    }
    if start < i {
      sb.write_view(s[start:i])
    }
    sb.write_string(esc)
    i = i + 1
    start = i
  }
  if start < n {
    sb.write_view(s[start:])
  }
}

pub fn render_fast(lines : Array[String]) -> String {
  let sb = StringBuilder()
  for line in lines {
    if line.has_prefix("## ") {
      sb.write_string("<h2>")
      write_escaped(sb, line[3:])
      sb.write_string("</h2>\n")
    } else {
      sb.write_string("<p>")
      write_escaped(sb, line[:])
      sb.write_string("</p>\n")
    }
  }
  sb.to_string()
}
```

### 等値検証

素朴な実装（`render_naive`）は**消さずに残し**、改善後の実装（`render_fast`）の比較用オラクルとして使います。前後比較にも等値検証にも必要です。テストは、同じパッケージの `@work.xxx` をそのまま呼ぶ形で書けます（`moon test` で実行されます）。

```moonbit
test "render_fast agrees with render_naive" {
  let lines : Array[String] = ["## Title", "a <b> & \"c\" 'd'", ""]
  assert_eq(@work.render_fast(lines), @work.render_naive(lines))
}

test "render_fast agrees with render_naive on a large document" {
  let doc = @work.generate(2000)
  let out = @work.render_fast(doc)
  assert_eq(out, @work.render_naive(doc))
  assert_eq(out.length(), 147444)
  assert_eq(@work.checksum(out), -944991265)
}
```

実行ファイル自身に `bytes=` / `checksum=` を出力させておけば（§0）、それを見比べるだけでも確認できます。念のため、出力をそのままファイルに落として `cmp` や `sha256sum` で比較してもよいでしょう。

### 計測のしかた

1回あたりの時間は、実行ファイル自身に出力させます（§0 の `elapsed=...us (....us per rep)`）。1回の計測は当てになりません。**同じバイナリを3回以上実行し、中央値で比べてください。** この環境では `naive` の1回あたりが 30.9ms〜33.9ms（約10%）変動しました。高速化の倍率が10倍程度しかない場合は、この変動で結論が逆転し得ます。

### 改善前後の比較

素朴な実装は1回あたり30.9ms（2000行×70回で2.16秒）、改善後は1回あたり0.53ms（2000行×4000回で2.13秒）です。**約58倍の高速化**が実現されました。出力は同一で、バイト数は147444、チェックサムは-944991265で、両方が一致しています（`moon test` の `render_fast agrees with render_naive` でも検証済み）。

| 実装 | 1回あたりの時間 | 70回ぶんの時間 | ボトルネック（プロファイルより） |
| --- | --- | --- | --- |
| `naive` | 30.9ms | 2.16s | libc のメモリコピー 81%、確保 4% |
| `fast` | 0.53ms | 0.037s | `moonbit_make_string` 27%、あとは薄く広く |

（いずれもこの環境での実測値です。割合や倍率はマシンにより変わります。）

プロファイルの変化にも意味があります。改善前は「同じ1つのメモリコピー」に時間が集中していました。改善後はどの関数も突出せず、最大でも「最後に147KBの `String` を1つ生成する」27%にとどまります。この段階まで来ると、次に最適化するには「147KBを返す」というAPI自体を見直し、`StringView` やストリームで返す設計に変更する必要がある、と判断できます。

### 再計測の重要性

改善後は、必ず再計測を行います。`moon run --profile` を実行し直したうえで（実行ファイルをコピーして）`perf record` → `top.py` を実行し、狙い通りにボトルネックが解消されたかを確認します。`profile-demo` では `make record-fast` → `make top-fast` です。素朴な実装に戻すのは、前後を比較し直す必要があるときだけです。

## 7. チェックリスト

1. `moon version`、`perf --version`、`ldd "$(which perf)"` で環境を確認します（`not a dynamic executable` と表示される場合もコールグラフは展開できません）。
2. 計測用の実行ファイルを用意します。行数・繰り返し回数を引数で受け取り、`bytes` / `checksum` / `elapsed`（1回あたりの時間）を出力させます（§0）。
3. 100Hzで数秒になるよう、処理量（`reps`）を調整します。
4. `moon run --profile <名前> -- <args>` または `moon test --profile` を実行します。
5. `Samples: N` を確認します。`1` 以上なら成功です。`0` の場合は §4 を読み、§5 へ移行します（その際、先に実行ファイルをコピーしておきます）。`100` 未満の場合は処理量を増やします。
6. `Top self time` で「自分自身が重い関数」、`Top inclusive time` で「呼び出し先まで含めた重い関数」を確認します。`Runtime leaf costs ...` で確保や文字列操作の犯人を特定します（§5 の方法を使う場合は、`top.py` の `self%` が `Top self time` に相当します）。
7. 必要に応じて `profile.json` を確認し、`analysis_notes` で定義を再確認します。
8. 改善を行い、出力が変わっていないことをテストと `checksum` で検証します（§6）。3回以上計測して中央値で比べ、ステップ4から繰り返します。

## 付録A: self time 集計スクリプト `top.py` の全文

[`top.py`](https://github.com/podhmo/html-sandbox/blob/main/moonbit/experiments/profile-demo/top.py) の全文です。ファイルに保存して `python3 top.py <perf.data>` で実行します（`-n` で表示行数を変更できます。既定は20行）。§5 の手順で使います。

```python
#!/usr/bin/env python3
"""top.py -- a small self-time ranking for a perf.data recorded on Linux.

Why this exists
---------------
`moon run --profile <exe>` records with

    perf record --quiet -F 100 -e cpu-clock --call-graph dwarf -o <dir>/perf.data -- <exe> <args>

and then ranks the samples itself.  That works when `perf` was built with
libunwind/libdw (to unwind the DWARF call graph) and when the kernel reports the
CPU for the `cpu-clock` event.  Some environments -- WSL2 with a `perf` built
without libunwind, in particular -- satisfy neither: `perf script` prints stacks
with `[unknown]` symbols (or none at all) and `perf` refuses to print the CPU
field, at which point `moon run --profile` reports `Samples: 0`.

`perf` there also cannot symbolize addresses, because it was not linked against
libelf/libdw.  This script fills the gap with tools that are always present:
`perf script` for the raw samples and the mmap records, `nm` for the symbols.
It resolves each sample's leaf address and prints the symbols that own the most
samples -- a flat, self-time profile, which is what usually drives the first
round of tuning.

Usage
-----
    perf record -e cpu-clock -F 100 -o out.data -- ./prog args
    python3 top.py out.data

The load address of every object is read back from the mmap records that
`perf script --show-mmap-events` prints, so ASLR does not have to be disabled.
"""

from __future__ import annotations

import argparse
import bisect
import collections
import os
import re
import subprocess
import sys


def _is_hex(text: str) -> bool:
    try:
        int(text, 16)
        return True
    except ValueError:
        return False


# A sample or mmap line:
#   naive.exe    2941  1363.751296:   10000000 cpu-clock:u:   7ffff7db0cdb [unknown] (libc.so.6)
HEADER_RE = re.compile(
    r"^\s*(?P<comm>\S.*?)\s+(?P<pid>\d+)\s+(?:\[(?P<cpu>\d+)\]\s+)?"
    r"(?P<time>\d+\.\d+):\s+(?P<period>\d+)\s+(?P<event>\S+):\s*(?P<rest>.*)$"
)
# An indented frame of a call graph (when `perf` can unwind):
#      7ffff7db0cab [unknown] (/usr/lib/x86_64-linux-gnu/libc.so.6)
FRAME_RE = re.compile(r"^\s*(?P<addr>[0-9a-f]+)\s+(?P<sym>.*?)\s+\((?P<dso>[^)]*)\)\s*$")
MMAP_RE = re.compile(
    r"PERF_RECORD_MMAP\d* \d+/\d+: \[(?P<start>0x[0-9a-f]+)\((?P<size>0x[0-9a-f]+)\)"
    r" @ (?P<off>0x[0-9a-f]+)[^\]]*\]: \S+ (?P<path>\S+)\s*$"
)

CODE_TYPES = set("tTwWiI")


class Dso:
    """One ELF object: its load ranges (for address -> file offset) and symbols."""

    def __init__(self, path: str) -> None:
        self.path = path
        self.ranges: list[tuple[int, int, int]] = []  # (start, end, base)
        self.addrs: list[int] = []
        self.sizes: list[int] = []
        self.names: list[str] = []
        self._loaded = False

    def add_mapping(self, start: int, size: int, file_off: int) -> None:
        self.ranges.append((start, start + size, start - file_off))
        self.ranges.sort()

    def _load(self) -> None:
        self._loaded = True
        table: dict[int, tuple[int, str]] = {}
        # `-S` prints the size, which is what lets us tell "inside this
        # function" from "somewhere after the last exported one".  Shared
        # libraries are stripped to their dynamic symbols, so ask for those too.
        for args in (
            ["nm", "-n", "-S", self.path],
            ["nm", "-D", "-n", "-S", self.path],
        ):
            try:
                out = subprocess.run(
                    args, capture_output=True, text=True, check=False
                ).stdout
            except OSError:
                continue
            for line in out.splitlines():
                parts = line.split(maxsplit=3)
                if len(parts) < 3:
                    continue
                if len(parts) == 4 and parts[1] != "" and _is_hex(parts[1]):
                    addr_s, size_s, kind, name = parts
                else:
                    addr_s, kind, name = parts
                    size_s = "0"
                if len(kind) != 1 or kind not in CODE_TYPES:
                    continue
                try:
                    addr = int(addr_s, 16)
                    size = int(size_s, 16)
                except ValueError:
                    continue
                table.setdefault(addr, (size, name))
        for addr in sorted(table):
            size, name = table[addr]
            self.addrs.append(addr)
            self.sizes.append(size)
            self.names.append(name)

    def resolve(self, addr: int) -> str | None:
        """Turn a runtime address into `symbol+0xoffset`, or None."""
        base = None
        for start, end, candidate in self.ranges:
            if start <= addr < end:
                base = candidate
                break
        if base is None:
            return None
        if not self._loaded:
            self._load()
        off = addr - base
        i = bisect.bisect_right(self.addrs, off) - 1
        if i < 0:
            return None
        start, size, name = self.addrs[i], self.sizes[i], self.names[i]
        if off - start < max(size, 1):
            delta = off - start
            return name if delta == 0 else f"{name}+0x{delta:x}"
        # Inside the object, but the symbol table does not cover it (a stripped
        # library's static functions).  Name the object and keep the offset.
        return f"{os.path.basename(self.path)}+0x{off:x}"


def read_script(data: str) -> str:
    result = subprocess.run(
        ["perf", "script", "--show-mmap-events", "-i", data],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0 and not result.stdout:
        sys.stderr.write(result.stderr)
        raise SystemExit(f"perf script failed on {data}")
    return result.stdout


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("data", help="a perf.data file (perf record -o <data>)")
    parser.add_argument("-n", "--top", type=int, default=20, help="rows to print")
    args = parser.parse_args()

    # One pass over the perf script output: samples tell us the leaf frame, and
    # the mmap records that perf emits alongside tell us where each object was
    # loaded, which is what turns a runtime address into a file offset.
    dsos: dict[str, Dso] = {}

    def resolve(dso_path: str, addr: int) -> str | None:
        dso = dsos.get(dso_path)
        if dso is None:
            dso = dsos[dso_path] = Dso(dso_path)
        return dso.resolve(addr)

    text = read_script(args.data)

    counter: collections.Counter[str] = collections.Counter()
    unresolved = 0
    total = 0
    pending: list[tuple[str, int]] = []

    def take():
        nonlocal unresolved, total
        if not pending:
            return
        total += 1
        dso_path, addr = pending[0]
        name = resolve(dso_path, addr) if dso_path else None
        if name is None:
            unresolved += 1
        else:
            counter[name] += 1

    for line in text.splitlines():
        if "PERF_RECORD_MMAP" in line:
            mmap = MMAP_RE.search(line)
            if mmap:
                path = mmap.group("path")
                dso = dsos.get(path)
                if dso is None:
                    dso = dsos[path] = Dso(path)
                dso.add_mapping(
                    int(mmap.group("start"), 16),
                    int(mmap.group("size"), 16),
                    int(mmap.group("off"), 16),
                )
            continue
        header = HEADER_RE.match(line)
        if header:
            take()
            pending.clear()
            rest = header.group("rest")
            if rest:
                frame = FRAME_RE.match(rest)
                if frame:
                    pending.append((frame.group("dso"), int(frame.group("addr"), 16)))
            continue
        frame = FRAME_RE.match(line)
        if frame and not pending:
            pending.append((frame.group("dso"), int(frame.group("addr"), 16)))
    take()

    if total == 0:
        print("no samples found in", args.data, file=sys.stderr)
        return 1

    print(f"samples: {total}  resolved: {total - unresolved}  unresolved: {unresolved}")
    print()
    print(f"{'self%':>6}  {'samples':>7}  symbol")
    for name, count in counter.most_common(args.top):
        pct = 100.0 * count / total
        print(f"{pct:6.2f}  {count:7d}  {name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```
