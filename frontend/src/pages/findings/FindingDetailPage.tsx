import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Layers, FileCode, CheckCircle2, Clock, Cpu } from "lucide-react";
import { useFinding } from "@/hooks/useFindings";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import { EmptyState } from "@/components/dashboard/EmptyState";

export function FindingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: finding, isLoading, isError } = useFinding(id);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <SkeletonCard />
      </div>
    );
  }

  if (isError || !finding) {
    return (
      <EmptyState
        icon={FileCode}
        title="Finding Not Found"
        description={`The requested finding ID "${id}" could not be located in the defect registry.`}
        actionText="Back to Findings"
        onAction={() => navigate("/findings")}
      />
    );
  }

  const ev = finding.evidence;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/findings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to All Findings</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{finding.title}</h1>
            <Badge variant="outline" className="text-xs">{finding.pillar}</Badge>
            <Badge variant={finding.status === "MITIGATED" ? "success" : "neutral"} className="text-xs">
              {finding.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Detected on {new Date(finding.detectedAt).toLocaleDateString()} • Workload:{" "}
            <Link to={`/applications/${finding.applicationId}`} className="font-semibold text-indigo-600 hover:underline">
              {finding.applicationName} ({finding.applicationVersion})
            </Link>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(`/applications/${finding.applicationId}`)}
            className="text-xs gap-1.5"
          >
            <Layers className="h-3.5 w-3.5 text-slate-500" />
            <span>Workload</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => navigate(`/evaluations/${finding.runId}/results`)}
            className="text-xs gap-1.5 font-bold"
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Evaluation Run</span>
          </Button>
        </div>
      </div>

      {finding.dataSource === "DEVELOPMENT_MOCK_ONLY" && (
        <div className="bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl text-xs text-amber-800 font-semibold flex items-center justify-between">
          <span>⚠️ DEVELOPMENT_MOCK_ONLY: Evidence record rendered from development mock fixtures.</span>
          <span className="font-mono text-[10px] bg-amber-100 px-2 py-0.5 rounded">Contract: PENDING_BACKEND_CONFIRMATION</span>
        </div>
      )}

      {/* Description & Component Profile */}
      <Card className="border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
          Defect Overview & Root Cause
        </span>
        <p className="text-xs text-slate-800 leading-relaxed font-medium">
          {finding.description}
        </p>
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span>Affected Component: <strong className="text-slate-800">{finding.affectedComponent}</strong></span>
          <span>•</span>
          <span>Evaluation Run: <strong className="font-mono text-slate-800">{finding.runNumber}</strong></span>
        </div>
      </Card>

      {/* Evidence Explorer (Expected vs Actual Comparison) */}
      <Card className="border border-slate-200 bg-white shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileCode className="h-4 w-4 text-indigo-600" />
            <span>Evidence Explorer: Ground-Truth Discrepancy Comparison</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-4 space-y-5">
          {/* Input Prompt */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-700 block">Original Evaluated Prompt Input:</span>
            <pre className="p-3 bg-slate-900 text-slate-100 font-mono text-xs rounded-xl overflow-x-auto whitespace-pre-wrap">
              {ev.promptInput}
            </pre>
          </div>

          {/* Actual vs Expected Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-red-700 flex items-center gap-1">
                <span>Evaluated Model Output (Actual Anomaly):</span>
              </span>
              <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl font-mono text-xs text-red-900 leading-relaxed min-h-[100px]">
                {ev.modelOutput}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Expected Ground-Truth Behavior:</span>
              </span>
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl font-mono text-xs text-emerald-900 leading-relaxed min-h-[100px]">
                {ev.expectedOutput}
              </div>
            </div>
          </div>

          {/* Invariant Analysis */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-800">Automated Discrepancy Analysis:</span>
            <p className="text-slate-600 leading-relaxed">{ev.discrepancyAnalysis}</p>
          </div>

          {ev.sourceCitations && ev.sourceCitations.length > 0 && (
            <div className="text-xs space-y-1">
              <span className="font-bold text-slate-700">Source References:</span>
              <ul className="list-disc pl-5 text-slate-600 font-mono text-[11px] space-y-0.5">
                {ev.sourceCitations.map((cit, idx) => (
                  <li key={idx}>{cit}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Latency: {ev.latencyMs || 840}ms
            </span>
            <span>•</span>
            <span>Tokens: {ev.tokensUsed || 320}</span>
          </div>
        </CardContent>
      </Card>

      {/* Remediation Guidance */}
      <Card className="border border-indigo-200 bg-indigo-50/30 p-5 shadow-xs space-y-2">
        <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
          Recommended Engineering Remediation
        </h3>
        <p className="text-xs text-indigo-900 leading-relaxed font-medium">
          {finding.remediationGuidance}
        </p>
      </Card>
    </div>
  );
}

export default FindingDetailPage;

