import { EvaluationRunDetail } from "@/types/evaluation.types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Loader2,
  Clock,
  Terminal,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/utils/cn";
import { isDemoMode } from "@/utils/env";
import { useRestartEvaluation } from "@/hooks/useEvaluations";

interface ProgressStagesTimelineProps {
  run: EvaluationRunDetail;
}

export function ProgressStagesTimeline({ run }: ProgressStagesTimelineProps) {
  const navigate = useNavigate();
  const isCompleted = run.status === "COMPLETED";
  const isFailed = run.status === "FAILED";
  const demoActive = isDemoMode();
  const restartMutation = useRestartEvaluation();

  const completedStagesCount = run.stages.filter((s) => s.status === "completed").length;
  const progressPercent = Math.round((completedStagesCount / run.stages.length) * 100);

  return (
    <div className="space-y-6">
      {demoActive ? (
        <div className="bg-indigo-50 border border-indigo-200 px-4 py-2.5 rounded-xl text-xs text-indigo-900 font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
            <span>DEMO EVALUATION SANDBOX — Deterministic 8-stage time-based pipeline simulation.</span>
          </span>
          <span className="font-mono text-[10px] bg-indigo-100 px-2.5 py-0.5 rounded text-indigo-900 font-bold">
            Judge Simulation Mode
          </span>
        </div>
      ) : run.dataSource === "DEVELOPMENT_MOCK_ONLY" ? (
        <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-xs text-amber-800 font-semibold flex items-center justify-between">
          <span>⚠️ DEVELOPMENT_MOCK_ONLY: Displaying offline development pipeline fixture.</span>
          <span className="font-mono text-[10px] bg-amber-100 px-2 py-0.5 rounded text-amber-900">
            Contract: PENDING_BACKEND_CONFIRMATION
          </span>
        </div>
      ) : null}
      {/* Run Metadata Header */}
      <Card className="border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500">{run.runNumber}</span>
              <Badge
                variant={isCompleted ? "success" : isFailed ? "destructive" : "warning"}
                className={cn("text-xs gap-1", !isCompleted && !isFailed && "animate-pulse")}
              >
                {!isCompleted && !isFailed ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3 w-3" />
                )}
                <span>{run.status}</span>
              </Badge>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{run.applicationName}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-mono font-semibold">{run.applicationVersion}</span>
              <span>•</span>
              <span>{run.environment}</span>
              <span>•</span>
              <span>Scope: {run.scope}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-right">
              <span className="text-[10.5px] font-medium text-slate-400 block">Elapsed Time</span>
              <span className="font-mono text-sm font-bold text-slate-800 flex items-center justify-end gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>{run.elapsedSeconds}s</span>
              </span>
            </div>

            {demoActive && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => restartMutation.mutate(run.id)}
                disabled={restartMutation.isPending}
                className="rounded-xl h-10 px-3 text-xs font-bold gap-1.5"
                title="Restart simulation from Stage 1 for judge demonstration"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                <span>Restart Simulation</span>
              </Button>
            )}

            {isCompleted && (
              <Button
                type="button"
                onClick={() => navigate(`/evaluations/${run.id}/results`)}
                className="rounded-xl h-10 px-5 text-xs font-bold gap-2 shadow-xs bg-indigo-600 hover:bg-indigo-700"
              >
                <span>View Full Results</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Overall Execution Progress ({completedStagesCount}/{run.stages.length} Stages)</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/80">
            <div
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                isCompleted ? "bg-emerald-500" : isFailed ? "bg-red-500" : "bg-indigo-600"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </Card>

      {/* 8-Stage Sequential Timeline */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <span>Multi-Agent Evaluation Pipeline Stages</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {run.stages.map((stage, idx) => {
              const isStageActive = stage.status === "active";
              const isStageCompleted = stage.status === "completed";
              const isStageFailed = stage.status === "failed";

              return (
                <div
                  key={stage.id}
                  className={cn(
                    "flex items-center justify-between p-3.5 rounded-xl border transition-all",
                    isStageActive
                      ? "border-indigo-500 bg-indigo-50/50 shadow-xs"
                      : isStageCompleted
                      ? "border-emerald-200 bg-emerald-50/20"
                      : isStageFailed
                      ? "border-red-200 bg-red-50/20"
                      : "border-slate-200 bg-slate-50/30 opacity-70"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all",
                        isStageCompleted
                          ? "bg-emerald-100 text-emerald-700"
                          : isStageActive
                          ? "bg-indigo-600 text-white animate-pulse"
                          : isStageFailed
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-200 text-slate-600"
                      )}
                    >
                      {isStageCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : isStageActive ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isStageFailed ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-xs font-bold truncate",
                          isStageActive
                            ? "text-indigo-900"
                            : isStageCompleted
                            ? "text-slate-900"
                            : "text-slate-600"
                        )}
                      >
                        {stage.name}
                      </p>
                      {stage.message && (
                        <p className="text-[11px] text-slate-500 truncate">{stage.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {stage.durationSeconds !== undefined && (
                      <span className="font-mono text-[11px] text-slate-500">
                        {stage.durationSeconds}s
                      </span>
                    )}

                    <Badge
                      variant={
                        isStageCompleted
                          ? "success"
                          : isStageActive
                          ? "default"
                          : isStageFailed
                          ? "destructive"
                          : "outline"
                      }
                      className="text-[10px]"
                    >
                      {stage.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Live Sandbox Execution Terminal Logs */}
      <Card className="border border-slate-200 bg-white shadow-xs overflow-hidden">
        <CardHeader className="pb-2 bg-slate-900 text-slate-100 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-mono font-bold flex items-center gap-2 text-slate-200">
              <Terminal className="h-3.5 w-3.5 text-emerald-400" />
              <span>Sandbox Execution Pod Stream</span>
            </CardTitle>
            <span className="text-[10.5px] font-mono text-slate-400">
              Host: sandbox-us-east-1.qualitrust.internal
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0 bg-slate-950 font-mono text-[11px] text-emerald-400">
          <div className="p-4 space-y-1.5 max-h-52 overflow-y-auto">
            {run.executionLogs.map((log, index) => (
              <div key={index} className="leading-relaxed">
                <span className="text-slate-500 mr-2">$</span>
                <span className="text-slate-200">{log}</span>
              </div>
            ))}
            {!isCompleted && !isFailed && (
              <div className="flex items-center gap-1.5 text-emerald-400 animate-pulse pt-1">
                <span>▶</span>
                <span>Awaiting pipeline worker emission...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProgressStagesTimeline;

