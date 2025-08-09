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

// CSPAccount はCSPアカウント情報を表す構造体
type CSPAccount struct {
	ID            uint           `json:"id" gorm:"primaryKey"`
	Provider      CSPProvider    `json:"provider" gorm:"not null;type:varchar(50)" validate:"required"`
	AccountName   string         `json:"account_name" gorm:"not null;size:255" validate:"required,min=1,max=255"`
	AccountID     string         `json:"account_id" gorm:"not null;size:255" validate:"required"` // CSPプロバイダーでのアカウントID
	AccessKey     string         `json:"access_key" gorm:"not null;size:255"`
	SecretKey     string         `json:"-" gorm:"not null;size:255"` // JSONには含めない（セキュリティ）
	Region        string         `json:"region" gorm:"size:100"`
	Status        string         `json:"status" gorm:"not null;default:'active';size:50"`
	CreatedBy     uint           `json:"created_by" gorm:"not null;index"` // 作成者（管理者）
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`

	// リレーション
	CreatedByUser User               `json:"created_by_user,omitempty" gorm:"foreignKey:CreatedBy"`
	ProjectCSPAccounts []ProjectCSPAccount `json:"project_csp_accounts,omitempty" gorm:"foreignKey:CSPAccountID"`
}

// TableName はテーブル名を指定
func (CSPAccount) TableName() string {
	return "csp_accounts"
}

// ProjectCSPAccount はプロジェクトとCSPアカウントの関連を表す構造体
type ProjectCSPAccount struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	ProjectID    uint           `json:"project_id" gorm:"not null;index"`
	CSPAccountID uint           `json:"csp_account_id" gorm:"not null;index"`
	CreatedBy    uint           `json:"created_by" gorm:"not null;index"` // 関連付け実行者
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`

	// リレーション
	Project    Project    `json:"project,omitempty" gorm:"foreignKey:ProjectID"`
	CSPAccount CSPAccount `json:"csp_account,omitempty" gorm:"foreignKey:CSPAccountID"`
	CreatedByUser User     `json:"created_by_user,omitempty" gorm:"foreignKey:CreatedBy"`
}

// TableName はテーブル名を指定
func (ProjectCSPAccount) TableName() string {
	return "project_csp_accounts"
}

// CSPAccountMember はCSPアカウントのメンバー（SSOユーザー）を表す構造体
type CSPAccountMember struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	CSPAccountID uint           `json:"csp_account_id" gorm:"not null;index"`
	ProjectID    uint           `json:"project_id" gorm:"not null;index"`
	UserID       uint           `json:"user_id" gorm:"not null;index"`
	SSOEnabled   bool           `json:"sso_enabled" gorm:"not null;default:true"`
	SSOProvider  string         `json:"sso_provider" gorm:"size:50;default:'default'"` // default, azure_ad, google, okta, etc.
	SSOEmail     string         `json:"sso_email" gorm:"size:255"`
	Role         string         `json:"role" gorm:"not null;default:'user';size:50"` // user, admin
	Status       string         `json:"status" gorm:"not null;default:'active';size:50"` // active, inactive, suspended
	CreatedBy    uint           `json:"created_by" gorm:"not null;index"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`

	// リレーション
	CSPAccount CSPAccount `json:"csp_account,omitempty" gorm:"foreignKey:CSPAccountID"`
	Project    Project    `json:"project,omitempty" gorm:"foreignKey:ProjectID"`
	User       User       `json:"user,omitempty" gorm:"foreignKey:UserID"`
	CreatedByUser User     `json:"created_by_user,omitempty" gorm:"foreignKey:CreatedBy"`
}

// TableName はテーブル名を指定
func (CSPAccountMember) TableName() string {
	return "csp_account_members"
}

// CSPAccountMemberRole はCSPアカウントメンバーのロールを定義
type CSPAccountMemberRole string

const (
	CSPAccountMemberRoleUser  CSPAccountMemberRole = "user"
	CSPAccountMemberRoleAdmin CSPAccountMemberRole = "admin"
)

// IsValid はロールが有効かどうかをチェック
func (r CSPAccountMemberRole) IsValid() bool {
	switch r {
	case CSPAccountMemberRoleUser, CSPAccountMemberRoleAdmin:
		return true
	default:
		return false
	}
}

// CSPAccountMemberStatus はCSPアカウントメンバーのステータスを定義
type CSPAccountMemberStatus string

const (
	CSPAccountMemberStatusActive    CSPAccountMemberStatus = "active"
	CSPAccountMemberStatusInactive  CSPAccountMemberStatus = "inactive"
	CSPAccountMemberStatusSuspended CSPAccountMemberStatus = "suspended"
)

