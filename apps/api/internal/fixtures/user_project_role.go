package fixtures

import (
	"log"

	"go-nextjs-api/internal/model"

	"gorm.io/gorm"
)

// UserProjectRoleFixtures はユーザープロジェクトロール関連のフィクスチャデータを管理
type UserProjectRoleFixtures struct {
	db              *gorm.DB
	userFixtures    *UserFixtures
	projectFixtures *ProjectFixtures
}

// NewUserProjectRoleFixtures はUserProjectRoleFixturesのインスタンスを作成
func NewUserProjectRoleFixtures(db *gorm.DB, userFixtures *UserFixtures, projectFixtures *ProjectFixtures) *UserProjectRoleFixtures {
	return &UserProjectRoleFixtures{
		db:              db,
		userFixtures:    userFixtures,
		projectFixtures: projectFixtures,
	}
}

// GetDefaultUserProjectRoles はデフォルトユーザープロジェクトロールの設定を返す  
func (f *UserProjectRoleFixtures) GetDefaultUserProjectRoles() ([]model.UserProjectRole, error) {
	// プロジェクトを取得
	adminProject, err := f.projectFixtures.GetProjectAdmin()
	if err != nil {
		return nil, err
	}
	adminUser, err := f.userFixtures.GetUserAdmin()
	if err != nil {
		return nil, err
	}
	
	sanseitouProject1, err := f.projectFixtures.GetProjectSanseitou1()
	if err != nil {
		return nil, err
	}
	sanseitouProject2, err := f.projectFixtures.GetProjectSanseitou2()
	if err != nil {
		return nil, err
	}
	shinseiProject, err := f.projectFixtures.GetProjectShinsei()
	if err != nil {
		return nil, err
	}
	localGovProject, err := f.projectFixtures.GetProjectLocalGov()
	if err != nil {
		return nil, err
	}
	publicProject, err := f.projectFixtures.GetProjectPublic()
	if err != nil {
		return nil, err
	}
	independentProject, err := f.projectFixtures.GetProjectIndependent()
	if err != nil {
		return nil, err
	}
	vendorProject, err := f.projectFixtures.GetProjectVendor()
	if err != nil {
		return nil, err
	}

	// ユーザーを取得
	sanseiOwner, err := f.userFixtures.GetUserSanseiOwner()
	if err != nil {
		return nil, err
	}
	sanseiAdmin, err := f.userFixtures.GetUserSanseiAdmin()
	if err != nil {
		return nil, err
	}
	sanseiViewer, err := f.userFixtures.GetUserSanseiViewer()
	if err != nil {
		return nil, err
	}
	shinseiOwner, err := f.userFixtures.GetUserShinseiOwner()
	if err != nil {
		return nil, err
	}
	shinseiAdmin, err := f.userFixtures.GetUserShinseiAdmin()
	if err != nil {
		return nil, err
	}
	shinseiViewer, err := f.userFixtures.GetUserShinseiViewer()
	if err != nil {
		return nil, err
	}
	localOwner, err := f.userFixtures.GetUserLocalOwner()
	if err != nil {
		return nil, err
	}
	publicOwner, err := f.userFixtures.GetUserPublicOwner()
	if err != nil {
		return nil, err
	}
	publicAdmin, err := f.userFixtures.GetUserPublicAdmin()
	if err != nil {
		return nil, err
	}
	publicViewer, err := f.userFixtures.GetUserPublicViewer()
	if err != nil {
		return nil, err
	}
	independentOwner, err := f.userFixtures.GetUserIndependentOwner()
	if err != nil {
		return nil, err
	}
	vendorOwner, err := f.userFixtures.GetUserVendorOwner()
	if err != nil {
		return nil, err
	}
	vendorAdmin, err := f.userFixtures.GetUserVendorAdmin()
	if err != nil {
		return nil, err
	}
	vendorViewer, err := f.userFixtures.GetUserVendorViewer()
	if err != nil {
		return nil, err
	}

	// ユーザープロジェクトロールを作成
	userProjectRoles := []model.UserProjectRole{
		// === 管理者プロジェクト ===
		{UserID: adminUser.ID, ProjectID: adminProject.ID, Role: model.RoleOwner},

		// === 参政党プロジェクト群 ===
		// 参政第一プロジェクト
		{UserID: sanseiOwner.ID, ProjectID: sanseitouProject1.ID, Role: model.RoleOwner},
		{UserID: sanseiAdmin.ID, ProjectID: sanseitouProject1.ID, Role: model.RoleAdmin},
		{UserID: sanseiViewer.ID, ProjectID: sanseitouProject1.ID, Role: model.RoleViewer},
		
		// 参政第二プロジェクト
		{UserID: sanseiOwner.ID, ProjectID: sanseitouProject2.ID, Role: model.RoleAdmin}, // 別プロジェクトでは管理者
		{UserID: sanseiAdmin.ID, ProjectID: sanseitouProject2.ID, Role: model.RoleOwner}, // 別プロジェクトではオーナー

		// === 再生党プロジェクト ===
		{UserID: shinseiOwner.ID, ProjectID: shinseiProject.ID, Role: model.RoleOwner},
		{UserID: shinseiAdmin.ID, ProjectID: shinseiProject.ID, Role: model.RoleAdmin},
		{UserID: shinseiViewer.ID, ProjectID: shinseiProject.ID, Role: model.RoleViewer},

		// === 地方自治体プロジェクト ===
		{UserID: localOwner.ID, ProjectID: localGovProject.ID, Role: model.RoleOwner},

		// === 公共プロジェクト ===
		{UserID: publicOwner.ID, ProjectID: publicProject.ID, Role: model.RoleOwner},
		{UserID: publicAdmin.ID, ProjectID: publicProject.ID, Role: model.RoleAdmin},
		{UserID: publicViewer.ID, ProjectID: publicProject.ID, Role: model.RoleViewer},

		// === 独立プロジェクト ===
		{UserID: independentOwner.ID, ProjectID: independentProject.ID, Role: model.RoleOwner},

		// === ベンダープロジェクト ===
		{UserID: vendorOwner.ID, ProjectID: vendorProject.ID, Role: model.RoleOwner},
		{UserID: vendorAdmin.ID, ProjectID: vendorProject.ID, Role: model.RoleAdmin},
		{UserID: vendorViewer.ID, ProjectID: vendorProject.ID, Role: model.RoleViewer},
	}

	return userProjectRoles, nil
}

