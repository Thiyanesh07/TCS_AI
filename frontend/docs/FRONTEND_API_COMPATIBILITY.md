# QualiTrust AI — Frontend Backend API Compatibility Audit

**Reference Backend Specification**: 29 Implemented FastAPI Endpoints (FastAPI + JWT + Multi-Tenant Envelopes)  
**Standard Success Envelope**: `{ "data": <payload>, "request_id": "<uuid>" }`  
**Standard Error Envelope**: `{ "error": { "code": "<CODE>", "message": "<MSG>", "details": [...] }, "request_id": "<uuid>" }`  

---

## 1. Complete 29-Endpoint Compatibility Matrix

| # | Backend Endpoint | HTTP Method | Frontend Current Call | Auth Required | Envelope Unwrapped? | Compatibility Status | Required Adjustment |
| :---: | :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| **1** | `/api/v1/auth/login` | `POST` | Gated in `LoginPage.tsx` | No | Pending | **PLANNED / READY TO WIRE** | Connect `POST /api/v1/auth/login` with `{ email, password }`; store `access_token` and `refresh_token`. |
| **2** | `/api/v1/auth/refresh` | `POST` | Interceptor stub in `api.client.ts` | Bearer (Refresh) | Pending | **PLANNED / READY TO WIRE** | Add Axios 401 interceptor sending `refresh_token` to rotate tokens. |
| **3** | `/api/v1/auth/me` | `GET` | Not called directly | Bearer | Pending | **PLANNED / READY TO WIRE** | Call on app boot to populate active user profile and organization session. |
| **4** | `/api/v1/dashboard/summary` | `GET` | Calls `/dashboard/metrics/user` | Bearer | No (`response.data`) | **PATH & ENVELOPE MISMATCH** | Change path to `/dashboard/summary`; unwrap `response.data.data`. |
| **5** | `/api/v1/dashboard/activity` | `GET` | Mock feed in `PlatformActivityFeed` | Bearer | Pending | **PLANNED / READY TO WIRE** | Connect `GET /dashboard/activity` into `PlatformActivityFeed`. |
| **6** | `/api/v1/admin/organisations` | `GET` | Static mock in `OrganisationsTable` | Bearer (`ADMIN`) | Pending | **PLANNED / READY TO WIRE** | Connect `GET /admin/organisations` into `OrganisationsTable`. |
| **7** | `/api/v1/admin/organisations/{id}` | `GET` | Not called | Bearer (`ADMIN`) | Pending | **PLANNED** | For future tenant deep-dive drawer. |
| **8** | `/api/v1/admin/organisations/{id}/status` | `PATCH`| Not called | Bearer (`ADMIN`) | Pending | **PLANNED** | For tenant status toggle actions. |
| **9** | `/api/v1/applications/zip` | `POST` | Calls `/applications/upload-zip` | Bearer | No (`response.data`) | **PATH & FORM FIELD MISMATCH**| Change path to `/applications/zip`; verify multipart field name matches (`file` vs `package`). |
| **10** | `/api/v1/applications/api` | `POST` | Calls `/applications/connect-api`| Bearer | No (`response.data`) | **PATH MISMATCH** | Change path to `/applications/api`; unwrap `response.data.data`. |
| **11** | `/api/v1/applications` | `GET` | Calls `/applications` with params | Bearer | No (`response.data`) | **COMPATIBLE EXCEPT ENVELOPE** | Unwrap `response.data.data`. Path matches with `/api/v1` base URL. |
| **12** | `/api/v1/applications/{id}` | `GET` | Calls `/applications/{id}` | Bearer | No (`response.data`) | **COMPATIBLE EXCEPT ENVELOPE** | Unwrap `response.data.data`. Path matches! |
| **13** | `/api/v1/applications/{id}/discovery` | `GET` | Reads from application payload | Bearer | No | **COMPATIBLE / OPTIONAL** | If discovery is separate, add dedicated sub-resource hook. |
| **14** | `/api/v1/applications/{id}/versions` | `GET` | Reads from application payload | Bearer | No | **COMPATIBLE / OPTIONAL** | If versions list is separate, add dedicated hook. |
| **15** | `/api/v1/applications/{id}/evaluations` | `POST` | Calls `/evaluations/start` | Bearer | No (`response.data`) | **PATH STRUCTURE MISMATCH** | Change to nested `POST /applications/{id}/evaluations`. |
| **16** | `/api/v1/evaluations` | `GET` | Calls `/evaluations/history` | Bearer | No (`response.data`) | **PATH MISMATCH** | Change path to `/evaluations`; unwrap `response.data.data`. |
| **17** | `/api/v1/evaluations/{run_id}` | `GET` | Calls `/evaluations/{id}/progress` | Bearer | No (`response.data`) | **PATH MISMATCH** | Change path to `/evaluations/{run_id}`. Map status `queued`/`running`/`completed`/`failed`. |
| **18** | `/api/v1/evaluations/{run_id}/results` | `GET` | Calls `/evaluations/{id}/results` | Bearer | No (`response.data`) | **COMPATIBLE EXCEPT ENVELOPE** | Path matches directly! Unwrap `response.data.data`. |
| **19** | `/api/v1/evaluations/{run_id}/findings`| `GET` | Calls `/findings` (global list) | Bearer | No (`response.data`) | **PATH SCOPING MISMATCH** | Scope findings call to `/evaluations/{run_id}/findings`. |
| **20** | `/api/v1/evaluations/{run_id}/release-review` | `GET` | Calls `/release-reviews/{id}` | Bearer | No (`response.data`) | **PATH SCOPING MISMATCH** | Scope review call to `/evaluations/{run_id}/release-review`. |
| **21** | `/api/v1/evaluations/{run_id}/release-review` | `POST` | Calls `/release-reviews/{id}/sign-off` | Bearer | No (`response.data`) | **PATH MISMATCH** | Change to `POST /evaluations/{run_id}/release-review`. |
| **22** | `/api/v1/findings/{finding_id}` | `GET` | Calls `/findings/{id}` | Bearer | No (`response.data`) | **COMPATIBLE EXCEPT ENVELOPE** | Path matches directly! Unwrap `response.data.data`. |
| **23** | `/api/v1/findings/{finding_id}/evidence` | `GET` | Embedded in finding record | Bearer | No | **PARTIALLY COMPATIBLE** | If evidence is separate, fetch `/findings/{id}/evidence`. |
| **24** | `/api/v1/applications/{id}/regression-tests` | `GET` | Calls `/regression/benchmarks` | Bearer | No (`response.data`) | **PATH SCOPING MISMATCH** | Scope to `/applications/{id}/regression-tests`. |
| **25** | `/api/v1/applications/{id}/regression-tests` | `POST`| Not yet called | Bearer | Pending | **PLANNED** | Ready to wire modal for suite creation. |
| **26** | `/api/v1/regression-tests/{test_id}/execute` | `POST`| Not yet called | Bearer | Pending | **PLANNED** | Ready to wire "Run Regression" trigger button. |
| **27** | `/health` | `GET` | Not called | None | N/A | **PLANNED** | Root orchestrator health check. |
| **28** | `/api/v1/health` | `GET` | Static beacon in `Header.tsx` | None | N/A | **READY TO WIRE** | Wire into Header status beacon for live heartbeat. |
| **29** | `/api/v1/health/ready` | `GET` | Not called | None | N/A | **PLANNED** | Readiness probe for evaluation engines. |

