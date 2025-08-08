package fixtures

import (
	"log"

	"go-nextjs-api/internal/model"

	"gorm.io/gorm"
)

// OrganizationFixtures は組織関連のフィクスチャデータを管理
type OrganizationFixtures struct {
	db *gorm.DB
}

// NewOrganizationFixtures はOrganizationFixturesのインスタンスを作成
func NewOrganizationFixtures(db *gorm.DB) *OrganizationFixtures {
	return &OrganizationFixtures{db: db}
}

// GetDefaultOrganizations はデフォルト組織の配列を返す
func (f *OrganizationFixtures) GetDefaultOrganizations() []model.Organization {
	return []model.Organization{
		{
			Name:        "三政党",
			Description: "三政党の組織",
			Status:      model.OrgStatusActive,
			OrganizationType: model.OrganizationTypeCentralGov,
		},
		{
			Name:        "再生党",
			Description: "再生党の組織",
			Status:      model.OrgStatusActive,
			OrganizationType: model.OrganizationTypeCentralGov,
		},
		{
			Name:        "ローカル自治体",
			Description: "ローカル自治体の組織",
			Status:      model.OrgStatusActive,
			OrganizationType: model.OrganizationTypeLocalGov,
		},
		{
			Name:        "公共組織",
			Description: "公共サービスの組織",
			Status:      model.OrgStatusActive,
			OrganizationType: model.OrganizationTypePublicSaas,
		},
		{
			Name:        "独立組織",
			Description: "独立した組織",
			Status:      model.OrgStatusActive,
			OrganizationType: model.OrganizationTypeIndependent,
		},
		{
			Name:        "ベンダー組織",
			Description: "ベンダーの組織",
			Status:      model.OrgStatusActive,
			OrganizationType: model.OrganizationTypeVendor,
		},
	}
}

// Seed は組織の初期データを投入
func (f *OrganizationFixtures) Seed() error {
	organizations := f.GetDefaultOrganizations()

	for _, org := range organizations {
		// 各組織が既に存在するかチェック
		var existingOrg model.Organization
		result := f.db.Where("name = ?", org.Name).First(&existingOrg)
		
		if result.Error == nil {
			// 既に存在する場合はスキップ
			log.Printf("Organization '%s' already exists, skipping", org.Name)
			continue
		}
		
		// 組織を作成
		if err := f.db.Create(&org).Error; err != nil {
			return err
		}
		log.Printf("✅ Created organization: %s (ID: %d)", org.Name, org.ID)
	}

	return nil
}

// GetOrganizationByName は指定された名前の組織を取得
func (f *OrganizationFixtures) GetOrganizationByName(name string) (*model.Organization, error) {
	var org model.Organization
	if err := f.db.Where("name = ?", name).First(&org).Error; err != nil {
		return nil, err
	}
	return &org, nil
}

// GetOrganizationSanseitou は三政党を取得
func (f *OrganizationFixtures) GetOrganizationSanseitou() (*model.Organization, error) {
	return f.GetOrganizationByName("三政党")
}

// GetOrganizationShinsei は再生党を取得
func (f *OrganizationFixtures) GetOrganizationShinsei() (*model.Organization, error) {
	return f.GetOrganizationByName("再生党")
}

// GetOrganizationLocalGov はローカル自治体を取得
func (f *OrganizationFixtures) GetOrganizationLocalGov() (*model.Organization, error) {
	return f.GetOrganizationByName("ローカル自治体")
}

// GetOrganizationPublic は公共組織を取得
func (f *OrganizationFixtures) GetOrganizationPublic() (*model.Organization, error) {
	return f.GetOrganizationByName("公共組織")
}

// GetOrganizationIndependent は独立組織を取得
func (f *OrganizationFixtures) GetOrganizationIndependent() (*model.Organization, error) {
	return f.GetOrganizationByName("独立組織")
}

// GetOrganizationVendor はベンダー組織を取得
func (f *OrganizationFixtures) GetOrganizationVendor() (*model.Organization, error) {
	return f.GetOrganizationByName("ベンダー組織")
}

// CreateOrGetDefaultOrganization はデフォルト組織「三政党」を作成または取得
func (f *OrganizationFixtures) CreateOrGetDefaultOrganization() (*model.Organization, error) {
	var defaultOrg model.Organization
	f.db.Where("name = ?", "三政党").First(&defaultOrg)
	return &defaultOrg, nil
}