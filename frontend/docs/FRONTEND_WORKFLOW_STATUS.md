# QualiTrust AI — Frontend User Workflow Audit & Traceability Report

**Scope**: End-to-End Tracing of the 10 Primary User Workflows  
**Environment**: Local Frontend (`http://localhost:5173`)  
**Status**: All 10 Workflows Fully Traced & Tested with Offline Transparent Mocks  

---

## Workflow Traceability Matrix

### Workflow 1: Login → Dashboard
- **Entry Page**: `/login` (`LoginPage.tsx`)
- **Components Involved**: `AuthLayout`, `Card`, `Input`, `PasswordInput`, `Button`, `RoleGuard`
- **Current API Calls**: Form submission currently triggers UX contract gate notice (`PENDING_CONFIRMATION`) without inventing fake tokens. Direct link proceeds to `/dashboard`.
- **Target Backend Calls**: `POST /api/v1/auth/login` (request body: `{ email, password }`), followed by `GET /api/v1/auth/me`.
- **State Transitions**: `unauthenticated` → `loading` (spinner) → `authenticated` (stores JWT tokens) → redirect to `/dashboard`.
- **Loading & Error Behaviour**: Input validation handles missing/malformed emails and short passwords. Backend errors surface in `Alert` banner.
- **Missing Functionality**: Automatic redirect upon successful token acquisition (currently user clicks proceed).
- **Integration Blockers**: Backend auth endpoint `/api/v1/auth/login` must be reachable.

---

### Workflow 2: Application ZIP Upload → Application Detail
- **Entry Page**: `/applications/new` (`ApplicationOnboardingPage.tsx`)
- **Components Involved**: `Tabs`, `ZipUploadZone`, `Input`, `Button`, `Badge`
- **Current API Calls**: Calls `applicationService.registerZipApplication()`. Progress derives strictly from Axios `onUploadProgress`. Offline error surfaces with amber disclaimer.
- **Target Backend Calls**: `POST /api/v1/applications/zip` (Multipart form-data: `name`, `version`, `category`, `environment`, and binary `file`).
- **State Transitions**: `idle` → `file_selected` (file validation) → `uploading` (genuine percent progress) → `registered` (confirmation view with app ID) → navigate to `/applications/:id`.
- **Loading & Error Behaviour**: Client rejects non-`.zip` files and files > 50MB before upload. Network failures cleanly display gateway offline alert.
- **Missing Functionality**: None. Dropzone, size check, progress bar, and navigation are fully implemented.
- **Integration Blockers**: Align endpoint path to `/api/v1/applications/zip` and multipart field key to backend's parameter (`file` vs `package`).

---

### Workflow 3: External API Registration → Application Detail
- **Entry Page**: `/applications/new` (Tab: "Method B — Connect REST API Endpoint")
- **Components Involved**: `ApiRegistrationForm`, `Input`, `PasswordInput`, `Button`, `Card`
- **Current API Calls**: Calls `applicationService.registerApiApplication()`. Offline call cleanly throws with offline banner.
- **Target Backend Calls**: `POST /api/v1/applications/api` (JSON payload with URL, authType, secretToken, request/response schemas).
- **State Transitions**: `form_entry` → `submitting` (loading spinner) → `registered` (confirmation card) → navigate to `/applications/:id`.
- **Loading & Error Behaviour**: Protocol validation (`http://` or `https://`), required name/endpoint check, password masking for secret tokens.
- **Missing Functionality**: None.
- **Integration Blockers**: Align endpoint path to `/api/v1/applications/api`.

---

### Workflow 4: Application Selection → Start Evaluation
- **Entry Page**: `/applications/:applicationId` → click "Start New Evaluation", or direct `/evaluations/new?appId=...`
- **Components Involved**: `StartEvaluationPage`, `EvaluationConfigForm`, `Card`, `Button`, `Input`
- **Current API Calls**: `applicationService.getApplications()` (populates workload dropdown), `evaluationService.startEvaluation(payload)`.
- **Target Backend Calls**: `POST /api/v1/applications/{application_id}/evaluations` (payload: `{ version, scope, concurrency, timeout }`).
- **State Transitions**: `configuring` → `submitting` → receives `runId` → navigate to `/evaluations/:runId`.
- **Loading & Error Behaviour**: Validates application selection, disables button while submitting, offline gateway surfaces error message.
- **Missing Functionality**: None. Pre-populates selected application from URL search param `?appId=...`.
- **Integration Blockers**: Align endpoint path from `/evaluations/start` to nested `/applications/{application_id}/evaluations`.

---

### Workflow 5: Evaluation Progress → Completed Evaluation
- **Entry Page**: `/evaluations/:runId` (`EvaluationProgressPage.tsx`)
- **Components Involved**: `ProgressStagesTimeline`, `Card`, `Badge`, `Button`
- **Current API Calls**: `useEvaluationProgress(runId)` via TanStack Query (polls at 2.5s interval with automatic cutoff on terminal `completed` / `failed` status).
- **Target Backend Calls**: `GET /api/v1/evaluations/{run_id}`.
- **State Transitions**: `queued` → `running` (8-stage progress tracker with active spinner and live execution pod console logs) → `completed` → automatic trigger: "View Detailed Results" button enabled.
- **Loading & Error Behaviour**: Skeleton timeline on initial fetch. Network disconnect pauses polling and preserves last known stage without crashing.
- **Missing Functionality**: None. Full 8-stage multi-agent pipeline rendering is operational.
- **Integration Blockers**: Align endpoint path from `/evaluations/{runId}/progress` to `/evaluations/{run_id}` and map status strings (`queued` → `running` → `completed` / `failed`).

