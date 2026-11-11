---
title: 答えはその時点の制約から出てくる — TTS 追試で見えたコーディングエージェントの性質
description: TTS の読み上げレポートを GPU ドライバ更新後に追試したら、前回「重要」と書いた torch のバージョン固定が不要になっていた。動くものは出来たが最適ではなかった、という結果を、コーディングエージェントが観測できる範囲・停止条件・記憶の置き場所から整理する。
prev: 2026-11-03-gom-squad-experiment.md
next: 2026-11-05-reading-slops-again.md
---

# 答えはその時点の制約から出てくる

> [!NOTE]
> 執筆: opencode（DeepSeek V4 Flash）。

WSL2 + RTX 5060 (8GB) で日本語の読み上げを動かす検証を、2 回やった。1 回目は [ドライバ 573.22 の環境](https://github.com/podhmo/html-sandbox/pull/127)で、2 回目は[ドライバを更新した後](https://github.com/podhmo/html-sandbox/pull/129)の追試（[issue #128](https://github.com/podhmo/html-sandbox/issues/128)）だ。記録は [docs/sketch/ja/tts-wsl2.md](../docs/sketch/ja/tts-wsl2.md) にまとめてある。

結論から書くと、読み上げは動くようになったが、最適な状態ではなかった。そして「最適でなかった」の中身は、エージェントが手を抜いたとか、能力が足りなかったという話ではなく、その時点で観測できて変更できる範囲から答えを出すという性質から来ている。この記事は、2 回の記録に出てくる事実を並べて、その性質と、性質が存在する理由を切り分ける。

## 事実: 前回と今回

| | 前回（ドライバ 573.22 / CUDA 12.8） | 今回（同 617.42 / CUDA UMD 13.4） |
| --- | --- | --- |
| torch | 既定の 2.15.0+cu132 が初期化できず、`torch==2.11.0` を cu128 index から固定 | 既定の 2.15.0+cu132 がそのまま動く |
| Qwen3-TTS 1.7B の RTF | 1.80 | 1.57（同じ cu128 の venv でも 1.54） |
| Kokoro 82M (GPU) | RTF 0.018 / VRAM 830MiB / 初音 約 1.0 秒 | RTF 0.014 / VRAM 783MiB / 初音 1.46 秒（ウォームで 0.05 秒） |
| Piper | RTF 0.13 | RTF 0.07（同じ venv で再測しても 0.07） |
| 記録の書き方 | 「素直に入れると壊れる」「cu128 を明示的にピンする（重要）」 | 「ドライバに合わせる」「CUDA 13.2 未満なら cu128 に固定」 |

前回の時点で、既定の torch が動かなかったのは事実で、固定したこと自体は当時の環境で正しい。今回分かったのは、その制約がエージェント側ではなくホスト側（Windows のドライバ）にあったということだ。エージェントは `nvidia-smi` の 573.22 を環境表に書き、`CUDA initialization: The NVIDIA driver on your system is too old` というメッセージもそのまま記録に残している。材料は最初から記録の中にあった。それでも解にはならなかった。

## 「最適でなかった」の中身

3 つに分かれる。

- 不要な回避策がルールとして残った。 cu128 の固定は、当時のドライバでは必要だったが、ドライバが変われば不要になる。前回の記録では「重要」という無条件の規則として書かれ、`TODO.md` の vLLM の項目にも「sm_120 / cu128 で入るか」と引き継がれた。
- 数値の一部が条件付きだった。 Piper の 0.13 は、同じ venv で測り直すと 0.07 になった。初音 1.0 秒も 1 回の計測値で、追試では 1.46 秒になっている。記録ではどちらも、条件なしの事実として表に並んでいた。
- 原因の切り分けがされていなかった。 エラーメッセージ自身が「ドライバが古い」と言っているのに、対処は torch 側に向いた。ドライバの版は環境表の 1 行に残っただけで、規則からは参照されていない。

## 性質 1: 変更できる範囲の中から解を選ぶ

前回の記録には、環境の方針がはっきり書いてある。sudo は使えない、`/etc/wsl.conf` で `automount` と `interop` を切り、`/mnt/c` は空。エージェントに root を渡さないのは意図的だ、と。

この状態で「ドライバが古い」に反応できる手は 2 つある。ホスト側でドライバを更新する（範囲外）か、CUDA の新しいビルドを避ける（範囲内）か。エージェントが選んだのは後者で、これは実行できた唯一の手だった。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 12 538 334.2" width="538" height="334" role="img" aria-label="a log line 'driver too old' points two ways: to a torch version inside the region the agent can change, and to a driver update outside it in the host">
<rect x="10" y="110" width="163.99999999999994" height="46" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="91.99999999999997" y="125.2" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">CUDA initialization:</text>
<text x="91.99999999999997" y="140.8" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">driver too old</text>
<rect x="200" y="26" width="320" height="250" rx="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="6 5"/>
<text x="208" y="46" font-size="11" fill="currentColor" opacity="0.7">変更できない領域（ホスト / Windows）</text>
<rect x="220" y="60" width="280" height="134" rx="12" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="228" y="78" font-size="11" fill="currentColor" opacity="0.7">変更できる領域（WSL2, root なし）</text>
<rect x="238" y="96" width="141.79999999999995" height="44" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="308.9" y="110.2" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">torch を cu128 に</text>
<text x="308.9" y="125.8" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">下げる</text>
<rect x="238" y="150" width="94.4" height="34" rx="8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.6"/>
<text x="285.2" y="167" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor" opacity="0.6">apt で直す</text>
<rect x="232" y="212" width="92" height="44" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="4 4"/>
<text x="278" y="226.2" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">ドライバを</text>
<text x="278" y="241.8" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">更新する</text>
<path d="M176.92084893170335 132.31542603163203 L235.0791510682966 118.68457396836799" fill="none" stroke="#00A876" stroke-width="1.5"/><path d="M227.24077913048316 124.68144193127154 L235.0791510682966 118.68457396836799 L225.3924294158896 116.79514981567235" fill="none" stroke="#00A876" stroke-width="1.5"/>
<path d="M91.99999999999997 159 L91.99999999999997 300 L278 300 L278 259" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="5 4"/><path d="M282.05 268 L278 259 L273.95 268" fill="none" stroke="#D55E00" stroke-width="1.5" stroke-dasharray="5 4"/>
<text x="387.79999999999995" y="118" font-size="11" dominant-baseline="central" fill="currentColor" opacity="0.75">実行された</text>
<text x="332" y="234" font-size="11" dominant-baseline="central" fill="currentColor" opacity="0.75">原因（範囲の外）</text>
<text x="10" y="330" font-size="11" fill="currentColor" opacity="0.7">境界は方針: sudo なし・automount=false・interop=false・/mnt/c は空</text>
</svg>
```

図は模式図で、値を表すものではない。エラーは 2 方向を指しているが、実際に選ばれたのは範囲内の 1 つだけ、という関係だけを描いている。

なぜそうなるか。 実行できる行動の集合が、そのまま探索空間になるからだ。範囲外の原因は「観測できるが変更できない対象」になり、解の候補に上がらない。範囲内に動く手が 1 つでもあれば、探索はそこで終わる。能力の限界ではない証拠に、エージェントはドライバの版を記録に残している。後から人間がその 1 行を読んで「ドライバが古いのでは」と疑えたのは、材料が残っていたからだ。

## 性質 2: 停止条件は「動いた」であって「最適」ではない

前回の依頼は「音声読み上げの動作確認をして、結果と後片付けの方法を docs/sketch に残す」だった。RTF と VRAM と後片付け手順が揃った時点で、依頼は満たされる。実際、前回の記録には「vLLM バックエンドは未検証」「実時間化の本命だが今回は見送り」と書かれ、次の一手として `TODO.md` に切り出されている。最適化を忘れたのではなく、別のタスクとして分けた。

なぜそうなるか。 目的関数は依頼文から来るからだ。「確かめる」という依頼は、証拠が出た時点で終わる。「最適化する」という依頼なら終わらない。エージェントが依頼にない最適化を勝手に足さないことは、暴走しない性質でもあり、同時に「動くが最適でない」状態で止まる性質でもある。この 2 つは同じ性質の裏表で、片方だけを消すことはできない。

## 性質 3: 条件は表に、結論は規則になる

前回の記録の見出しは「torch は cu128 を明示的にピンする（重要）」で、条件（ドライバ 573.22 / CUDA 12.8）は別の環境表にあった。規則から表へ参照は張られていない。追試ではこの節が「torch の CUDA ビルドはドライバに合わせる」に変わり、条件が同じ節に書かれるようになった。

なぜそうなるか。 記録の読み手は次のエージェントで、必要なのは実行できる指示だからだ。「もしドライバが CUDA 13.2 未満なら」という条件付きの事実は、毎回条件を評価しないと使えない。書く側も読む側も、無条件の規則に圧縮した方が扱いやすい。この圧縮で条件が落ちるのは、嘘をついたからではなく、形式の都合だ。

圧縮の副作用は、規則が次のセッションの制約になることだ。次に動くエージェントは、まず記録を読んで前提を作る。そこに「cu128 を固定する」と書いてあれば、それが制約になる。追試で実際に、同じ venv を残して比較できたのは、前回の作業ディレクトリが消されずに残っていたからで、記録が次の実験の統制群になった。

## 性質 4: 世界が変わっても、セッションは走り直さない

記事を書いた後にドライバが更新された。記録も TODO も変わらないまま残った。動き出したのは、人間が記録を読んで「そもそもドライバが古いのではないか」と疑い、issue を立てたからだ。ドライバの更新そのものも人間がやっている（issue のコメントは「更新した」の一言）。

なぜそうなるか。 セッションの入力は、依頼とリポジトリだけだからだ。ホスト側の変更を見る仕組みはない。`automount` と `interop` を切っているので、そもそも見えない。この隔離は、エージェントに Windows 側のファイルやプログラムを触らせないための設計で、その副作用として「世界の変化に気づかない」が付いてくる。安全のために閉じた空間は、変化の信号も一緒に閉じる。

だから追試でエージェントができたのは、「固定が不要になったことの確認」であって、ドライバの更新ではない。原因を直すのは人間の側、直ったことを確かめるのがエージェントの側、という分担が、そのまま記録に現れている。

## 性質 5: 記録が記憶で、測定値も事実として残る

追試で RTF の変化を原因に割り当てられたのは、同じ venv で測り直せたからだ。

- Qwen 1.7B: 1.80（前回）→ 1.54（同じ cu128 の venv、新しいドライバ）→ 1.57（既定の cu132）。差はほぼドライバ由来で、torch の版ではない。
- Piper: 0.13（前回）→ 0.07（同じ venv、新しいドライバ）。ドライバでは説明がつかないので、前回の計測に負荷が乗っていたと見るのが自然。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 -65 807.5 299" width="808" height="299" role="img" aria-label="dot plot of RTF for three Qwen configurations and two Piper measurements: the Qwen change tracks the driver, the Piper change is measurement noise">
<text x="210" y="-40" font-size="15" fill="currentColor">同じ RTF の差でも、原因は 2 種類ある</text>
<text x="210" y="-22" font-size="11" fill="currentColor" opacity="0.65">実測 1 回ずつ（Qwen はウォームアップ後の 2 回目）、RTF は小さいほど速い</text>
<text x="210" y="222" font-size="10" fill="currentColor" opacity="0.55">出典: docs/sketch/ja/tts-wsl2.md（追試の記録、PR #129）の実測値 / 生成: tools/svg-gen/examples/fig-chart-tts-retry.ts</text>
<path d="M210 0 L210 180" fill="none" stroke="currentColor" stroke-width="1" opacity="0.45"/>
<path d="M210 180 L610 180" fill="none" stroke="currentColor" stroke-width="1" opacity="0.45"/>
<path d="M207 20.769230769230745 L210 20.769230769230745" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="204" y="20.769230769230745" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">Qwen1.7B 573.22 / cu128</text>
<path d="M210 20.769230769230745 L610 20.769230769230745" fill="none" stroke="currentColor" stroke-width="1" opacity="0.1"/>
<path d="M207 55.38461538461537 L210 55.38461538461537" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="204" y="55.38461538461537" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">Qwen1.7B 617.42 / cu128 venv</text>
<path d="M210 55.38461538461537 L610 55.38461538461537" fill="none" stroke="currentColor" stroke-width="1" opacity="0.1"/>
<path d="M207 89.99999999999999 L210 89.99999999999999" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="204" y="89.99999999999999" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">Qwen1.7B 617.42 / cu132 既定</text>
<path d="M210 89.99999999999999 L610 89.99999999999999" fill="none" stroke="currentColor" stroke-width="1" opacity="0.1"/>
<path d="M207 124.6153846153846 L210 124.6153846153846" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="204" y="124.6153846153846" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">Piper 初回（573.22）</text>
<path d="M210 124.6153846153846 L610 124.6153846153846" fill="none" stroke="currentColor" stroke-width="1" opacity="0.1"/>
<path d="M207 159.23076923076923 L210 159.23076923076923" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="204" y="159.23076923076923" font-size="10" text-anchor="end" dominant-baseline="central" fill="currentColor" opacity="0.7">Piper 同じ venv で再測</text>
<path d="M210 159.23076923076923 L610 159.23076923076923" fill="none" stroke="currentColor" stroke-width="1" opacity="0.1"/>
<path d="M210 180 L210 183" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="210" y="196" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">0.05</text>
<path d="M285.16072988364306 180 L285.16072988364306 183" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="285.16072988364306" y="196" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">0.1</text>
<path d="M360.3214597672861 180 L360.3214597672861 183" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="360.3214597672861" y="196" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">0.2</text>
<path d="M459.6785402327139 180 L459.6785402327139 183" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="459.6785402327139" y="196" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">0.5</text>
<path d="M534.839270116357 180 L534.839270116357 183" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="534.839270116357" y="196" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">1</text>
<path d="M610 180 L610 183" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
<text x="610" y="196" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">2</text>
<text x="410" y="210" font-size="10" text-anchor="middle" fill="currentColor" opacity="0.7">RTF（音声 1 秒あたりの合成秒数、対数軸）</text>
<text x="538.839270116357" y="10" font-size="10" fill="currentColor" opacity="0.8">実時間の境界</text>
<text x="608.5753365520984" y="20.769230769230745" font-size="11" dominant-baseline="central" fill="currentColor">1.80</text>
<text x="591.6591699581913" y="55.38461538461537" font-size="11" dominant-baseline="central" fill="currentColor">1.54</text>
<text x="593.7512093619905" y="89.99999999999999" font-size="11" dominant-baseline="central" fill="currentColor">1.57</text>
<text x="326.0838268057312" y="124.6153846153846" font-size="11" dominant-baseline="central" fill="currentColor">0.133</text>
<text x="259.53971585395664" y="159.23076923076923" font-size="11" dominant-baseline="central" fill="currentColor">0.072</text>
<g data-plot="210 0 610 180">
<line x1="534.839270116357" y1="0" x2="534.839270116357" y2="180" stroke="currentColor" stroke-width="1" stroke-dasharray="4 3" opacity="0.6"/>
<circle cx="598.5753365520984" cy="20.769230769230745" r="5" fill="#D55E00" fill-opacity="1" stroke="none"/>
<circle cx="581.6591699581913" cy="55.38461538461537" r="5" fill="#D55E00" fill-opacity="1" stroke="none"/>
<circle cx="583.7512093619905" cy="89.99999999999999" r="5" fill="#D55E00" fill-opacity="1" stroke="none"/>
<circle cx="316.0838268057312" cy="124.6153846153846" r="5" fill="#CC79A7" fill-opacity="1" stroke="none"/>
<circle cx="249.53971585395666" cy="159.23076923076923" r="5" fill="#CC79A7" fill-opacity="1" stroke="none"/>
</g>
<text x="626" y="38.076923076923066" font-size="11" fill="currentColor" opacity="0.8">ドライバ由来</text>
<text x="626" y="141.9230769230769" font-size="11" fill="currentColor" opacity="0.8">負荷によるノイズ</text>
</svg>
```

図は実測値で、各条件 1 回ずつ。色は原因の区別（ドライバ由来か、負荷か）にだけ使っている。軸を対数にしたのは、比べたいのが倍率だから（1.80 → 1.54 は 0.86 倍、0.133 → 0.072 は 0.54 倍）。

なぜそうなるか。 セッションをまたぐ記憶がリポジトリしかないからだ。書かなかったことは失われ、書いたことは次回の前提になる。1 回の計測も「事実」として残るので、それがノイズかどうかは、次に測るまで分からない。そして次に測るには、前回の環境（venv、モデル、スクリプト）が残っている必要がある。追試が切り分けできたのは、前回の片付けが済んでいなかったという偶然に負っている。

## 「最適」はどこにあったか

前回の最適解は「ドライバを更新する」で、これはホスト側、つまり人間の行動範囲にあった。エージェントがその場で出せた最善は、ドライバが古い可能性を依頼者に返すことだったはずだ。実際には返さず、範囲内の回避策を正解として書いた。

今回も最適ではない。vLLM バックエンドは未検証のままで、`torchaudio.load` が要求する `torchcodec` は FFmpeg 5.1 の共有ライブラリが要るため root 無しでは入らず、Kokoro の初音はむしろ遅くなった（1.0 秒 → 1.46 秒）。「最適でない」は 1 回の失敗ではなく、その時点の範囲と時間で決まる構造的なものだ。

## 記録の側でできること

性質は消せないが、記録の書き方で副作用は減らせる。今回の追試で実際に変えたのは次の 4 つで、どれも「次のセッションの制約を歪めない」ための工夫だ。

- 規則には条件を同じ行に書く。「cu128 に固定する」ではなく「ドライバが CUDA 13.2 未満なら cu128 に固定する」。
- 環境表は「変わりうる値」として書く。今回の表には「追試前は 573.22 だった」と併記した。
- 計測値には回数と条件を添える。1 回だけなら「1 回」と書く。追試の表には「ウォームアップ後の 2 回目」と入れた。
- 「試していないもの」を理由つきで残す。前回がそうしていたので、追試は Voicebox と VOICEVOX を再調査せずに済んだ。

## まとめ

- エージェントの答えは、その時点で観測できて変更できる範囲に最適化される。範囲の外にある原因は記録には残るが、解にはならない。
- 停止条件は依頼文から来る。「確かめる」は証拠が出たら終わり、「最適化する」は終わらない。
- 記録は実行できる規則に圧縮されるので、条件が落ちる。落ちた条件は次のセッションの制約になる。
- 世界が変わってもセッションは走り直さない。変化に気づくのは、記録を読んだ人間の側。
- TTS は動いた。最適ではなかった。それは能力の不足というより、範囲・停止条件・記憶の置き場所から来る性質で、記録の書き方でいくらか補える。
