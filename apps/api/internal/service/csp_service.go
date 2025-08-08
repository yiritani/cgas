package service

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"go-nextjs-api/internal/interfaces"
	"go-nextjs-api/internal/model"
	"log"
	"time"

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

// CSPRequest related methods

func (s *cspService) GetAllCSPRequests() ([]model.CSPRequest, error) {
	return s.cspRepo.SelectCSPRequestAll()
}

func (s *cspService) GetCSPRequestsWithPagination(page, limit int) ([]model.CSPRequest, *model.PaginationInfo, error) {
	return s.cspRepo.SelectCSPRequestWithPagination(page, limit)
}

func (s *cspService) GetCSPRequestByID(id uint) (*model.CSPRequest, error) {
	return s.cspRepo.SelectCSPRequestByID(id)
}

func (s *cspService) GetCSPRequestsByProjectID(projectID uint) ([]model.CSPRequest, error) {
	return s.cspRepo.SelectCSPRequestsByProjectID(projectID)
}

func (s *cspService) GetCSPRequestsByProjectIDWithPagination(projectID uint, page, limit int) ([]model.CSPRequest, *model.PaginationInfo, error) {
	return s.cspRepo.SelectCSPRequestsByProjectIDWithPagination(projectID, page, limit)
}

func (s *cspService) GetCSPRequestsByUserID(userID uint) ([]model.CSPRequest, error) {
	return s.cspRepo.SelectCSPRequestsByUserID(userID)
}

func (s *cspService) GetCSPRequestsByStatus(status model.CSPRequestStatus) ([]model.CSPRequest, error) {
	return s.cspRepo.SelectCSPRequestsByStatus(status)
}

func (s *cspService) CreateCSPRequest(userID uint, req *model.CSPRequestCreateRequest) (*model.CSPRequest, error) {
	// プロジェクトへのアクセス権限をチェック
	hasAccess, err := s.CanUserManageProjectCSPAccount(userID, req.ProjectID)
	if err != nil {
		return nil, err
	}
	if !hasAccess {
		return nil, model.ErrInsufficientPermissions
	}

	// プロジェクトがベンダータイプかチェック
	projectDetails, err := s.projectRepo.SelectByID(req.ProjectID)
	if err != nil {
		return nil, err
	}
	if projectDetails.ProjectType == model.ProjectTypeVendor {
		return nil, errors.New("ベンダープロジェクトではCSPプロビジョニングはご利用いただけません")
	}

	// プロバイダーの有効性をチェック
	if !req.Provider.IsValid() {
		return nil, model.ErrInvalidCSPProvider
	}

	cspRequest := &model.CSPRequest{
		ProjectID:   req.ProjectID,
		UserID:      userID,
		Provider:    req.Provider,
		AccountName: req.AccountName,
		Reason:      req.Reason,
		Status:      model.CSPRequestStatusPending,
	}

	err = s.cspRepo.InsertCSPRequest(cspRequest)
	if err != nil {
		return nil, err
	}

	return s.cspRepo.SelectCSPRequestByID(cspRequest.ID)
}

func (s *cspService) UpdateCSPRequest(id uint, userID uint, req *model.CSPRequestUpdateRequest) (*model.CSPRequest, error) {
	// 既存の申請を取得
	existingRequest, err := s.cspRepo.SelectCSPRequestByID(id)
	if err != nil {
		return nil, err
	}

	// 申請者本人または管理者かチェック
	if existingRequest.UserID != userID {
		hasAccess, err := s.CanUserAccessCSPRequest(userID, id)
		if err != nil {
			return nil, err
		}
		if !hasAccess {
			return nil, model.ErrInsufficientPermissions
		}
	}

	// レビュー済みの申請は更新できない
	if existingRequest.Status != model.CSPRequestStatusPending {
		return nil, model.ErrCSPRequestAlreadyReviewed
	}

	// フィールドを更新
	if req.AccountName != nil {
		existingRequest.AccountName = *req.AccountName
	}
	if req.Reason != nil {
		existingRequest.Reason = *req.Reason
	}

	err = s.cspRepo.UpdateCSPRequest(existingRequest)
	if err != nil {
		return nil, err
	}

	return s.cspRepo.SelectCSPRequestByID(id)
}

