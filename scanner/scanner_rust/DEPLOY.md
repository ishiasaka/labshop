# FeliCa Scanner デプロイ手順 (Ubuntu)

macOSではDocker経由のUSBパススルーが不可能なため、Ubuntu実機でデプロイする。

ワークフロー: mac (git push) → Ubuntu (git pull → docker compose up)

## 前提条件

- Ubuntu 22.04+
- Docker & Docker Compose
- git
- USB接続のFeliCaリーダー (RC-S300 / RC-S320)

## 1. pn533カーネルモジュールのブラックリスト設定

RC-S320を使用する場合、`pn533`モジュールがUSBデバイスを先に掴むのを防ぐ必要がある。

```bash
sudo tee /etc/modprobe.d/blacklist-pn533.conf <<EOF
blacklist pn533
blacklist pn533_usb
EOF
sudo modprobe -r pn533_usb pn533 2>/dev/null || true
```

再起動後も永続する。RC-S300のみの場合はこの手順は不要。

## 2. リポジトリの取得と起動

```bash
git clone <repository-url>
cd labshop/scanner/scanner_rust

# API_URLを指定して起動（デフォルト: http://localhost:8000/api/scan）
docker compose up --build

# バックグラウンド起動
docker compose up --build -d
```

APIサーバーが別のホストにある場合:

```bash
API_URL=http://192.168.1.100:8000/api/scan docker compose up --build
```

## 3. USBデバイスの確認

```bash
# ホスト側でリーダーが認識されているか確認
lsusb | grep -i sony
# RC-S300: 054c:0dc9
# RC-S320: 054c:01bb
```

## 4. 更新時の手順

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
# 表示される場合は「1. pn533カーネルモジュールのブラックリスト設定」を実施
```

### コンテナログの確認

```bash
docker compose logs -f
```
