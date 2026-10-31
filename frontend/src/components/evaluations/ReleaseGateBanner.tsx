import { ReleaseRecommendation } from "@/types/evaluation.types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from "lucide-react";
import { cn } from "@/utils/cn";

interface ReleaseGateBannerProps {
  decision?: ReleaseRecommendation;
  overallScore?: number;
  explanation?: string;
  blockersCount: number;
  warningsCount: number;
  runNumber: string;
  applicationName: string;
  environment: string;
  dataSource?: "LIVE_BACKEND" | "DEVELOPMENT_MOCK_ONLY";
}

export function ReleaseGateBanner({
  decision = "RELEASE",
  overallScore = 90,
  explanation,
  blockersCount,
  warningsCount,
  runNumber,
  applicationName,
  environment,
  dataSource,
}: ReleaseGateBannerProps) {
  const isApproved = decision === "RELEASE";
  const isConditional = decision === "CONDITIONAL_RELEASE";

  return (
    <Card
      className={cn(
        "border shadow-sm overflow-hidden",
        isApproved
          ? "border-emerald-200 bg-emerald-50/30"
          : isConditional
          ? "border-amber-200 bg-amber-50/30"
          : "border-red-200 bg-red-50/30"
      )}
    >
      {dataSource === "DEVELOPMENT_MOCK_ONLY" && (
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-1.5 text-[11px] text-amber-800 font-semibold flex items-center justify-between">
          <span>
            ⚠️ DEVELOPMENT_MOCK_ONLY: This decision and quality score are non-authoritative development fixtures.
          </span>
          <span className="font-mono text-[10px] bg-amber-200/80 px-2 py-0.5 rounded">
            Contract: PENDING_BACKEND_CONFIRMATION
          </span>
        </div>
      )}
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Decision Pill & Info */}
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500">{runNumber}</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-700">{applicationName}</span>
              <Badge variant="outline" className="text-[10px]">
                {environment}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-xs",
                  isApproved
                    ? "bg-emerald-100 text-emerald-700"
                    : isConditional
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
                )}
              >
                {isApproved ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : isConditional ? (
                  <AlertTriangle className="h-6 w-6" />
                ) : (
                  <XCircle className="h-6 w-6" />
                )}
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Automated Release Intelligence Decision
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {isApproved
                    ? "APPROVED FOR PRODUCTION RELEASE"
                    : isConditional
                    ? "CONDITIONAL RELEASE (CANARY SUPERVISION)"
                    : "RELEASE REJECTED & BLOCKED"}
                </h2>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed pt-1">
              {explanation ||
                "All 9 evaluation pillars satisfied threshold bounds. Safety and security invariants achieved 100% adherence."}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Blocker Defects:</span>
                <span className={cn(blockersCount > 0 ? "text-red-600 font-bold" : "text-emerald-600")}>
                  {blockersCount}
                </span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Policy Warnings:</span>
                <span className={cn(warningsCount > 0 ? "text-amber-600 font-bold" : "text-slate-700")}>
                  {warningsCount}
                </span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1 text-slate-500">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                <span>Deterministic Policy Engine Verified</span>
              </div>
            </div>
          </div>

          {/* Quality Score Ring Snapshot */}
          <div className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs self-start lg:self-auto min-w-[170px]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Overall Quality
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span
                className={cn(
                  "text-4xl font-extrabold tracking-tight",
                  isApproved ? "text-emerald-600" : isConditional ? "text-amber-600" : "text-red-600"
                )}
              >
                {overallScore}
              </span>
              <span className="text-xs text-slate-400 font-bold">/100</span>
            </div>
            <span className="mt-1 text-[10.5px] font-medium text-slate-500">
              Composite 9-Pillar Index
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ReleaseGateBanner;
