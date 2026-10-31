# QualiTrust AI — Frontend Architecture Specification

## 1. System Overview & Purpose

**QualiTrust AI** is an AI Application Quality Engineering and Release Intelligence Platform. The platform provides systematic evaluation and release verification across key AI dimensions:
- **Accuracy**
- **Grounding**
- **Completeness**
- **Safety**
- **Security**
- **Consistency**
- **Bias**
- **Model Drift**
- **Release Readiness**

The frontend client serves as the engineering cockpit for quality engineers, AI platform teams, and administrators to orchestrate evaluations, review findings, inspect regressions, and govern release readiness.

---

## 2. Architectural Boundaries & Responsibility

```
┌────────────────────────────────────────────────────────┐
│           QualiTrust AI Frontend (React/Vite)          │
│  - Presentation Layer & Reusable UI Components         │
│  - Client-side Routing & Navigation Guards             │
│  - Client State & Cache Management (TanStack Query)    │
│  - Centralized HTTP Client (Axios)                     │
└───────────────────────────┬────────────────────────────┘
                            │ (Agreed HTTP / REST Contracts)
                            ▼
┌────────────────────────────────────────────────────────┐
│            Backend API & AI Evaluation Engine           │
│  - Authentication, Token Issuance & Tenant Security    │
│  - Role Verification & Access Control Enforcement      │
│  - Database, Evaluation Engine & Sandbox Execution     │
└────────────────────────────────────────────────────────┘
```

### Strict Non-Goals for Frontend:
- **No Backend Business Logic**: All scoring, evaluation logic, and compliance rules execute on the backend.
- **No Direct Database Operations**: All data access is mediated through backend API endpoints.
- **No Client-Only Authorization**: Frontend role checks are UX enhancements (hiding/showing links); true access control and tenant isolation are enforced strictly by the backend.
- **Zero Frontend Tenant Trust**: The frontend must never generate or trust client-supplied organization IDs for security boundaries; tenant context is extracted by the backend from verified session credentials.

---

## 3. Technology Stack & Installed Toolchain

| Technology | Installed Version | Role | Justification |
| :--- | :--- | :--- | :--- |
| **React** | `^19.0.0` | UI & Component Model | Concurrent rendering, native actions, strictly typed component tree. |
| **ReactDOM** | `^19.0.0` | DOM Rendering | Direct DOM hydration and mounting. |
| **TypeScript** | `^5.7.3` | Static Type System | Strict compile-time safety (`noEmit: true`, strict switch, no unused locals). |
| **Vite** | `^6.2.0` | Build Tool & Bundler | Native ESM development server, sub-second HMR, Rollup production builds. |
| **Tailwind CSS** | `^4.0.9` | Styling System | Official `@tailwindcss/vite` integration, executive light design tokens. |
| **React Router** | `^7.3.0` | Client Navigation | Declarative routing with `createBrowserRouter`, layout nesting, and role guarding. |
| **TanStack Query** | `^5.67.1` | Asynchronous Server State | Global caching, automatic stale-time governance, query deduplication. |
| **Axios** | `^1.8.1` | Centralized HTTP Client | Request/response interceptor pipeline for JWT injection and error normalization. |
| **Lucide React** | `^0.477.0` | Iconography | High-consistency SVG iconography. |
| **clsx + tailwind-merge** | `^2.1.1` / `^3.0.2` | Class Merging | `cn()` utility preventing Tailwind specificity collisions. |

*(Note: GSAP is explicitly banned to maintain lean bundle size and fast rendering).*

---

## 4. UI Resource & Component Reuse Policy

To ensure high engineering velocity and visual excellence without reinventing wheels, every page implementation adheres to this priority order:

```
[Priority 1] Existing Local Templates & Primitives
   └── (Recharts charts, Metric Cards, Sections from sales-ops-dashboard & arsenal)
           │
           ▼
[Priority 2] 21st.dev MCP Component Registry
   └── (Search and inspect production-tested React/Tailwind components)
           │
           ▼
[Priority 3] shadcn/ui Primitives
   └── (Radix UI accessible primitives: Dialogs, Drawers, Dropdowns, Tables)
           │
           ▼
[Priority 4] Magic UI / React Bits Resources
   └── (Selective animated cards, spotlight highlights, clean ticker animations)
           │
           ▼
[Priority 5] Custom Component Implementation
   └── (Constructed ONLY when no suitable local or catalog implementation exists)
```

