package service

import (
	"go-nextjs-api/internal/database"
	"go-nextjs-api/internal/interfaces"
	"go-nextjs-api/internal/middleware"
	"go-nextjs-api/internal/model"
)

type authService struct {
	userRepo interfaces.UserRepository
}

func NewAuthService(userRepo interfaces.UserRepository) interfaces.AuthService {
	return &authService{userRepo: userRepo}
}

func (s *authService) Register(req *model.RegisterRequest) (*model.AuthResponse, error) {
	// パスワードをハッシュ化
	hashedPassword, err := model.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	// ユーザー作成
	user := &model.User{
		Name:     req.Name,
		Email:    req.Email,
		Password: hashedPassword,
	}

	if err := s.userRepo.Insert(user); err != nil {
		return nil, err
	}

	// 新規ユーザーをデフォルトプロジェクト（システム）にviewer権限で参加させる
	if err := s.addUserToDefaultProject(user.ID); err != nil {
		// プロジェクト参加に失敗してもユーザー作成は成功とする（ログに記録）
		// TODO: ログ出力を追加
	}

	// JWTトークン生成
	token, err := middleware.GenerateJWT(*user)
	if err != nil {
		return nil, err
	}

	return &model.AuthResponse{
		Token: token,
		User:  *user,
	}, nil
}

func (s *authService) Login(req *model.LoginRequest) (*model.AuthResponse, error) {
	// ユーザー検索
	user, err := s.userRepo.SelectByEmail(req.Email)
	if err != nil {
		return nil, err
	}

	// パスワード検証
	if err := model.CheckPassword(user.Password, req.Password); err != nil {
		return nil, err
	}

	// JWTトークン生成
	token, err := middleware.GenerateJWT(*user)
	if err != nil {
		return nil, err
	}

	return &model.AuthResponse{
		Token: token,
		User:  *user,
	}, nil
}

func (s *authService) GetUserByID(id uint) (*model.User, error) {
	return s.userRepo.SelectByID(id)
}

func (s *authService) RefreshToken(user *model.User) (string, error) {
	return middleware.GenerateJWT(*user)
}

// addUserToDefaultProject は新規ユーザーをデフォルトプロジェクトに追加
func (s *authService) addUserToDefaultProject(userID uint) error {
	// システムプロジェクト（デフォルトプロジェクト）を取得
	var systemProject model.Project
	if err := database.DB.Where("name = ?", "システム").First(&systemProject).Error; err != nil {
		return err
	}

	// 既に参加していないかチェック
	var existingRole model.UserProjectRole
	result := database.DB.Where("user_id = ? AND project_id = ?", userID, systemProject.ID).First(&existingRole)
	if result.Error == nil {
		// 既に参加している場合はスキップ
		return nil
	}

	// 新規ユーザーをviewer権限でシステムプロジェクトに参加させる
	userProjectRole := model.UserProjectRole{
		UserID:    userID,
		ProjectID: systemProject.ID,
		Role:      model.RoleViewer,
	}

	return database.DB.Create(&userProjectRole).Error
}