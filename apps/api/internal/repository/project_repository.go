package repository

import (
	"go-nextjs-api/internal/interfaces"
	"go-nextjs-api/internal/model"

	"gorm.io/gorm"
)

type projectRepository struct {
	db *gorm.DB
}

func NewProjectRepository(db *gorm.DB) interfaces.ProjectRepository {
	return &projectRepository{db: db}
}

// SelectUserProjects はユーザーが所属するプロジェクト一覧を取得
func (r *projectRepository) SelectUserProjects(userID uint) ([]model.UserProjectResponse, error) {
	var userProjects []model.UserProjectResponse

	query := `
		SELECT 
			p.id as project_id,
			p.name,
			p.description,
			p.status,
			p.project_type,
			upr.role,
			upr.created_at as joined_at
		FROM projects p
		JOIN user_project_roles upr ON p.id = upr.project_id
		WHERE upr.user_id = ? AND upr.deleted_at IS NULL AND p.deleted_at IS NULL
		ORDER BY upr.created_at DESC
	`

	if err := r.db.Raw(query, userID).Scan(&userProjects).Error; err != nil {
		return nil, err
	}

	return userProjects, nil
}

// SelectByID はプロジェクト詳細を取得（ユーザのロール情報付き）
func (r *projectRepository) SelectByID(id uint) (*model.ProjectDetails, error) {
	var project model.Project
	if err := r.db.First(&project, id).Error; err != nil {
		return nil, err
	}

	details := &model.ProjectDetails{
		ID:             project.ID,
		Name:           project.Name,
		Description:    project.Description,
		Status:         project.Status,
		OrganizationID: project.OrganizationID,
		ProjectType:    project.ProjectType,
		CreatedAt:      project.CreatedAt,
		UpdatedAt:      project.UpdatedAt,
	}

	return details, nil
}

// Insert はプロジェクトを作成
func (r *projectRepository) Insert(project *model.Project) error {
	return r.db.Create(project).Error
}

// Update はプロジェクトを更新
func (r *projectRepository) Update(project *model.Project) error {
	return r.db.Save(project).Error
}

// Delete はプロジェクトを削除
func (r *projectRepository) Delete(id uint) error {
	return r.db.Delete(&model.Project{}, id).Error
}

// SelectProjectMembers はプロジェクトメンバー一覧を取得（ページング対応）
func (r *projectRepository) SelectProjectMembers(projectID uint, page, limit int) ([]model.ProjectMemberResponse, *model.PaginationInfo, error) {
	// ページネーション設定
	offset := (page - 1) * limit

	// メンバー一覧を取得（GORM記法）
	var members []model.ProjectMemberResponse
	if err := r.db.Table("users u").
		Select("u.id as user_id, u.name, u.email, upr.role, upr.created_at as joined_at").
		Joins("JOIN user_project_roles upr ON u.id = upr.user_id").
		Where("upr.project_id = ? AND upr.deleted_at IS NULL AND u.deleted_at IS NULL", projectID).
		Order("upr.created_at ASC").
		Limit(limit).
		Offset(offset).
		Scan(&members).Error; err != nil {
		return nil, nil, err
	}

	// 総数を取得（GORM記法）
	var total int64
	if err := r.db.Table("users u").
		Joins("JOIN user_project_roles upr ON u.id = upr.user_id").
		Where("upr.project_id = ? AND upr.deleted_at IS NULL AND u.deleted_at IS NULL", projectID).
		Count(&total).Error; err != nil {
		return nil, nil, err
	}

	// ページネーション情報を作成
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	pagination := &model.PaginationInfo{
		Page:       page,
		Limit:      limit,
		Total:      int(total),
		TotalPages: totalPages,
		HasNext:    page < totalPages,
		HasPrev:    page > 1,
	}

	return members, pagination, nil
}

// SelectUserRole はプロジェクト内でのユーザーのロールを取得
func (r *projectRepository) SelectUserRole(projectID, userID uint) (string, error) {
	var role string
	query := `
		SELECT role 
		FROM user_project_roles 
		WHERE project_id = ? AND user_id = ? AND deleted_at IS NULL
	`
	if err := r.db.Raw(query, projectID, userID).Scan(&role).Error; err != nil {
		return "", err
	}
	return role, nil
}

// InsertMember はプロジェクトにメンバーを追加
func (r *projectRepository) InsertMember(projectID, userID uint, role string) error {
	userProjectRole := model.UserProjectRole{
		UserID:    userID,
		ProjectID: projectID,
		Role:      model.Role(role),
	}
	return r.db.Create(&userProjectRole).Error
}

