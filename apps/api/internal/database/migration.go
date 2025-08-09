package database

import (
	"log"

	"go-nextjs-api/internal/fixtures"
	"go-nextjs-api/internal/model"
)

// RunMigrations はデータベースマイグレーションを実行
func RunMigrations() error {
	if DB == nil {
		log.Fatal("Database connection is not initialized. Call InitDB() first.")
	}

	log.Println("Starting database migration...")

	// 1. まず新しいテーブルを作成
	if err := DB.AutoMigrate(
		&model.Organization{},     // 組織テーブル（プロジェクトの前に作成）
		&model.Project{},
		&model.UserProjectRole{},

		&model.CSPAccount{},       // CSPアカウントテーブル
		&model.ProjectCSPAccount{}, // プロジェクトCSPアカウント関連テーブル
		&model.CSPAccountMember{}, // CSPアカウントメンバーテーブル
		&model.ProjectVendorRelation{}, // ベンダープロジェクトと他プロジェクトの紐付けテーブル
	); err != nil {
		log.Printf("Failed to create new tables: %v", err)
		return err
	}
	log.Println("✅ New tables (organizations, projects, user_project_roles, csp_accounts, project_csp_accounts, csp_account_members, project_vendor_relations) created successfully")

	// 2. Userテーブルからroleカラムを削除する前に、既存データを移行
	fixturesManager := fixtures.NewFixtures(DB)
	if err := fixturesManager.MigrateExistingUserRoles(); err != nil {
		log.Printf("Failed to migrate existing user roles: %v", err)
		return err
	}

	// 3. Userテーブルを更新（roleカラムを削除）
	if err := DB.AutoMigrate(&model.User{}); err != nil {
		log.Printf("Failed to update users table: %v", err)
		return err
	}

	// 4. roleカラムが残っている場合は手動で削除
	if err := dropUserRoleColumn(); err != nil {
		log.Printf("Warning: Could not drop role column from users table: %v", err)
		// エラーでも続行（カラムが既に存在しない場合もある）
	}

	log.Println("✅ Database migration completed successfully")
	return nil
}

// dropUserRoleColumn はusersテーブルからroleカラムを削除
func dropUserRoleColumn() error {
	if DB.Migrator().HasColumn(&model.User{}, "role") {
		if err := DB.Migrator().DropColumn(&model.User{}, "role"); err != nil {
			return err
		}
		log.Println("✅ Dropped 'role' column from users table")
	} else {
		log.Println("Role column does not exist in users table")
	}
	return nil
}

// SeedData は初期データを投入
func SeedData() error {
	if DB == nil {
		log.Fatal("Database connection is not initialized. Call InitDB() first.")
	}

	fixturesManager := fixtures.NewFixtures(DB)
	return fixturesManager.SeedAll()
}

// DropAllTables は全てのテーブルを削除（開発用）
func DropAllTables() error {
	if DB == nil {
		log.Fatal("Database connection is not initialized. Call InitDB() first.")
	}

	fixturesManager := fixtures.NewFixtures(DB)
	return fixturesManager.DropAllTables()
}

// ResetDatabase はデータベースをリセット（全削除→マイグレーション→シード）
func ResetDatabase() error {
	if DB == nil {
		log.Fatal("Database connection is not initialized. Call InitDB() first.")
	}

	fixturesManager := fixtures.NewFixtures(DB)
	return fixturesManager.ResetAll(RunMigrations)
}

// CreatePaginationTestData はページングテスト用の大量データを作成
func CreatePaginationTestData() error {
	if DB == nil {
		log.Fatal("Database connection is not initialized. Call InitDB() first.")
	}

	fixturesManager := fixtures.NewFixtures(DB)
	return fixturesManager.CreatePaginationTestData()
}

// CleanupTestData はテストデータを削除
func CleanupTestData() error {
	if DB == nil {
		log.Fatal("Database connection is not initialized. Call InitDB() first.")
	}

	fixturesManager := fixtures.NewFixtures(DB)
	return fixturesManager.CleanupTestData()
}