// IsValid はステータスが有効かどうかをチェック
func (s CSPAccountMemberStatus) IsValid() bool {
	switch s {
	case CSPAccountMemberStatusActive, CSPAccountMemberStatusInactive, CSPAccountMemberStatusSuspended:
		return true
	default:
		return false
	}
}

// BeforeCreate はレコード作成前のバリデーション
func (ca *CSPAccount) BeforeCreate(tx *gorm.DB) error {
	if !ca.Provider.IsValid() {
		return ErrInvalidCSPProvider
	}
	return nil
}

// BeforeUpdate はレコード更新前のバリデーション
func (ca *CSPAccount) BeforeUpdate(tx *gorm.DB) error {
	if ca.Provider != "" && !ca.Provider.IsValid() {
		return ErrInvalidCSPProvider
	}
	return nil
}

// CSPAccountCreateRequest はCSPアカウント作成リクエストの構造体
type CSPAccountCreateRequest struct {
	Provider     CSPProvider `json:"provider" validate:"required"`
	AccountName  string      `json:"account_name" validate:"required,min=1,max=255"`
	AccountID    string      `json:"account_id" validate:"required"`
	AccessKey    string      `json:"access_key" validate:"required"`
	SecretKey    string      `json:"secret_key" validate:"required"`
	Region       string      `json:"region"`
}

// CSPAccountResponse はCSPアカウントレスポンスの構造体
type CSPAccountResponse struct {
	ID           uint         `json:"id"`
	Provider     CSPProvider  `json:"provider"`
	AccountName  string       `json:"account_name"`
	AccountID    string       `json:"account_id"`
	AccessKey    string       `json:"access_key"`
	Region       string       `json:"region"`
	Status       string       `json:"status"`
	CreatedBy    uint         `json:"created_by"`
	CreatedAt    time.Time    `json:"created_at"`
	UpdatedAt    time.Time    `json:"updated_at"`
	CreatedByUser *User       `json:"created_by_user,omitempty"`
}

// ProjectCSPAccountResponse はプロジェクトCSPアカウント関連レスポンスの構造体
type ProjectCSPAccountResponse struct {
	ID           uint                `json:"id"`
	ProjectID    uint                `json:"project_id"`
	CSPAccountID uint                `json:"csp_account_id"`
	CreatedBy    uint                `json:"created_by"`
	CreatedAt    time.Time           `json:"created_at"`
	Project      *ProjectResponse    `json:"project,omitempty"`
	CSPAccount   *CSPAccountResponse `json:"csp_account,omitempty"`
	CreatedByUser *User              `json:"created_by_user,omitempty"`
}

// CSPAccountMemberCreateRequest はCSPアカウントメンバー作成リクエストを表す構造体
type CSPAccountMemberCreateRequest struct {
	CSPAccountID uint   `json:"csp_account_id" validate:"required"`
	ProjectID    uint   `json:"project_id" validate:"required"`
	UserID       uint   `json:"user_id" validate:"required"`
	SSOEnabled   *bool  `json:"sso_enabled"`
	SSOProvider  string `json:"sso_provider"`
	SSOEmail     string `json:"sso_email" validate:"omitempty,email"`
	Role         string `json:"role" validate:"omitempty,oneof=user admin"`
}

// CSPAccountMemberUpdateRequest はCSPアカウントメンバー更新リクエストを表す構造体
type CSPAccountMemberUpdateRequest struct {
	SSOEnabled  *bool  `json:"sso_enabled"`
	SSOProvider string `json:"sso_provider"`
	SSOEmail    string `json:"sso_email" validate:"omitempty,email"`
	Role        string `json:"role" validate:"omitempty,oneof=user admin"`
	Status      string `json:"status" validate:"omitempty,oneof=active inactive suspended"`
}

// CSPAccountMemberResponse はCSPアカウントメンバーレスポンスの構造体
type CSPAccountMemberResponse struct {
	ID           uint                `json:"id"`
	CSPAccountID uint                `json:"csp_account_id"`
	ProjectID    uint                `json:"project_id"`
	UserID       uint                `json:"user_id"`
	SSOEnabled   bool                `json:"sso_enabled"`
	SSOProvider  string              `json:"sso_provider"`
	SSOEmail     string              `json:"sso_email"`
	Role         string              `json:"role"`
	Status       string              `json:"status"`
	CreatedBy    uint                `json:"created_by"`
	CreatedAt    time.Time           `json:"created_at"`
	UpdatedAt    time.Time           `json:"updated_at"`
	CSPAccount   *CSPAccountResponse `json:"csp_account,omitempty"`
	Project      *ProjectResponse    `json:"project,omitempty"`
	User         *User               `json:"user,omitempty"`
	CreatedByUser *User              `json:"created_by_user,omitempty"`
}
