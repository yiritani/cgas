package handler

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"go-nextjs-api/internal/interfaces"
	"go-nextjs-api/internal/model"

	"github.com/gin-gonic/gin"
)

type InternalHandler struct {
	projectService interfaces.ProjectService
	cspService     interfaces.CSPService
}

func NewInternalHandler(projectService interfaces.ProjectService, cspService interfaces.CSPService) *InternalHandler {
	return &InternalHandler{
		projectService: projectService,
		cspService:     cspService,
	}
}

// CanManageProject はユーザーがプロジェクトを管理できるかをチェック（内部API用）
func (h *InternalHandler) CanManageProject(c *gin.Context) {
	projectIDStr := c.Param("id")
	userIDStr := c.Query("user_id")

	projectID, err := strconv.Atoi(projectIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// プロジェクトの存在確認
	project, err := h.projectService.GetProjectByID(uint(projectID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	// ユーザーがプロジェクトメンバーかつ管理権限があるかをチェック
	canManage, err := h.projectService.CanUserManageProject(uint(userID), uint(projectID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"can_manage":   canManage,
		"project_id":   project.ID,
		"project_name": project.Name,
		"project_type": project.ProjectType,
	})
}

// GetProjectType はプロジェクトの種類を取得（内部API用）
func (h *InternalHandler) GetProjectType(c *gin.Context) {
	projectIDStr := c.Param("id")

	projectID, err := strconv.Atoi(projectIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	// プロジェクトの存在確認
	project, err := h.projectService.GetProjectByID(uint(projectID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"project_id":   project.ID,
		"project_name": project.Name,
		"project_type": project.ProjectType,
	})
}

// AutoCreateCSPAccount はCSP申請承認時に自動でCSPアカウントを作成（内部API用）
func (h *InternalHandler) AutoCreateCSPAccount(c *gin.Context) {
	type AutoCreateRequest struct {
		CSPRequestID string `json:"csp_request_id" binding:"required"`
		Provider     string `json:"provider" binding:"required"`
		AccountName  string `json:"account_name" binding:"required"`
		ProjectID    int    `json:"project_id" binding:"required"`
	}

	var req AutoCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// CreatorIDをヘッダーから取得（メールアドレスまたは数値ID）
	creatorIDStr := c.GetHeader("X-Creator-ID")
	if creatorIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Creator ID is required"})
		return
	}

	// まず数値IDとして解析を試行
	creatorID, err := strconv.Atoi(creatorIDStr)
	if err != nil {
		// 数値でない場合はメールアドレスとして扱い、対応するユーザーIDを取得
		// TODO: 実装では適切なユーザー検索サービスを使用
		// 暫定的にデフォルトの管理者ID（1）を使用
		creatorID = 1
		log.Printf("[INFO] Using default admin ID for email: %s", creatorIDStr)
	}

	// CSPアカウント作成リクエストを構築
	createReq := &model.CSPAccountCreateRequest{
		Provider:    model.CSPProvider(req.Provider),
		AccountName: req.AccountName,
		AccountID:   generateAccountID(req.Provider, req.AccountName), // 自動生成
		AccessKey:   generateAccessKey(),                               // 自動生成
		SecretKey:   generateSecretKey(),                               // 自動生成
		Region:      getDefaultRegion(req.Provider),                    // デフォルト地域
	}

	// CSPアカウントを作成
	cspAccount, err := h.cspService.CreateCSPAccount(uint(creatorID), createReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// プロジェクトとCSPアカウントを関連付け
	_, err = h.cspService.CreateProjectCSPAccount(uint(creatorID), uint(req.ProjectID), cspAccount.ID)
	if err != nil {
		// CSPアカウントは作成されているが、関連付けに失敗
		// ログに記録してエラーを返す
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":         "Failed to associate CSP account with project",
			"csp_account_id": cspAccount.ID,
			"details":       err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":        "CSP account created and associated successfully",
		"csp_account":    cspAccount,
		"csp_request_id": req.CSPRequestID,
	})
}

// Helper functions for auto-generation
func generateAccountID(provider, accountName string) string {
	// 実際の実装では、より適切なアカウントID生成ロジックを使用
	return fmt.Sprintf("%s-%s-%d", provider, accountName, time.Now().Unix())
}

func generateAccessKey() string {
	// 実際の実装では、より安全なキー生成ロジックを使用
	return fmt.Sprintf("AK%d%d", time.Now().Unix(), time.Now().Nanosecond()%10000)
}

func generateSecretKey() string {
	// 実際の実装では、より安全なキー生成ロジックを使用
	return fmt.Sprintf("SK%d%d", time.Now().Unix(), time.Now().Nanosecond()%10000)
}

func getDefaultRegion(provider string) string {
	switch provider {
	case "aws":
		return "ap-northeast-1"
	case "gcp":
		return "asia-northeast1"
	case "azure":
		return "japaneast"
	default:
		return "default"
	}
}
