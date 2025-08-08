package interfaces

import "go-nextjs-api/internal/model"

type CSPRepository interface {
	// CSPRequest related methods
	SelectCSPRequestAll() ([]model.CSPRequest, error)
	SelectCSPRequestWithPagination(page, limit int) ([]model.CSPRequest, *model.PaginationInfo, error)
	SelectCSPRequestByID(id uint) (*model.CSPRequest, error)
	SelectCSPRequestsByProjectID(projectID uint) ([]model.CSPRequest, error)
	SelectCSPRequestsByProjectIDWithPagination(projectID uint, page, limit int) ([]model.CSPRequest, *model.PaginationInfo, error)
	SelectCSPRequestsByUserID(userID uint) ([]model.CSPRequest, error)
	SelectCSPRequestsByStatus(status model.CSPRequestStatus) ([]model.CSPRequest, error)
	InsertCSPRequest(request *model.CSPRequest) error
	UpdateCSPRequest(request *model.CSPRequest) error
	DeleteCSPRequest(id uint) error

	// CSPAccount related methods
	SelectCSPAccountAll() ([]model.CSPAccount, error)
	SelectCSPAccountWithPagination(page, limit int) ([]model.CSPAccount, *model.PaginationInfo, error)
	SelectCSPAccountByID(id uint) (*model.CSPAccount, error)
	SelectCSPAccountsByProvider(provider model.CSPProvider) ([]model.CSPAccount, error)
	SelectCSPAccountByCSPRequestID(cspRequestID uint) (*model.CSPAccount, error)
	InsertCSPAccount(account *model.CSPAccount) error
	UpdateCSPAccount(account *model.CSPAccount) error
	DeleteCSPAccount(id uint) error

	// ProjectCSPAccount related methods
	SelectProjectCSPAccountAll() ([]model.ProjectCSPAccount, error)
	SelectProjectCSPAccountByID(id uint) (*model.ProjectCSPAccount, error)
	SelectProjectCSPAccountsByProjectID(projectID uint) ([]model.ProjectCSPAccount, error)
	SelectProjectCSPAccountsByCSPAccountID(cspAccountID uint) ([]model.ProjectCSPAccount, error)
	SelectProjectCSPAccountByProjectAndCSPAccount(projectID, cspAccountID uint) (*model.ProjectCSPAccount, error)
	InsertProjectCSPAccount(relation *model.ProjectCSPAccount) error
	UpdateProjectCSPAccount(relation *model.ProjectCSPAccount) error
	DeleteProjectCSPAccount(id uint) error
	DeleteProjectCSPAccountByProjectAndCSPAccount(projectID, cspAccountID uint) error

	// CSPAccountMember related methods
	SelectCSPAccountMemberAll() ([]model.CSPAccountMember, error)
	SelectCSPAccountMemberByID(id uint) (*model.CSPAccountMember, error)
	SelectCSPAccountMembersByCSPAccountID(cspAccountID uint) ([]model.CSPAccountMember, error)
	SelectCSPAccountMembersByProjectID(projectID uint) ([]model.CSPAccountMember, error)
	SelectCSPAccountMembersByUserID(userID uint) ([]model.CSPAccountMember, error)
	SelectCSPAccountMemberByCSPAccountAndUser(cspAccountID, userID uint) (*model.CSPAccountMember, error)
	SelectCSPAccountMemberByCSPAccountProjectAndUser(cspAccountID, projectID, userID uint) (*model.CSPAccountMember, error)
	InsertCSPAccountMember(member *model.CSPAccountMember) error
	UpdateCSPAccountMember(member *model.CSPAccountMember) error
	DeleteCSPAccountMember(id uint) error
	DeleteCSPAccountMemberByCSPAccountAndUser(cspAccountID, userID uint) error
}