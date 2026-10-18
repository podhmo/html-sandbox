# 調査メモ: `moon run --profile` を WSL2 で動かす（環境のセットアップ）

[`docs/sketch/ja/profiling-moonbit-guide.md`](profiling-moonbit-guide.md) は
`moon run --profile` / `moon test --profile` の使い方を説明しています。このメモは、その
前提になる**環境のセットアップ**（なぜこの環境では集計が空になるのか、どう直すか）を
記録したものです。issue は [#52](https://github.com/podhmo/html-sandbox/issues/52)。

## 結論

`moon --profile` が空になる原因は 2 つあり、**片方は環境、もう片方は moon 側**です。

1. **perf が libdw / libelf を持たない**（環境）。WSL2 に同梱されている `perf` は
   `dwarf: [ off ]`, `libelf: [ off ]` でビルドされており、DWARF のスタック展開も
   シンボル解決もできません。→ Ubuntu の `linux-perf` を入れます。
2. **moon が `perf record` に `--sample-cpu` を付けない**（moon 側）。moon のパーサは
   `perf script` の出力に `[cpu]` 欄があることを前提にしていますが、perf は
   `-a` / `-C` / `--sample-cpu` のときだけ CPU を記録します。→ `record` に
   `--sample-cpu` を足すラッパーを使います（上流にも報告したい）。

2 は WSL2 に限らず、Linux 全般で起こりえます。perf の既定では、per-task の
`perf record` は CPU を記録しません（`tools/perf/util/evsel.c` の
`if (target__has_cpu(&opts->target) || opts->sample_cpu)`。`target__has_cpu` は
`system_wide || cpu_list`）。

## 症状

```console
$ cd moonbit/experiments/profile-demo
$ make profile
Profile: native Linux perf
Executables: 1
Samples: 0, sample weight: 10.00ms
Warnings:
  No profiled running samples with MoonBit/runtime symbols were found.
Top self time:
  no samples
```

`profile.json` の `summary` は `observed_rows: 0, running_samples: 0, profiled_samples: 0`。
`perf.data` にはサンプルが入っているのに、`perf-script.txt` はヘッダ行だけで、しかも
そのヘッダに `[cpu]` がありません。

```console
$ head -1 _build/native/release/profile/naive/<stamp>/perf-script.txt
naive.exe   17116  7564.509311:   10000000 cpu-clock:u:
```

## 直し方

### 1. libdw / libelf 付きの perf を入れる

```sh
sudo apt-get install -y linux-perf
which perf          # /usr/bin/perf
perf version        # perf version 7.0.14
perf version --build-options | grep -E 'dwarf|libelf'
#   dwarf: [ on ]  ...  libelf: [ on ]
```

WSL2 同梱の perf は `/usr/lib/linux-tools/<wsl-kernel>/bin/perf` で PATH の最後にあり、
`/usr/bin` のほうが先なので、`linux-perf` を入れれば置き換わります。

スタックとシンボルが出るかの確認:

```sh
perf record --sample-cpu -e cpu-clock -F 100 --call-graph dwarf -o /tmp/dw.data -- \
  _build/native/release/build/naive/naive.exe 2000 70
perf script -i /tmp/dw.data | head
```

`_M0...` のシンボルと複数行のスタックが出れば OK です（`--sample-cpu` を付けないと
`perf script` は `Samples for 'cpu-clock:u' event do not have CPU attribute set.` と言います）。

### 2. `--sample-cpu` を足すラッパー

[`moonbit/experiments/profile-demo/bin/perf`](../../../moonbit/experiments/profile-demo/bin/perf)
が、`record` のときだけ `--sample-cpu` を足して次の `perf` に委譲します。
`Makefile` の `profile` / `profile-fast` / `profile-test` は、このディレクトリを PATH の
先頭に置いて `moon --profile` を呼びます。

```sh
cd moonbit/experiments/profile-demo
make profile        # Samples: 108 のように表示される
make profile-fast
make profile-test
```

`make` を通さずに直接実行するときは、自分で PATH を通します。

```sh
PATH=moonbit/experiments/profile-demo/bin:$PATH moon run --profile naive -- 2000 70
```

## 検証

| 状態 | `observed_rows` | `profiled_samples` |
| --- | --- | --- |
| 直す前（WSL2 の perf、`--sample-cpu` なし） | 0 | 0 |
| WSL2 の perf + `--sample-cpu`（ラッパー） | 109 | 0（スタックが無い → `missing_stack_samples: 109`） |
| libdw 付き perf + `--sample-cpu`（ラッパー） | 110 | 110 |

直したあとの `make profile`（`naive`、1 回の例。サンプル数は実行ごとに少し揺れる）:

```console
Profile: native Linux perf
Executables: 1
Samples: 110, sample weight: 10.00ms

Top self time:
   84.5%   930.00ms     93  moonbit_add_string
    3.6%    40.00ms      4  _mi_page_malloc_zero
    2.7%    30.00ms      3  moonbit_drop_object
   ...

Top inclusive time:
  100.0%  1100.00ms    110  @podhmo/profile-demo/work.render_naive
   90.9%  1000.00ms    100  moonbit_add_string
   12.7%   140.00ms     14  @podhmo/profile-demo/work.escape_naive
```

## 上流への報告

moon 側の `--sample-cpu` は upstream でも未対応です（`crates/moon/src/cli/profile.rs` の
`perf_record_command` に `--sample-cpu` が無い。`origin/master` を確認）。パーサの
`is_perf_sample_header` / `is_perf_cpu_token` が `[cpu]` を必須にしているため、
Linux では集計が空になりえます。

Linux 対応は [PR #1722](https://github.com/moonbitlang/moon/pull/1722)
「Add Linux perf profiling support」（merged, 2026-05-29）で入り、その時点から
`--sample-cpu` は付いていません。テストも実際の `perf script` 出力を見ておらず、
ユニットテストは `main 1234 [001] ...` の手書きフィクスチャ、統合テストは perf を
`exit 0` の shim に差し替えてコマンド文字列だけを検証しています。関連 issue / PR を
検索しても、同件を扱ったものは見つかりませんでした（`--profile` つながりでは
[issue #1798](https://github.com/moonbitlang/moon/issues/1798) があるが eval モードの話）。

報告の下書きは [podhmo/html-sandbox#53](https://github.com/podhmo/html-sandbox/issues/53) に
置きました。

## 関連

- ガイド: [profiling-moonbit-guide.md](profiling-moonbit-guide.md)
- 元の調査: [profiling-moonbit.md](profiling-moonbit.md)
- issue: [#52](https://github.com/podhmo/html-sandbox/issues/52)
