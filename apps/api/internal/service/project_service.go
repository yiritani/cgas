package service

import (
	"log"

	"go-nextjs-api/internal/interfaces"
	"go-nextjs-api/internal/model"
)

type projectService struct {
	userRepo    interfaces.UserRepository
	projectRepo interfaces.ProjectRepository
}

func NewProjectService(userRepo interfaces.UserRepository, projectRepo interfaces.ProjectRepository) interfaces.ProjectService {
	return &projectService{
		userRepo:    userRepo,
		projectRepo: projectRepo,
	}
}

// GetUserProjects はユーザーが所属するプロジェクト一覧を取得
func (s *projectService) GetUserProjects(userID uint) ([]model.UserProjectResponse, error) {
	return s.projectRepo.SelectUserProjects(userID)
}

// GetProjectByID はプロジェクト詳細を取得
func (s *projectService) GetProjectByID(projectID uint) (*model.ProjectResponse, error) {
	details, err := s.projectRepo.SelectByID(projectID)
	if err != nil {
		return nil, err
	}

	response := &model.ProjectResponse{
		ID:             details.ID,
		Name:           details.Name,
		Description:    details.Description,
		Status:         details.Status,
		OrganizationID: details.OrganizationID,
		ProjectType:    details.ProjectType,
		CreatedAt:      details.CreatedAt,
		UpdatedAt:      details.UpdatedAt,
	}

	return response, nil
}

// GetProjectMembers はプロジェクトメンバー一覧を取得（ページング対応）
func (s *projectService) GetProjectMembers(projectID uint, page, limit int) ([]model.ProjectMemberResponse, int, error) {
	// ページネーション設定
	if page <= 0 {
		page = 1
	}
	if limit <= 0 || limit > 100 {
		limit = 10
	}

	members, pagination, err := s.projectRepo.SelectProjectMembers(projectID, page, limit)
	if err != nil {
		return nil, 0, err
	}

	return members, pagination.Total, nil
}

// CreateProject はプロジェクトを作成
func (s *projectService) CreateProject(userID uint, req *model.ProjectCreateRequest) (*model.ProjectResponse, error) {
	// ユーザーの存在確認
	_, err := s.userRepo.SelectByID(userID)
	if err != nil {
		return nil, model.ErrUserNotFound
	}

	// デフォルトステータス設定
	status := req.Status
	if status == "" {
		status = model.ProjectStatusActive
	}

	// プロジェクト作成
	project := model.Project{
		Name:           req.Name,
		Description:    req.Description,
		Status:         status,
		OrganizationID: req.OrganizationID,
		ProjectType: req.ProjectType,
	}

	if err := s.projectRepo.Insert(&project); err != nil {
		return nil, err
	}

	// 作成者をオーナーとして追加
	if err := s.projectRepo.InsertMember(project.ID, userID, string(model.RoleOwner)); err != nil {
		return nil, err
	}

	response := &model.ProjectResponse{
		ID:             project.ID,
		Name:           project.Name,
		Description:    project.Description,
		Status:         project.Status,
		OrganizationID: project.OrganizationID,
		ProjectType:    project.ProjectType,
		CreatedAt:      project.CreatedAt,
		UpdatedAt:      project.UpdatedAt,
		UserRole:       model.RoleOwner,
	}

	return response, nil
}

// UpdateProject はプロジェクトを更新
func (s *projectService) UpdateProject(userID, projectID uint, req *model.ProjectUpdateRequest) (*model.ProjectResponse, error) {
	// 権限チェック
	permission, err := s.CheckProjectPermission(userID, projectID)
	if err != nil {
		return nil, err
	}

	if !permission.CanManage {
		return nil, model.ErrInsufficientPermissions
	}

	// プロジェクト詳細取得
	details, err := s.projectRepo.SelectByID(projectID)
	if err != nil {
		return nil, model.ErrProjectNotFound
	}

	// 更新用のProjectオブジェクトを作成
	project := &model.Project{
		ID:             details.ID,
		Name:           details.Name,
		Description:    details.Description,
		Status:         details.Status,
		OrganizationID: details.OrganizationID,
		ProjectType:    details.ProjectType,
		CreatedAt:      details.CreatedAt,
		UpdatedAt:      details.UpdatedAt,
	}

	// 更新処理
	if req.Name != "" {
		project.Name = req.Name
	}
	if req.Description != nil {
		project.Description = *req.Description
	}
	if req.Status != "" {
		project.Status = req.Status
	}
	if req.OrganizationID != 0 {
		project.OrganizationID = req.OrganizationID
	}

	if err := s.projectRepo.Update(project); err != nil {
		return nil, err
	}

	response := &model.ProjectResponse{
		ID:             project.ID,
		Name:           project.Name,
		Description:    project.Description,
		Status:         project.Status,
		OrganizationID: project.OrganizationID,
		ProjectType:    project.ProjectType,
		CreatedAt:      project.CreatedAt,
		UpdatedAt:      project.UpdatedAt,
		UserRole:       permission.Role,
	}

	return response, nil
}

// DeleteProject はプロジェクトを削除
func (s *projectService) DeleteProject(userID, projectID uint) error {
	// 権限チェック（オーナーのみ）
	permission, err := s.CheckProjectPermission(userID, projectID)
	if err != nil {
		return err
	}

	if permission.Role != model.RoleOwner {
		return model.ErrInsufficientPermissions
	}

	// プロジェクト削除（ソフトデリート）
	return s.projectRepo.Delete(projectID)
}

