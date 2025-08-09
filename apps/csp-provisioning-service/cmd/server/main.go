package main

import (
	"csp-provisioning-service/internal/database"
	"csp-provisioning-service/internal/handler"
	"csp-provisioning-service/internal/middleware"
	"csp-provisioning-service/internal/repository"
	"csp-provisioning-service/internal/service"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// 環境変数を読み込み
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// データベース初期化
	database.InitDB()

	// 依存性注入
	cspRequestRepo := repository.NewCSPRequestRepository(database.DB)
	cspRequestService := service.NewCSPRequestService(cspRequestRepo)
	cspRequestHandler := handler.NewCSPRequestHandler(cspRequestService)

	// Ginエンジンを作成
	r := gin.Default()

	// CORS設定
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{
		"http://localhost:8080", // メインAPIサーバー
		"http://api:8080",       // Docker内のメインAPIサーバー
	}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Creator-ID"}
	config.AllowCredentials = true
	r.Use(cors.New(config))

	// ミドルウェア
	r.Use(middleware.Logger())

	// ヘルスチェック
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "csp-provisioning-service",
			"message": "CSP Provisioning Service is running",
		})
	})

	// API routes
	api := r.Group("/api")

	// CSP Request関連のAPI（認証必須）
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware())
	{
		// CSP申請管理
		protected.GET("/csp-requests", cspRequestHandler.GetCSPRequests)
		protected.GET("/csp-requests/:id", cspRequestHandler.GetCSPRequest)
		protected.POST("/csp-requests", cspRequestHandler.CreateCSPRequest)
		protected.PUT("/csp-requests/:id", cspRequestHandler.UpdateCSPRequest)
		protected.DELETE("/csp-requests/:id", cspRequestHandler.DeleteCSPRequest)

		// 管理者のみアクセス可能
		adminOnly := protected.Group("")
		adminOnly.Use(middleware.RequireRole("admin"))
		{
			adminOnly.PUT("/csp-requests/:id/review", cspRequestHandler.ReviewCSPRequest)
		}
	}

	// サーバー起動
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	log.Printf("CSP Provisioning Service starting on port %s", port)
	log.Printf("Main API URL: %s", os.Getenv("MAIN_API_URL"))
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
