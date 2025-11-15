# Job Dashboard - Architecture Plan

## System Architecture Overview

### Tech Stack
- **Backend**: Django 5.x + Django REST Framework
- **Frontend**: React 18 + TypeScript + Vite
- **Database**: PostgreSQL 16
- **Container**: Docker + docker-compose
- **Testing**: Playwright (E2E), Jest (Frontend), pytest (Backend)
- **State Management**: React Query (TanStack Query)
- **Styling**: Tailwind CSS
- **Authentication**: JWT tokens with httpOnly cookies

### Project Structure
```
job-dashboard/
├── backend/
│   ├── config/           # Django settings, urls, wsgi
│   ├── apps/
│   │   ├── accounts/     # User auth, profiles
│   │   ├── jobs/         # Job listings, applications
│   │   └── core/         # Shared utilities
│   ├── requirements/
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route-based page components
│   │   ├── services/     # API client layer
│   │   ├── hooks/        # Custom React hooks
│   │   ├── types/        # TypeScript interfaces
│   │   └── utils/        # Helper functions
│   └── package.json
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── tests/
    └── e2e/              # Playwright tests
```

## Data Models

### Core Models

#### User (extends Django AbstractUser)
```python
- email: EmailField (unique, used for login)
- username: CharField (optional)
- first_name: CharField
- last_name: CharField
- is_email_verified: BooleanField
- created_at: DateTimeField
- updated_at: DateTimeField
```

#### Company
```python
- name: CharField
- website: URLField (nullable)
- description: TextField (nullable)
- location: CharField (nullable)
- created_at: DateTimeField
- updated_at: DateTimeField
```

#### JobListing
```python
- user: ForeignKey(User)
- company: ForeignKey(Company)
- position_title: CharField
- description: TextField
- location: CharField
- location_type: CharField (choices: remote/hybrid/onsite)
- salary_min: DecimalField (nullable)
- salary_max: DecimalField (nullable)
- salary_currency: CharField (default: USD)
- url: URLField
- source: CharField (choices: linkedin/indeed/company/other)
- status: CharField (choices: active/expired/filled)
- posted_date: DateField (nullable)
- created_at: DateTimeField
- updated_at: DateTimeField
```

#### Application
```python
- user: ForeignKey(User)
- job_listing: ForeignKey(JobListing)
- status: CharField (choices: interested/applied/interviewing/offer/rejected/withdrawn)
- date_applied: DateField (nullable)
- notes: TextField (nullable)
- resume_version: CharField (nullable)
- cover_letter: TextField (nullable)
- created_at: DateTimeField
- updated_at: DateTimeField
```

#### ApplicationActivity
```python
- application: ForeignKey(Application)
- activity_type: CharField (choices: status_change/note/interview/followup)
- description: TextField
- scheduled_date: DateTimeField (nullable)
- completed: BooleanField
- created_at: DateTimeField
```

#### Interview
```python
- application: ForeignKey(Application)
- interview_type: CharField (choices: phone/video/onsite/technical/behavioral)
- scheduled_datetime: DateTimeField
- duration_minutes: IntegerField
- interviewer_name: CharField (nullable)
- interviewer_title: CharField (nullable)
- location: CharField (nullable)
- meeting_link: URLField (nullable)
- notes: TextField (nullable)
- outcome: CharField (nullable, choices: passed/failed/pending)
- created_at: DateTimeField
- updated_at: DateTimeField
```

## API Design

### Authentication Endpoints
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - Login (returns JWT)
- `POST /api/auth/logout/` - Logout (clears httpOnly cookie)
- `POST /api/auth/refresh/` - Refresh JWT token
- `GET /api/auth/me/` - Current user info
- `PUT /api/auth/me/` - Update user profile
- `POST /api/auth/verify-email/` - Verify email address
- `POST /api/auth/reset-password/` - Request password reset
- `POST /api/auth/reset-password/confirm/` - Confirm password reset

### Job Management Endpoints
- `GET /api/jobs/` - List user's job listings (paginated, filterable)
- `POST /api/jobs/` - Create job listing
- `GET /api/jobs/{id}/` - Get job details
- `PUT /api/jobs/{id}/` - Update job listing
- `DELETE /api/jobs/{id}/` - Delete job listing
- `POST /api/jobs/bulk-import/` - Import jobs from CSV/JSON
- `GET /api/jobs/stats/` - Dashboard statistics

### Application Endpoints
- `GET /api/applications/` - List applications (filterable by status)
- `POST /api/applications/` - Create application
- `GET /api/applications/{id}/` - Get application details
- `PUT /api/applications/{id}/` - Update application
- `DELETE /api/applications/{id}/` - Delete application
- `POST /api/applications/{id}/status/` - Update application status
- `GET /api/applications/{id}/timeline/` - Get application timeline

