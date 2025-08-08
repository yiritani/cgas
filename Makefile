# Go Startup Project Makefile

.PHONY: help dev prod clean logs shell-admin shell-api migrate seed reset test-data cleanup-test

# Default target
help:
	@echo "🚀 Go Startup Project Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development environment"
	@echo "  make prod         - Start production environment"
	@echo "  make logs         - Show logs for all services"
	@echo "  make clean        - Stop and remove all containers"
	@echo ""
	@echo "Database:"
	@echo "  make migrate      - Run database migrations"
	@echo "  make seed         - Seed database with initial data"
	@echo "  make reset        - Reset database (drop + migrate + seed)"
	@echo "  make test-data    - Create pagination test data"
	@echo "  make cleanup-test - Cleanup test data"
	@echo ""
	@echo "Development:"
	@echo "  make shell-admin  - Open shell in admin container"
	@echo "  make shell-api    - Open shell in API container"
	@echo ""
	@echo "URLs:"
	@echo "  - User Site:  http://localhost:3000"
	@echo "  - Admin Site: http://localhost:3001"
	@echo "  - API:        http://localhost:8080"

# Development environment
dev:
	@echo "🚀 Starting development environment..."
	@docker-compose -f docker-compose.dev.yml up -d
	@echo "✅ Development environment started!"
	@echo "📋 Access URLs:"
	@echo "   - User Site:  http://localhost:3000"
	@echo "   - Admin Site: http://localhost:3001"
	@echo "   - API:        http://localhost:8080"

# Production environment
prod:
	@echo "🚀 Starting production environment..."
	@docker-compose up -d --build
	@echo "✅ Production environment started!"

# Show logs
logs:
	@docker-compose -f docker-compose.dev.yml logs -f

# Clean up
clean:
	@echo "🧹 Cleaning up containers..."
	@docker-compose -f docker-compose.dev.yml down -v
	@docker-compose down -v
	@echo "✅ Cleanup completed!"

# Database operations
migrate:
	@echo "🗃️  Running database migrations..."
	@docker-compose -f docker-compose.dev.yml exec api go run cmd/migrate/main.go -migrate

seed:
	@echo "🌱 Seeding database..."
	@docker-compose -f docker-compose.dev.yml exec api go run cmd/migrate/main.go -seed

reset:
	@echo "🔄 Resetting database..."
	@docker-compose -f docker-compose.dev.yml exec api go run cmd/migrate/main.go -reset

test-data:
	@echo "🎯 Creating pagination test data..."
	@docker-compose -f docker-compose.dev.yml exec api go run cmd/migrate/main.go -test-data

cleanup-test:
	@echo "🧹 Cleaning up test data..."
	@docker-compose -f docker-compose.dev.yml exec api go run cmd/migrate/main.go -cleanup-test

# Development shells
shell-admin:
	@docker-compose -f docker-compose.dev.yml exec web_admin sh

shell-api:
	@docker-compose -f docker-compose.dev.yml exec api sh

# Restart specific services
restart-admin:
	@docker-compose -f docker-compose.dev.yml restart web_admin

restart-api:
	@docker-compose -f docker-compose.dev.yml restart api

restart-web:
	@docker-compose -f docker-compose.dev.yml restart web