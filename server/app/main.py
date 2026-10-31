"""
Main FastAPI Application Entrypoint for QualiTrust AI Backend.
Configures CORS, middleware, standard error handlers, and API routing.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.request_context import set_request_id, get_request_id
from app.api import (
    health_router,
    auth_router,
    dashboard_router,
    admin_router,
    applications_router,
    evaluations_router,
    findings_router,
    regression_router,
)

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("qualitrust.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle event handler for startup and shutdown."""
    logger.info("Starting QualiTrust AI Backend Foundation [%s]", settings.ENVIRONMENT)
    yield
    logger.info("Shutting down QualiTrust AI Backend Foundation")


def create_app() -> FastAPI:
    """Factory function for FastAPI application."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version="1.0.0",
        description="QualiTrust AI — AI Application Quality Engineering and Release Intelligence Platform",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # CORS configuration
    if settings.CORS_ORIGINS:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.CORS_ORIGINS,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    # Request ID Middleware
    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next):
        incoming_req_id = request.headers.get("X-Request-ID")
        active_req_id = set_request_id(incoming_req_id)
        
        response = await call_next(request)
        response.headers["X-Request-ID"] = active_req_id
        return response

    # Exception Handlers ensuring agreed error envelope
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        req_id = get_request_id()
        sanitized_details = []
        for error in exc.errors():
            loc = " -> ".join(str(l) for l in error.get("loc", []))
            sanitized_details.append({
                "field": loc,
                "message": error.get("msg", "Invalid value"),
                "type": error.get("type", "value_error"),
            })
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "The supplied request is invalid.",
                    "details": sanitized_details,
                },
                "request_id": req_id,
            },
            headers={"X-Request-ID": req_id},
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        req_id = get_request_id()
        error_code = f"HTTP_{exc.status_code}"
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": error_code,
                    "message": str(exc.detail),
                    "details": [],
                },
                "request_id": req_id,
            },
            headers={"X-Request-ID": req_id},
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        req_id = get_request_id()
        logger.error(
            "Unhandled server error [request_id=%s]: %s",
            req_id,
            str(exc),
            exc_info=True,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred. Please contact support with the request ID.",
                    "details": [],
                },
                "request_id": req_id,
            },
            headers={"X-Request-ID": req_id},
        )

    # Root health probe
    @app.get("/health", tags=["Health"], summary="Root liveness check")
    async def root_health():
        return {
            "data": {
                "status": "healthy",
                "service": "QualiTrust AI Backend",
            },
            "request_id": get_request_id(),
        }

    # API v1 Router Registration
    app.include_router(health_router, prefix=settings.API_V1_PREFIX)
    app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
    app.include_router(dashboard_router, prefix=settings.API_V1_PREFIX)
    app.include_router(admin_router, prefix=settings.API_V1_PREFIX)
    app.include_router(applications_router, prefix=settings.API_V1_PREFIX)
    app.include_router(evaluations_router, prefix=settings.API_V1_PREFIX)
    app.include_router(findings_router, prefix=settings.API_V1_PREFIX)
    app.include_router(regression_router, prefix=settings.API_V1_PREFIX)

    return app


app = create_app()
