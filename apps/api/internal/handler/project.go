package handler

import (
	"log"
	"net/http"
	"strconv"

	"go-nextjs-api/internal/interfaces"
	"go-nextjs-api/internal/model"

	"github.com/gin-gonic/gin"
)

type ProjectHandler struct {
	projectService interfaces.ProjectService
}

func NewProjectHandler(projectService interfaces.ProjectService) *ProjectHandler {
	return &ProjectHandler{projectService: projectService}
}

// GetUserProjects は現在のユーザーが所属するプロジェクト一覧を取得
func (h *ProjectHandler) GetUserProjects(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	projects, err := h.projectService.GetUserProjects(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch user projects",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"projects": projects,
	})
}

// GetProject はプロジェクト詳細を取得
func (h *ProjectHandler) GetProject(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	projectID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid project ID",
		})
		return
	}

	// 権限チェック
	permission, err := h.projectService.CheckProjectPermission(userID.(uint), uint(projectID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to check permissions",
		})
		return
	}

	if !permission.HasAccess {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Access denied to project",
		})
		return
	}

	// プロジェクト詳細取得
	project, err := h.projectService.GetProjectByID(uint(projectID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Project not found",
		})
		return
	}

	// ユーザーのロールを設定
	project.UserRole = permission.Role

	c.JSON(http.StatusOK, project)
}

// GetProjectMembers はプロジェクトメンバー一覧を取得（ページング対応）
func (h *ProjectHandler) GetProjectMembers(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	projectID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid project ID",
		})
		return
	}

	// 権限チェック
	permission, err := h.projectService.CheckProjectPermission(userID.(uint), uint(projectID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to check permissions",
		})
		return
	}

	if !permission.HasAccess {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Access denied to project",
		})
		return
	}

	// ページネーションパラメータ取得
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	// メンバー一覧取得
	members, total, err := h.projectService.GetProjectMembers(uint(projectID), page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch project members",
		})
		return
	}

	// ページネーション情報計算
	totalPages := (total + limit - 1) / limit
	hasNext := page < totalPages
	hasPrev := page > 1

	c.JSON(http.StatusOK, gin.H{
		"members": members,
		"pagination": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"totalPages": totalPages,
			"hasNext":    hasNext,
			"hasPrev":    hasPrev,
		},
	})
}

// CreateProject はプロジェクトを作成
func (h *ProjectHandler) CreateProject(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	var req model.ProjectCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid JSON data",
		})
		return
	}

	project, err := h.projectService.CreateProject(userID.(uint), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create project",
		})
		return
	}

	c.JSON(http.StatusCreated, project)
}

// UpdateProject はプロジェクトを更新
func (h *ProjectHandler) UpdateProject(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	projectID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid project ID",
		})
		return
	}

	var req model.ProjectUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid JSON data",
		})
		return
	}

	project, err := h.projectService.UpdateProject(userID.(uint), uint(projectID), &req)
	if err != nil {
		if err == model.ErrInsufficientPermissions {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Insufficient permissions",
			})
			return
		}
		if err == model.ErrProjectNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Project not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update project",
		})
		return
	}

	c.JSON(http.StatusOK, project)
}

// DeleteProject はプロジェクトを削除
func (h *ProjectHandler) DeleteProject(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	projectID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid project ID",
		})
		return
	}

	if err := h.projectService.DeleteProject(userID.(uint), uint(projectID)); err != nil {
		if err == model.ErrInsufficientPermissions {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Only project owners can delete projects",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete project",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Project deleted successfully",
	})
}

// AddProjectMember はプロジェクトにメンバーを追加
func (h *ProjectHandler) AddProjectMember(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	projectID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid project ID",
		})
		return
	}

	// 権限チェック（管理者以上）
	permission, err := h.projectService.CheckProjectPermission(userID.(uint), uint(projectID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to check permissions",
		})
		return
	}

	if !permission.CanManage {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Insufficient permissions to add members",
		})
		return
	}

	var req model.UserProjectRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid JSON data",
		})
		return
	}

	if err := h.projectService.AddUserToProject(uint(projectID), req.UserID, req.Role); err != nil {
		if err == model.ErrUserNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "User not found",
			})
			return
		}
		if err == model.ErrUserProjectRoleAlreadyExists {
			c.JSON(http.StatusConflict, gin.H{
				"error": "User is already a member of this project",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to add project member",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Member added to project successfully",
	})
}

