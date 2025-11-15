# Computational Jobs Dashboard - Architecture Plan

## System Overview
A web-based dashboard for managing computational jobs/tasks where users can submit, monitor, and control the execution of computational workloads. This system handles job scheduling, status tracking, and resource management for batch processing and background tasks.

## System Architecture

### Tech Stack
- **Backend**: Django 5.x + Django REST Framework
- **Frontend**: React 18 + TypeScript + Vite
- **Database**: PostgreSQL 16
- **Container**: Docker + docker-compose
- **Testing**: Playwright (E2E), pytest (Backend), Jest (Frontend)
- **State Management**: React Query (TanStack Query)
- **Styling**: Tailwind CSS
- **Authentication**: JWT tokens (optional for multi-user support)

### Project Structure
```
job-dashboard/
├── backend/
│   ├── config/           # Django settings, urls, wsgi
│   ├── jobs/            # Jobs application
│   │   ├── models.py    # Job and JobStatus models
│   │   ├── serializers.py
│   │   ├── views.py     # ViewSets for API
│   │   └── urls.py
│   ├── requirements.txt
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── JobList.tsx
│   │   │   ├── JobForm.tsx
│   │   │   ├── JobCard.tsx
│   │   │   └── StatusBadge.tsx
│   │   ├── services/     # API client layer
│   │   ├── hooks/        # Custom React hooks
│   │   ├── types/        # TypeScript interfaces
│   │   └── utils/        # Helper functions
│   └── package.json
├── tests/
│   └── e2e/              # Playwright E2E tests
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── Makefile              # Automation commands
```

## Data Models

### Core Models

#### Job
```python
- id: AutoField (Primary Key)
- name: CharField (Human-readable job name, max_length=255)
- created_at: DateTimeField (auto_now_add=True)
- updated_at: DateTimeField (auto_now=True)

# Extended fields for real-world usage:
- description: TextField (optional, job details)
- priority: IntegerField (1-10, default=5)
- scheduled_at: DateTimeField (optional, when to run)
- completed_at: DateTimeField (optional, when finished)
- error_message: TextField (optional, failure details)
- result_data: JSONField (optional, job output)
- resource_requirements: JSONField (optional, CPU/Memory requirements)
```

#### JobStatus
```python
- id: AutoField (Primary Key)
- job: ForeignKey(Job, on_delete=CASCADE, related_name='statuses')
- status_type: CharField (choices: PENDING, RUNNING, COMPLETED, FAILED, CANCELLED)
- timestamp: DateTimeField (auto_now_add=True)
- message: TextField (optional, status details)
- progress: IntegerField (0-100, optional, for progress tracking)
```

### Database Optimizations for Millions of Jobs
- **Indexes**:
  - Job: created_at, status (composite), priority
  - JobStatus: job_id, timestamp (composite)
- **Partitioning**: Consider partitioning JobStatus by timestamp for historical data
- **Archival Strategy**: Move completed jobs older than X days to archive tables

## API Design

### REST Endpoints

#### Job Management
- `GET /api/jobs/` - List all jobs with pagination and filtering
  - Query params: `?status=PENDING&page=1&size=20&ordering=-created_at`
  - Returns jobs with latest status embedded
- `POST /api/jobs/` - Create new job
  - Auto-creates initial JobStatus with PENDING
- `GET /api/jobs/{id}/` - Get job details with full status history
- `PATCH /api/jobs/{id}/` - Update job status
  - Creates new JobStatus entry
- `DELETE /api/jobs/{id}/` - Delete job and all related statuses

#### Additional Endpoints for Production Use
- `GET /api/jobs/stats/` - Dashboard statistics
  - Returns counts by status, average execution time, etc.
- `POST /api/jobs/{id}/cancel/` - Cancel running job
- `POST /api/jobs/{id}/retry/` - Retry failed job
- `GET /api/jobs/{id}/logs/` - Get job execution logs
- `GET /api/jobs/queue/` - Get next pending jobs for workers