// UpdateMemberRole はメンバーのロールを更新
func (r *projectRepository) UpdateMemberRole(projectID, userID uint, role string) error {
	// ロールの有効性をまず検証
	if !model.Role(role).IsValid() {
		return model.ErrInvalidRole
	}
	
	return r.db.Model(&model.UserProjectRole{}).
		Where("project_id = ? AND user_id = ?", projectID, userID).
		Update("role", role).Error
}

// DeleteMember はプロジェクトからメンバーを削除
func (r *projectRepository) DeleteMember(projectID, userID uint) error {
	return r.db.Where("project_id = ? AND user_id = ?", projectID, userID).
		Delete(&model.UserProjectRole{}).Error
}

// CountProjectOwners はプロジェクトのオーナー数をカウント
func (r *projectRepository) CountProjectOwners(projectID uint) (int64, error) {
	var count int64
	err := r.db.Model(&model.UserProjectRole{}).
		Where("project_id = ? AND role = ? AND deleted_at IS NULL", projectID, "owner").
		Count(&count).Error
	return count, err
}

// IsMember はユーザーがプロジェクトのメンバーかどうかを確認
func (r *projectRepository) IsMember(projectID, userID uint) (bool, error) {
	var count int64
	err := r.db.Model(&model.UserProjectRole{}).
		Where("project_id = ? AND user_id = ? AND deleted_at IS NULL", projectID, userID).
		Count(&count).Error
	return count > 0, err
}

// SelectByType はプロジェクトタイプでプロジェクト一覧を取得
func (r *projectRepository) SelectByType(projectType string) ([]model.Project, error) {
	var projects []model.Project
	err := r.db.Where("project_type = ?", projectType).Find(&projects).Error
	return projects, err
}

// SelectVendorRelationsByProjectID はプロジェクトのベンダー紐付け一覧を取得
func (r *projectRepository) SelectVendorRelationsByProjectID(projectID uint) ([]model.ProjectVendorRelation, error) {
	var relations []model.ProjectVendorRelation
	err := r.db.Preload("VendorProject").
		Where("project_id = ?", projectID).
		Order("created_at DESC").
		Find(&relations).Error
	return relations, err
}

// InsertVendorRelation はベンダープロジェクト紐付けを作成
func (r *projectRepository) InsertVendorRelation(relation *model.ProjectVendorRelation) error {
	return r.db.Create(relation).Error
}

// DeleteVendorRelation はベンダープロジェクト紐付けを削除
func (r *projectRepository) DeleteVendorRelation(relationID uint) error {
	return r.db.Delete(&model.ProjectVendorRelation{}, relationID).Error
}

// CheckAdminProjectPermission は管理者プロジェクトでの権限をチェック
func (r *projectRepository) CheckAdminProjectPermission(userID uint) (*model.ProjectPermissionResponse, error) {
	// 管理者プロジェクトを取得
	var adminProject model.Project
	if err := r.db.Where("name = ? AND project_type = ?", "管理者プロジェクト", "admin").First(&adminProject).Error; err != nil {
		return &model.ProjectPermissionResponse{
			HasAccess: false,
			CanView:   false,
			CanEdit:   false,
			CanManage: false,
		}, nil // 管理者プロジェクトが見つからない場合は権限なし
	}

	// ユーザーが管理者プロジェクトのメンバーかチェック
	var userRole model.UserProjectRole
	if err := r.db.Where("user_id = ? AND project_id = ?", userID, adminProject.ID).First(&userRole).Error; err != nil {
		return &model.ProjectPermissionResponse{
			HasAccess: false,
			CanView:   false,
			CanEdit:   false,
			CanManage: false,
		}, nil // 管理者プロジェクトのメンバーでない場合は権限なし
	}

	// 管理者プロジェクトでowner/adminロールの場合は全権限付与
	if userRole.Role == model.RoleOwner || userRole.Role == model.RoleAdmin {
		return &model.ProjectPermissionResponse{
			HasAccess: true,
			Role:      userRole.Role,
			CanView:   true,
			CanEdit:   true,
			CanManage: true,
		}, nil
	}

	// その他のロールは閲覧のみ
	return &model.ProjectPermissionResponse{
		HasAccess: true,
		Role:      userRole.Role,
		CanView:   true,
		CanEdit:   false,
		CanManage: false,
	}, nil
}