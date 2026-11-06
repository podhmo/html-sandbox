# 調査メモ: WSL2 の perf bind mount で `apt upgrade` が止まる

WSL2 (Ubuntu 26.04) で `sudo apt upgrade` が `linux-perf` の unpack で失敗した記録。
原因は WSL がカーネルに合わせた perf を `/usr/bin/perf` に bind mount していることで、
dpkg のバックアップ処理が別ファイルシステム扱いで失敗する。ついでに、見えている
`perf` が WSL 同梱のものに差し替わっているせいで、moon のプロファイリング
（[profiling-moonbit-setup.md](profiling-moonbit-setup.md) の対象問題）にも影響が出ていた。
2026-11-06 時点（kernel `6.18.54.1-microsoft-standard-WSL2`）の環境で確認。

## 結論

- **`sudo apt-mark hold linux-perf` で固定するのが一番簡単で永続する。** WSL が
  `/usr/bin/perf` を bind mount している間は、パッケージを更新しても見えるのは
  WSL の perf のままなので、更新に実益がない。hold は再起動しても効き続ける。
- upgrade の中断で残った未完了パッケージは `sudo apt -f install` で仕上げる。
- **`moon run --profile` は今もう一度「集計が空」の状態に戻っているはず。**
  `perf` が WSL 同梱の libdw なし版を指すようになったため。動かすには
  `sudo umount /usr/bin/perf`（起動のたび）か、`.deb` から取り出した libdw 付き
  perf を `~/.local/bin` に置く（永続・sudo 不要）のどちらか。この環境では後者で
  設定済み（下記「B」を参照）。

## 症状

```console
$ sudo apt upgrade
...
Preparing to unpack .../linux-perf_7.0.0-43.43_amd64.deb ...
Unpacking linux-perf (7.0.0-43.43) over (7.0.0-38.38) ...
dpkg: error processing archive /var/cache/apt/archives/linux-perf_7.0.0-43.43_amd64.deb (--unpack):
 unable to make backup link of './usr/bin/perf' before installing new version: Invalid cross-device link
dpkg-deb: error: paste subprocess was killed by signal (Broken pipe)
Errors were encountered while processing:
 /var/cache/apt/archives/linux-perf_7.0.0-43.43_amd64.deb
Error: Sub-process /usr/bin/dpkg returned an error code (1)
```

この時点で apt は中断し、先に展開済みだった他のパッケージが設定未完了（`iU`/`it`）
のまま残る（`dpkg -l` で `ii` 以外が 10 個以上あった）。

## 原因

`/usr/bin/perf` は、ルートのファイルシステム（`/dev/sdd`）上のパッケージの
ファイルではなく、別ディスク（`/dev/sdb`）からの **bind mount** だった。

```console
$ findmnt -T /usr/bin/perf
TARGET        SOURCE                                                     FSTYPE OPTIONS
/usr/bin/perf /dev/sdb[/6.18.54.1-microsoft-standard-WSL2/perf/bin/perf] ext4   ro,relatime
```