**Resource Discovery Rule**: Before developing each page, a discovery report is produced detailing local candidates, MCP options, and components to reuse vs. build. Implementation starts only after explicit user sign-off.

---

## 5. Design System Foundation (Executive Light Theme)

The application enforces an **Executive Light Theme**:
- **Canvas / Background**: `#f8fafc` (`slate-50`)
- **Card & Surfaces**: Pure white `#ffffff` with subtle `#e2e8f0` slate border divisions.
- **Typography**: Slate 900 (`#0f172a`) for crisp headings; Slate 500 (`#64748b`) for metrics/labels.
- **Accents**: Indigo (`#4f46e5`) for brand actions; Emerald (`#10b981`) for passing evaluation readiness.
- **Status Signals**: Amber (`#f59e0b`) for evaluating/review; Red (`#ef4444`) for blockers and critical vulnerabilities.

---

## 6. Layout & Shell Architecture (Phase 2)

- **`AuthLayout`** (`src/app/layouts/AuthLayout.tsx`): Split-screen desktop presentation with evaluation pillars; mobile single-column.
- **`DashboardLayout`** (`src/app/layouts/DashboardLayout.tsx`): Collapsible sidebar (260px / 72px) with role-aware menu items, blurred sticky header, dynamic breadcrumbs, user profile menu, and live role switcher.

---

## 7. Role-Specific Dashboards Architecture (Phase 3)

The dashboard renders role-tailored intelligence based on the active session role:

### A. Organization User Dashboard (`src/pages/dashboard/OrgUserDashboard.tsx`)
- **Overview Statistics**: Total registered applications, total evaluation runs, average quality score, release readiness decision.
- **Release Intelligence Gate (`ReleaseReadinessCard.tsx`)**: Automated GO / CONDITIONAL / NO-GO recommendations, composite score (0-100), critical blocker tally, and warning counts.
- **9-Dimension Quality Matrix (`QualityMatrixCard.tsx`)**: Systematic vector benchmarks across Accuracy, Grounding, Completeness, Safety, Security, Consistency, Bias, Drift, and Readiness.
- **Recent Evaluations Ledger (`RecentEvaluationsTable.tsx`)**: Real-time evaluation runs, target model, status badges, and findings count.
- **Quick Actions Bar (`QuickActionsBar.tsx`)**: 1-click workflows for application registration, evaluation logs, and catalog view.

### B. Platform Admin Dashboard (`src/pages/admin/PlatformAdminDashboard.tsx`)
- **Platform Overview Statistics**: Total tenant organisations, total global applications, total evaluation workloads, and active evaluators.
- **System Health & Service Telemetry (`SystemStatusCard.tsx`)**: Operational heartbeat across evaluation sandbox microservices and edge latency indicators.
- **Tenant Organisation Directory (`OrganisationsTable.tsx`)**: Multi-tenant overview detailing organisation name, tier, application density, total evaluations, and tenant status.
- **Platform Activity Feed (`PlatformActivityFeed.tsx`)**: Global audit stream capturing cross-tenant violations, application onboardings, and system events.

### C. Data Integration Architecture
- Centralized `dashboardService` using Axios with TanStack Query hooks (`useOrgUserMetrics`, `usePlatformAdminMetrics`).
- Local development mock fixtures in `src/mocks/dashboard.mock.ts` strictly isolated and labeled as development-only.
- Visual contract-pending indicators on cards where backend OpenAPI schemas remain to be confirmed.

---

## 8. Role-Based Access Architecture

The platform supports **exactly two roles**:
1. `PLATFORM_ADMIN`: Superuser governance over organizations, system health, and platform policies.
2. `ORG_USER`: Standard tenant-level quality engineer, evaluator, and dashboard viewer.

- Role verification is conducted by decoding verified claims from the backend session token.
- `src/app/router/RoleGuard.tsx` prevents visual rendering of unauthorized routes.
- **Authoritative Security Rule**: True access control and tenant isolation are enforced strictly by backend API endpoints.

---

## 9. Application Onboarding Architecture (Phase 4)

- **`ApplicationOnboardingPage`** (`src/pages/applications/ApplicationOnboardingPage.tsx`):
  - Unified segmented tabs switching between Method A (Upload ZIP) and Method B (Connect API).
  - Strict Client-Side Sandboxing: ZIP files are never decompressed or executed in the browser.
