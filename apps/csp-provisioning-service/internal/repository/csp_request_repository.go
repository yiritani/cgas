package repository

import (
	"context"
	"csp-provisioning-service/internal/model"
	"fmt"
	"strconv"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/google/uuid"
	"google.golang.org/api/iterator"
)

type CSPRequestRepository interface {
	SelectAll(ctx context.Context) ([]model.CSPRequest, error)
	SelectWithPagination(ctx context.Context, page, limit int) ([]model.CSPRequest, *model.PaginationInfo, error)
	SelectByID(ctx context.Context, id string) (*model.CSPRequest, error)
	SelectByProjectID(ctx context.Context, projectID int) ([]model.CSPRequest, error)
	SelectByProjectIDWithPagination(ctx context.Context, projectID int, page, limit int) ([]model.CSPRequest, *model.PaginationInfo, error)
	SelectByRequestedBy(ctx context.Context, requestedBy string) ([]model.CSPRequest, error)
	SelectByStatus(ctx context.Context, status model.CSPRequestStatus) ([]model.CSPRequest, error)
	Insert(ctx context.Context, request *model.CSPRequest) error
	Update(ctx context.Context, request *model.CSPRequest) error
	Delete(ctx context.Context, id string) error
}

type cspRequestRepository struct {
	client *firestore.Client
}

func NewCSPRequestRepository(client *firestore.Client) CSPRequestRepository {
	return &cspRequestRepository{client: client}
}

func (r *cspRequestRepository) collection() *firestore.CollectionRef {
	return r.client.Collection("csp_requests")
}

func (r *cspRequestRepository) SelectAll(ctx context.Context) ([]model.CSPRequest, error) {
	var allRequests []model.CSPRequest
	
	iter := r.collection().Documents(ctx)
	defer iter.Stop()

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("failed to iterate documents: %w", err)
		}

		var projectRequests model.ProjectCSPRequests
		if err := doc.DataTo(&projectRequests); err != nil {
			return nil, fmt.Errorf("failed to convert document to ProjectCSPRequests: %w", err)
		}

		// 各申請にプロジェクトIDを設定
		for _, req := range projectRequests.Requests {
			req.ProjectID = projectRequests.ProjectID
			allRequests = append(allRequests, req)
		}
	}

	return allRequests, nil
}

func (r *cspRequestRepository) SelectWithPagination(ctx context.Context, page, limit int) ([]model.CSPRequest, *model.PaginationInfo, error) {
	var requests []model.CSPRequest

	// 全体の申請を取得してからページング処理
	allRequests, err := r.SelectAll(ctx)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get all requests: %w", err)
	}

	total := len(allRequests)
	totalPages := (total + limit - 1) / limit

	// ページング計算
	offset := (page - 1) * limit
	end := offset + limit
	if end > total {
		end = total
	}

	if offset < total {
		requests = allRequests[offset:end]
	}
	pagination := &model.PaginationInfo{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
		HasNext:    page < totalPages,
		HasPrev:    page > 1,
	}

	return requests, pagination, nil
}

func (r *cspRequestRepository) SelectByID(ctx context.Context, id string) (*model.CSPRequest, error) {
	// 全プロジェクトから該当するIDの申請を検索
	iter := r.collection().Documents(ctx)
	defer iter.Stop()

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("failed to iterate documents: %w", err)
		}

		var projectRequests model.ProjectCSPRequests
		if err := doc.DataTo(&projectRequests); err != nil {
			return nil, fmt.Errorf("failed to convert document: %w", err)
		}

		for _, req := range projectRequests.Requests {
			if req.ID == id {
				return &req, nil
			}
		}
	}

	return nil, fmt.Errorf("request not found")
}

func (r *cspRequestRepository) SelectByProjectID(ctx context.Context, projectID int) ([]model.CSPRequest, error) {
	doc, err := r.collection().Doc(strconv.Itoa(projectID)).Get(ctx)
	if err != nil {
		// ドキュメントが存在しない場合は空のスライスを返す
		return []model.CSPRequest{}, nil
	}

	var projectRequests model.ProjectCSPRequests
	if err := doc.DataTo(&projectRequests); err != nil {
		return nil, fmt.Errorf("failed to convert document: %w", err)
	}

	// 各申請にプロジェクトIDを設定
	for i := range projectRequests.Requests {
		projectRequests.Requests[i].ProjectID = projectID
	}

	return projectRequests.Requests, nil
}

func (r *cspRequestRepository) SelectByProjectIDWithPagination(ctx context.Context, projectID int, page, limit int) ([]model.CSPRequest, *model.PaginationInfo, error) {
	// プロジェクトの申請を取得してからページング処理
	allRequests, err := r.SelectByProjectID(ctx, projectID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get requests for project: %w", err)
	}

	total := len(allRequests)
	totalPages := (total + limit - 1) / limit

	// ページング計算
	offset := (page - 1) * limit
	end := offset + limit
	if end > total {
		end = total
	}

	var requests []model.CSPRequest
	if offset < total {
		requests = allRequests[offset:end]
	}

	pagination := &model.PaginationInfo{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
		HasNext:    page < totalPages,
		HasPrev:    page > 1,
	}

	return requests, pagination, nil
}

