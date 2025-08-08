# Go + Next.js モノレポ

TurboRepo、Go (GORM)、Next.js (TypeScript, Page Router) を使用したモノレポ構成です。Docker Compose watch機能とホットリロードに対応しています。

## 技術スタック

### フロントエンド
- **Next.js 14** (Page Router)
- **TypeScript**  
- **React 18**

### バックエンド  
- **Go 1.21**
- **Gin** (Webフレームワーク)
- **GORM** (ORM)
- **PostgreSQL 16**

### 開発環境
- **TurboRepo** (モノレポ管理)
- **Docker & Docker Compose** (watch機能付き)
- **Air** (Goホットリロード)

## プロジェクト構成

```
go_startup/
├── apps/
│   ├── web/           # Next.js アプリケーション
│   └── api/           # Go API サーバー
├── packages/          # 共通パッケージ (将来の拡張用)
├── docker-compose.yml      # 本番用
├── docker-compose.dev.yml  # 開発用 (watch対応)
├── package.json       # ルートパッケージ
└── turbo.json         # TurboRepo設定
```

## 開発環境のセットアップ

### 必要な環境
- Node.js 20+
- Go 1.21+
- Docker & Docker Compose

### 1. 依存関係のインストール

```bash
# ルートディレクトリで実行
npm install

# Goの依存関係
cd apps/api
go mod tidy
```

### 2. Docker Compose Watch で開発開始

```bash
# ルートディレクトリで実行
npm run docker:dev

# または直接
docker compose -f docker-compose.dev.yml up --watch
```

これにより以下が起動します：
- Next.js: http://localhost:3000 (ホットリロード対応)
- Go API: http://localhost:8080 (Airによるホットリロード)
- PostgreSQL: localhost:5432

### 3. ローカル開発 (Docker なし)

```bash
# 全アプリケーションを同時起動
npm run dev

# または個別に起動
cd apps/web && npm run dev    # http://localhost:3000
cd apps/api && go run main.go # http://localhost:8080
```

## API エンドポイント

### ユーザー管理
- `GET /api/users` - 全ユーザー取得
- `GET /api/users/:id` - 指定ユーザー取得  
- `POST /api/users` - ユーザー作成
- `PUT /api/users/:id` - ユーザー更新
- `DELETE /api/users/:id` - ユーザー削除

### ヘルスチェック
- `GET /health` - サーバー状態確認

## Docker Compose Watch機能

開発環境では以下のファイル変更が自動的に反映されます：

### Next.js (web)
- `pages/` - 同期
- `styles/` - 同期  
- `public/` - 同期
- `package.json` - 再ビルド

### Go API (api)
- `.go` ファイル - 再起動
- `go.mod`, `go.sum` - 再ビルド

## 利用可能なコマンド

```bash
# 開発
npm run dev                    # 全アプリケーション開発サーバー起動
npm run docker:dev             # Docker Compose watch で開発

# ビルド
npm run build                  # 全アプリケーションビルド
npm run docker:build           # Dockerイメージビルド

# 本番
npm run docker:up              # 本番用Docker起動
npm run docker:down            # Docker停止

# その他
npm run lint                   # リント実行
npm run format                 # コードフォーマット
npm run clean                  # ビルド成果物削除
```

## 環境変数

### Go API (`apps/api/.env`)
```bash
PORT=8080
DB_TYPE=postgres
DATABASE_URL=postgres://postgres:password@localhost:5432/go_nextjs_db?sslmode=disable
GIN_MODE=debug
```

### Next.js
```bash
API_URL=http://localhost:8080  # APIサーバーURL
```

## データベース

PostgreSQL 16を使用します。初回起動時に：
1. テーブルが自動作成されます（GORM Auto Migration）
2. サンプルユーザーデータが投入されます

データベース接続情報：
- Host: localhost (Docker使用時は`db`)
- Port: 5432
- Database: go_nextjs_db
- User: postgres
- Password: password

## トラブルシューティング

### Docker Compose Watchが動作しない
- Docker Desktop最新版を使用してください
- `docker compose version` でv2.22+であることを確認

### ホットリロードが効かない
- ファイルが正しいディレクトリにあるか確認
- Dockerボリュームマウントが正しく設定されているか確認

### Goアプリケーションが起動しない
- `go mod tidy` を実行
- ポート8080が使用されていないか確認

## ライセンス

MIT