# 調査レポート: WSL2 + RTX 5060 (8GB) で日本語の音声読み上げを動かす

WSL2 (Ubuntu 26.04) + RTX 5060 Laptop 8GB で、ローカル TTS の「読み上げ」が実際にどこまで動くかを確かめた記録。
対象は Grok との会話で候補に挙がったもののうち、この環境で追加のインストール権限なしに試せるもの。

依頼は [Grok との対話](https://x.com/i/grok/share/c2hhcmQtMg_d2d39649-2804-410f-8d30-ffbaacd5138b)の抜粋を渡したうえで、「WSL2 上の Ubuntu で 8GB の NVIDIA GPU がある。この状況で音声読み上げの動作確認をして、結果と後片付けの方法を docs/sketch に残す」というものだった。

この記録は 2026-11-04 に、GPU ドライバを更新した環境で測り直した（[issue #128](https://github.com/podhmo/html-sandbox/issues/128)）。数値は追試時のものに差し替えてある。何が変わって何が変わらなかったかは「[ドライバ更新後の追試](#ドライバ更新後の追試)」にまとめた。

作業したのは [WSL を簡易的な隔離環境として使う記事](../../../posts/2026-10-19-wsl-opencode.md/article1.md)で作った環境で、エージェント（opencode）に root を渡していないのは**意図的**。`/etc/wsl.conf` で `automount` と `interop` を切ってあるのも同じ記事の設定で、Windows 側のファイルやプログラムにエージェントが触れないようにしている。だから以下の手順は「sudo が使えない環境での回避策」ではなく、「ユーザー権限の中で完結させる」ことを前提に組んである。

- **Piper**（CPU・超軽量）
- **Kokoro 82M**（GPU/CPU・軽量）
- **Qwen3-TTS 0.6B / 1.7B**（GPU・高品質・指示つき）
- **音声出力そのもの**（WSLg の PulseAudio 経由で Windows に鳴るか）

Voicebox と VOICEVOX は、この環境では前提（Docker / 7z 展開 / root）が揃わないため**動かしていない**。理由は「試していないもの」の節に書いた。

## 結論

- **WSL2 でも普通に鳴る（人が実際に PC から音が出るのを確認した）。** WSLg が PulseAudio サーバー（`unix:/mnt/wslg/PulseServer`, sink は `RDPSink`）を最初から立てている。足りないのはクライアント（`paplay` / `pactl`）だけで、root 無しでも `.deb` を展開すれば使える。`~/.asoundrc` も pulseaudio パッケージも要らなかった。
- **日本語の長文読み上げの第一候補は Kokoro 82M (GPU)。** 13 秒の音声を 0.18 秒で合成（RTF 0.014）、VRAM 783MiB。文単位に区切れば最初の音が約 1.5 秒で出る（2 回目以降は 0.05 秒）。
- **Piper は CPU だけで RTF 0.07。** GPU を一切使わないので併用しやすい。ただし日本語ボイスは `ja_JP-hi_fi_captain-medium` の 1 種類だけ。CPU 側の数値は他の負荷で倍半分動くので、桁だけを見るのがよい。
- **Qwen3-TTS は 8GB でも余裕で載る（1.7B で VRAM 4.2GiB）が、公式 Python パッケージのままだと RTF 1.5〜1.9 で実時間より遅い。** GPU 使用率は 25% 前後しか出ておらず、ボトルネックは GPU ではなく 1 フレームごとの Python ループ。実時間で回すには vLLM など別バックエンドが要る（今回は未検証）。
- **CUDA のバージョン固定は、ドライバを更新した今の環境では不要になった。** PyPI 既定の `torch` 2.15.0（cu132 ビルド）がそのまま初期化でき、sm_120 で行列積も通る。初回に cu128 へ固定する必要があったのは、WSL 側のドライバが CUDA 12.8 相当で止まっていたためで、**ドライバ側の問題だった**（[issue #128](https://github.com/podhmo/html-sandbox/issues/128) の見立てどおり）。
- **Grok の説明のうち「8GB なら Qwen3-TTS 1.7B が余裕」は正しい。「GPU でリアルタイム性が良好」は、少なくとも `qwen-tts` パッケージ素のままでは成立しない。** また「WSL2 で音を出すには pulseaudio を入れる」は不要で、入れるのはクライアント側のツールだけだった。

### 実測のまとめ

追試時（2026-11-04、ドライバ 617.42 / CUDA UMD 13.4、`torch` 2.15.0+cu132）の値。

| エンジン | モデル | 音声の長さ | 合成時間 | RTF | 初音までの時間 | VRAM | 日本語 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Piper | `ja_JP-hi_fi_captain-medium` (74MB) | 18.03s | 1.24s | **0.07** | 0.92s（ストリーミング） | 0（CPU） | 1 ボイス |
| Kokoro 82M (CPU) | `hexgrad/Kokoro-82M` | 13.07s | 2.62s | 0.20 | — | 0 | 5 ボイス |
| Kokoro 82M (GPU) | 同上 | 13.07s | 0.18s | **0.014** | 1.5s（文分割・コールド） | 783MiB | 5 ボイス |
| Qwen3-TTS 0.6B (GPU) | `Qwen3-TTS-12Hz-0.6B-CustomVoice` | 7.92s | 12.13s | 1.53 | — | 2.3GiB | ○ |
| Qwen3-TTS 1.7B (GPU) | `Qwen3-TTS-12Hz-1.7B-CustomVoice` | 6.72s | 10.52s | 1.57 | — | 4.2GiB | ○（`Ono_Anna`） |

RTF は「音声 1 秒あたりの合成秒数」。1.0 未満なら実時間より速い。Qwen の数値は 2 回目の実行（モデルロード済み・ウォームアップ後）。

## 検証環境

| | 値 |
| --- | --- |
| GPU | NVIDIA GeForce RTX 5060 Laptop GPU（8151MiB） |
| ドライバ / CUDA | 617.42 / CUDA UMD 13.4（WSL 側の `nvidia-smi`）。追試前は 573.22 / CUDA 12.8 だった |
| WSL | 6.18.54.1-microsoft-standard-WSL2、WSLg 1.0.79 |
| ディストリ | Ubuntu 26.04.1 LTS（Resolute Raccoon） |
| CPU / メモリ | AMD Ryzen 7 255（16 スレッド）/ 15GB（CPU 側の計測はこの負荷に左右される） |
| システム Python | 3.14.4（pip 無し） |
| uv | 0.13.7（`~/.local/bin/uv`） |
| sudo | **使えない**（パスワード入力が必要。`sudo -n` は失敗）。エージェントに root を渡さないのは意図的 |
| WSL 設定 | `systemd=true`、`automount=false`、`interop=false`（`.exe` は実行できない）、`/mnt/c` は空。隔離のための設定 |
| ファイルシステム | `/` は 1TB で 838GB 空き。**`/tmp` は tmpfs 7.7GB** |

この記事のコマンドはすべて `~/tts-lab` で作業する前提。`/tmp` は tmpfs（メモリ上）なので、torch 入りの venv（約 7.3GB）のような大物を置く場所ではない。最初に `/tmp` で作業して埋めてしまったのはエージェント側の不注意で、環境の問題ではない。

追試で使った主なパッケージは、`torch` 2.15.0+cu132 / `torchaudio` 2.11.1+cu132、`kokoro` 0.9.4、`misaki` 0.9.4、`transformers` 5.22.1（Kokoro 側）/ 4.57.3（Qwen 側）、`piper-tts` 1.8.0、`onnxruntime` 1.31.1、`qwen-tts` 0.1.1。

### ドライバ更新後の追試

初回の計測は 573.22 / CUDA 12.8 のドライバで行った。PyPI 既定の `torch`（cu132 ビルド）が CUDA を初期化できなかったため cu128 の wheel に固定している。その後 Windows 側の GPU ドライバを更新した（617.42 / CUDA UMD 13.4）ので、2026-11-04 に測り直した。

- **`torch` のバージョン固定は要らなくなった。** `uv pip install torch torchaudio` だけで `torch 2.15.0+cu132` が入り、`torch.cuda.is_available()` が `True`、sm_120 で行列積が通る。「新しい torch が入ると壊れる」の正体はドライバだった。
- **Qwen3-TTS の RTF は 1.8 → 1.5 程度に下がったが、1.0 は切らない。** 初回と同じ `torch 2.11.0+cu128` の venv を新しいドライバで回しても 1.54 だったので、差はドライバ由来。**ボトルネックが Python の生成ループであることは変わらない**（GPU 使用率 25% 前後）。
- **Kokoro は RTF 0.018 → 0.014、VRAM 830 → 783MiB。** ただし初音はむしろ遅くなった（コールドで 1.5 秒前後。ウォームなら 0.05 秒）。文分割したときの 1 文目の生成が 1.00 秒 → 1.46 秒に伸びている。
- **Piper の 0.13 → 0.07 はドライバと無関係。** 初回と同じ venv（`piper-tts` 1.8.0、`onnxruntime` 1.31.1）で再測しても 0.07 なので、初回計測時に他の負荷が乗っていたと見られる。
- **新しく踏んだ罠が 2 つ。** `torch` 2.15.0 と `torchaudio` 2.11.1 の版が揃わないこと、`torchaudio.load` が `torchcodec` を要求し、その `torchcodec` がこの環境では入れられないこと（どちらも「[ハマりどころ](#ハマりどころまとめ)」に書いた）。

## 1. 音声出力（WSLg）の確認

`PULSE_SERVER` は最初から設定されていて、ソケットも存在する。これは WSLg が有効なときに WSLg 側が用意するもので（`DISPLAY` や `WAYLAND_DISPLAY` と同じ扱い）、ディストリ側で何かを設定した結果ではない。

```console
$ echo $PULSE_SERVER
unix:/mnt/wslg/PulseServer
$ ls /mnt/wslg
PulseAudioRDPSink  PulseAudioRDPSource  PulseServer  ...
```

一方でクライアントが無い。

```console
$ which pactl paplay aplay
# 何も出ない
```

root が無いので、`apt-get download` で `.deb` を取ってきて展開し、`LD_LIBRARY_PATH` で使う。
必要なのは `paplay` と `pactl` の依存だけ。

```bash
mkdir -p ~/tts-lab/debs && cd ~/tts-lab/debs
apt-get download pulseaudio-utils libpulse0 libsndfile1 libasyncns0 libflac14 \
  libvorbis0a libvorbisenc2 libogg0 libopus0 libsoxr0 libmpg123-0t64 libltdl7 libmp3lame0
mkdir -p root && for f in *.deb; do dpkg-deb -x "$f" root; done

export LD_LIBRARY_PATH="$PWD/root/usr/lib/x86_64-linux-gnu:$PWD/root/usr/lib/x86_64-linux-gnu/pulseaudio"
export PATH="$PWD/root/usr/bin:$PATH"
```

結果:

```console
$ pactl info
Server String: unix:/mnt/wslg/PulseServer
Server Name: pulseaudio
Server Version: 17.0-25-gc3305
Default Sink: RDPSink
Default Source: RDPSource

$ pactl list short sinks
1  RDPSink  module-rdp-sink.c  s16le 2ch 44100Hz  SUSPENDED

$ paplay beep.wav   # 440Hz の 1 秒
$ echo $?
0
```

再生中に `pactl` で覗くと、ちゃんと sink input が積まれて `RDPSink` が `RUNNING` になる（`Sink Latency: 397085 usec` は RDP のバッファ）。

```console
$ pactl list short sink-inputs
5  1  7  protocol-native.c  s16le 1ch 22050Hz
$ pactl list short sinks
1  RDPSink  module-rdp-sink.c  s16le 2ch 44100Hz  RUNNING
```

つまり `paplay` の終了コードと sink の状態までは確認できる。実際に耳に届いているかはエージェントからは確認できないが、**手元の PC から音が鳴っていることは人が確認した**。`RDPSink` が `RUNNING` になれば Windows 側まで届いていると見てよい（音が出ない場合は Windows 側のサウンド設定と WSLg のオーディオを疑う）。

注意点:

- `paplay` の実行時間は音声の長さと一致しない（追試では 1.0s の wav が 0.57s、17.97s の wav が 19.44s、13.08s の wav が 14.47s）。RDP sink のバッファとリサンプリングのせいで、**再生時間を性能測定に使ってはいけない**。
- `paplay` は wav のヘッダを読んでフォーマットを合わせてくれるので、22.05kHz モノラルでも 24kHz モノラルでもそのまま渡せる。

## 2. セットアップ（再現手順）

エンジンごとに venv を分ける。理由は 2 つ。

- Kokoro 0.9.4 は `python < 3.13` を要求するので、システムの Python 3.14 では入らない（uv で 3.12 を落とす）。
- Qwen3-TTS は `transformers==4.57.3` をピン留めするので、Kokoro 側（transformers 5.x）と同居できない。

共通の下ごしらえ:

```bash
cd ~
mkdir -p tts-lab && cd tts-lab
uv venv --python 3.12 venv        # Piper + Kokoro 用
uv venv --python 3.12 venv-qwen   # Qwen3-TTS 用
```

### 2.1 torch の CUDA ビルドはドライバに合わせる

2026-11-04 のドライバ更新（617.42 / CUDA UMD 13.4）後は、素直に入れるだけで動く。

```bash
uv pip install --python venv/bin/python torch torchaudio
python -c "import torch; print(torch.__version__, torch.cuda.is_available())"
# 2.15.0+cu132 True
```

ドライバが CUDA 13.2 より古いと、PyPI 既定の cu132 ビルドは初期化に失敗する。初回の計測時（573.22 / CUDA 12.8）はそうなっていて、次のように出た。

```console
UserWarning: CUDA initialization: The NVIDIA driver on your system is too old
(found version 12080). ...
>>> torch.cuda.is_available()
False
```

その場合は `download.pytorch.org/whl/cu128` から**バージョンも固定**して入れる（`--index-url` だけだと新しい方を拾うので `==` が要る）。この回避策自体は今も有効。

```bash
uv pip install --python venv/bin/python "torch==2.11.0" "torchaudio==2.11.0" \
  --index-url https://download.pytorch.org/whl/cu128
python -c "import torch; print(torch.__version__, torch.cuda.is_available())"
# 2.11.0+cu128 True
```

- 迷ったら先に `torch.cuda.is_available()` を見る。`nvidia-smi` の `CUDA UMD Version` がそのまま使える上限なので、そこより新しいビルドを選ばなければよい。
- **`torch` と `torchaudio` の版が揃わない。** 2026-11 時点で PyPI の `torch` は 2.15.0 だが `torchaudio` は 2.11.1 で止まっており、`uv pip install torch torchaudio` は 2.15.0 + 2.11.1 の組み合わせを入れる。今回の用途では動いた（`torchaudio.functional.resample` も通る）。ただし `torchaudio.load` は `TorchCodec is required` で失敗する（「[ハマりどころ](#ハマりどころまとめ)」を参照）。

### 2.2 Piper（CPU）

```bash
uv pip install --python venv/bin/python piper-tts pyopenjtalk
venv/bin/python -m piper.download_voices ja_JP-hi_fi_captain-medium
```

- `piper-tts` は `onnxruntime`（CPU）を引く。`onnxruntime-gpu` を別途入れないと `--cuda` は黙って CPU に落ちる（警告は出る）。
- **日本語は `pyopenjtalk` が別途必要。** 入れないと `ModuleNotFoundError: No module named 'pyopenjtalk'` が出るのだが、`piper` 側の後始末で `wave.Error: # channels not specified` に化けるので原因が分かりにくい。
- 日本語ボイスは 1 種類だけ（`voices.json` を引くと `ja_JP-hi_fi_captain-medium` のみ、2 話者）。

```bash
mkdir -p out
printf 'こんにちは。これはWSL2上での音声読み上げのテストです。\n' > in.txt
venv/bin/python -m piper -m ja_JP-hi_fi_captain-medium.onnx -i in.txt -f out/piper_ja.wav
```

### 2.3 Kokoro 82M（GPU/CPU）

```bash
uv pip install --python venv/bin/python kokoro "misaki[ja]" soundfile
venv/bin/python -m unidic download   # 526MB
```

- `misaki[ja]` は MeCab 辞書（unidic）を自分では落とさない。無いと `RuntimeError: Failed initializing MeCab` で止まる。
- `KPipeline` は `device` を渡さないと CPU で動く。GPU を使うなら `KPipeline(lang_code="j", device="cuda")`。
- 日本語ボイスは `jf_alpha` / `jf_gongitsune` / `jf_nezumi` / `jf_tebukuro` / `jm_kumo` の 5 つ。

```python
from kokoro import KPipeline
pipe = KPipeline(lang_code="j", device="cuda")
for gs, ps, audio in pipe(text, voice="jf_alpha", split_pattern=r"(?<=[。．！？!?])"):
    ...  # audio は 24kHz の torch.Tensor
```

### 2.4 Qwen3-TTS（GPU）

```bash
uv pip install --python venv-qwen/bin/python qwen-tts
# ドライバが古くて cu132 を初期化できない場合だけ、2.1 の手順で cu128 に差し替える
```

```python
import torch, soundfile as sf
from qwen_tts import Qwen3TTSModel

model = Qwen3TTSModel.from_pretrained(
    "Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice",
    device_map="cuda:0", dtype=torch.bfloat16, attn_implementation="sdpa",
)
wavs, sr = model.generate_custom_voice(
    text="こんにちは。これはWSL2上での音声読み上げのテストです。",
    language="Japanese", speaker="Ono_Anna",
    instruct="明るく元気で、少し早口で話してください。",
)
sf.write("out/qwen.wav", wavs[0], sr)
```

- 初回は重みのダウンロード込みで 1.7B が約 103 秒、0.6B が約 59 秒。2 回目以降のロードは 7 秒 / 6 秒。
- `flash-attn` は無くても動く（`Warning: flash-attn is not installed. Will only run the manual PyTorch version.`）。`attn_implementation="sdpa"` を明示した。
- `sox` が無いと警告が出るが、合成自体は動く。
- 日本語のプリセット話者は `Ono_Anna`。`instruct` で口調の指示が効く（実測で合成時間はほぼ変わらない。追試では指示なし 1.57 / あり 1.56）。
- VRAM は 1.7B でロード後 3987MiB / ピーク 4196MiB、0.6B で 2059MiB / 2312MiB。8GB に 1.7B を載せても 4GB 近く余る。

### ハマりどころ（まとめ）

| 症状 | 原因 | 対処 |
| --- | --- | --- |
| `CUDA initialization: driver too old` | PyPI 既定の torch が cu132 ビルドで、ドライバが CUDA 13.2 未満 | ドライバを更新する。できないなら `torch==2.11.0` を cu128 index から |
| `TorchCodec is required for load_with_torchcodec` | torchaudio 2.11 が sox / soundfile バックエンドを外した | 音声の読み込みは `soundfile` を使う |
| `Could not load this library: libtorchcodec_core4.so` | `torchcodec` 0.17 が `libavcodec.so.58`（FFmpeg 5.1）を要求するが、Ubuntu 26.04 は FFmpeg 7 系 | 同上（root 無しでは FFmpeg 5.1 を用意できない） |
| `No module named 'pyopenjtalk'` → `wave.Error` | Piper の日本語 G2P が別パッケージ | `uv pip install pyopenjtalk` |
| `Failed initializing MeCab` | unidic 辞書が未取得 | `python -m unidic download` |
| `pip install kokoro` が解決不能 | `requires-python <3.13`（2026-11 時点で 0.9.4 のまま） | uv で Python 3.12 の venv |
| `No space left on device`（`/tmp`） | `/tmp` が tmpfs 7.7GB、torch の venv が 7.3GB | 作業ディレクトリをディスク上に |
| Piper の `--cuda` が効かない | onnxruntime が CPU 版 | `onnxruntime-gpu` を入れる（未検証） |
| `pactl: cannot open shared object file` | クライアント未インストール + 依存不足 | `.deb` を展開して `LD_LIBRARY_PATH` |

## 3. 結果

### Piper

CPU だけで完結する。18.03 秒の音声を 1.24 秒（プロセス起動込み、ウォーム時 RTF 0.07）、RSS 337MB。

```console
$ time venv/bin/python -m piper -m ja_JP-hi_fi_captain-medium.onnx -i in_long.txt -f out/piper_long.wav
0:01.25  # 18.03s の音声 = RTF 0.07
```

`piper-tts` 1.8.0 は合成時間のサマリを自分では出さないので、`time` と生成物の長さから出す。3 回測って 1.24〜1.36 秒（RTF 0.069〜0.075）で、ばらつきはこの程度。

読み上げ品質は「アニメ声寄りの中性的な声」。`--length-scale` で速さ、`--sentence-silence` で間が調整できる。日本語ボイスが 1 つしかないので、声を選びたい用途には向かない。

### Kokoro 82M

同じ文章（13.07 秒）で、CPU と GPU を比較。

```console
$ venv/bin/python kokoro_bench.py j jf_alpha out/kokoro_ja_cpu.wav cpu
torch 2.15.0+cu132 cuda True import 3.61
run0: synthesize 2.97s for 13.07s audio (RTF 0.227)
run1: synthesize 2.62s for 13.07s audio (RTF 0.201)

$ venv/bin/python kokoro_bench.py j jf_alpha out/kokoro_ja_gpu.wav cuda
run0: synthesize 4.34s for 13.07s audio (RTF 0.332)
run1: synthesize 0.18s for 13.07s audio (RTF 0.014)
peak GPU mem 783.2 MiB
```

GPU は 1 回目に数秒かかる（ウォームアップ）が、2 回目以降は 0.18 秒。82M パラメータなので VRAM も 783MiB で、他の作業と併用できる。品質は日本語として自然で、4 種類の女性ボイスと 1 種類の男性ボイスから選べる。

### Qwen3-TTS

1.7B と 0.6B の両方で、日本語（`Ono_Anna`）の合成に成功した。0.6B と 1.7B で **RTF がほぼ同じ（1.5〜1.6）** なのが特徴的で、これは計算量ではなく 1 ステップあたりの固定オーバーヘッドが支配的だということを意味する。

内訳を測ると:

```console
$ venv-qwen/bin/python qwen_profile.py Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice Ono_Anna "..."
AR generate 13.82s, frames=16, 864 ms/frame
tokenizer decode 0.22s for 7.52s audio
total 14.05s, RTF 1.87 (AR 1.84, decode 0.03)
peak VRAM 2279 MiB
```

デコード（音声化）は 0.03 RTF でほぼ無視できる。遅いのは自己回帰生成のループで、**その間の GPU 使用率は 23〜53%**（大半は 25% 前後、`nvidia-smi` を 0.7 秒間隔でサンプリング）。8GB の VRAM は足りているが、Python 側のループが GPU を待たせている。

指示（`instruct`）は効く。「明るく元気で、少し早口で話してください。」を付けた場合も RTF 1.56 で、品質面の機能は期待どおり。

## 4. リアルタイム再生（ストリーミング）

「読み上げ」としては、合成が速いことより**最初の音がいつ出るか**が重要なので、パイプで鳴らしっぱなしにする経路も試した。

### Piper → pacat（raw PCM）

```bash
venv/bin/python -m piper -m ja_JP-hi_fi_captain-medium.onnx -i in_long.txt \
  --output-raw --sentence-silence 0.2 \
| pacat --raw --format=s16le --rate=22050 --channels=1
```

```console
time to first audio chunk: 0.92s
stream finished: 20.17s wall, 18.37s audio, RTF 1.098
```

最初のチャンクが 0.92 秒で出て、あとは再生に追いつきながら合成が続く（wall が音声長とほぼ同じ = 実時間で流れている）。**Piper + pacat が一番「読み上げ」らしい**。

### Kokoro → paplay（文ごとに分割）

`split_pattern` を渡すと文単位でチャンクが出てくるので、前の文を鳴らしている間に次の文を作れる。

```console
$ venv/bin/python kokoro_stream_split.py cuda noplay 2
pipeline load 2.21s (cuda)
pass0 chunk 0: 1.73s audio generated at 1.46s ('こんにちは。')
pass0 chunk 1: 3.90s audio generated at 1.55s ('これはWSL2上での音声読み上げのテスト')
pass0 chunk 2: 2.40s audio generated at 1.62s ('今日はいい天気ですね。')
pass0 chunk 3: 7.25s audio generated at 1.73s ('音声合成の速度と品質を確認するために、少')
pass0 chunk 4: 4.42s audio generated at 1.81s ('ココロは82メガパラメータの軽量なモデル')
pass1 chunk 0: 1.73s audio generated at 0.05s ('こんにちは。')
pass1: first chunk ready at 0.05s, audio 19.70s, synth wall 0.36s (RTF 0.018)
```

`split_pattern` を渡さない場合は全文が 1 チャンク（17.43 秒）になり、初音まで 1.68 秒かかった。文分割した方が初音は早く、メモリも一定で済む。ただし文分割しても 1 文目の生成に 1.5 秒かかるので、**プロセスを立ち上げてから最初の音までは Piper より遅い**（Piper は 0.92 秒）。同じプロセスで 2 回目以降を読ませるなら Kokoro が圧倒的に速い。

## 5. 試していないもの（と、その理由）

| 候補 | 状態 | 理由 |
| --- | --- | --- |
| Voicebox (jamiepine/voicebox) | 未検証 | Docker が入っていない。WSL2 内で Docker を動かすには root が要る（この環境ではエージェントに root を渡していない）。GPU パススルー以前の前提が揃わない |
| VOICEVOX | 未検証 | エンジンの配布物が `.7z` で、展開に p7zip か py7zr が要る。加えて「Windows 側で起動して WSL から叩く」構成はこの環境では不可（`interop=false`、`/mnt/c` 空）。Linux 版エンジンを WSL2 内で動かすのが筋 |
| Chatterbox | 未検証 | `torch==2.6.0` をピンするので、新しい torch と衝突する。8GB では動くはずだが、今回の目的（日本語の読み上げ）に対して優先度が低い |
| vLLM バックエンドの Qwen3-TTS | 未検証 | Qwen3-TTS の README は vLLM を挙げている。実時間化の本命だが、vLLM のインストールと sm_120 向けビルドの確認に時間がかかるため今回は見送り。ドライバを CUDA 13.4 にしたので cu13 系の wheel は選びやすくなっている |
| Piper の GPU 実行 | 未検証 | `onnxruntime-gpu` を入れれば `--cuda` が使えるはず。CPU で RTF 0.07 なので優先度は低い |

このうち次にやりたいのは **vLLM バックエンドの Qwen3-TTS** だけで、ほかは優先度が低い。Qwen3-TTS は VRAM には余裕があり、遅さの原因も Python のループと分かっているので、バックエンドを替えて RTF が 1.0 を切るかを確かめる価値がある。Voicebox は root が前提なので、この環境の方針（root を渡さない）とそもそも噛み合わない。

## 6. 推奨

- **日本語の長文を淡々と読ませたい** → Kokoro 82M (GPU)。RTF 0.014、VRAM 783MiB、文単位ストリーミングで初音 1.5 秒（ウォームなら 0.05 秒）。ボイスも 5 種類ある。
- **GPU を空けたい / 別の作業と同時に回したい** → Piper。CPU だけで RTF 0.07、`--output-raw | pacat` で実時間再生。初音も 0.9 秒と一番早い。
- **声を clone したい / 口調を指示したい / 品質優先** → Qwen3-TTS 1.7B。VRAM 4GB で載るが、素の `qwen-tts` では実時間に届かないので、長文を流し読みさせる用途には vLLM などの検討が必要。
- **キャラクター音声が欲しい** → VOICEVOX（今回は未検証）。WSL2 内で Linux 版エンジンを動かし、`localhost:50021` に HTTP で投げる形が素直。

## 7. 後片付け

この検証で増えたのは **作業ディレクトリ `~/tts-lab`（初回の残骸込みで 16GB）と `~/tts-lab-retry`（追試分で 7.4GB）**、**HF キャッシュ（約 6.9GB）**、**uv のキャッシュ（約 15GB）**。システム側（`/usr` や apt）は一切変更していない（sudo を使っていない）。

uv はキャッシュから venv へハードリンクを張るので、venv 単体の `du` は実際より大きく出る（`du -sh ~/tts-lab-retry/venv` は 6.7GB だが、`~/tts-lab-retry` 全体で 7.4GB）。

```bash
# 1. 作業ディレクトリ（venv・モデル・生成した wav）
du -sh ~/tts-lab ~/tts-lab-retry   # 16GB / 7.4GB
rm -rf ~/tts-lab ~/tts-lab-retry

# 2. Hugging Face のキャッシュ（Qwen の重みが大半）
du -sh ~/.cache/huggingface/hub/* | sort -h   # 0.6B 2.4GB / 1.7B 4.3GB / Kokoro 313MB
rm -rf ~/.cache/huggingface/hub/models--Qwen--Qwen3-TTS-12Hz-0.6B-CustomVoice \
       ~/.cache/huggingface/hub/models--Qwen--Qwen3-TTS-12Hz-1.7B-CustomVoice \
       ~/.cache/huggingface/hub/models--hexgrad--Kokoro-82M
# 他のモデル（例: FLUX）を消さないよう、消す対象は名前で指定する

# 3. uv のキャッシュ（wheel と Python 3.12 の実体）
du -sh ~/.cache/uv ~/.local/share/uv   # 15GB / 111MB
rm -rf ~/.cache/uv ~/.local/share/uv   # 他の uv プロジェクトと共有なので、残すなら `uv cache prune` だけでもよい

# 4. 一時ファイル
rm -rf /tmp/opencode/tts /tmp/opencode/*.log /tmp/opencode/*.wav /tmp/*.deb
```

`~/tts-lab/debs` には `apt-get download` した `.deb` の展開物が入っている。`paplay` / `pactl` をシステムに入れていないので、消すと音を出す手段も一緒に消える。

確認:

```bash
ls /usr/bin/paplay /usr/bin/pactl   # 無い（システムには入れていない）
ls ~/tts-lab ~/tts-lab-retry        # 無い
```

- uv 本体（`~/.local/bin/uv`）は他の作業でも使うので消していない。消すなら `rm ~/.local/bin/uv ~/.local/bin/uvx`。
- `.zshrc` / `.bashrc` / `.profile` は変更していない（uv のインストーラは既存の `~/.local/bin` を見て PATH 追記をしなかった）。編集した心当たりがある場合は `. "/tmp/opencode/uv/env"` のような行が残っていないか確認する。この行は `/tmp` を指しているので、再起動で消えると壊れる。

WSL2 の VHDX は、ゲスト側で消しても Windows 側のファイルサイズは自動では縮まない。気になる場合だけ Windows 側で:

```powershell
# PowerShell（管理者）
wsl --shutdown
wsl --manage Ubuntu-26.04 --set-sparse true
# うまくいかない場合は diskpart の compact vdisk、または Optimize-VHD
```

## 付録: 使ったスクリプト

計測に使ったものは `~/tts-lab`（追試は `~/tts-lab-retry`）に置いた（後片付けで消える）。要点だけ残す。

### Piper のストリーミング再生（`piper_stream_play.py`）

```python
import json, os, subprocess, sys, time

root = os.path.expanduser("~/tts-lab/debs/root")
env = dict(os.environ, LD_LIBRARY_PATH=f"{root}/usr/lib/x86_64-linux-gnu:{root}/usr/lib/x86_64-linux-gnu/pulseaudio")
sr = json.load(open(sys.argv[1] + ".json"))["audio"]["sample_rate"]

t0 = time.perf_counter()
piper = subprocess.Popen([sys.executable, "-m", "piper", "-m", sys.argv[1], "-i", sys.argv[2],
                          "--output-raw", "--sentence-silence", "0.2"],
                         stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
player = subprocess.Popen([f"{root}/usr/bin/pacat", "--raw", "--format=s16le",
                           f"--rate={sr}", "--channels=1"], stdin=subprocess.PIPE, env=env)
first = None
nbytes = 0
while (buf := piper.stdout.read(4096)):
    if first is None:
        first = time.perf_counter() - t0
        print(f"time to first audio chunk: {first:.2f}s")
    nbytes += len(buf)
    player.stdin.write(buf); player.stdin.flush()
piper.wait(); player.stdin.close(); player.wait()
el = time.perf_counter() - t0
print(f"{el:.2f}s wall, {nbytes / 2 / sr:.2f}s audio, RTF {el / (nbytes / 2 / sr):.3f}")
```

### Kokoro のベンチ（`kokoro_bench.py` の要点）

```python
import time, numpy as np, torch
from kokoro import KPipeline

pipe = KPipeline(lang_code="j", device="cuda")     # device を渡さないと CPU
for run in range(2):                               # 1 回目はウォームアップ
    t0 = time.perf_counter()
    chunks = [a for _, _, a in pipe(text, voice="jf_alpha")]
    el = time.perf_counter() - t0
    audio = np.concatenate([c.cpu().numpy() for c in chunks])
    print(f"RTF {el / (len(audio) / 24000):.3f}")
print("peak GPU mem", torch.cuda.max_memory_allocated() / 2**20, "MiB")
```

### Kokoro の文分割ストリーミング（`kokoro_stream_split.py` の要点）

```python
t0 = time.perf_counter()
first = None
for i, (gs, ps, audio) in enumerate(pipe(text, voice="jf_alpha", speed=1.0,
                                        split_pattern=r"(?<=[。．！？!?])")):
    dur = len(audio) / 24000
    if first is None:
        first = time.perf_counter() - t0
    # audio を wav にして paplay に渡す（前の文を鳴らしている間に次の文ができる）
```

`split_pattern` には「句点の後ろ」を表す後読みを使う。`producer` をスレッドにして `queue` で再生側へ渡すと、生成と再生が重なる。

### Qwen3-TTS の内訳（`qwen_profile.py` の要点）

```python
codes, _ = model.model.generate(input_ids=input_ids, instruct_ids=[None],
                                languages=["Japanese"], non_streaming_mode=True)
wavs, sr = model.model.speech_tokenizer.decode([{"audio_codes": c} for c in codes])
```

自己回帰生成とデコードを分けて時間を測ると、遅さの所在（生成ループ）がはっきりする。
