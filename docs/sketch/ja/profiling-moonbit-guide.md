# ガイド: `moon run --profile` / `moon test --profile` でプロファイルして直す

MoonBit の native 実行ファイルとテストを profiler にかけ、結果を読み、当たりをつけ、
直し、もう一度測る、という流れをこの 1 枚で完結するように書いた。題材はこのガイドの
ために足した `moonbit/experiments/profile-demo`（2000 行の文書を HTML にする仕事を、
素朴な実装と `StringBuilder` の実装で比べる）。ここに書いてある通りに手を動かせば、
他のドキュメントを読まなくても同じことができる。

- 対象: `--target native` の MoonBit。`moon run --profile` と `moon test --profile`。
- このガイドの実測環境: WSL2（`Linux 6.18.54.1-microsoft-standard-WSL2`, x86_64）、
  `moon 0.1.20261012 (748b63c 2026-10-12)`、`perf 6.18.54.1.g26d1ceb55087`。
- **この環境では `moon --profile` の集計が空になる**（理由は §4）。そこで「本来の使い方」
  （§1〜§3）と「この環境での代替」（§5）の両方を書く。どちらを使うかは §0 のチェックで決める。
- 元の調査の記録は [profiling.md](profiling.md) と
  [profiling-moonbit.md](profiling-moonbit.md)（[issue #39](https://github.com/podhmo/html-sandbox/issues/39)）。

## 0. 使う前に: 何が必要か

`moon --profile` は native 専用で、裏で OS の profiler を呼ぶ。

| OS | 使う profiler | 必要なもの |
| --- | --- | --- |
| Linux | `perf` | `perf` が PATH にあり、DWARF の call graph を展開できること（libunwind / libdw） |
| macOS | `xcrun xctrace` | Xcode の Command Line Tools |

最初にこれを確かめる。Linux なら:

```sh
moon version
perf --version
ldd "$(which perf)" | grep -E 'libdw|libunwind|libelf'   # 何も出ないと call graph を展開できない
cat /proc/sys/kernel/perf_event_paranoid                  # 2 以下なら一般ユーザでも取れる
```

macOS なら `xcrun xctrace version`。`ldd` の 1 行が何も出さない場合、このガイドの
環境と同じで、`moon --profile` の集計は空になる（§4）。そのときは §5 の方法を使う。

`moon run --profile` は実行ファイル（`pkgtype(kind: "executable")` のパッケージ）にしか
使えない。ライブラリの関数を測りたいときは、次のどちらか。

- その関数を呼ぶ小さな native 実行ファイルを足す（`profile-demo` の `naive` / `fast` がこれ）。
- `moon test --profile` でテスト実行ファイルを測る（重いテストを 1 つ入れておく）。

## 1. 実行する

`moonbit/experiments/profile-demo` を例にする。`--` の後ろは実行ファイルの引数になる。

```sh
cd moonbit/experiments/profile-demo

# 実行ファイルを測る
moon run --profile naive -- 2000 70
moon run --profile fast  -- 2000 4000

# テスト実行ファイルを測る
moon test --profile
```

このディレクトリの Makefile は同じことを的を絞って行う。

```sh
make profile       # moon run --profile naive -- 2000 70
make profile-fast  # moon run --profile fast  -- 2000 4000
make profile-test  # moon test --profile
```

`--profile` は次を強制する（`--target native` 以外は受け付けない）。

- `--target native`
- `--release`（`--debug` も `--release` も指定していないときだけ）
- `--no-strip`（デバッグ情報を落とさない）

`--release --no-strip` でビルドし直してから、OS の profiler で実行する。Linux では
`perf` のこの 2 つが走る。

```sh
perf record --quiet -F 100 -e cpu-clock --call-graph dwarf -o <出力先>/perf.data -- <実行ファイル> <引数>
perf script -i <出力先>/perf.data        # この出力が <出力先>/perf-script.txt になる
```

- `-F 100` は 1 秒に 100 回サンプルする。つまり **1 サンプル = 10ms** の重み。
- `-e cpu-clock` は CPU 時間のソフトウェアイベント。
- `--call-graph dwarf` はスタックを DWARF で展開する（関数の呼び出し関係を取る）。
- macOS では `xcrun xctrace record --template 'Time Profiler' ...` と
  `xctrace export --xpath '/trace-toc/run[@number="1"]/data/table[@schema="time-profile"]'` が走る。

仕事の量は「100Hz で数秒」に合わせる。`profile-demo` は素朴な実装で 1 回 30ms なので
70 回（約 2.2 秒）、速い実装で 1 回 0.53ms なので 4000 回（約 2.1 秒）にしてある。
`make` の変数 `LINES` / `NAIVE_REPS` / `FAST_REPS` で変えられる。

## 2. 生成物

出力先は `_build/native/release/profile/<パッケージ>/<タイムスタンプ>/`。実行ファイルのときは:

```
_build/native/release/profile/naive/20261018-102156/
├── perf.data        # perf record の生データ（trace）
├── perf-script.txt  # perf script の出力（サンプルをテキスト化したもの）
├── stdout.txt       # 実行ファイルの標準出力
├── stderr.txt       # 実行ファイルの標準エラー
└── profile.json     # 集計結果（JSON）
```

`moon test --profile` はテスト実行ファイルごとにサブディレクトリを作り、全体をまとめた
`profile.json` を親に置く。

```
_build/native/release/profile/test/20261018-102353/
├── 001-work.blackbox_test/
│   ├── perf.data
│   ├── perf-script.txt
│   ├── stdout.txt
│   └── stderr.txt
└── profile.json      # 全テスト実行ファイルをまとめた集計
```

| ファイル | 何が入っているか | どう使うか |
| --- | --- | --- |
| `perf.data` | 生のサンプル。アドレスとスタックを含む | `perf report -i` で call tree を見る。`profile.json` で足りないときに開く |
| `perf-script.txt` | `perf.data` をテキストにしたもの | 集計の根拠。中身を目で追える。§5 の代替手順でも同じ形式を読む |
| `stdout.txt` / `stderr.txt` | 実行ファイルの出力 | 実行時間・チェックサム・クラッシュの確認 |
| `profile.json` | 集計結果。機械可読 | ランキングを読む（§3）。差分を取るならこれ |

macOS では `perf.data` / `perf-script.txt` の代わりに `profile.trace` と `time-profile.xml` が出る。

## 3. 結果の読み方

### ターミナル出力

`moon run --profile` は集計を標準出力に出す。節は 4 つ。

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

サンプルが取れたときの `Top self time` などは、1 行が

```
   12.3%    12.30ms     12  _M0...escape__naive
```

の 4 列（profiled サンプルに対する割合、時間、サンプル数、シンボル）で、上位 12 行
（`DEFAULT_TOP = 12`）まで出る。`Runtime leaf costs ...` の行だけ書式が違い、
`<自分の関数> <- <ランタイムの関数>` になる。

### サンプルの重み

100Hz で取るので **1 サンプル = 10ms**。`Samples: N` は「MoonBit/runtime のシンボルが
残ったサンプル数」で、`profiled_time_ms = N × 10ms`。`Samples: 0` なら何も取れていない。

### 3 つのランキング

`profile.json` の `rankings` に 3 つ入る。意味はこう。

1. `self_time`: 各サンプルのスタックの先頭（そのとき実行していた関数 = 葉）を数える。
   **その関数自身が使った時間**。まずここを見る。
2. `inclusive_time`: スタックに出てきた関数を、1 スタックにつき 1 回だけ数える。
   **その関数とその先（呼び出し先すべて）が使った時間**。「どこから手を入れるか」を
   決めるときはこちら。`main`、`____moonbit__main`、`@moonbitlang/async/` で始まる
   ものはノイズなので除かれる。
3. `runtime_leaf_attributed_to_user`: 葉がランタイムの関数（`moonbit_*`、`_mi_*`、`mi_*`、
   または demangle して `stringview::` / `make_string` / `incref` / `decref` を含む）の
   とき、その上で最初に現れる `_M0*` の関数に足す。**ランタイムの中の時間を、呼んだ
   自分の関数に付け直したもの**。確保や文字列操作が重いときに効く。

数えられるのは MoonBit 側のシンボルだけ。`_M0*`、`moonbit_*`、`_mi_*`、`mi_*`、
`OUTLINED_FUNCTION_*`、`<deduplicated_symbol>`、`main` 以外（libc など）は落とされ、
`samples_without_profile_symbols` に数えられる。つまり **libc の中だけで回っている時間は
ランキングに出ない**。出てこない時間がある、と覚えておく。

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

- `summary` の数字は §3 のとおり。`observed_rows` は「ヘッダと認識したサンプル行」、
  `running_samples` は「ヘッダのあったサンプル」、`profiled_samples` は「シンボルを
  残せたサンプル」。`observed_rows > running_samples > profiled_samples` と減っていく。
- `rankings.*[]` の各要素は `rank` / `symbol`（demangle 済み）/ `mangled_symbol`（生）/
  `samples` / `time_ms` / `percent_of_profiled_samples`。
- `observations` は 1 位を文章で説明したもの（`highest_self_time`、`highest_inclusive_time`）。
- `data_quality.warnings` はターミナルの `Warnings:` と同じ。
- `executables[]` は `moon test --profile` のときだけ中身が入り、per-executable の集計を持つ。
- `analysis_notes` はランキングの定義そのもの。忘れたらここを読み直す。

### 警告

- `profiled_samples == 0`: `No profiled running samples with MoonBit/runtime symbols were found.`
  §4 の状態。
- `profiled_samples < 100`: `Only N profiled samples were collected; results may be noisy.
  Consider profiling a larger workload.`（`MIN_ACTIONABLE_SAMPLES = 100`。100Hz なら 1 秒ぶん。
  仕事を増やして取り直す）

### 生データを見る

ランキングで足りないとき（呼び出しの木を見たいとき）は trace を直接開く。

```sh
perf report -i _build/native/release/profile/naive/20261018-102156/perf.data
```

## 4. この環境で集計が空になる理由

この環境で `make profile` すると `Samples: 0` になり、`profile.json` も空になる。

```console
$ moon run --profile naive -- 2000 70
Profile: native Linux perf
Executables: 1
Samples: 0, sample weight: 10.00ms
...
Warnings:
  No profiled running samples with MoonBit/runtime symbols were found.
```

理由は 2 つあり、どちらもこの環境の `perf` の側の問題。

1. **DWARF の call graph を展開できない。** この `perf` は libunwind / libdw / libelf に
   リンクされていない。`--call-graph dwarf` は記録時にスタックの生データを `perf.data`
   にコピーし、展開は `perf script` のときに行う。libdw が無いのでその展開ができず、
   `perf-script.txt` のスタック行が空になる（`perf.data` は 1.9MB あるのに、
   テキストにはサンプルのヘッダしか出ない）。
2. **`cpu-clock` に CPU 属性が無い。** この WSL2 カーネルでは、`perf script` が CPU 欄を
   出せない。そのためヘッダが `comm pid timestamp:` になり、moon が要求する `[cpu]` が
   無いのでヘッダと認識されない。`profile.json` の `observed_rows` が 0 になるのはこれ。

確かめ方:

```sh
$ ldd "$(which perf)" | grep -E 'libdw|libunwind|libelf'
# （何も出ない）

# 出力先は profile.json の artifacts.trace。ここでは先ほどの実行のものを使う。
$ T=_build/native/release/profile/naive/20261018-102156
$ perf script -i "$T/perf.data" -F +cpu
Samples for 'cpu-clock:u' event do not have CPU attribute set. Cannot print 'cpu' field.

$ head -2 "$T/perf-script.txt"
naive.exe    4027  1813.266037:   10000000 cpu-clock:u:

# ↑ ヘッダの後にスタック行が無く、ヘッダにも [cpu] が無い。
```

`perf` 自体はサンプルを取れている（このとき 233 サンプル）。足りないのは
「スタックの展開」と「CPU 欄」と「シンボルの解決」だけ。そこで §5 では、取れている
サンプルを自分で集計する。

## 5. 代替: `perf` と `nm` で self time を取る

`moon --profile` が空になるときも、`perf record` は使える。葉（スタックの先頭）の
アドレスを `nm` で関数名に写して集計する。`profile-demo` にはその小さなスクリプト
`top.py` を置いてある。

```sh
cd moonbit/experiments/profile-demo

# 記録する（call graph は取れないので付けない）
make record       # perf record -e cpu-clock -F 100 -o build/naive.data -- <naive.exe> 2000 70
make record-fast  # perf record -e cpu-clock -F 100 -o build/fast.data  -- <fast.exe>  2000 4000

# 集計する
make top          # python3 top.py build/naive.data
make top-fast     # python3 top.py build/fast.data
```

`perf record` の実行ファイルは `--` の後ろに、`moon run --profile` と同じ引数を付けて渡す
（`make record` がやっているのはこれだけ）。

### top.py の仕組み

1. `perf script --show-mmap-events -i <data>` で、サンプルと、各オブジェクトの
   ロード位置（`PERF_RECORD_MMAP`）を取り出す。
2. サンプルの葉のアドレスから、そのオブジェクトのロード位置を引いてファイル内
   オフセットにする。
3. `nm -n -S`（共有ライブラリは `nm -D -n -S`）のシンボルと突き合わせ、その
   オフセットを含む関数を求める。含むものが無ければ「そのオブジェクトのどこか」と
   してオブジェクト名でまとめる（libc の内部関数は動的シンボルに無いため）。

call graph を取れないので **self time だけ**が出る。inclusive time は出ない。

### naive の結果

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

上位 8 行はすべて libc の中の同じ関数の別のオフセット（0x1b0cab〜0x1b0ce1）で、
合わせて約 81%。逆アセンブルすると `vmovdqu64` / `vmovdqa64` が並ぶベクタ化された
メモリコピーのループで、glibc の `__memmove_*` に当たる。この関数は動的シンボルに
無いので名前が引けず、オブジェクト名とオフセットで出している。次が
`_mi_page_malloc_zero`（mimalloc の確保）で 4%。つまり **時間のほとんどは「確保と
コピー」**で、`escape__naive` 自身はほぼ出てこない。

`top.py` は `perf script` の生出力を読むだけなので、`moon --profile` が吐いた
`perf.data` にも使える（ただしこの環境の `perf.data` は `--call-graph dwarf` で
記録されていてスタックが空なので、§4 の事情で何も出ない。だから `make record` で
取り直す）。

### fast の結果

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

最大は `moonbit_make_string` の 27%。これは 1 回の描画の最後に 147KB の `String` を
1 つ作るところ（`StringBuilder::to_string`）。残りは `write_escaped`、`StringBuilder`
の `write_string` / `write_view`、`has_prefix` などに数 % ずつ薄く広がる。libc の
メモリコピーはほとんど出てこない。

## 6. 実例: naive を fast に直す

題材の仕事は決まっている。2000 行の Markdown 風の文書を HTML にする（7 行に 1 つは
見出し、残りは `<` `>` `&` `"` `'` を含む段落）。素朴な実装はこう。

```moonbit
// 1 文字ずつエスケープして、そのつど連結する
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

// 1 行ずつ連結する
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

`out = out + esc` は、すでに出来ている文字列を含めて毎回コピーし直す。1 行が n 文字なら
約 n²/2 バイト、文書全体ではその二乗のオーダーで写す。§5 のプロファイルはこれを
ズバリ指している（libc のメモリコピーが 81%、確保が 4%）。

直した実装は、1 つの `StringBuilder` に書く。エスケープは「エスケープが要る文字の
間をまとめて書く」形にして、書き込みの回数を文字数ではなく出現回数にする。

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

### 前後

素朴な実装は 1 回 30.9ms（2000 行 × 70 回で 2.16 秒）、直した実装は 1 回 0.53ms
（2000 行 × 4000 回で 2.13 秒）。**約 58 倍**。出力は同じで、バイト数 147444、
チェックサム -944991265 が両方で一致する（`moon test` の
`render_fast agrees with render_naive` でも確かめている）。

| 実装 | 1 回あたり | 70 回ぶん | ボトルネック（プロファイルより） |
| --- | --- | --- | --- |
| `naive` | 30.9ms | 2.16s | libc のメモリコピー 81%、確保 4% |
| `fast` | 0.53ms | 0.037s | `moonbit_make_string` 27%、あとは薄く広く |

プロファイルが変わったことにも意味がある。直す前は「同じ 1 つのメモリコピー」に
時間が固まっていた。直した後はどこも突出せず、最大でも「最後に 147KB の `String` を
1 つ作る」27% になった。ここまで来ると、次に削るには「147KB を返す」という API 自体を
変える（`StringView` やストリームで返す）必要がある、と判断できる。

### もう一度測る

直したら必ず測り直す。`make record-fast` → `make top-fast` を回し、狙ったところが
消えたかを確認する。素朴な実装に戻すのは、前後を比べ直したくなったときだけ。

## 7. チェックリスト

1. `moon version`、`perf --version`、`ldd "$(which perf)" | grep -E 'libdw|libunwind'` で環境を見る。
2. 100Hz で数秒になるよう仕事の量を決める（`reps` を増やす）。
3. `moon run --profile <exe> -- <args>` か `moon test --profile` を回す。
4. `Samples: N` を見る。`0` なら §4（この環境では §5 へ）。`100` 未満なら仕事を増やす。
5. `Top self time` で「自分自身が重い関数」を、`Top inclusive time` で「呼び出し先まで
   含めて重い関数」を見る。`Runtime leaf costs ...` で確保や文字列操作の犯人を探す。
6. 必要なら `profile.json` を読み、`analysis_notes` で定義を確認する。
7. 直す。もう一度 3 から回す。出力が変わっていないことをテストで確かめる。
