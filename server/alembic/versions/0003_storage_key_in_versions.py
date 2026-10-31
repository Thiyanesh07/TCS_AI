"""Add storage_key column to application_versions.

Revision ID: 0003_storage_key_in_versions
Revises: 0002_auth_and_refresh_tokens
Create Date: 2026-10-31 11:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0003_storage_key_in_versions'
down_revision: Union[str, None] = '0002_auth_and_refresh_tokens'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'application_versions',
        sa.Column('storage_key', sa.String(length=500), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('application_versions', 'storage_key')

