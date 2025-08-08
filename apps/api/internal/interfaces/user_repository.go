package interfaces

import "go-nextjs-api/internal/model"

type UserRepository interface {
	SelectAll() ([]model.User, error)
	SelectWithPagination(page, limit int) ([]model.User, *model.PaginationInfo, error)
	SelectWithSearch(page, limit int, search, searchType string) ([]model.User, *model.PaginationInfo, error)
	SelectByID(id uint) (*model.User, error)
	SelectByEmail(email string) (*model.User, error)
	Insert(user *model.User) error
	Update(user *model.User) error
	Delete(id uint) error
}