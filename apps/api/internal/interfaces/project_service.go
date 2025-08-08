package interfaces

import "go-nextjs-api/internal/model"

type ProjectService interface {
	GetUserProjects(userID uint) ([]model.UserProjectResponse, error)
	GetProjectsByType(projectType string) ([]model.Project, error)
	GetProjectByID(projectID uint) (*model.ProjectResponse, error)
	GetProjectMembers(projectID uint, page, limit int) ([]model.ProjectMemberResponse, int, error)
	CreateProject(userID uint, req *model.ProjectCreateRequest) (*model.ProjectResponse, error)
	UpdateProject(userID, projectID uint, req *model.ProjectUpdateRequest) (*model.ProjectResponse, error)
	DeleteProject(userID, projectID uint) error
	AddUserToProject(projectID, userID uint, role model.Role) error
	UpdateUserProjectRole(projectID, userID uint, role model.Role) error
	RemoveUserFromProject(projectID, userID uint) error
	CheckProjectPermission(userID, projectID uint) (*model.ProjectPermissionResponse, error)
	CheckAdminProjectPermission(userID uint, projectID uint) (*model.ProjectPermissionResponse, error)
	
	// ベンダープロジェクト紐付け関連
	GetVendorRelations(userID, projectID uint) ([]model.ProjectVendorRelation, error)
	CreateVendorRelation(userID, projectID, vendorProjectID uint) error
	DeleteVendorRelation(userID, projectID, relationID uint) error
}