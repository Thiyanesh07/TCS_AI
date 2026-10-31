import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileArchive,
  Globe,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRight,
  PlusCircle,
  PlayCircle,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ZipUploadZone } from "@/components/applications/ZipUploadZone";
import { ApiRegistrationForm } from "@/components/applications/ApiRegistrationForm";
import { RegisteredApplication } from "@/types/application.types";

export function ApplicationOnboardingPage() {
  const [activeTab, setActiveTab] = React.useState<string>("zip");
  const [registeredApp, setRegisteredApp] = React.useState<RegisteredApplication | null>(null);
  const navigate = useNavigate();

  const handleRegistrationSuccess = (app: RegisteredApplication) => {
    setRegisteredApp(app);
  };

  const handleResetForm = () => {
    setRegisteredApp(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Register AI Application
            </h1>
            <Badge variant="default" className="text-[11px]">
              Onboarding
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Connect your AI-powered application to QualiTrust AI for automated quality, safety and
            release readiness evaluation across the 9 evaluation pillars.
          </p>
        </div>

        <Link
          to="/applications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Cpu className="h-3.5 w-3.5 text-slate-500" />
          <span>View All Applications</span>
        </Link>
      </div>

      {registeredApp ? (
        /* Post-Registration Confirmation Card */
        <Card className="border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <Badge variant="success" className="text-[10.5px]">
                  Registration Confirmed
                </Badge>
                <CardTitle className="text-lg text-slate-900">{registeredApp.name}</CardTitle>
                <CardDescription className="text-xs text-slate-600">
                  Application successfully registered under ID:{" "}
                  <code className="font-mono font-semibold text-slate-800">{registeredApp.id}</code>
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Method</span>
                <span className="font-bold text-slate-800">
                  {registeredApp.method === "ZIP_UPLOAD" ? "ZIP Archive Package" : "REST API Endpoint"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Category</span>
                <span className="font-bold text-slate-800">{registeredApp.category}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Version</span>
                <span className="font-mono font-bold text-slate-800">{registeredApp.version}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Environment</span>
                <span className="font-bold text-slate-800">{registeredApp.environment}</span>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-bold">Next Recommended Step:</span> Trigger an initial
                quality & safety benchmark evaluation to establish a baseline quality score and
                verify release readiness.
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetForm}
                className="rounded-xl text-xs gap-1.5"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Register Another Application</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/applications/${registeredApp.id}`)}
                  className="rounded-xl text-xs gap-1.5"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Open Application Workspace</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => navigate(`/evaluations/new?appId=${registeredApp.id}`)}
                  className="rounded-xl text-xs gap-1.5 font-bold"
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  <span>Start Immediate Evaluation</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Dual-Method Onboarding Form */
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <CardTitle className="text-base text-slate-900">
                  Select Onboarding Registration Method
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Choose between uploading an offline source bundle or registering a live AI API endpoint.
                </CardDescription>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                <span>Backend Gateway: Ready</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full sm:w-auto grid grid-cols-2 h-11 p-1 bg-slate-100/80">
                <TabsTrigger value="zip" className="h-9 gap-2 text-xs font-bold">
                  <FileArchive className="h-4 w-4" />
                  <span>Method A: Upload ZIP Package</span>
                </TabsTrigger>
                <TabsTrigger value="api" className="h-9 gap-2 text-xs font-bold">
                  <Globe className="h-4 w-4" />
                  <span>Method B: Connect API Endpoint</span>
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="zip">
                  <ZipUploadZone onSuccess={handleRegistrationSuccess} />
                </TabsContent>

                <TabsContent value="api">
                  <ApiRegistrationForm onSuccess={handleRegistrationSuccess} />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* 9 Evaluation Pillars Evaluation Standard Guarantee */}
      <Card className="border border-slate-200/80 bg-slate-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-900">
              QualiTrust AI 9-Pillar Automated Quality & Release Guarantee
            </h4>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-9 gap-2 text-center">
            {[
              "Accuracy",
              "Grounding",
              "Completeness",
              "Safety",
              "Security",
              "Consistency",
              "Bias",
              "Model Drift",
              "Release Gate",
            ].map((pillar) => (
              <div
                key={pillar}
                className="py-1.5 px-1 bg-white rounded-lg border border-slate-200/90 text-[10.5px] font-semibold text-slate-700 shadow-2xs"
              >
                {pillar}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ApplicationOnboardingPage;