### Serializers
```python
# Read serializer with nested latest status
class JobReadSerializer:
    - All job fields
    - latest_status (nested JobStatus)
    - status_history_count
    - execution_time (calculated)

# Write serializer for creation/updates
class JobWriteSerializer:
    - name (required)
    - description (optional)
    - priority (optional)
    - scheduled_at (optional)

# Status update serializer
class JobStatusUpdateSerializer:
    - status_type (required)
    - message (optional)
    - progress (optional)
```

## Frontend Architecture

### Component Structure
```typescript
App.tsx
├── Layout/
│   ├── Header.tsx (navigation, stats summary)
│   └── Sidebar.tsx (filters, quick actions)
├── Pages/
│   ├── Dashboard.tsx (main job list view)
│   ├── JobDetail.tsx (single job with status history)
│   └── CreateJob.tsx (job creation form)
└── Components/
    ├── JobList/
    │   ├── JobTable.tsx (tabular view)
    │   ├── JobCard.tsx (card view)
    │   └── JobFilters.tsx
    ├── JobForm/
    │   └── CreateJobModal.tsx
    ├── StatusBadge.tsx
    ├── ProgressBar.tsx
    └── Common/
        ├── Pagination.tsx
        ├── LoadingSpinner.tsx
        └── ErrorAlert.tsx
```

### State Management
- **React Query** for server state
- **Context API** for UI state (filters, view preferences)
- **Local Storage** for user preferences

### Key Features
1. **Real-time Updates**: WebSocket or polling for job status updates
2. **Bulk Actions**: Select multiple jobs for bulk status updates
3. **Search & Filter**: By name, status, date range, priority
4. **Views**: Toggle between table and card views
5. **Export**: Download job data as CSV/JSON

## Performance Optimizations

### Backend
1. **Database Query Optimization**:
   - Use `select_related` for ForeignKeys
   - Use `prefetch_related` for reverse relations
   - Implement cursor-based pagination for large datasets
   - Use database views for complex aggregations

2. **Caching Strategy**:
   - Cache job statistics (Redis)
   - Cache frequently accessed job details
   - Implement ETags for conditional requests

3. **Async Processing**:
   - Use Celery for background job execution
   - Implement job queue with Redis/RabbitMQ

### Frontend
1. **Data Fetching**:
   - Implement virtual scrolling for large lists
   - Use React Query for intelligent caching
   - Implement optimistic updates

2. **Rendering Optimization**:
   - Use React.memo for expensive components
   - Implement windowing for large lists
   - Code splitting by routes

## Testing Strategy

### E2E Tests (Playwright)
```typescript
// Required flows:
1. Create job → Verify PENDING status
2. Update status → Verify new status renders
3. Delete job → Verify removal
4. Filter jobs → Verify correct results
5. Pagination → Verify page navigation
```

### Backend Tests
- Model tests for Job and JobStatus
- API endpoint tests
- Serializer validation tests
- Performance tests for large datasets

### Frontend Tests
- Component unit tests
- Hook tests
- Integration tests for API calls

## Deployment Configuration

### Docker Setup
```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: job_dashboard
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    depends_on:
      - postgres
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/job_dashboard
    ports:
      - "8000:8000"

  frontend:
    build: ./frontend
    environment:
      - VITE_API_URL=http://localhost:8000/api
    ports:
      - "5173:5173"
```

### Makefile Commands
```makefile
build:    # Build Docker images
up:       # Start application stack
test:     # Run Playwright E2E tests
stop:     # Stop containers
clean:    # Clean volumes/networks
migrate:  # Run Django migrations
seed:     # Seed database with sample data
logs:     # Show container logs
shell:    # Django shell
```

## Security Considerations
- CORS configuration for frontend-backend communication
- Rate limiting on API endpoints
- Input validation and sanitization
- SQL injection prevention (ORM usage)
- XSS protection in frontend

## Scalability Considerations
1. **Horizontal Scaling**: Application servers behind load balancer
2. **Database Scaling**: Read replicas for GET requests
3. **Queue System**: Separate worker nodes for job execution
4. **Monitoring**: Prometheus + Grafana for metrics
5. **Logging**: Centralized logging with ELK stack