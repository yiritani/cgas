package repository

import (
	"go-nextjs-api/internal/interfaces"
	"go-nextjs-api/internal/model"

	"gorm.io/gorm"
)

type cspRepository struct {
	db *gorm.DB
}

func NewCSPRepository(db *gorm.DB) interfaces.CSPRepository {
	return &cspRepository{db: db}
}

// CSPRequest related methods

func (r *cspRepository) SelectCSPRequestAll() ([]model.CSPRequest, error) {
	var requests []model.CSPRequest
	err := r.db.Preload("Project").Preload("User").Preload("ReviewedByUser").Find(&requests).Error
	return requests, err
}

func (r *cspRepository) SelectCSPRequestWithPagination(page, limit int) ([]model.CSPRequest, *model.PaginationInfo, error) {
	offset := (page - 1) * limit

	var requests []model.CSPRequest
	if err := r.db.Preload("Project").Preload("User").Preload("ReviewedByUser").
		Limit(limit).Offset(offset).Order("created_at DESC").
		Find(&requests).Error; err != nil {
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

func (r *cspRepository) SelectCSPRequestByID(id uint) (*model.CSPRequest, error) {
	var request model.CSPRequest
	err := r.db.Preload("Project").Preload("User").Preload("ReviewedByUser").First(&request, id).Error
	if err != nil {
		return nil, err
	}
	return &request, nil
}

func (r *cspRepository) SelectCSPRequestsByProjectID(projectID uint) ([]model.CSPRequest, error) {
	var requests []model.CSPRequest
	err := r.db.Preload("Project").Preload("User").Preload("ReviewedByUser").
		Where("project_id = ?", projectID).Order("created_at DESC").Find(&requests).Error
	return requests, err
}

func (r *cspRepository) SelectCSPRequestsByProjectIDWithPagination(projectID uint, page, limit int) ([]model.CSPRequest, *model.PaginationInfo, error) {
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
	err := r.db.Preload("Project").Preload("User").Preload("ReviewedByUser").
		Where("project_id = ?", projectID).
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

func (r *cspRepository) SelectCSPRequestsByUserID(userID uint) ([]model.CSPRequest, error) {
	var requests []model.CSPRequest
	err := r.db.Preload("Project").Preload("User").Preload("ReviewedByUser").
		Where("user_id = ?", userID).Order("created_at DESC").Find(&requests).Error
	return requests, err
}

func (r *cspRepository) SelectCSPRequestsByStatus(status model.CSPRequestStatus) ([]model.CSPRequest, error) {
	var requests []model.CSPRequest
	err := r.db.Preload("Project").Preload("User").Preload("ReviewedByUser").
		Where("status = ?", status).Order("created_at DESC").Find(&requests).Error
	return requests, err
}

func (r *cspRepository) InsertCSPRequest(request *model.CSPRequest) error {
	return r.db.Create(request).Error
}

func (r *cspRepository) UpdateCSPRequest(request *model.CSPRequest) error {
	return r.db.Save(request).Error
}

func (r *cspRepository) DeleteCSPRequest(id uint) error {
	return r.db.Delete(&model.CSPRequest{}, id).Error
}

// CSPAccount related methods

func (r *cspRepository) SelectCSPAccountAll() ([]model.CSPAccount, error) {
	var accounts []model.CSPAccount
	err := r.db.Preload("CSPRequest").Preload("CreatedByUser").Preload("ProjectCSPAccounts").
		Find(&accounts).Error
	return accounts, err
}

func (r *cspRepository) SelectCSPAccountWithPagination(page, limit int) ([]model.CSPAccount, *model.PaginationInfo, error) {
	offset := (page - 1) * limit

	var accounts []model.CSPAccount
	if err := r.db.Preload("CSPRequest").Preload("CreatedByUser").
		Limit(limit).Offset(offset).Order("created_at DESC").
		Find(&accounts).Error; err != nil {
		return nil, nil, err
	}

	var total int64
	if err := r.db.Model(&model.CSPAccount{}).Count(&total).Error; err != nil {
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

	return accounts, pagination, nil
}

func (r *cspRepository) SelectCSPAccountByID(id uint) (*model.CSPAccount, error) {
	var account model.CSPAccount
	err := r.db.Preload("CSPRequest").Preload("CreatedByUser").Preload("ProjectCSPAccounts").
		First(&account, id).Error
	if err != nil {
		return nil, err
	}
	return &account, nil
}

func (r *cspRepository) SelectCSPAccountsByProvider(provider model.CSPProvider) ([]model.CSPAccount, error) {
	var accounts []model.CSPAccount
	err := r.db.Preload("CSPRequest").Preload("CreatedByUser").
		Where("provider = ?", provider).Order("created_at DESC").Find(&accounts).Error
	return accounts, err
}

func (r *cspRepository) SelectCSPAccountByCSPRequestID(cspRequestID uint) (*model.CSPAccount, error) {
	var account model.CSPAccount
	err := r.db.Preload("CSPRequest").Preload("CreatedByUser").
		Where("csp_request_id = ?", cspRequestID).First(&account).Error
	if err != nil {
		return nil, err
	}
	return &account, nil
}

func (r *cspRepository) InsertCSPAccount(account *model.CSPAccount) error {
	return r.db.Create(account).Error
}

func (r *cspRepository) UpdateCSPAccount(account *model.CSPAccount) error {
	return r.db.Save(account).Error
}

func (r *cspRepository) DeleteCSPAccount(id uint) error {
	return r.db.Delete(&model.CSPAccount{}, id).Error
}

// ProjectCSPAccount related methods

func (r *cspRepository) SelectProjectCSPAccountAll() ([]model.ProjectCSPAccount, error) {
	var relations []model.ProjectCSPAccount
	err := r.db.Preload("Project").Preload("CSPAccount").Preload("CreatedByUser").
		Find(&relations).Error
	return relations, err
}

func (r *cspRepository) SelectProjectCSPAccountByID(id uint) (*model.ProjectCSPAccount, error) {
	var relation model.ProjectCSPAccount
	err := r.db.Preload("Project").Preload("CSPAccount").Preload("CreatedByUser").
		First(&relation, id).Error
	if err != nil {
		return nil, err
	}
	return &relation, nil
}

func (r *cspRepository) SelectProjectCSPAccountsByProjectID(projectID uint) ([]model.ProjectCSPAccount, error) {
	var relations []model.ProjectCSPAccount
	err := r.db.Preload("Project").Preload("CSPAccount").Preload("CreatedByUser").
		Where("project_id = ?", projectID).Order("created_at DESC").Find(&relations).Error
	return relations, err
}

func (r *cspRepository) SelectProjectCSPAccountsByCSPAccountID(cspAccountID uint) ([]model.ProjectCSPAccount, error) {
	var relations []model.ProjectCSPAccount
	err := r.db.Preload("Project").Preload("CSPAccount").Preload("CreatedByUser").
		Where("csp_account_id = ?", cspAccountID).Order("created_at DESC").Find(&relations).Error
	return relations, err
}

func (r *cspRepository) SelectProjectCSPAccountByProjectAndCSPAccount(projectID, cspAccountID uint) (*model.ProjectCSPAccount, error) {
	var relation model.ProjectCSPAccount
	err := r.db.Preload("Project").Preload("CSPAccount").Preload("CreatedByUser").
		Where("project_id = ? AND csp_account_id = ?", projectID, cspAccountID).First(&relation).Error
	if err != nil {
		return nil, err
	}
	return &relation, nil
}

func (r *cspRepository) InsertProjectCSPAccount(relation *model.ProjectCSPAccount) error {
	return r.db.Create(relation).Error
}

func (r *cspRepository) UpdateProjectCSPAccount(relation *model.ProjectCSPAccount) error {
	return r.db.Save(relation).Error
}

func (r *cspRepository) DeleteProjectCSPAccount(id uint) error {
	return r.db.Delete(&model.ProjectCSPAccount{}, id).Error
}

func (r *cspRepository) DeleteProjectCSPAccountByProjectAndCSPAccount(projectID, cspAccountID uint) error {
	return r.db.Where("project_id = ? AND csp_account_id = ?", projectID, cspAccountID).
		Delete(&model.ProjectCSPAccount{}).Error
}

// CSPAccountMember related methods

func (r *cspRepository) SelectCSPAccountMemberAll() ([]model.CSPAccountMember, error) {
	var members []model.CSPAccountMember
	err := r.db.Preload("CSPAccount").Preload("Project").Preload("User").Preload("CreatedByUser").
		Find(&members).Error
	return members, err
}

func (r *cspRepository) SelectCSPAccountMemberByID(id uint) (*model.CSPAccountMember, error) {
	var member model.CSPAccountMember
	err := r.db.Preload("CSPAccount").Preload("Project").Preload("User").Preload("CreatedByUser").
		First(&member, id).Error
	if err != nil {
		return nil, err
	}
	return &member, nil
}

func (r *cspRepository) SelectCSPAccountMembersByCSPAccountID(cspAccountID uint) ([]model.CSPAccountMember, error) {
	var members []model.CSPAccountMember
	err := r.db.Preload("CSPAccount").Preload("Project").Preload("User").Preload("CreatedByUser").
		Where("csp_account_id = ?", cspAccountID).Order("created_at DESC").Find(&members).Error
	return members, err
}

func (r *cspRepository) SelectCSPAccountMembersByProjectID(projectID uint) ([]model.CSPAccountMember, error) {
	var members []model.CSPAccountMember
	err := r.db.Preload("CSPAccount").Preload("Project").Preload("User").Preload("CreatedByUser").
		Where("project_id = ?", projectID).Order("created_at DESC").Find(&members).Error
	return members, err
}

func (r *cspRepository) SelectCSPAccountMembersByUserID(userID uint) ([]model.CSPAccountMember, error) {
	var members []model.CSPAccountMember
	err := r.db.Preload("CSPAccount").Preload("Project").Preload("User").Preload("CreatedByUser").
		Where("user_id = ?", userID).Order("created_at DESC").Find(&members).Error
	return members, err
}

func (r *cspRepository) SelectCSPAccountMemberByCSPAccountAndUser(cspAccountID, userID uint) (*model.CSPAccountMember, error) {
	var member model.CSPAccountMember
	err := r.db.Preload("CSPAccount").Preload("Project").Preload("User").Preload("CreatedByUser").
		Where("csp_account_id = ? AND user_id = ?", cspAccountID, userID).First(&member).Error
	if err != nil {
		return nil, err
	}
	return &member, nil
}

func (r *cspRepository) SelectCSPAccountMemberByCSPAccountProjectAndUser(cspAccountID, projectID, userID uint) (*model.CSPAccountMember, error) {
	var member model.CSPAccountMember
	err := r.db.Preload("CSPAccount").Preload("Project").Preload("User").Preload("CreatedByUser").
		Where("csp_account_id = ? AND project_id = ? AND user_id = ?", cspAccountID, projectID, userID).First(&member).Error
	if err != nil {
		return nil, err
	}
	return &member, nil
}

func (r *cspRepository) InsertCSPAccountMember(member *model.CSPAccountMember) error {
	return r.db.Create(member).Error
}

func (r *cspRepository) UpdateCSPAccountMember(member *model.CSPAccountMember) error {
	return r.db.Save(member).Error
}

func (r *cspRepository) DeleteCSPAccountMember(id uint) error {
	return r.db.Delete(&model.CSPAccountMember{}, id).Error
}

func (r *cspRepository) DeleteCSPAccountMemberByCSPAccountAndUser(cspAccountID, userID uint) error {
	return r.db.Where("csp_account_id = ? AND user_id = ?", cspAccountID, userID).
		Delete(&model.CSPAccountMember{}).Error
}