package fixtures

import (
	"log"

	"go-nextjs-api/internal/model"

	"gorm.io/gorm"
)

// UserFixtures はユーザー関連のフィクスチャデータを管理
type UserFixtures struct {
	db *gorm.DB
}

// NewUserFixtures はUserFixturesのインスタンスを作成
func NewUserFixtures(db *gorm.DB) *UserFixtures {
	return &UserFixtures{db: db}
}

// GetDefaultUsers はデフォルトユーザーの配列を返す
func (f *UserFixtures) GetDefaultUsers() ([]model.User, error) {
	userPass, err := model.HashPassword("user123")
	if err != nil {
		return nil, err
	}

	adminPass, err := model.HashPassword("admin123")
	if err != nil {
		return nil, err
	}

	users := []model.User{
		{Name: "管理者", Email: "admin@example.com", Password: adminPass},

		// 管理者・リーダー系
		{Name: "参政オーナー", Email: "sansei_owner@example.com", Password: userPass},
		{Name: "参政管理者", Email: "sansei_admin@example.com", Password: userPass},
		{Name: "参政閲覧者", Email: "sansei_viewer@example.com", Password: userPass},

		// 再生オーナー
		{Name: "再生オーナー", Email: "shinsei_owner@example.com", Password: userPass},
		{Name: "再生管理者", Email: "shinsei_admin@example.com", Password: userPass},
		{Name: "再生閲覧者", Email: "shinsei_viewer@example.com", Password: userPass},

		// ローカルオーナー
		{Name: "ローカルオーナー", Email: "local_owner@example.com", Password: userPass},
		{Name: "ローカル管理者", Email: "local_admin@example.com", Password: userPass},
		{Name: "ローカル閲覧者", Email: "local_viewer@example.com", Password: userPass},

		// 公共オーナー
		{Name: "公共オーナー", Email: "public_owner@example.com", Password: userPass},
		{Name: "公共管理者", Email: "public_admin@example.com", Password: userPass},
		{Name: "公共閲覧者", Email: "public_viewer@example.com", Password: userPass},

		// 独立オーナー
		{Name: "独立オーナー", Email: "independent_owner@example.com", Password: userPass},
		{Name: "独立管理者", Email: "independent_admin@example.com", Password: userPass},
		{Name: "独立閲覧者", Email: "independent_viewer@example.com", Password: userPass},

		// ベンダーオーナー
		{Name: "ベンダーオーナー", Email: "vendor_owner@example.com", Password: userPass},
		{Name: "ベンダー管理者", Email: "vendor_admin@example.com", Password: userPass},
		{Name: "ベンダー閲覧者", Email: "vendor_viewer@example.com", Password: userPass},
	}

	return users, nil
}

// Seed はユーザーの初期データを投入
func (f *UserFixtures) Seed() error {
	var count int64
	f.db.Model(&model.User{}).Count(&count)

	if count > 0 {
		log.Println("Users already exist, skipping user seed")
		return nil
	}

	users, err := f.GetDefaultUsers()
	if err != nil {
		return err
	}

	for _, user := range users {
		if err := f.db.Create(&user).Error; err != nil {
			return err
		}
		log.Printf("✅ Created user: %s (ID: %d)", user.Name, user.ID)
	}

	return nil
}

// GetUserByEmail は指定されたメールアドレスのユーザーを取得
func (f *UserFixtures) GetUserByEmail(email string) (*model.User, error) {
	var user model.User
	if err := f.db.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserAdmin はadminを取得
func (f *UserFixtures) GetUserAdmin() (*model.User, error) {
	return f.GetUserByEmail("admin@example.com")
}

// GetUserSanseiOwner はsansei_ownerを取得
func (f *UserFixtures) GetUserSanseiOwner() (*model.User, error) {
	return f.GetUserByEmail("sansei_owner@example.com")
}

// GetUserSanseiAdmin はsansei_adminを取得
func (f *UserFixtures) GetUserSanseiAdmin() (*model.User, error) {
	return f.GetUserByEmail("sansei_admin@example.com")
}

// GetUserSanseiViewer はsansei_viewerを取得
func (f *UserFixtures) GetUserSanseiViewer() (*model.User, error) {
	return f.GetUserByEmail("sansei_viewer@example.com")
}

// GetUserShinseiOwner はshinsei_ownerを取得
func (f *UserFixtures) GetUserShinseiOwner() (*model.User, error) {
	return f.GetUserByEmail("shinsei_owner@example.com")
}

// GetUserShinseiAdmin はshinsei_adminを取得
func (f *UserFixtures) GetUserShinseiAdmin() (*model.User, error) {
	return f.GetUserByEmail("shinsei_admin@example.com")
}

// GetUserShinseiViewer はshinsei_viewerを取得
func (f *UserFixtures) GetUserShinseiViewer() (*model.User, error) {
	return f.GetUserByEmail("shinsei_viewer@example.com")
}

// GetUserLocalOwner はlocal_ownerを取得
func (f *UserFixtures) GetUserLocalOwner() (*model.User, error) {
	return f.GetUserByEmail("local_owner@example.com")
}

// GetUserPublicOwner はpublic_ownerを取得
func (f *UserFixtures) GetUserPublicOwner() (*model.User, error) {
	return f.GetUserByEmail("public_owner@example.com")
}

// GetUserPublicAdmin はpublic_adminを取得
func (f *UserFixtures) GetUserPublicAdmin() (*model.User, error) {
	return f.GetUserByEmail("public_admin@example.com")
}

// GetUserPublicViewer はpublic_viewerを取得
func (f *UserFixtures) GetUserPublicViewer() (*model.User, error) {
	return f.GetUserByEmail("public_viewer@example.com")
}

// GetUserIndependentOwner はindependent_ownerを取得
func (f *UserFixtures) GetUserIndependentOwner() (*model.User, error) {
	return f.GetUserByEmail("independent_owner@example.com")
}

// GetUserIndependentAdmin はindependent_adminを取得
func (f *UserFixtures) GetUserIndependentAdmin() (*model.User, error) {
	return f.GetUserByEmail("independent_admin@example.com")
}

// GetUserIndependentViewer はindependent_viewerを取得
func (f *UserFixtures) GetUserIndependentViewer() (*model.User, error) {
	return f.GetUserByEmail("independent_viewer@example.com")
}

// GetUserVendorOwner はvendor_ownerを取得
func (f *UserFixtures) GetUserVendorOwner() (*model.User, error) {
	return f.GetUserByEmail("vendor_owner@example.com")
}

// GetUserVendorAdmin はvendor_adminを取得
func (f *UserFixtures) GetUserVendorAdmin() (*model.User, error) {
	return f.GetUserByEmail("vendor_admin@example.com")
}

// GetUserVendorViewer はvendor_viewerを取得
func (f *UserFixtures) GetUserVendorViewer() (*model.User, error) {
	return f.GetUserByEmail("vendor_viewer@example.com")
}