package interfaces

import "go-nextjs-api/internal/model"

type UserService interface {
	GetAllUsers() ([]model.User, error)
	GetUsersWithPagination(page, limit int) ([]model.User, *model.PaginationInfo, error)
	GetUsersWithSearch(page, limit int, search, searchType string) ([]model.User, *model.PaginationInfo, error)
	GetUserByID(id uint) (*model.User, error)
	CreateUser(user *model.User) error
	UpdateUser(id uint, user *model.User) error
	DeleteUser(id uint) error
}