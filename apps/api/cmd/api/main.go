package main

import (
	"log"
	"os"

	"go-nextjs-api/internal/database"
	"go-nextjs-api/internal/middleware"

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

	// Wireを使った依存性注入
	app, err := initializeApplication(database.DB)
	if err != nil {
		log.Fatal("Failed to initialize application:", err)
	}

	// Ginエンジンを作成
	r := gin.Default()

	// CORS設定
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{
		"http://localhost:3000",  // Next.js開発サーバー（ユーザーサイト）
		"http://localhost:3001",  // Next.js開発サーバー（管理サイト）
		"http://web:3000",        // Docker内のNext.js
	}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	config.AllowCredentials = true
	r.Use(cors.New(config))

	// ミドルウェア
	r.Use(middleware.Logger())

	// ヘルスチェック
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Go API server is running",
		})
	})

	// 認証不要のAPI routes
	api := r.Group("/api")
	{
		// 認証関連
		api.POST("/register", app.AuthHandler.Register)
		api.POST("/login", app.AuthHandler.Login)
	}

	// 認証が必要なAPI routes
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware())
	{
		// プロフィール
		protected.GET("/profile", app.AuthHandler.GetProfile)
		protected.POST("/refresh", app.AuthHandler.RefreshToken)

		// ユーザー管理（認証必須）
		protected.GET("/users", app.UserHandler.GetUsers)
		protected.GET("/users/:id", app.UserHandler.GetUser)
		protected.PUT("/users/:id", app.UserHandler.UpdateUser)

		// プロジェクト管理（認証必須）
		protected.GET("/projects", app.ProjectHandler.GetProjectsByType)         // プロジェクト一覧（type=vendorフィルタ付き）
		protected.GET("/projects/me", app.ProjectHandler.GetUserProjects)        // 自分が所属するプロジェクト一覧
		protected.GET("/projects/:id", app.ProjectHandler.GetProject)            // プロジェクト詳細
		protected.GET("/projects/:id/members", app.ProjectHandler.GetProjectMembers) // プロジェクトメンバー一覧
		protected.GET("/projects/:id/vendor-relations", app.ProjectHandler.GetVendorRelations) // ベンダープロジェクト紐付け一覧
		protected.POST("/projects", app.ProjectHandler.CreateProject)            // プロジェクト作成
		protected.POST("/projects/:id/vendor-relations", app.ProjectHandler.CreateVendorRelation) // ベンダープロジェクト紐付け作成
		protected.PUT("/projects/:id", app.ProjectHandler.UpdateProject)         // プロジェクト更新
		protected.DELETE("/projects/:id", app.ProjectHandler.DeleteProject)      // プロジェクト削除（オーナーのみ）
		protected.DELETE("/projects/:id/vendor-relations/:relationId", app.ProjectHandler.DeleteVendorRelation) // ベンダープロジェクト紐付け削除
		protected.POST("/projects/:id/members", app.ProjectHandler.AddProjectMember)           // メンバー追加
		protected.PUT("/projects/:id/members/:memberId", func(c *gin.Context) {
			log.Printf("Route handler called: PUT /projects/:id/members/:memberId - %s", c.Request.URL.Path)
			app.ProjectHandler.UpdateProjectMemberRole(c)
		}) // メンバーロール更新
		protected.DELETE("/projects/:id/members/:memberId", app.ProjectHandler.RemoveProjectMember)  // メンバー削除
		
		
		// Project CSP Account関連（認証必須 - ユーザーは自分のプロジェクトのみアクセス可能）
		protected.GET("/project-csp-accounts", app.CSPHandler.GetProjectCSPAccounts) // プロジェクトCSPアカウント関連一覧
		
		// CSP Account Member関連（認証必須）
		protected.GET("/csp-account-members", app.CSPHandler.GetCSPAccountMembers)       // CSPアカウントメンバー一覧
		protected.GET("/csp-account-members/:id", app.CSPHandler.GetCSPAccountMember)   // CSPアカウントメンバー詳細
		protected.POST("/csp-account-members", app.CSPHandler.CreateCSPAccountMember)   // CSPアカウントメンバー作成
		protected.PUT("/csp-account-members/:id", app.CSPHandler.UpdateCSPAccountMember) // CSPアカウントメンバー更新
		protected.DELETE("/csp-account-members/:id", app.CSPHandler.DeleteCSPAccountMember) // CSPアカウントメンバー削除
		
		// 内部API（マイクロサービス間通信用）
		internal := r.Group("/api/internal")
		{
			internal.GET("/projects/:id/can-manage", app.InternalHandler.CanManageProject)
			internal.GET("/projects/:id/type", app.InternalHandler.GetProjectType)
			internal.POST("/csp-accounts/auto-create", app.InternalHandler.AutoCreateCSPAccount)
		}
		
		// システム管理者のみ
		adminOnly := protected.Group("/admin")
		adminOnly.Use(middleware.RequireRole("admin"))
		{
			adminOnly.POST("/users", app.UserHandler.CreateUser)
			adminOnly.DELETE("/users/:id", app.UserHandler.DeleteUser)
			
			// CSP Account関連（管理者のみ）
			adminOnly.GET("/csp-accounts", app.CSPHandler.GetCSPAccounts)                     // CSPアカウント一覧
			adminOnly.GET("/csp-accounts/:id", app.CSPHandler.GetCSPAccount)                  // CSPアカウント詳細
			adminOnly.POST("/csp-accounts", app.CSPHandler.CreateCSPAccount)                  // CSPアカウント作成
			adminOnly.PUT("/csp-accounts/:id", app.CSPHandler.UpdateCSPAccount)               // CSPアカウント更新
			adminOnly.DELETE("/csp-accounts/:id", app.CSPHandler.DeleteCSPAccount)            // CSPアカウント削除
			adminOnly.GET("/project-csp-accounts", app.CSPHandler.GetProjectCSPAccounts)      // プロジェクトCSPアカウント関連一覧
			adminOnly.POST("/project-csp-accounts", app.CSPHandler.CreateProjectCSPAccount)   // プロジェクトCSPアカウント関連作成
			adminOnly.DELETE("/project-csp-accounts/:id", app.CSPHandler.DeleteProjectCSPAccount) // プロジェクトCSPアカウント関連削除
			
			// CSP Account Member関連（管理者のみ）
			adminOnly.GET("/csp-account-members", app.CSPHandler.GetCSPAccountMembers)       // CSPアカウントメンバー一覧（管理者）
			adminOnly.GET("/csp-account-members/:id", app.CSPHandler.GetCSPAccountMember)   // CSPアカウントメンバー詳細（管理者）
		}
	}

	// サーバー起動
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}