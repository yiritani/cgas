package model

import "errors"

// Model layer errors
var (
	// Role related errors
	ErrInvalidRole = errors.New("invalid role specified")
	
	// Project related errors
	ErrProjectNotFound     = errors.New("project not found")
	ErrProjectAccessDenied = errors.New("access denied to project")
	ErrInvalidProjectStatus = errors.New("invalid project status")
	
	// User related errors
	ErrUserNotFound        = errors.New("user not found")
	ErrUserAlreadyExists   = errors.New("user already exists")
	ErrInvalidCredentials  = errors.New("invalid credentials")
	
	// User Project Role related errors
	ErrUserProjectRoleNotFound     = errors.New("user project role not found")
	ErrUserProjectRoleAlreadyExists = errors.New("user project role already exists")
	ErrUserNotProjectMember        = errors.New("user is not a member of this project")
	ErrInsufficientPermissions     = errors.New("insufficient permissions")
	ErrInsufficientPermission      = errors.New("insufficient permission")
	ErrCannotRemoveLastOwner       = errors.New("cannot remove the last owner from project")
	
	// CSP Provisioning related errors
	ErrInvalidCSPProvider       = errors.New("invalid CSP provider specified")
	ErrInvalidCSPRequestStatus  = errors.New("invalid CSP provisioning status")
	ErrCSPRequestNotFound      = errors.New("CSP provisioning not found")
	ErrCSPAccountNotFound      = errors.New("CSP account not found")
	ErrCSPRequestAlreadyReviewed = errors.New("CSP provisioning already reviewed")
	ErrProjectCSPAccountNotFound = errors.New("project CSP account relation not found")
	ErrProjectCSPAccountAlreadyExists = errors.New("project CSP account relation already exists")
)