package service

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"go-nextjs-api/internal/interfaces"
	"go-nextjs-api/internal/model"

	"gorm.io/gorm"
)

type cspService struct {
	cspRepo     interfaces.CSPRepository
	projectRepo interfaces.ProjectRepository
	userRepo    interfaces.UserRepository
}

func NewCSPService(
	cspRepo interfaces.CSPRepository,
	projectRepo interfaces.ProjectRepository,
	userRepo interfaces.UserRepository,
) interfaces.CSPService {
	return &cspService{
		cspRepo:     cspRepo,
		projectRepo: projectRepo,
		userRepo:    userRepo,
	}
}

// CSPAccount related methods

func (s *cspService) GetAllCSPAccounts() ([]model.CSPAccount, error) {
	return s.cspRepo.SelectCSPAccountAll()
}

func (s *cspService) GetCSPAccountsWithPagination(page, limit int) ([]model.CSPAccount, *model.PaginationInfo, error) {
	return s.cspRepo.SelectCSPAccountWithPagination(page, limit)
}

func (s *cspService) GetCSPAccountByID(id uint) (*model.CSPAccount, error) {
	return s.cspRepo.SelectCSPAccountByID(id)
}

func (s *cspService) GetCSPAccountsByProvider(provider model.CSPProvider) ([]model.CSPAccount, error) {
	return s.cspRepo.SelectCSPAccountsByProvider(provider)
}

func (s *cspService) CreateCSPAccount(adminID uint, req *model.CSPAccountCreateRequest) (*model.CSPAccount, error) {
	// 管理者権限をチェック（簡易版）
	// 実際の実装では適切な権限チェックを行う

	// プロバイダーの有効性をチェック
	if !req.Provider.IsValid() {
		return nil, model.ErrInvalidCSPProvider
	}

	cspAccount := &model.CSPAccount{
		Provider:     req.Provider,
		AccountName:  req.AccountName,
		AccountID:    req.AccountID,
		AccessKey:    req.AccessKey,
		SecretKey:    req.SecretKey,
		Region:       req.Region,
		Status:       "active",
		CreatedBy:    adminID,
	}

	err := s.cspRepo.InsertCSPAccount(cspAccount)
	if err != nil {
		return nil, err
	}

	return s.cspRepo.SelectCSPAccountByID(cspAccount.ID)
}

func (s *cspService) UpdateCSPAccount(id uint, adminID uint, account *model.CSPAccount) (*model.CSPAccount, error) {
	// 既存のアカウントを取得
	existingAccount, err := s.cspRepo.SelectCSPAccountByID(id)
	if err != nil {
		return nil, err
	}

	// 管理者権限をチェック（簡易版）
	// IDを設定して更新
	account.ID = existingAccount.ID
	err = s.cspRepo.UpdateCSPAccount(account)
	if err != nil {
		return nil, err
	}

	return s.cspRepo.SelectCSPAccountByID(id)
}

func (s *cspService) DeleteCSPAccount(id uint, adminID uint) error {
	// 管理者権限をチェック（簡易版）
	return s.cspRepo.DeleteCSPAccount(id)
}

// ProjectCSPAccount related methods

func (s *cspService) GetAllProjectCSPAccounts() ([]model.ProjectCSPAccount, error) {
	return s.cspRepo.SelectProjectCSPAccountAll()
}

func (s *cspService) GetProjectCSPAccountByID(id uint) (*model.ProjectCSPAccount, error) {
	return s.cspRepo.SelectProjectCSPAccountByID(id)
}

func (s *cspService) GetProjectCSPAccountsByProjectID(projectID uint) ([]model.ProjectCSPAccount, error) {
	return s.cspRepo.SelectProjectCSPAccountsByProjectID(projectID)
}

func (s *cspService) GetProjectCSPAccountsByCSPAccountID(cspAccountID uint) ([]model.ProjectCSPAccount, error) {
	return s.cspRepo.SelectProjectCSPAccountsByCSPAccountID(cspAccountID)
}

