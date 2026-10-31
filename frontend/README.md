# QualiTrust AI — Frontend Application

Quality Engineering and Release Intelligence Platform for AI-powered Applications.

QualiTrust AI evaluates mission-critical AI systems across nine fundamental dimensions:
1. **Accuracy**
2. **Grounding**
3. **Completeness**
4. **Safety**
5. **Security**
6. **Consistency**
7. **Bias**
8. **Model Drift**
9. **Release Readiness**

---

## Architecture & Technology Stack

The frontend is constructed using a high-performance, strictly typed architecture:
- **UI & View Layer**: React 19 (`^19.0.0`) / TypeScript (`^5.7.3`)
- **Tooling & Dev Server**: Vite (`^6.2.0`) with `@tailwindcss/vite`
- **Styling**: Tailwind CSS v4 (`^4.0.9`) with **Executive Light Theme** tokens
- **Routing**: React Router (`^7.3.0`) with role-based boundaries (`PLATFORM_ADMIN` and `ORG_USER`)
- **Server State & Caching**: TanStack Query (`^5.67.1`)
- **HTTP Client**: Axios (`^1.8.1`) singleton with request/response interceptors
- **Iconography**: Lucide React (`^0.477.0`)
- **Class Utilities**: `clsx` (`^2.1.1`) + `tailwind-merge` (`^3.0.2`)

---

## Implemented Dashboards & Modules

### 1. Role-Specific Dashboards (Phase 3)
- **Organization User Dashboard (`/dashboard` as `ORG_USER`)**: Quality metrics, automated release gates, 9-dimension quality matrix, recent evaluation runs.
- **Platform Admin Dashboard (`/dashboard` as `PLATFORM_ADMIN`)**: Multi-tenant directory, microservice telemetry, system activity stream.

### 2. Application Onboarding (Phase 4)
- **Method A: Upload ZIP Package (`/applications/new`)**: Drag-and-drop dropzone with strict `.zip` MIME/extension validation, 50MB file size ceiling, selected archive inspector, and upload progress. Zero browser ZIP extraction.
- **Method B: Connect REST API Endpoint (`/applications/new`)**: Endpoint URL, HTTP method selector, authentication selector (`NONE`, `BEARER`, `API_KEY`, `CUSTOM_HEADER`), masked secret tokens, and request/response JSON schema definitions.

