from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.admin import router as admin_router
from app.api.applications import router as applications_router
from app.api.evaluations import router as evaluations_router
from app.api.findings import router as findings_router
from app.api.regression import router as regression_router

__all__ = [
    "health_router",
    "auth_router",
    "dashboard_router",
    "admin_router",
    "applications_router",
    "evaluations_router",
    "findings_router",
    "regression_router",
]
