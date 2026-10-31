import * as React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, XCircle, TrendingUp, TrendingDown, Layers } from "lucide-react";
import { useRegressionBenchmarks } from "@/hooks/useRegression";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import { EmptyState } from "@/components/dashboard/EmptyState";

export function RegressionPage() {
  const [classificationFilter, setClassificationFilter] = React.useState("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ALL");

  const { data: benchmarks = [], isLoading, isError } = useRegressionBenchmarks({
    classification: classificationFilter,
    status: statusFilter,
  });

  const passingCount = benchmarks.filter((b) => b.status === "PASSING").length;
  const failingCount = benchmarks.filter((b) => b.status === "FAILING").length;
  const resolvedCount = benchmarks.filter((b) => b.classification === "RESOLVED").length;

  const getClassificationBadge = (cls: string) => {
    switch (cls) {
      case "RESOLVED":
        return <Badge variant="success" className="text-[10px]">RESOLVED</Badge>;
      case "NEW_DEFECT":
        return <Badge variant="destructive" className="text-[10px]">NEW REGRESSION</Badge>;
      case "PERSISTENT":
        return <Badge variant="warning" className="text-[10px]">PERSISTENT</Badge>;
      default:
        return <Badge variant="outline">{cls}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Regression Management & Invariant Benchmarks
            </h1>
            <Badge variant="default" className="text-[11px]">{benchmarks.length} Invariants</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track historical regression differentials, prevent defect recurrence, and verify baseline fidelity.
          </p>
        </div>
      </div>

      {benchmarks.some((b) => b.dataSource === "DEVELOPMENT_MOCK_ONLY") && (
        <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-xs text-amber-800 font-semibold flex items-center justify-between">
          <span>⚠️ DEVELOPMENT_MOCK_ONLY: Regression benchmarks populated from development mock fixtures.</span>
          <span className="font-mono text-[10px] bg-amber-100 px-2 py-0.5 rounded">Contract: PENDING_BACKEND_CONFIRMATION</span>
        </div>
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border border-slate-200 bg-white p-4">
          <span className="text-[11px] font-medium text-slate-500 block">Total Invariants</span>
          <div className="mt-1 text-2xl font-bold text-slate-900">{benchmarks.length}</div>
          <span className="text-[10.5px] text-slate-400">Continuous regression checks</span>
        </Card>
        <Card className="border border-slate-200 bg-white p-4">
          <span className="text-[11px] font-medium text-slate-500 block">Passing Assertions</span>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{passingCount}</div>
          <span className="text-[10.5px] text-slate-400">Verified against golden state</span>
        </Card>
        <Card className="border border-slate-200 bg-white p-4">
          <span className="text-[11px] font-medium text-slate-500 block">Failing Invariants</span>
          <div className="mt-1 text-2xl font-bold text-red-600">{failingCount}</div>
          <span className="text-[10.5px] text-slate-400">Active regressions</span>
        </Card>
        <Card className="border border-slate-200 bg-white p-4">
          <span className="text-[11px] font-medium text-slate-500 block">Resolved Defect Tests</span>
          <div className="mt-1 text-2xl font-bold text-indigo-600">{resolvedCount}</div>
          <span className="text-[10.5px] text-slate-400">Defects fixed and protected</span>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Card className="border border-slate-200 bg-white p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-700">Classification:</span>
          {["ALL", "RESOLVED", "NEW_DEFECT", "PERSISTENT"].map((cls) => (
            <button
              key={cls}
              type="button"
              onClick={() => setClassificationFilter(cls)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                classificationFilter === cls ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cls}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-700">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="PASSING">Passing</option>
            <option value="FAILING">Failing</option>
          </select>
        </div>
      </Card>

      {/* Regression Data Table */}
      {isLoading ? (
        <SkeletonCard />
      ) : isError ? (
        <EmptyState icon={Layers} title="Failed to Load Regressions" description="Could not connect to regression service." />
      ) : benchmarks.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="No Regression Invariants Found" description="All continuous test baselines are passing with zero regression deltas." />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Regression Benchmark Test</th>
                  <th className="px-4 py-3">Workload</th>
                  <th className="px-4 py-3">Pillar</th>
                  <th className="px-4 py-3">Baseline</th>
                  <th className="px-4 py-3">Current</th>
                  <th className="px-4 py-3">Delta</th>
                  <th className="px-4 py-3">Classification</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {benchmarks.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 max-w-sm">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 block">{b.testName}</span>
                        <Link to={`/findings/${b.sourceFindingId}`} className="font-mono text-[10.5px] text-indigo-600 hover:underline">
                          Source: {b.sourceFindingId}
                        </Link>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Link to={`/applications/${b.applicationId}`} className="font-semibold text-slate-800 hover:text-indigo-600">
                        {b.applicationName}
                      </Link>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge variant="outline" className="text-[10px]">{b.pillar}</Badge>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-500 font-medium">
                      {b.baselineScore}%
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap font-mono font-bold text-slate-900">
                      {b.currentScore}%
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 font-mono font-bold text-[11px] ${
                        b.delta >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}>
                        {b.delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {b.delta > 0 ? `+${b.delta}%` : `${b.delta}%`}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getClassificationBadge(b.classification)}
                    </td>

                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <Badge variant={b.status === "PASSING" ? "success" : "destructive"} className="gap-1 text-[10px]">
                        {b.status === "PASSING" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        <span>{b.status}</span>
                      </Badge>
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

export default RegressionPage;

