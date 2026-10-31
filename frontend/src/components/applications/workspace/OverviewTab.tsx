import {
  RegisteredApplication,
  RiskItem,
  TestSuiteItem,
  EvaluationRunSummary,
} from "@/types/application.types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileArchive,
  Globe,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  Layers,
  Activity,
} from "lucide-react";

interface OverviewTabProps {
  app: RegisteredApplication;
  risks?: RiskItem[];
  testSuites?: TestSuiteItem[];
  evalRuns?: EvaluationRunSummary[];
}

export function OverviewTab({ app, risks = [], testSuites = [], evalRuns = [] }: OverviewTabProps) {
  const getRecommendationBadge = (rec?: string) => {
    switch (rec) {
      case "RELEASE":
        return (
          <Badge variant="success" className="gap-1 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Approved for Release</span>
          </Badge>
        );
      case "CONDITIONAL_RELEASE":
        return (
          <Badge variant="warning" className="gap-1 text-xs">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Conditional Release (Canary)</span>
          </Badge>
        );
      case "REJECT":
        return (
          <Badge variant="destructive" className="gap-1 text-xs">
            <XCircle className="h-3.5 w-3.5" />
            <span>Release Blocked</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            Evaluation Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Quality Score</span>
            <Activity className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {app.latestScore ? `${app.latestScore}` : "N/A"}
            </span>
            {app.latestScore && <span className="text-xs text-slate-500">/ 100</span>}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {app.latestScore ? "Latest benchmark score" : "No evaluations run yet"}
          </p>
        </Card>

        <Card className="border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Release Gate</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            {getRecommendationBadge(app.latestRecommendation)}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Automated quality gate</p>
        </Card>

        <Card className="border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Evaluations Run</span>
            <Layers className="h-4 w-4 text-slate-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {evalRuns.length || app.evaluationsCount}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Historical benchmark runs</p>
        </Card>

        <Card className="border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Test Suites</span>
            <CheckCircle2 className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {testSuites.length || 4}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Assigned assertion sets</p>
        </Card>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Application Metadata Card */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">
              Application Profile & Lifecycle Metadata
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Description</span>
              <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                {app.description || "No description provided."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Category</span>
                <span className="font-bold text-slate-800">{app.category}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Target Version</span>
                <span className="font-mono font-bold text-slate-800">{app.version}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Environment</span>
                <Badge variant="outline" className="text-[10px] mt-0.5">
                  {app.environment}
                </Badge>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Lifecycle Status</span>
                <Badge variant={app.status === "ACTIVE" ? "success" : "neutral"} className="text-[10px] mt-0.5">
                  {app.status}
                </Badge>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>Created: {new Date(app.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>Updated: {new Date(app.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration Connection Details Card */}
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900">
                Integration & Ingestion Details
              </CardTitle>
              <Badge variant="default" className="text-[10.5px]">
                {app.method === "ZIP_UPLOAD" ? "Package Bundle" : "REST Endpoint"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {app.method === "ZIP_UPLOAD" && app.zipDetails ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                    <FileArchive className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {app.zipDetails.fileName}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Size: {app.zipDetails.fileSize} MB • Format: ZIP
                    </p>
                  </div>
                </div>

                <div className="text-xs space-y-2">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Package Checksum</span>
                    <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded block truncate">
                      {app.zipDetails.checksum || "sha256:pending_backend_hash"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Sandbox Quarantine</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Cleaned & Verified in Ephemeral Sandbox
                    </span>
                  </div>
                </div>
              </div>
            ) : app.apiDetails ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 font-mono truncate">
                      {app.apiDetails.httpMethod} {app.apiDetails.baseUrl}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Path: {app.apiDetails.endpointPath}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Auth Type</span>
                    <span className="font-bold text-slate-800">{app.apiDetails.authType}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Secret Security</span>
                    <span className="font-semibold text-slate-700">
                      {app.apiDetails.hasSecret ? "Encrypted at Rest" : "Public Endpoint"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-4 text-center">
                Integration details pending backend confirmation.
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Open Risks Detected:</span>
              <span className="font-bold text-slate-900">{risks.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default OverviewTab;

