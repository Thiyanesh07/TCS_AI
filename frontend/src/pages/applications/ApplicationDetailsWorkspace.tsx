import * as React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  PlayCircle,
  FileArchive,
  Globe,
  Layers,
  Cpu,
  AlertOctagon,
  FileCheck2,
  History,
  FileCode,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useApplication } from "@/hooks/useApplications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import { EmptyState } from "@/components/dashboard/EmptyState";

import { OverviewTab } from "@/components/applications/workspace/OverviewTab";
import { DiscoveryTab } from "@/components/applications/workspace/DiscoveryTab";
import { RisksTab } from "@/components/applications/workspace/RisksTab";
import { TestSuitesTab } from "@/components/applications/workspace/TestSuitesTab";
import { EvaluationRunsTab } from "@/components/applications/workspace/EvaluationRunsTab";
import { FindingsTab } from "@/components/applications/workspace/FindingsTab";
import { RegressionTab } from "@/components/applications/workspace/RegressionTab";
import { ReleaseReviewsTab } from "@/components/applications/workspace/ReleaseReviewsTab";

import {
  MOCK_RISKS,
  MOCK_TEST_SUITES,
  MOCK_EVAL_RUNS,
  MOCK_FINDINGS,
  MOCK_REGRESSIONS,
  MOCK_RELEASE_REVIEWS,
} from "@/mocks/application.mock";

export function ApplicationDetailsWorkspace() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [activeTab, setActiveTab] = React.useState<string>("overview");
  const navigate = useNavigate();

  const { data: app, isLoading, isError } = useApplication(applicationId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <SkeletonCard />
      </div>
    );
  }

  if (isError || !app) {
    return (
      <EmptyState
        icon={Cpu}
        title="Application Not Found"
        description={`The requested application ID "${applicationId}" was not found in the platform registry.`}
        actionText="Back to Applications"
        onAction={() => navigate("/applications")}
      />
    );
  }

  return (
    <div className="space-y-6">
      {app.dataSource === "DEVELOPMENT_MOCK_ONLY" && (
        <div className="bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl text-xs text-amber-800 font-semibold flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shadow-2xs">
          <span>
            ⚠️ DEVELOPMENT_MOCK_ONLY: This workload workspace displays local development fixtures.
          </span>
          <span className="font-mono text-[10px] bg-amber-100 px-2 py-0.5 rounded text-amber-900 self-start sm:self-auto">
            Contract Status: PENDING_BACKEND_CONFIRMATION
          </span>
        </div>
      )}

      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/applications"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Applications Catalog</span>
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{app.name}</h1>
            <Badge
              variant={app.status === "ACTIVE" ? "success" : "neutral"}
              className="text-[11px]"
            >
              {app.status}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <Badge variant="outline" className="text-[10.5px]">
              {app.category}
            </Badge>
            <span className="font-mono text-xs text-slate-400">•</span>
            <span className="font-mono text-xs text-slate-500 font-semibold">{app.version}</span>
            <span className="font-mono text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">{app.environment}</span>
            <span className="font-mono text-xs text-slate-400">•</span>
            <div className="inline-flex items-center gap-1 text-xs text-slate-600">
              {app.method === "ZIP_UPLOAD" ? (
                <>
                  <FileArchive className="h-3.5 w-3.5 text-indigo-600" />
                  <span>ZIP Package</span>
                </>
              ) : (
                <>
                  <Globe className="h-3.5 w-3.5 text-emerald-600" />
                  <span>REST API Endpoint</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            type="button"
            size="sm"
            onClick={() => navigate(`/evaluations/new?appId=${app.id}`)}
            className="rounded-xl text-xs font-bold gap-2 shadow-xs"
          >
            <PlayCircle className="h-4 w-4" />
            <span>Run New Evaluation</span>
          </Button>
        </div>
      </div>

      {/* 8-Tab Workspace Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b border-slate-200 overflow-x-auto pb-1">
          <TabsList className="bg-slate-100/80 p-1 h-11 w-max">
            <TabsTrigger value="overview" className="h-9 gap-1.5 text-xs font-bold">
              <Layers className="h-3.5 w-3.5" />
              <span>1. Overview</span>
            </TabsTrigger>
            <TabsTrigger value="discovery" className="h-9 gap-1.5 text-xs font-bold">
              <Cpu className="h-3.5 w-3.5" />
              <span>2. Discovery</span>
            </TabsTrigger>
            <TabsTrigger value="risks" className="h-9 gap-1.5 text-xs font-bold">
              <AlertOctagon className="h-3.5 w-3.5" />
              <span>3. Risks ({MOCK_RISKS.length})</span>
            </TabsTrigger>
            <TabsTrigger value="test-suites" className="h-9 gap-1.5 text-xs font-bold">
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>4. Test Suites ({MOCK_TEST_SUITES.length})</span>
            </TabsTrigger>
            <TabsTrigger value="evaluations" className="h-9 gap-1.5 text-xs font-bold">
              <History className="h-3.5 w-3.5" />
              <span>5. Evaluation Runs ({MOCK_EVAL_RUNS.length})</span>
            </TabsTrigger>
            <TabsTrigger value="findings" className="h-9 gap-1.5 text-xs font-bold">
              <FileCode className="h-3.5 w-3.5" />
              <span>6. Findings & Evidence ({MOCK_FINDINGS.length})</span>
            </TabsTrigger>
            <TabsTrigger value="regression" className="h-9 gap-1.5 text-xs font-bold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>7. Regression ({MOCK_REGRESSIONS.length})</span>
            </TabsTrigger>
            <TabsTrigger value="release-reviews" className="h-9 gap-1.5 text-xs font-bold">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>8. Release Reviews ({MOCK_RELEASE_REVIEWS.length})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="pt-4">
          <TabsContent value="overview">
            <OverviewTab
              app={app}
              risks={MOCK_RISKS}
              testSuites={MOCK_TEST_SUITES}
              evalRuns={MOCK_EVAL_RUNS}
            />
          </TabsContent>

          <TabsContent value="discovery">
            <DiscoveryTab app={app} />
          </TabsContent>

          <TabsContent value="risks">
            <RisksTab risks={MOCK_RISKS} />
          </TabsContent>

          <TabsContent value="test-suites">
            <TestSuitesTab app={app} testSuites={MOCK_TEST_SUITES} />
          </TabsContent>

          <TabsContent value="evaluations">
            <EvaluationRunsTab app={app} evalRuns={MOCK_EVAL_RUNS} />
          </TabsContent>

          <TabsContent value="findings">
            <FindingsTab findings={MOCK_FINDINGS} />
          </TabsContent>

          <TabsContent value="regression">
            <RegressionTab regressions={MOCK_REGRESSIONS} />
          </TabsContent>

          <TabsContent value="release-reviews">
            <ReleaseReviewsTab reviews={MOCK_RELEASE_REVIEWS} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export default ApplicationDetailsWorkspace;