`/dev/sdb` は WSL2 がカーネルに付属させている成果物 VHD で、カーネルリリース名の
ディレクトリの下に `modules` / `linux-headers` / `perf` を置く決まりになっている
（[microsoft/WSL2-Linux-Kernel](https://github.com/microsoft/WSL2-Linux-Kernel) の
`gen_artifacts_vhdx.sh` の項を参照）。この環境では `/dev/sdb` から次の 3 つが
mount されている（いずれも read-only）。

| mount point | mount 元（`/dev/sdb` 内のパス） |
| --- | --- |
| `/usr/src/linux-headers-6.18.54.1-microsoft-standard-WSL2` | `/6.18.54.1-microsoft-standard-WSL2/linux-headers` |
| `/usr/lib/linux-tools/6.18.54.1-microsoft-standard-WSL2` | `/6.18.54.1-microsoft-standard-WSL2/perf` |
| `/usr/bin/perf` | `/6.18.54.1-microsoft-standard-WSL2/perf/bin/perf` |

dpkg はファイルを上書きする前に `link(2)` でバックアップを取る。bind mount の
上では、見かけ上同じディレクトリでも実ファイルは別デバイスにあるため、ハード
リンクは `EXDEV`（Invalid cross-device link）で失敗する。これがエラーの正体。
apt や dpkg のデータベースの破損ではない。

見えているファイルも確認したとおり WSL 側のものだった（4MB の statically linked
ELF。パッケージが期待する md5 とも違う）。

## 見えている perf は WSL 版（libdw なし）

bind mount の効果で、`perf` が解決する先は WSL 同梱版になっている。

```console
$ which -a perf
/usr/bin/perf
/bin/perf
/usr/lib/linux-tools/6.18.54.1-microsoft-standard-WSL2/bin/perf
$ perf --version
perf version 6.18.54.1.g26d1ceb55087        # カーネルバージョンに一致
$ perf version --build-options | grep -E 'dwarf:|libelf:'
  dwarf: [ OFF ]
  libelf: [ OFF ]
```

Ubuntu の `linux-perf`（7.0.0-38.38 が入っている）が `/usr/bin/perf` に置いた
libdw 付きバイナリは、mount の下に隠れて到達不能になっている。`linux-perf` が
他に置くバイナリは無い（`/usr/bin/perf` のみ。残りは python binding と jvmti）。

[profiling-moonbit-setup.md](profiling-moonbit-setup.md) を書いた時点では
`/usr/bin/perf` にパッケージの perf 7.0.14 が見えていたので、このファイル bind
mount はその後に現れたと思われる（`/usr/lib/linux-tools/<k>` の mount と PATH
末尾への追加は以前からあった）。WSL 側の更新で注入方法が変わった可能性が高いが、
interop を切っているため WSL 側のバージョンは未確認。

## 対処: `apt update && apt upgrade` を安全に終わらせる

```bash
sudo apt-mark hold linux-perf   # パッケージを現バージョンで固定（dpkg の selection state）
sudo apt -f install             # 中断した未完了パッケージを configure して終わらせる
sudo apt update && sudo apt upgrade
```

- `linux-perf` に hard Depends しているパッケージは無い（逆依存は kernel image の
  Suggests と linux-tools-common の Recommends だけで、どちらも入っていない）。
  hold しても依存関係は壊れない。パッケージ自体は残るので、依存で入った
  libdw / libelf などの共有ライブラリも残る。
- hold したパッケージは upgrade 時に `The following packages have been kept back:
  linux-perf` と表示されるだけで、終了コードは 0。`apt-mark showhold` で確認できる。
- hold を外したくなったら `sudo apt-mark unhold linux-perf`。

### 代替案と評価

| 案 | 評価 |
| --- | --- |
| `sudo umount /usr/bin/perf` してから upgrade | 今回は通る。ただし mount は WSL 起動のたびに張り直されるので、次の `linux-perf` 更新で同じエラーが再発する。再発防止には結局 hold が要る |
| `apt remove linux-perf` | 非推奨。mount point になっているファイルの削除は失敗しうる。消えた場合、次回起動時に bind mount のターゲットが無くなり WSL 側の注入自体が壊れる可能性がある |
| `/etc/apt/preferences.d` で Pin | hold と同等の効果をわざわざファイルで管理する必要は薄い |

## moon プロファイリングへの影響と回避

`perf` が WSL 版（`dwarf: [ off ]`, `libelf: [ off ]`）を指すようになったので、
`moon run --profile` / `moon test --profile` は
[profiling-moonbit-setup.md](profiling-moonbit-setup.md) で直す前と同じ「サンプルは
あるが集計が空」の状態に戻っているはず（`perf --version` が `6.18.54.1...` を
返すならこの状態）。libdw 付き perf を取り戻す方法は 3 つある。

### A. `sudo umount /usr/bin/perf`（その起動の間だけ有効）

mount を外せばパッケージの perf が顔を出す。WSL 版は
`/usr/lib/linux-tools/<k>/bin/perf`（PATH の末尾）に残るので、perf 自体は
失われない。ただし `wsl --shutdown` のたびにやり直し。

### B. `.deb` を展開した perf を `~/.local/bin` に置く（永続・sudo 不要）

キャッシュに残っている新しい `.deb` から直接取り出せる。今回実際に試して、
`perf version 7.0.14` / `dwarf: [ on ]` / `libelf: [ on ]` を確認した。

```bash
mkdir -p ~/.local/opt/linux-perf
dpkg-deb -x /var/cache/apt/archives/linux-perf_7.0.0-43.43_amd64.deb ~/.local/opt/linux-perf
ln -sf ~/.local/opt/linux-perf/usr/bin/perf ~/.local/bin/perf
# キャッシュを消した後は: apt-get download linux-perf && dpkg-deb -x linux-perf_*.deb ...
```

`~/.local/bin` は `/usr/bin` より PATH が先なので、bind mount があってもこちらが
優先される。展開した perf はシステムの libdw / libelf に動的リンクするので、
`linux-perf` パッケージはインストール済みのままにしておくこと（hold とは両立する
し、依存ライブラリを残す意味でも hold がちょうどよい）。なお `/tmp` は tmpfs
なので展開先には使わない。

この環境では 2026-11-06 にこの方法でセットアップ済み。`which perf` が
`~/.local/bin/perf` を返し、`perf record --sample-cpu -e cpu-clock
--call-graph dwarf` + `perf script` で `[cpu]` 欄つき・シンボル解決された
スタックが取れることを確認した（moon のパーサが必要とする形式）。
さらに `moonbit/experiments/profile-demo` で `make profile` を実行し、
`moon run --profile` が 228 サンプル・シンボル解決済み（`moonbit_add_string`
が Top self time の筆頭）の集計を出すことも確認した。

### C. `/etc/wsl.conf` の `[boot] command` で umount（未検証）

起動時に root で実行される仕組みなので `command = umount /usr/bin/perf || true` で
自動化できるはずだが、この環境では試していない。

なお、どの方法を取っても `perf record` に `--sample-cpu` を足すラッパー
（`moonbit/experiments/profile-demo/bin/perf`）は引き続き必要。あれは WSL とは
無関係な moon 側の問題。

## 関連

- [profiling-moonbit-setup.md](profiling-moonbit-setup.md) — libdw 付き perf が
  必要な理由と `--sample-cpu` の話（この記事の時点で前提が変わっている）
- [profiling-moonbit-guide.md](profiling-moonbit-guide.md)
- [tts-wsl2.md](tts-wsl2.md) — 同じ環境での別調査（環境表もこちらを参照）
