import { useParams, useNavigate } from "react-router-dom";
import { Download, Printer, ShieldCheck, CheckCircle2, TrendingUp, Layers } from "lucide-react";
import { useQualityReport } from "@/hooks/useFindings";
import { findingsService } from "@/services/findings.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import { EmptyState } from "@/components/dashboard/EmptyState";

export function QualityReportPage() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();

  const { data: report, isLoading, isError } = useQualityReport(runId || "run_9841");

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <SkeletonCard />
      </div>
    );
  }

  if (isError || !report) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Quality Report Unavailable"
        description={`Quality report for run ID "${runId}" could not be generated.`}
        actionText="Back to History"
        onAction={() => navigate("/history")}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto print:p-0 print:space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Executive AI Quality & Release Audit Report
            </h1>
            <Badge variant="default" className="text-[11px]">{report.runNumber}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generated on {new Date(report.generatedAt).toLocaleDateString()} for workload{" "}
            <strong className="text-slate-800">{report.applicationName} ({report.applicationVersion})</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => findingsService.exportReport(report, "PRINT")}
            className="text-xs gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print / PDF</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => findingsService.exportReport(report, "CSV")}
            className="text-xs gap-1.5 font-bold"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {report.dataSource === "DEVELOPMENT_MOCK_ONLY" && (
        <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-xs text-amber-800 font-semibold flex items-center justify-between print:hidden">
          <span>⚠️ DEVELOPMENT_MOCK_ONLY: Report metrics rendered from offline development fixtures.</span>
          <span className="font-mono text-[10px] bg-amber-100 px-2 py-0.5 rounded">Contract: PENDING_BACKEND_CONFIRMATION</span>
        </div>
      )}

      {/* Executive Decision & Overall Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-slate-200 bg-white p-5 md:col-span-2 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Automated Release Intelligence Decision
          </span>
          <div className="flex items-center gap-2">
            <Badge
              variant={report.releaseRecommendation === "RELEASE" ? "success" : "destructive"}
              className="text-sm px-3 py-1 font-bold"
            >
              {report.releaseRecommendation === "RELEASE" ? "APPROVED FOR RELEASE" : "RELEASE BLOCKED"}
            </Badge>
            <span className="text-xs text-slate-500 font-mono">Env: {report.environment}</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">{report.recommendationExplanation}</p>
        </Card>

        <Card className="border border-slate-200 bg-white p-5 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Overall Quality Index</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-emerald-600">{report.overallScore}</span>
            <span className="text-xs text-slate-400 font-bold">/100</span>
          </div>
          <span className="mt-1 text-[11px] text-slate-500 font-medium">Composite 9-Pillar Score</span>
        </Card>
      </div>

      {/* 9 Dimensions Breakdown */}
      <Card className="border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <CardHeader className="p-0 pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            9-Dimension Quality Vector Adherence
          </CardTitle>
        </CardHeader>
        <div className="grid grid-cols-3 sm:grid-cols-9 gap-2 text-center text-xs">
          {Object.entries(report.dimensions).map(([key, val]) => (
            <div key={key} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">
                {key}
              </span>
              <span className="font-mono font-bold text-slate-900 block">{val}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Historical Comparison Delta */}
      {report.historicalDelta && (
        <Card className="border border-indigo-200 bg-indigo-50/30 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
            <TrendingUp className="h-4 w-4 text-indigo-600" />
            <span>Historical Benchmark Differential: Score Delta {report.historicalDelta.scoreDelta > 0 ? `+${report.historicalDelta.scoreDelta}` : report.historicalDelta.scoreDelta}%</span>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] text-indigo-800">
            {report.historicalDelta.improvedPillars.map((p, idx) => (
              <span key={idx} className="bg-white border border-indigo-200 px-2.5 py-0.5 rounded-lg font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                {p}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Test Execution Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-white border border-slate-200 rounded-xl">
          <span className="text-slate-400 block text-[10.5px]">Total Tests</span>
          <span className="text-lg font-bold text-slate-900">{report.totalTests}</span>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-xl">
          <span className="text-slate-400 block text-[10.5px]">Passing Invocations</span>
          <span className="text-lg font-bold text-emerald-600">{report.passedTests}</span>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-xl">
          <span className="text-slate-400 block text-[10.5px]">Failed Tests</span>
          <span className="text-lg font-bold text-red-600">{report.failedTests}</span>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-xl">
          <span className="text-slate-400 block text-[10.5px]">Blockers</span>
          <span className="text-lg font-bold text-slate-800">{report.blockersCount}</span>
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between print:hidden">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate(`/evaluations/${report.runId}/results`)}
          className="text-xs gap-1.5"
        >
          <Layers className="h-3.5 w-3.5" />
          <span>View Detailed Findings</span>
        </Button>
      </div>
    </div>
  );
}

export default QualityReportPage;