- **Method A (`ZipUploadZone.tsx`)**:
  - Drag-and-drop dropzone with `.zip` type validation and 50MB file size ceiling.
  - Selected archive card with formatted size, progress bar, and removal triggers.
- **Method B (`ApiRegistrationForm.tsx`)**:
  - API base URL, endpoint path, HTTP method selector (`POST`, `GET`).
  - Auth selector (`NONE`, `BEARER`, `API_KEY`, `CUSTOM_HEADER`) with masked secret tokens.
  - Request/Response JSON contract schema inputs with local validation.

---

## 10. Application Management & Details Workspace Architecture (Phase 5)

- **`ApplicationsListPage`** (`src/pages/applications/ApplicationsListPage.tsx`):
  - Catalog table with health scores, recommendation pills, search, and multi-facet filtering.
- **`ApplicationDetailsWorkspace`** (`src/pages/applications/ApplicationDetailsWorkspace.tsx`):
  - 8 Interactive tabs: `Overview`, `Discovery`, `Risks`, `Test Suites`, `Evaluation Runs`, `Findings & Evidence`, `Regression`, and `Release Reviews`.
- **Domain Services**:
  - `applicationService` backed by TanStack Query (`useApplications`, `useApplication`).

---

## 11. Evaluation Experience Architecture (Phase 6)

- **`StartEvaluationPage`** (`src/pages/evaluations/StartEvaluationPage.tsx`):
  - Configuration form with scope selection (`FULL_SUITE`, `SAFETY_REDTEAM`, `GROUNDING_BENCHMARK`, `CUSTOM`) and sandbox constraints.
- **`EvaluationProgressPage`** (`src/pages/evaluations/EvaluationProgressPage.tsx`):
  - Asynchronous 8-stage pipeline timeline tracker with automatic polling cutoff on terminal states (`COMPLETED`, `FAILED`, `CANCELLED`).
  - Live execution pod console ticker stream.
- **`EvaluationResultsPage`** (`src/pages/evaluations/EvaluationResultsPage.tsx`):
  - Prominent release intelligence decision banner (`RELEASE`, `CONDITIONAL_RELEASE`, `REJECT`).
  - Test execution summary counters and 9-dimension quality score matrix.
  - Findings ledger with expandable prompt/response evidence accordions.
- **`EvaluationHistoryPage`** (`src/pages/evaluations/EvaluationHistoryPage.tsx`):
  - Global evaluation audit log across all connected workloads.

---

## 12. Judge Demonstration Mode Architecture (`src/demo/*`)

To ensure hackathon evaluators and judges can experience the complete product journey without requiring backend servers, PostgreSQL databases, or Kubernetes worker pods, a dedicated **Demonstration Mode** is implemented:

- **Activation Governance**:
  - `isDemoMode()` checks `VITE_DEMO_MODE === "true"`, query parameter `?demo=true`, or `localStorage.getItem("qualitrust_demo_mode") === "true"`.
  - Zero disruption to production: real Axios calls and error boundaries remain intact when demo mode is off (`VITE_DEMO_MODE=false`).
- **Demo Store (`src/demo/demo.store.ts`)**:
  - Reactive in-memory store synchronized with `localStorage`.
  - Maintains pre-seeded applications, runs, findings, release reviews, and regression benchmarks across browser refreshes.
- **Demo Services (`src/demo/demo.*.service.ts`)**:
  - `demoAuthService`: 1-click access for `ORG_USER` and `PLATFORM_ADMIN`.
  - `demoApplicationService`: Local ZIP upload and REST API registration simulations.
  - `demoEvaluationService`: Deterministic time-based pipeline simulation advancing through all 8 stages (~2s per stage) with synthetic console logs and restart capability.
  - `demoFindingsService`: Findings queries, Deep Evidence Explorer retrieval, and downloadable CSV generation.
  - `demoReleaseService`: Release sign-off state transitions.
  - `demoRegressionService`: Golden baseline drift calculations (+34%, -45%).
- **Visual Disclosure & Scenario Switcher (`src/components/demo/DemoBanner.tsx`)**:
  - Persistent amber disclaimer: `"DEMO MODE — Demonstration data. No live AI evaluation is being executed."`
  - Dropdown to immediately toggle between `HEALTHY_APPLICATION`, `APPLICATION_WITH_RISKS`, and `CRITICAL_SECURITY_FAILURE`.
  - Reset button to restore pristine baseline fixtures at any time.
