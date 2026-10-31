import { useNavigate, Link } from "react-router-dom";
import {
  PlayCircle,
  History,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  Layers,
} from "lucide-react";
import { useEvaluationHistory } from "@/hooks/useEvaluations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import { EmptyState } from "@/components/dashboard/EmptyState";

export function EvaluationHistoryPage() {
  const navigate = useNavigate();
  const { data: runs = [], isLoading, isError } = useEvaluationHistory();

  const totalRuns = runs.length;
  const completedRuns = runs.filter((r) => r.status === "COMPLETED").length;
  const approvedRuns = runs.filter((r) => r.recommendation === "RELEASE").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="success" className="gap-1 text-[10px]">
            <CheckCircle2 className="h-3 w-3" />
            <span>Completed</span>
          </Badge>
        );
      case "RUNNING":
        return (
          <Badge variant="warning" className="gap-1 text-[10px] animate-pulse">
            <Clock className="h-3 w-3" />
            <span>Running</span>
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive" className="gap-1 text-[10px]">
            <XCircle className="h-3 w-3" />
            <span>Failed</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {status}
          </Badge>
        );
    }
  };

  const getRecommendationBadge = (rec?: string) => {
    switch (rec) {
      case "RELEASE":
        return (
          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            RELEASE
          </span>
        );
      case "CONDITIONAL_RELEASE":
        return (
          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            CONDITIONAL
          </span>
        );
      case "REJECT":
        return (
          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
            REJECT
          </span>
        );
      default:
        return <span className="text-[11px] text-slate-400">PENDING</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Evaluation History & Audit Logs
            </h1>
            <Badge variant="default" className="text-[11px]">
              {totalRuns} Runs
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Historical audit ledger of multi-agent quality assessments, safety sweeps, and release decisions.
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => navigate("/evaluations/new")}
          className="rounded-xl text-xs font-bold gap-2 self-start sm:self-auto shadow-xs"
        >
          <PlayCircle className="h-4 w-4" />
          <span>Start New Evaluation</span>
        </Button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-slate-200 bg-white p-4">
          <span className="text-[11px] font-medium text-slate-500 block">Total Evaluations</span>
          <div className="mt-1 text-2xl font-bold text-slate-900">{totalRuns}</div>
          <span className="text-[10.5px] text-slate-400">Historical benchmark sweeps</span>
        </Card>

        <Card className="border border-slate-200 bg-white p-4">
          <span className="text-[11px] font-medium text-slate-500 block">Completed Runs</span>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{completedRuns}</div>
          <span className="text-[10.5px] text-slate-400">Fully evaluated across 9 pillars</span>
        </Card>

        <Card className="border border-slate-200 bg-white p-4">
          <span className="text-[11px] font-medium text-slate-500 block">Production Approved</span>
          <div className="mt-1 text-2xl font-bold text-indigo-600">{approvedRuns}</div>
          <span className="text-[10.5px] text-slate-400">Passed release gates</span>
        </Card>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          <SkeletonCard />
        </div>
      ) : isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Failed to Load History"
          description="Could not connect to the evaluation telemetry service."
        />
      ) : runs.length === 0 ? (
        <EmptyState
          icon={History}
          title="No Evaluations on Record"
          description="You haven't run any evaluations yet. Trigger your first evaluation benchmark to test release readiness."
          actionText="Start Evaluation"
          onAction={() => navigate("/evaluations/new")}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Run Identifier</th>
                  <th className="px-4 py-3">Target Application</th>
                  <th className="px-4 py-3">Version & Env</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Quality Score</th>
                  <th className="px-4 py-3">Release Gate</th>
                  <th className="px-4 py-3">Execution Date</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {run.runNumber}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Link
                        to={`/applications/${run.applicationId}`}
                        className="font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                      >
                        {run.applicationName}
                      </Link>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span className="font-mono text-slate-800 text-[11px] font-semibold block">
                          {run.applicationVersion}
                        </span>
                        <span className="text-[10px] text-slate-500">{run.environment}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">{getStatusBadge(run.status)}</td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {run.overallScore ? (
                        <span className="font-bold text-slate-900">{run.overallScore} / 100</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getRecommendationBadge(run.recommendation)}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                      {new Date(run.startedAt).toLocaleDateString()} at{" "}
                      {new Date(run.startedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          run.status === "COMPLETED"
                            ? navigate(`/evaluations/${run.id}/results`)
                            : navigate(`/evaluations/${run.id}`)
                        }
                        className="h-7 px-2.5 text-xs font-semibold gap-1 text-slate-700"
                      >
                        {run.status === "COMPLETED" ? (
                          <>
                            <Layers className="h-3 w-3" />
                            <span>Results</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" />
                            <span>Progress</span>
                          </>
                        )}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default EvaluationHistoryPage;

