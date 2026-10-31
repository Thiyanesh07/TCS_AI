import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, ArrowRight } from "lucide-react";
import { useReleaseReviews } from "@/hooks/useRelease";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import { EmptyState } from "@/components/dashboard/EmptyState";

export function ReleaseReviewsPage() {
  const [decisionFilter, setDecisionFilter] = React.useState("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const navigate = useNavigate();

  const { data: reviews = [], isLoading, isError } = useReleaseReviews({
    decision: decisionFilter,
    status: statusFilter,
  });

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case "RELEASE":
        return <Badge variant="success" className="gap-1 text-[10.5px]"><CheckCircle2 className="h-3 w-3" />RELEASE</Badge>;
      case "CONDITIONAL_RELEASE":
        return <Badge variant="warning" className="gap-1 text-[10.5px]"><AlertTriangle className="h-3 w-3" />CONDITIONAL</Badge>;
      case "REJECT":
        return <Badge variant="destructive" className="gap-1 text-[10.5px]"><XCircle className="h-3 w-3" />REJECTED</Badge>;
      default:
        return <Badge variant="outline">{decision}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Release Intelligence & Governance Reviews</h1>
            <Badge variant="default" className="text-[11px]">{reviews.length} Records</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative release decisions, automated gate evaluations, and human sign-off ledgers.
          </p>
        </div>
      </div>

      {reviews.some((r) => r.dataSource === "DEVELOPMENT_MOCK_ONLY") && (
        <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-xs text-amber-800 font-semibold flex items-center justify-between">
          <span>⚠️ DEVELOPMENT_MOCK_ONLY: Release governance directory rendered from development mock fixtures.</span>
          <span className="font-mono text-[10px] bg-amber-100 px-2 py-0.5 rounded">Contract: PENDING_BACKEND_CONFIRMATION</span>
        </div>
      )}

      {/* Filter Tabs */}
      <Card className="border border-slate-200 bg-white p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-700">Filter Decision:</span>
          {["ALL", "RELEASE", "CONDITIONAL_RELEASE", "REJECT"].map((dec) => (
            <button
              key={dec}
              type="button"
              onClick={() => setDecisionFilter(dec)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                decisionFilter === dec ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {dec}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-700">Review Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </Card>

      {/* Directory Table */}
      {isLoading ? (
        <SkeletonCard />
      ) : isError ? (
        <EmptyState icon={ShieldCheck} title="Failed to Load Release Reviews" description="Could not connect to release governance service." />
      ) : reviews.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No Reviews Found" description="All release audits are within expected parameters." />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Decision</th>
                  <th className="px-4 py-3">Target Workload</th>
                  <th className="px-4 py-3">Run Number</th>
                  <th className="px-4 py-3">Quality Score</th>
                  <th className="px-4 py-3">Blockers & Warnings</th>
                  <th className="px-4 py-3">Review Status</th>
                  <th className="px-4 py-3">Reviewer Sign-Off</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">{getDecisionBadge(r.decision)}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Link to={`/applications/${r.applicationId}`} className="font-bold text-slate-900 hover:text-indigo-600 block">
                        {r.applicationName}
                      </Link>
                      <span className="font-mono text-[10px] text-slate-400">{r.applicationVersion} ({r.environment})</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {r.runNumber}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-bold text-slate-900">
                      {r.overallScore} / 100
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-red-600 font-bold">{r.blockersCount} Blockers</span>
                      <span className="text-slate-300 mx-1.5">•</span>
                      <span className="text-amber-600 font-semibold">{r.warningsCount} Warnings</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge variant={r.status === "APPROVED" ? "success" : r.status === "REJECTED" ? "destructive" : "warning"} className="text-[10px]">
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 max-w-xs truncate text-[11px] text-slate-600">
                      {r.reviewer || "Pending Quality Lead"}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/release-reviews/${r.id}`)}
                        className="h-7 px-2.5 text-xs font-semibold gap-1"
                      >
                        <span>Governance</span>
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

export default ReleaseReviewsPage;

