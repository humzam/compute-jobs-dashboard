# Computational Jobs Dashboard - Makefile
# Production-ready Django + React application

.PHONY: help build up test stop clean prod-build prod-up prod-logs prod-down prod-deploy migrate migrate-prod makemigrations seed test-python lint format type-check quick-start

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

prod-deploy: prod-build migrate-prod prod-up ## Full production deployment

# Database Commands
migrate: ## Run Django migrations (development)
	docker compose exec backend python manage.py migrate

migrate-prod: ## Run Django migrations (production)
	docker compose -f docker-compose.prod.yml exec backend python manage.py migrate

makemigrations: ## Create new Django migrations
	docker compose exec backend python manage.py makemigrations

seed: ## Seed database with test data (development)
	docker compose exec backend python manage.py seed_test_data --clear --count 50

# Testing Commands
test-python: ## Run Python tests
	docker compose exec backend python manage.py test

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

# Quick Start Commands
quick-start: build up migrate seed ## Quick start development environment
	@echo ""
	@echo "🎉 Development environment is ready!"
	@echo "📱 Frontend: http://localhost:5173"
	@echo "🔧 Backend API: http://localhost:8000"
	@echo "⚡ Admin Panel: http://localhost:8000/admin"
	@echo "📊 Health Check: http://localhost:8000/health/"

