package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"go-nextjs-api/internal/database"

	"github.com/joho/godotenv"
)

func main() {
	// フラグの定義
	var (
		migrate     = flag.Bool("migrate", false, "Run database migrations")
		seed        = flag.Bool("seed", false, "Run database seeding")
		drop        = flag.Bool("drop", false, "Drop all tables (WARNING: This will delete all data)")
		reset       = flag.Bool("reset", false, "Reset database (drop + migrate + seed)")
		testData    = flag.Bool("test-data", false, "Create pagination test data (50+ users)")
		cleanupTest = flag.Bool("cleanup-test", false, "Cleanup test data")
		help        = flag.Bool("help", false, "Show help message")
	)
	flag.Parse()

	// ヘルプメッセージ
	if *help || (!*migrate && !*seed && !*drop && !*reset && !*testData && !*cleanupTest) {
		showHelp()
		return
	}

	// 環境変数を読み込み
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// データベース接続を初期化
	database.InitDB()

	// コマンドの実行
	switch {
	case *reset:
		log.Println("🔄 Resetting database...")
		if err := database.ResetDatabase(); err != nil {
			log.Fatal("❌ Failed to reset database:", err)
		}
		log.Println("✅ Database reset completed successfully!")

	case *drop:
		log.Println("⚠️  WARNING: This will delete all data!")
		fmt.Print("Are you sure you want to drop all tables? (y/N): ")
		var response string
		fmt.Scanln(&response)
		if response == "y" || response == "Y" || response == "yes" {
			log.Println("🗑️  Dropping all tables...")
			if err := database.DropAllTables(); err != nil {
				log.Fatal("❌ Failed to drop tables:", err)
			}
			log.Println("✅ All tables dropped successfully!")
		} else {
			log.Println("❌ Operation cancelled")
		}

	case *migrate:
		log.Println("🚀 Running migrations...")
		if err := database.RunMigrations(); err != nil {
			log.Fatal("❌ Failed to run migrations:", err)
		}
		log.Println("✅ Migrations completed successfully!")

	case *seed:
		log.Println("🌱 Seeding database...")
		if err := database.SeedData(); err != nil {
			log.Fatal("❌ Failed to seed database:", err)
		}
		log.Println("✅ Database seeded successfully!")

	case *testData:
		log.Println("🎯 Creating pagination test data...")
		if err := database.CreatePaginationTestData(); err != nil {
			log.Fatal("❌ Failed to create test data:", err)
		}
		log.Println("✅ Pagination test data created successfully!")

	case *cleanupTest:
		log.Println("🧹 Cleaning up test data...")
		if err := database.CleanupTestData(); err != nil {
			log.Fatal("❌ Failed to cleanup test data:", err)
		}
		log.Println("✅ Test data cleaned up successfully!")
	}
}

func showHelp() {
	fmt.Println("🗃️  Database Migration Tool")
	fmt.Println("Usage: go run cmd/migrate/main.go [options]")
	fmt.Println()
	fmt.Println("Options:")
	fmt.Println("  -migrate      Run database migrations")
	fmt.Println("  -seed         Run database seeding (insert initial data)")
	fmt.Println("  -drop         Drop all tables (WARNING: Deletes all data)")
	fmt.Println("  -reset        Reset database (drop + migrate + seed)")
	fmt.Println("  -test-data    Create pagination test data (50+ users)")
	fmt.Println("  -cleanup-test Cleanup test data")
	fmt.Println("  -help         Show this help message")
	fmt.Println()
	fmt.Println("Examples:")
	fmt.Println("  go run cmd/migrate/main.go -migrate")
	fmt.Println("  go run cmd/migrate/main.go -seed") 
	fmt.Println("  go run cmd/migrate/main.go -reset")
	fmt.Println("  go run cmd/migrate/main.go -test-data")
	fmt.Println("  go run cmd/migrate/main.go -cleanup-test")
	fmt.Println("  docker exec -it api-1 go run cmd/migrate/main.go -migrate")
	fmt.Println()
	fmt.Println("Environment Variables:")
	fmt.Printf("  DATABASE_URL (current: %s)\n", getDBURL())
}

func getDBURL() string {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return "host=localhost user=postgres password=password dbname=go_nextjs_db port=5432 sslmode=disable TimeZone=Asia/Tokyo"
	}
	return dbURL
}