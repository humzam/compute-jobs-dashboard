# Job Dashboard - Implementation Roadmap (AI Instructions)

## Implementation Order
Execute milestones sequentially. Each milestone must be fully completed and tested before proceeding to the next. Use the architecture-plan.md for technical specifications.

## Milestone 1: Project Initialization

### 1.1 Docker Setup
Create docker-compose.yml with services: postgres, backend, frontend
Create Dockerfile.backend for Django
Create Dockerfile.frontend for React
Configure volumes for hot-reload development
Set environment variables for database connection

### 1.2 Backend Project Structure
Initialize Django project named "config" in backend/ directory
Create Django apps: accounts, jobs, core
Configure settings.py with: INSTALLED_APPS, DATABASES, REST_FRAMEWORK, CORS_HEADERS
Setup requirements.txt with: django, djangorestframework, django-cors-headers, psycopg2-binary, python-decouple, djangorestframework-simplejwt

### 1.3 Frontend Project Structure
Initialize React project using Vite in frontend/ directory
Install dependencies: react, react-dom, react-router-dom, axios, @tanstack/react-query, typescript
Configure TypeScript with strict mode
Setup Tailwind CSS with configuration file
Create src/ folder structure: components/, pages/, services/, hooks/, types/, utils/

## Milestone 2: Authentication System

### 2.1 Backend Authentication
Create custom User model in accounts/models.py extending AbstractUser with email as primary identifier
Implement JWT authentication using djangorestframework-simplejwt with httpOnly cookies
Create serializers: UserSerializer, RegisterSerializer, LoginSerializer in accounts/serializers.py
Create viewsets in accounts/views.py: RegisterView, LoginView, LogoutView, RefreshView, UserProfileView
Configure urls in accounts/urls.py for all auth endpoints
Run migrations to create user tables

### 2.2 Frontend Authentication
Create AuthContext in src/contexts/AuthContext.tsx with user state and auth methods
Implement auth service in src/services/auth.service.ts with login, register, logout, refresh functions
Create Login page at src/pages/auth/LoginPage.tsx with form validation
Create Register page at src/pages/auth/RegisterPage.tsx with form validation
Setup protected routes in App.tsx using React Router
Configure axios interceptors for token refresh in src/services/api/client.ts

## Milestone 3: Data Models Implementation

### 3.1 Core Models Creation
Create Company model in jobs/models.py with fields: name, website, description, location
Create JobListing model in jobs/models.py with all specified fields and relationships
Create Application model in jobs/models.py with status choices and foreign keys
Create ApplicationActivity model for tracking timeline events
Create Interview model with all interview-related fields
Run migrations after each model creation

### 3.2 Serializers and ViewSets
Create CompanySerializer with nested representation
Create JobListingSerializer with read/write variants
Create ApplicationSerializer with status validation
Create InterviewSerializer with datetime handling
Implement viewsets with proper permission classes (IsAuthenticated)
Configure pagination and filtering in viewsets

## Milestone 4: Job Management Feature

### 4.1 Job API Endpoints
Implement JobListingViewSet with list, create, retrieve, update, destroy actions
Add custom action for bulk import from CSV/JSON
Implement filtering by company, status, location_type
Add search functionality for position_title and description
Create job statistics endpoint returning aggregated data

### 4.2 Job Frontend Pages
Create JobListPage.tsx with pagination and filtering UI
Implement JobCard.tsx component displaying job summary
Create JobDetailPage.tsx showing full job information
Build JobFormPage.tsx with validation for create/edit operations
Implement useJobs.ts hook using React Query for data fetching
Add job deletion with confirmation modal

## Milestone 5: Application Tracking

### 5.1 Application Backend
Implement ApplicationViewSet with CRUD operations
Create custom endpoint for status updates with validation
Build timeline endpoint aggregating ApplicationActivity records
Add filtering by status, job, and date range
Implement soft delete for applications

