# QualiTrust AI — Shared API Contract

Base URL: `/api/v1`

## Common Headers
- `Authorization: Bearer <access_token>`
- `Content-Type: application/json`
- `X-Request-ID: <unique-request-id>`
- `Idempotency-Key: <unique-key>` (for retryable job creation)

## Endpoints

### 1. Authentication
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`

### 2. Dashboard
- `GET /api/v1/dashboard/summary`
- `GET /api/v1/dashboard/activity`

### 3. Organizations (Admin)
- `GET /api/v1/admin/organisations`
- `GET /api/v1/admin/organisations/{organisation_id}`
- `PATCH /api/v1/admin/organisations/{organisation_id}/status`

### 4. Applications
- `POST /api/v1/applications/zip` (multipart/form-data)
- `POST /api/v1/applications/api`
- `GET /api/v1/applications`
- `GET /api/v1/applications/{application_id}`
- `GET /api/v1/applications/{application_id}/discovery`
- `GET /api/v1/applications/{application_id}/versions`

### 5. Evaluation & Runs
- `POST /api/v1/applications/{application_id}/evaluations`
- `GET /api/v1/evaluations`
- `GET /api/v1/evaluations/{run_id}`
- `GET /api/v1/evaluations/{run_id}/results`
- `GET /api/v1/evaluations/{run_id}/findings`

### 6. Evidence
- `GET /api/v1/findings/{finding_id}`
- `GET /api/v1/findings/{finding_id}/evidence`

### 7. Regression
- `GET /api/v1/applications/{application_id}/regression-tests`
- `POST /api/v1/applications/{application_id}/regression-tests`
- `POST /api/v1/regression-tests/{test_id}/execute`

### 8. Release
- `GET /api/v1/evaluations/{run_id}/release-review`
- `POST /api/v1/evaluations/{run_id}/release-review`

