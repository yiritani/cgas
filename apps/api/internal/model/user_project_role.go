package model

import (
	"time"

	"gorm.io/gorm"
)

// UserProjectRole はユーザーとプロジェクトの関連およびロールを管理する交差テーブル
type UserProjectRole struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	UserID    uint           `json:"user_id" gorm:"not null;index"`
	ProjectID uint           `json:"project_id" gorm:"not null;index"`
	Role      Role           `json:"role" gorm:"not null;type:varchar(50)" validate:"required"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// リレーション
	User    User    `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Project Project `json:"project,omitempty" gorm:"foreignKey:ProjectID"`
}

// TableName はテーブル名を指定
func (UserProjectRole) TableName() string {
	return "user_project_roles"
}

// BeforeCreate はレコード作成前のバリデーション
func (upr *UserProjectRole) BeforeCreate(tx *gorm.DB) error {
	if !upr.Role.IsValid() {
		return ErrInvalidRole
	}
	return nil
}

// BeforeUpdate はレコード更新前のバリデーション
func (upr *UserProjectRole) BeforeUpdate(tx *gorm.DB) error {
	// 部分更新（Update("field", value)）の場合は、ここでのロール検証をスキップ
	// リポジトリ層で事前にロール検証を行っているため
	if upr.Role == "" {
		return nil
	}
	
	if !upr.Role.IsValid() {
		return ErrInvalidRole
	}
	return nil
}

// UserProjectRoleRequest はユーザープロジェクトロール作成・更新リクエストの構造体
type UserProjectRoleRequest struct {
	UserID    uint `json:"user_id" validate:"required"`
	ProjectID uint `json:"project_id" validate:"required"`
	Role      Role `json:"role" validate:"required"`
}

// UserProjectRoleResponse はユーザープロジェクトロールレスポンスの構造体
type UserProjectRoleResponse struct {
	ID        uint      `json:"id"`
	UserID    uint      `json:"user_id"`
	ProjectID uint      `json:"project_id"`
	Role      Role      `json:"role"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	User      User      `json:"user,omitempty"`
	Project   Project   `json:"project,omitempty"`
}

// ProjectMemberResponse はプロジェクトメンバー情報のレスポンス構造体
type ProjectMemberResponse struct {
	UserID    uint      `json:"user_id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Role      Role      `json:"role"`
	JoinedAt  time.Time `json:"joined_at"`
}

// UserProjectResponse はユーザーのプロジェクト一覧のレスポンス構造体
type UserProjectResponse struct {
	ProjectID   uint          `json:"project_id"`
	Name        string        `json:"name"`
	Description string        `json:"description"`
	Status      ProjectStatus `json:"status"`
	Role        Role          `json:"role"`
	JoinedAt    time.Time     `json:"joined_at"`
}

// ProjectPermissionRequest はプロジェクト権限確認リクエストの構造体
type ProjectPermissionRequest struct {
	UserID    uint `json:"user_id" validate:"required"`
	ProjectID uint `json:"project_id" validate:"required"`
}

// ProjectPermissionResponse はプロジェクト権限確認レスポンスの構造体
type ProjectPermissionResponse struct {
	HasAccess      bool `json:"has_access"`
	Role           Role `json:"role,omitempty"`
	CanView        bool `json:"can_view"`
	CanEdit        bool `json:"can_edit"`
	CanManage      bool `json:"can_manage"`
}