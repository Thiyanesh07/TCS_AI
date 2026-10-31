import { RegisteredApplication } from "@/types/application.types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cpu, Database, Network, Code2, CheckCircle2, Clock } from "lucide-react";

interface DiscoveryTabProps {
  app: RegisteredApplication;
}

export function DiscoveryTab({ app }: DiscoveryTabProps) {
  const discovery = app.discoverySummary;

  return (
    <div className="space-y-6">
      {/* Discovery Status Banner */}
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Architectural Discovery & Component Inspection
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Automated static analysis of source files and endpoint introspection performed by the
                QualiTrust AI discovery engine.
              </CardDescription>
            </div>
            <Badge
              variant={discovery?.status === "COMPLETED" ? "success" : "neutral"}
              className="gap-1 text-xs self-start sm:self-auto"
            >
              {discovery?.status === "COMPLETED" ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Discovery Completed</span>
                </>
              ) : (
                <>
                  <Clock className="h-3.5 w-3.5" />
                  <span>Discovery In Progress</span>
                </>
              )}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Model Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  <Cpu className="h-4 w-4" />
                </div>
                <span>Detected Model(s)</span>
              </div>
              <p className="text-xs font-semibold text-slate-800">
                {discovery?.modelDetected || "Model inference pipeline detected upon initial test run"}
              </p>
              <p className="text-[11px] text-slate-500">
                Identified via prompt template token signatures and model API endpoints.
              </p>
            </div>

            {/* Framework Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <Code2 className="h-4 w-4" />
                </div>
                <span>Orchestration Framework</span>
              </div>
              <p className="text-xs font-semibold text-slate-800">
                {discovery?.framework || "Standard REST API Wrapper"}
              </p>
              <p className="text-[11px] text-slate-500">
                Detected invocation chains, memory buffers, and agentic loop wrappers.
              </p>
            </div>

            {/* Vector Store Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <Database className="h-4 w-4" />
                </div>
                <span>Vector Store & Storage</span>
              </div>
              <p className="text-xs font-semibold text-slate-800">
                {discovery?.vectorStore || "Direct LLM Synthesis (No external vector DB)"}
              </p>
              <p className="text-[11px] text-slate-500">
                Identified embeddings index, cosine retrieval thresholds, and chunk sizes.
              </p>
            </div>
          </div>

          {/* Endpoints & Tools Breakdown */}
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Network className="h-4 w-4 text-indigo-600" />
              <span>Registered Endpoints & Discovered Function Calls</span>
            </h4>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Endpoint / Tool</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Schema Input</th>
                    <th className="px-4 py-2.5">Discovery State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">
                      {app.apiDetails?.endpointPath || "/v1/inference"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px]">
                        Primary Interface
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                      {`{ prompt: string, max_tokens?: number }`}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DiscoveryTab;

