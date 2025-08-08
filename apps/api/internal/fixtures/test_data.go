package fixtures

import (
	"fmt"
	"log"

	"go-nextjs-api/internal/model"

	"gorm.io/gorm"
)

// TestDataFixtures は大量のテストデータを管理
type TestDataFixtures struct {
	db              *gorm.DB
	userFixtures    *UserFixtures
	projectFixtures *ProjectFixtures
}

// NewTestDataFixtures はTestDataFixturesのインスタンスを作成
func NewTestDataFixtures(db *gorm.DB, userFixtures *UserFixtures, projectFixtures *ProjectFixtures) *TestDataFixtures {
	return &TestDataFixtures{
		db:              db,
		userFixtures:    userFixtures,
		projectFixtures: projectFixtures,
	}
}

// CreateManyUsers は大量のユーザーを作成（ページングテスト用）
func (f *TestDataFixtures) CreateManyUsers(count int) error {
	log.Printf("🚀 Creating %d test users for pagination testing...", count)

	// パスワードをハッシュ化（全員同じパスワード）
	password, err := model.HashPassword("test123")
	if err != nil {
		return err
	}

	// バッチ処理でユーザーを作成
	batchSize := 50
	for i := 0; i < count; i += batchSize {
		end := i + batchSize
		if end > count {
			end = count
		}

		var users []model.User
		for j := i; j < end; j++ {
			user := model.User{
				Name:     fmt.Sprintf("テストユーザー %03d", j+1),
				Email:    fmt.Sprintf("test%03d@example.com", j+1),
				Password: password,
			}
			users = append(users, user)
		}

		// バッチでユーザーを作成
		if err := f.db.CreateInBatches(users, batchSize).Error; err != nil {
			return fmt.Errorf("failed to create users batch %d-%d: %v", i+1, end, err)
		}

		log.Printf("✅ Created users %d-%d", i+1, end)
	}

	log.Printf("✅ Successfully created %d test users", count)
	return nil
}

// AddManyMembersToProject は大量のメンバーをプロジェクトに追加
func (f *TestDataFixtures) AddManyMembersToProject(projectName string, userStartId, userCount int) error {
	log.Printf("🚀 Adding %d members to project '%s'...", userCount, projectName)

	// プロジェクトを取得
	project, err := f.projectFixtures.GetProjectByName(projectName)
	if err != nil {
		return fmt.Errorf("failed to get project '%s': %v", projectName, err)
	}

	// ロールの選択肢
	roles := []model.Role{
		model.RoleViewer,
		model.RoleAdmin,
		model.RoleOwner,
	}

	// バッチ処理でメンバーを追加
	batchSize := 100
	for i := 0; i < userCount; i += batchSize {
		end := i + batchSize
		if end > userCount {
			end = userCount
		}

		var userProjectRoles []model.UserProjectRole
		for j := i; j < end; j++ {
			userId := uint(userStartId + j)
			role := roles[j%len(roles)] // ロールをローテーション

			userProjectRole := model.UserProjectRole{
				UserID:    userId,
				ProjectID: project.ID,
				Role:      role,
			}
			userProjectRoles = append(userProjectRoles, userProjectRole)
		}

		// バッチでメンバーを追加
		if err := f.db.CreateInBatches(userProjectRoles, batchSize).Error; err != nil {
			return fmt.Errorf("failed to add members batch %d-%d: %v", i+1, end, err)
		}

		log.Printf("✅ Added members %d-%d to project '%s'", userStartId+i, userStartId+end-1, projectName)
	}

	log.Printf("✅ Successfully added %d members to project '%s'", userCount, projectName)
	return nil
}

// CreatePaginationTestData はページングテスト用の大量データを作成
func (f *TestDataFixtures) CreatePaginationTestData() error {
	log.Println("🎯 Creating pagination test data...")

	// 現在のユーザー数をチェック
	var currentUserCount int64
	f.db.Model(&model.User{}).Count(&currentUserCount)
	
	// 既存ユーザー + 50人の新規ユーザーを作成（合計で53人程度になる）
	newUsersCount := 50
	if err := f.CreateManyUsers(newUsersCount); err != nil {
		return err
	}

	// システムプロジェクトに新しいユーザーを追加
	// ユーザーIDは既存ユーザー数 + 1から開始
	startUserId := int(currentUserCount) + 1
	if err := f.AddManyMembersToProject("システム", startUserId, newUsersCount); err != nil {
		return err
	}

	// サンプルプロジェクトにも一部のユーザーを追加
	sampleMembersCount := 25
	if err := f.AddManyMembersToProject("サンプルプロジェクト", startUserId, sampleMembersCount); err != nil {
		return err
	}

	log.Println("🎉 Pagination test data created successfully!")
	log.Println("📊 You can now test pagination with:")
	log.Println("   - システムプロジェクト: ~53 members (5+ pages)")
	log.Println("   - サンプルプロジェクト: ~28 members (3+ pages)")

	return nil
}

// CleanupTestData はテストデータを削除（本番環境で誤って実行しないよう注意）
func (f *TestDataFixtures) CleanupTestData() error {
	log.Println("🧹 Cleaning up test data...")

	// test***@example.comのユーザーを削除
	result := f.db.Where("email LIKE ?", "test%@example.com").Delete(&model.User{})
	if result.Error != nil {
		return result.Error
	}

	log.Printf("✅ Deleted %d test users", result.RowsAffected)
	return nil
}