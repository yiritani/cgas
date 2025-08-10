package database

import (
	"context"
	"log"
	"os"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"google.golang.org/api/option"
)

var FirestoreClient *firestore.Client

func InitDB() {
	ctx := context.Background()
	
	// 環境変数からFirebaseの設定を取得
	projectID := os.Getenv("FIREBASE_PROJECT_ID")
	if projectID == "" {
		projectID = "cgas-dev" // デフォルトのプロジェクトID
	}

	// Firestore エミュレーターの設定をチェック
	if emulatorHost := os.Getenv("FIRESTORE_EMULATOR_HOST"); emulatorHost != "" {
		log.Printf("Using Firestore emulator at %s", emulatorHost)
		// エミュレーター使用時は認証情報なしでクライアント作成
		client, err := firestore.NewClient(ctx, projectID)
		if err != nil {
			log.Fatal("Failed to create Firestore client for emulator:", err)
		}
		FirestoreClient = client
	} else {
		// 本番環境では認証情報を使用
		credentialsFile := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS")
		if credentialsFile == "" {
			log.Fatal("GOOGLE_APPLICATION_CREDENTIALS environment variable is required for production")
		}

		opt := option.WithCredentialsFile(credentialsFile)
		config := &firebase.Config{ProjectID: projectID}
		app, err := firebase.NewApp(ctx, config, opt)
		if err != nil {
			log.Fatal("Failed to initialize Firebase app:", err)
		}

		client, err := app.Firestore(ctx)
		if err != nil {
			log.Fatal("Failed to create Firestore client:", err)
		}
		FirestoreClient = client
	}

	log.Println("Connected to Firestore successfully")

	// Firestoreにはマイグレーションは不要だが、必要に応じてインデックス作成などを行う
	if err := setupFirestore(ctx); err != nil {
		log.Fatal("Failed to setup Firestore:", err)
	}

	log.Println("Firestore setup completed")
}

func setupFirestore(ctx context.Context) error {
	// 必要に応じてコレクションの初期設定やインデックス作成を行う
	// Firestoreでは自動的にインデックスが作成されるため、基本的には何もしなくても良い
	return nil
}

func CloseDB() {
	if FirestoreClient != nil {
		FirestoreClient.Close()
	}
}
