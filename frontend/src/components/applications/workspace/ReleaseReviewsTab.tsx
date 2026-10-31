import { ReleaseReviewItem } from "@/types/application.types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from "lucide-react";

interface ReleaseReviewsTabProps {
  reviews?: ReleaseReviewItem[];
}

export function ReleaseReviewsTab({ reviews = [] }: ReleaseReviewsTabProps) {
  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case "RELEASE":
        return (
          <Badge variant="success" className="gap-1 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>APPROVED FOR RELEASE</span>
          </Badge>
        );
      case "CONDITIONAL_RELEASE":
        return (
          <Badge variant="warning" className="gap-1 text-xs">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>CONDITIONAL RELEASE (CANARY)</span>
          </Badge>
        );
      case "REJECT":
        return (
          <Badge variant="destructive" className="gap-1 text-xs">
            <XCircle className="h-3.5 w-3.5" />
            <span>RELEASE BLOCKED / REJECTED</span>
          </Badge>
        );
      default:
        return <Badge variant="outline">{decision}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Release Intelligence Reviews & Governance Sign-Offs
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Audit logs of release gate evaluations, automated safety thresholds, and engineering sign-offs.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {reviews.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">No release reviews recorded</p>
              <p className="text-[11px] text-slate-500">
                Release reviews are synthesized upon completing a full 9-dimension evaluation run.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      {getDecisionBadge(rev.decision)}
                      <span className="font-mono text-xs font-bold text-slate-700">
                        {rev.runId}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-500">
                      Reviewed on {new Date(rev.reviewedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {rev.explanation}
                  </p>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-50">
                    <span>
                      Reviewer: <strong className="text-slate-800">{rev.reviewer}</strong>
                    </span>
                    <div className="flex items-center gap-4">
                      <span>
                        Blockers: <strong className="text-red-600">{rev.blockersCount}</strong>
                      </span>
                      <span>
                        Warnings: <strong className="text-amber-600">{rev.warningsCount}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ReleaseReviewsTab;

