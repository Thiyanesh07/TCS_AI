import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  PlayCircle,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useApplications } from "@/hooks/useApplications";
import { useStartEvaluation } from "@/hooks/useEvaluations";
import { EvaluationScope, StartEvaluationPayload } from "@/types/evaluation.types";
import { cn } from "@/utils/cn";

export function EvaluationConfigForm() {
  const [searchParams] = useSearchParams();
  const preselectedAppId = searchParams.get("appId") || "";

  const navigate = useNavigate();
  const { data: applications = [] } = useApplications();
  const startMutation = useStartEvaluation();

  const [selectedAppId, setSelectedAppId] = React.useState(preselectedAppId);
  const [version, setVersion] = React.useState("v1.0.0");
  const [environment, setEnvironment] = React.useState("DEVELOPMENT");
  const [scope, setScope] = React.useState<EvaluationScope>("FULL_SUITE");
  const [concurrency, setConcurrency] = React.useState(4);
  const [timeoutMinutes, setTimeoutMinutes] = React.useState(15);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Auto-sync version & environment when application is selected
  React.useEffect(() => {
    if (applications.length > 0) {
      const targetId = selectedAppId || applications[0].id;
      if (!selectedAppId) setSelectedAppId(targetId);

      const targetApp = applications.find((a) => a.id === targetId);
      if (targetApp) {
        setVersion(targetApp.version);
        setEnvironment(targetApp.environment);
      }
    }
  }, [applications, selectedAppId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) {
      setFormError("Please select a target application to evaluate.");
      return;
    }

    const payload: StartEvaluationPayload = {
      applicationId: selectedAppId,
      version: version.trim() || "v1.0.0",
      environment,
      scope,
      concurrency,
      maxTimeoutMinutes: timeoutMinutes,
    };

    startMutation.mutate(payload, {
      onSuccess: (data) => {
        navigate(`/evaluations/${data.runId}`);
      },
      onError: (err) => {
        setFormError(err instanceof Error ? err.message : "Failed to trigger evaluation run.");
      },
    });
  };

  const selectedApp = applications.find((a) => a.id === selectedAppId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Target Application Selection */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-indigo-600" />
            <span>1. Target Workload Selection</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-800">
                Select Registered Application <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                disabled={startMutation.isPending}
                className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name} ({app.category} • {app.version} • {app.environment})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">Target Version Tag</label>
              <Input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                disabled={startMutation.isPending}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">Target Environment</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                disabled={startMutation.isPending}
                className="w-full h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <option value="DEVELOPMENT">DEVELOPMENT</option>
                <option value="STAGING">STAGING</option>
                <option value="PRODUCTION">PRODUCTION</option>
              </select>
            </div>
          </div>

          {selectedApp && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2 text-slate-600">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {selectedApp.category}
                </Badge>
                <span className="font-mono text-[11px] text-slate-500">{selectedApp.id}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span>
                  Method: <strong className="text-slate-800">{selectedApp.method}</strong>
                </span>
                <span>•</span>
                <span>
                  Prior Runs: <strong className="text-slate-800">{selectedApp.evaluationsCount}</strong>
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scope Configuration */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-600" />
            <span>2. Evaluation Scope & Pillar Coverage</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                id: "FULL_SUITE" as EvaluationScope,
                title: "Complete 9-Dimension Quality & Safety Assessment",
                description:
                  "Comprehensive multi-agent test sweep across Accuracy, Grounding, Completeness, Safety, Security, Consistency, Bias, Drift, and Release Readiness.",
                recommended: true,
              },
              {
                id: "SAFETY_REDTEAM" as EvaluationScope,
                title: "Adversarial Red-Teaming & Security Battery",
                description:
                  "Focuses on prompt injection, jailbreak attempts, indirect context poisoning, PII leakage, and output safety invariant violations.",
                recommended: false,
              },
              {
                id: "GROUNDING_BENCHMARK" as EvaluationScope,
                title: "Factuality & Document Grounding Benchmark",
                description:
                  "Strict citation attribution check against retrieved document vectors to identify hallucinations, extrapolation, and unsupported assertions.",
                recommended: false,
              },
              {
                id: "CUSTOM" as EvaluationScope,
                title: "Custom Curated Suite Selection",
                description:
                  "Select specific golden test packs, regression suites, and domain-specific benchmark assertion sets.",
                recommended: false,
              },
            ].map((option) => (
              <label
                key={option.id}
                className={cn(
                  "p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between space-y-2 select-none",
                  scope === option.id
                    ? "border-indigo-600 bg-indigo-50/40 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name="evaluation-scope"
                        value={option.id}
                        checked={scope === option.id}
                        onChange={() => setScope(option.id)}
                        disabled={startMutation.isPending}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-900">{option.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed pl-5">
                      {option.description}
                    </p>
                  </div>
                  {option.recommended && (
                    <Badge variant="success" className="text-[9.5px] px-1.5 py-0 shrink-0">
                      Recommended
                    </Badge>
                  )}
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Execution Constraints */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <span>3. Sandbox Execution Constraints</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800">
              Worker Concurrency: <span className="font-mono text-indigo-600">{concurrency} pods</span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={concurrency}
              onChange={(e) => setConcurrency(Number(e.target.value))}
              disabled={startMutation.isPending}
              className="w-full accent-indigo-600"
            />
            <span className="text-[10.5px] text-slate-400">
              Simultaneous LLM test case invocations in ephemeral sandbox.
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-800">
              Execution Timeout Ceiling:{" "}
              <span className="font-mono text-indigo-600">{timeoutMinutes} minutes</span>
            </label>
            <input
              type="range"
              min={5}
              max={60}
              step={5}
              value={timeoutMinutes}
              onChange={(e) => setTimeoutMinutes(Number(e.target.value))}
              disabled={startMutation.isPending}
              className="w-full accent-indigo-600"
            />
            <span className="text-[10.5px] text-slate-400">
              Maximum execution duration before circuit-breaker interruption.
            </span>
          </div>
        </CardContent>
      </Card>

      {formError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
          {formError}
        </div>
      )}

      {/* Trigger Evaluation Action */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Automated release intelligence policy will evaluate upon completion</span>
        </div>

        <Button
          type="submit"
          disabled={startMutation.isPending || !selectedAppId}
          isLoading={startMutation.isPending}
          className="h-10 px-6 text-xs font-bold gap-2 shadow-xs"
        >
          <PlayCircle className="h-4 w-4" />
          <span>Launch Evaluation Sandbox</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

export default EvaluationConfigForm;

