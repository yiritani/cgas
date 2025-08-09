package handler

import (
	"csp-provisioning-service/internal/model"
	"csp-provisioning-service/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type CSPRequestHandler struct {
	service service.CSPRequestService
}

func NewCSPRequestHandler(service service.CSPRequestService) *CSPRequestHandler {
	return &CSPRequestHandler{service: service}
}

// GetCSPRequests はCSP Provisioning一覧を取得（ページング対応）
func (h *CSPRequestHandler) GetCSPRequests(c *gin.Context) {
	// クエリパラメータを取得
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "10")
	status := c.Query("status")
	projectIDStr := c.Query("project_id")
	userIDStr := c.Query("user_id")

	// ページとリミットを数値に変換
	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 100 {
		limit = 10
	}

	var requests []model.CSPRequest
	var pagination *model.PaginationInfo

	// フィルタリング条件によって処理を分岐
	if status != "" {
		requestStatus := model.CSPRequestStatus(status)
		if !requestStatus.IsValid() {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status parameter"})
			return
		}
		requests, err = h.service.GetByStatus(requestStatus)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	} else if projectIDStr != "" {
		projectID, err := strconv.Atoi(projectIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project_id parameter"})
			return
		}
		requests, pagination, err = h.service.GetByProjectIDWithPagination(uint(projectID), page, limit)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	} else if userIDStr != "" {
		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id parameter"})
			return
		}
		requests, err = h.service.GetByUserID(uint(userID))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	} else {
		// 通常のページング
		requests, pagination, err = h.service.GetWithPagination(page, limit)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	response := gin.H{"data": requests}
	if pagination != nil {
		response["pagination"] = pagination
	}

	c.JSON(http.StatusOK, response)
}

// GetCSPRequest はCSP Provisioning詳細を取得
func (h *CSPRequestHandler) GetCSPRequest(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	request, err := h.service.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "CSP provisioning not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": request})
}

// CreateCSPRequest はCSP Provisioningを作成
func (h *CSPRequestHandler) CreateCSPRequest(c *gin.Context) {
	var req model.CSPRequestCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ユーザーIDをコンテキストから取得
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	request, err := h.service.Create(userID.(uint), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": request})
}

// UpdateCSPRequest はCSP Provisioningを更新
func (h *CSPRequestHandler) UpdateCSPRequest(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req model.CSPRequestUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ユーザーIDをコンテキストから取得
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	request, err := h.service.Update(uint(id), userID.(uint), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": request})
}

// ReviewCSPRequest はCSP Provisioningをレビュー（承認/却下）
func (h *CSPRequestHandler) ReviewCSPRequest(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req model.CSPRequestReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// レビューワーIDをコンテキストから取得
	reviewerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	request, err := h.service.Review(uint(id), reviewerID.(uint), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": request})
}

// DeleteCSPRequest はCSP Provisioningを削除
func (h *CSPRequestHandler) DeleteCSPRequest(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	// ユーザーIDをコンテキストから取得
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	err = h.service.Delete(uint(id), userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "CSP request deleted successfully"})
}
