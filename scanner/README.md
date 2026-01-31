# FeliCa Scanner

FeliCa カード（学生証）を読み取り、REST API に送信するスキャナー

## クイックスタート

```powershell
# 1. ファイルを配置
scanner/
├── felica_felicalib.exe
├── felicalib.dll
└── paypay.mp3

# 2. RC-S320 を USB 接続

# 3. 実行
.\felica_felicalib.exe
```

## 必要なもの

| 種類 | 名前 | 備考 |
|------|------|------|
| ハードウェア | Sony RC-S320 | FeliCa リーダー |
| OS | Windows 10/11 (64-bit) | |
| ファイル | `felicalib.dll` | Sony 32-bit ライブラリ |
| ファイル | `paypay.mp3` | 効果音（任意） |

## セットアップ

### 1. ドライバインストール

[Sony RC-S320 ドライバ (Archive)](https://web.archive.org/web/20220123011926/https://www.sony.co.jp/Products/felica/consumer/support/download/old2_felicaportsoftware.html) をダウンロード・インストール

### 2. felicalib.dll を取得

ドライバインストール後、以下の場所からコピー:

| Windows | パス |
|---------|------|
| 64-bit | `C:\Windows\SysWOW64\felicalib.dll` |
| 32-bit | `C:\Windows\System32\felicalib.dll` |

### 3. ファイル配置

```
scanner/
├── felica_felicalib.exe  ← 実行ファイル
├── felicalib.dll         ← コピーした DLL
└── paypay.mp3            ← 効果音
```

## 実行方法

### バイナリ実行（推奨）

```powershell
cd C:\path\to\scanner
.\felica_felicalib.exe
```

### ソースからビルド

```powershell
# Rust インストール後
rustup target add i686-pc-windows-msvc

cd scanner/scanner_rust
cargo build --release --target i686-pc-windows-msvc

# 実行
cargo run --release --target i686-pc-windows-msvc
```

> **Note:** `felicalib.dll` が 32-bit のため、32-bit ターゲット必須

## 動作

```
┌─────────────┐    ┌──────────┐    ┌─────────┐    ┌─────────┐
│ カードタッチ │ -> │ 効果音再生 │ -> │ IDm取得  │ -> │ API送信  │
└─────────────┘    └──────────┘    └─────────┘    └─────────┘
                                                       │
                                                  2秒クールダウン
```

### 出力例

```
Ready．タッチしてね．
IDm=011303006B223D04 USB_Port=1
POST OK: 200
```

## API

### POST `/api/scan`

カード読み取り時に自動送信

**リクエスト:**

```json
{
  "idm": "011303006B223D04",
  "usb_port": 1
}
```

| フィールド | 型 | 説明 |
|-----------|------|------|
| `idm` | string | FeliCa IDm (16桁HEX) |
| `usb_port` | number \| null | USB ポート番号 |

**エンドポイント設定:** `src/main.rs` の `API_URL` を編集

```rust
const API_URL: &str = "http://127.0.0.1:3658/m1/1081275-1070247-default/api/scan";
```

## 開発者向け

### ビルド

```powershell
cd scanner/scanner_rust
cargo build --release --target i686-pc-windows-msvc
```

成果物: `target/i686-pc-windows-msvc/release/felica_felicalib.exe`

### 実行

```powershell
# cargo 経由
cargo run --release --target i686-pc-windows-msvc

# 直接実行
.\target\i686-pc-windows-msvc\release\felica_felicalib.exe
```

### CI/CD (GitHub Actions)

| ステップ | コマンド |
|---------|---------|
| Format | `cargo fmt --check` |
| Lint | `cargo clippy` |
| Build (32-bit) | `i686-pc-windows-msvc` |
| Build (64-bit) | `x86_64-pc-windows-msvc` |

**トリガー:** `main` / `scanner` ブランチへの push、`main` への PR
