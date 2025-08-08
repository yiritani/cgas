package model

import (
	"time"

	"gorm.io/gorm"
)

// Project はプロジェクト情報を表す構造体
type Project struct {
	ID             uint           `json:"id" gorm:"primaryKey"`
	Name           string         `json:"name" gorm:"not null;size:255" validate:"required,min=1,max=255"`
	Description    string         `json:"description" gorm:"type:text"`
	Status         ProjectStatus  `json:"status" gorm:"not null;default:'active'" validate:"required"`
	OrganizationID uint           `json:"organization_id" gorm:"not null;index"`
	ProjectType    ProjectType    `json:"project_type" gorm:"not null;default:'normal'" validate:"required"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`

	// リレーション
	Organization Organization     `json:"organization,omitempty" gorm:"foreignKey:OrganizationID"`
	UserProjects []UserProjectRole `json:"user_projects,omitempty" gorm:"foreignKey:ProjectID"`
}

// ProjectStatus はプロジェクトのステータスを定義する型
type ProjectStatus string

// プロジェクトステータス定数
const (
	ProjectStatusActive   ProjectStatus = "active"   // アクティブ
	ProjectStatusInactive ProjectStatus = "inactive" // 非アクティブ
	ProjectStatusArchived ProjectStatus = "archived" // アーカイブ済み
)

// ProjectType はプロジェクトの種類を定義する型
type ProjectType string

// プロジェクト種類定数
const (
	ProjectTypeCentralGov ProjectType = "centralGov" 
	ProjectTypeLocalGov     ProjectType = "localGov"  
	ProjectTypePublicSaas   ProjectType = "publicSaas"  
	ProjectTypeIndependent  ProjectType = "independent" 
	ProjectTypeVendor       ProjectType = "vendor" 
	ProjectTypeAdmin ProjectType = "admin" 
)

// ValidProjectStatuses は有効なプロジェクトステータスの一覧
var ValidProjectStatuses = []ProjectStatus{
	ProjectStatusActive,
	ProjectStatusInactive,
	ProjectStatusArchived,
}

// IsValid はプロジェクトステータスが有効かどうかをチェック
func (ps ProjectStatus) IsValid() bool {
	for _, validStatus := range ValidProjectStatuses {
		if ps == validStatus {
			return true
		}
	}
	return false
}

// String はプロジェクトステータスの文字列表現を返す
func (ps ProjectStatus) String() string {
	return string(ps)
}

// IsVendorProject はベンダープロジェクトかどうかを判定
func (p *Project) IsVendorProject() bool {
	return p.ProjectType == ProjectTypeVendor
}

// TableName はテーブル名を指定
func (Project) TableName() string {
	return "projects"
}

// ProjectCreateRequest はプロジェクト作成リクエストの構造体
type ProjectCreateRequest struct {
	Name           string        `json:"name" validate:"required,min=1,max=255"`
	Description    string        `json:"description"`
	Status         ProjectStatus `json:"status" validate:"omitempty"`
	OrganizationID uint          `json:"organization_id" validate:"required"`
	ProjectType    ProjectType   `json:"project_type" validate:"omitempty"`
}

// ProjectUpdateRequest はプロジェクト更新リクエストの構造体
type ProjectUpdateRequest struct {
	Name           string        `json:"name" validate:"omitempty,min=1,max=255"`
	Description    *string       `json:"description"` // ポインタで nil を許可
	Status         ProjectStatus `json:"status" validate:"omitempty"`
	OrganizationID uint          `json:"organization_id" validate:"omitempty"`
	ProjectType    ProjectType   `json:"project_type" validate:"omitempty"`
}

// ProjectResponse はプロジェクトレスポンスの構造体
type ProjectResponse struct {
	ID             uint          `json:"id"`
	Name           string        `json:"name"`
	Description    string        `json:"description"`
	Status         ProjectStatus `json:"status"`
	OrganizationID uint          `json:"organization_id"`
	ProjectType    ProjectType   `json:"project_type"`
	Organization   *OrganizationResponse `json:"organization,omitempty"` // 組織情報
	CreatedAt      time.Time     `json:"created_at"`
	UpdatedAt      time.Time     `json:"updated_at"`
	UserRole       Role          `json:"user_role,omitempty"` // 現在のユーザーのロール
}

// ProjectDetails はプロジェクト詳細情報の構造体（Repository層用）
type ProjectDetails struct {
	ID             uint          `json:"id"`
	Name           string        `json:"name"`
	Description    string        `json:"description"`
	Status         ProjectStatus `json:"status"`
	OrganizationID uint          `json:"organization_id"`
	ProjectType    ProjectType   `json:"project_type"`
	CreatedAt      time.Time     `json:"created_at"`
	UpdatedAt      time.Time     `json:"updated_at"`
}

// PaginationInfo はページネーション情報の構造体
type PaginationInfo struct {
	Page       int  `json:"page"`
	Limit      int  `json:"limit"`
	Total      int  `json:"total"`
	TotalPages int  `json:"totalPages"`
	HasNext    bool `json:"hasNext"`
	HasPrev    bool `json:"hasPrev"`
}