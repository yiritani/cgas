package service

import (
	"go-nextjs-api/internal/interfaces"
	"go-nextjs-api/internal/model"
)

type userService struct {
	userRepo interfaces.UserRepository
}

func NewUserService(userRepo interfaces.UserRepository) interfaces.UserService {
	return &userService{userRepo: userRepo}
}

func (s *userService) GetAllUsers() ([]model.User, error) {
	return s.userRepo.SelectAll()
}

func (s *userService) GetUserByID(id uint) (*model.User, error) {
	return s.userRepo.SelectByID(id)
}

func (s *userService) CreateUser(user *model.User) error {
	return s.userRepo.Insert(user)
}

func (s *userService) UpdateUser(id uint, userData *model.User) error {
	// 既存のユーザーを取得して存在確認
	existingUser, err := s.userRepo.SelectByID(id)
	if err != nil {
		return err
	}

	// IDを設定して更新
	userData.ID = existingUser.ID
	return s.userRepo.Update(userData)
}

func (s *userService) DeleteUser(id uint) error {
	// 存在確認
	_, err := s.userRepo.SelectByID(id)
	if err != nil {
		return err
	}

	return s.userRepo.Delete(id)
}

func (s *userService) GetUsersWithPagination(page, limit int) ([]model.User, *model.PaginationInfo, error) {
	return s.userRepo.SelectWithPagination(page, limit)
}

func (s *userService) GetUsersWithSearch(page, limit int, search, searchType string) ([]model.User, *model.PaginationInfo, error) {
	return s.userRepo.SelectWithSearch(page, limit, search, searchType)
}