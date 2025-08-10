package model

import (
	"time"
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
	ID          string            `json:"id" firestore:"id"`                                                  // リスト内でのユニークID
	ProjectID   int               `json:"project_id" firestore:"project_id"`                                  // プロジェクトID（レスポンス用）
	RequestedBy string            `json:"requested_by" firestore:"requested_by" validate:"required"`         // プロビジョニング依頼者（メールアドレス）
	Provider    CSPProvider       `json:"provider" firestore:"provider" validate:"required"`
	AccountName string            `json:"account_name" firestore:"account_name" validate:"required,min=1,max=255"`
	Reason      string            `json:"reason" firestore:"reason" validate:"required"`
	Status      CSPRequestStatus  `json:"status" firestore:"status" validate:"required"`
	ReviewedBy  *string           `json:"reviewed_by" firestore:"reviewed_by"`                               // 承認者（メールアドレス）
	ReviewedAt  *time.Time        `json:"reviewed_at" firestore:"reviewed_at"`
	RejectReason *string          `json:"reject_reason" firestore:"reject_reason"`
	CreatedAt   time.Time         `json:"created_at" firestore:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at" firestore:"updated_at"`
}

// ProjectCSPRequests はプロジェクトのCSP申請を管理する構造体
type ProjectCSPRequests struct {
	ProjectID int          `json:"project_id" firestore:"project_id"`
	Requests  []CSPRequest `json:"requests" firestore:"requests"`
}

// CollectionName はFirestoreのコレクション名を指定
func (ProjectCSPRequests) CollectionName() string {
	return "csp_requests"
}

// Validate はバリデーションを実行
func (cr *CSPRequest) Validate() error {
	if !cr.Provider.IsValid() {
		return ErrInvalidCSPProvider
	}
	if !cr.Status.IsValid() {
		return ErrInvalidCSPRequestStatus
	}
	return nil
}

// リクエスト・レスポンス構造体

// CSPRequestCreateRequest はCSP Provisioning作成リクエストの構造体
type CSPRequestCreateRequest struct {
	ProjectID   int         `json:"project_id" validate:"required"`
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
	ID          string            `json:"id"`
	ProjectID   int               `json:"project_id"`
	RequestedBy string            `json:"requested_by"`
	Provider    CSPProvider       `json:"provider"`
	AccountName string            `json:"account_name"`
	Reason      string            `json:"reason"`
	Status      CSPRequestStatus  `json:"status"`
	ReviewedBy  *string           `json:"reviewed_by"`
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