func (s *cspService) ReviewCSPRequest(id uint, reviewerID uint, req *model.CSPRequestReviewRequest) (*model.CSPRequest, error) {
	// 既存の申請を取得
	existingRequest, err := s.cspRepo.SelectCSPRequestByID(id)
	if err != nil {
		return nil, err
	}

	// 管理者権限をチェック（簡易版：実際の実装では適切な権限チェックを行う）
	// ここでは一旦スキップ

	// 既にレビュー済みかチェック
	if existingRequest.Status != model.CSPRequestStatusPending {
		return nil, model.ErrCSPRequestAlreadyReviewed
	}

	// ステータスの有効性をチェック
	if !req.Status.IsValid() {
		return nil, model.ErrInvalidCSPRequestStatus
	}

	// 却下の場合は理由が必要
	if req.Status == model.CSPRequestStatusRejected && (req.RejectReason == nil || *req.RejectReason == "") {
		return nil, errors.New("reject reason is required for rejection")
	}

	// レビュー情報を更新
	now := time.Now()
	existingRequest.Status = req.Status
	existingRequest.ReviewedBy = &reviewerID
	existingRequest.ReviewedAt = &now
	if req.RejectReason != nil {
		existingRequest.RejectReason = req.RejectReason
	}

	err = s.cspRepo.UpdateCSPRequest(existingRequest)
	if err != nil {
		return nil, err
	}

	// 承認の場合、自動でCSPアカウントを作成
	if req.Status == model.CSPRequestStatusApproved {
		_, err = s.createCSPAccountFromRequest(existingRequest, reviewerID)
		if err != nil {
			// ログに記録するが、エラーで処理を止めない（承認は完了している）
			log.Printf("Failed to create CSP account automatically: %v", err)
		}
	}

	return s.cspRepo.SelectCSPRequestByID(id)
}