// Seed はユーザープロジェクトロールの初期データを投入
func (f *UserProjectRoleFixtures) Seed() error {
	var count int64
	f.db.Model(&model.UserProjectRole{}).Count(&count)

	if count > 0 {
		log.Println("User project roles already exist, skipping role seed")
		return nil
	}

	userProjectRoles, err := f.GetDefaultUserProjectRoles()
	if err != nil {
		return err
	}

	for _, upr := range userProjectRoles {
		if err := f.db.Create(&upr).Error; err != nil {
			return err
		}
		log.Printf("✅ Assigned role %s to user %d in project %d", upr.Role, upr.UserID, upr.ProjectID)
	}

	return nil
}

// MigrateExistingUserRoles は既存のユーザーロールをプロジェクトベースのロールに移行
func (f *UserProjectRoleFixtures) MigrateExistingUserRoles() error {
	// デフォルトプロジェクト「システム」を作成または取得
	defaultProject, err := f.projectFixtures.CreateOrGetDefaultProject()
	if err != nil {
		return err
	}

	// 既存のユーザーがいるかチェック
	var userCount int64
	f.db.Model(&model.User{}).Count(&userCount)
	
	if userCount == 0 {
		log.Println("No existing users found, skipping role migration")
		return nil
	}

	// roleカラムが存在するかチェック
	if !f.db.Migrator().HasColumn(&model.User{}, "role") {
		log.Println("Role column does not exist in users table, skipping migration")
		return nil
	}

	// 既存ユーザーのロールを取得して移行
	var users []struct {
		ID   uint   `gorm:"column:id"`
		Role string `gorm:"column:role"`
	}
	
	if err := f.db.Table("users").Select("id, role").Find(&users).Error; err != nil {
		return err
	}

	for _, user := range users {
		// 既存のユーザープロジェクトロールをチェック
		var existingUPR model.UserProjectRole
		result := f.db.Where("user_id = ? AND project_id = ?", user.ID, defaultProject.ID).First(&existingUPR)
		
		if result.Error == nil {
			// 既に存在する場合はスキップ
			continue
		}

		// 既存のロールをマッピング
		var newRole model.Role
		switch user.Role {
		case "admin":
			newRole = model.RoleAdmin
		case "user":
			newRole = model.RoleViewer
		default:
			newRole = model.RoleViewer
		}

		// UserProjectRoleレコードを作成
		userProjectRole := model.UserProjectRole{
			UserID:    user.ID,
			ProjectID: defaultProject.ID,
			Role:      newRole,
		}

		if err := f.db.Create(&userProjectRole).Error; err != nil {
			log.Printf("Warning: Failed to migrate role for user %d: %v", user.ID, err)
			continue
		}
		
		log.Printf("✅ Migrated user %d from role '%s' to '%s' in default project", user.ID, user.Role, newRole)
	}

	return nil
}

