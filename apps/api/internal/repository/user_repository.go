package repository

import (
	"fmt"
	"go-nextjs-api/internal/interfaces"
	"go-nextjs-api/internal/model"

	"gorm.io/gorm"
)

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) interfaces.UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) SelectAll() ([]model.User, error) {
	var users []model.User
	err := r.db.Find(&users).Error
	return users, err
}

func (r *userRepository) SelectByID(id uint) (*model.User, error) {
	var user model.User
	err := r.db.First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) SelectByEmail(email string) (*model.User, error) {
	var user model.User
	err := r.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) Insert(user *model.User) error {
	return r.db.Create(user).Error
}

func (r *userRepository) Update(user *model.User) error {
	fmt.Println("user", user)
	return r.db.Save(user).Error
}

func (r *userRepository) Delete(id uint) error {
	return r.db.Delete(&model.User{}, id).Error
}

func (r *userRepository) SelectWithPagination(page, limit int) ([]model.User, *model.PaginationInfo, error) {
	// ページネーション設定
	if page <= 0 {
		page = 1
	}
	if limit <= 0 || limit > 100 {
		limit = 10
	}
	offset := (page - 1) * limit

	// ユーザー一覧を取得
	var users []model.User
	if err := r.db.Order("created_at DESC").Limit(limit).Offset(offset).Find(&users).Error; err != nil {
		return nil, nil, err
	}

	// 総数を取得
	var total int64
	if err := r.db.Model(&model.User{}).Count(&total).Error; err != nil {
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

	return users, pagination, nil
}

func (r *userRepository) SelectWithSearch(page, limit int, search, searchType string) ([]model.User, *model.PaginationInfo, error) {
	// ページネーション設定
	if page <= 0 {
		page = 1
	}
	if limit <= 0 || limit > 100 {
		limit = 10
	}
	offset := (page - 1) * limit

	// クエリベースを作成
	query := r.db.Model(&model.User{})

	// 検索条件を追加
	if search != "" {
		switch searchType {
		case "name":
			query = query.Where("name ILIKE ?", "%"+search+"%")
		case "email":
			query = query.Where("email ILIKE ?", "%"+search+"%")
		default: // "all"
			query = query.Where("name ILIKE ? OR email ILIKE ?", "%"+search+"%", "%"+search+"%")
		}
	}

	// 総数を取得（検索条件適用後）
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, nil, err
	}

	// ユーザー一覧を取得
	var users []model.User
	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&users).Error; err != nil {
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

	return users, pagination, nil
}