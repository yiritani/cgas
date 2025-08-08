package middleware

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"go-nextjs-api/internal/database"
	"go-nextjs-api/internal/model"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte(getJWTSecret())

func getJWTSecret() string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "your-secret-key-change-this-in-production"
	}
	return secret
}

// JWTClaims はJWTクレームの構造体
type JWTClaims struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

// GenerateJWT はJWTトークンを生成
func GenerateJWT(user model.User) (string, error) {
	claims := JWTClaims{
		UserID: user.ID,
		Email:  user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   string(rune(user.ID)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// ValidateJWT はJWTトークンを検証
func ValidateJWT(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, jwt.ErrInvalidKey
}

// AuthMiddleware は認証ミドルウェア
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Printf("AuthMiddleware: %s %s from %s", c.Request.Method, c.Request.URL.Path, c.ClientIP())
		
		authHeader := c.GetHeader("Authorization")
		log.Printf("AuthMiddleware: Authorization header: %s", authHeader)
		
		if authHeader == "" {
			log.Printf("AuthMiddleware: Missing Authorization header")
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header is required",
			})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Bearer token is required",
			})
			c.Abort()
			return
		}

		claims, err := ValidateJWT(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid token",
			})
			c.Abort()
			return
		}

		// ユーザー情報をコンテキストに設定
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)

		c.Next()
	}
}

// RequireSystemAdmin はシステム管理者権限を要求するミドルウェア
// システムプロジェクトでowner/adminロールを持つユーザーのみアクセス可能
func RequireSystemAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "User not authenticated",
			})
			c.Abort()
			return
		}

		// システムプロジェクトでの権限をチェック
		hasPermission, err := CheckSystemAdminPermission(userID.(uint))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to check permissions",
			})
			c.Abort()
			return
		}

		if !hasPermission {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "System administrator privileges required",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireProjectRole はプロジェクトでの特定ロールを要求するミドルウェア
func RequireProjectRole(projectID uint, requiredRole model.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "User not authenticated",
			})
			c.Abort()
			return
		}

		// プロジェクトでの権限をチェック
		userRole, err := GetUserProjectRole(userID.(uint), projectID)
		if err != nil {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Access denied to project",
			})
			c.Abort()
			return
		}

		if !userRole.HasPermission(requiredRole) {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Insufficient project permissions",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// CheckSystemAdminPermission はシステム管理者権限をチェック
func CheckSystemAdminPermission(userID uint) (bool, error) {
	var systemProject model.Project
	if err := database.DB.Where("name = ?", "システム").First(&systemProject).Error; err != nil {
		return false, err
	}

	var userProjectRole model.UserProjectRole
	err := database.DB.Where("user_id = ? AND project_id = ?", userID, systemProject.ID).First(&userProjectRole).Error
	if err != nil {
		return false, nil // ロールが見つからない場合は権限なし
	}

	// owner または admin ロールのみシステム管理者とする
	return userProjectRole.Role == model.RoleOwner || userProjectRole.Role == model.RoleAdmin, nil
}

// GetUserProjectRole はユーザーのプロジェクトでのロールを取得
func GetUserProjectRole(userID, projectID uint) (model.Role, error) {
	var userProjectRole model.UserProjectRole
	err := database.DB.Where("user_id = ? AND project_id = ?", userID, projectID).First(&userProjectRole).Error
	if err != nil {
		return "", err
	}
	return userProjectRole.Role, nil
}

// 旧RequireRole関数（後方互換のため一時的に保持）
// TODO: 段階的に削除予定
func RequireRole(role string) gin.HandlerFunc {
	return RequireSystemAdmin()
}

// GetCurrentUser は現在のユーザーを取得
func GetCurrentUser(c *gin.Context) (*model.User, error) {
	userID, exists := c.Get("user_id")
	if !exists {
		return nil, nil
	}

	var user model.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return nil, err
	}

	return &user, nil
}