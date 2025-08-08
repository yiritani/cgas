FROM golang:1.21 AS builder

# ワーキングディレクトリを設定
WORKDIR /app

# go modファイルをコピー
COPY go.mod go.sum ./

# 依存関係をダウンロード
RUN go mod download

# ソースコードをコピー
COPY . .

# バイナリをビルド  
RUN CGO_ENABLED=1 GOOS=linux go build -o main ./cmd/api

# 実行用の軽量イメージ
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /root/

# PostgreSQL用のクライアントをインストール  
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

# ビルドしたバイナリをコピー
COPY --from=builder /app/main .

# 8080番ポートを開放
EXPOSE 8080

# アプリケーションを実行
CMD ["./main"]