func (s *cspService) CreateProjectCSPAccount(adminID uint, projectID, cspAccountID uint) (*model.ProjectCSPAccount, error) {
	// 管理者権限をチェック（簡易版）

	// プロジェクトの存在をチェック
	_, err := s.projectRepo.SelectByID(projectID)
	if err != nil {
		return nil, err
	}

	// CSPアカウントの存在をチェック
	_, err = s.cspRepo.SelectCSPAccountByID(cspAccountID)
	if err != nil {
		return nil, err
	}

	// 既に関連付けが存在していないかチェック
	_, err = s.cspRepo.SelectProjectCSPAccountByProjectAndCSPAccount(projectID, cspAccountID)
	if err == nil {
		return nil, model.ErrProjectCSPAccountAlreadyExists
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	relation := &model.ProjectCSPAccount{
		ProjectID:    projectID,
		CSPAccountID: cspAccountID,
		CreatedBy:    adminID,
	}

	err = s.cspRepo.InsertProjectCSPAccount(relation)
	if err != nil {
		return nil, err
	}

	return s.cspRepo.SelectProjectCSPAccountByID(relation.ID)
}

func (s *cspService) DeleteProjectCSPAccount(id uint, adminID uint) error {
	// 管理者権限をチェック（簡易版）
	return s.cspRepo.DeleteProjectCSPAccount(id)
}

func (s *cspService) DeleteProjectCSPAccountByProjectAndCSPAccount(projectID, cspAccountID uint, adminID uint) error {
	// 管理者権限をチェック（簡易版）
	return s.cspRepo.DeleteProjectCSPAccountByProjectAndCSPAccount(projectID, cspAccountID)
}

// Permission checking methods

func (s *cspService) CanUserManageCSPAccount(userID, cspAccountID uint) (bool, error) {
	// 簡易版：管理者権限のチェック
	// 実際の実装では適切な権限チェックを行う
	// 今回は一旦trueを返す（管理者のみがCSPアカウントを管理できると仮定）
	return true, nil
}

func (s *cspService) CanUserManageProjectCSPAccount(userID, projectID uint) (bool, error) {
	// プロジェクトへの管理権限があるかチェック
	// 実際の実装では UserProjectRole を使って権限をチェック
	// 今回は簡易版として、プロジェクトメンバーかどうかのみをチェック
	
	// プロジェクトサービスがあればそれを使う方が良いが、
	// 今回は直接リポジトリを使用
	_, err := s.projectRepo.SelectByID(projectID)
	if err != nil {
		return false, err
	}

	// 簡易版：プロジェクトが存在すれば管理可能とする
	// 実際の実装では適切な権限チェックを行う
	return true, nil
}

func (s *cspService) CanUserManageCSPAccountMember(userID, cspAccountID uint) (bool, error) {
	// CSPアカウントメンバーを管理できる権限があるかチェック
	// 実際の実装では適切な権限チェックを行う
	// 今回は簡易版としてtrue
	return true, nil
}

// CSPAccountMember related methods

func (s *cspService) GetAllCSPAccountMembers() ([]model.CSPAccountMember, error) {
	return s.cspRepo.SelectCSPAccountMemberAll()
}

func (s *cspService) GetCSPAccountMemberByID(id uint) (*model.CSPAccountMember, error) {
	return s.cspRepo.SelectCSPAccountMemberByID(id)
}

func (s *cspService) GetCSPAccountMembersByCSPAccountID(cspAccountID uint) ([]model.CSPAccountMember, error) {
	return s.cspRepo.SelectCSPAccountMembersByCSPAccountID(cspAccountID)
}

func (s *cspService) GetCSPAccountMembersByProjectID(projectID uint) ([]model.CSPAccountMember, error) {
	return s.cspRepo.SelectCSPAccountMembersByProjectID(projectID)
}

func (s *cspService) GetCSPAccountMembersByUserID(userID uint) ([]model.CSPAccountMember, error) {
	return s.cspRepo.SelectCSPAccountMembersByUserID(userID)
}

func (s *cspService) CreateCSPAccountMember(creatorID uint, req *model.CSPAccountMemberCreateRequest) (*model.CSPAccountMember, error) {
	// CSPアカウントの存在をチェック
	_, err := s.cspRepo.SelectCSPAccountByID(req.CSPAccountID)
	if err != nil {
		return nil, err
	}

	// プロジェクトの存在をチェック
	_, err = s.projectRepo.SelectByID(req.ProjectID)
	if err != nil {
		return nil, err
	}

	// ユーザーの存在をチェック
	_, err = s.userRepo.SelectByID(req.UserID)
	if err != nil {
		return nil, err
	}

	// CSPアカウントとプロジェクトの関連があるかチェック
	_, err = s.cspRepo.SelectProjectCSPAccountByProjectAndCSPAccount(req.ProjectID, req.CSPAccountID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("CSP account is not associated with this project")
		}
		return nil, err
	}

	// 既に同じユーザーが登録されていないかチェック
	_, err = s.cspRepo.SelectCSPAccountMemberByCSPAccountProjectAndUser(req.CSPAccountID, req.ProjectID, req.UserID)
	if err == nil {
		return nil, errors.New("user is already registered as a member of this CSP account")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// デフォルト値を設定
	ssoEnabled := true
	if req.SSOEnabled != nil {
		ssoEnabled = *req.SSOEnabled
	}

	ssoProvider := "default"
	if req.SSOProvider != "" {
		ssoProvider = req.SSOProvider
	}

	role := "user"
	if req.Role != "" {
		role = req.Role
	}

	ssoEmail := req.SSOEmail
	if ssoEmail == "" {
		// デフォルトのSSOメールアドレスを生成（実際の実装では適切な処理を行う）
		user, err := s.userRepo.SelectByID(req.UserID)
		if err != nil {
			return nil, err
		}
		ssoEmail = user.Email
	}

	// CSPアカウントメンバーを作成
	member := &model.CSPAccountMember{
		CSPAccountID: req.CSPAccountID,
		ProjectID:    req.ProjectID,
		UserID:       req.UserID,
		SSOEnabled:   ssoEnabled,
		SSOProvider:  ssoProvider,
		SSOEmail:     ssoEmail,
		Role:         role,
		Status:       "active",
		CreatedBy:    creatorID,
	}

	err = s.cspRepo.InsertCSPAccountMember(member)
	if err != nil {
		return nil, err
	}

	// 作成されたメンバー情報を返す
	return s.cspRepo.SelectCSPAccountMemberByID(member.ID)
}

func (s *cspService) UpdateCSPAccountMember(id uint, userID uint, req *model.CSPAccountMemberUpdateRequest) (*model.CSPAccountMember, error) {
	// 既存のメンバー情報を取得
	existingMember, err := s.cspRepo.SelectCSPAccountMemberByID(id)
	if err != nil {
		return nil, err
	}

	// 権限チェック（簡易版）
	hasAccess, err := s.CanUserManageCSPAccountMember(userID, existingMember.CSPAccountID)
	if err != nil {
		return nil, err
	}
	if !hasAccess {
		// 本人または管理者のみ更新可能
		if existingMember.UserID != userID {
			return nil, model.ErrInsufficientPermissions
		}
	}

	// フィールドを更新
	if req.SSOEnabled != nil {
		existingMember.SSOEnabled = *req.SSOEnabled
	}
	if req.SSOProvider != "" {
		existingMember.SSOProvider = req.SSOProvider
	}
	if req.SSOEmail != "" {
		existingMember.SSOEmail = req.SSOEmail
	}
	if req.Role != "" {
		// ロールのバリデーション
		if model.CSPAccountMemberRole(req.Role).IsValid() {
			existingMember.Role = req.Role
		} else {
			return nil, errors.New("invalid role")
		}
	}
	if req.Status != "" {
		// ステータスのバリデーション
		if model.CSPAccountMemberStatus(req.Status).IsValid() {
			existingMember.Status = req.Status
		} else {
			return nil, errors.New("invalid status")
		}
	}

	err = s.cspRepo.UpdateCSPAccountMember(existingMember)
	if err != nil {
		return nil, err
	}

	return s.cspRepo.SelectCSPAccountMemberByID(id)
}

func (s *cspService) DeleteCSPAccountMember(id uint, userID uint) error {
	// 既存のメンバー情報を取得
	existingMember, err := s.cspRepo.SelectCSPAccountMemberByID(id)
	if err != nil {
		return err
	}

	// 権限チェック（簡易版）
	hasAccess, err := s.CanUserManageCSPAccountMember(userID, existingMember.CSPAccountID)
	if err != nil {
		return err
	}
	if !hasAccess {
		// 本人または管理者のみ削除可能
		if existingMember.UserID != userID {
			return model.ErrInsufficientPermissions
		}
	}

	return s.cspRepo.DeleteCSPAccountMember(id)
}

// Helper methods

// generateRandomString はランダムな文字列を生成
func (s *cspService) generateRandomString(length int) string {
	bytes := make([]byte, length/2)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// generateUUID は簡易UUIDを生成
func (s *cspService) generateUUID() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return fmt.Sprintf("%x-%x-%x-%x-%x", bytes[0:4], bytes[4:6], bytes[6:8], bytes[8:10], bytes[10:16])
}
