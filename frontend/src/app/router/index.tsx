import * as React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/app/layouts/DashboardLayout";
import { RoleGuard } from "./RoleGuard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cpu, History, FileCheck2, Settings, Building2, Loader2 } from "lucide-react";

/**
 * Route-Based Code Splitting via React.lazy
 * Eliminates bundle bloat and distributes modular chunks for fast execution.
 */
const LoginPage = React.lazy(() =>
  import("@/pages/auth/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const DashboardPage = React.lazy(() =>
  import("@/pages/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
const ApplicationOnboardingPage = React.lazy(() =>
  import("@/pages/applications/ApplicationOnboardingPage").then((m) => ({
    default: m.ApplicationOnboardingPage,
  }))
);
const ApplicationsListPage = React.lazy(() =>
  import("@/pages/applications/ApplicationsListPage").then((m) => ({
    default: m.ApplicationsListPage,
  }))
);
const ApplicationDetailsWorkspace = React.lazy(() =>
  import("@/pages/applications/ApplicationDetailsWorkspace").then((m) => ({
    default: m.ApplicationDetailsWorkspace,
  }))
);
const StartEvaluationPage = React.lazy(() =>
  import("@/pages/evaluations/StartEvaluationPage").then((m) => ({
    default: m.StartEvaluationPage,
  }))
);
const EvaluationProgressPage = React.lazy(() =>
  import("@/pages/evaluations/EvaluationProgressPage").then((m) => ({
    default: m.EvaluationProgressPage,
  }))
);
const EvaluationResultsPage = React.lazy(() =>
  import("@/pages/evaluations/EvaluationResultsPage").then((m) => ({
    default: m.EvaluationResultsPage,
  }))
);
const EvaluationHistoryPage = React.lazy(() =>
  import("@/pages/evaluations/EvaluationHistoryPage").then((m) => ({
    default: m.EvaluationHistoryPage,
  }))
);
const FindingsPage = React.lazy(() =>
  import("@/pages/findings/FindingsPage").then((m) => ({ default: m.FindingsPage }))
);
const FindingDetailPage = React.lazy(() =>
  import("@/pages/findings/FindingDetailPage").then((m) => ({ default: m.FindingDetailPage }))
);
const QualityReportPage = React.lazy(() =>
  import("@/pages/reports/QualityReportPage").then((m) => ({ default: m.QualityReportPage }))
);
const ReleaseReviewsPage = React.lazy(() =>
  import("@/pages/release/ReleaseReviewsPage").then((m) => ({ default: m.ReleaseReviewsPage }))
);
const ReleaseReviewDetailPage = React.lazy(() =>
  import("@/pages/release/ReleaseReviewDetailPage").then((m) => ({
    default: m.ReleaseReviewDetailPage,
  }))
);
const RegressionPage = React.lazy(() =>
  import("@/pages/regression/RegressionPage").then((m) => ({ default: m.RegressionPage }))
);

/**
 * Lightweight Loading Fallback for Suspense Boundaries
 */
function RouteSuspenseFallback() {
  return (
    <div className="flex h-[320px] w-full flex-col items-center justify-center space-y-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-2xs">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
      <span className="text-xs font-semibold text-slate-500">Loading workspace module...</span>
    </div>
  );
}

function withSuspense(component: React.ReactNode) {
  return <React.Suspense fallback={<RouteSuspenseFallback />}>{component}</React.Suspense>;
}

/**
 * Foundation Page Placeholder Helper
 */
function RouteFoundationShell({
  title,
  description,
  badgeText,
  icon: Icon,
}: {
  title: string;
  description: string;
  badgeText: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
        <Badge variant="default">{badgeText}</Badge>
      </div>

      <Card className="border-dashed border-2 border-slate-200 bg-white/60">
        <CardHeader className="text-center py-12">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-2">
            <Icon className="h-6 w-6" />
          </div>
          <CardTitle className="text-base text-slate-800">{title} Module</CardTitle>
          <CardDescription className="max-w-md mx-auto text-xs text-slate-500">
            Navigation shell operational. Domain data and interactive views will be implemented in subsequent phases.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pb-8">
          <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded">
            Contract Status: PENDING_BACKEND_CONFIRMATION
          </span>
        </CardContent>
      </Card>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: withSuspense(<LoginPage />),
  },
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: withSuspense(<DashboardPage />),
      },
      {
        path: "applications/new",
        element: withSuspense(<ApplicationOnboardingPage />),
      },
      {
        path: "applications/register",
        element: <Navigate to="/applications/new" replace />,
      },
      {
        path: "applications",
        element: withSuspense(<ApplicationsListPage />),
      },
      {
        path: "applications/:applicationId",
        element: withSuspense(<ApplicationDetailsWorkspace />),
      },
      {
        path: "evaluations/new",
        element: withSuspense(<StartEvaluationPage />),
      },
      {
        path: "evaluations/:runId",
        element: withSuspense(<EvaluationProgressPage />),
      },
      {
        path: "evaluations/:runId/results",
        element: withSuspense(<EvaluationResultsPage />),
      },
      {
        path: "history",
        element: withSuspense(<EvaluationHistoryPage />),
      },
      {
        path: "findings",
        element: withSuspense(<FindingsPage />),
      },
      {
        path: "findings/:id",
        element: withSuspense(<FindingDetailPage />),
      },
      {
        path: "reports/:runId",
        element: withSuspense(<QualityReportPage />),
      },
      {
        path: "release-reviews",
        element: withSuspense(<ReleaseReviewsPage />),
      },
      {
        path: "release-reviews/:id",
        element: withSuspense(<ReleaseReviewDetailPage />),
      },
      {
        path: "regression",
        element: withSuspense(<RegressionPage />),
      },
      {
        path: "my-tests",
        element: (
          <RouteFoundationShell
            title="Curated Test Suites & Golden Sets"
            description="Curated assertion suites, ground-truth evaluations, and regression test packs."
            badgeText="Testing Packs"
            icon={FileCheck2}
          />
        ),
      },
      {
        path: "settings",
        element: (
          <RouteFoundationShell
            title="Workspace & Quality Governance Settings"
            description="Configure organization parameters, integration tokens, and threshold bounds."
            badgeText="Configuration"
            icon={Settings}
          />
        ),
      },
      // Platform Admin Protected Routes
      {
        path: "admin",
        element: <RoleGuard allowedRoles={["PLATFORM_ADMIN"]} currentRole="PLATFORM_ADMIN" />,
        children: [
          {
            path: "organisations",
            element: (
              <RouteFoundationShell
                title="Platform Tenant Governance"
                description="Manage enterprise customer organizations, tier quotas, and platform policies."
                badgeText="Platform Admin Only"
                icon={Building2}
              />
            ),
          },
          {
            path: "applications",
            element: (
              <RouteFoundationShell
                title="Global Application Telemetry"
                description="Cross-tenant overview of all registered AI workloads and platform consumption."
                badgeText="Platform Admin Only"
                icon={Cpu}
              />
            ),
          },
          {
            path: "history",
            element: (
              <RouteFoundationShell
                title="Global Platform Audit Records"
                description="Platform-wide evaluation logs, system execution anomalies, and security events."
                badgeText="Platform Admin Only"
                icon={History}
              />
            ),
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);

export default router;
