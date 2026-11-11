# 実装の記録: dispatch は arm の中か外か

> [!NOTE]
> 執筆: Devin（SWE-2）。[指針](#01-guidelinesmd)の末尾の表で「候補」とした2件を実装した記録。片方（router）は素直に進んだが、もう片方（`scan`）で迷った置き方と、採用した側の理由、もう片方を選んだ場合の得と損を残す。

## 前提: どのコードのどの部分の話か

対象は `moonbit/pkg/tinymarkdown/tinymarkdown.mbt` の `scan`。Markdown の行を上から読んでブロック（`Flat`）にするスキャナで、状態は2つの enum を並べて持っていた。

- `Mode`: 今どの構造の中にいるか。`Normal`（通常の入力）、`Code`（``` フェンスの中）、`Details`（`<details>` の中）、`Footnote`（脚注定義の中）
- `Pending`: 溜めている途中のブロック。`Nothing`、または `Para`（段落）・`Items`（リスト項目）・`Quote`（引用）・`Table`（表）のどれか1つ

変更前のループはこういう骨格だった（細部は省略してある）。

```
let mut pending = Nothing
let mut mode = Normal
for raw in src.split("\n") {
  let line = ...
  match mode {
    Code(..)     => { ...; continue }
    Details(..)  => { ...; continue }
    Footnote(..) => {
      ...閉じる行なら notes.add(...); mode = Normal
      // continue しないので、この行は下の dispatch にも届く
    }
    Normal => ()
  }
  // dispatch: Normal の行をブロック種別に振り分ける
  if        "```"で始まる { flush(); mode = Code }
  else if   空行          { flush() }
  else if   見出し        { flush(); out.push(...) }
  else if   "|" で始まる  { match pending { Table(lines) => lines.push(..); _ => { flush(); pending = Table(..) } } }
  else if   ">" で始まる  { ...同じ形で Quote... }
  else if   リスト項目    { ...同じ形で Items... }
  else if   "<details>"   { flush(); mode = Details }
  else if   字下げ        { ...直前の項目の続き... }
  else                    { ...同じ形で Para... }
}
```

`scan` が `Normal` 以外のモードに入る前には必ず `flush()` が走るので、`pending` が中身を持つのは `mode == Normal` のときだけ、という不変条件を実行を読んで初めて確認できる形だった。これを指針の「どの構造を」2 に従って `Mode::Normal(Pending)` に畳んだ。

畳むと `pending` は `mode` が `Normal` のときにしか存在しない。だから dispatch —— 上の骨格で `mode` の match の後に続いていた、`pending` を読み書きする if 連鎖 —— をどこに書くかが問題になる。dispatch が触るのは `pending` だけなので、どの置き方を選んでも「ここでは mode は必ず Normal」という前提が要る。その前提を型に預けるか、実行時の検査で埋め合わせるかで、置き方が2つあった。

## arm の内側に置く（採用した方）

1行の処理全体を `Scan::step` の `match self.mode` 1つにし、dispatch を `Normal(pending)` の arm の中に書く。スキャナの状態は `Scan { out, notes, mut mode }` の1値に集めた。

```
fn Scan::step(self : Scan, line : StringView) -> Unit {
  let trimmed = trim_space(line)
  match self.mode {
    Code(..)     => ...
    Details(..)  => ...
    Footnote(..) => {
      ...閉じる行なら: self.close(); self.step(line)  // Normal で見直す
    }
    Normal(pending) => {
      if        "```"で始まる { ... }
      else if   "|" で始まる  { match pending { Table(lines) => ..; _ => .. } }
      ...                     // dispatch はこの arm の中
    }
  }
}
```

- メリット: 「ここでは必ず Normal」が構造になるので、検査や到達しない `else` が1箇所も要らない。mode ごとの遷移が1つの match に収まり、コードの形が state machine になる
- デメリット: `Normal` の arm が dispatch の if 連鎖を丸ごと抱えて大きい。脚注を閉じる行を Normal 入力として見直すために、元の fall-through は `close()` して `step(line)` の再帰呼び出しに変わる（深さは1だが、再帰の形を取る）。遷移を関数にするために `Scan` 構造体を新設することにもなり、ループの骨格ごと変わるので差分は大きい

## arm の外側に置く（もう片方）

元の骨格のまま、mode の match で他のモードを `continue` で追い返し、dispatch をループ末尾に置く。`pending` は `guard mode is Normal(p)` で取り出す。

```
for raw in src.split("\n") {
  let line = ...
  match mode {
    Code(..)     => { ...; continue }
    Details(..)  => { ...; continue }
    Footnote(..) => { ...mode = Normal(Nothing); fall through... }
    Normal(_) => ()
  }
  guard mode is Normal(pending) else { ??? }  // ここでしか payload が取れない
  // dispatch はこの下（変更なし）
}
```

- メリット: ループの骨格がそのままなので差分が小さい。dispatch が上から下へ素直に読める。`Scan` のような状態 struct を持ち出さず、局所変数とクロージャのままで済む
- デメリット: `mode` の型は `Mode` のままなので、`guard` の else が要るが、その else には到達しない。`abort` を置くと不変条件が崩れたときにクラッシュし、`continue` を置くと行を静かに落とす。どちらにしても型に言えない制約を実行時の検査で埋め合わせる形になり、将来 mode の arm を増やして `continue` を忘れたときにだけ顔を出す

payload だけを触る処理はその variant の arm の内側に置く、という置き方がここで自然に決まったので、指針の「MoonBit で書くときの道具」にも1項足してある。

## 小さな判断

- `Code` の `info` は `StringView` のままにして `close` の中で `""` → `None` にする手もあったが、フェンスを開く時点で `String?` にした。変換はどちらに置いても1箇所だが、「`Code` の `info` は既に任意値」という方が payload の意味として読みやすかった
- `close` の `Normal` arm を `flush()` にしたおかげで、入力の終わりは `close()` を呼ぶだけで済んだ。「入力の終わりも1つの入力として扱う」（指針の state machine 4）と、「`Pending` を `Normal` の payload にする」（どの構造を 2）がちょうど重なった
- `rank` の末尾の種別順位は Int32 の順位比較として残った。variant 同士の優先順位は型ではなく値の問題なので、match 化はしたものの順位表そのものは残る