// createCSPAccountFromRequest は承認されたCSP申請から自動でCSPアカウントを作成する
func (s *cspService) createCSPAccountFromRequest(cspRequest *model.CSPRequest, creatorID uint) (*model.CSPAccount, error) {
	// 既にCSPアカウントが作成されていないかチェック
	existingAccount, err := s.cspRepo.SelectCSPAccountByCSPRequestID(cspRequest.ID)
	if err == nil {
		// 既に存在する場合はそれを返す
		return existingAccount, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// CSPアカウントIDを生成（プロバイダー別の形式で）
	accountID, err := s.generateCSPAccountID(cspRequest.Provider, cspRequest.AccountName)
	if err != nil {
		return nil, err
	}

	// アクセスキーとシークレットキーを生成（ダミー値）
	accessKey, err := s.generateAccessKey(cspRequest.Provider)
	if err != nil {
		return nil, err
	}

	secretKey, err := s.generateSecretKey(cspRequest.Provider)
	if err != nil {
		return nil, err
	}

	// デフォルトリージョンを設定
	region := s.getDefaultRegion(cspRequest.Provider)

	// CSPアカウントを作成
	cspAccount := &model.CSPAccount{
		Provider:     cspRequest.Provider,
		AccountName:  cspRequest.AccountName,
		AccountID:    accountID,
		AccessKey:    accessKey,
		SecretKey:    secretKey,
		Region:       region,
		Status:       "active",
		CSPRequestID: cspRequest.ID,
		CreatedBy:    creatorID,
	}

	err = s.cspRepo.InsertCSPAccount(cspAccount)
	if err != nil {
		return nil, err
	}

	// プロジェクトとCSPアカウントの関連付けを作成
	projectCSPAccount := &model.ProjectCSPAccount{
		ProjectID:    cspRequest.ProjectID,
		CSPAccountID: cspAccount.ID,
		CreatedBy:    creatorID,
	}

	err = s.cspRepo.InsertProjectCSPAccount(projectCSPAccount)
	if err != nil {
		log.Printf("Failed to create project-CSP account association: %v", err)
		// 関連付けに失敗してもCSPアカウント作成は成功とする
	}

	return s.cspRepo.SelectCSPAccountByID(cspAccount.ID)
}

// generateCSPAccountID はプロバイダー別のCSPアカウントIDを生成
func (s *cspService) generateCSPAccountID(provider model.CSPProvider, accountName string) (string, error) {
	switch provider {
	case model.CSPProviderAWS:
		// AWS Account ID形式（12桁の数字）
		return fmt.Sprintf("123456789012"), nil
	case model.CSPProviderGCP:
		// GCP Project ID形式
		return fmt.Sprintf("project-%s-%d", accountName, time.Now().Unix()), nil
	case model.CSPProviderAzure:
		// Azure Subscription ID形式（GUID）
		return s.generateUUID(), nil
	default:
		return fmt.Sprintf("account-%s-%d", accountName, time.Now().Unix()), nil
	}
}

// generateAccessKey はプロバイダー別のアクセスキーを生成（ダミー値）
func (s *cspService) generateAccessKey(provider model.CSPProvider) (string, error) {
	switch provider {
	case model.CSPProviderAWS:
		return fmt.Sprintf("AKIA%s", s.generateRandomString(16)), nil
	case model.CSPProviderGCP:
		return fmt.Sprintf("gcp-access-%s", s.generateRandomString(20)), nil
	case model.CSPProviderAzure:
		return fmt.Sprintf("azure-access-%s", s.generateRandomString(20)), nil
	default:
		return s.generateRandomString(24), nil
	}
}

// generateSecretKey はプロバイダー別のシークレットキーを生成（ダミー値）
func (s *cspService) generateSecretKey(provider model.CSPProvider) (string, error) {
	switch provider {
	case model.CSPProviderAWS:
		return s.generateRandomString(40), nil
	case model.CSPProviderGCP, model.CSPProviderAzure:
		return s.generateRandomString(32), nil
	default:
		return s.generateRandomString(32), nil
	}
}

// getDefaultRegion はプロバイダー別のデフォルトリージョンを返す
func (s *cspService) getDefaultRegion(provider model.CSPProvider) string {
	switch provider {
	case model.CSPProviderAWS:
		return "ap-northeast-1"
	case model.CSPProviderGCP:
		return "asia-northeast1"
	case model.CSPProviderAzure:
		return "Japan East"
	default:
		return "default"
	}
}

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

func (s *cspService) DeleteCSPRequest(id uint, userID uint) error {
	// 既存の申請を取得
	existingRequest, err := s.cspRepo.SelectCSPRequestByID(id)
	if err != nil {
		return err
	}

	// 申請者本人または管理者かチェック
	if existingRequest.UserID != userID {
		hasAccess, err := s.CanUserAccessCSPRequest(userID, id)
		if err != nil {
			return err
		}
		if !hasAccess {
			return model.ErrInsufficientPermissions
		}
	}

	return s.cspRepo.DeleteCSPRequest(id)
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

func (s *cspService) GetCSPAccountByCSPRequestID(cspRequestID uint) (*model.CSPAccount, error) {
	return s.cspRepo.SelectCSPAccountByCSPRequestID(cspRequestID)
}

func (s *cspService) CreateCSPAccount(adminID uint, req *model.CSPAccountCreateRequest) (*model.CSPAccount, error) {
	// 管理者権限をチェック（簡易版）
	// 実際の実装では適切な権限チェックを行う

	// CSP申請の存在をチェック
	cspRequest, err := s.cspRepo.SelectCSPRequestByID(req.CSPRequestID)
	if err != nil {
		return nil, err
	}

	// 申請が承認済みかチェック
	if cspRequest.Status != model.CSPRequestStatusApproved {
		return nil, errors.New("CSP request must be approved first")
	}

	// プロバイダーの有効性をチェック
	if !req.Provider.IsValid() {
		return nil, model.ErrInvalidCSPProvider
	}

	// 既にCSPアカウントが作成されていないかチェック
	_, err = s.cspRepo.SelectCSPAccountByCSPRequestID(req.CSPRequestID)
	if err == nil {
		return nil, errors.New("CSP account already exists for this request")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	cspAccount := &model.CSPAccount{
		Provider:     req.Provider,
		AccountName:  req.AccountName,
		AccountID:    req.AccountID,
		AccessKey:    req.AccessKey,
		SecretKey:    req.SecretKey,
		Region:       req.Region,
		Status:       "active",
		CSPRequestID: req.CSPRequestID,
		CreatedBy:    adminID,
	}

	err = s.cspRepo.InsertCSPAccount(cspAccount)
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

func (s *cspService) CanUserAccessCSPRequest(userID, cspRequestID uint) (bool, error) {
	// CSP申請を取得
	cspRequest, err := s.cspRepo.SelectCSPRequestByID(cspRequestID)
	if err != nil {
		return false, err
	}

	// 申請者本人の場合はアクセス可能
	if cspRequest.UserID == userID {
		return true, nil
	}

	// プロジェクトへの管理権限があるかチェック
	return s.CanUserManageProjectCSPAccount(userID, cspRequest.ProjectID)
}

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