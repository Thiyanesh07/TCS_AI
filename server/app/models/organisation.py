"""
Organisation model representing tenants.
Enforces strict organisation-level boundary for multi-tenancy.
"""

import uuid
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, GUID, TimestampMixin


class Organisation(Base, TimestampMixin):
    __tablename__ = "organisations"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)

    # Relationships
    users = relationship("User", back_populates="organisation", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="organisation", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="organisation", cascade="all, delete-orphan")

