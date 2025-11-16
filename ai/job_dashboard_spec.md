# Job Management Dashboard Specification

## Summary
Build a simplified **Job Management Dashboard** where users can view, create, update, and delete computational jobs and manage their statuses.
Tech stack: **Django + DRF**, **PostgreSQL**, **React + TypeScript**, **Docker**, **Playwright**.

## 1. Backend Requirements — Django + PostgreSQL

### 1.1 Django Project Setup
- Create a Django project with one application (e.g., `jobs`).

### 1.2 Data Models

#### Job
| Field | Type | Notes |
|-------|------|-------|
| id | PK | Auto-generated |
| name | CharField | Human-readable job name |
| created_at | DateTimeField | Auto-set on creation |
| updated_at | DateTimeField | Auto-updated on save |

#### JobStatus
| Field | Type | Notes |
|-------|------|-------|
| id | PK | Auto-generated |
| job | ForeignKey → Job | Cascading delete |
| status_type | ChoiceField | PENDING, RUNNING, COMPLETED, FAILED |
| timestamp | DateTimeField | Time of status creation |

### 1.3 REST API Endpoints

#### GET /api/jobs/
- Return all jobs with latest status.

#### POST /api/jobs/
- Create new job.
- Automatically create initial JobStatus = PENDING.

#### PATCH /api/jobs/<id>/
- Update job status by creating a new JobStatus entry.

#### DELETE /api/jobs/<id>/
- Delete job and all related JobStatus rows.

### 1.4 PostgreSQL Configuration
- Configure Django to use PostgreSQL.

## 2. Frontend Requirements — React + TypeScript

### 2.1 Setup
- Create a React app (CRA, Vite, etc.).

### 2.2 UI Features
- List jobs with current status.
- Form to create job (name required).
- Ability to update status via dropdown/buttons/modal.
- Ability to delete job.
- Display error messages on API failures.
- Auto-update UI after CRUD actions.
- Style the UI.

## 3. Testing — Playwright E2E

### Required E2E Flow
1. Create a job; verify it appears with PENDING status.
2. Update job status; verify updated status renders.

## 4. Deployment & Setup — Docker + docker-compose + Makefile

### Docker
- Dockerfile for backend and frontend OR combined backend container with frontend build.

### docker-compose.yml
Orchestrates:
- Django backend
- PostgreSQL
- React frontend

Run via:
```
docker compose up
```

### Makefile Commands
| Command | Description |
|--------|-------------|
| make build | Build Docker images |
| make up | Start application stack |
| make test | Run Playwright E2E tests |
| make stop | Stop containers |
| make clean | Clean volumes/networks |

## 5. Performance Considerations
Assume millions of jobs.
- Optimize API queries, indexing, pagination.
- Efficient frontend data handling.
- Document considerations in README.md.
