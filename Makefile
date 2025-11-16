# Computational Jobs Dashboard - Makefile
# Production-ready Django + React application

.PHONY: help build up down logs clean migrate seed test lint format check-deps security-check

# Default target
help: ## Show this help message
	@echo "Computational Jobs Dashboard - Make Commands"
	@echo "============================================"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development Commands
dev-build: ## Build development containers
	docker-compose build

dev-up: ## Start development environment
	docker-compose up -d
	@echo "✅ Development environment started"
	@echo "Frontend: http://localhost:5173"
	@echo "Backend API: http://localhost:8000"
	@echo "Admin: http://localhost:8000/admin"

dev-logs: ## View development logs
	docker-compose logs -f

dev-down: ## Stop development environment
	docker-compose down

dev-clean: ## Clean development environment (removes volumes)
	docker-compose down -v --remove-orphans
	docker system prune -f

# Production Commands
prod-build: ## Build production containers
	docker-compose -f docker-compose.prod.yml build --no-cache

prod-up: ## Start production environment
	@if [ ! -f .env.prod ]; then \
		echo "❌ Error: .env.prod file not found"; \
		echo "Please create .env.prod with required environment variables"; \
		exit 1; \
	fi
	docker-compose -f docker-compose.prod.yml up -d
	@echo "✅ Production environment started"
	@echo "Application: http://localhost"
	@echo "Health Check: http://localhost/health/"
	@echo "Metrics: http://localhost/metrics/"
	@echo "Monitoring: http://localhost:3000 (Grafana)"

prod-logs: ## View production logs
	docker-compose -f docker-compose.prod.yml logs -f

prod-down: ## Stop production environment
	docker-compose -f docker-compose.prod.yml down

prod-deploy: prod-build migrate-prod seed-prod prod-up ## Full production deployment

# Database Commands
migrate: ## Run Django migrations (development)
	docker-compose exec backend python manage.py migrate

migrate-prod: ## Run Django migrations (production)
	docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

makemigrations: ## Create new Django migrations
	docker-compose exec backend python manage.py makemigrations

seed: ## Seed database with test data (development)
	docker-compose exec backend python manage.py seed_test_data --clear --count 50

seed-prod: ## Seed production database with sample data
	docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
	@echo "✅ Sample data created for production"

# Testing Commands
test: ## Run Python tests
	docker-compose exec backend python manage.py test

test-e2e: ## Run Playwright E2E tests
	npm run test:e2e

test-e2e-headed: ## Run E2E tests with browser UI
	npm run test:e2e:headed

test-performance: ## Run performance-specific E2E tests
	npm run test:e2e -- e2e/performance.spec.ts

test-all: test test-e2e ## Run all tests (Python + E2E)

# Code Quality Commands
lint: ## Run linters
	@echo "🔍 Running Python linting..."
	docker-compose exec backend python -m flake8 .
	@echo "🔍 Running JavaScript/TypeScript linting..."
	cd frontend && npm run lint

format: ## Format code
	@echo "🎨 Formatting Python code..."
	docker-compose exec backend python -m black .
	@echo "🎨 Formatting JavaScript/TypeScript code..."
	cd frontend && npm run format

type-check: ## Run TypeScript type checking
	cd frontend && npm run build

# Security Commands
security-check: ## Run security checks
	@echo "🔐 Running Python security checks..."
	docker-compose exec backend python -m pip-audit
	@echo "🔐 Running JavaScript security checks..."
	cd frontend && npm audit

check-deps: ## Check for dependency updates
	@echo "📦 Checking Python dependencies..."
	docker-compose exec backend python -m pip list --outdated
	@echo "📦 Checking Node.js dependencies..."
	cd frontend && npm outdated

# Monitoring Commands
health-check: ## Check application health
	@echo "🏥 Checking application health..."
	@curl -s http://localhost:8000/health/ | python -m json.tool || echo "❌ Backend health check failed"
	@curl -s http://localhost/ > /dev/null && echo "✅ Frontend is accessible" || echo "❌ Frontend health check failed"

