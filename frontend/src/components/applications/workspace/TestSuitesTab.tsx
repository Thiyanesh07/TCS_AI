import { TestSuiteItem, RegisteredApplication } from "@/types/application.types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCheck2, Play, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TestSuitesTabProps {
  app: RegisteredApplication;
  testSuites?: TestSuiteItem[];
}

export function TestSuitesTab({ app, testSuites = [] }: TestSuitesTabProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Curated Evaluation Test Suites & Golden Sets
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Ground-truth evaluation packs, adversarial red-team batteries, and domain-specific assertion sets.
              </CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => navigate(`/evaluations/new?appId=${app.id}`)}
              className="gap-1.5 text-xs font-semibold self-start sm:self-auto"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Run All Suites</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="divide-y divide-slate-100">
            {testSuites.map((suite) => (
              <div key={suite.id} className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mt-0.5">
                    <FileCheck2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{suite.name}</h4>
                      <Badge variant="outline" className="text-[10px]">
                        {suite.category}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span>
                        Test Cases: <strong className="text-slate-700">{suite.testCount}</strong>
                      </span>
                      <span>•</span>
                      {suite.passRate !== undefined && (
                        <>
                          <span className="flex items-center gap-1 font-semibold text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" />
                            Pass Rate: {suite.passRate}%
                          </span>
                          <span>•</span>
                        </>
                      )}
                      <span>Last Run: {suite.lastRun ? new Date(suite.lastRun).toLocaleDateString() : "Never"}</span>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/evaluations/new?appId=${app.id}&suite=${suite.id}`)}
                  className="rounded-xl text-xs gap-1.5 self-start sm:self-auto"
                >
                  <Play className="h-3 w-3 text-slate-500" />
                  <span>Execute Suite</span>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TestSuitesTab;

