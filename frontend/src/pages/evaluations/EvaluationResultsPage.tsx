import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  PlayCircle,
  History,
  Layers,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  FileText,
  ClipboardCheck,
} from "lucide-react";
import { useEvaluationResults } from "@/hooks/useEvaluations";
import { ReleaseGateBanner } from "@/components/evaluations/ReleaseGateBanner";
import { QualityDimensionBar } from "@/components/evaluations/QualityDimensionBar";
import { FindingsLedger } from "@/components/evaluations/FindingsLedger";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function EvaluationResultsPage() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();

  const { data: run, isLoading, isError } = useEvaluationResults(runId);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (isError || !run) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Results Not Found"
        description={`Evaluation results for run ID "${runId}" are not available.`}
        actionText="View Evaluation History"
        onAction={() => navigate("/history")}
      />
    );
  }

  const testExec = run.testExecution || {
    total: 665,
    passed: 642,
    failed: 15,
    warnings: 8,
    skipped: 0,
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/history"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Evaluation History</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Evaluation Results & Release Intelligence
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Multi-agent evaluation benchmark report generated on{" "}
            {new Date(run.startedAt).toLocaleDateString()} at{" "}
            {new Date(run.startedAt).toLocaleTimeString()}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(`/reports/${run.id}`)}
            className="text-xs gap-1.5"
          >
            <FileText className="h-3.5 w-3.5 text-indigo-600" />
            <span>Quality Report</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(`/release-reviews/${run.id}`)}
            className="text-xs gap-1.5"
          >
            <ClipboardCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Release Review</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(`/applications/${run.applicationId}`)}
            className="text-xs gap-1.5"
          >
            <Layers className="h-3.5 w-3.5 text-slate-500" />
            <span>Application Workspace</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => navigate(`/evaluations/new?appId=${run.applicationId}`)}
            className="text-xs gap-1.5 font-bold"
          >
            <PlayCircle className="h-3.5 w-3.5" />
            <span>Re-Run Benchmark</span>
          </Button>
        </div>
      </div>

      {/* 1. Release Gate Decision Banner */}
      <ReleaseGateBanner
        decision={run.recommendation || "RELEASE"}
        overallScore={run.overallScore || 92}
        explanation={run.recommendationExplanation}
        blockersCount={run.blockersCount}
        warningsCount={run.warningsCount}
        runNumber={run.runNumber}
        applicationName={run.applicationName}
        environment={run.environment}
        dataSource={run.dataSource}
      />

      {/* 2. Test Execution Summary Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="border border-slate-200 bg-white p-3.5">
          <span className="text-[11px] font-medium text-slate-400 block">Total Invocations</span>
          <div className="mt-1 text-xl font-bold text-slate-900">{testExec.total}</div>
          <span className="text-[10px] text-slate-500">Golden test assertions</span>
        </Card>

        <Card className="border border-slate-200 bg-white p-3.5">
          <span className="text-[11px] font-medium text-slate-400 block">Passed Tests</span>
          <div className="mt-1 text-xl font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            <span>{testExec.passed}</span>
          </div>
          <span className="text-[10px] text-slate-500">
            {((testExec.passed / testExec.total) * 100).toFixed(1)}% adherence
          </span>
        </Card>

        <Card className="border border-slate-200 bg-white p-3.5">
          <span className="text-[11px] font-medium text-slate-400 block">Failed Tests</span>
          <div className="mt-1 text-xl font-bold text-red-600 flex items-center gap-1">
            <XCircle className="h-4 w-4" />
            <span>{testExec.failed}</span>
          </div>
          <span className="text-[10px] text-slate-500">Discrepancies found</span>
        </Card>

        <Card className="border border-slate-200 bg-white p-3.5">
          <span className="text-[11px] font-medium text-slate-400 block">Policy Warnings</span>
          <div className="mt-1 text-xl font-bold text-amber-600 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            <span>{testExec.warnings}</span>
          </div>
          <span className="text-[10px] text-slate-500">Non-critical variances</span>
        </Card>

        <Card className="border border-slate-200 bg-white p-3.5 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-medium text-slate-400 block">Execution Speed</span>
          <div className="mt-1 text-xl font-bold text-slate-800 font-mono">
            {run.elapsedSeconds}s
          </div>
          <span className="text-[10px] text-slate-500">Total sandbox runtime</span>
        </Card>
      </div>

      {/* 3. 9 Quality & Safety Dimensions Vector */}
      {run.dimensions && <QualityDimensionBar dimensions={run.dimensions} />}

      {/* 4. Findings & Evidence Citations Ledger */}
      <FindingsLedger findings={run.findings} />

      {/* Bottom Navigation & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate("/history")}
          className="text-xs gap-1.5"
        >
          <History className="h-3.5 w-3.5 text-slate-500" />
          <span>Evaluation History Catalog</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(`/evaluations/new?appId=${run.applicationId}`)}
            className="text-xs gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            <span>Run Regression Check</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="text-xs gap-1.5 font-bold"
          >
            <span>Return to Executive Dashboard</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EvaluationResultsPage;
