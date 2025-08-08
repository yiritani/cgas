# Database Migration Commands

.PHONY: help migrate seed drop reset build clean test-data cleanup-test

# Default target
help:
	@echo "🗃️  Database Migration Tool - Available Commands:"
	@echo ""
	@echo "  make migrate    - Run database migrations"
	@echo "  make seed       - Run database seeding"
	@echo "  make drop       - Drop all tables (WARNING: Deletes all data)"
	@echo "  make reset      - Reset database (drop + migrate + seed)"
	@echo "  make test-data  - Create pagination test data (50+ users)"
	@echo "  make cleanup-test - Cleanup test data"
	@echo "  make build      - Build migration tool"
	@echo "  make clean      - Clean build artifacts"
	@echo ""
	@echo "Docker Commands:"
	@echo "  make docker-migrate     - Run migrations in Docker container"
	@echo "  make docker-seed        - Run seeding in Docker container"
	@echo "  make docker-reset       - Reset database in Docker container"
	@echo "  make docker-test-data   - Create test data in Docker container"
	@echo "  make docker-cleanup-test - Cleanup test data in Docker container"

# Local migration commands
migrate:
	@echo "🚀 Running migrations..."
	@go run cmd/migrate/main.go -migrate

seed:
	@echo "🌱 Seeding database..."
	@go run cmd/migrate/main.go -seed

drop:
	@echo "🗑️  Dropping tables..."
	@go run cmd/migrate/main.go -drop

reset:
	@echo "🔄 Resetting database..."
	@go run cmd/migrate/main.go -reset

test-data:
	@echo "🎯 Creating pagination test data..."
	@go run cmd/migrate/main.go -test-data

cleanup-test:
	@echo "🧹 Cleaning up test data..."
	@go run cmd/migrate/main.go -cleanup-test

# Docker migration commands
docker-migrate:
	@echo "🚀 Running migrations in Docker..."
	@docker exec -it api-1 go run cmd/migrate/main.go -migrate

docker-seed:
	@echo "🌱 Seeding database in Docker..."
	@docker exec -it api-1 go run cmd/migrate/main.go -seed

docker-drop:
	@echo "🗑️  Dropping tables in Docker..."
	@docker exec -it api-1 go run cmd/migrate/main.go -drop

docker-reset:
	@echo "🔄 Resetting database in Docker..."
	@docker exec -it api-1 go run cmd/migrate/main.go -reset

docker-test-data:
	@echo "🎯 Creating pagination test data in Docker..."
	@docker exec -it api-1 go run cmd/migrate/main.go -test-data

docker-cleanup-test:
	@echo "🧹 Cleaning up test data in Docker..."
	@docker exec -it api-1 go run cmd/migrate/main.go -cleanup-test

# Build commands
build:
	@echo "🔨 Building migration tool..."
	@go build -o bin/migrate cmd/migrate/main.go

clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf bin/ tmp/ build-errors.log

# Development helpers
dev-reset: reset
	@echo "✅ Development database reset complete!"

# Check database connection
check-db:
	@echo "🔍 Checking database connection..."
	@go run cmd/migrate/main.go -help | grep "DATABASE_URL"