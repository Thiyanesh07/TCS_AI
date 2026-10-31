"""
Health check endpoints for QualiTrust AI.
Provides liveness (/health, /api/v1/health) and readiness (/api/v1/health/ready) checks.
Never exposes environment credentials or internal stack traces.
"""

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from app.core.request_context import get_request_id
from app.database.health import check_database_connectivity

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    summary="Liveness check",
    description="Indicates whether the API process is alive and receiving requests.",
)
async def liveness_check():
    return {
        "data": {
            "status": "healthy",
            "service": "QualiTrust AI Backend",
        },
        "request_id": get_request_id(),
    }


@router.get(
    "/health/ready",
    summary="Readiness check",
    description="Checks downstream dependencies (e.g., Supabase PostgreSQL) to verify service readiness.",
)
async def readiness_check():
    db_healthy, db_msg = check_database_connectivity()
    request_id = get_request_id()

    if db_healthy:
        return {
            "data": {
                "status": "ready",
                "dependencies": {
                    "database": {
                        "status": "healthy",
                        "message": db_msg,
                    }
                },
            },
            "request_id": request_id,
        }
    else:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": {
                    "code": "SERVICE_UNAVAILABLE",
                    "message": "Service is not ready to accept traffic.",
                    "details": [
                        {
                            "component": "database",
                            "status": "unhealthy",
                            "message": db_msg,
                        }
                    ],
                },
                "request_id": request_id,
            },
        )

