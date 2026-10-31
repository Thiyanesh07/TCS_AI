import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowRight, CheckCircle2 } from "lucide-react";
import { useFindings } from "@/hooks/useFindings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import { EmptyState } from "@/components/dashboard/EmptyState";

export function FindingsPage() {
  const [search, setSearch] = React.useState("");
  const [severity, setSeverity] = React.useState("ALL");
  const [pillar, setPillar] = React.useState("ALL");
  const [status, setStatus] = React.useState("ALL");

  const navigate = useNavigate();

  const { data: findings = [], isLoading, isError } = useFindings({
    search: search.trim() || undefined,
    severity,
    pillar,
    status,
  });

  const criticalCount = findings.filter((f) => f.severity === "CRITICAL").length;
  const highCount = findings.filter((f) => f.severity === "HIGH").length;
  const openCount = findings.filter((f) => f.status === "OPEN").length;

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-red-100 text-red-700 border border-red-200">CRITICAL</span>;
      case "HIGH":
        return <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-100 text-amber-800 border border-amber-200">HIGH</span>;
      case "MEDIUM":
        return <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200">LOW</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Findings & Evidence Explorer</h1>
            <Badge variant="default" className="text-[11px]">{findings.length} Discovered</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centrally manage and investigate all quality anomalies, safety exploits, and grounding defects.
          </p>
        </div>
      </div>

      {findings.some((f) => f.dataSource === "DEVELOPMENT_MOCK_ONLY") && (
        <div className="bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl text-xs text-amber-800 font-semibold flex items-center justify-between">
          <span>⚠️ DEVELOPMENT_MOCK_ONLY: Findings ledger populated from development mock fixtures.</span>
          <span className="font-mono text-[10px] bg-amber-100 px-2 py-0.5 rounded">Contract: PENDING_BACKEND_CONFIRMATION</span>
        </div>
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border border-slate-200 bg-white p-4">
          <span className="text-[11px] font-medium text-slate-500 block">Total Findings</span>
          <div className="mt-1 text-2xl font-bold text-slate-900">{findings.length}</div>
          <span className="text-[10.5px] text-slate-400">Tracked across runs</span>
        </Card>
        <Card className="border border-slate-200 bg-white p-4">
          <span className="text-[11px] font-medium text-slate-500 block">Critical Blockers</span>
          <div className="mt-1 text-2xl font-bold text-red-600">{criticalCount}</div>
          <span className="text-[10.5px] text-slate-400">Release gating defects</span>
        </Card>
        <Card className="border border-slate-200 bg-white p-4">
          <span className="text-[11px] font-medium text-slate-500 block">High Severity</span>
          <div className="mt-1 text-2xl font-bold text-amber-600">{highCount}</div>
          <span className="text-[10.5px] text-slate-400">Action recommended</span>
        </Card>
        <Card className="border border-slate-200 bg-white p-4">
          <span className="text-[11px] font-medium text-slate-500 block">Open Status</span>
          <div className="mt-1 text-2xl font-bold text-indigo-600">{openCount}</div>
          <span className="text-[10.5px] text-slate-400">Awaiting remediation</span>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search findings by title, description, workload, or ID..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={pillar}
              onChange={(e) => setPillar(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Pillars</option>
              <option value="Grounding">Grounding</option>
              <option value="Security">Security</option>
              <option value="Accuracy">Accuracy</option>
              <option value="Safety">Safety</option>
              <option value="Consistency">Consistency</option>
              <option value="Bias">Bias</option>
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="MITIGATED">Mitigated</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <SkeletonCard />
      ) : isError ? (
        <EmptyState
          icon={Search}
          title="Failed to Load Findings"
          description="Could not connect to findings service."
        />
      ) : findings.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No Findings Found"
          description="All evaluation outputs are strictly aligned with safety invariants and ground-truth assertions."
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Severity & Pillar</th>
                  <th className="px-4 py-3">Finding Title & Description</th>
                  <th className="px-4 py-3">Target Workload</th>
                  <th className="px-4 py-3">Run ID</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Investigation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {findings.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="space-y-1">
                        {getSeverityBadge(f.severity)}
                        <Badge variant="outline" className="text-[10px] block w-fit">{f.pillar}</Badge>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 max-w-md">
                      <div className="space-y-1">
                        <Link to={`/findings/${f.id}`} className="font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1">
                          {f.title}
                        </Link>
                        <p className="text-slate-500 text-[11px] line-clamp-2 leading-relaxed">
                          {f.description}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Link to={`/applications/${f.applicationId}`} className="font-semibold text-slate-800 hover:text-indigo-600 block">
                        {f.applicationName}
                      </Link>
                      <span className="font-mono text-[10px] text-slate-400">{f.applicationVersion}</span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {f.runNumber}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge variant={f.status === "MITIGATED" ? "success" : "neutral"} className="text-[10px]">
                        {f.status}
                      </Badge>
                    </td>

                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/findings/${f.id}`)}
                        className="h-7 px-2.5 text-xs font-semibold gap-1"
                      >
                        <span>Evidence</span>
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

export default FindingsPage;

