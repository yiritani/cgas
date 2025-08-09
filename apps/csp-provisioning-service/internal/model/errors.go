package model

import "errors"

// CSP関連のエラー定義
var (
	ErrInvalidCSPProvider       = errors.New("invalid CSP provider")
	ErrInvalidCSPRequestStatus  = errors.New("invalid CSP request status")
	ErrCSPRequestAlreadyReviewed = errors.New("CSP request is already reviewed")
	ErrInsufficientPermissions  = errors.New("insufficient permissions")
	ErrCSPRequestNotFound       = errors.New("CSP request not found")
)
