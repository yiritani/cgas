package fixtures

import (
	"log"

	"go-nextjs-api/internal/model"

	"gorm.io/gorm"
)

// Fixtures はすべてのフィクスチャを統合管理する構造体
type Fixtures struct {
	db                      *gorm.DB
	OrganizationFixtures    *OrganizationFixtures
	UserFixtures            *UserFixtures
	ProjectFixtures         *ProjectFixtures
	UserProjectRoleFixtures *UserProjectRoleFixtures
	TestDataFixtures        *TestDataFixtures
}

// NewFixtures はFixturesのインスタンスを作成
func NewFixtures(db *gorm.DB) *Fixtures {
	organizationFixtures := NewOrganizationFixtures(db)
	userFixtures := NewUserFixtures(db)
	projectFixtures := NewProjectFixtures(db, organizationFixtures)
	userProjectRoleFixtures := NewUserProjectRoleFixtures(db, userFixtures, projectFixtures)
	testDataFixtures := NewTestDataFixtures(db, userFixtures, projectFixtures)

	return &Fixtures{
		db:                      db,
		OrganizationFixtures:    organizationFixtures,
		UserFixtures:            userFixtures,
		ProjectFixtures:         projectFixtures,
		UserProjectRoleFixtures: userProjectRoleFixtures,
		TestDataFixtures:        testDataFixtures,
	}
}

// SeedAll は全てのフィクスチャデータを投入
func (f *Fixtures) SeedAll() error {
	log.Println("🌱 Starting data seeding...")

	// 1. 組織データの作成（プロジェクトの前に作成）
	if err := f.OrganizationFixtures.Seed(); err != nil {
		return err
	}

	// 2. プロジェクトデータの作成
	if err := f.ProjectFixtures.Seed(); err != nil {
		return err
	}

	// 3. ユーザーデータの作成
	if err := f.UserFixtures.Seed(); err != nil {
		return err
	}

	// 4. ユーザープロジェクトロールの作成
	if err := f.UserProjectRoleFixtures.Seed(); err != nil {
		return err
	}

	log.Println("✅ Initial data seeded successfully")
	log.Println("📋 Login credentials:")
	log.Println("   Admin: admin@example.com / admin123")
	log.Println("   Developer: yamada@example.com / user123")
	log.Println("   Viewer: sato@example.com / user123")
	
	return nil
}

// MigrateExistingUserRoles は既存のユーザーロールをプロジェクトベースのロールに移行
func (f *Fixtures) MigrateExistingUserRoles() error {
	return f.UserProjectRoleFixtures.MigrateExistingUserRoles()
}

// DropAllTables は全てのテーブルを削除（開発用）
func (f *Fixtures) DropAllTables() error {
	log.Println("🗑️  Dropping all tables...")

	// 外部キー制約を考慮してテーブルを削除（逆順）
	tables := []interface{}{
		// CSP関連テーブル（依存関係の順番で削除）
		&model.CSPAccountMember{}, // CSPアカウントメンバー
		&model.ProjectCSPAccount{}, // プロジェクトCSPアカウント関連
		&model.CSPAccount{},        // CSPアカウント
		&model.CSPRequest{},        // CSPリクエスト
		
		// 基本テーブル
		&model.UserProjectRole{}, // ユーザープロジェクトロール
		&model.Project{},         // プロジェクトテーブル
		&model.User{},            // ユーザーテーブル
		&model.Organization{},    // 組織テーブル
	}

	for _, table := range tables {
		if err := f.db.Migrator().DropTable(table); err != nil {
			log.Printf("Warning: Failed to drop table %T: %v", table, err)
			// エラーでも続行（テーブルが存在しない場合もある）
		} else {
			log.Printf("✅ Dropped table: %T", table)
		}
	}

	log.Println("✅ All tables dropped successfully")
	return nil
}

// ResetAll はデータベースを完全にリセット（全削除→マイグレーション→シード）
func (f *Fixtures) ResetAll(runMigrations func() error) error {
	log.Println("Resetting database...")
	
	if err := f.DropAllTables(); err != nil {
		return err
	}
	
	if err := runMigrations(); err != nil {
		return err
	}
	
	if err := f.SeedAll(); err != nil {
		return err
	}
	
	log.Println("Database reset completed successfully")
	return nil
}

// CreatePaginationTestData はページングテスト用の大量データを作成
func (f *Fixtures) CreatePaginationTestData() error {
	return f.TestDataFixtures.CreatePaginationTestData()
}

// CleanupTestData はテストデータを削除
func (f *Fixtures) CleanupTestData() error {
	return f.TestDataFixtures.CleanupTestData()
}