// UpdateProjectMemberRole はプロジェクトメンバーのロールを更新
func (h *ProjectHandler) UpdateProjectMemberRole(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	projectID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid project ID",
		})
		return
	}

	memberID, err := strconv.ParseUint(c.Param("memberId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid member ID",
		})
		return
	}

	// 権限チェック（管理者以上）
	permission, err := h.projectService.CheckProjectPermission(userID.(uint), uint(projectID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to check permissions",
		})
		return
	}

	if !permission.CanManage {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Insufficient permissions to update member roles",
		})
		return
	}

	var req model.UserProjectRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("UpdateProjectMemberRole: Invalid JSON data - %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid JSON data",
		})
		return
	}

	log.Printf("UpdateProjectMemberRole: projectID=%d, memberID=%d, role=%s", projectID, memberID, req.Role)

	if err := h.projectService.UpdateUserProjectRole(uint(projectID), uint(memberID), req.Role); err != nil {
		log.Printf("UpdateProjectMemberRole: Service error - %v", err)
		if err == model.ErrUserProjectRoleNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Project member not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update member role",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Member role updated successfully",
	})
}

// RemoveProjectMember はプロジェクトからメンバーを削除
func (h *ProjectHandler) RemoveProjectMember(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	projectID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid project ID",
		})
		return
	}

	memberID, err := strconv.ParseUint(c.Param("memberId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid member ID",
		})
		return
	}

	// 権限チェック（管理者以上）
	permission, err := h.projectService.CheckProjectPermission(userID.(uint), uint(projectID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to check permissions",
		})
		return
	}

	if !permission.CanManage {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Insufficient permissions to remove members",
		})
		return
	}

	if err := h.projectService.RemoveUserFromProject(uint(projectID), uint(memberID)); err != nil {
		if err == model.ErrUserProjectRoleNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Project member not found",
			})
			return
		}
		if err == model.ErrCannotRemoveLastOwner {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Cannot remove the last owner from project",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to remove project member",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Member removed from project successfully",
	})
}

// GetProjectsByType はプロジェクトタイプでプロジェクト一覧を取得
func (h *ProjectHandler) GetProjectsByType(c *gin.Context) {
	projectType := c.Query("type")
	if projectType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Project type is required"})
		return
	}

	projects, err := h.projectService.GetProjectsByType(projectType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get projects"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"projects": projects})
}

// GetVendorRelations はプロジェクトのベンダー紐付け一覧を取得
func (h *ProjectHandler) GetVendorRelations(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	projectIDParam := c.Param("id")
	projectID, err := strconv.ParseUint(projectIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	relations, err := h.projectService.GetVendorRelations(userID.(uint), uint(projectID))
	if err != nil {
		if err == model.ErrUserNotProjectMember {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied to this project"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get vendor relations"})
		return
	}

	c.JSON(http.StatusOK, relations)
}

// CreateVendorRelation はベンダープロジェクト紐付けを作成
func (h *ProjectHandler) CreateVendorRelation(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	projectIDParam := c.Param("id")
	projectID, err := strconv.ParseUint(projectIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	var req struct {
		VendorProjectID uint `json:"vendor_project_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	err = h.projectService.CreateVendorRelation(userID.(uint), uint(projectID), req.VendorProjectID)
	if err != nil {
		if err == model.ErrInsufficientPermission {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permission"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create vendor relation"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Vendor relation created successfully"})
}

// DeleteVendorRelation はベンダープロジェクト紐付けを削除
func (h *ProjectHandler) DeleteVendorRelation(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	projectIDParam := c.Param("id")
	projectID, err := strconv.ParseUint(projectIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	relationIDParam := c.Param("relationId")
	relationID, err := strconv.ParseUint(relationIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid relation ID"})
		return
	}

	err = h.projectService.DeleteVendorRelation(userID.(uint), uint(projectID), uint(relationID))
	if err != nil {
		if err == model.ErrInsufficientPermission {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permission"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete vendor relation"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Vendor relation deleted successfully"})
}