// GetUserProjectsByUserEmail は特定のユーザーのプロジェクト一覧を返す（テスト用）
func (f *UserProjectRoleFixtures) GetUserProjectsByUserEmail(email string) ([]model.UserProjectResponse, error) {
	user, err := f.userFixtures.GetUserByEmail(email)
	if err != nil {
		return nil, err
	}

	var userProjects []struct {
		ProjectID   uint   `gorm:"column:project_id"`
		ProjectName string `gorm:"column:name"`
		Description string `gorm:"column:description"`
		Status      string `gorm:"column:status"`
		Role        string `gorm:"column:role"`
		JoinedAt    string `gorm:"column:created_at"`
	}

	err = f.db.Table("user_project_roles").
		Select("projects.id as project_id, projects.name, projects.description, projects.status, user_project_roles.role, user_project_roles.created_at").
		Joins("JOIN projects ON user_project_roles.project_id = projects.id").
		Where("user_project_roles.user_id = ?", user.ID).
		Find(&userProjects).Error

	if err != nil {
		return nil, err
	}

	var result []model.UserProjectResponse
	for _, up := range userProjects {
		result = append(result, model.UserProjectResponse{
			ProjectID:   up.ProjectID,
			Name:        up.ProjectName,
			Description: up.Description,
			Status:      model.ProjectStatus(up.Status),
			Role:        model.Role(up.Role),
		})
	}

	return result, nil
}

// GetTestUserProjectRoleData はテスト用の特定パターンのデータを返す
func (f *UserProjectRoleFixtures) GetTestUserProjectRoleData(pattern string) ([]model.UserProjectRole, error) {
	switch pattern {
	case "multi_project_user":
		// 複数プロジェクトに参加しているユーザーのテストデータ
		return f.getMultiProjectUserData()
	case "cross_organization":
		// 組織横断的なユーザーのテストデータ
		return f.getCrossOrganizationData()
	case "role_hierarchy":
		// 役割階層のテストデータ
		return f.getRoleHierarchyData()
	case "minimal":
		// 最小限のテストデータ
		return f.getMinimalTestData()
	default:
		return f.GetDefaultUserProjectRoles()
	}
}

