import { Cpu, CheckCircle2, Award, ShieldCheck } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { QuickActionsBar } from "@/components/dashboard/QuickActionsBar";
import { ReleaseReadinessCard } from "@/components/dashboard/ReleaseReadinessCard";
import { QualityMatrixCard } from "@/components/dashboard/QualityMatrixCard";
import { RecentEvaluationsTable } from "@/components/dashboard/RecentEvaluationsTable";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import { useOrgUserMetrics } from "@/hooks/useDashboard";

export function OrgUserDashboard() {
  const { data: metrics, isLoading } = useOrgUserMetrics();

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            AI Quality & Release Cockpit
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time quality telemetry, safety gates, and release readiness intelligence
          </p>
        </div>

        <QuickActionsBar />
      </div>

      {/* Overview Stat Cards Row */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Registered Applications"
            value={metrics?.totalApplications}
            change="+2"
            changeType="positive"
            comparison="this sprint"
            icon={Cpu}
          />
          <MetricCard
            title="Total Evaluations"
            value={metrics?.totalEvaluations?.toLocaleString()}
            change="+18.4%"
            changeType="positive"
            comparison="vs last cycle"
            icon={CheckCircle2}
          />
          <MetricCard
            title="Average Quality Score"
            value={`${metrics?.averageQualityScore}%`}
            change="+3.1%"
            changeType="positive"
            comparison="vs baseline"
            icon={Award}
          />
          <MetricCard
            title="Release Readiness"
            value="GO (94/100)"
            change="Passing"
            changeType="positive"
            comparison="zero blockers"
            icon={ShieldCheck}
          />
        </div>
      )}

      {/* Main Release Gate & Readiness Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 xl:col-span-5">
          <ReleaseReadinessCard
            decision={{
              status: metrics?.releaseReadinessStatus || "READY",
              score: metrics?.releaseScore || 94,
              recommendation:
                "All 9 evaluation vectors meet enterprise thresholds. Automated regression differential confirmed zero prompt degradation.",
              blockersCount: metrics?.criticalBlockers || 0,
              warningsCount: metrics?.activeWarnings || 1,
              lastEvaluatedAt: "12m ago",
              isPendingContract: true,
            }}
          />
        </div>

        <div className="lg:col-span-12 xl:col-span-7">
          <QualityMatrixCard isPendingContract={true} />
        </div>
      </div>

      {/* Recent Evaluations Table */}
      <div>
        <RecentEvaluationsTable isPendingContract={true} />
      </div>
    </div>
  );
}

export default OrgUserDashboard;

