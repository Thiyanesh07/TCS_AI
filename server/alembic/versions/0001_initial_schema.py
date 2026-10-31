"""Initial Phase 1 database schema for QualiTrust AI.

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-10-31 11:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. organisations
    op.create_table(
        'organisations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_organisations_slug'), 'organisations', ['slug'], unique=True)

    # 2. users
    op.create_table(
        'users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('organisation_id', sa.UUID(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=True),
        sa.Column('role', sa.String(length=50), nullable=False, server_default='member'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['organisation_id'], ['organisations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_organisation_id'), 'users', ['organisation_id'], unique=False)

    # 3. applications
    op.create_table(
        'applications',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('organisation_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('integration_type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='registered'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['organisation_id'], ['organisations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_applications_organisation_id'), 'applications', ['organisation_id'], unique=False)

    # 4. application_versions
    op.create_table(
        'application_versions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('application_id', sa.UUID(), nullable=False),
        sa.Column('version_label', sa.String(length=100), nullable=False),
        sa.Column('source_hash', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['application_id'], ['applications.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_application_versions_application_id'), 'application_versions', ['application_id'], unique=False)

    # 5. risks
    op.create_table(
        'risks',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('application_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('severity', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='open'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['application_id'], ['applications.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_risks_application_id'), 'risks', ['application_id'], unique=False)

    # 6. test_cases
    op.create_table(
        'test_cases',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('application_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('is_automated', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['application_id'], ['applications.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_test_cases_application_id'), 'test_cases', ['application_id'], unique=False)

    # 7. evaluation_runs
    op.create_table(
        'evaluation_runs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('application_id', sa.UUID(), nullable=False),
        sa.Column('version_id', sa.UUID(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='queued'),
        sa.Column('quality_score', sa.Float(), nullable=True),
        sa.Column('release_status', sa.String(length=50), nullable=False, server_default='pending'),
        sa.Column('total_tests', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('passed_tests', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('failed_tests', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('uncertain_tests', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('error_tests', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['application_id'], ['applications.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['version_id'], ['application_versions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_evaluation_runs_application_id'), 'evaluation_runs', ['application_id'], unique=False)
    op.create_index(op.f('ix_evaluation_runs_version_id'), 'evaluation_runs', ['version_id'], unique=False)
    op.create_index(op.f('ix_evaluation_runs_status'), 'evaluation_runs', ['status'], unique=False)
    op.create_index(op.f('ix_evaluation_runs_release_status'), 'evaluation_runs', ['release_status'], unique=False)

    # 8. test_results
    op.create_table(
        'test_results',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('evaluation_run_id', sa.UUID(), nullable=False),
        sa.Column('test_case_id', sa.UUID(), nullable=True),
        sa.Column('verdict', sa.String(length=50), nullable=False),
        sa.Column('severity', sa.String(length=50), nullable=False),
        sa.Column('execution_duration_ms', sa.Integer(), nullable=True),
        sa.Column('output_summary', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['evaluation_run_id'], ['evaluation_runs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['test_case_id'], ['test_cases.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_test_results_evaluation_run_id'), 'test_results', ['evaluation_run_id'], unique=False)
    op.create_index(op.f('ix_test_results_test_case_id'), 'test_results', ['test_case_id'], unique=False)
    op.create_index(op.f('ix_test_results_verdict'), 'test_results', ['verdict'], unique=False)

    # 9. findings
    op.create_table(
        'findings',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('evaluation_run_id', sa.UUID(), nullable=False),
        sa.Column('risk_id', sa.UUID(), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('severity', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='open'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['evaluation_run_id'], ['evaluation_runs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['risk_id'], ['risks.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_findings_evaluation_run_id'), 'findings', ['evaluation_run_id'], unique=False)
    op.create_index(op.f('ix_findings_risk_id'), 'findings', ['risk_id'], unique=False)
    op.create_index(op.f('ix_findings_status'), 'findings', ['status'], unique=False)

    # 10. evidence
    op.create_table(
        'evidence',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('finding_id', sa.UUID(), nullable=True),
        sa.Column('test_result_id', sa.UUID(), nullable=True),
        sa.Column('evidence_type', sa.String(length=100), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=True),
        sa.Column('payload', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['finding_id'], ['findings.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['test_result_id'], ['test_results.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_evidence_finding_id'), 'evidence', ['finding_id'], unique=False)
    op.create_index(op.f('ix_evidence_test_result_id'), 'evidence', ['test_result_id'], unique=False)

    # 11. regression_tests
    op.create_table(
        'regression_tests',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('application_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('baseline_run_id', sa.UUID(), nullable=True),
        sa.Column('target_version_id', sa.UUID(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['application_id'], ['applications.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['baseline_run_id'], ['evaluation_runs.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['target_version_id'], ['application_versions.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_regression_tests_application_id'), 'regression_tests', ['application_id'], unique=False)

    # 12. release_reviews
    op.create_table(
        'release_reviews',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('evaluation_run_id', sa.UUID(), nullable=False),
        sa.Column('reviewer_user_id', sa.UUID(), nullable=True),
        sa.Column('decision', sa.String(length=50), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['evaluation_run_id'], ['evaluation_runs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewer_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_release_reviews_evaluation_run_id'), 'release_reviews', ['evaluation_run_id'], unique=True)
    op.create_index(op.f('ix_release_reviews_reviewer_user_id'), 'release_reviews', ['reviewer_user_id'], unique=False)

    # 13. audit_events
    op.create_table(
        'audit_events',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('organisation_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('resource_type', sa.String(length=100), nullable=False),
        sa.Column('resource_id', sa.String(length=255), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['organisation_id'], ['organisations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_events_organisation_id'), 'audit_events', ['organisation_id'], unique=False)
    op.create_index(op.f('ix_audit_events_user_id'), 'audit_events', ['user_id'], unique=False)
    op.create_index(op.f('ix_audit_events_action'), 'audit_events', ['action'], unique=False)
    op.create_index(op.f('ix_audit_events_resource_type'), 'audit_events', ['resource_type'], unique=False)
    op.create_index(op.f('ix_audit_events_created_at'), 'audit_events', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_table('audit_events')
    op.drop_table('release_reviews')
    op.drop_table('regression_tests')
    op.drop_table('evidence')
    op.drop_table('findings')
    op.drop_table('test_results')
    op.drop_table('evaluation_runs')
    op.drop_table('test_cases')
    op.drop_table('risks')
    op.drop_table('application_versions')
    op.drop_table('applications')
    op.drop_table('users')
    op.drop_table('organisations')