### 3. Application Management & Workspace (Phase 5)
- **My Applications Catalog (`/applications`)**: Multi-facet filterable directory (Category, Ingestion Method, Environment, Status) with executive KPI counters.
- **Application Details Workspace (`/applications/:id`)**: Comprehensive 8-tab workspace:
  1. `Overview`: Profile, integration specs, quality score snapshot, release gate status.
  2. `Discovery`: Discovered LLMs, frameworks, vector stores, and registered tool endpoints.
  3. `Risks`: 7-pillar vulnerability ledger with severity tabs (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
  4. `Test Suites`: Ground-truth assertion packs, pass rates, and execution triggers.
  5. `Evaluation Runs`: Run history with quality scores and release recommendations.
  6. `Findings & Evidence`: Defect ledger with expandable prompt/response evidence accordions.
  7. `Regression`: Persistent regression assertions and baseline verification checks.
  8. `Release Reviews`: Audit records of automated release gate evaluations and sign-offs.

### 4. Evaluation Experience (Phase 6)
- **Start Evaluation Workflow (`/evaluations/new`)**: Scope selector (`FULL_SUITE`, `SAFETY_REDTEAM`, `GROUNDING_BENCHMARK`, `CUSTOM`) and sandbox concurrency/timeout constraints.
- **Live Progress Monitor (`/evaluations/:runId`)**: Real-time 8-stage pipeline timeline tracker, global progress bar, and live sandbox pod execution console.
- **Evaluation Results & Release Intelligence (`/evaluations/:runId/results`)**: Executive release recommendation banner (`RELEASE`, `CONDITIONAL_RELEASE`, `REJECT`), 5-part test execution summary, 9-dimension quality score matrix, and findings evidence.
- **Evaluation History & Audit Logs (`/history`)**: Historical catalog of all benchmark sweeps and release decisions.

### 5. Findings, Evidence Explorer & Quality Reports (Phase 7)
- **Findings Ledger & Directory (`/findings`)**: Multi-facet search and filterable directory (Severity, Pillar, Status) for all evaluated anomalies and safety violations.
- **Deep Evidence Explorer (`/findings/:id`)**: Side-by-side prompt input, evaluated model output, and expected ground truth discrepancy ledger with copy triggers and engineering recommendations.
- **Executive Quality Reports (`/reports/:runId`)**: Full 9-dimension composite benchmark report with radar metrics, historical comparisons, CSV export, and print/PDF generation.

### 6. Release Governance & Regression Benchmarks (Phase 8)
- **Release Reviews Directory (`/release-reviews`)**: Multi-environment governance ledger showing gate decisions (`APPROVED`, `CONDITIONALLY_APPROVED`, `REJECTED`, `PENDING_REVIEW`) and sign-off records.
- **Release Sign-Off Workflow (`/release-reviews/:id`)**: Interactive human sign-off form with reviewer attribution, decision recording, conditional gate waivers, and audit trail.
- **Continuous Regression Benchmarks (`/regression`)**: Metric drift tracking against golden baselines (+34%, -45%), score differentials, and quality invariant violation classifications.

---

## Development Runbook

### 1. Environment Setup
```bash
cp .env.example .env.local
```

### 2. Dependency Installation
```bash
npm install
```

### 3. Local Development Server
Starts the Vite development server with Hot Module Replacement on port `5173`:
```bash
npm run dev
```

### 4. Production Build & Type Verification
Runs strict type checks followed by optimized production bundling:
```bash
npm run build
```

---

## Role Navigation Matrix

| View | `PLATFORM_ADMIN` Route | `ORG_USER` Route |
| :--- | :--- | :--- |
| **Dashboard** | `/dashboard` (Platform Telemetry) | `/dashboard` (Quality Cockpit) |
| **Applications** | `/admin/applications` (Cross-Tenant) | `/applications` (My Apps) |
| **Findings & Evidence** | `/findings` (Global Directory) | `/findings` (Tenant Directory) |
| **Release Reviews** | `/release-reviews` (Release Sign-off) | `/release-reviews` (Release Governance) |
| **Regression Metrics** | `/regression` (Telemetry Drift) | `/regression` (Regression Benchmarks) |
| **Organisations** | `/admin/organisations` | *(Access Restricted)* |
| **History** | `/admin/history` (Platform Audit) | `/history` (My Runs) |
| **Tests** | *(Managed per Org)* | `/my-tests` (Curated Sets) |
| **Settings** | `/settings` | `/settings` |

*(Note: Use the "Switch Role" button at the bottom of the sidebar to easily toggle between both role views during local UX testing).*

---

## Complete Judge Demonstration Mode (Offline / Hackathon Demo)

QualiTrust AI includes a dedicated, fully interactive **JUDGE DEMONSTRATION MODE** that runs 100% locally in the browser with **zero backend server, database, or sandbox pods required**.

### Quick Start for Judges & Evaluators
1. Start the frontend:
   ```bash
   cd d:\Hackathon-Arsenal\QualiTrustAI\frontend
   npm run dev
   ```
2. Open your browser at:
   ```
   http://localhost:5173
   ```
3. Click either 1-click login button on the login screen:
   - **"Demo Org User (1-Click)"** (`sarah.chen@nexusaipharma.com`)
   - **"Demo Platform Admin (1-Click)"** (`alex.vance@qualitrust.ai`)

### Key Demo Features & End-to-End Walkthrough
- **Persistent Demo Indicator**: A prominent banner identifies demonstration mode (`DEMO MODE — Demonstration data. No live AI evaluation is being executed.`).
- **Interactive Scenario Switcher**: Toggle dynamically between 3 distinct scenarios:
  1. `HEALTHY_APPLICATION`: Score 95/100, RELEASE APPROVED, 0 blockers.
  2. `APPLICATION_WITH_RISKS`: Score 76/100, CONDITIONAL_RELEASE, 2 warnings.
  3. `CRITICAL_SECURITY_FAILURE`: Score 49/100, REJECTED, 2 critical blockers (Prompt Injection & Hazmat compliance).
- **Application Onboarding**:
  - Test **ZIP upload**: Drag and drop any `.zip` file with file validation, preview, and simulated upload progress.
  - Test **REST API connection**: Enter endpoint and auth config. Both save locally in browser storage!
- **Application Details Workspace**: Browse all 8 workspace tabs for any pre-seeded workload.
- **Interactive Evaluation Sandbox**:
  - Go to `/evaluations/new` and click **"Launch Evaluation Sandbox"** without offline errors.
  - Watch the live **8-stage evaluation pipeline** advance step-by-step with real-time sandbox pod logs.
  - Test the **"Restart Simulation"** action to run it again.
- **Release Gate Intelligence**: Inspect the 9-pillar scorecard, test counters, and release recommendation.
- **Deep Evidence Explorer**: Inspect prompt, model output, and expected ground truth discrepancies at `/findings`.
- **Quality Reports**: Export the benchmark report to a **downloadable CSV file** or print to PDF at `/reports/:runId`.
- **Release Sign-Off & Regressions**: Conduct human governance sign-offs at `/release-reviews` and observe benchmark drift at `/regression`.

---

## Governance & Security Policies
- **Role Governance**: The application recognizes exactly two roles: `PLATFORM_ADMIN` and `ORG_USER`.
- **Zero Frontend Tenant Trust**: Tenant isolation is strictly enforced server-side. The frontend does not construct or trust organization IDs for data scoping.
- **Contract Integrity**: All API integrations adhere strictly to confirmed backend contracts.
- **Honest Demonstration**: Demonstration data is strictly identified as `DEVELOPMENT_MOCK_ONLY` and never presented as genuine live AI evaluations.
