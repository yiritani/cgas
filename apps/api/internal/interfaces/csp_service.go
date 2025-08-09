package interfaces

import "go-nextjs-api/internal/model"

type CSPService interface {
	// CSPAccount related methods
	GetAllCSPAccounts() ([]model.CSPAccount, error)
	GetCSPAccountsWithPagination(page, limit int) ([]model.CSPAccount, *model.PaginationInfo, error)
	GetCSPAccountByID(id uint) (*model.CSPAccount, error)
	GetCSPAccountsByProvider(provider model.CSPProvider) ([]model.CSPAccount, error)
	CreateCSPAccount(adminID uint, req *model.CSPAccountCreateRequest) (*model.CSPAccount, error)
	UpdateCSPAccount(id uint, adminID uint, account *model.CSPAccount) (*model.CSPAccount, error)
	DeleteCSPAccount(id uint, adminID uint) error

	// ProjectCSPAccount related methods
	GetAllProjectCSPAccounts() ([]model.ProjectCSPAccount, error)
	GetProjectCSPAccountByID(id uint) (*model.ProjectCSPAccount, error)
	GetProjectCSPAccountsByProjectID(projectID uint) ([]model.ProjectCSPAccount, error)
	GetProjectCSPAccountsByCSPAccountID(cspAccountID uint) ([]model.ProjectCSPAccount, error)
	CreateProjectCSPAccount(adminID uint, projectID, cspAccountID uint) (*model.ProjectCSPAccount, error)
	DeleteProjectCSPAccount(id uint, adminID uint) error
	DeleteProjectCSPAccountByProjectAndCSPAccount(projectID, cspAccountID uint, adminID uint) error

	// CSPAccountMember related methods
	GetAllCSPAccountMembers() ([]model.CSPAccountMember, error)
	GetCSPAccountMemberByID(id uint) (*model.CSPAccountMember, error)
	GetCSPAccountMembersByCSPAccountID(cspAccountID uint) ([]model.CSPAccountMember, error)
	GetCSPAccountMembersByProjectID(projectID uint) ([]model.CSPAccountMember, error)
	GetCSPAccountMembersByUserID(userID uint) ([]model.CSPAccountMember, error)
	CreateCSPAccountMember(creatorID uint, req *model.CSPAccountMemberCreateRequest) (*model.CSPAccountMember, error)
	UpdateCSPAccountMember(id uint, userID uint, req *model.CSPAccountMemberUpdateRequest) (*model.CSPAccountMember, error)
	DeleteCSPAccountMember(id uint, userID uint) error

	// Permission checking methods
	CanUserManageCSPAccount(userID, cspAccountID uint) (bool, error)
	CanUserManageProjectCSPAccount(userID, projectID uint) (bool, error)
	CanUserManageCSPAccountMember(userID, cspAccountID uint) (bool, error)
}
