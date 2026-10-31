# QualiTrust AI — Backend Server

The backend service for QualiTrust AI: an AI Application Quality Engineering and Release Intelligence Platform.

## Stack
- **Framework:** FastAPI, Uvicorn, Python 3.11+
- **Database & ORM:** PostgreSQL / Supabase, SQLAlchemy 2.0, Alembic
- **Authentication:** Custom JWT (HS256), Argon2id password hashing, SHA-256 hashed refresh token rotation
- **API Prefix:** `/api/v1`

---

## Getting Started

### 1. Environment Setup
```bash
python -m venv .venv

# On Windows:
.venv\Scripts\activate

# On Linux/macOS:
source .venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Configure your `DATABASE_URL` (Supabase connection pooler on port 5432) and generate a secure `JWT_SECRET_KEY`.

### 3. Run Database Migrations
```bash
alembic upgrade head
```

### 4. Bootstrap Platform Admin (CLI)
```bash
python -m app.cli.provision --email admin@qualitrust.ai --password "SecureAdminPassword123!" --name "Platform Admin"
```

### 5. Start the Server
```bash
uvicorn app.main:app --reload --port 8000
```

- **Interactive API Docs:** `http://localhost:8000/docs`
- **ReDoc Documentation:** `http://localhost:8000/redoc`
- **OpenAPI Schema:** `http://localhost:8000/openapi.json`
- **Health Probes:**
  - `GET /health` (Process liveness)
  - `GET /api/v1/health` (API v1 liveness)
  - `GET /api/v1/health/ready` (Database readiness)

---

## Running Automated Tests
```bash
pytest -v
```
All tests execute against an isolated in-memory SQLite database (`StaticPool`) and path-safe local storage.

