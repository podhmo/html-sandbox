---
title: DADSイラスト素材のLoRA化を調べた — 学習は$2、壁は「このブログがPNGを載せられるか」だった
description: デジタル庁デザインシステムのイラストレーション素材74枚でスタイルLoRAを作る目論見を調査。データセット(74ペア・白背景化・キャプション付き)まで実際に作り、学習$2-6・推奨モデルはFLUX.2 klein 4BかFLUX.1 devと結論。だが本命の壁は別にあった — slopsはPNGを載せられない。SVG(採用済み)・PNG(今回)・MathML(issue #73)と同じ「表現形式を増やすか」問いの3例目。
prev: ../2026-11-03-unslop-dads-reports.md
next: ../2026-11-03-silence-as-consent.md
---

# DADSイラスト素材のLoRA化を調べた — 学習は$2、壁は「このブログがPNGを載せられるか」だった

slopsの記事に挿絵がほしい。いま図はtools/svg-genの`currentColor`な線画ばかりで、記事を開いた瞬間に目に入る「柔らかいフラットイラスト」がない。そこで[デジタル庁デザインシステムのイラストレーション・アイコン素材](https://www.digital.go.jp/policies/servicedesign/designsystem/Illustration_Icons)を学習データに、スタイルLoRAを作れないか調べた。調査の詳細は [docs/sketch/ja/dads-illustration-lora.md](https://github.com/podhmo/html-sandbox/blob/main/docs/sketch/ja/dads-illustration-lora.md) に記録した。この記事はその顛末と、調べた先で見つかった別の問いの話。

## 素材と規約

配布zip(約7MB)の中身は、イラストPNG 74枚、アイコンSVG 120種(線・塗りペア)+PNG 360枚、ガイドラインPDF 2本。イラストは人物・カード・スマホ・書類という行政手続きの語彙で統一され、輪郭線なし・大ぶりの角丸・限定パレットの完全フラット塗り。全74枚をコンタクトシートにして目視したが、均質さは学習データ向きに見える。

規約は「誰でも自由に・商用可・クレジット不要」で寛大。ただし編集・加工した情報を、あたかも国が作成したかのような態様で公表してはいけない。LoRAや生成物を配布するなら「DADS素材を元に加工したもの」と明記するのが安全そうだ。

## LoRAとは

事前学習済みモデルの重み行列を凍結し、差分だけを低ランク行列 `ΔW = B·A` で学習する仕組み。フルファインチューニングに比べて出力が数十MBと小さく、ベースモデルに後から足す「画風パッチ」になる。トリガーワード(今回なら`dadsillu`)をプロンプトに入れて効かせる。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="18 48 659.1999999999999 181.2" width="659" height="181" role="img" aria-label="schematic of a LoRA: a frozen base weight W plus a small low-rank delta B times A merged at inference">
<rect x="30" y="60" width="190" height="140" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="125" y="130" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">base model W
(凍結)</text>
<text x="125" y="215" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.7">数GB・学習しない</text>
<rect x="270" y="80" width="26" height="100" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="283" y="130" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">B</text>
<rect x="310" y="150" width="100" height="26" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="360" y="163" font-size="12" text-anchor="middle" dominant-baseline="central" fill="currentColor">A</text>
<text x="370" y="120" font-size="11" fill="currentColor">ΔW = B·A
rank r (16程度)
数十MB</text>
<rect x="520" y="80" width="141.90000000000003" height="44" rx="8" fill="none" stroke="#E69F00" stroke-width="1.5"/>
<text x="590.95" y="102" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">生成時に
W + ΔW</text>
<path d="M221.15384615384616 127.23076923076923 L240 82 L517.0076239005078 101.78625885003628" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M507.7419450495802 105.18474313445957 L517.0076239005078 101.78625885003628 L508.3190461544823 97.10532766583061" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M298.9993794708377 129.93898533031015 L587.9506205291624 124.06101466968987" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 4"/><path d="M579.0348519207306 128.29322096439037 L587.9506205291624 124.06101466968987 L578.870112312568 120.19489639312857" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 4"/>
<text x="520" y="170" font-size="11" fill="currentColor" opacity="0.7">prompt:</text>
<text x="520" y="186" font-size="12" fill="currentColor">dadsillu, a person ...</text>
<path d="M520 190.4 L665.1999999999999 190.4" fill="none" stroke="currentColor" stroke-width="2"/>
</svg>
```

## コストと選んだモデル

学習コストは想像より安かった(2026-11時点の各社価格ページより):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -37 554.2500000000002 199.2" width="554" height="199" role="img" aria-label="listed prices for one LoRA training run: Replicate FLUX.1 dev 1.46 USD, fal FLUX.1 dev 2 USD, fal Klein 4.3 USD, fal FLUX.2 dev 6.4 USD">
<rect x="143.99999999999994" y="-4" width="71.875" height="28" rx="8" fill="currentColor" fill-opacity="0.08" stroke="none"/>
<text x="139.99999999999994" y="10" font-size="12" text-anchor="end" dominant-baseline="central" fill="currentColor">Replicate FLUX.1 dev</text>
<rect x="147.99999999999994" y="0" width="63.875" height="20" fill="currentColor" fill-opacity="0.45" stroke="currentColor" stroke-width="1"/>
<text x="217.87499999999994" y="10" font-size="11" dominant-baseline="central" fill="currentColor" opacity="0.7">$1.46</text>
<text x="139.99999999999994" y="42" font-size="12" text-anchor="end" dominant-baseline="central" fill="currentColor">fal FLUX.1 dev fast</text>
<rect x="147.99999999999994" y="32" width="87.5" height="20" fill="currentColor" fill-opacity="0.45" stroke="currentColor" stroke-width="1"/>
<text x="241.49999999999994" y="42" font-size="11" dominant-baseline="central" fill="currentColor" opacity="0.7">$2</text>
<text x="139.99999999999994" y="74" font-size="12" text-anchor="end" dominant-baseline="central" fill="currentColor">fal Klein系</text>
<rect x="147.99999999999994" y="64" width="188.125" height="20" fill="currentColor" fill-opacity="0.45" stroke="currentColor" stroke-width="1"/>
<text x="342.12499999999994" y="74" font-size="11" dominant-baseline="central" fill="currentColor" opacity="0.7">$4.3</text>
<text x="139.99999999999994" y="106" font-size="12" text-anchor="end" dominant-baseline="central" fill="currentColor">fal FLUX.2 dev</text>
<rect x="147.99999999999994" y="96" width="280" height="20" fill="currentColor" fill-opacity="0.45" stroke="currentColor" stroke-width="1"/>
<text x="433.99999999999994" y="106" font-size="11" dominant-baseline="central" fill="currentColor" opacity="0.7">$6.4</text>
<text x="160" y="-16" font-size="11" fill="currentColor" opacity="0.6">LoRA学習1回あたりの表示価格 (2026-11, 各社の価格ページ)</text>
<text x="160" y="150" font-size="11" fill="currentColor" opacity="0.7">local GPU (FluxGym等, 12GB VRAM) はGPU時間のみ。CivitaiはBuzz建て</text>
</svg>
```

1回$2前後で試せる。利用側(生成)は1枚$0.01-0.035/MP程度。CivitaiはBuzz建て、ローカルはFluxGymやai-toolkitでGPU時間のみ(FLUX系で12-24GB VRAM、SDXLで12GB程度)。

対象モデルの条件はライセンス・フラット画風への追従性・LoRAエコシステム・コストの4点で絞った:

- FLUX.2 [klein] 4B — Apache 2.0で完全に商用フリー。4ステップ蒸留で速く、ローカルも約13GB VRAMで動く。第一候補
- FLUX.1 [dev] — 学習$2と最安でLoRAエコシステム最大。重みはFLUX Non-Commercialだが、API経由/個人ブログ用途なら実害は薄い
- SDXL — OpenRAIL-M、ローカル12GBで学習まで無料完結できる最安路線
- FLUX.2 [dev]、SD1.5はそれぞれ高い・弱いで見送り

## LoRA以外の選択肢

調べて分かったのは、LoRAが最適解になるのは「継続的に何枚も同じ画風で作る」場合だけということ。用途が少ないなら別案がある:

- 素材をそのまま使う — アイコンSVG 120種は今日から`svg`フェンスで埋め込める。既存74枚で足りる場面なら生成すら要らない
- 参照画像編集 — FLUX.2 devやGemini image系に参照画像を数枚渡して「このスタイルで○○」と編集させる。学習なし・1回数セント。fal公式ガイドも「数枚で済むならこっち」と書いていた
- LLMにSVGを書かせる — DADSパレットをfew-shotで渡す現行路線の延長。フォーマット的には一番素直
- IP-Adapter等のスタイル参照、フルファインチューニングは今回の規模では見送り

## データセットは作った

学習はGPUもAPIトークンも手元にないので未実行だが、データセットは実際に作った:

- イラスト74枚(透過RGBA→白背景に合成→1024px以内にリサイズ)
- 全74枚を目視して `dadsillu, <被写体の説明>` 形式のキャプションtxtを作成
- zip化して 74ペア・2.4MB — falやReplicateのトレーナーにそのまま投げられる形

2つの落とし穴を踏んだ。透過PNGはそのまま学習に投げると背景が黒として読まれる(白合成必須)。スタイルLoRAのキャプションは画風を書かず被写体だけを書くのが定石で、そうしないとスタイルがトリガーワードに乗らない。

あとは `fal-ai/flux-lora-fast-training` にzipを投げて `is_style=true` `trigger_word=dadsillu` で1000ステップ回せばLoRAが降りてくる、はず(未検証の「おそらく」)。

## 本命の壁はこっちだった

ところが調べ終わって気づく。生成物はPNG。そしてslopsのバンドルはPNG/JPEGをメンバーにできない。画像を載せる経路が、このブログには存在しない。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="8 48 793.3 286.4" width="793" height="286" role="img" aria-label="pipeline from DADS assets to a PNG that slops cannot host; SVG already has an embed route, MathML issue 73 is still open">
<rect x="20" y="60" width="127.9" height="40" rx="8" fill="none" stroke="#3B82C4" stroke-width="1.5"/>
<text x="83.95" y="80" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">DADS素材
74枚</text>
<rect x="160" y="60" width="90.80000000000001" height="40" rx="8" fill="none" stroke="#E69F00" stroke-width="1.5"/>
<text x="205.4" y="80" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">学習
~$2</text>
<rect x="300" y="60" width="162.90000000000003" height="40" rx="8" fill="none" stroke="#00A876" stroke-width="1.5"/>
<text x="381.45000000000005" y="80" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">LoRA
.safetensors</text>
<rect x="510" y="60" width="90.80000000000001" height="40" rx="8" fill="none" stroke="#D55E00" stroke-width="1.5"/>
<text x="555.4" y="80" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">生成
PNG</text>
<rect x="660" y="60" width="129.3" height="40" rx="8" fill="none" stroke="#CC79A7" stroke-width="1.5"/>
<text x="724.65" y="80" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">slops
PNG不可</text>
<path d="M150.9 80 L157 80" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M148 84.05 L157 80 L148 75.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M253.8 80 L297 80" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M288 84.05 L297 80 L288 75.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M465.90000000000003 80 L507 80" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M498 84.05 L507 80 L498 75.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M603.8 80 L657 80" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="6 4"/><path d="M648 84.05 L657 80 L648 75.95" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="6 4"/>
<rect x="310" y="170" width="118.80000000000001" height="40" rx="8" fill="none" stroke="#56B4E9" stroke-width="1.5"/>
<text x="369.4" y="190" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">SVG
フェンス</text>
<rect x="660" y="170" width="102" height="40" rx="8" fill="none" stroke="#E69F00" stroke-width="1.5"/>
<text x="711" y="190" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">埋め込み可</text>
<path d="M431.8 190 L657 190" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M648 194.05 L657 190 L648 185.95" fill="none" stroke="currentColor" stroke-width="1.5"/>
<rect x="310" y="250" width="155.20000000000005" height="40" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="387.6" y="270" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">MathML
issue #73</text>
<rect x="660" y="250" width="74" height="40" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="697" y="270" font-size="14" text-anchor="middle" dominant-baseline="central" fill="currentColor">未回答</text>
<path d="M468.20000000000005 270 L657 270" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 4"/><path d="M648 274.05 L657 270 L648 265.95" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 4"/>
<text x="20" y="320" font-size="12" fill="currentColor" opacity="0.8">同じ壁: 「このフォーマットにその表現形式を載せるか」— PNGがぶつかるのは3例目</text>
</svg>
```

選択肢は3つ: vtracer等でSVGにトレースして埋め込む(フラット塗りはトレース向き)、サイト側にバイナリメンバーの対応を入れる(content.binの拡張)、生成物を下絵にしてsvg-genで描き直す。どれも「LoRAを作る」決断とは別の問いだ。

## 余談: 数式も同じ壁を持つ — issue #73

これは [issue #73](https://github.com/podhmo/html-sandbox/issues/73)「数式対応。あると便利だがなくても困らない」と同じ一族の問いだった。MathMLは2023年以降モダンブラウザ全てでネイティブ表示でき、MathJax/KaTeXのような依存を引き込まずに済む。「生のMathMLをそのまま埋め込む」なら実装はSVGフェンスと同型 — だがtinymarkdownは現在、生HTMLをテキストとして表示するので、MathMLを書いてもタグが見えるだけになる。

挿絵(PNG)・数式(MathML)・あとSVG(採用済み)と、問いの形は同じで「このフォーマットにその表現形式を載せるか」。SVGのときは「svgフェンスを特別扱いする」という答えを出した。PNGとMathMLは未回答のまま。issueの温度感(「あると便利だがなくても困らない」)を思うと、コスト・実装量・使う頻度のどれが釣り合うかが決め手になりそうだ。

## まとめ

- LoRA化は調査完了・データセット作成済み・学習は$2から試せる。モデルはFLUX.2 klein 4B(ライセンスがきれい)かFLUX.1 dev(実績豊富)
- 真の障壁は学習コストではなく、生成物のPNGをこのブログに載せる経路がないこと
- 次の一手はトークンを取って$2の学習を1回流すこと。ただしその前に「挿絵をラスタで欲しいのか」「フォーマットを増やすか」を決めるべき
- 数式(MathML)も同じ問いの一族。SVGに続く2件目・3件目の「形式を増やすか」として、まとめて方向性を決めたい

なお生成画像内の日本語テキストはどのモデルでも崩壊する。DADS元素材も文字をグレーのプレースホルダで表しているので、「文字を入れない挿絵」という運用とは相性が良い。

## 追記: この記事で書きたかった式は?

issue #73 の裏テーマを立てるなら、この調査自身が「式の需要」の実例になる。sketchと記事の執筆中に実際に欲しくなった式を全部挙げて、インラインかブロックかで分類する:

| 式 | 形 | 実際どう書いたか |
| --- | --- | --- |
| `ΔW = B·A` | インライン | inline code で済ませた |
| `W = W₀ + ΔW` | インライン | 「ベースモデルに後から足す」と言い換えた |
| `B ∈ ℝ^{d×r}` `A ∈ ℝ^{r×k}` | インライン | 「低ランク行列」と言い換えた |
| `r ≪ min(d, k)` | インライン | 「rank 4〜64程度」に言い換えた |
| 適用時のスケール `α/r` | インライン | 書かなかった |
| 学習の目的関数 `E‖v_θ(x_t, t) - v‖²` (flow matching) | ブロック | 書かなかった(節ごと割愛) |
| パラメータ数 `d·r + r·k ≪ d·k` | インライン | 「数十分の一」と言い換えた |

結果は明白で、欲しかった式はほぼ全てインライン。ブロック(複数行)で書きたかったのは損失関数だけで、それは「書かない」判断で済ませられた。つまり今回の体裁では、issueの案(texサブセット→MathMLの変換器)のうちインライン側だけで実用上は足りる。

そして皮肉な一致があって、issue #73 のコメントは「mathmlをそのまま埋め込めると良い。しかしインライン対応だけ困る」と書いていた — パーサー的に一番難しいのがインライン(`$...$`の区切りと本文の衝突)で、今回の棚卸しでは必要なのがまさにインラインだった。難しい方と必要な方が一致している。式が欲しい密度はこの程度の記事では低いので、「あると便利だがなくても困らない」という温度感も、少なくともこの表題では妥当だった。

## 追記(その2): 挿絵の実用ルート

挿絵の方も、いきなり「ブログに載せる経路を作る」から始めるのではなく段階がある:

1. 生成して眺める — まずLoRA(または参照画像編集)で実際に挿絵を数枚作り、GitHub issue artifactsに載せて眺める。このブログでは生成HTMLの共有にもissue artifactsを使っているので、画像でも同じ場所が自然。ここで「生成物はどのくらいDADSっぽいか」「挿絵として使いたいレベルか」を見る。見るまでもなく質が足りないなら、ここで終わる実験
2. 使えると分かったら載せ方を決める — 2択になるはず:
   - vtracer等でSVGにトレースして`svg`メンバーとして埋め込む。フラット塗り・限定色のDADS風はベクタ化と相性が良いはずで、フォーマットを増やさずに済む。トレースの荒れ(アンチエイリアスの階調が段になる等)が許容できるかが争点
   - 諦めてPNG/JPEGメンバー(attachments)を許す。content.binのバイナリ対応というサイト拡張。SVGのときと同じ「特別扱いを1つ足す」設計判断

つまり順序は「作って眺める → 良かったら vtracer→SVG で済むか試す → 無理なら添付許容を考える」。学習の$2より前に、この検証サイクルの1周目(生成してissue artifactsに貼る)が次の一手になる。

## 追記(その3): 8GB GPUで$0学習できた

この記事を書いた時点では「学習は$2から」「GPUがないのでローカル学習は未検証」だった。その後、WSL2上のRTX 5060 Laptop (8GB VRAM) で、有料APIを一切使わずにLoRA学習と生成まで通った。2026-11-03時点の実測を残す。

### 構成

FLUX.2 klein 4Bの内訳は transformer 7.75GB (bf16) + Qwen3 text encoder 8.04GB + VAE 168MB。合計16GBで、そのままでは8GBに載らない。次の3点で収めた:

- transformerをNF4 (bitsandbytes, double quant) で量子化する。約2.5GB
- Qwen3 text encoderはCPUに置く。プロンプト埋め込みの計算だけCPUで行い、学習ループには入れない
- gradient checkpointing + latent caching + 8-bit Adam

この構成で、diffusersの `train_dreambooth_lora_flux2_klein.py` は4箇所のパッチで動いた:

- VAEはGPU、text encoderはCPUに置く (元は両方GPU)
- CPUで作ったprompt embedsを学習デバイスへ移す
- LoRA対象の `single_transformer_blocks` を `config.num_single_layers` (4Bは20) から作る。元は24固定で、存在しないモジュールを4つ指定していた
- ピークVRAMをログに出す

FP8 (torchao) はsm_120で動くことを確認したが、学習には使っていない。bf16のtransformer 7.75GBをGPUに載せる時点で8GBを超えるため。NF4はロード時から量子化されるのでピークが低い。

### 実測

| 条件 | ピークVRAM (allocated / reserved) | 速度 |
| --- | --- | --- |
| 512px / 74枚 / 400 steps | 3.00 GiB / 3.20 GiB | 1.84 s/step (合計12分21秒) |
| 1024px / 16枚 / 10 steps | 4.99 GiB / 5.66 GiB | 約6.0 s/step |

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -55 411.47499999999997 155.2" width="411" height="155" role="img" aria-label="peak VRAM of the local LoRA training: 512px 400 steps 3.00 GiB, 1024px 10 steps 4.99 GiB, on an 8 GiB card">
<text x="113.59999999999997" y="10" font-size="12" text-anchor="end" dominant-baseline="central" fill="currentColor">512px, 400 steps</text>
<rect x="121.59999999999997" y="0" width="78" height="20" fill="currentColor" fill-opacity="0.45" stroke="currentColor" stroke-width="1"/>
<text x="205.59999999999997" y="10" font-size="11" dominant-baseline="central" fill="currentColor" opacity="0.7">3.00 GiB</text>
<text x="113.59999999999997" y="44" font-size="12" text-anchor="end" dominant-baseline="central" fill="currentColor">1024px, 10 steps</text>
<rect x="121.59999999999997" y="34" width="129.74" height="20" fill="currentColor" fill-opacity="0.45" stroke="currentColor" stroke-width="1"/>
<text x="257.34" y="44" font-size="11" dominant-baseline="central" fill="currentColor" opacity="0.7">4.99 GiB</text>
<path d="M329.59999999999997 -26 L329.59999999999997 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/>
<text x="329.59999999999997" y="-34" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.7">8 GiB (このGPUのVRAM)</text>
<text x="0" y="88" font-size="11" fill="currentColor" opacity="0.65">ピークは transformer をNF4、text encoderをCPUに置いた構成の実測値。</text>
</svg>
```

1024pxでもピーク5GiB弱で、8GBに収まる。512pxの400 stepsは12分で終わるので、待ち時間は記事を1本書く合間程度。API課金は$0で、GPU時間と電気代だけがコストになる。

### 生成結果

学習したLoRA (rank 16) での1024px生成は4 stepsで約5秒。同じプロンプト・seedのベースモデルと比べると、輪郭線なし・顔のパーツを描かない・サーモンピンク/ブルー/オリーブの限定パレットというDADSの特徴が出た。サンプルは[PR #125のコメント](https://github.com/podhmo/html-sandbox/pull/125#issuecomment-6590651796)に貼った。

ただし400 stepsでは構図とポーズがまだ粗い。「もうちょっと回さないとダメそう」というのが生成物を見た感想で、この記事の範囲では追加学習はしていない。

### データとキャプションの制約

DADSの公開zipからイラスト74枚を取り、透過PNGを白背景に合成して512pxに縮小した。透過のままだと背景が黒として学習される。

キャプションは全画像で `dadsillu, flat vector illustration` の固定。diffusersのローカル画像パスは `.txt` キャプションを読まないため、画像ごとのキャプションを使うには `image` / `text` 列を持つdatasetを `--dataset_name` で渡す必要がある。スタイルLoRAなら共通トリガーでも動くが、内容とスタイルの分離は弱くなる。

### 再現用リポジトリ

`~/ghq/github.com/podhmo/dads-illustration-lora` に、セットアップから生成までをまとめた (ローカルのみで、GitHubには未公開)。ベースモデル約16GBとデータは含めず、makeで取る。

- `make setup` — uv + torch cu128 + diffusers
- `make model` — FLUX.2-klein-4B
- `make dataset` — DADS zipから74枚 (512px, 白背景)
- `make train` — NF4 + text encoder CPU、400 steps。`RES=1024 STEPS=1000` も可
- `make generate` — LoRA付きで1枚生成

### 次に回すなら

品質を詰めるなら、優先順はこの順になるはず:

- 1024pxで1000 steps以上。1024pxは6秒/stepなので1000 stepsで約1.7時間
- 画像ごとのキャプション。`dadsillu, <内容>` をdatasetのtext列で渡す
- rank 16 → 32、lrを少し下げる

記事の結論「真の障壁は学習コストではなくPNGをブログに載せる経路」は変わっていない。学習が$0・12分で回るなら、残る問題は生成物の使い道とフォーマットだけになる。
