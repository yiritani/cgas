# Cloud Governance & Automation System (CGAS)

マイクロサービス・マイクロフロントエンド アーキテクチャを採用したクラウドガバナンス・自動化システムです。
TurboRepo、Go、Next.js を使用し、Docker Compose でのホットリロード開発に対応しています。

## アーキテクチャ概要

### マイクロサービス構成

- **Main API** (Port 8080): ユーザー管理、プロジェクト管理、CSPアカウント管理
- **CSP Provisioning Service** (Port 8081): CSP申請・承認ワークフロー
- **PostgreSQL** (Port 5432): Main API用データベース
- **CSP Provisioning DB** (Port 5433): CSP Provisioning Service用データベース

### マイクロフロントエンド構成

- **Web App** (Port 3000): メインユーザー向けアプリケーション
- **Web Admin** (Port 3001): 管理者向けアプリケーション
- **CSP Provisioning Frontend** (Port 3002): CSP申請専用フロントエンド _(開発中)_

## 技術スタック

### フロントエンド

- **Next.js 14** (Page Router)
- **TypeScript**
- **React 18**
- **Tailwind CSS** + **Sakura UI**

### バックエンド

- **Go 1.21**
- **Gin** (Webフレームワーク)
- **GORM** (ORM)
- **Wire** (依存性注入)
- **PostgreSQL 16**

### 開発・運用

- **TurboRepo** (モノレポ管理)
- **Docker & Docker Compose** (watch機能付き)
- **Air** (Goホットリロード)

## プロジェクト構成

```
cgas/
├── apps/
│   ├── web/                          # メインWebアプリ (Port 3000)
│   ├── web_admin/                    # 管理者Webアプリ (Port 3001)
│   ├── csp-provisioning-frontend/   # CSP申請専用フロントエンド (Port 3002) *開発中*
│   ├── api/                         # メインAPIサーバー (Port 8080)
│   └── csp-provisioning-service/    # CSP申請サービス (Port 8081)
├── docker-compose.yml               # 本番用
├── docker-compose.dev.yml           # 開発用 (watch対応)
├── package.json                     # ルートパッケージ
└── turbo.json                       # TurboRepo設定
```

## 開発環境のセットアップ

### 必要な環境

- Node.js 22+
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

## サービス詳細

### Main API (Port 8080)

- **責任**: ユーザー管理、プロジェクト管理、CSPアカウント管理、内部API
- **データベース**: PostgreSQL (Port 5432)
- **主要機能**:
  - JWT認証・認可
  - ユーザー・プロジェクト CRUD
  - CSPアカウント・メンバー管理
  - 内部サービス間通信API

### CSP Provisioning Service (Port 8081)

- **責任**: CSP申請・承認ワークフロー
- **データベース**: PostgreSQL (Port 5433)
- **主要機能**:
  - CSP申請の作成・更新・削除
  - 管理者による承認・却下処理
  - プロジェクト権限チェック（Main API連携）

### BFF (Backend for Frontend)

- **実装**: Next.js API Routes
- **責任**: フロントエンド向けAPI統合、認証プロキシ
- **主要機能**:
  - 複数マイクロサービスへのリクエスト統合
  - Cookie-based認証管理
  - CSP申請承認時の自動CSPアカウント作成

## データベース構成

### Main API Database (Port 5432)

- **Database**: go_nextjs_db
- **Tables**: users, projects, user_project_roles, csp_accounts, project_csp_accounts, csp_account_members

### CSP Provisioning Database (Port 5433)

- **Database**: csp_provisioning_db
- **Tables**: csp_requests

### 共通接続情報

- **User**: postgres
- **Password**: password
- **Host**: localhost (Docker内では各サービス名)

## 開発ワークフロー

### CSP申請・承認フロー（新アーキテクチャ）

1. **申請作成**: Web App → CSP Provisioning Service
2. **申請一覧**: Web Admin → CSP Provisioning Service
3. **申請承認**: Web Admin → BFF → CSP Provisioning Service (承認) + Main API (CSPアカウント作成)

### BFFによる統合処理

```
承認リクエスト → BFF
├── Step 1: CSP Provisioning Service で承認処理
└── Step 2: 承認成功時、Main API でCSPアカウント自動作成
```

## API エンドポイント

### Main API (8080)

```
GET    /api/users              # ユーザー一覧
GET    /api/projects           # プロジェクト一覧
GET    /api/csp-accounts       # CSPアカウント一覧
POST   /api/internal/csp-accounts/auto-create  # CSPアカウント自動作成（内部API）
```

### CSP Provisioning Service (8081)

```
GET    /api/csp-requests       # CSP申請一覧
POST   /api/csp-requests       # CSP申請作成
PUT    /api/csp-requests/:id/review  # CSP申請承認・却下（管理者のみ）
```

### フロントエンドアプリ

```
http://localhost:3000  # Web App (メインユーザー向け)
http://localhost:3001  # Web Admin (管理者向け)
http://localhost:3002  # CSP Provisioning Frontend (開発中)
```

## トラブルシューティング

### Docker Compose

```bash
# 全サービス再起動
docker compose -f docker-compose.dev.yml restart

# 特定サービスのログ確認
docker compose -f docker-compose.dev.yml logs -f api
docker compose -f docker-compose.dev.yml logs -f csp-provisioning

# データベースリセット
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d
```

### 開発時の注意点

- 環境変数の変更後は該当コンテナの再作成が必要
- データベースマイグレーションは各サービス起動時に自動実行
- JWT認証はMain APIで一元管理し、他サービスで検証
