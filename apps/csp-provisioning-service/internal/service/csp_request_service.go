package service

import (
	"bytes"
	"context"
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
	GetAll(ctx context.Context) ([]model.CSPRequest, error)
	GetWithPagination(ctx context.Context, page, limit int) ([]model.CSPRequest, *model.PaginationInfo, error)
	GetByID(ctx context.Context, id string) (*model.CSPRequest, error)
	GetByProjectID(ctx context.Context, projectID int) ([]model.CSPRequest, error)
	GetByProjectIDWithPagination(ctx context.Context, projectID int, page, limit int) ([]model.CSPRequest, *model.PaginationInfo, error)
	GetByRequestedBy(ctx context.Context, requestedBy string) ([]model.CSPRequest, error)
	GetByStatus(ctx context.Context, status model.CSPRequestStatus) ([]model.CSPRequest, error)
	Create(ctx context.Context, requestedBy string, req *model.CSPRequestCreateRequest) (*model.CSPRequest, error)
	Update(ctx context.Context, id string, requestedBy string, req *model.CSPRequestUpdateRequest) (*model.CSPRequest, error)
	Review(ctx context.Context, id string, reviewerID string, req *model.CSPRequestReviewRequest) (*model.CSPRequest, error)
	Delete(ctx context.Context, id string, requestedBy string) error
	CanUserAccessRequest(ctx context.Context, requestedBy string, requestID string) (bool, error)
	CanUserManageProjectCSPAccount(requestedBy string, projectID int) (bool, error)
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

func (s *cspRequestService) GetAll(ctx context.Context) ([]model.CSPRequest, error) {
	return s.repo.SelectAll(ctx)
}

func (s *cspRequestService) GetWithPagination(ctx context.Context, page, limit int) ([]model.CSPRequest, *model.PaginationInfo, error) {
	return s.repo.SelectWithPagination(ctx, page, limit)
}

func (s *cspRequestService) GetByID(ctx context.Context, id string) (*model.CSPRequest, error) {
	return s.repo.SelectByID(ctx, id)
}

func (s *cspRequestService) GetByProjectID(ctx context.Context, projectID int) ([]model.CSPRequest, error) {
	return s.repo.SelectByProjectID(ctx, projectID)
}

func (s *cspRequestService) GetByProjectIDWithPagination(ctx context.Context, projectID int, page, limit int) ([]model.CSPRequest, *model.PaginationInfo, error) {
	return s.repo.SelectByProjectIDWithPagination(ctx, projectID, page, limit)
}

func (s *cspRequestService) GetByRequestedBy(ctx context.Context, requestedBy string) ([]model.CSPRequest, error) {
	return s.repo.SelectByRequestedBy(ctx, requestedBy)
}

func (s *cspRequestService) GetByStatus(ctx context.Context, status model.CSPRequestStatus) ([]model.CSPRequest, error) {
	return s.repo.SelectByStatus(ctx, status)
}

func (s *cspRequestService) Create(ctx context.Context, requestedBy string, req *model.CSPRequestCreateRequest) (*model.CSPRequest, error) {
	// TODO: 権限チェックを一時的にスキップ（デバッグ用）
	// プロジェクトへのアクセス権限をチェック（メインAPIサーバーに確認）
	// hasAccess, err := s.CanUserManageProjectCSPAccount(userID, req.ProjectID)
	// if err != nil {
	// 	return nil, err
	// }
	// if !hasAccess {
	// 	return nil, model.ErrInsufficientPermissions
	// }

	// プロジェクトがベンダータイプかチェック（メインAPIサーバーに確認）
	// if err := s.checkProjectType(req.ProjectID); err != nil {
	// 	return nil, err
	// }

	// プロバイダーの有効性をチェック
	if !req.Provider.IsValid() {
		return nil, model.ErrInvalidCSPProvider
	}

	cspRequest := &model.CSPRequest{
		ProjectID:   req.ProjectID,
		RequestedBy: requestedBy,
		Provider:    req.Provider,
		AccountName: req.AccountName,
		Reason:      req.Reason,
		Status:      model.CSPRequestStatusPending,
	}

	err := s.repo.Insert(ctx, cspRequest)
	if err != nil {
		return nil, err
	}

	return s.repo.SelectByID(ctx, cspRequest.ID)
}

func (s *cspRequestService) Update(ctx context.Context, id string, requestedBy string, req *model.CSPRequestUpdateRequest) (*model.CSPRequest, error) {
	// 既存の申請を取得
	existingRequest, err := s.repo.SelectByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// 申請者本人または管理者かチェック
	if existingRequest.RequestedBy != requestedBy {
		hasAccess, err := s.CanUserAccessRequest(ctx, requestedBy, id)
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

	err = s.repo.Update(ctx, existingRequest)
	if err != nil {
		return nil, err
	}

	return s.repo.SelectByID(ctx, id)
}

func (s *cspRequestService) Review(ctx context.Context, id string, reviewerID string, req *model.CSPRequestReviewRequest) (*model.CSPRequest, error) {
	// 既存の申請を取得
	existingRequest, err := s.repo.SelectByID(ctx, id)
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

	err = s.repo.Update(ctx, existingRequest)
	if err != nil {
		return nil, err
	}

	// 承認の場合はCSPアカウントを自動作成
	if req.Status == model.CSPRequestStatusApproved {
		log.Printf("[INFO] CSP request %s has been approved. Creating CSP account...", existingRequest.ID)
		err = s.createCSPAccount(ctx, existingRequest, reviewerID)
		if err != nil {
			log.Printf("[ERROR] Failed to create CSP account for request %s: %v", existingRequest.ID, err)
			// CSPアカウント作成に失敗した場合は承認を取り消す
			existingRequest.Status = model.CSPRequestStatusPending
			existingRequest.ReviewedBy = nil
			existingRequest.ReviewedAt = nil
			existingRequest.RejectReason = nil
			s.repo.Update(ctx, existingRequest)
			return nil, fmt.Errorf("CSPアカウントの作成に失敗しました: %v", err)
		}
		log.Printf("[INFO] CSP account created successfully for request %s", existingRequest.ID)
	}

	return s.repo.SelectByID(ctx, id)
}

// createCSPAccount はCSP申請承認時にメインAPIサーバーにCSPアカウント作成を依頼
func (s *cspRequestService) createCSPAccount(ctx context.Context, cspRequest *model.CSPRequest, reviewerID string) error {
	// メインAPIサーバーのCSPアカウント自動作成エンドポイントを呼び出し
	createReq := map[string]interface{}{
		"csp_request_id": cspRequest.ID,
		"provider":       string(cspRequest.Provider),
		"account_name":   cspRequest.AccountName,
		"project_id":     cspRequest.ProjectID,
	}

	reqBody, err := json.Marshal(createReq)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	// HTTPリクエストを作成
	httpReq, err := http.NewRequestWithContext(ctx, "POST", s.mainAPIURL+"/api/internal/csp-accounts/auto-create", bytes.NewBuffer(reqBody))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("X-Creator-ID", reviewerID) // 承認者をCreatorとして設定

	// HTTPリクエストを送信
	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("CSP account creation failed with status %d: %s", resp.StatusCode, string(body))
	}

	log.Printf("[INFO] CSP account created successfully for request %s", cspRequest.ID)
	return nil
}

func (s *cspRequestService) Delete(ctx context.Context, id string, requestedBy string) error {
	// 既存の申請を取得
	existingRequest, err := s.repo.SelectByID(ctx, id)
	if err != nil {
		return err
	}

	// 申請者本人または管理者かチェック
	if existingRequest.RequestedBy != requestedBy {
		hasAccess, err := s.CanUserAccessRequest(ctx, requestedBy, id)
		if err != nil {
			return err
		}
		if !hasAccess {
			return model.ErrInsufficientPermissions
		}
	}

	return s.repo.Delete(ctx, id)
}

func (s *cspRequestService) CanUserAccessRequest(ctx context.Context, requestedBy string, requestID string) (bool, error) {
	// CSP申請を取得
	cspRequest, err := s.repo.SelectByID(ctx, requestID)
	if err != nil {
		return false, err
	}

	// 申請者本人の場合はアクセス可能
	if cspRequest.RequestedBy == requestedBy {
		return true, nil
	}

	// プロジェクトへの管理権限があるかチェック
	return s.CanUserManageProjectCSPAccount(requestedBy, cspRequest.ProjectID)
}

func (s *cspRequestService) CanUserManageProjectCSPAccount(requestedBy string, projectID int) (bool, error) {
	// メインAPIサーバーに権限確認を依頼
	url := fmt.Sprintf("%s/api/internal/projects/%d/can-manage?user_id=%s", s.mainAPIURL, projectID, requestedBy)
	
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
func (s *cspRequestService) checkProjectType(projectID int) error {
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
