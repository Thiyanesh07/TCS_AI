import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle, ShieldAlert, Info } from "lucide-react";

export interface ReleaseDecision {
  status: "READY" | "CONDITIONAL" | "BLOCKED";
  score: number;
  recommendation: string;
  blockersCount: number;
  warningsCount: number;
  lastEvaluatedAt?: string;
  isPendingContract?: boolean;
}

export interface ReleaseReadinessCardProps {
  decision?: ReleaseDecision;
}

export function ReleaseReadinessCard({
  decision = {
    status: "READY",
    score: 94,
    recommendation: "Passed automated release criteria across safety, accuracy, and latency benchmarks.",
    blockersCount: 0,
    warningsCount: 1,
    lastEvaluatedAt: "Just now",
    isPendingContract: true,
  },
}: ReleaseReadinessCardProps) {
  const statusConfig = {
    READY: {
      label: "Release Recommended (GO)",
      badgeVariant: "success" as const,
      icon: CheckCircle2,
      borderClass: "border-emerald-200 bg-emerald-50/30",
      textColor: "text-emerald-700",
    },
    CONDITIONAL: {
      label: "Conditional Release (REVIEW)",
      badgeVariant: "warning" as const,
      icon: AlertTriangle,
      borderClass: "border-amber-200 bg-amber-50/30",
      textColor: "text-amber-700",
    },
    BLOCKED: {
      label: "Release Blocked (NO-GO)",
      badgeVariant: "destructive" as const,
      icon: XCircle,
      borderClass: "border-red-200 bg-red-50/30",
      textColor: "text-red-700",
    },
  };

  const current = statusConfig[decision.status];
  const Icon = current.icon;

  return (
    <Card className="border-slate-200 shadow-xs">
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900">
            Release Intelligence Gate
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Automated production release readiness decision engine
          </CardDescription>
        </div>
        <Badge variant={current.badgeVariant}>{current.label}</Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {decision.isPendingContract && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 text-[11px] text-amber-800 border border-amber-200/60">
            <Info className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span>Backend scoring endpoint pending confirmation. Displaying visual model.</span>
          </div>
        )}

        <div className={`p-4 rounded-xl border ${current.borderClass} flex items-start gap-3.5`}>
          <div className={`p-2 rounded-lg bg-white shadow-xs shrink-0 ${current.textColor}`}>
            <Icon className="h-5 w-5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">
                Quality Index: {decision.score}/100
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">Evaluated {decision.lastEvaluatedAt}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {decision.recommendation}
            </p>
          </div>
        </div>

        {/* Breakdown Indicators */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Critical Blockers</div>
              <div className="text-xs font-bold text-slate-900">{decision.blockersCount} detected</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Warnings for Triage</div>
              <div className="text-xs font-bold text-slate-900">{decision.warningsCount} flagged</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ReleaseReadinessCard;

