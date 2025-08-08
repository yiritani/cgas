package model

import (
	"time"

	"golang.org/x/crypto/bcrypt"
)

// LoginRequest はログインリクエストの構造体
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// RegisterRequest は登録リクエストの構造体
type RegisterRequest struct {
	Name     string `json:"name" validate:"required"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

// AuthResponse は認証レスポンスの構造体
type AuthResponse struct {
	Token    string                 `json:"token"`
	User     User                   `json:"user"`
	Projects []UserProjectResponse  `json:"projects,omitempty"` // ユーザーが参加しているプロジェクト一覧
}

// AuthUserResponse は認証済みユーザーの詳細情報
type AuthUserResponse struct {
	ID        uint                  `json:"id"`
	Name      string                `json:"name"`
	Email     string                `json:"email"`
	CreatedAt time.Time             `json:"created_at"`
	UpdatedAt time.Time             `json:"updated_at"`
	Projects  []UserProjectResponse `json:"projects"`
}

// ProjectPermissionContext はプロジェクト権限コンテキスト
type ProjectPermissionContext struct {
	UserID    uint `json:"user_id"`
	ProjectID uint `json:"project_id"`
	Role      Role `json:"role"`
}

// HashPassword はパスワードをハッシュ化
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPassword はパスワードを検証
func CheckPassword(hashedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}