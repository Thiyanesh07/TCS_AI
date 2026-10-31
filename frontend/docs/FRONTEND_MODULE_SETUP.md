# QualiTrust AI — Frontend Module Setup & Integration Runbook

This guide details the integration configuration, environment variables, authentication flow, and operational procedures for connecting the **QualiTrust AI** frontend with the live FastAPI backend service.

---

## 1. Environment Variables Configuration

Create a `.env.local` file inside `d:\Hackathon-Arsenal\QualiTrustAI\frontend`:

```env
# Backend Base URL (FastAPI endpoints mounted under /api/v1)
VITE_API_BASE_URL=http://localhost:8000/api/v1

# Application Deployment Environment (development | staging | production)
VITE_APP_ENV=development

# Logging and Verbosity Level (debug | info | warn | error)
VITE_LOG_LEVEL=info
```

> **Note**: `ENV.API_BASE_URL` in `src/utils/env.ts` defaults automatically to `http://localhost:8000/api/v1` if unconfigured.

---

## 2. CORS & Network Gateway Requirements

The FastAPI backend must configure `CORSMiddleware` to allow requests originating from the Vite frontend host:

```python
# Backend FastAPI Configuration
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Local Vite dev server
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)
```

---

## 3. Standard Success & Error Envelopes

### Backend Success Envelope:
Every successful response from FastAPI is structured as:
```json
{
  "data": { ... },
  "request_id": "req-98f2b4c1-1793-4a3b-9e42"
}
```

### Backend Error Envelope:
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid username or password provided.",
    "details": []
  },
  "request_id": "req-98f2b4c1-1793-4a3b-9e42"
}
```

### Frontend Axios Normalization:
`src/services/api.client.ts` intercepts all responses:
- Unwraps `response.data = response.data.data` when `"request_id"` is present.
- Normalizes `error.message = error.response?.data?.error?.message`.

---

## 4. Authentication Token Lifecycle & 401 Interceptor

1. **Login Handshake**:
   - `POST /api/v1/auth/login` with `{ email, password }`.
   - On success, persist tokens in `localStorage`:
     - `qualitrust_access_token`
     - `qualitrust_refresh_token`
     - `qualitrust_user` (JSON with role, organization ID, name).
2. **Request Dispatch**:
   - `apiClient` request interceptor automatically attaches:
     `Authorization: Bearer <qualitrust_access_token>`
3. **Automatic 401 Refresh Interceptor**:
   - When a 401 response is caught, the interceptor pauses outgoing requests.
   - Dispatches `POST /api/v1/auth/refresh` with `refresh_token`.
   - On success: updates tokens in `localStorage` and retries failed request with `_retry: true`.
   - On failure (refresh expired/revoked): calls `queryClient.clear()`, removes all tokens, and redirects to `/login`.

---

## 5. File Upload Format & Constraints (Method A: ZIP Package)

- **HTTP Method**: `POST /api/v1/applications/zip`
- **Encoding**: `multipart/form-data`
- **Fields**:
  - `name`: string (Application name)
  - `version`: string (Version tag, e.g., `v1.2.0`)
  - `category`: string (`RAG_PIPELINE`, `AUTONOMOUS_AGENT`, `CONVERSATIONAL_ASSISTANT`, etc.)
  - `environment`: string (`PRODUCTION`, `STAGING`, `DEVELOPMENT`)
  - `description`: optional string
  - `file`: binary file (`.zip` MIME type, maximum size 50MB)
- **Client Validation**: Frontend enforces file extension (`.zip`) and file size ceiling (<= 50,000,000 bytes) prior to dispatch.
- **Upload Progress**: Derived strictly from Axios `onUploadProgress` byte streams.

---

## 6. Evaluation Lifecycle Polling Strategy

- **Initiation**: `POST /api/v1/applications/{application_id}/evaluations`
- **Response**: `{ run_id: "run_9841", status: "queued" }`
- **Polling Loop**:
  - Polling interval: **2,500 ms** via TanStack Query `refetchInterval`.
  - Endpoint: `GET /api/v1/evaluations/{run_id}`
  - Polling stops automatically when `status` reaches a terminal state:
    - `"completed"` → triggers navigation to `/evaluations/{run_id}/results`
    - `"failed"` → renders execution error card with logs

---

## 7. Local Operational Runbook

```bash
# 1. Switch to frontend repository
cd d:\Hackathon-Arsenal\QualiTrustAI\frontend

# 2. Verify dependencies (0 peer dependency issues)
npm list --depth=0

# 3. Check TypeScript compilation (0 errors)
npx tsc --noEmit

# 4. Run production build (0 warnings, 407 kB bundle)
npm run build

# 5. Launch development server with HMR
npm run dev
# -> Local server available at http://localhost:5173
```

