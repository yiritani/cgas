# Docker Compose 使用方法

## 🐳 Docker Compose ファイル構成

### システム要件
- **Node.js**: 22.x以上
- **npm**: 10.x以上
- **Docker**: 20.x以上
- **Docker Compose**: 2.x以上

### `docker-compose.yml` (本番用)
- 最適化されたDockerfileを使用
- 環境変数は外部から設定
- restart: unless-stoppedでサービス自動復旧
- ボリュームマウントなし（セキュリティ向上）

### `docker-compose.dev.yml` (開発用)
- 開発用Dockerfileを使用
- ホットリロード対応
- develop.watch機能
- デバッグモード有効

## 🚀 使用方法

### 開発環境
```bash
# 開発環境で起動
docker-compose -f docker-compose.dev.yml up

# バックグラウンドで起動
docker-compose -f docker-compose.dev.yml up -d

# 特定のサービスのみ起動
docker-compose -f docker-compose.dev.yml up web_admin

# ログ確認
docker-compose -f docker-compose.dev.yml logs -f web_admin
```

### 本番環境
```bash
# 本番環境で起動
docker-compose up -d

# ビルドし直して起動
docker-compose up --build -d
```

## 🌐 アクセスURL

- **ユーザーサイト**: http://localhost:3000
- **管理サイト**: http://localhost:3001  
- **API**: http://localhost:8080
- **PostgreSQL**: localhost:5432

## ⚙️ 環境変数設定

`.env`ファイルを作成して以下の環境変数を設定：

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080

# Database Configuration  
DATABASE_URL=postgres://postgres:password@db:5432/go_nextjs_db?sslmode=disable
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=go_nextjs_db

# Security
JWT_SECRET=your-secret-key-change-this-in-production
```

## 🔧 開発コマンド

```bash
# 開発環境の起動
make dev

# 特定サービスの再起動
docker-compose -f docker-compose.dev.yml restart web_admin

# コンテナに入る
docker-compose -f docker-compose.dev.yml exec web_admin sh

# データベースリセット
docker-compose -f docker-compose.dev.yml exec api go run cmd/migrate/main.go -reset
```

## 📝 注意事項

- 開発環境では`docker-compose.dev.yml`を使用
- 本番環境では`docker-compose.yml`を使用
- 環境変数は必要に応じて設定
- 初回起動時はデータベースマイグレーションが必要