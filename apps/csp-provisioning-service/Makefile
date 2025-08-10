.PHONY: build run dev clean test emulator-start emulator-stop

# Go設定
GOOS ?= $(shell go env GOOS)
GOARCH ?= $(shell go env GOARCH)
APP_NAME = csp-provisioning-service
MAIN_PATH = ./cmd/server

# ビルド
build:
	CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH) go build -o $(APP_NAME) $(MAIN_PATH)

# 本番実行
run: build
	./$(APP_NAME)

# 開発環境での実行（Firestoreエミュレーター使用）
dev:
	@echo "Starting CSP Provisioning Service in development mode..."
	@export FIREBASE_PROJECT_ID=cgas-dev && \
	export FIRESTORE_EMULATOR_HOST=localhost:8082 && \
	export PORT=8081 && \
	export MAIN_API_URL=http://localhost:8080 && \
	export JWT_SECRET=dev-jwt-secret && \
	go run $(MAIN_PATH)

# Firestoreエミュレーター開始
emulator-start:
	@echo "Starting Firestore emulator..."
	@if command -v firebase >/dev/null 2>&1; then \
		firebase emulators:start --only firestore --project cgas-dev; \
	else \
		echo "Firebase CLI not found. Installing..."; \
		npm install -g firebase-tools; \
		firebase emulators:start --only firestore --project cgas-dev; \
	fi

# Firestoreエミュレーター停止
emulator-stop:
	@echo "Stopping Firestore emulator..."
	@pkill -f "firebase.*emulator" || true

# 依存関係の更新
deps:
	go mod tidy
	go mod download

# テスト実行
test:
	go test -v ./...

# クリーンアップ
clean:
	rm -f $(APP_NAME)
	go clean

# 開発環境セットアップ（エミュレーター + サービス）
dev-setup:
	@echo "Setting up development environment..."
	@make emulator-start &
	@sleep 5
	@make dev

# ヘルプ
help:
	@echo "Available commands:"
	@echo "  build         - Build the application"
	@echo "  run           - Run the built application"
	@echo "  dev           - Run in development mode with Firestore emulator"
	@echo "  dev-setup     - Start emulator and run in development mode"
	@echo "  emulator-start- Start Firestore emulator"
	@echo "  emulator-stop - Stop Firestore emulator"
	@echo "  deps          - Update dependencies"
	@echo "  test          - Run tests"
	@echo "  clean         - Clean build artifacts"
	@echo "  help          - Show this help message"
