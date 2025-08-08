package model

import (
	"time"

	"gorm.io/gorm"
)

// ProjectVendorRelation はベンダープロジェクトと他プロジェクトの紐付けを管理する構造体
type ProjectVendorRelation struct {
	ID              uint           `json:"id" gorm:"primaryKey"`
	ProjectID       uint           `json:"project_id" gorm:"not null;index"`        // 紐付け元プロジェクトID（通常プロジェクト）
	VendorProjectID uint           `json:"vendor_project_id" gorm:"not null;index"` // 紐付け先ベンダープロジェクトID
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `json:"-" gorm:"index"`

	// リレーション
	Project       Project `json:"project,omitempty" gorm:"foreignKey:ProjectID"`
	VendorProject Project `json:"vendor_project,omitempty" gorm:"foreignKey:VendorProjectID"`
}

// TableName はテーブル名を指定
func (ProjectVendorRelation) TableName() string {
	return "project_vendor_relations"
}
