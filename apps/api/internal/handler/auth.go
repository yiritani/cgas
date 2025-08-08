package handler

import (
	"net/http"

	"go-nextjs-api/internal/interfaces"
	"go-nextjs-api/internal/middleware"
	"go-nextjs-api/internal/model"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService interfaces.AuthService
}

func NewAuthHandler(authService interfaces.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// Register は新規ユーザー登録
func (h *AuthHandler) Register(c *gin.Context) {
	var req model.RegisterRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid JSON data",
		})
		return
	}

	response, err := h.authService.Register(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Email already exists or invalid data",
		})
		return
	}

	c.JSON(http.StatusCreated, response)
}

// Login はログイン処理
func (h *AuthHandler) Login(c *gin.Context) {
	var req model.LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid JSON data",
		})
		return
	}

	response, err := h.authService.Login(&req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid email or password",
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetProfile は現在のユーザー情報を取得
func (h *AuthHandler) GetProfile(c *gin.Context) {
	user, err := middleware.GetCurrentUser(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get user information",
		})
		return
	}

	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, user)
}

// RefreshToken はトークンをリフレッシュ
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	user, err := middleware.GetCurrentUser(c)
	if err != nil || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not found",
		})
		return
	}

	// 新しいトークン生成
	token, err := h.authService.RefreshToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
	})
}