---

### Workflow 6: Evaluation Results → Scorecard
- **Entry Page**: `/evaluations/:runId/results` (`EvaluationResultsPage.tsx`)
- **Components Involved**: `ReleaseGateBanner`, `QualityDimensionBar`, `FindingsLedger`, `MetricCard`, `Card`, `Button`
- **Current API Calls**: `useEvaluationResults(runId)` calling `evaluationService.getEvaluationResults(runId)`.
- **Target Backend Calls**: `GET /api/v1/evaluations/{run_id}/results`.
- **State Transitions**: `loading` (shimmer cards) → `rendered` (Release decision banner: `RELEASE`, `CONDITIONAL_RELEASE`, `REJECT`; 5-part test metrics; 9 quality dimension bars; findings list).
- **Loading & Error Behaviour**: Full skeleton placeholder; empty state with fallback if run has no findings.
- **Missing Functionality**: Direct navigation links to Quality Report (`/reports/:runId`) and Release Review (`/release-reviews/:runId`) are already wired!
- **Integration Blockers**: Unwrap backend response envelope `response.data.data`.

---

### Workflow 7: Finding Selection → Evidence Details
- **Entry Page**: `/findings` or from FindingsLedger click "Open Deep Evidence Explorer" → `/findings/:id` (`FindingDetailPage.tsx`)
- **Components Involved**: `FindingDetailPage`, `Card`, `Badge`, `Button`, `Tabs`
- **Current API Calls**: `useFinding(id)` calling `findingsService.getFindingById(id)`.
- **Target Backend Calls**: `GET /api/v1/findings/{finding_id}` and `GET /api/v1/findings/{finding_id}/evidence`.
- **State Transitions**: `loading` → `rendered` (Side-by-side prompt input excerpt, evaluated model output, invariant discrepancy alert, recommended remediation code snippet with copy trigger).
- **Loading & Error Behaviour**: Shimmer loader; 404 EmptyState if finding ID not found with "Back to Findings" button.
- **Missing Functionality**: If evidence is a separate endpoint from finding metadata, wire secondary query.
- **Integration Blockers**: None.

---

### Workflow 8: Release Review → Submit Decision
- **Entry Page**: `/release-reviews` → click review row → `/release-reviews/:id` (`ReleaseReviewDetailPage.tsx`)
- **Components Involved**: `ReleaseReviewDetailPage`, `Card`, `Badge`, `Button`, `Input`
- **Current API Calls**: `useReleaseReview(id)` and `useSubmitReviewDecision()`.
- **Target Backend Calls**: `GET /api/v1/evaluations/{run_id}/release-review` and `POST /api/v1/evaluations/{run_id}/release-review`.
- **State Transitions**: `viewing_review` → `select_decision` (`APPROVED`, `CONDITIONALLY_APPROVED`, `REJECTED`) → `enter_notes` → `submitting` → `decision_recorded`.
- **Loading & Error Behaviour**: Role check verifies reviewer is authorized (`PLATFORM_ADMIN` or `ORG_USER`); offline submission error surfaces cleanly.
- **Missing Functionality**: None.
- **Integration Blockers**: Scope endpoint under evaluations route `/evaluations/{run_id}/release-review`.

---

### Workflow 9: Create Regression Suite → Execute Regression Test
- **Entry Page**: `/regression` (`RegressionPage.tsx`) or from workspace `RegressionTab`
- **Components Involved**: `RegressionPage`, `Card`, `Badge`, `Button`
- **Current API Calls**: `useRegressionBenchmarks()` calling `regressionService.getRegressionBenchmarks()`.
- **Target Backend Calls**: `GET /api/v1/applications/{application_id}/regression-tests` and `POST /api/v1/regression-tests/{test_id}/execute`.
- **State Transitions**: `loading` → `rendered` (Regression benchmarks table, baseline comparisons (+34%, -45%), invariant breaks vs performance drift classification).
- **Loading & Error Behaviour**: Skeleton loading; empty state if no regression baselines exist.
- **Missing Functionality**: Dedicated "Create Suite" modal (UI currently provides execute action triggers).
- **Integration Blockers**: Align scoping to `/applications/{application_id}/regression-tests`.

---

### Workflow 10: Platform Administrator → Organisation Management
- **Entry Page**: `/dashboard` (switched to `PLATFORM_ADMIN`) or `/admin/organisations`
- **Components Involved**: `PlatformAdminDashboard`, `OrganisationsTable`, `PlatformActivityFeed`, `SystemStatusCard`, `MetricCard`
- **Current API Calls**: `usePlatformAdminMetrics()` calling `dashboardService.getPlatformAdminMetrics()`.
- **Target Backend Calls**: `GET /api/v1/admin/organisations` and `GET /api/v1/dashboard/activity`.
- **State Transitions**: `loading` → `rendered` (Tenant overview cards, active organisations ledger with tier/evals/status, system microservice status beacons, platform audit feed).
- **Loading & Error Behaviour**: Shimmer cards during query; status badges (`ACTIVE`, `PENDING_REVIEW`).
- **Missing Functionality**: Full interactive tenant status toggle (`PATCH /api/v1/admin/organisations/{id}/status`).
- **Integration Blockers**: Wire live API calls into `OrganisationsTable` and `PlatformActivityFeed`.