metrics: ## View performance metrics
	@echo "📊 Application metrics:"
	@curl -s http://localhost:8000/metrics/ | python -m json.tool

logs-backend: ## View backend logs only
	docker-compose logs -f backend

logs-frontend: ## View frontend logs only
	docker-compose logs -f frontend

logs-db: ## View database logs only
	docker-compose logs -f db

# Database Management
db-shell: ## Open database shell
	docker-compose exec db psql -U postgres -d job_dashboard

db-backup: ## Backup database
	@mkdir -p backups
	docker-compose exec db pg_dump -U postgres -d job_dashboard > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Database backup created in backups/"

db-restore: ## Restore database from backup (requires BACKUP_FILE variable)
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "❌ Error: Please specify BACKUP_FILE variable"; \
		echo "Usage: make db-restore BACKUP_FILE=backups/backup_20231201_120000.sql"; \
		exit 1; \
	fi
	docker-compose exec -T db psql -U postgres -d job_dashboard < $(BACKUP_FILE)
	@echo "✅ Database restored from $(BACKUP_FILE)"

# Cleanup Commands
clean: ## Clean up Docker resources
	docker-compose down -v --remove-orphans
	docker system prune -f
	docker volume prune -f

clean-all: ## Deep clean (removes all Docker data)
	docker-compose down -v --remove-orphans
	docker system prune -a -f
	docker volume prune -f

# Utility Commands
shell-backend: ## Open shell in backend container
	docker-compose exec backend bash

shell-frontend: ## Open shell in frontend container
	docker-compose exec frontend sh

install-deps: ## Install/update all dependencies
	cd frontend && npm install
	docker-compose build

# Production Utilities
ssl-setup: ## Generate SSL certificates for production
	@mkdir -p ssl
	@openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout ssl/nginx.key \
		-out ssl/nginx.crt \
		-subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=localhost"
	@echo "✅ SSL certificates generated in ssl/"

env-template: ## Create environment template files
	@echo "Creating .env.example..."
	@echo "# Development Environment Variables" > .env.example
	@echo "DB_PASSWORD=your_secure_password" >> .env.example
	@echo "SECRET_KEY=your_django_secret_key" >> .env.example
	@echo "DEBUG=True" >> .env.example
	@echo "" >> .env.example
	@echo "Creating .env.prod.example..."
	@echo "# Production Environment Variables" > .env.prod.example
	@echo "DB_USER=jobuser" >> .env.prod.example
	@echo "DB_PASSWORD=your_very_secure_password" >> .env.prod.example
	@echo "SECRET_KEY=your_production_secret_key" >> .env.prod.example
	@echo "GRAFANA_PASSWORD=your_grafana_admin_password" >> .env.prod.example
	@echo "DEBUG=False" >> .env.prod.example
	@echo "✅ Environment template files created"

# CI/CD Commands (for GitHub Actions or similar)
ci-test: ## Run all CI tests
	@echo "🚀 Running CI test suite..."
	make lint
	make type-check
	make test
	make security-check

# Quick Start Commands
quick-start: dev-build migrate seed dev-up ## Quick start development environment
	@echo ""
	@echo "🎉 Development environment is ready!"
	@echo "📱 Frontend: http://localhost:5173"
	@echo "🔧 Backend API: http://localhost:8000"
	@echo "⚡ Admin Panel: http://localhost:8000/admin"
	@echo "📊 Health Check: http://localhost:8000/health/"

production-start: env-template ## Initialize production environment
	@echo "🏭 Production environment setup..."
	@echo "1. Fill in .env.prod with your production values"
	@echo "2. Run: make prod-deploy"
	@echo "3. Access your application at http://localhost"

# Status and Information
status: ## Show current environment status
	@echo "🔍 Environment Status:"
	@echo "====================="
	@docker-compose ps 2>/dev/null || echo "Development environment not running"
	@echo ""
	@docker-compose -f docker-compose.prod.yml ps 2>/dev/null || echo "Production environment not running"