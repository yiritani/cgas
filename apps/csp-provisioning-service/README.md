# CSP Provisioning Service

CSP（Cloud Service Provider）プロビジョニングサービスは、Firestoreをデータベースとして使用するマイクロサービスです。

## 機能

- CSPアカウント作成申請の管理
- 申請の承認・却下フロー
- プロジェクトベースのアクセス制御
- Firestoreを使用したデータ永続化

## 技術スタック

- **言語**: Go 1.21
- **フレームワーク**: Gin
- **データベース**: Google Cloud Firestore
- **認証**: JWT
- **開発環境**: Docker + Firestore Emulator

## 開発環境セットアップ

### 前提条件

- Go 1.21+
- Docker & Docker Compose
- Node.js（Firebase CLI用）

### 1. 依存関係のインストール

```bash
# Go依存関係
go mod download

# Firebase CLI（グローバル）
npm install -g firebase-tools
```

### 2. 環境変数の設定

開発環境では以下の環境変数が自動で設定されます：

```bash
FIREBASE_PROJECT_ID=cgas-dev
FIRESTORE_EMULATOR_HOST=localhost:8082
PORT=8081
MAIN_API_URL=http://localhost:8080
JWT_SECRET=dev-jwt-secret
```

### 3. 開発サーバーの起動

#### 方法1: Makefileを使用（推奨）

```bash
# Firestoreエミュレーターとサービスを同時に起動
make dev-setup

# または別々に起動
make emulator-start  # Firestoreエミュレーター開始
make dev            # サービス開始（別ターミナル）
```

#### 方法2: 手動で起動

```bash
# Firestoreエミュレーター開始
firebase emulators:start --only firestore --project cgas-dev

# サービス開始（別ターミナル）
go run ./cmd/server
```

#### 方法3: Dockerを使用

```bash
# プロジェクトルートで実行
docker-compose -f docker-compose.dev.yml up csp-provisioning
```

### 4. 動作確認

```bash
# ヘルスチェック
curl http://localhost:8081/health

# Firebase UI（Firestoreエミュレーター）
open http://localhost:4000
```

## API エンドポイント

### 認証が必要なエンドポイント

| Method | Path                    | Description     |
| ------ | ----------------------- | --------------- |
| GET    | `/api/csp-requests`     | CSP申請一覧取得 |
| GET    | `/api/csp-requests/:id` | CSP申請詳細取得 |
| POST   | `/api/csp-requests`     | CSP申請作成     |
| PUT    | `/api/csp-requests/:id` | CSP申請更新     |
| DELETE | `/api/csp-requests/:id` | CSP申請削除     |

### 管理者のみアクセス可能

| Method | Path                           | Description                     |
| ------ | ------------------------------ | ------------------------------- |
| PUT    | `/api/csp-requests/:id/review` | CSP申請のレビュー（承認・却下） |

## Firestoreデータ構造

### csp_requests コレクション

```json
{
  "id": "string (document ID)",
  "project_id": "number",
  "user_id": "number",
  "provider": "string (aws|gcp|azure)",
  "account_name": "string",
  "reason": "string",
  "status": "string (pending|approved|rejected)",
  "reviewed_by": "number (optional)",
  "reviewed_at": "timestamp (optional)",
  "reject_reason": "string (optional)",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

## 本番環境デプロイ

### 1. Firebase プロジェクトの設定

```bash
# Firebase プロジェクト作成
firebase projects:create cgas-prod

# Firestore有効化
firebase firestore:deploy --project cgas-prod
```

### 2. サービスアカウントの作成

1. Google Cloud Consoleでサービスアカウントを作成
2. Firestore権限を付与
3. JSONキーファイルをダウンロード
4. `firebase-credentials/firebase-service-account.json` として配置

### 3. 環境変数の設定

```bash
export FIREBASE_PROJECT_ID=cgas-prod
export FIREBASE_CREDENTIALS_PATH=./firebase-credentials
export JWT_SECRET=your-production-secret
```

### 4. デプロイ

```bash
docker-compose up -d csp-provisioning
```

## 開発用コマンド

```bash
# ビルド
make build

# テスト実行
make test

# 依存関係更新
make deps

# Firestoreエミュレーター停止
make emulator-stop

# クリーンアップ
make clean

# ヘルプ表示
make help
```

## トラブルシューティング

### Firestoreエミュレーターが起動しない

```bash
# Firebase CLIを再インストール
npm uninstall -g firebase-tools
npm install -g firebase-tools

# Javaがインストールされているか確認
java -version
```

### 接続エラーが発生する

```bash
# 環境変数を確認
echo $FIRESTORE_EMULATOR_HOST

# ポートが使用されているか確認
lsof -i :8082
```

## ログレベル

開発環境: `GIN_MODE=debug`  
本番環境: `GIN_MODE=release`

## セキュリティ

- JWTトークンによる認証
- プロジェクトベースのアクセス制御
- Firestoreセキュリティルールによるデータ保護

## ライセンス

MIT License
