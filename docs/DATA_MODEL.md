# QualiTrust AI — Shared Data Model

Defined in `shared/schemas/contracts.py`:

- **Application**: `id` (UUID), `organisation_id` (UUID), `name`, `description`, `integration_type` (`zip` | `api`), `status`, `created_at`, `updated_at`.
- **ApplicationVersion**: `id` (UUID), `application_id` (UUID), `version_label`, `source_hash`, `created_at`.
- **EvaluationRun**: `id` (UUID), `application_id` (UUID), `version_id` (UUID), `status` (`queued` | `running` | `completed` | `failed` | `cancelled`), `quality_score`, `release_status` (`eligible` | `blocked` | `review_required` | `inconclusive` | `pending`), `total_tests`, `passed_tests`, `failed_tests`, `uncertain_tests`, `started_at`, `completed_at`.
- **TestCase**: `id` (UUID), `risk_id` (UUID), `title`, `category`, `priority` (`critical` | `high` | `medium` | `low`), `input`, `expected_behaviour`, `evaluation_method`, `evidence_requirements`, `execution_constraints`, `generation_reason`.
- **TestResult**: `id` (UUID), `run_id` (UUID), `test_case_id` (UUID), `verdict` (`pass` | `fail` | `uncertain` | `error`), `severity`, `response`, `evaluator_name`, `confidence`, `latency_ms`, `created_at`.
- **Risk**: `id` (UUID), `application_id` (UUID), `category`, `description`, `likelihood` (1..5), `impact` (1..5), `priority_score` (likelihood * impact), `status` (`open` | `mitigated` | `accepted`).
- **Evidence**: `id` (UUID), `test_result_id` (UUID), `evidence_type`, `source_reference`, `source_version`, `content_hash`, `content_excerpt`, `evaluator_method`, `created_at`.
- **Finding**: `id` (UUID), `run_id` (UUID), `application_id` (UUID), `risk_category`, `title`, `description`, `severity`, `status` (`open` | `confirmed` | `disputed` | `resolved`), `evidence_ids`, `root_cause_hypothesis`, `remediation_recommendation`, `confidence`.
- **RegressionRecommendation**: `id` (UUID), `application_id` (UUID), `original_failure_id`, `test_case_id`, `title`, `category`, `input`, `expected_behaviour`, `associated_risk_id`, `version_created`, `reason`, `validation_status`.

## AI Engine Python Interface Contracts
- **AIEngineInput**: `run_id`, `application_id`, `version_id`, `integration_type`, `application_config`, `discovery_report`, `risk_config`, `evaluation_config`, `test_budget`.
- **AIEngineOutput**: `run_id`, `application_id`, `version_id`, `status`, `application_profile`, `risks`, `test_cases`, `test_results`, `evidence`, `findings`, `metric_results`, `overall_quality_score`, `release_recommendation`, `regression_recommendations`, `trace_metadata`, `execution_notes`.

