# FeliCa Scanner デプロイ手順 (Ubuntu)

macOSではDocker経由のUSBパススルーが不可能なため、Ubuntu実機でデプロイする。

ワークフロー: mac (git push) → Ubuntu (git pull → docker compose up)

## 対応OS

| OS | 対応 | 備考 |
|----|------|------|
| Ubuntu 22.04+ | Yes | Docker経由で実行 |
| macOS | No | Docker USBパススルー不可 |
| Windows | No | 別バイナリ (`felica_felicalib.exe`) を使用 |

## 対応リーダー

| モデル | USB ID | バックエンド |
|--------|--------|-------------|
| RC-S300 | `054c:0dc9` | PC/SC (`pcscd`) |
| RC-S320 | `054c:01bb` | libpafe (`libpafe.so`) |
| RC-S330 | `054c:02e1` | 検出のみ |

## 前提条件

- Ubuntu 22.04+
- Docker & Docker Compose
- git
- USB接続のFeliCaリーダー (RC-S300 / RC-S320)

## 実行方法

### Step 1: USBデバイスの確認

```bash
# リーダーがホスト側で認識されているか確認
lsusb | grep -i sony
# RC-S300: 054c:0dc9
# RC-S320: 054c:01bb
```

### Step 2: pn533カーネルモジュールのブラックリスト設定（RC-S320使用時のみ）

RC-S320を使用する場合、`pn533`モジュールがUSBデバイスを先に掴むのを防ぐ必要がある。
RC-S300のみの場合はこの手順は不要。

```bash
sudo tee /etc/modprobe.d/blacklist-pn533.conf <<EOF
blacklist pn533
blacklist pn533_usb
EOF
sudo modprobe -r pn533_usb pn533 2>/dev/null || true
```

再起動後も永続する。

### Step 3: リポジトリの取得

```bash
git clone git@github.com:ishiasaka/labshop.git
cd labshop/scanner/scanner_rust
```

### Step 4: Docker Composeで起動

```bash
# ビルド＆起動（フォアグラウンド）
docker compose up --build

# バックグラウンド起動
docker compose up --build -d
```

APIサーバーが別のホストにある場合:

```bash
API_URL=http://192.168.1.100:8000/api/scan docker compose up --build
```

### Step 5: 動作確認

```bash
# コンテナログを確認
docker compose logs -f
```

正常に起動すると以下のように表示される:

```
=== FeliCa Multi-Reader Scanner (Linux/Docker) ===
API_URL: http://localhost:8000/api/scan
[INFO] Found RC-S300 at USB port 1-1.3.3
[INFO] Found RC-S320 at USB port 1-1.1
[RC-S300/PCSC] Starting backend...
[RC-S320/libpafe] Starting backend...
[RC-S320/libpafe] Ready. Waiting for card touch...
```

カードをタッチすると:

```
[RC-S300/PCSC] IDm=011303006B223D04 USB_Port=1-1.3.3
POST OK: 200
```

### 停止

```bash
# フォアグラウンドの場合: Ctrl+C
# バックグラウンドの場合:
docker compose down
```

## 更新時の手順

```bash
cd labshop/scanner/scanner_rust
git pull
docker compose up --build -d
```

## トラブルシューティング

### USBデバイスがコンテナから見えない

- `lsusb` でホスト側にデバイスが見えるか確認
- `docker compose up` を `--privileged` 付きで起動しているか確認（docker-compose.ymlで設定済み）
- USBケーブルを抜き差しして再試行

### RC-S300が検出されない (pcscd関連)

```bash
# コンテナ内でpcscdの状態を確認
docker compose exec felica-scanner ps aux | grep pcscd

# コンテナを再起動
docker compose restart
```

### RC-S320が検出されない (libpafe関連)

```bash
# pn533モジュールがロードされていないか確認
lsmod | grep pn533
# 表示される場合は「Step 2: pn533カーネルモジュールのブラックリスト設定」を実施
```

### API接続エラー (`Connection refused`)

スキャナーは `API_URL` (デフォルト: `http://localhost:8000/api/scan`) にPOSTリクエストを送信する。
APIサーバーが起動していない場合、以下のエラーが表示される:

```
[POST] Error for 011303006B223D04: Connection Failed: Connect error: Connection refused (os error 111)
```

APIサーバーを起動してから再試行すること。

### コンテナログの確認

```bash
docker compose logs -f
```
