package model

import (
	"time"

	"gorm.io/gorm"
)

// CSPProvider はクラウドサービスプロバイダーを定義する型
type CSPProvider string

// クラウドサービスプロバイダー定数
const (
	CSPProviderAWS   CSPProvider = "aws"
	CSPProviderGCP   CSPProvider = "gcp"
	CSPProviderAzure CSPProvider = "azure"
)

// ValidCSPProviders は有効なCSPプロバイダーの一覧
var ValidCSPProviders = []CSPProvider{
	CSPProviderAWS,
	CSPProviderGCP,
	CSPProviderAzure,
}

// IsValid はCSPプロバイダーが有効かどうかをチェック
func (cp CSPProvider) IsValid() bool {
	for _, validProvider := range ValidCSPProviders {
		if cp == validProvider {
			return true
		}
	}
	return false
}

// String はCSPプロバイダーの文字列表現を返す
func (cp CSPProvider) String() string {
	return string(cp)
}

// CSPRequestStatus はCSP Provisioningのステータスを定義する型
type CSPRequestStatus string

// CSP Provisioningステータス定数
const (
	CSPRequestStatusPending  CSPRequestStatus = "pending"  // プロビジョニング中
	CSPRequestStatusApproved CSPRequestStatus = "approved" // 承認済み
	CSPRequestStatusRejected CSPRequestStatus = "rejected" // 却下
)

// ValidCSPRequestStatuses は有効なCSP Provisioningステータスの一覧
var ValidCSPRequestStatuses = []CSPRequestStatus{
	CSPRequestStatusPending,
	CSPRequestStatusApproved,
	CSPRequestStatusRejected,
}

// IsValid はCSP Provisioningステータスが有効かどうかをチェック
func (crs CSPRequestStatus) IsValid() bool {
	for _, validStatus := range ValidCSPRequestStatuses {
		if crs == validStatus {
			return true
		}
	}
	return false
}

// String はCSP Provisioningステータスの文字列表現を返す
func (crs CSPRequestStatus) String() string {
	return string(crs)
}

// CSPRequest はCSP Provisioning情報を表す構造体
type CSPRequest struct {
	ID          uint              `json:"id" gorm:"primaryKey"`
	ProjectID   uint              `json:"project_id" gorm:"not null;index"`
	UserID      uint              `json:"user_id" gorm:"not null;index"` // プロビジョニング依頼者
	Provider    CSPProvider       `json:"provider" gorm:"not null;type:varchar(50)" validate:"required"`
	AccountName string            `json:"account_name" gorm:"not null;size:255" validate:"required,min=1,max=255"`
	Reason      string            `json:"reason" gorm:"type:text" validate:"required"`
	Status      CSPRequestStatus  `json:"status" gorm:"not null;default:'pending'" validate:"required"`
	ReviewedBy  *uint             `json:"reviewed_by" gorm:"index"` // 承認者（nullの場合は未承認）
	ReviewedAt  *time.Time        `json:"reviewed_at"`
	RejectReason *string          `json:"reject_reason" gorm:"type:text"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
	DeletedAt   gorm.DeletedAt    `json:"-" gorm:"index"`
}

// TableName はテーブル名を指定
func (CSPRequest) TableName() string {
	return "csp_requests"
}

// BeforeCreate はレコード作成前のバリデーション
func (cr *CSPRequest) BeforeCreate(tx *gorm.DB) error {
	if !cr.Provider.IsValid() {
		return ErrInvalidCSPProvider
	}
	if !cr.Status.IsValid() {
		return ErrInvalidCSPRequestStatus
	}
	return nil
}

// BeforeUpdate はレコード更新前のバリデーション
func (cr *CSPRequest) BeforeUpdate(tx *gorm.DB) error {
	if cr.Provider != "" && !cr.Provider.IsValid() {
		return ErrInvalidCSPProvider
	}
	if cr.Status != "" && !cr.Status.IsValid() {
		return ErrInvalidCSPRequestStatus
	}
	return nil
}

// リクエスト・レスポンス構造体

// CSPRequestCreateRequest はCSP Provisioning作成リクエストの構造体
type CSPRequestCreateRequest struct {
	ProjectID   uint        `json:"project_id" validate:"required"`
	Provider    CSPProvider `json:"provider" validate:"required"`
	AccountName string      `json:"account_name" validate:"required,min=1,max=255"`
	Reason      string      `json:"reason" validate:"required"`
}

// CSPRequestUpdateRequest はCSP Provisioning更新リクエストの構造体
type CSPRequestUpdateRequest struct {
	AccountName  *string `json:"account_name" validate:"omitempty,min=1,max=255"`
	Reason       *string `json:"reason" validate:"omitempty"`
}

// CSPRequestReviewRequest はCSP Provisioningレビューリクエストの構造体
type CSPRequestReviewRequest struct {
	Status       CSPRequestStatus `json:"status" validate:"required"`
	RejectReason *string          `json:"reject_reason" validate:"omitempty"`
}

// CSPRequestResponse はCSP Provisioningレスポンスの構造体
type CSPRequestResponse struct {
	ID          uint              `json:"id"`
	ProjectID   uint              `json:"project_id"`
	UserID      uint              `json:"user_id"`
	Provider    CSPProvider       `json:"provider"`
	AccountName string            `json:"account_name"`
	Reason      string            `json:"reason"`
	Status      CSPRequestStatus  `json:"status"`
	ReviewedBy  *uint             `json:"reviewed_by"`
	ReviewedAt  *time.Time        `json:"reviewed_at"`
	RejectReason *string          `json:"reject_reason"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
}

// ページング情報
type PaginationInfo struct {
	Page       int  `json:"page"`
	Limit      int  `json:"limit"`
	Total      int  `json:"total"`
	TotalPages int  `json:"total_pages"`
	HasNext    bool `json:"has_next"`
	HasPrev    bool `json:"has_prev"`
}
