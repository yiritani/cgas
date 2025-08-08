package model

import (
	"time"

	"gorm.io/gorm"
)

// Organization は組織情報を表す構造体
type Organization struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	OrganizationType OrganizationType `json:"organization_type" gorm:"not null;default:'central_gov'" validate:"required"`
	Name        string         `json:"name" gorm:"not null;size:255" validate:"required,min=1,max=255"`
	Description string         `json:"description" gorm:"type:text"`
	Status      OrgStatus      `json:"status" gorm:"not null;default:'active'" validate:"required"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

	// リレーション
	Projects []Project `json:"projects,omitempty" gorm:"foreignKey:OrganizationID"`
}

// OrganizationType は組織の種類を定義する型
type OrganizationType string

// 組織種類定数
const (
	OrganizationTypeCentralGov OrganizationType = "central_gov"
	OrganizationTypeLocalGov OrganizationType = "local_gov"
	OrganizationTypePublicSaas OrganizationType = "public_saas"
	OrganizationTypeIndependent OrganizationType = "independent"
	OrganizationTypeVendor OrganizationType = "vendor"
)

// OrgStatus は組織のステータスを定義する型
type OrgStatus string

// 組織ステータス定数
const (
	OrgStatusActive   OrgStatus = "active"   // アクティブ
	OrgStatusInactive OrgStatus = "inactive" // 非アクティブ
	OrgStatusSuspended OrgStatus = "suspended" // 停止中
)

// ValidOrgStatuses は有効な組織ステータスの一覧
var ValidOrgStatuses = []OrgStatus{
	OrgStatusActive,
	OrgStatusInactive,
	OrgStatusSuspended,
}

// IsValid は組織ステータスが有効かどうかをチェック
func (os OrgStatus) IsValid() bool {
	for _, validStatus := range ValidOrgStatuses {
		if os == validStatus {
			return true
		}
	}
	return false
}

// String は組織ステータスの文字列表現を返す
func (os OrgStatus) String() string {
	return string(os)
}

// TableName はテーブル名を指定
func (Organization) TableName() string {
	return "organizations"
}

// OrganizationCreateRequest は組織作成リクエストの構造体
type OrganizationCreateRequest struct {
	Name        string    `json:"name" validate:"required,min=1,max=255"`
	Description string    `json:"description"`
	Status      OrgStatus `json:"status" validate:"omitempty"`
}

// OrganizationUpdateRequest は組織更新リクエストの構造体
type OrganizationUpdateRequest struct {
	Name        string    `json:"name" validate:"omitempty,min=1,max=255"`
	Description *string   `json:"description"` // ポインタで nil を許可
	Status      OrgStatus `json:"status" validate:"omitempty"`
}

// OrganizationResponse は組織レスポンスの構造体
type OrganizationResponse struct {
	ID          uint      `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Status      OrgStatus `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	ProjectCount int      `json:"project_count,omitempty"` // 所属プロジェクト数
}

// OrganizationDetails は組織詳細情報の構造体（Repository層用）
type OrganizationDetails struct {
	ID          uint      `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Status      OrgStatus `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}