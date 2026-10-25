# 【記事1】WSL上のUbuntuを隔離環境としてopencodeを使う（非開発者向け手順）

Windowsだけで生活している方が、**AIを使うときだけWSLを起動し、安全に対話・試行錯誤させるための手順書**です。Linuxコマンドは `cd` / `ls` / `pwd` 程度が分かれば進められます。

※ 本手順は **Windows 11（バージョン 22H2 以降）** を対象としています。

---

### はじめに：Windows環境でAIを直接インストールする危険性について

Windows環境に直接AIツールをインストールすると、システムの重要なファイルや設定にアクセスできる可能性があり、意図しない変更やセキュリティリスクが生じることがあります。特に、AIが外部との通信を行う場合、個人情報や機密データが漏洩するリスクも考慮する必要があります。本手順では、WSL（Windows Subsystem for Linux）を利用して、AIの実行環境をWindows本体から分離し、より安全に利用する方法を説明します。



### 1. [WSL](https://learn.microsoft.com/ja-jp/windows/wsl/)のインストールと更新
Windows側のシステムや設定を触らせないための「別の環境（[Ubuntu](https://ubuntu.com/wsl)）」を用意します。

1. スタートメニューを右クリックし、「ターミナル（管理者）」または「PowerShell（管理者）」を開きます。
2. 以下を実行します（公式手順：[WSL のインストール](https://learn.microsoft.com/ja-jp/windows/wsl/install)）。
   ```powershell
   wsl --install
   ```
3. 処理が終わったら、**一度Windowsを再起動**します。
4. 再起動後、もう一度PowerShellを開き、WSLを更新します（[WSL の基本コマンド](https://learn.microsoft.com/ja-jp/windows/wsl/basic-commands)）。
   ```powershell
   wsl --update
   wsl --version
   ```
   * **期待する結果**: 「WSL バージョン」に **3.x.x**（または 2.3.24 以降）と表示されれば完了です。

#### 1-2. Ubuntuディストリビューションのインストール
`wsl --install` を実行しただけでは、Ubuntuがまだ入っていない場合があります。以下の手順でUbuntuを明示的にインストールします。

1. PowerShellを開き、インストール可能なディストリビューションの一覧を確認します（[WSL の基本コマンド](https://learn.microsoft.com/ja-jp/windows/wsl/basic-commands)）。
   ```powershell
   wsl --list --online
   ```
   * `Ubuntu` または `Ubuntu-24.04` などが一覧に表示されることを確認します。
2. Ubuntuをインストールします。
   ```powershell
   wsl --install -d Ubuntu
   ```
   * すでに `wsl --install` でUbuntuが導入済みの場合は「指定されたディストリビューションは既にインストールされています」と表示されます。その場合はこのステップを飛ばして構いません。
3. インストールが完了したら、Ubuntuが正しく登録されたか確認します。
   ```powershell
   wsl --list --verbose
   ```
   * **期待する結果**: `Ubuntu` が表示され、STATEが `Stopped` または `Running`、VERSIONが `2` になっていれば成功です。

> **Microsoft Storeからのインストールについて**: 上記のコマンドが何らかの理由で失敗する場合は、Microsoft Storeで「Ubuntu」を検索してインストールすることもできます。ただし、コマンドでの導入のほうがWSLとの整合性が取りやすく、非開発者でも手順を再現しやすいため、本手順ではコマンドを推奨しています。

#### 1-3. WSLの更新
再起動後、もう一度PowerShellを開き、WSLを最新版に更新します。
```powershell
wsl --update
wsl --version
```
* **期待する結果**: 「WSL バージョン」に **3.x.x**（または 2.3.24 以降）と表示されれば完了です。

#### 1-4. Ubuntuの初回起動とユーザー設定
1. スタートメニューから **Ubuntu** を起動するか、PowerShellで以下を実行します。
   ```powershell
   wsl -d Ubuntu
   ```
2. 初回起動時のみ、Unixユーザー名とパスワードの設定を求められます。
   * ユーザー名は半角英小文字で任意の名前（例：`user`）を入力します。
   * パスワード入力中は画面に何も表示されませんが、キー入力は反映されています。そのまま入力してEnterを押してください。
3. 設定が完了すると、Ubuntuのシェル（`$` または `#` プロンプト）が表示されます。

### 2. Windows側の設定（[WSL Settings](https://note.com/ryobeam/n/n9f5b9ad39ab7) で設定）
WSL内で動かしたWebサイトをWindowsのブラウザから直接開けるようにします。

1. スタートメニューの検索欄に **`WSL Settings`**（または「Linux 用 Windows サブシステム設定」）と入力してアプリを開きます。
2. 左側の **「ネットワーク」** タブを開き、**「ネットワーク モード」** を **「Mirrored」** に変更します（[`networkingMode=mirrored` の公式説明](https://learn.microsoft.com/ja-jp/windows/wsl/wsl-config#networking-settings)）。
3. 設定は自動保存されるので、そのままウィンドウを閉じます。



### 3. [Windows Terminal](https://apps.microsoft.com/detail/9n0dx20hk701)のインストール
PowerShell標準の黒い画面では、Ubuntuを動かしたときにTABキーによる文字補完がうまく働かず、タイポが多発します。作業用の専用画面を用意します。

1. スタートメニューから **Microsoft Store** を開きます。
2. 検索欄に「Windows Terminal」と入力してインストールします（すでに入っていればそのままでOKです）。
3. Windows Terminalを起動し、タブバーの「∨」マークから「設定」を開きます。
4. 「スタートアップ」項目にある「既定のプロファイル」を **Ubuntu** にして右下の「保存」を押します。
   * **期待する結果**: 次回からアプリを開くだけで、自動的にUbuntuの操作画面が立ち上がります。

### 4. Ubuntuの基本設定と [micro](https://micro-editor.github.io/) エディタの導入
Ubuntuの基本ソフトを更新し、直感的に使えるメモ帳のようなエディタを入れます。

1. Windows TerminalでUbuntuを起動します。
2. まずシステムを最新化します。
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
3. エディタ（[`micro`](https://github.com/micro-editor/micro)）をインストールします。
   ```bash
   sudo apt install -y micro
   ```
   * **エディタの操作方法**: 保存は **`Ctrl + S`**、終了は **`Ctrl + Q`** です。これだけ覚えておけば問題ありません。
4. Pythonが入っていることを確認します。
   ```bash
   python3 --version
   ```
   * **期待する結果**: `Python 3.x.x` と出ればOKです（入っていなければ `sudo apt install -y python3`）。


### 5. Ubuntu側の隔離設定（microで編集）
AIがWindowsのCドライブの中身を勝手に覗いたり、Windowsのプログラムを実行できないように壁を作ります。

1. Ubuntuの画面で、先ほど入れたエディタを使って設定ファイルを開きます。
   ```bash
   sudo micro /etc/wsl.conf
   ```
2. 画面が開いたら、以下の内容をそのまま入力（または貼り付け）します。
   ```ini
   [automount]
   enabled = false

   [interop]
   enabled = false
   appendWindowsPath = false
   ```
3. 入力したら、**`Ctrl + S`（保存）** を押し、続いて **`Ctrl + Q`（終了）** を押してエディタを閉じます。

#### 設定の反映と確認
設定を反映させるため、PowerShellを開いてWSLを完全に停止させます（[`wsl --shutdown` の公式説明](https://learn.microsoft.com/ja-jp/windows/wsl/basic-commands#shut-down-wsl)）。
```powershell
wsl --shutdown
```

再びWindows TerminalでUbuntuを開き、壁が機能しているかテストします。
1. WindowsのCドライブが見えないか確認：
   ```bash
   ls /mnt/c
   ```
   * **期待する結果**: `No such file or directory` など**エラーになれば成功**です（WindowsのファイルがAIから見えなくなりました）。
2. Windowsのコマンドが動かないか確認：
   ```bash
   cmd.exe
   ```
   * **期待する結果**: `WSL Interoperability is disabled` や `command not found` など、**何らかのエラーになれば成功**です（AIからWindowsのプログラムを直接操作できなくなりました）。



### 6. [herdr](https://herdr.dev)のインストール（任意）
ターミナルの画面内にいくつも窓が開いて迷子になるのを防ぐツールです（[GitHub リポジトリ](https://github.com/Delphoa/herdr)）。Windows Terminalのタブ切り替えだけで十分ならスキップして構いません。
```bash
curl -fsSL https://herdr.dev/install.sh | sh
source ~/.bashrc
```
* ※もし `herdr` と打っても見つからない場合は、ターミナルを一度閉じて開き直してください。



### 7. [opencode](https://opencode.ai)のインストール
AI作業用のツール「opencode」を導入します（[ダウンロードページ](https://opencode.ai/download) / [GitHub リポジトリ](https://github.com/anomalyco/opencode)）。
```bash
curl -fsSL https://opencode.ai/install | bash
source ~/.bashrc
opencode --version
```
* **期待する結果**: バージョンが表示されればインストール完了です（見つからない場合はターミナルを開き直してください）。



### 8. opencodeの起動、モデル選択、最初の対話
ホストから隔離された安全な作業用フォルダを作って、そこでAIを立ち上げます。

```bash
mkdir -p ~/work
cd ~/work
opencode
```

1. **モデルの選択**:
   画面下部に `/models` と入力します。利用可能なモデル一覧が表示されるので、その中から **「free」や「無料」と表示されているモデル（DeepSeek系、GLM系、Qwen系など）** を選んでください。
   ※無料で使えるモデル名は時期によって入れ替わるため、その時点で一覧に出ている無料モデルを選べば大丈夫です。
2. **最初の対話（疎通確認）**:
   モデルを選んだら、そのままの画面でAIに適当な質問を投げてみます。
   > 「[Git](https://git-scm.com/)と[GitHub](https://github.com/)の違いを、非開発者向けにわかりやすく300字程度で教えて」
   * **期待する結果**: AIから回答が返ってくれば、対話環境が正常に動いています。



### 9. ブラウザから使えるようにする（opencode pair）
端末の黒い画面ではなく、普段使い慣れているブラウザからAIとやり取りできるようにします。

Ubuntuのターミナルで以下を実行します（先ほどのopencode画面を `Ctrl + C` 等で抜けるか、別タブを開いて実行します）。
```bash
cd ~/work
opencode pair
```
* **期待する結果**: 画面にローカル接続用の **URL（ワンタイムリンク）** が表示されます。
* 表示されたURL（`http://localhost:...`）をコピーし、**Windows側のブラウザ（EdgeやChrome）** のアドレスバーに貼り付けて開きます。
* ブラウザ上にopencodeの画面が表示されれば成功です。

> **会話の引き継ぎについて**:
> `opencode pair` でブラウザを開いた際、端末側で行っていたさきほどの会話が引き継がれていない場合があります。その場合は、ブラウザ側のチャット欄でもう一度同じ依頼を入力すれば問題ありません。



### 10. レポート作成とブラウザでの閲覧
ブラウザに開いたopencodeのチャット欄を使って、作業を依頼します。

#### 10-1. HTMLレポートの作成依頼
> 「さきほど説明してくれたGitとGitHubの違いを、見やすいHTMLレポートにしてください。ファイル名は report.html にして、カレントディレクトリに保存してください」
* AIが「ファイルを作成してよいか」許可を求めてきたら承認（Allow）します。

#### 10-2. サーバー起動の依頼
> 「あなたはいまWSL上のUbuntu（mirroredネットワーク）で動いています。作成した report.html を私がWindowsのブラウザから閲覧できるように、HTTPサーバーをバックグラウンドで起動してください。起動したらアクセス用のURLを教えてください」
* AIがコマンド実行の許可を求めてきたら承認（Allow）します。
* **期待する結果**: AIが「サーバーを起動しました。`http://localhost:8000/report.html` を開いてください」といった案内を返してきます。
* ※Pythonの標準サーバー（[`http.server`](https://docs.python.org/ja/3/library/http.server.html)）を使うケースが一般的です。

#### 10-3. ブラウザで確認
案内されたURLをWindowsのブラウザの新しいタブで開きます。
* **期待する結果**: AIが作成したHTMLレポートがブラウザ上に表示されます。

確認が終わったら、チャット欄で「さきほど立てたHTTPサーバーを停止してください」と伝えて後片付けをさせます。



### 11. 注意点（セキュリティについて）

* **隔離は「完全」ではない**
  今回行った設定で、AIが勝手にWindowsのファイル（Cドライブ）を読んだりプログラムを起動したりすることは防げます。
  しかし、ネットワークを直通（mirrored）にしているため、**Windows側で動いている何らかのローカルサーバー（開発中のアプリや管理ツールなど）に、WSL内のAIから通信が届いてしまう可能性**があります。
  もしWindows側で秘密のWebサービスや社内システムなどをローカル起動している場合は、それにaiがアクセスできてしまいます。
