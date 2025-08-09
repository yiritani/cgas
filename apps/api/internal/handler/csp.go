package handler

import (
	"net/http"
	"strconv"

	"go-nextjs-api/internal/interfaces"
	"go-nextjs-api/internal/model"

	"github.com/gin-gonic/gin"
)

type CSPHandler struct {
	cspService interfaces.CSPService
}

func NewCSPHandler(cspService interfaces.CSPService) *CSPHandler {
	return &CSPHandler{cspService: cspService}
}

// CSPAccount Handlers

// GetCSPAccounts はCSPアカウント一覧を取得（ページング対応）
func (h *CSPHandler) GetCSPAccounts(c *gin.Context) {
	// クエリパラメータを取得
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "10")
	provider := c.Query("provider")

	// ページとリミットを数値に変換
	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 100 {
		limit = 10
	}

	var accounts []model.CSPAccount
	var pagination *model.PaginationInfo

	if provider != "" {
		cspProvider := model.CSPProvider(provider)
		if !cspProvider.IsValid() {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid provider parameter"})
			return
		}
		accounts, err = h.cspService.GetCSPAccountsByProvider(cspProvider)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	} else {
		// 通常のページング
		accounts, pagination, err = h.cspService.GetCSPAccountsWithPagination(page, limit)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	response := gin.H{"data": accounts}
	if pagination != nil {
		response["pagination"] = pagination
	}

	c.JSON(http.StatusOK, response)
}

// GetCSPAccount はCSPアカウント詳細を取得
func (h *CSPHandler) GetCSPAccount(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	account, err := h.cspService.GetCSPAccountByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "CSP account not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": account})
}

// CreateCSPAccount はCSPアカウントを作成
func (h *CSPHandler) CreateCSPAccount(c *gin.Context) {
	var req model.CSPAccountCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 管理者IDをコンテキストから取得
	adminID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	account, err := h.cspService.CreateCSPAccount(adminID.(uint), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": account})
}

// UpdateCSPAccount はCSPアカウントを更新
func (h *CSPHandler) UpdateCSPAccount(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var account model.CSPAccount
	if err := c.ShouldBindJSON(&account); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 管理者IDをコンテキストから取得
	adminID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	updatedAccount, err := h.cspService.UpdateCSPAccount(uint(id), adminID.(uint), &account)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": updatedAccount})
}

// DeleteCSPAccount はCSPアカウントを削除
func (h *CSPHandler) DeleteCSPAccount(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	// 管理者IDをコンテキストから取得
	adminID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	err = h.cspService.DeleteCSPAccount(uint(id), adminID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "CSP account deleted successfully"})
}

// ProjectCSPAccount Handlers

// GetProjectCSPAccounts はプロジェクトCSPアカウント関連一覧を取得
func (h *CSPHandler) GetProjectCSPAccounts(c *gin.Context) {
	// ユーザーIDをコンテキストから取得
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	projectIDStr := c.Query("project_id")
	cspAccountIDStr := c.Query("csp_account_id")

	var relations []model.ProjectCSPAccount

	if projectIDStr != "" {
		projectID, err := strconv.Atoi(projectIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project_id parameter"})
			return
		}

		// ユーザーがこのプロジェクトのメンバーかチェック
		hasAccess, err := h.cspService.CanUserManageProjectCSPAccount(userID.(uint), uint(projectID))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if !hasAccess {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied to this project"})
			return
		}

		relations, err = h.cspService.GetProjectCSPAccountsByProjectID(uint(projectID))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	} else if cspAccountIDStr != "" {
		cspAccountID, err := strconv.Atoi(cspAccountIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid csp_account_id parameter"})
			return
		}
		relations, err = h.cspService.GetProjectCSPAccountsByCSPAccountID(uint(cspAccountID))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	} else {
		// パラメータなしの場合は、ユーザーが所属するプロジェクトのCSPアカウントのみを返す
		// この機能は実装せず、project_idパラメータを必須とする
		c.JSON(http.StatusBadRequest, gin.H{"error": "project_id parameter is required"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": relations})
}

// CreateProjectCSPAccount はプロジェクトCSPアカウント関連を作成
func (h *CSPHandler) CreateProjectCSPAccount(c *gin.Context) {
	type CreateProjectCSPAccountRequest struct {
		ProjectID    uint `json:"project_id" binding:"required"`
		CSPAccountID uint `json:"csp_account_id" binding:"required"`
	}

	var req CreateProjectCSPAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 管理者IDをコンテキストから取得
	adminID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	relation, err := h.cspService.CreateProjectCSPAccount(adminID.(uint), req.ProjectID, req.CSPAccountID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": relation})
}

// DeleteProjectCSPAccount はプロジェクトCSPアカウント関連を削除
func (h *CSPHandler) DeleteProjectCSPAccount(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	// 管理者IDをコンテキストから取得
	adminID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	err = h.cspService.DeleteProjectCSPAccount(uint(id), adminID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Project CSP account relation deleted successfully"})
}

// CSPAccountMember Handlers

// GetCSPAccountMembers はCSPアカウントメンバー一覧を取得
func (h *CSPHandler) GetCSPAccountMembers(c *gin.Context) {
	cspAccountIDStr := c.Query("csp_account_id")
	projectIDStr := c.Query("project_id")
	userIDStr := c.Query("user_id")

	var members []model.CSPAccountMember
	var err error

	if cspAccountIDStr != "" {
		cspAccountID, err := strconv.Atoi(cspAccountIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid csp_account_id parameter"})
			return
		}
		members, err = h.cspService.GetCSPAccountMembersByCSPAccountID(uint(cspAccountID))
	} else if projectIDStr != "" {
		projectID, err := strconv.Atoi(projectIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project_id parameter"})
			return
		}
		members, err = h.cspService.GetCSPAccountMembersByProjectID(uint(projectID))
	} else if userIDStr != "" {
		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id parameter"})
			return
		}
		members, err = h.cspService.GetCSPAccountMembersByUserID(uint(userID))
	} else {
		members, err = h.cspService.GetAllCSPAccountMembers()
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": members})
}

// GetCSPAccountMember はCSPアカウントメンバー詳細を取得
func (h *CSPHandler) GetCSPAccountMember(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID parameter"})
		return
	}

	member, err := h.cspService.GetCSPAccountMemberByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "CSP account member not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": member})
}

// CreateCSPAccountMember はCSPアカウントメンバーを作成
func (h *CSPHandler) CreateCSPAccountMember(c *gin.Context) {
	// ユーザーIDをコンテキストから取得
	creatorID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req model.CSPAccountMemberCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	member, err := h.cspService.CreateCSPAccountMember(creatorID.(uint), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": member})
}

// UpdateCSPAccountMember はCSPアカウントメンバーを更新
func (h *CSPHandler) UpdateCSPAccountMember(c *gin.Context) {
	// ユーザーIDをコンテキストから取得
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID parameter"})
		return
	}

	var req model.CSPAccountMemberUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	member, err := h.cspService.UpdateCSPAccountMember(uint(id), userID.(uint), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": member})
}

// DeleteCSPAccountMember はCSPアカウントメンバーを削除
func (h *CSPHandler) DeleteCSPAccountMember(c *gin.Context) {
	// ユーザーIDをコンテキストから取得
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID parameter"})
		return
	}

	err = h.cspService.DeleteCSPAccountMember(uint(id), userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "CSP account member deleted successfully"})
}
