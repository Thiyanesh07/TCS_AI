import { RegressionItem } from "@/types/application.types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

interface RegressionTabProps {
  regressions?: RegressionItem[];
}

export function RegressionTab({ regressions = [] }: RegressionTabProps) {
  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Regression Testing & Golden Invariant Tracking
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Continuous verification against previously resolved defects and historical hallucination benchmarks.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {regressions.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">No regression packs synthesized yet</p>
              <p className="text-[11px] text-slate-500">
                Regression benchmarks are generated automatically when defects are marked mitigated in evaluation runs.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Regression Test</th>
                    <th className="px-4 py-2.5">Source Finding</th>
                    <th className="px-4 py-2.5">Baseline Score</th>
                    <th className="px-4 py-2.5">Current Score</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Last Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {regressions.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {reg.testName}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                        {reg.sourceFindingId}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">
                        {reg.baselineScore}%
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {reg.currentScore}%
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={reg.status === "PASSING" ? "success" : "destructive"}
                          className="gap-1 text-[10.5px]"
                        >
                          {reg.status === "PASSING" ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          <span>{reg.status}</span>
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-[11px]">
                        {new Date(reg.lastChecked).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default RegressionTab;