// AddUserToProject はプロジェクトにユーザーを追加
func (s *projectService) AddUserToProject(projectID, userID uint, role model.Role) error {
	// ユーザーの存在確認
	_, err := s.userRepo.SelectByID(userID)
	if err != nil {
		return model.ErrUserNotFound
	}

	// プロジェクトの存在確認
	_, err = s.projectRepo.SelectByID(projectID)
	if err != nil {
		return model.ErrProjectNotFound
	}

	// 既に参加していないかチェック
	isMember, err := s.projectRepo.IsMember(projectID, userID)
	if err != nil {
		return err
	}
	if isMember {
		return model.ErrUserProjectRoleAlreadyExists
	}

	// ロール追加
	return s.projectRepo.InsertMember(projectID, userID, string(role))
}

// UpdateUserProjectRole はユーザーのプロジェクトロールを更新
func (s *projectService) UpdateUserProjectRole(projectID, userID uint, role model.Role) error {
	log.Printf("UpdateUserProjectRole: Start - projectID=%d, userID=%d, role=%s", projectID, userID, role)
	
	// メンバーシップの確認
	isMember, err := s.projectRepo.IsMember(projectID, userID)
	if err != nil {
		log.Printf("UpdateUserProjectRole: IsMember error - %v", err)
		return err
	}
	if !isMember {
		log.Printf("UpdateUserProjectRole: User is not a member - projectID=%d, userID=%d", projectID, userID)
		return model.ErrUserProjectRoleNotFound
	}

	log.Printf("UpdateUserProjectRole: Updating role - projectID=%d, userID=%d, role=%s", projectID, userID, role)
	err = s.projectRepo.UpdateMemberRole(projectID, userID, string(role))
	if err != nil {
		log.Printf("UpdateUserProjectRole: UpdateMemberRole error - %v", err)
		return err
	}
	
	log.Printf("UpdateUserProjectRole: Success - projectID=%d, userID=%d, role=%s", projectID, userID, role)
	return nil
}

// RemoveUserFromProject はプロジェクトからユーザーを削除
func (s *projectService) RemoveUserFromProject(projectID, userID uint) error {
	// オーナーが最後の一人の場合は削除を禁止
	ownerCount, err := s.projectRepo.CountProjectOwners(projectID)
	if err != nil {
		return err
	}

	// ユーザーのロールを確認
	userRole, err := s.projectRepo.SelectUserRole(projectID, userID)
	if err != nil {
		return model.ErrUserProjectRoleNotFound
	}

	if userRole == string(model.RoleOwner) && ownerCount <= 1 {
		return model.ErrCannotRemoveLastOwner
	}

	return s.projectRepo.DeleteMember(projectID, userID)
}

// CheckProjectPermission はプロジェクト権限をチェック
func (s *projectService) CheckProjectPermission(userID, projectID uint) (*model.ProjectPermissionResponse, error) {
	// ユーザーのロールを取得
	userRole, err := s.projectRepo.SelectUserRole(projectID, userID)
	if err != nil {
		// メンバーでない場合
		return &model.ProjectPermissionResponse{
			HasAccess: false,
			CanView:   false,
			CanEdit:   false,
			CanManage: false,
		}, nil
	}

	role := model.Role(userRole)
	response := &model.ProjectPermissionResponse{
		HasAccess: true,
		Role:      role,
		CanView:   role.CanViewProject(),
		CanEdit:   role.CanEditProject(),
		CanManage: role.CanManageProject(),
	}

	return response, nil
}

// GetProjectsByType はプロジェクトタイプでプロジェクト一覧を取得
func (s *projectService) GetProjectsByType(projectType string) ([]model.Project, error) {
	return s.projectRepo.SelectByType(projectType)
}

// GetVendorRelations はプロジェクトのベンダー紐付け一覧を取得
func (s *projectService) GetVendorRelations(userID, projectID uint) ([]model.ProjectVendorRelation, error) {
	// プロジェクトメンバーかどうかを確認
	isMember, err := s.projectRepo.IsMember(projectID, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, model.ErrUserNotProjectMember
	}

	return s.projectRepo.SelectVendorRelationsByProjectID(projectID)
}

// CreateVendorRelation はベンダープロジェクト紐付けを作成
func (s *projectService) CreateVendorRelation(userID, projectID, vendorProjectID uint) error {
	// プロジェクトの管理権限があるかどうかを確認
	permission, err := s.CheckProjectPermission(userID, projectID)
	if err != nil {
		return err
	}
	if !permission.CanManage {
		return model.ErrInsufficientPermission
	}

	// 紐付けを作成
	relation := &model.ProjectVendorRelation{
		ProjectID:       projectID,
		VendorProjectID: vendorProjectID,
	}

	return s.projectRepo.InsertVendorRelation(relation)
}

// DeleteVendorRelation はベンダープロジェクト紐付けを削除
func (s *projectService) DeleteVendorRelation(userID, projectID, relationID uint) error {
	// プロジェクトの管理権限があるかどうかを確認
	permission, err := s.CheckProjectPermission(userID, projectID)
	if err != nil {
		return err
	}
	if !permission.CanManage {
		return model.ErrInsufficientPermission
	}

	return s.projectRepo.DeleteVendorRelation(relationID)
}