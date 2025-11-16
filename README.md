# Computational Jobs Dashboard 🚀

A modern, production-ready web application for managing and monitoring computational jobs. Built with Django REST Framework and React, featuring real-time updates, comprehensive monitoring, and enterprise-grade performance optimizations.

## ✨ Features

### Core Functionality
- **Job Management**: Create, update, and delete computational jobs
- **Real-time Status Tracking**: Live updates for running jobs with progress indicators
- **Advanced Filtering**: Search by name, filter by status/priority with smart pagination
- **Status Management**: Comprehensive job lifecycle (PENDING → RUNNING → COMPLETED/FAILED/CANCELLED)
- **Priority System**: 10-level priority system (1-3: Low, 4-7: Medium, 8-10: High)

### Performance & Scalability
- **Optimized for Scale**: Handles 1000+ jobs with sub-2s page loads
- **Smart Caching**: Materialized database views with 5-minute refresh cycles
- **Efficient Pagination**: 10/20/50/100 items per page with intelligent query optimization
- **Database Indexing**: Partial indexes for common query patterns
- **Real-time Polling**: Automatic 5-second polling for RUNNING jobs only

### Production Features
- **Rate Limiting**: Tiered API limits (100/min read, 20/min write, 30/min stats)
- **Health Monitoring**: Comprehensive health checks and performance metrics
- **Security**: CORS protection, input validation, SQL injection prevention
- **Logging**: Structured JSON logging with request tracking
- **Containerization**: Production-ready Docker setup with multi-stage builds

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd job-dashboard
   ```

2. **Start development environment**
   ```bash
   make quick-start
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - Health Check: http://localhost:8000/health/

### Production Deployment

1. **Create production environment**
   ```bash
   make env-template
   # Edit .env.prod with your production values
   ```

2. **Deploy to production**
   ```bash
   make prod-deploy
   ```

## 📊 API Documentation

### Core Endpoints
```
GET    /api/jobs/           # List jobs with filtering/pagination
POST   /api/jobs/           # Create new job
PUT    /api/jobs/{id}/      # Update job status
DELETE /api/jobs/{id}/      # Delete job
GET    /health/             # Application health check
GET    /metrics/            # Performance metrics
```

### Example Usage

#### Create Job
```bash
POST /api/jobs/
{
  "name": "Data Processing Pipeline",
  "description": "Process customer data with validation rules",
  "priority": 7
}
```

#### Update Job Status
```bash
PUT /api/jobs/123/
{
  "status_type": "RUNNING",
  "message": "Processing batch 2 of 5",
  "progress": 40
}
```

## 🛠️ Development Commands

```bash
make dev-up              # Start development environment
make dev-down            # Stop development environment
make migrate             # Run Django migrations
make seed                # Seed with test data
make test                # Run Python tests
make test-e2e            # Run Playwright E2E tests
make lint                # Run linters
make prod-deploy         # Deploy to production
```

## 📈 Performance Benchmarks

- **Page Load Time**: < 2s for 1000+ jobs
- **API Response Time**: < 200ms for paginated requests
- **Stats Endpoint**: 100x improvement (500ms → 5ms) with materialized views
- **Memory Usage**: < 50MB growth during typical operations

## 🔒 Security Features

- **Rate Limiting**: 100/min read, 20/min write operations
- **CORS Protection**: Configured for specific origins
- **Input Validation**: Django REST Framework serializers
- **SQL Injection Prevention**: Django ORM parameterized queries
- **HTTPS Ready**: SSL/TLS configuration included

## 📦 Production Deployment

Production-ready setup includes:
- Multi-stage Docker builds
- Nginx load balancer
- PostgreSQL database with optimizations
- Redis cache for rate limiting
- Health checks and monitoring
- Structured logging

## 📋 Troubleshooting

### Common Issues

**Environment won't start:**
```bash
make clean && make dev-build && make migrate && make dev-up
```

**Check application health:**
```bash
make health-check
make metrics
```

**View logs:**
```bash
make logs-backend
make logs-frontend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `make test-all`
5. Submit a pull request

---

**Built with ❤️ for computational job management**