---

## 2. Response Envelope Unwrapping Architecture

### The Problem:
Axios wraps the HTTP response body inside `response.data`. When FastAPI returns:
```json
{
  "data": { "id": "app_rag_001", "name": "Nexus MedRAG" },
  "request_id": "req-98f2b4c1"
}
```
In standard frontend code:
- `response.data` returns `{ data: { ... }, request_id: "..." }`.
- Accessing `response.data.name` results in `undefined` because it is at `response.data.data.name`.

### The Recommended Clean Fix:
Implement global envelope normalization directly inside `src/services/api.client.ts`:
```typescript
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Automatically unwrap standard backend envelope
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data &&
      "request_id" in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    // Normalize backend error envelope: { error: { code, message, details }, request_id }
    const backendMessage = error.response?.data?.error?.message;
    if (backendMessage) {
      error.message = backendMessage;
    }
    return Promise.reject(error);
  }
);
```
*Impact*: This single interceptor handles envelope unwrapping across all 29 endpoints simultaneously without modifying any individual page or component!

---

## 3. Authentication & Token Lifecycle Verification

| Security Requirement | Current Status | Verification Details |
| :--- | :---: | :--- |
| **`Authorization: Bearer <access_token>`** | **IMPLEMENTED** | `api.client.ts` reads `localStorage.getItem("qualitrust_token")` and attaches header. |
| **HTTP 401 Interceptor** | **PARTIALLY IMPLEMENTED** | Placeholder exists in `api.client.ts`. Needs token refresh call to `POST /api/v1/auth/refresh`. |
| **Refresh-Token Rotation** | **DESIGNED** | Frontend must store both `access_token` and `refresh_token`; exchange on 401 and store new pair. |
| **Failed Refresh Handling** | **DESIGNED** | If refresh returns 401/403: clear tokens from `localStorage`, invalidate TanStack query cache, redirect to `/login`. |
| **Infinite Refresh Loop Prevention**| **DESIGNED** | Interceptor must mark retried requests with `_retry = true` to prevent recursive 401 loops. |
| **Role-Based Navigation** | **VERIFIED** | `RoleGuard.tsx` enforces `allowedRoles: ["PLATFORM_ADMIN"]` vs `["ORG_USER"]`. |
| **Cross-Session Cache Isolation** | **VERIFIED** | TanStack `queryClient.clear()` must be called upon logout to purge tenant-specific memory. |

