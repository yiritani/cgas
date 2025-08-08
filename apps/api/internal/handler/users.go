package handler

import (
	"net/http"
	"strconv"

	"go-nextjs-api/internal/interfaces"
	"go-nextjs-api/internal/model"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	userService interfaces.UserService
}

func NewUserHandler(userService interfaces.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

// GetUsers は全ユーザーを取得（ページング・検索対応）
func (h *UserHandler) GetUsers(c *gin.Context) {
	// クエリパラメータを取得
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "10")
	search := c.Query("search")
	searchType := c.DefaultQuery("searchType", "all")

	// ページとリミットを数値に変換
	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 100 {
		limit = 10
	}

	var users []model.User
	var pagination *model.PaginationInfo

	if search != "" {
		// 検索機能を使用
		users, pagination, err = h.userService.GetUsersWithSearch(page, limit, search, searchType)
	} else {
		// 通常のページング
		users, pagination, err = h.userService.GetUsersWithPagination(page, limit)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch users",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users":      users,
		"pagination": pagination,
	})
}

// GetUser は指定されたIDのユーザーを取得
func (h *UserHandler) GetUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	user, err := h.userService.GetUserByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, user)
}

// CreateUser は新しいユーザーを作成
func (h *UserHandler) CreateUser(c *gin.Context) {
	var user model.User

	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid JSON data",
		})
		return
	}

	if err := h.userService.CreateUser(&user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create user",
		})
		return
	}

	c.JSON(http.StatusCreated, user)
}

// UpdateUser は既存のユーザーを更新
func (h *UserHandler) UpdateUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	var user model.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid JSON data",
		})
		return
	}

	if err := h.userService.UpdateUser(uint(id), &user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update user",
		})
		return
	}

	c.JSON(http.StatusOK, user)
}

// DeleteUser は指定されたIDのユーザーを削除
func (h *UserHandler) DeleteUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	if err := h.userService.DeleteUser(uint(id)); err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User deleted successfully",
	})
}