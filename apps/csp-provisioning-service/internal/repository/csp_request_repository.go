package repository

import (
	"csp-provisioning-service/internal/model"

	"gorm.io/gorm"
)

type CSPRequestRepository interface {
	SelectAll() ([]model.CSPRequest, error)
	SelectWithPagination(page, limit int) ([]model.CSPRequest, *model.PaginationInfo, error)
	SelectByID(id uint) (*model.CSPRequest, error)
	SelectByProjectID(projectID uint) ([]model.CSPRequest, error)
	SelectByProjectIDWithPagination(projectID uint, page, limit int) ([]model.CSPRequest, *model.PaginationInfo, error)
	SelectByUserID(userID uint) ([]model.CSPRequest, error)
	SelectByStatus(status model.CSPRequestStatus) ([]model.CSPRequest, error)
	Insert(request *model.CSPRequest) error
	Update(request *model.CSPRequest) error
	Delete(id uint) error
}

type cspRequestRepository struct {
	db *gorm.DB
}

func NewCSPRequestRepository(db *gorm.DB) CSPRequestRepository {
	return &cspRequestRepository{db: db}
}

func (r *cspRequestRepository) SelectAll() ([]model.CSPRequest, error) {
	var requests []model.CSPRequest
	err := r.db.Order("created_at DESC").Find(&requests).Error
	return requests, err
}

func (r *cspRequestRepository) SelectWithPagination(page, limit int) ([]model.CSPRequest, *model.PaginationInfo, error) {
	offset := (page - 1) * limit

	var requests []model.CSPRequest
	if err := r.db.Limit(limit).Offset(offset).Order("created_at DESC").Find(&requests).Error; err != nil {
		return nil, nil, err
	}

	var total int64
	if err := r.db.Model(&model.CSPRequest{}).Count(&total).Error; err != nil {
		return nil, nil, err
	}

	totalPages := int((total + int64(limit) - 1) / int64(limit))
	pagination := &model.PaginationInfo{
		Page:       page,
		Limit:      limit,
		Total:      int(total),
		TotalPages: totalPages,
		HasNext:    page < totalPages,
		HasPrev:    page > 1,
	}

	return requests, pagination, nil
}

func (r *cspRequestRepository) SelectByID(id uint) (*model.CSPRequest, error) {
	var request model.CSPRequest
	err := r.db.First(&request, id).Error
	if err != nil {
		return nil, err
	}
	return &request, nil
}

func (r *cspRequestRepository) SelectByProjectID(projectID uint) ([]model.CSPRequest, error) {
	var requests []model.CSPRequest
	err := r.db.Where("project_id = ?", projectID).Order("created_at DESC").Find(&requests).Error
	return requests, err
}

func (r *cspRequestRepository) SelectByProjectIDWithPagination(projectID uint, page, limit int) ([]model.CSPRequest, *model.PaginationInfo, error) {
	var requests []model.CSPRequest
	var total int64

	// 総件数を取得
	if err := r.db.Model(&model.CSPRequest{}).
		Where("project_id = ?", projectID).
		Count(&total).Error; err != nil {
		return nil, nil, err
	}

	// ページング情報を計算
	offset := (page - 1) * limit
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	
	// データの取得
	err := r.db.Where("project_id = ?", projectID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&requests).Error
	
	if err != nil {
		return nil, nil, err
	}

	pagination := &model.PaginationInfo{
		Page:       page,
		Limit:      limit,
		Total:      int(total),
		TotalPages: totalPages,
		HasNext:    page < totalPages,
		HasPrev:    page > 1,
	}

	return requests, pagination, nil
}

func (r *cspRequestRepository) SelectByUserID(userID uint) ([]model.CSPRequest, error) {
	var requests []model.CSPRequest
	err := r.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&requests).Error
	return requests, err
}

func (r *cspRequestRepository) SelectByStatus(status model.CSPRequestStatus) ([]model.CSPRequest, error) {
	var requests []model.CSPRequest
	err := r.db.Where("status = ?", status).Order("created_at DESC").Find(&requests).Error
	return requests, err
}

func (r *cspRequestRepository) Insert(request *model.CSPRequest) error {
	return r.db.Create(request).Error
}

func (r *cspRequestRepository) Update(request *model.CSPRequest) error {
	return r.db.Save(request).Error
}

func (r *cspRequestRepository) Delete(id uint) error {
	return r.db.Delete(&model.CSPRequest{}, id).Error
}
