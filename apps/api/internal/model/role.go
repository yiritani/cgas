package model

// Role はユーザーのロールを定義する型
type Role string

// ロール定数の定義
const (
	RoleOwner      Role = "owner"      // プロジェクトオーナー
	RoleAdmin      Role = "admin"      // プロジェクト管理者
	RoleViewer     Role = "viewer"     // プロジェクト閲覧者
)

// ValidRoles は有効なロールの一覧
var ValidRoles = []Role{
	RoleOwner,
	RoleAdmin,
	RoleViewer,
}

// IsValid はロールが有効かどうかをチェック
func (r Role) IsValid() bool {
	for _, validRole := range ValidRoles {
		if r == validRole {
			return true
		}
	}
	return false
}

// String はロールの文字列表現を返す
func (r Role) String() string {
	return string(r)
}

// HasPermission は指定したロールに対して権限があるかチェック
func (r Role) HasPermission(requiredRole Role) bool {
	roleHierarchy := map[Role]int{
		RoleOwner:     1,
		RoleAdmin:     2,
		RoleViewer:    3,
	}

	userLevel, userExists := roleHierarchy[r]
	requiredLevel, requiredExists := roleHierarchy[requiredRole]

	if !userExists || !requiredExists {
		return false
	}

	return userLevel >= requiredLevel
}

// CanManageProject はプロジェクト管理権限があるかチェック
func (r Role) CanManageProject() bool {
	return r == RoleOwner || r == RoleAdmin
}

// CanEditProject はプロジェクト編集権限があるかチェック
func (r Role) CanEditProject() bool {
	return r == RoleOwner || r == RoleAdmin
}

// CanViewProject はプロジェクト閲覧権限があるかチェック
func (r Role) CanViewProject() bool {
	return r.IsValid() // 全ての有効なロールで閲覧可能
}