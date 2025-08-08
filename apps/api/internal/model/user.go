package model

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Name      string         `json:"name" gorm:"not null" validate:"required"`
	Email     string         `json:"email" gorm:"uniqueIndex;not null" validate:"required,email"`
	Password  string         `json:"-" gorm:"not null"` // JSONには含めない
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// リレーション
	UserProjects []UserProjectRole `json:"user_projects,omitempty" gorm:"foreignKey:UserID"`
}

// TableName はテーブル名を指定
func (User) TableName() string {
	return "users"
}