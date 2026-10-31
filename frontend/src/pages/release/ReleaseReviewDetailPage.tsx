import * as React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, CheckCircle2, AlertTriangle, XCircle, MessageSquare, Send } from "lucide-react";
import { useReleaseReview, useSubmitReviewDecision } from "@/hooks/useRelease";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ReleaseDecision } from "@/types/release.types";

export function ReleaseReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: review, isLoading, isError } = useReleaseReview(id);
  const submitMutation = useSubmitReviewDecision();

  const [selectedDecision, setSelectedDecision] = React.useState<ReleaseDecision>("RELEASE");
  const [comments, setComments] = React.useState("");
  const [submissionError, setSubmissionError] = React.useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <SkeletonCard />
      </div>
    );
  }

  if (isError || !review) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Release Review Not Found"
        description={`The requested release review record "${id}" was not located.`}
        actionText="Back to Release Reviews"
        onAction={() => navigate("/release-reviews")}
      />
    );
  }

  const handleSignOff = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    submitMutation.mutate(
      {
        reviewId: review.id,
        decision: selectedDecision,
        comments: comments.trim(),
      },
      {
        onSuccess: () => {
          setComments("");
        },
        onError: (err) => {
          setSubmissionError(err instanceof Error ? err.message : "Failed to record review decision.");
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="space-y-1">
        <Link
          to="/release-reviews"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Release Reviews Directory</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Release Governance Audit & Sign-Off
          </h1>
          <Badge variant="default" className="text-xs">{review.runNumber}</Badge>
          <Badge variant={review.status === "APPROVED" ? "success" : review.status === "REJECTED" ? "destructive" : "warning"} className="text-xs">
            {review.status}
          </Badge>
        </div>
        <p className="text-xs text-slate-500">
          Workload: <strong className="text-slate-800">{review.applicationName} ({review.applicationVersion})</strong> • Environment: <span className="font-mono">{review.environment}</span>
        </p>
      </div>

      {review.dataSource === "DEVELOPMENT_MOCK_ONLY" && (
        <div className="bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl text-xs text-amber-800 font-semibold flex items-center justify-between">
          <span>⚠️ DEVELOPMENT_MOCK_ONLY: Release review record rendered from development mock fixtures.</span>
          <span className="font-mono text-[10px] bg-amber-100 px-2 py-0.5 rounded">Contract: PENDING_BACKEND_CONFIRMATION</span>
        </div>
      )}

      {/* Decision Summary Card */}
      <Card className="border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Engine Evaluated Gate Decision
            </span>
            <div className="flex items-center gap-2">
              <Badge
                variant={review.decision === "RELEASE" ? "success" : review.decision === "REJECT" ? "destructive" : "warning"}
                className="text-xs font-bold"
              >
                {review.decision}
              </Badge>
              <span className="text-xs font-bold text-slate-800">
                Score: {review.overallScore} / 100
              </span>
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="text-red-600 font-bold block">{review.blockersCount} Blockers</span>
            <span className="text-amber-600 font-semibold">{review.warningsCount} Warnings</span>
          </div>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed font-medium">
          {review.decisionExplanation}
        </p>

        {review.reviewer && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Sign-Off Recorded by: {review.reviewer} ({review.reviewerRole})
            </span>
            {review.comments && <p className="italic text-slate-700 pl-5">"{review.comments}"</p>}
          </div>
        )}
      </Card>

      {/* Human Reviewer Approval Workflow (Role-Aware) */}
      <Card className="border border-slate-200 bg-white shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <span>Human Reviewer Sign-Off & Release Policy Veto</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          <form onSubmit={handleSignOff} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">Select Sign-Off Decision:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: "RELEASE" as ReleaseDecision, label: "Approve for Release", icon: CheckCircle2, color: "text-emerald-600" },
                  { value: "CONDITIONAL_RELEASE" as ReleaseDecision, label: "Conditional Canary", icon: AlertTriangle, color: "text-amber-600" },
                  { value: "REJECT" as ReleaseDecision, label: "Veto / Block Release", icon: XCircle, color: "text-red-600" },
                ].map((item) => (
                  <label
                    key={item.value}
                    className={`p-3 rounded-xl border text-xs font-bold cursor-pointer flex items-center gap-2 transition-all ${
                      selectedDecision === item.value
                        ? "border-indigo-600 bg-indigo-50/50 text-slate-900 shadow-xs"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="decision-choice"
                      value={item.value}
                      checked={selectedDecision === item.value}
                      onChange={() => setSelectedDecision(item.value)}
                      className="text-indigo-600"
                    />
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                <span>Governance Sign-Off Notes & Compliance Justification:</span>
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Document your compliance justification, risk mitigation checks, or canary rollout parameters..."
                rows={3}
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all"
              />
            </div>

            {submissionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {submissionError}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Backend authorization remains authoritative across tenant and admin tiers.
              </span>

              <Button
                type="submit"
                size="sm"
                disabled={submitMutation.isPending}
                isLoading={submitMutation.isPending}
                className="h-9 px-5 text-xs font-bold gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Submit Release Sign-Off</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default ReleaseReviewDetailPage;