### Interview Endpoints
- `GET /api/interviews/` - List interviews (upcoming/past)
- `POST /api/interviews/` - Schedule interview
- `GET /api/interviews/{id}/` - Get interview details
- `PUT /api/interviews/{id}/` - Update interview
- `DELETE /api/interviews/{id}/` - Cancel interview
- `GET /api/interviews/calendar/` - Calendar view data

### Company Endpoints
- `GET /api/companies/` - List companies
- `POST /api/companies/` - Create company
- `GET /api/companies/{id}/` - Get company details
- `PUT /api/companies/{id}/` - Update company
- `GET /api/companies/search/` - Search companies

### Analytics Endpoints
- `GET /api/analytics/overview/` - Dashboard overview stats
- `GET /api/analytics/applications/` - Application funnel metrics
- `GET /api/analytics/activity/` - Activity timeline

## Frontend Component Architecture

### Pages Structure
```typescript
pages/
├── auth/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── ForgotPasswordPage.tsx
│   └── VerifyEmailPage.tsx
├── dashboard/
│   ├── DashboardPage.tsx         # Overview with stats
│   └── components/
│       ├── StatsCards.tsx
│       ├── ApplicationFunnel.tsx
│       ├── RecentActivity.tsx
│       └── UpcomingInterviews.tsx
├── jobs/
│   ├── JobListPage.tsx           # All job listings
│   ├── JobDetailPage.tsx         # Single job view
│   ├── JobFormPage.tsx           # Create/Edit job
│   └── components/
│       ├── JobCard.tsx
│       ├── JobFilters.tsx
│       └── JobImportModal.tsx
├── applications/
│   ├── ApplicationListPage.tsx   # Kanban board view
│   ├── ApplicationDetailPage.tsx
│   └── components/
│       ├── ApplicationCard.tsx
│       ├── StatusColumn.tsx
│       └── ApplicationTimeline.tsx
├── interviews/
│   ├── InterviewCalendarPage.tsx
│   ├── InterviewListPage.tsx
│   └── components/
│       ├── InterviewCard.tsx
│       ├── CalendarView.tsx
│       └── InterviewModal.tsx
└── settings/
    └── SettingsPage.tsx
```

### Core Components
```typescript
components/
├── layout/
│   ├── AppLayout.tsx          # Main app wrapper
│   ├── Header.tsx             # Navigation bar
│   ├── Sidebar.tsx            # Side navigation
│   └── Footer.tsx
├── common/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Modal.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── Spinner.tsx
│   ├── EmptyState.tsx
│   ├── ErrorBoundary.tsx
│   └── Pagination.tsx
├── forms/
│   ├── FormField.tsx
│   ├── FormError.tsx
│   └── FormSubmitButton.tsx
└── charts/
    ├── BarChart.tsx
    ├── LineChart.tsx
    └── PieChart.tsx
```

### Service Layer
```typescript
services/
├── api/
│   ├── client.ts              # Axios instance with interceptors
│   ├── auth.service.ts        # Authentication API calls
│   ├── jobs.service.ts        # Job-related API calls
│   ├── applications.service.ts
│   ├── interviews.service.ts
│   └── analytics.service.ts
└── utils/
    ├── storage.ts             # LocalStorage helpers
    ├── dates.ts               # Date formatting
    └── validators.ts          # Form validation
```

### React Query Hooks
```typescript
hooks/
├── auth/
│   ├── useAuth.ts
│   ├── useLogin.ts
│   └── useRegister.ts
├── jobs/
│   ├── useJobs.ts
│   ├── useJob.ts
│   ├── useCreateJob.ts
│   └── useUpdateJob.ts
├── applications/
│   ├── useApplications.ts
│   ├── useApplication.ts
│   └── useUpdateApplicationStatus.ts
└── common/
    ├── useDebounce.ts
    ├── usePagination.ts
    └── useToast.ts
```

## Key Technical Decisions

### Backend
- **Pagination**: Use cursor-based pagination for large datasets
- **Permissions**: Use DRF's IsAuthenticated + object-level permissions
- **Serializers**: Separate read/write serializers for complex models
- **Querysets**: Optimize with select_related/prefetch_related
- **Caching**: Redis for session storage and API response caching

### Frontend
- **State Management**: React Query for server state, Context for auth
- **Forms**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with custom design tokens
- **Charts**: Recharts for data visualization
- **Date Handling**: date-fns for date manipulation

### Security
- **Authentication**: JWT in httpOnly cookies
- **CORS**: Whitelist frontend origin
- **Rate Limiting**: Django-ratelimit on API endpoints
- **Input Validation**: Backend + frontend validation
- **SQL Injection**: Use Django ORM, no raw queries

### Performance
- **Database**: Indexes on foreign keys and filter fields
- **API**: Pagination, field filtering, eager loading
- **Frontend**: Code splitting, lazy loading, memoization
- **Assets**: CDN for static files, image optimization