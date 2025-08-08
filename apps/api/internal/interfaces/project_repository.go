package interfaces

import "go-nextjs-api/internal/model"

type ProjectRepository interface {
	// プロジェクト関連
	SelectUserProjects(userID uint) ([]model.UserProjectResponse, error)
	SelectByID(id uint) (*model.ProjectDetails, error)
	SelectByType(projectType string) ([]model.Project, error)
	Insert(project *model.Project) error
	Update(project *model.Project) error
	Delete(id uint) error
	
	// プロジェクトメンバー関連
	SelectProjectMembers(projectID uint, page, limit int) ([]model.ProjectMemberResponse, *model.PaginationInfo, error)
	SelectUserRole(projectID, userID uint) (string, error)
	InsertMember(projectID, userID uint, role string) error
	UpdateMemberRole(projectID, userID uint, role string) error
	DeleteMember(projectID, userID uint) error
	CountProjectOwners(projectID uint) (int64, error)
	IsMember(projectID, userID uint) (bool, error)
	
	// ベンダープロジェクト紐付け関連
	SelectVendorRelationsByProjectID(projectID uint) ([]model.ProjectVendorRelation, error)
	InsertVendorRelation(relation *model.ProjectVendorRelation) error
	DeleteVendorRelation(relationID uint) error
	
	// 管理者権限関連
	CheckAdminProjectPermission(userID uint) (*model.ProjectPermissionResponse, error)
}