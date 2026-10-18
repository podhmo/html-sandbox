# ガイド: `moon run --profile` / `moon test --profile` でプロファイルして改善する

本ガイドでは、MoonBit のネイティブ実行ファイルとテストをプロファイラにかけて分析し、ボトルネックを特定して修正し、再度計測するという一連の流れを、一つの手順書にまとめました。題材として、このガイドのために追加した [`moonbit/experiments/profile-demo`](https://github.com/podhmo/html-sandbox/tree/main/moonbit/experiments/profile-demo)（2,000行の文書をHTMLに変換する処理を、単純な実装と `StringBuilder` を使った実装で比較するもの）を使用しています。ここに記載されている手順通りに進めれば、他のドキュメントを参照しなくても同様の作業が可能です。

## 前提条件

- **対象**: `--target native` の MoonBit。`moon run --profile` と `moon test --profile` が対象です。
- **実測環境**: WSL2（`Linux 6.18.54.1-microsoft-standard-WSL2`, x86_64）、`moon 0.1.20261012 (748b63c 2026-10-12)`、`perf 6.18.54.1.g26d1ceb55087`。
- **注意点**: この環境では `moon --profile` の集計結果が空になります（詳細は §4）。そのため、「本来の使い方」（§1〜§3）と「この環境での代替手段」（§5）の両方を記載しています。どちらを使用するかは、§0 のチェックで判断してください。
- **調査記録**: 元の調査記録は [profiling.md](profiling.md) と [profiling-moonbit.md](profiling-moonbit.md) をご参照ください。

## 0. 事前確認：必要なもの

`moon --profile` はネイティブビルド専用で、OS のプロファイラを内部で呼び出します。

| OS | 使用プロファイラ | 必要なもの |
| --- | --- | --- |
| Linux | `perf` | `perf` が PATH にあり、DWARF のコールグラフを展開できること（libunwind / libdw） |
| macOS | `xcrun xctrace` | Xcode の Command Line Tools |

まず、これらを確認しましょう。Linux の場合：

```sh
moon version
perf --version
ldd "$(which perf)" | grep -E 'libdw|libunwind|libelf'   # 何も出力されなければ、コールグラフの展開ができません
cat /proc/sys/kernel/perf_event_paranoid                  # 2 以下であれば、一般ユーザーでも取得可能
```

macOS の場合は `xcrun xctrace version` で確認します。`ldd` の出力が空の場合、本ガイドの環境と同様に `moon --profile` の集計結果が空になります（§4）。その際は §5 の方法を使用してください。

なお、`moon run --profile` は実行ファイル（`pkgtype(kind: "executable")` のパッケージ）にのみ使用可能です。ライブラリ内の関数を計測したい場合は、次のいずれかの方法を取ります。

- その関数を呼び出す小さなネイティブ実行ファイルを追加する（`profile-demo` の [`naive`](https://github.com/podhmo/html-sandbox/blob/main/moonbit/experiments/profile-demo/naive/main.mbt) / [`fast`](https://github.com/podhmo/html-sandbox/blob/main/moonbit/experiments/profile-demo/fast/main.mbt) が該当）。
- `moon test --profile` でテスト実行ファイルを計測する（重いテストを1つ用意しておく）。

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

`moon run --profile` は、集計結果を標準出力に表示します。主な項目は以下の通りです。

```
Profile: native Linux perf
Executables: 1
Samples: 0, sample weight: 10.00ms
Trace: .../perf.data
Program stdout: .../stdout.txt
Program stderr: .../stderr.txt

Warnings:
  No profiled running samples with MoonBit/runtime symbols were found.

Top self time:
  no samples

Top inclusive time:
  no samples

Runtime leaf costs attributed to MoonBit callers:
  no attributed runtime leaf samples

Detailed JSON report: .../profile.json
Inspect the full trace with perf:
  perf report -i .../perf.data
```

サンプルが取得できた場合、`Top self time` などは以下のような4列の形式で表示されます（上位12行まで）。

```
   12.3%    12.30ms     12  _M0...escape__naive
```

- 割合（profiledサンプルに対する比率）
- 時間
- サンプル数
- シンボル名

`Runtime leaf costs ...` の行は書式が異なり、`<自分の関数> <- <ランタイムの関数>` の形式で表示されます。

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

## 4. この環境で集計が空になる理由

この環境では、`make profile` を実行すると `Samples: 0` となり、`profile.json` も空になります。

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

1. **DWARFのコールグラフが展開できない**: この `perf` は libunwind / libdw / libelf にリンクされていません。`--call-graph dwarf` は記録時にスタックの生データを `perf.data` にコピーし、展開は `perf script` 時に行います。libdw が無いため、その展開ができず、`perf-script.txt` のスタック行が空になります（`perf.data` は1.9MBあるにもかかわらず、テキストにはサンプルのヘッダしか表示されません）。
2. **`cpu-clock` にCPU属性がない**: このWSL2カーネルでは、`perf script` がCPU欄を出力できません。そのためヘッダが `comm pid timestamp:` となり、moonが要求する `[cpu]` が存在しないため、ヘッダと認識されません。`profile.json` の `observed_rows` が0になるのはこのためです。

確認方法：

```sh
$ ldd "$(which perf)" | grep -E 'libdw|libunwind|libelf'
# （何も出力されない）

# 出力先は profile.json の artifacts.trace。ここでは先ほどの実行結果を使用。
$ T=_build/native/release/profile/naive/20261018-102156
$ perf script -i "$T/perf.data" -F +cpu
Samples for 'cpu-clock:u' event do not have CPU attribute set. Cannot print 'cpu' field.

$ head -2 "$T/perf-script.txt"
naive.exe    4027  1813.266037:   10000000 cpu-clock:u:

# ↑ ヘッダの後にスタック行がなく、ヘッダにも [cpu] がない。
```

`perf` 自体はサンプルを取得できています（このとき233サンプル）。不足しているのは「スタックの展開」「CPU欄」「シンボルの解決」だけです。そのため、§5 では取得できているサンプルを手動で集計する方法を紹介します。

## 5. 代替: `perf` と `nm` で self time を取る

`moon --profile` が空の結果を返しても、`perf record` 自体は利用可能です。葉（スタックの先頭）のアドレスを `nm` で関数名に変換し、集計を行います。`profile-demo` には、この処理を行う小さなスクリプト [`top.py`](https://github.com/podhmo/html-sandbox/blob/main/moonbit/experiments/profile-demo/top.py) が含まれています。

```sh
cd moonbit/experiments/profile-demo

# 記録する（call graph は取得できないため、オプションを付けない）
make record       # perf record -e cpu-clock -F 100 -o build/naive.data -- <naive.exe> 2000 70
make record-fast  # perf record -e cpu-clock -F 100 -o build/fast.data  -- <fast.exe>  2000 4000

# 集計する
make top          # python3 top.py build/naive.data
make top-fast     # python3 top.py build/fast.data
```

`perf record` で指定する実行ファイルは、`--` の後ろに `moon run --profile` と同じ引数を付与します（`make record` が行うのはこれだけです）。

### `top.py` の仕組み

1. `perf script --show-mmap-events -i <data>` を用いて、サンプルと各オブジェクトのロード位置（`PERF_RECORD_MMAP`）を取得します。
2. サンプルの葉のアドレスから、該当するオブジェクトのロード位置を差し引き、ファイル内オフセットに変換します。
3. `nm -n -S`（共有ライブラリの場合は `nm -D -n -S`）で得られるシンボル情報と照合し、そのオフセットを含む関数を特定します。該当する関数がない場合は、「そのオブジェクトのどこか」としてオブジェクト名でまとめます（libc の内部関数は動的シンボルに含まれないため）。

call graph が取得できないため、**self time のみ**が算出されます。inclusive time は算出できません。

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

上位8行はすべて libc 内の同一関数の異なるオフセット（0x1b0cab〜0x1b0ce1）で、合計で約81%を占めています。逆アセンブルすると `vmovdqu64` / `vmovdqa64` が連続するベクトル化されたメモリコピーのループで、glibc の `__memmove_*` に相当します。この関数は動的シンボルに含まれないため、名前解決ができず、オブジェクト名とオフセットで表示されています。次に多いのは `_mi_page_malloc_zero`（mimalloc によるメモリ確保）で4%。つまり、**時間の大部分は「確保とコピー」に費やされている**ことが分かります。`escape__naive` 自身の出現は極めて少ないです。

`top.py` は `perf script` の生出力を直接読み取るため、`moon --profile` が生成した `perf.data` にも適用可能です（ただし、この環境の `perf.data` は `--call-graph dwarf` で記録されており、スタック情報が空であるため、§4 の事情により結果は得られません。そのため、`make record` で再取得が必要です）。

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

最も大きな割合を占めるのは `moonbit_make_string` の27%です。これは、1回の描画の最後に147KBの `String` を1つ生成する箇所（`StringBuilder::to_string`）に相当します。残りは `write_escaped`、`StringBuilder` の `write_string` / `write_view`、`has_prefix` などに数%ずつ分散しています。libc のメモリコピーはほとんど見られません。

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

### 改善前後の比較

素朴な実装は1回あたり30.9ms（2000行×70回で2.16秒）、改善後は1回あたり0.53ms（2000行×4000回で2.13秒）です。**約58倍の高速化**が実現されました。出力は同一で、バイト数は147444、チェックサムは-944991265で、両方が一致しています（`moon test` の `render_fast agrees with render_naive` でも検証済み）。

| 実装 | 1回あたりの時間 | 70回ぶんの時間 | ボトルネック（プロファイルより） |
| --- | --- | --- | --- |
| `naive` | 30.9ms | 2.16s | libc のメモリコピー 81%、確保 4% |
| `fast` | 0.53ms | 0.037s | `moonbit_make_string` 27%、あとは薄く広く |

プロファイルの変化にも意味があります。改善前は「同じ1つのメモリコピー」に時間が集中していました。改善後はどの関数も突出せず、最大でも「最後に147KBの `String` を1つ生成する」27%にとどまります。この段階まで来ると、次に最適化するには「147KBを返す」というAPI自体を見直し、`StringView` やストリームで返す設計に変更する必要がある、と判断できます。

### 再計測の重要性

改善後は、必ず再計測を行います。`make record-fast` → `make top-fast` を実行し、狙い通りにボトルネックが解消されたかを確認します。素朴な実装に戻すのは、前後を比較し直す必要があるときだけです。

## 7. チェックリスト

1. `moon version`、`perf --version`、`ldd "$(which perf)" | grep -E 'libdw|libunwind'` で環境を確認します。
2. 100Hzで数秒になるよう、処理量（`reps`）を調整します。
3. `moon run --profile <exe> -- <args>` または `moon test --profile` を実行します。
4. `Samples: N` を確認します。`0` の場合は §4（この環境では §5 へ移行）。`100` 未満の場合は処理量を増やします。
5. `Top self time` で「自分自身が重い関数」、`Top inclusive time` で「呼び出し先まで含めた重い関数」を確認します。`Runtime leaf costs ...` で確保や文字列操作の犯人を特定します。
6. 必要に応じて `profile.json` を確認し、`analysis_notes` で定義を再確認します。
7. 改善を行い、再度ステップ3から繰り返します。出力が変わっていないことをテストで検証します。
