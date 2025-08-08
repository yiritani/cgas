package fixtures

import (
	"log"

	"go-nextjs-api/internal/model"

	"gorm.io/gorm"
)

// ProjectFixtures はプロジェクト関連のフィクスチャデータを管理
type ProjectFixtures struct {
	db              *gorm.DB
	orgFixtures     *OrganizationFixtures
}

// NewProjectFixtures はProjectFixturesのインスタンスを作成
func NewProjectFixtures(db *gorm.DB, orgFixtures *OrganizationFixtures) *ProjectFixtures {
	return &ProjectFixtures{
		db:          db,
		orgFixtures: orgFixtures,
	}
}

// GetDefaultProjects はデフォルトプロジェクトの配列を返す（組織ID付き）
func (f *ProjectFixtures) GetDefaultProjects() ([]model.Project, error) {
	// 組織を取得
	adminOrg, err := f.orgFixtures.GetOrganizationAdmin()
	if err != nil {
		return nil, err
	}

	sanseitouOrg, err := f.orgFixtures.GetOrganizationSanseitou()
	if err != nil {
		return nil, err
	}
	shinseiOrg, err := f.orgFixtures.GetOrganizationShinsei()
	if err != nil {
		return nil, err
	}
	localGovOrg, err := f.orgFixtures.GetOrganizationLocalGov()
	if err != nil {
		return nil, err
	}
	publicOrg, err := f.orgFixtures.GetOrganizationPublic()
	if err != nil {
		return nil, err
	}
	independentOrg, err := f.orgFixtures.GetOrganizationIndependent()
	if err != nil {
		return nil, err
	}
	vendorOrg, err := f.orgFixtures.GetOrganizationVendor()
	if err != nil {
		return nil, err
	}

	projects := []model.Project{
		{
			Name:           "管理者プロジェクト",
			Description:    "管理者のプロジェクト",
			Status:         model.ProjectStatusActive,
			OrganizationID: adminOrg.ID,
			ProjectType:    model.ProjectTypeAdmin,
		},
		{
			Name:           "参政第一プロジェクト",
			Description:    "参政第一のプロジェクト",
			Status:         model.ProjectStatusActive,
			OrganizationID: sanseitouOrg.ID,
			ProjectType:    model.ProjectTypeCentralGov,
		},
		{
			Name:           "参政第二プロジェクト",
			Description:    "参政第二のプロジェクト",
			Status:         model.ProjectStatusActive,
			OrganizationID: sanseitouOrg.ID,
			ProjectType:    model.ProjectTypeCentralGov,
		},
		{
			Name:           "再生第一プロジェクト",
			Description:    "再生第一のプロジェクト",
			Status:         model.ProjectStatusActive,
			OrganizationID: shinseiOrg.ID,
			ProjectType:    model.ProjectTypeCentralGov,
		},
		{
			Name:           "ローカル第一プロジェクト",
			Description:    "ローカル第一のプロジェクト",
			Status:         model.ProjectStatusActive,
			OrganizationID: localGovOrg.ID,
			ProjectType:    model.ProjectTypeLocalGov,
		},
		{
			Name:           "ローカル第二プロジェクト",
			Description:    "ローカル第二のプロジェクト",
			Status:         model.ProjectStatusActive,
			OrganizationID: localGovOrg.ID,
			ProjectType:    model.ProjectTypeLocalGov,
		},
		{
			Name:           "公共第一プロジェクト",
			Description:    "公共第一のプロジェクト",
			Status:         model.ProjectStatusActive,
			OrganizationID: publicOrg.ID,
			ProjectType:    model.ProjectTypePublicSaas,
		},
		{
			Name:           "独立第一プロジェクト",
			Description:    "独立第一のプロジェクト",
			Status:         model.ProjectStatusActive,
			OrganizationID: independentOrg.ID,
			ProjectType:    model.ProjectTypeIndependent,
		},
		{
			Name:           "ベンダー第一プロジェクト",
			Description:    "ベンダー第一のプロジェクト",
			Status:         model.ProjectStatusActive,
			OrganizationID: vendorOrg.ID,
			ProjectType:    model.ProjectTypeVendor,
		},
		{
			Name:           "ベンダー第二プロジェクト",
			Description:    "ベンダー第二のプロジェクト",
			Status:         model.ProjectStatusActive,
			OrganizationID: vendorOrg.ID,
			ProjectType:    model.ProjectTypeVendor,
		},
	}

	return projects, nil
}

// Seed はプロジェクトの初期データを投入
func (f *ProjectFixtures) Seed() error {
	projects, err := f.GetDefaultProjects()
	if err != nil {
		return err
	}

	for _, project := range projects {
		// 各プロジェクトが既に存在するかチェック
		var existingProject model.Project
		result := f.db.Where("name = ?", project.Name).First(&existingProject)
		
		if result.Error == nil {
			// 既に存在する場合はスキップ
			log.Printf("Project '%s' already exists, skipping", project.Name)
			continue
		}
		
		// プロジェクトを作成
		if err := f.db.Create(&project).Error; err != nil {
			return err
		}
		log.Printf("✅ Created project: %s (ID: %d)", project.Name, project.ID)
	}

	return nil
}

// GetProjectByName は指定された名前のプロジェクトを取得
func (f *ProjectFixtures) GetProjectByName(name string) (*model.Project, error) {
	var project model.Project
	if err := f.db.Where("name = ?", name).First(&project).Error; err != nil {
		return nil, err
	}
	return &project, nil
}

// GetProjectAdmin は管理者プロジェクトを取得
func (f *ProjectFixtures) GetProjectAdmin() (*model.Project, error) {
	return f.GetProjectByName("管理者プロジェクト")
}

// GetProjectSanseitou は三政党プロジェクトを取得
func (f *ProjectFixtures) GetProjectSanseitou1() (*model.Project, error) {
	return f.GetProjectByName("参政第一プロジェクト")
}

// GetProjectSanseitou2 は三政党プロジェクトを取得
func (f *ProjectFixtures) GetProjectSanseitou2() (*model.Project, error) {
	return f.GetProjectByName("参政第二プロジェクト")
}

// GetProjectShinsei は再生プロジェクトを取得
func (f *ProjectFixtures) GetProjectShinsei() (*model.Project, error) {
	return f.GetProjectByName("再生第一プロジェクト")
}

// GetProjectLocalGov はローカル自治体プロジェクトを取得
func (f *ProjectFixtures) GetProjectLocalGov() (*model.Project, error) {
	return f.GetProjectByName("ローカル第一プロジェクト")
}

// GetProjectPublic は公共プロジェクトを取得
func (f *ProjectFixtures) GetProjectPublic() (*model.Project, error) {
	return f.GetProjectByName("公共第一プロジェクト")
}

// GetProjectIndependent は独立プロジェクトを取得
func (f *ProjectFixtures) GetProjectIndependent() (*model.Project, error) {
	return f.GetProjectByName("独立第一プロジェクト")
}

// GetProjectVendor はベンダープロジェクトを取得
func (f *ProjectFixtures) GetProjectVendor() (*model.Project, error) {
	return f.GetProjectByName("ベンダー第一プロジェクト")
}

// CreateOrGetDefaultProject はデフォルトプロジェクト「システム」を作成または取得
func (f *ProjectFixtures) CreateOrGetDefaultProject() (*model.Project, error) {
	var defaultProject model.Project
	f.db.Where("name = ?", "システム").First(&defaultProject)
	return &defaultProject, nil
}