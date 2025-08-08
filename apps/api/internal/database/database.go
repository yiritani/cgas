package database

import (
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// InitDB はデータベース接続を初期化
func InitDB() {
	var err error
	
	// PostgreSQL接続設定
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=password dbname=go_nextjs_db port=5432 sslmode=disable TimeZone=Asia/Tokyo"
	}

	var gormConfig = &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	}

	// データベース接続をリトライ
	for i := 0; i < 30; i++ {
		DB, err = gorm.Open(postgres.Open(dsn), gormConfig)
		if err == nil {
			break
		}
		
		log.Printf("Failed to connect to database (attempt %d/30): %v", i+1, err)
		if i < 29 {
			log.Println("Retrying in 2 seconds...")
			time.Sleep(2 * time.Second)
		}
	}

	if err != nil {
		log.Fatal("Failed to connect to database after 30 attempts:", err)
	}

	log.Println("Database connected successfully")
}