### 5.2 Kanban Board Frontend
Create ApplicationListPage.tsx with drag-and-drop kanban layout
Build StatusColumn.tsx component for each application status
Implement ApplicationCard.tsx with summary information
Create drag-and-drop handlers updating application status via API
Build ApplicationDetailPage.tsx with full timeline view
Implement real-time updates using React Query mutations

## Milestone 6: Interview Management

### 6.1 Interview Backend
Create InterviewViewSet with CRUD operations
Implement calendar endpoint returning interviews grouped by date
Add filtering for upcoming vs past interviews
Create interview reminder logic (prepare for future email integration)
Implement outcome tracking with validation

### 6.2 Interview Frontend
Build InterviewCalendarPage.tsx using calendar library
Create InterviewCard.tsx component with interview details
Implement InterviewModal.tsx for scheduling/editing
Build interview list view with filtering options
Add interview notifications to dashboard
Create useInterviews.ts hook for data management

## Milestone 7: Dashboard and Analytics

### 7.1 Analytics Backend
Create AnalyticsViewSet with read-only endpoints
Implement overview endpoint with counts and percentages
Build application funnel endpoint with stage metrics
Create activity timeline aggregating recent changes
Add data export endpoint supporting CSV format

### 7.2 Dashboard Frontend
Create DashboardPage.tsx with responsive grid layout
Build StatsCards.tsx displaying key metrics
Implement ApplicationFunnel.tsx chart using Recharts
Create RecentActivity.tsx timeline component
Build UpcomingInterviews.tsx widget
Add data refresh capabilities

## Milestone 8: UI Components Library

### 8.1 Layout Components
Create AppLayout.tsx with responsive design
Build Header.tsx with navigation menu
Implement Sidebar.tsx with collapsible menu
Create Footer.tsx with links and info

### 8.2 Common Components
Implement Button.tsx with variants and sizes
Create Input.tsx with error states
Build Select.tsx with search capability
Implement Modal.tsx with portal rendering
Create Card.tsx with flexible content areas
Build Spinner.tsx loading indicator
Implement EmptyState.tsx for no-data scenarios
Create ErrorBoundary.tsx for error handling

## Milestone 9: Testing Suite

### 9.1 Backend Tests
Write model tests in tests/test_models.py
Create API tests in tests/test_api.py
Implement authentication tests in tests/test_auth.py
Add permission tests for all viewsets
Create data validation tests

### 9.2 Frontend Tests
Setup Jest configuration
Write component tests for key components
Create hook tests for custom hooks
Implement integration tests for forms
Add route protection tests

### 9.3 E2E Tests
Setup Playwright configuration
Create authentication flow tests
Implement job CRUD operation tests
Write application status update tests
Add interview scheduling tests

## Milestone 10: Production Configuration

### 10.1 Backend Production Settings
Create production.py settings file
Configure allowed hosts and CORS origins
Setup static file serving with whitenoise
Configure production database settings
Implement logging configuration

### 10.2 Docker Production Setup
Create production docker-compose
Configure nginx for reverse proxy
Setup SSL certificate handling
Implement health checks
Configure restart policies

### 10.3 Performance Optimizations
Add database indexes on foreign keys and filter fields
Implement select_related and prefetch_related optimizations
Setup Redis for caching (optional)
Configure frontend code splitting
Implement lazy loading for components

## Validation Criteria

Each milestone is complete when:
- All code compiles without errors
- Django migrations run successfully
- API endpoints return expected responses
- Frontend pages render without console errors
- Basic functionality works as specified
- Code follows the conventions established in architecture-plan.md

## Error Handling Requirements

- All API endpoints must return appropriate HTTP status codes
- Frontend must handle loading, error, and empty states
- Forms must display validation errors clearly
- Network errors must show user-friendly messages
- Authentication failures must redirect appropriately

## Code Generation Guidelines

When implementing each milestone:
- Follow Django and React best practices
- Use TypeScript strict mode
- Implement proper error handling
- Add necessary type definitions
- Follow RESTful conventions
- Use existing project patterns
- Avoid placeholder code - implement fully