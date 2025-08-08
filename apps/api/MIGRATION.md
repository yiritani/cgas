# Database Migration Guide

## 概要

このプロジェクトでは、外部から実行可能な独立したマイグレーションコマンドを提供しています。アプリケーションの起動時に自動実行されることはありません。

## 構造変更

✅ **Before**: アプリケーション起動時に自動マイグレーション  
✅ **After**: 外部コマンドによる手動マイグレーション

### ファイル構成

```
cmd/
├── api/main.go          # APIサーバー（マイグレーション処理なし）
└── migrate/main.go      # マイグレーション専用コマンド

internal/database/
├── database.go          # データベース接続のみ
└── migration.go         # マイグレーション処理
```

## 使用方法

### 1. 基本コマンド

```bash
# ヘルプを表示
go run cmd/migrate/main.go -help

# マイグレーション実行
go run cmd/migrate/main.go -migrate

# 初期データ投入
go run cmd/migrate/main.go -seed

# データベースリセット（削除→マイグレーション→シード）
go run cmd/migrate/main.go -reset

# 全テーブル削除（危険！）
go run cmd/migrate/main.go -drop
```

### 2. Makeコマンド（推奨）

```bash
# ヘルプを表示
make help

# ローカル実行
make migrate    # マイグレーション
make seed       # シード
make reset      # リセット

# Docker内で実行
make docker-migrate    # Docker内でマイグレーション
make docker-seed       # Docker内でシード
make docker-reset      # Docker内でリセット
```

### 3. Docker環境での使用

```bash
# Docker内でマイグレーション実行
docker exec -it api-1 go run cmd/migrate/main.go -migrate

# または Makeコマンドを使用
make docker-migrate
```

## マイグレーション機能

### 利用可能なコマンド

| コマンド | 説明 | 危険度 |
|---------|------|--------|
| `-migrate` | テーブル作成・更新 | 🟢 安全 |
| `-seed` | 初期データ投入 | 🟡 注意 |
| `-reset` | 完全リセット | 🔴 危険 |
| `-drop` | 全テーブル削除 | 🔴 危険 |

### 初期データ

シードコマンドで以下のテストユーザーが作成されます：

- **管理者**: `admin@example.com` / `admin123`
- **テストユーザー1**: `yamada@example.com` / `user123`
- **テストユーザー2**: `sato@example.com` / `user123`

## 開発ワークフロー

### 新しい環境のセットアップ

```bash
# 1. データベース接続確認
make check-db

# 2. マイグレーション実行
make migrate

# 3. 初期データ投入
make seed
```

### 開発中のリセット

```bash
# 開発データベースを完全リセット
make dev-reset
```

### 本番環境

```bash
# 本番環境では慎重にマイグレーションのみ実行
go run cmd/migrate/main.go -migrate
```

## 環境変数

```bash
DATABASE_URL="host=localhost user=postgres password=password dbname=go_nextjs_db port=5432 sslmode=disable TimeZone=Asia/Tokyo"
```

## 注意事項

⚠️ **重要**: 本番環境では以下に注意してください：

1. 必ずバックアップを取ってからマイグレーションを実行
2. `-drop` や `-reset` コマンドは使用しない
3. マイグレーション前にアプリケーションを停止
4. マイグレーション後にアプリケーションを再起動

## トラブルシューティング

### よくある問題

1. **データベース接続エラー**
   ```bash
   # 接続設定を確認
   make check-db
   ```

2. **マイグレーション失敗**
   ```bash
   # ログを確認
   cat build-errors.log
   ```

3. **Docker内での実行エラー**
   ```bash
   # コンテナが起動しているか確認
   docker ps
   ```

### ログファイル

- `build-errors.log`: ビルドエラーログ
- Dockerログ: `docker logs api-1`