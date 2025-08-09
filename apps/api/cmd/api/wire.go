//go:build wireinject
// +build wireinject

package main

import (
	"go-nextjs-api/internal/database"
	"go-nextjs-api/internal/handler"
	"go-nextjs-api/internal/repository"
	"go-nextjs-api/internal/service"

	"github.com/google/wire"
	"gorm.io/gorm"
)

// ApplicationContainer はアプリケーションの依存関係をまとめる構造体
type ApplicationContainer struct {
	UserHandler     *handler.UserHandler
	AuthHandler     *handler.AuthHandler
	ProjectHandler  *handler.ProjectHandler
	CSPHandler      *handler.CSPHandler
	InternalHandler *handler.InternalHandler
}

// initializeApplication はWireを使って依存関係を注入したApplicationContainerを作成
func initializeApplication(db *gorm.DB) (*ApplicationContainer, error) {
	wire.Build(
		// Repository層のプロバイダー
		repository.NewUserRepository,
		repository.NewProjectRepository,
		repository.NewCSPRepository,
		
		// Service層のプロバイダー
		service.NewUserService,
		service.NewAuthService,
		service.NewProjectService,
		service.NewCSPService,
		
		// Handler層のプロバイダー
		handler.NewUserHandler,
		handler.NewAuthHandler,
		handler.NewProjectHandler,
		handler.NewCSPHandler,
		handler.NewInternalHandler,
		
		// ApplicationContainerの構築
		wire.Struct(new(ApplicationContainer), "*"),
	)
	return &ApplicationContainer{}, nil
}

// DatabaseProvider はデータベースインスタンスを提供
func DatabaseProvider() *gorm.DB {
	return database.DB
}