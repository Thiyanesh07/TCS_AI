import { EvaluationRunSummary, RegisteredApplication } from "@/types/application.types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, PlayCircle, ArrowRight, CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EvaluationRunsTabProps {
  app: RegisteredApplication;
  evalRuns?: EvaluationRunSummary[];
}

export function EvaluationRunsTab({ app, evalRuns = [] }: EvaluationRunsTabProps) {
  const navigate = useNavigate();

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
        return <span className="text-[11px] text-slate-400">N/A</span>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Application Evaluation History & Benchmark Runs
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Audit ledger of automated multi-agent quality assessments, safety sweeps, and release decisions.
              </CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => navigate(`/evaluations/new?appId=${app.id}`)}
              className="gap-1.5 text-xs font-semibold self-start sm:self-auto"
            >
              <PlayCircle className="h-3.5 w-3.5" />
              <span>Start New Evaluation</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {evalRuns.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <History className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">No evaluations on record</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Trigger your first automated benchmark run to evaluate accuracy, safety, and release readiness.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Run Identifier</th>
                    <th className="px-4 py-2.5">Target Version</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Quality Score</th>
                    <th className="px-4 py-2.5">Recommendation</th>
                    <th className="px-4 py-2.5">Tests Run</th>
                    <th className="px-4 py-2.5">Critical Findings</th>
                    <th className="px-4 py-2.5">Execution Date</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {evalRuns.map((run) => (
                    <tr key={run.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {run.runNumber}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                        {run.version}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(run.status)}</td>
                      <td className="px-4 py-3">
                        {run.overallScore ? (
                          <span className="font-bold text-slate-900">{run.overallScore} / 100</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{getRecommendationBadge(run.recommendation)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{run.totalTests}</td>
                      <td className="px-4 py-3">
                        {run.criticalFindings > 0 ? (
                          <span className="font-bold text-red-600 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {run.criticalFindings}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        {new Date(run.startedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/evaluations/${run.id}/results`)}
                          className="h-7 text-xs font-semibold text-indigo-600 hover:text-indigo-800 gap-1"
                        >
                          <span>Results</span>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default EvaluationRunsTab;

