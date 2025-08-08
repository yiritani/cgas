package interfaces

import "go-nextjs-api/internal/model"

type AuthService interface {
	Register(req *model.RegisterRequest) (*model.AuthResponse, error)
	Login(req *model.LoginRequest) (*model.AuthResponse, error)
	GetUserByID(id uint) (*model.User, error)
	RefreshToken(user *model.User) (string, error)
}