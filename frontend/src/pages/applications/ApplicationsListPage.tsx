import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PlusCircle,
  Search,
  FileArchive,
  Globe,
  Layers,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { useApplications } from "@/hooks/useApplications";
import {
  ApplicationCategory,
  ApplicationRegistrationMethod,
  ApplicationEnvironment,
  ApplicationStatus,
} from "@/types/application.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import { EmptyState } from "@/components/dashboard/EmptyState";

export function ApplicationsListPage() {
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<ApplicationCategory | "ALL">("ALL");
  const [method, setMethod] = React.useState<ApplicationRegistrationMethod | "ALL">("ALL");
  const [environment, setEnvironment] = React.useState<ApplicationEnvironment | "ALL">("ALL");
  const [status, setStatus] = React.useState<ApplicationStatus | "ALL">("ALL");

  const navigate = useNavigate();

  const { data: applications = [], isLoading, isError } = useApplications({
    search: search.trim() || undefined,
    category,
    method,
    environment,
    status,
  });

  const totalApps = applications.length;
  const activeApps = applications.filter((a) => a.status === "ACTIVE").length;
  const releaseApproved = applications.filter((a) => a.latestRecommendation === "RELEASE").length;
  const pendingEvals = applications.filter((a) => a.evaluationsCount === 0).length;

  const getRecommendationBadge = (rec?: string) => {
    switch (rec) {
      case "RELEASE":
        return (
          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            RELEASE
          </span>
        );
      case "CONDITIONAL_RELEASE":
        return (
          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <AlertTriangle className="h-3 w-3" />
            CONDITIONAL
          </span>
        );
      case "REJECT":
        return (
          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
            <XCircle className="h-3 w-3" />
            REJECT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-[10.5px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            PENDING
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Applications</h1>
            <Badge variant="default" className="text-[11px]">
              {totalApps} Registered
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage registered AI applications, inspect their configurations and monitor evaluation readiness.
          </p>
        </div>

        <Link
          to="/applications/new"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-4 py-2 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Register Application</span>
        </Link>
      </div>

      {applications.some((a) => a.dataSource === "DEVELOPMENT_MOCK_ONLY") && (
        <div className="bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl text-xs text-amber-800 font-semibold flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shadow-2xs">
          <span>
            ⚠️ DEVELOPMENT_MOCK_ONLY: Application directory currently rendered from development fixtures.
          </span>
          <span className="font-mono text-[10px] bg-amber-100 px-2 py-0.5 rounded text-amber-900 self-start sm:self-auto">
            Contract Status: PENDING_BACKEND_CONFIRMATION
          </span>
        </div>
      )}

      {/* KPI Summary Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border border-slate-200 bg-white p-4">
          <span className="text-[11px] font-medium text-slate-500 block">Total Workloads</span>
          <div className="mt-1 text-2xl font-bold text-slate-900">{totalApps}</div>
          <span className="text-[10.5px] text-slate-400">Connected to engine</span>
        </Card>

        <Card className="border border-slate-200 bg-white p-4">
          <span className="text-[11px] font-medium text-slate-500 block">Active Status</span>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{activeApps}</div>
          <span className="text-[10.5px] text-slate-400">Ready for evaluation</span>
        </Card>

        <Card className="border border-slate-200 bg-white p-4">
          <span className="text-[11px] font-medium text-slate-500 block">Release Approved</span>
          <div className="mt-1 text-2xl font-bold text-indigo-600">{releaseApproved}</div>
          <span className="text-[10.5px] text-slate-400">Passed release gates</span>
        </Card>

        <Card className="border border-slate-200 bg-white p-4">
          <span className="text-[11px] font-medium text-slate-500 block">Awaiting First Benchmark</span>
          <div className="mt-1 text-2xl font-bold text-amber-600">{pendingEvals}</div>
          <span className="text-[10.5px] text-slate-400">No runs executed</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search applications by name, ID, or keywords..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ApplicationCategory | "ALL")}
              className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Categories</option>
              <option value="RAG">RAG</option>
              <option value="AGENT">Agent</option>
              <option value="CHATBOT">Chatbot</option>
              <option value="WORKFLOW">Workflow</option>
              <option value="CLASSIFIER">Classifier</option>
            </select>

            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as ApplicationRegistrationMethod | "ALL")}
              className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Ingestion Methods</option>
              <option value="ZIP_UPLOAD">ZIP Archive</option>
              <option value="API_CONNECT">REST API</option>
            </select>

            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as ApplicationEnvironment | "ALL")}
              className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Environments</option>
              <option value="PRODUCTION">Production</option>
              <option value="STAGING">Staging</option>
              <option value="DEVELOPMENT">Development</option>
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ApplicationStatus | "ALL")}
              className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="EVALUATING">Evaluating</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Applications Data Table */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Failed to Load Applications"
          description="Could not connect to the application registry. Please check your network or try again."
        />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No Applications Found"
          description={
            search || category !== "ALL" || method !== "ALL"
              ? "No applications matched your active search filters. Try clearing your filters."
              : "You haven't registered any AI applications yet. Get started by onboarding your first workload."
          }
          actionText="Register Application"
          onAction={() => navigate("/applications/new")}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Application & Category</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Version & Env</th>
                  <th className="px-4 py-3">Quality Score</th>
                  <th className="px-4 py-3">Release Gate</th>
                  <th className="px-4 py-3">Evaluations</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name & Category */}
                    <td className="px-5 py-3.5 min-w-[220px]">
                      <div className="space-y-1">
                        <Link
                          to={`/applications/${app.id}`}
                          className="font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1 text-xs"
                        >
                          {app.name}
                        </Link>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[9.5px] px-1.5 py-0">
                            {app.category}
                          </Badge>
                          <span className="font-mono text-[10.5px] text-slate-400">
                            {app.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Method */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        {app.method === "ZIP_UPLOAD" ? (
                          <>
                            <FileArchive className="h-3.5 w-3.5 text-indigo-600" />
                            <span>ZIP Archive</span>
                          </>
                        ) : (
                          <>
                            <Globe className="h-3.5 w-3.5 text-emerald-600" />
                            <span>REST API</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Version & Environment */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-slate-800 text-[11px] block">
                          {app.version}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {app.environment}
                        </span>
                      </div>
                    </td>

                    {/* Score */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {app.latestScore ? (
                        <div className="flex items-baseline gap-1">
                          <span className="font-bold text-slate-900 text-sm">{app.latestScore}</span>
                          <span className="text-[10px] text-slate-400">/100</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Recommendation */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getRecommendationBadge(app.latestRecommendation)}
                    </td>

                    {/* Evaluations Count */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-700 font-semibold">
                      {app.evaluationsCount} runs
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge
                        variant={app.status === "ACTIVE" ? "success" : "neutral"}
                        className="text-[10px]"
                      >
                        {app.status}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/applications/${app.id}`)}
                          className="h-7 px-2.5 text-xs font-semibold gap-1 text-slate-700"
                        >
                          <Layers className="h-3 w-3" />
                          <span>Workspace</span>
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          onClick={() => navigate(`/evaluations/new?appId=${app.id}`)}
                          className="h-7 px-2.5 text-xs font-bold gap-1"
                        >
                          <PlayCircle className="h-3 w-3" />
                          <span>Evaluate</span>
                        </Button>
                      </div>
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

export default ApplicationsListPage;
