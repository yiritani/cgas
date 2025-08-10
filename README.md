# Cloud Governance & Automation System (CGAS)

マイクロサービス・マイクロフロントエンド アーキテクチャを採用したクラウドガバナンス・自動化システムです。
TurboRepo、Go、Next.js を使用し、Docker Compose でのホットリロード開発に対応しています。

## アーキテクチャ概要

### マイクロサービス構成

- **Main API** (Port 8080): ユーザー管理、プロジェクト管理、CSPアカウント管理
- **CSP Provisioning Service** (Port 8081): CSP申請・承認ワークフロー (**Firestore使用**)
- **PostgreSQL** (Port 5432): Main API用データベース
- **Firestore Emulator** (Port 8080): CSP Provisioning Service用NoSQLデータベース（開発環境）

### マイクロフロントエンド構成

- **Web App** (Port 3000): メインユーザー向けアプリケーション
  - プロジェクト管理、CSPアカウント管理
  - CSP Provisioning Webへの認証付き遷移機能
- **CSP Provisioning Web** (Port 3001): CSP申請専用マイクロフロントエンド
  - 独立したNext.js Page Routerアプリケーション
  - JWT認証によるセキュアなアクセス制御
  - メインアプリとの統一されたデザインシステム
  - returnURL機能による元ページへの自動復帰
- **Web Admin** (Port 3010): 管理者向けアプリケーション
  - CSP申請の承認・却下機能

## 技術スタック

### フロントエンド

- **Next.js 14** (Page Router)
- **TypeScript**
- **React 19** (CSP Provisioning Web)
- **React 18** (Web App, Web Admin)
- **Tailwind CSS** + **Sakura UI**
- **useSWR** (リアルタイムデータフェッチング)
- **マイクロフロントエンドアーキテクチャ**

### バックエンド

- **Go 1.21**
- **Gin** (Webフレームワーク)
- **GORM** (ORM - Main API用)
- **Firebase SDK for Go** (Firestore - CSP Provisioning用)
- **Wire** (依存性注入)
- **PostgreSQL 16** (Main API)
- **Google Cloud Firestore** (CSP Provisioning)

### 開発・運用

- **TurboRepo** (モノレポ管理)
- **Docker & Docker Compose** (watch機能付き)
- **Air** (Goホットリロード)

## プロジェクト構成

```
cgas/
├── apps/
│   ├── web/                         # メインWebアプリ (Port 3000)
│   ├── csp-provisioning-web/        # CSP申請専用マイクロフロントエンド (Port 3001)
│   ├── web_admin/                   # 管理者Webアプリ (Port 3010)
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
- **データベース**: **Google Cloud Firestore** (NoSQL)
- **開発環境**: Firestore Emulator (Port 8080)
- **主要機能**:
  - CSP申請の作成・更新・削除
  - 管理者による承認・却下処理
  - プロジェクト権限チェック（Main API連携）
  - **承認時の自動CSPアカウント作成**
- **データ構造**: プロジェクトIDをドキュメントIDとし、申請をリスト形式で管理

### BFF (Backend for Frontend)

- **実装**: Next.js API Routes
- **責任**: フロントエンド向けAPI統合、認証プロキシ
- **主要機能**:
  - 複数マイクロサービスへのリクエスト統合
  - Cookie-based認証管理
  - CSP申請承認時の自動CSPアカウント作成

## データベース構成

### Main API Database (PostgreSQL - Port 5432)

- **Database**: go_nextjs_db
- **Tables**: users, projects, user_project_roles, csp_accounts, project_csp_accounts, csp_account_members
- **User**: postgres
- **Password**: password
- **Host**: localhost (Docker内では各サービス名)

### CSP Provisioning Database (**Firestore**)

- **開発環境**: Firestore Emulator (Port 8080)
- **本番環境**: Google Cloud Firestore
- **プロジェクトID**: `csp-provisioning-dev` (開発用)
- **コレクション**: `csp_requests`
- **データ構造**:
  ```
  csp_requests/
    {project_id}/          # ドキュメントID = プロジェクトID
      project_id: 1
      requests: [           # CSP申請のリスト
        {
          id: "uuid",
          requested_by: "user@example.com",
          provider: "aws",
          account_name: "test-account",
          status: "pending",
          ...
        }
      ]
  ```

## 開発ワークフロー

### マイクロフロントエンド間連携

1. **認証付き遷移**: Web App → CSP Provisioning Web
   - JWTトークンをURLパラメータで安全に受け渡し
   - returnURL機能による元ページへの自動復帰
   - 元タブの自動クローズによるUX向上

2. **統一デザインシステム**:
   - Sakura UIによる一貫したコンポーネント設計
   - Tailwind CSSによる統一されたスタイリング

### CSP申請・承認フロー（Firestoreベース）

1. **申請作成**: CSP Provisioning Web → CSP Provisioning Service → **Firestore**
2. **申請一覧**: CSP Provisioning Web → CSP Provisioning Service → **Firestore** (リアルタイム更新)
3. **申請承認**: Web Admin → CSP Provisioning Service → **Firestore** (承認) + Main API (CSPアカウント作成)

### Firestore統合処理

```
承認リクエスト → CSP Provisioning Service
├── Step 1: Firestoreで承認ステータス更新
└── Step 2: 承認成功時、Main API でCSPアカウント自動作成
```

### Firestoreの特徴

- **NoSQLドキュメントデータベース**: 柔軟なスキーマ設計
- **リアルタイム更新**: useSWRによる自動データ同期
- **スケーラブル**: クラウドネイティブな設計
- **オフライン対応**: ローカル開発でのEmulator使用

## API エンドポイント

### Main API (8080)

```
GET    /api/users              # ユーザー一覧
GET    /api/projects           # プロジェクト一覧
GET    /api/csp-accounts       # CSPアカウント一覧
POST   /api/internal/csp-accounts/auto-create  # CSPアカウント自動作成（内部API）
```

### CSP Provisioning Service (8081) - **Firestore連携**

```
GET    /api/csp-requests                    # CSP申請一覧 (Firestore)
POST   /api/csp-requests                    # CSP申請作成 (Firestore)
GET    /api/csp-requests/:id                # CSP申請詳細 (Firestore)
PUT    /api/csp-requests/:id                # CSP申請更新 (Firestore)
PUT    /api/csp-requests/:id/review         # CSP申請承認・却下 (Firestore + CSPアカウント自動作成)
DELETE /api/csp-requests/:id               # CSP申請削除 (Firestore)
```

### フロントエンドアプリ

```
http://localhost:3000  # Web App (メインユーザー向け)
http://localhost:3001  # CSP Provisioning Web (CSP申請専用マイクロフロントエンド)
http://localhost:3010  # Web Admin (管理者向け)
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
- **Main API**: PostgreSQLマイグレーションは起動時に自動実行
- **CSP Provisioning**: Firestore Emulatorは起動時に自動初期化
- JWT認証はMain APIで一元管理し、他サービスで検証
- **Firestore**: データはエミュレーター再起動時にリセットされます

### Firestore開発環境

```bash
# Firestore Emulator UI (開発中のデータ確認用)
http://localhost:4000

# Firestore設定ファイル
apps/csp-provisioning-service/firebase.json
apps/csp-provisioning-service/firestore.rules
```
