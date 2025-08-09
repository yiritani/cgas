package service

import (
	"csp-provisioning-service/internal/model"
	"csp-provisioning-service/internal/repository"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"
)

type CSPRequestService interface {
	GetAll() ([]model.CSPRequest, error)
	GetWithPagination(page, limit int) ([]model.CSPRequest, *model.PaginationInfo, error)
	GetByID(id uint) (*model.CSPRequest, error)
	GetByProjectID(projectID uint) ([]model.CSPRequest, error)
	GetByProjectIDWithPagination(projectID uint, page, limit int) ([]model.CSPRequest, *model.PaginationInfo, error)
	GetByUserID(userID uint) ([]model.CSPRequest, error)
	GetByStatus(status model.CSPRequestStatus) ([]model.CSPRequest, error)
	Create(userID uint, req *model.CSPRequestCreateRequest) (*model.CSPRequest, error)
	Update(id uint, userID uint, req *model.CSPRequestUpdateRequest) (*model.CSPRequest, error)
	Review(id uint, reviewerID uint, req *model.CSPRequestReviewRequest) (*model.CSPRequest, error)
	Delete(id uint, userID uint) error
	CanUserAccessRequest(userID, requestID uint) (bool, error)
	CanUserManageProjectCSPAccount(userID, projectID uint) (bool, error)
}

type cspRequestService struct {
	repo       repository.CSPRequestRepository
	mainAPIURL string
	httpClient *http.Client
}

func NewCSPRequestService(repo repository.CSPRequestRepository) CSPRequestService {
	mainAPIURL := os.Getenv("MAIN_API_URL")
	if mainAPIURL == "" {
		mainAPIURL = "http://localhost:8080"
	}

	return &cspRequestService{
		repo:       repo,
		mainAPIURL: mainAPIURL,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

func (s *cspRequestService) GetAll() ([]model.CSPRequest, error) {
	return s.repo.SelectAll()
}

func (s *cspRequestService) GetWithPagination(page, limit int) ([]model.CSPRequest, *model.PaginationInfo, error) {
	return s.repo.SelectWithPagination(page, limit)
}

func (s *cspRequestService) GetByID(id uint) (*model.CSPRequest, error) {
	return s.repo.SelectByID(id)
}

func (s *cspRequestService) GetByProjectID(projectID uint) ([]model.CSPRequest, error) {
	return s.repo.SelectByProjectID(projectID)
}

func (s *cspRequestService) GetByProjectIDWithPagination(projectID uint, page, limit int) ([]model.CSPRequest, *model.PaginationInfo, error) {
	return s.repo.SelectByProjectIDWithPagination(projectID, page, limit)
}

func (s *cspRequestService) GetByUserID(userID uint) ([]model.CSPRequest, error) {
	return s.repo.SelectByUserID(userID)
}

func (s *cspRequestService) GetByStatus(status model.CSPRequestStatus) ([]model.CSPRequest, error) {
	return s.repo.SelectByStatus(status)
}

func (s *cspRequestService) Create(userID uint, req *model.CSPRequestCreateRequest) (*model.CSPRequest, error) {
	// プロジェクトへのアクセス権限をチェック（メインAPIサーバーに確認）
	hasAccess, err := s.CanUserManageProjectCSPAccount(userID, req.ProjectID)
	if err != nil {
		return nil, err
	}
	if !hasAccess {
		return nil, model.ErrInsufficientPermissions
	}

	// プロジェクトがベンダータイプかチェック（メインAPIサーバーに確認）
	if err := s.checkProjectType(req.ProjectID); err != nil {
		return nil, err
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

	err = s.repo.Insert(cspRequest)
	if err != nil {
		return nil, err
	}

	return s.repo.SelectByID(cspRequest.ID)
}

func (s *cspRequestService) Update(id uint, userID uint, req *model.CSPRequestUpdateRequest) (*model.CSPRequest, error) {
	// 既存の申請を取得
	existingRequest, err := s.repo.SelectByID(id)
	if err != nil {
		return nil, err
	}

	// 申請者本人または管理者かチェック
	if existingRequest.UserID != userID {
		hasAccess, err := s.CanUserAccessRequest(userID, id)
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

	err = s.repo.Update(existingRequest)
	if err != nil {
		return nil, err
	}

	return s.repo.SelectByID(id)
}

func (s *cspRequestService) Review(id uint, reviewerID uint, req *model.CSPRequestReviewRequest) (*model.CSPRequest, error) {
	// 既存の申請を取得
	existingRequest, err := s.repo.SelectByID(id)
	if err != nil {
		return nil, err
	}

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

	err = s.repo.Update(existingRequest)
	if err != nil {
		return nil, err
	}

	// 承認の場合の処理はBFFが担当するため、ここでは承認処理のみ行う
	if req.Status == model.CSPRequestStatusApproved {
		log.Printf("[INFO] CSP request %d has been approved. CSP account creation will be handled by BFF.", existingRequest.ID)
	}

	return s.repo.SelectByID(id)
}

func (s *cspRequestService) Delete(id uint, userID uint) error {
	// 既存の申請を取得
	existingRequest, err := s.repo.SelectByID(id)
	if err != nil {
		return err
	}

	// 申請者本人または管理者かチェック
	if existingRequest.UserID != userID {
		hasAccess, err := s.CanUserAccessRequest(userID, id)
		if err != nil {
			return err
		}
		if !hasAccess {
			return model.ErrInsufficientPermissions
		}
	}

	return s.repo.Delete(id)
}

func (s *cspRequestService) CanUserAccessRequest(userID, requestID uint) (bool, error) {
	// CSP申請を取得
	cspRequest, err := s.repo.SelectByID(requestID)
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

func (s *cspRequestService) CanUserManageProjectCSPAccount(userID, projectID uint) (bool, error) {
	// メインAPIサーバーに権限確認を依頼
	url := fmt.Sprintf("%s/api/internal/projects/%d/can-manage?user_id=%d", s.mainAPIURL, projectID, userID)
	
	resp, err := s.httpClient.Get(url)
	if err != nil {
		log.Printf("Failed to check project permission: %v", err)
		return false, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		return true, nil
	} else if resp.StatusCode == http.StatusForbidden {
		return false, nil
	} else {
		return false, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
}

// checkProjectType はプロジェクトがベンダータイプかチェック
func (s *cspRequestService) checkProjectType(projectID uint) error {
	url := fmt.Sprintf("%s/api/internal/projects/%d/type", s.mainAPIURL, projectID)
	
	resp, err := s.httpClient.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to get project type: status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	var result struct {
		ProjectType string `json:"project_type"`
	}
	
	if err := json.Unmarshal(body, &result); err != nil {
		return err
	}

	if result.ProjectType == "vendor" {
		return errors.New("ベンダープロジェクトではCSPプロビジョニングはご利用いただけません")
	}

	return nil
}

// createCSPAccountViaMainAPI function removed - CSP account creation is now handled by BFF
