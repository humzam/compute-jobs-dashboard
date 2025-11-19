# Computational Jobs Dashboard - Makefile
# Production-ready Django + React application

.PHONY: help build up test stop clean prod-build prod-up prod-logs prod-down prod-deploy migrate migrate-prod makemigrations seed seed-prod test-python test-all lint format type-check security-check check-deps health-check metrics db-shell db-backup db-restore clean-all shell-backend shell-frontend install-deps ssl-setup env-template quick-start production-start

# Required Commands
build: ## Builds the Docker images
	docker compose build

up: ## Starts the entire application stack using Docker Compose
	docker compose up -d
	@echo "✅ Application stack started"
	@echo "Frontend: http://localhost:5173"
	@echo "Backend API: http://localhost:8000"
	@echo "Admin: http://localhost:8000/admin"

test: ## Runs your Playwright E2E tests
	@echo "🚀 Running E2E tests in Docker container..."
	docker compose --profile testing build e2e-tests
	docker compose --profile testing up frontend -d
	@echo "⏳ Waiting for frontend to be ready (30 seconds)..."
	@sleep 30
	docker compose --profile testing run --rm e2e-tests
	@echo "🧹 Cleaning up test containers..."
	docker compose --profile testing down

stop: ## Stops the running Docker containers
	docker compose down

clean: ## Removes Docker volumes/networks if necessary for a clean slate
	docker compose down -v --remove-orphans
	docker system prune -f
	docker volume prune -f

# Default target
help: ## Show this help message
	@echo "Computational Jobs Dashboard - Make Commands"
	@echo "============================================"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Production Commands
prod-build: ## Build production containers
	docker compose -f docker-compose.prod.yml build --no-cache

prod-up: ## Start production environment
	@if [ ! -f .env.prod ]; then \
		echo "❌ Error: .env.prod file not found"; \
		echo "Please create .env.prod with required environment variables"; \
		exit 1; \
	fi
	docker compose -f docker-compose.prod.yml up -d
	@echo "✅ Production environment started"
	@echo "Application: http://localhost"
	@echo "Health Check: http://localhost/health/"
	@echo "Metrics: http://localhost/metrics/"
	@echo "Monitoring: http://localhost:3000 (Grafana)"

prod-logs: ## View production logs
	docker compose -f docker-compose.prod.yml logs -f

prod-down: ## Stop production environment
	docker compose -f docker-compose.prod.yml down

prod-deploy: prod-build migrate-prod seed-prod prod-up ## Full production deployment

# Database Commands
migrate: ## Run Django migrations (development)
	docker compose exec backend python manage.py migrate

migrate-prod: ## Run Django migrations (production)
	docker compose -f docker-compose.prod.yml exec backend python manage.py migrate

makemigrations: ## Create new Django migrations
	docker compose exec backend python manage.py makemigrations

seed: ## Seed database with test data (development)
	docker compose exec backend python manage.py seed_test_data --clear --count 50

seed-prod: ## Seed production database with sample data
	docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
	@echo "✅ Sample data created for production"

# Testing Commands
test-python: ## Run Python tests
	docker compose exec backend python manage.py test

test-all: test test-python ## Run all tests (Python + E2E)

# Code Quality Commands
lint: ## Run linters
	@echo "🔍 Running Python linting..."
	docker compose exec backend python -m flake8 .
	@echo "🔍 Running JavaScript/TypeScript linting..."
	cd frontend && npm run lint

format: ## Format code
	@echo "🎨 Formatting Python code..."
	docker compose exec backend python -m black .
	@echo "🎨 Formatting JavaScript/TypeScript code..."
	cd frontend && npm run format

type-check: ## Run TypeScript type checking
	cd frontend && npm run build

# Security Commands
security-check: ## Run security checks
	@echo "🔐 Running Python security checks..."
	docker compose exec backend python -m pip-audit
	@echo "🔐 Running JavaScript security checks..."
	cd frontend && npm audit

check-deps: ## Check for dependency updates
	@echo "📦 Checking Python dependencies..."
	docker compose exec backend python -m pip list --outdated
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

# Database Management
db-shell: ## Open database shell
	docker compose exec db psql -U postgres -d job_dashboard

db-backup: ## Backup database
	@mkdir -p backups
	docker compose exec db pg_dump -U postgres -d job_dashboard > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Database backup created in backups/"

db-restore: ## Restore database from backup (requires BACKUP_FILE variable)
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "❌ Error: Please specify BACKUP_FILE variable"; \
		echo "Usage: make db-restore BACKUP_FILE=backups/backup_20231201_120000.sql"; \
		exit 1; \
	fi
	docker compose exec -T db psql -U postgres -d job_dashboard < $(BACKUP_FILE)
	@echo "✅ Database restored from $(BACKUP_FILE)"

clean-all: ## Deep clean (removes all Docker data)
	docker compose down -v --remove-orphans
	docker system prune -a -f
	docker volume prune -f

# Utility Commands
shell-backend: ## Open shell in backend container
	docker compose exec backend bash

shell-frontend: ## Open shell in frontend container
	docker compose exec frontend sh

install-deps: ## Install/update all dependencies
	cd frontend && npm install
	docker compose build

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

# Quick Start Commands
quick-start: build up migrate seed ## Quick start development environment
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