// getMultiProjectUserData 複数プロジェクト参加のテストデータ
func (f *UserProjectRoleFixtures) getMultiProjectUserData() ([]model.UserProjectRole, error) {
	sanseiAdmin, _ := f.userFixtures.GetUserSanseiAdmin()
	project1, _ := f.projectFixtures.GetProjectSanseitou1()
	project2, _ := f.projectFixtures.GetProjectShinsei()
	project3, _ := f.projectFixtures.GetProjectPublic()

	return []model.UserProjectRole{
		{UserID: sanseiAdmin.ID, ProjectID: project1.ID, Role: model.RoleOwner},
		{UserID: sanseiAdmin.ID, ProjectID: project2.ID, Role: model.RoleAdmin},
		{UserID: sanseiAdmin.ID, ProjectID: project3.ID, Role: model.RoleViewer},
	}, nil
}

// getCrossOrganizationData 組織横断的なテストデータ
func (f *UserProjectRoleFixtures) getCrossOrganizationData() ([]model.UserProjectRole, error) {
	publicAdmin, _ := f.userFixtures.GetUserPublicAdmin()
	sanseiProject, _ := f.projectFixtures.GetProjectSanseitou1()
	shinseiProject, _ := f.projectFixtures.GetProjectShinsei()
	localProject, _ := f.projectFixtures.GetProjectLocalGov()

	return []model.UserProjectRole{
		{UserID: publicAdmin.ID, ProjectID: sanseiProject.ID, Role: model.RoleViewer},
		{UserID: publicAdmin.ID, ProjectID: shinseiProject.ID, Role: model.RoleViewer},
		{UserID: publicAdmin.ID, ProjectID: localProject.ID, Role: model.RoleAdmin},
	}, nil
}

// getRoleHierarchyData 役割階層のテストデータ
func (f *UserProjectRoleFixtures) getRoleHierarchyData() ([]model.UserProjectRole, error) {
	owner, _ := f.userFixtures.GetUserSanseiOwner()
	admin, _ := f.userFixtures.GetUserSanseiAdmin()
	viewer, _ := f.userFixtures.GetUserSanseiViewer()
	project, _ := f.projectFixtures.GetProjectSanseitou1()

	return []model.UserProjectRole{
		{UserID: owner.ID, ProjectID: project.ID, Role: model.RoleOwner},
		{UserID: admin.ID, ProjectID: project.ID, Role: model.RoleAdmin},
		{UserID: viewer.ID, ProjectID: project.ID, Role: model.RoleViewer},
	}, nil
}

// getMinimalTestData 最小限のテストデータ
func (f *UserProjectRoleFixtures) getMinimalTestData() ([]model.UserProjectRole, error) {
	user, _ := f.userFixtures.GetUserSanseiOwner()
	project, _ := f.projectFixtures.GetProjectSanseitou1()

	return []model.UserProjectRole{
		{UserID: user.ID, ProjectID: project.ID, Role: model.RoleOwner},
	}, nil
}

// SeedTestData はテスト用のデータパターンを投入
func (f *UserProjectRoleFixtures) SeedTestData(pattern string) error {
	// 既存データをクリア（テスト用）
	f.db.Where("1 = 1").Delete(&model.UserProjectRole{})

	testData, err := f.GetTestUserProjectRoleData(pattern)
	if err != nil {
		return err
	}

	for _, upr := range testData {
		if err := f.db.Create(&upr).Error; err != nil {
			return err
		}
	}

	log.Printf("✅ Seeded test data pattern: %s (%d records)", pattern, len(testData))
	return nil
}

// GetUserRoleInProject は特定のプロジェクトでのユーザーのロールを取得
func (f *UserProjectRoleFixtures) GetUserRoleInProject(userID, projectID uint) (model.Role, error) {
	var upr model.UserProjectRole
	err := f.db.Where("user_id = ? AND project_id = ?", userID, projectID).First(&upr).Error
	if err != nil {
		return "", err
	}
	return upr.Role, nil
}

// HasUserPermissionInProject はユーザーが特定のプロジェクトで権限を持っているかチェック
func (f *UserProjectRoleFixtures) HasUserPermissionInProject(userID, projectID uint, requiredRole model.Role) (bool, error) {
	userRole, err := f.GetUserRoleInProject(userID, projectID)
	if err != nil {
		return false, err
	}
	return userRole.HasPermission(requiredRole), nil
}