import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, PlayCircle, History, AlertTriangle } from "lucide-react";
import { useEvaluationProgress } from "@/hooks/useEvaluations";
import { ProgressStagesTimeline } from "@/components/evaluations/ProgressStagesTimeline";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";

export function EvaluationProgressPage() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();

  const { data: run, isLoading, isError } = useEvaluationProgress(runId);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <SkeletonCard />
      </div>
    );
  }

  if (isError || !run) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Evaluation Run Not Found"
        description={`The requested evaluation run ID "${runId}" could not be found or has expired.`}
        actionText="View Evaluation History"
        onAction={() => navigate("/history")}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Link
          to="/history"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Evaluation History</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate("/history")}
            className="text-xs gap-1.5"
          >
            <History className="h-3.5 w-3.5 text-slate-500" />
            <span>All Runs</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => navigate("/evaluations/new")}
            className="text-xs gap-1.5"
          >
            <PlayCircle className="h-3.5 w-3.5" />
            <span>New Evaluation</span>
          </Button>
        </div>
      </div>

      {/* Progress Timeline */}
      <ProgressStagesTimeline run={run} />
    </div>
  );
}

export default EvaluationProgressPage;

