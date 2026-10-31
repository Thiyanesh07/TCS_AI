import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Cpu, CheckCircle2, Clock } from "lucide-react";

export interface EvaluationRunSummary {
  id: string;
  applicationName: string;
  model: string;
  status: "PASSED" | "EVALUATING" | "FLAGGED";
  score: number;
  criticalFindings: number;
  timestamp: string;
}

const DEFAULT_RUNS: EvaluationRunSummary[] = [
  {
    id: "run-9481",
    applicationName: "Customer Support RAG Agent",
    model: "claude-3-5-sonnet",
    status: "PASSED",
    score: 96,
    criticalFindings: 0,
    timestamp: "12 mins ago",
  },
  {
    id: "run-9480",
    applicationName: "Clinical Document Extractor",
    model: "gpt-4o",
    status: "FLAGGED",
    score: 87,
    criticalFindings: 2,
    timestamp: "1 hour ago",
  },
  {
    id: "run-9479",
    applicationName: "Financial Compliance Assistant",
    model: "gemini-1.5-pro",
    status: "PASSED",
    score: 98,
    criticalFindings: 0,
    timestamp: "3 hours ago",
  },
  {
    id: "run-9478",
    applicationName: "Code Review Synthesizer",
    model: "codestral-22b",
    status: "EVALUATING",
    score: 0,
    criticalFindings: 0,
    timestamp: "Running...",
  },
];

export interface RecentEvaluationsTableProps {
  runs?: EvaluationRunSummary[];
  isPendingContract?: boolean;
}

export function RecentEvaluationsTable({
  runs = DEFAULT_RUNS,
  isPendingContract = true,
}: RecentEvaluationsTableProps) {
  return (
    <Card className="border-slate-200 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900">
            Recent Evaluation Runs
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Real-time execution log and quality score verification
          </CardDescription>
        </div>
        <Link
          to="/history"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          <span>View All</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 border-y border-slate-200">
              <tr>
                <th className="px-6 py-3">Application</th>
                <th className="px-6 py-3">Model</th>
                <th className="px-6 py-3">Score</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Findings</th>
                <th className="px-6 py-3 text-right">Executed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {runs.map((run) => (
                <tr key={run.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-3.5 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{run.applicationName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 font-mono text-[11px] text-slate-500">
                    {run.model}
                  </td>
                  <td className="px-6 py-3.5">
                    {run.status === "EVALUATING" ? (
                      <span className="text-slate-400 italic">Evaluating...</span>
                    ) : (
                      <span className="font-bold text-slate-900">{run.score}%</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    {run.status === "PASSED" && (
                      <Badge variant="success">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        <span>PASSED</span>
                      </Badge>
                    )}
                    {run.status === "FLAGGED" && (
                      <Badge variant="destructive">
                        <span>FLAGGED</span>
                      </Badge>
                    )}
                    {run.status === "EVALUATING" && (
                      <Badge variant="warning">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>RUNNING</span>
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    {run.criticalFindings > 0 ? (
                      <span className="text-red-600 font-semibold text-[11px]">
                        {run.criticalFindings} critical
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">0 blockers</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right text-slate-400 text-[11px]">
                    {run.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isPendingContract && (
          <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 text-center font-mono">
            Integration Note: Backend evaluation log endpoint pending OpenAPI contract agreement.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentEvaluationsTable;

