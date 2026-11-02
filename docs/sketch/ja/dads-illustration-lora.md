# 調査メモ: デジタル庁のイラスト素材でLoRAを学習させて記事の挿絵を作るには

「[イラストレーション・アイコン素材｜デジタル庁](https://www.digital.go.jp/policies/servicedesign/designsystem/Illustration_Icons)」のアセットを学習データにして、スタイルLoRAを作る目論見の調査記録。前提、LoRAとは何か、学習/利用コスト、LoRA以外の選択肢、モデルの条件と選定、(おそらく動く)学習手順、利用方法まで。

## 前提と目論見

このブログの slops 記事には現在「挿絵」がない。図は tools/svg-gen で生成する概念図か統計図で、どれも `currentColor` の線画。記事を開いたときに目に入る「柔らかいフラットイラスト」が欲しい、というのが表の動機。

素材としてデジタル庁デザインシステム(DADS)のイラストレーション・アイコン素材を使う。

- [ダウンロード zip](https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/bb5d3e3b-30be-4487-b4f0-b3191a1ef823/c7976118/designsystem-assets.zip) (約7MB)
- 中身: illustration PNG 74枚 + icon SVG 120種/PNG 360枚(24/48/72px) + ガイドラインPDF 2本 + LICENSE.txt
- 規約: 誰でも自由に利用可・商用可・クレジット不要。ただし「編集・加工した情報を、あたかも国が作成したかのような態様で公表・利用・再配布してはいけない」。学習済みLoRAや生成物を配布するなら「DADS素材を元に加工した」と明記する運用が安全
- illustration の実数: `l_*` レイアウト見本 4、`m_*` 場面イラスト 28(white/warmgray の背景色違いペア)、`s_*` スポット 14、`s_hand*` 手元 4、`s_human*` 人物 24。ユニークな場面は約58。人物・カード・スマホ・書類という行政手続きの語彙が中心

スタイルの特徴(実際に全74枚をコンタクトシートで確認): 輪郭線なし・大ぶりの角丸形状・サーモンピンク/ライトブルー/ネイビー/オリーブ/ミントの限定パレット・完全なフラット塗り。均質で一貫したスタイルなので、LoRAの学習対象として相性は良いはず。

目論見は「記事ごとに新しい場面の挿絵を、このスタイルで生成する」こと。学習データは少なめ(数十枚)のスタイルLoRAの典型ケース。

## LoRAとは何か

Low-Rank Adaptation。事前学習済みモデルの重み行列 `W` を凍結し、差分を低ランク行列 `ΔW = B·A` (rank 4〜64程度) だけ学習する手法。出来上がるのはベースモデルに足す「差分ファイル」で、サイズは数十〜数百MB (フルファインチューニングの数十分の一)。画像生成系では特定の人物・画風・構図語彙を「トリガーワード + LoRA重み」で呼び出せるようにするのが定番の使い道。

今回は「DADSのフラットイラストという画風」を学ばせるスタイルLoRA。

## 学習コストと利用コスト (2026-11 調べ)

| 経路 | 学習コスト | 利用コスト(生成) |
| --- | --- | --- |
| fal.ai `fal-ai/flux-lora-fast-training` (FLUX.1 dev) | $2 / 1000ステップ | `fal-ai/flux-lora` 約$0.025-0.035/MP |
| fal.ai `fal-ai/flux-2-trainer-v2` (FLUX.2 dev) | $6.40 / 1000ステップ | `fal-ai/flux-2/lora` |
| fal.ai Klein系トレーナー | $4.3程度 / 1000ステップ | Klein LoRA 約$0.012-0.035/MP |
| Replicate FLUX.1 dev トレーナー | 約$1.46 / 回 | 従量 |
| Civitai サイト内トレーナー | 約2000 Buzz(サイト内クレジット) | サイト内生成 |
| ローカル (FluxGym / ai-toolkit / kohya) | GPU時間のみ | GPU時間のみ |

ローカルに必要なVRAMの目安: FLUX系(量子化込み)で12-24GB、SDXLで12GB前後、SD1.5なら8GBでも動く。この作業VMにはGPUがないのでローカル学習は検証できなかった。

参考: falの公式ガイド [Fine-Tune FLUX: When, Which Model, What It Costs](https://fal.ai/learn/devs/how-to-fine-tune-flux-with-the-api)。「数枚の参照画像で済むなら学習なしのリファレンス編集(FLUX.2 dev / Klein の edit)で十分」と公式も言っている。

## LoRA以外の選択肢

コスト順に並べると:

1. 素材をそのまま使う — 最強のベースライン。アイコンSVG 120種は今日から `svg` フェンスでそのまま埋め込める。既存74枚で間に合う場面なら生成すら不要。欠点は「記事に合う場面が無いと作れない」こと
2. 参照画像編集 (multi-reference edit) — FLUX.2 dev / Klein / Nano Banana (Gemini image) / gpt-image 系に「このスタイルで○○の場面」と参照画像を数枚渡して編集させる。学習不要・1回あたり数セント。場面の種類が少ない・たまにしか使わないならまずこれ
3. LLMにSVGを直接書かせる (現行路線の延長) — DADSパレットと形状ルールをfew-shotで渡し、svg-genでイラスト風の図を生成する。このブログはPNGを載せられないので、実はフォーマット的には一番素直。品質は探索中
4. IP-Adapter / Redux 系のスタイル参照 — 学習なしで推論時にスタイル画像を条件付け。ComfyUI等ローカル前提
5. スタイルLoRA (本命) — 継続的に何枚も同じ画風で作るなら単価・再現性で有利。一度作ればトリガーワードで呼べる
6. フルファインチューニング — 過剰。対象外

## 対象モデルの条件

- ライセンス: ブログに載せる生成物が商用・再配布で揉めないこと。重み自体の再配布はしない前提でも、FLUX Non-Commercial 系は扱いに注意
- フラットイラストの追従性: 線なし・限定色の「コーポレートフラット」を安定して出せること
- LoRAエコシステム: トレーナー(ホステッド/ローカル)とsafetensorsの行き来が楽なこと
- コスト: 学習1回数ドル、生成1枚数セント以下
- 日本語テキスト: どのモデルも画像内の日本語は滅茶苦茶になるので、「文字を入れない」運用を前提にする(DADS元素材も文字部分はグレーのプレースホルダが多いので相性は良い)

## モデル選定 (2026-11 時点)

| モデル | ライセンス | 学習 | 生成 | 評価 |
| --- | --- | --- | --- | --- |
| FLUX.2 [klein] 4B | Apache 2.0 | fal Klein系 $4.3 / ローカル ai-toolkit | API $0.014〜 / ローカル 約13GB VRAM・4ステップ | 第一候補。完全に商用フリーで、軽くて速い。新しいのでコミュニティLoRAは少ない |
| FLUX.1 [dev] | FLUX NCL (API経由なら商用可) | fal $2・Replicate $1.46 (最安) | fal-ai/flux-lora | LoRAエコシステム最大・実績豊富。個人ブログ用途なら問題にならない |
| FLUX.2 [dev] | FLUX NCL | fal $6.4 | API | 最高品質・マルチリファレンス編集も強い。「まず学習なしで試す」側の受け皿 |
| SDXL | OpenRAIL-M | kohya ローカル 12GB / Civitai 2000Buzz | ローカル余裕 | 商用可・ローカル完結できる最安路線。フラット画風の追従性はFLUXより落ちる印象 |
| SD1.5 | CreativeML | どこでも動く(8GB) | 爆速 | 品質不足気味。検証用の割り切りなら |

推奨: FLUX.2 klein 4B (ライセンスがきれい・速度) か、実績重視で FLUX.1 dev (学習$2と安く枯れている)。ブログが非商用ならFLUX.1 devの方が情報量で楽。

## (おそらく動く)学習方法

GPUもAPIトークンも手元にないため未検証だが、データセットは実際に作った: illustration 74枚を白背景に合成→1024px以内にリサイズ→各画像に `dadsillu, <内容の説明>` 形式のキャプションtxtを付けてzip化(74ペア・2.4MB)。透過PNGのまま学習に投げると背景が黒として読まれるので白合成は必須だった。

キャプションの方針: スタイルLoRAでは「画風そのものは書かず、被写体だけを書く」。`dadsillu` を共通トリガーワードにして、スタイルをトリガーワード側に吸収させる定番の作り方。

手順 (falの例):

1. zipを `fal-ai/flux-lora-fast-training` にアップロード、`is_style=true`, `trigger_word=dadsillu`, steps 1000-1500 (~$2)
2. 出来たLoRAを `fal-ai/flux-lora` (またはkleinなら対応エンドポイント) で呼ぶ: プロンプト例 `dadsillu, a person writing a blog article at a desk, flat illustration`
3. LoRA強度 0.7-1.0 で調整。生成物はPNG

ローカルなら ai-toolkit (FLUX系) / kohya sd-scripts (SDXL) に同じzipを食わせればよい。rank 16前後・学習率 1e-4 あたりが無難な初期値。

## 利用方法と、このブログに載せるには

生成物はラスタ画像。ここで構造的な問題がある: slopsのバンドルはPNG/JPEGをメンバーにできない。受け皿がない。選択肢は:

- vtracer等でSVGにトレースして埋め込む — フラット塗りのイラストはベクタ化との相性が良い。色数が少ないので綺麗にトレースできる見込み(要検証)
- PNGをメンバーにする拡張をサイト側に入れる — content.bin のバイナリ対応が要る。別の設計判断
- 生成物を「下絵」として使い、svg-genで描き直す — LoRAの出力をそのまま使わず、構図の参照にする。手間は増えるがフォーマットは今のまま

つまり「LoRAを作る」決断と「このブログがラスタを載せられるか」は別の問いで、後者は issue [#73](https://github.com/podhmo/html-sandbox/issues/73) のMathMLと同じ「表現形式を増やすか」問題の一族。

## まとめ

- 素材・ライセンス・データセットは揃った (74ペアのzipまで作成済み)
- 学習は $2-6 の使い切り。高いのは学習ではなく運用の一手間 (PNG→ブログに載せる経路)
- 次の一手は「fal か Replicate のトークンを取って $2 の学習を1回流す」こと。失敗しても数百円の実験
- それ以前に「挿絵をラスタで欲しいのか、SVG路線の延長で欲しいのか」の方向性の確認は残る

## この環境 (RTX 5060 Laptop / WSL2) で学習できるか

記事執筆時のVM (Devin) にはGPUが無かったが、別の手元環境 (WSL2) にはGPUがある。同じDADS素材を使って、有料APIを使わずローカル学習できるかを追試した。2026-11-03時点の記録。

### 環境

| 項目 | 値 |
| --- | --- |
| OS | Ubuntu 26.04.1 on WSL2 (kernel 6.18) |
| GPU | NVIDIA GeForce RTX 5060 Laptop GPU, 8GB VRAM (cc 12.0, Blackwell) |
| Driver / CUDA | 573.22 / 12.8 |
| CPU / RAM | Ryzen 7 255 (8C/16T) / 15GB |
| Disk | 約900GB空き |
| Python | 3.12.16 (uv) |

注意点として `/tmp` は tmpfs 7.7GB しかない。venv (7.2GB) とモデル (約16GB) を置くと溢れるので、作業ディレクトリは `~/lora-work` に移した。

### 入れたもの

- `torch 2.11.0+cu128` / `torchvision 0.26.0`
- `diffusers 0.42.0.dev0` (main) / `transformers 5.22.1` / `peft 0.21.2`
- `bitsandbytes 0.50.2` / `torchao 0.18.0`
- accelerate, datasets, ftfy, tensorboard, sentencepiece, prodigyopt

### 確認できたこと

- CUDA: `torch.cuda.is_available() == True`、bf16 matmul 動作
- torchao の FP8 training (`Float8Linear`) が sm_120 で動作。ただし行列次元が16の倍数である必要があり、`Float8LinearConfig(pad_inner_dim=True)` を使う
- diffusers に klein 4B 専用の公式学習スクリプト `train_dreambooth_lora_flux2_klein.py` がある。`--do_fp8_training` / `--bnb_quantization_config_path` (NF4) / `--cache_latents` / `--gradient_checkpointing` / `--offload` に対応
- モデル構成: transformer 7.75GB (bf16, 4B) + text encoder 8.04GB (Qwen3-4B) + VAE 168MB。モデルカードの推論要件は約13GB VRAM

### 8GB VRAM の壁

- transformer を bf16 で載せると 7.75GB でほぼ埋まる。FP8 (torchao) なら約4GB、NF4なら約2.5GB
- text encoder (Qwen3-4B, bf16 8GB) は transformer と同時にGPUへ載せられない。diffusers の `--offload` はプロンプト埋め込み計算時にTEをGPUへ戻すため、fp8 transformer (4GB) + TE (8GB) = 12GB でOOMする
- 対策: TEはCPUに置いたままプロンプト埋め込みだけ計算する。スタイルLoRAはトリガーワード固定なので埋め込みは1回で済み、RAM 15GBにTE 8GBを載せても学習は成立する見込み
- 画像解像度はまず512pxで試す (記事のデータセットは1024px)。1024pxは未検証

### データセット

PRにはzipが含まれていないため、公開zipから再作成した。illustration PNG 74枚を白背景に合成し、長辺512pxにリサイズ (記事の1024pxから縮小)。スモークテストでは静的プロンプト `dadsillu, flat illustration` を使い、本番では `dadsillu, <内容>` のtxtを付ける。

### 現状

- 環境構築・GPU/FP8の動作確認・データセット再作成まで完了
- モデル (約16GB) をダウンロード中
- これから diffusers の klein 学習スクリプトを fp8 + TE CPU + 512px + 20-50 steps で走らせ、VRAMピークとlossを確認する
- 有料APIは使わない ($0、GPU時間のみ)
