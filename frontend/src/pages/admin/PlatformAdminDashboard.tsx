import { Building2, Cpu, CheckCircle2, Users } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { OrganisationsTable } from "@/components/dashboard/OrganisationsTable";
import { PlatformActivityFeed } from "@/components/dashboard/PlatformActivityFeed";
import { SystemStatusCard } from "@/components/dashboard/SystemStatusCard";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import { Badge } from "@/components/ui/badge";
import { usePlatformAdminMetrics } from "@/hooks/useDashboard";

export function PlatformAdminDashboard() {
  const { data: metrics, isLoading } = usePlatformAdminMetrics();

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Platform Administration & Tenant Governance
            </h1>
            <Badge variant="warning">Superuser Admin</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global multi-tenant governance, cross-organisation workloads, and evaluation engine telemetry
          </p>
        </div>
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
            title="Total Organisations"
            value={metrics?.totalOrganisations}
            change="+4"
            changeType="positive"
            comparison="this quarter"
            icon={Building2}
          />
          <MetricCard
            title="Total AI Applications"
            value={metrics?.totalApplications}
            change="+16"
            changeType="positive"
            comparison="active pipelines"
            icon={Cpu}
          />
          <MetricCard
            title="Evaluation Runs"
            value={metrics?.totalEvaluations?.toLocaleString()}
            change="+28.2%"
            changeType="positive"
            comparison="system-wide"
            icon={CheckCircle2}
          />
          <MetricCard
            title="Active Evaluators"
            value={metrics?.platformActiveUsers}
            change="+12"
            changeType="positive"
            comparison="verified accounts"
            icon={Users}
          />
        </div>
      )}

      {/* System Health Overview Card */}
      <SystemStatusCard isPendingContract={true} />

      {/* Two Column Row: Organisations Overview & Platform Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8">
          <OrganisationsTable isPendingContract={true} />
        </div>

        <div className="xl:col-span-4">
          <PlatformActivityFeed isPendingContract={true} />
        </div>
      </div>
    </div>
  );
}

export default PlatformAdminDashboard;