func (r *cspRequestRepository) SelectByRequestedBy(ctx context.Context, requestedBy string) ([]model.CSPRequest, error) {
	var userRequests []model.CSPRequest

	iter := r.collection().Documents(ctx)
	defer iter.Stop()

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("failed to iterate documents: %w", err)
		}

		var projectRequests model.ProjectCSPRequests
		if err := doc.DataTo(&projectRequests); err != nil {
			return nil, fmt.Errorf("failed to convert document: %w", err)
		}

		for _, req := range projectRequests.Requests {
			if req.RequestedBy == requestedBy {
				req.ProjectID = projectRequests.ProjectID
				userRequests = append(userRequests, req)
			}
		}
	}

	return userRequests, nil
}

func (r *cspRequestRepository) SelectByStatus(ctx context.Context, status model.CSPRequestStatus) ([]model.CSPRequest, error) {
	var requests []model.CSPRequest

	iter := r.collection().Where("status", "==", string(status)).OrderBy("created_at", firestore.Desc).Documents(ctx)
	defer iter.Stop()

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("failed to iterate documents: %w", err)
		}

		var request model.CSPRequest
		if err := doc.DataTo(&request); err != nil {
			return nil, fmt.Errorf("failed to convert document to CSPRequest: %w", err)
		}
		request.ID = doc.Ref.ID
		requests = append(requests, request)
	}

	return requests, nil
}

func (r *cspRequestRepository) Insert(ctx context.Context, request *model.CSPRequest) error {
	// バリデーション
	if err := request.Validate(); err != nil {
		return err
	}

	// タイムスタンプを設定
	now := time.Now()
	request.CreatedAt = now
	request.UpdatedAt = now

	// デフォルトステータスを設定
	if request.Status == "" {
		request.Status = model.CSPRequestStatusPending
	}

	// UUIDでIDを生成
	request.ID = uuid.New().String()

	// プロジェクトのドキュメントを取得または作成
	projectID := strconv.Itoa(request.ProjectID)
	docRef := r.collection().Doc(projectID)

	return r.client.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		doc, err := tx.Get(docRef)
		var projectRequests model.ProjectCSPRequests

		if err != nil {
			// ドキュメントが存在しない場合は新規作成
			projectRequests = model.ProjectCSPRequests{
				ProjectID: request.ProjectID,
				Requests:  []model.CSPRequest{*request},
			}
		} else {
			// 既存のドキュメントに追加
			if err := doc.DataTo(&projectRequests); err != nil {
				return fmt.Errorf("failed to convert document: %w", err)
			}
			projectRequests.Requests = append(projectRequests.Requests, *request)
		}

		return tx.Set(docRef, projectRequests)
	})
}

func (r *cspRequestRepository) Update(ctx context.Context, request *model.CSPRequest) error {
	// バリデーション
	if err := request.Validate(); err != nil {
		return err
	}

	// 更新タイムスタンプを設定
	request.UpdatedAt = time.Now()

	// プロジェクトドキュメントを更新
	projectID := strconv.Itoa(request.ProjectID)
	docRef := r.collection().Doc(projectID)

	return r.client.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		doc, err := tx.Get(docRef)
		if err != nil {
			return fmt.Errorf("project document not found: %w", err)
		}

		var projectRequests model.ProjectCSPRequests
		if err := doc.DataTo(&projectRequests); err != nil {
			return fmt.Errorf("failed to convert document: %w", err)
		}

		// 該当する申請を更新
		found := false
		for i, req := range projectRequests.Requests {
			if req.ID == request.ID {
				projectRequests.Requests[i] = *request
				found = true
				break
			}
		}

		if !found {
			return fmt.Errorf("request not found in project")
		}

		return tx.Set(docRef, projectRequests)
	})
}

func (r *cspRequestRepository) Delete(ctx context.Context, id string) error {
	// 全プロジェクトから該当する申請を検索して削除
	iter := r.collection().Documents(ctx)
	defer iter.Stop()

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return fmt.Errorf("failed to iterate documents: %w", err)
		}

		var projectRequests model.ProjectCSPRequests
		if err := doc.DataTo(&projectRequests); err != nil {
			return fmt.Errorf("failed to convert document: %w", err)
		}

		// 該当するIDの申請を検索
		for i, req := range projectRequests.Requests {
			if req.ID == id {
				// 申請をリストから削除
				projectRequests.Requests = append(projectRequests.Requests[:i], projectRequests.Requests[i+1:]...)
				
				// ドキュメントを更新
				_, err := doc.Ref.Set(ctx, projectRequests)
				if err != nil {
					return fmt.Errorf("failed to update document: %w", err)
				}
				return nil
			}
		}
	}

	return fmt.Errorf("request not found")
}
