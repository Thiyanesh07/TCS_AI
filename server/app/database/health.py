"""
Database health check utilities.
Safely inspects database reachability without leaking connection secrets or internal stack traces.
"""

from typing import Tuple
from sqlalchemy import text
from app.core.config import settings


def check_database_connectivity() -> Tuple[bool, str]:
    """
    Executes a lightweight query (SELECT 1) to verify database connectivity.
    Returns:
        (is_healthy: bool, status_message: str)
    """
    if not settings.DATABASE_URL:
        return False, "Database connection URL is not configured."

    try:
        from app.database.session import get_engine
        engine = get_engine()
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True, "Database connection healthy."
    except Exception as exc:
        # Avoid leaking connection strings or credentials. Log only sanitized class/message.
        error_type = type(exc).__name__
        return False, f"Database connectivity check failed ({error_type})."

