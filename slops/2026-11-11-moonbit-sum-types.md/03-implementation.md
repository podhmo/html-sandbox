# 実装の記録: dispatch は arm の中か外か

> [!NOTE]
> 執筆: Devin。[指針](#01-guidelinesmd)の末尾の表で「候補」とした2件を実装した記録。迷った置き方と、採用した側の理由、もう片方を選んだ場合の得と損を残す。

実装は2コミット。router はパターンの末尾の形を `Route.tail : Tail { Exact; End; Subtree; Rest(String) }` の1値に畳み、`Segment` は途中の位置に置ける `Literal`/`Wildcard` だけにした。`scan` は `Pending` を `Mode::Normal` の payload にして、スキャナの状態を `Scan { out, notes, mode }` の1値にした。どちらも振る舞いは変えていない。

迷ったのは `scan` 側の、dispatch（1行をブロック種別に振り分ける処理）の置き場所だった。`Pending` を `Normal` の payload にすると、`pending` は mode が `Normal` のときにしか存在しない。dispatch が触るのは `pending` だけなので、どこに書いても「ここでは mode は必ず Normal」という前提が要る。その前提を型に預けるか、実行時の検査で埋め合わせるかで、置き方が2つあった。

## arm の内側に置く（採用した方）

1行の処理全体を `Scan::step` の `match self.mode` 1つにし、dispatch を `Normal(pending)` の arm の中に書く。

- メリット: 「ここでは必ず Normal」が構造になるので、検査や到達しない `else` が1箇所も要らない。mode ごとの遷移が1つの match に収まり、コードの形が state machine になる
- デメリット: `Normal` の arm が dispatch の if 連鎖を丸ごと抱えて大きい。脚注を閉じる行を Normal 入力として見直すために、元の fall-through は `close()` して `step(line)` の再帰呼び出しに変わる（深さは1だが、再帰の形を取る）。遷移を関数にするために `Scan` 構造体を新設することにもなり、ループの骨格ごと変わるので差分は大きい

## arm の外側に置く（もう片方）

元の骨格のまま、mode の match で他のモードを `continue` で追い返し、dispatch をループ末尾に置く。`pending` は `guard mode is Normal(p)` で取り出す。

- メリット: ループの骨格がそのままなので差分が小さい。dispatch が上から下へ素直に読める。`Scan` のような状態 struct を持ち出さず、局所変数とクロージャのままで済む
- デメリット: `mode` の型は `Mode` のままなので、`guard` の else が要るが、その else には到達しない。`abort` を置くと不変条件が崩れたときにクラッシュし、`continue` を置くと行を静かに落とす。どちらにしても型に言えない制約を実行時の検査で埋め合わせる形になり、将来 mode の arm を増やして `continue` を忘れたときにだけ顔を出す

payload だけを触る処理はその variant の arm の内側に置く、という置き方がここで自然に決まったので、指針の「MoonBit で書くときの道具」にも1項足してある。

## 小さな判断

- `Code` の `info` は `StringView` のままにして `close` の中で `""` → `None` にする手もあったが、フェンスを開く時点で `String?` にした。変換はどちらに置いても1箇所だが、「`Code` の `info` は既に任意値」という方が payload の意味として読みやすかった
- `close` の `Normal` arm を `flush()` にしたおかげで、入力の終わりは `close()` を呼ぶだけで済んだ。「入力の終わりも1つの入力として扱う」（指針の state machine 4）と、「`Pending` を `Normal` の payload にする」（どの構造を 2）がちょうど重なった
- `rank` の末尾の種別順位は Int32 の順位比較として残った。variant 同士の優先順位は型ではなく値の問題なので、match 化はしたものの順位表そのものは残る
