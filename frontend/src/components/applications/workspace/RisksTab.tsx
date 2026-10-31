import * as React from "react";
import { RiskItem } from "@/types/application.types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/utils/cn";

interface RisksTabProps {
  risks?: RiskItem[];
}

export function RisksTab({ risks = [] }: RisksTabProps) {
  const [severityFilter, setSeverityFilter] = React.useState<string>("ALL");

  const filteredRisks = risks.filter((r) => {
    if (severityFilter === "ALL") return true;
    return r.severity === severityFilter;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-red-100 text-red-700 border border-red-200">
            CRITICAL
          </span>
        );
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            HIGH
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            LOW
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Application Vulnerability & Risk Ledger
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Identified safety exploits, grounding anomalies, and security vectors tracked across evaluation runs.
              </CardDescription>
            </div>

            {/* Severity Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverityFilter(sev)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all",
                    severityFilter === sev
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {filteredRisks.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">No matching risks detected</p>
              <p className="text-[11px] text-slate-500">
                All evaluation checks for the selected filter are within acceptable baseline bounds.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredRisks.map((risk) => (
                <div key={risk.id} className="py-4 first:pt-1 last:pb-1 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(risk.severity)}
                      <Badge variant="outline" className="text-[10px] font-semibold">
                        {risk.category}
                      </Badge>
                      <h4 className="text-xs font-bold text-slate-900">{risk.title}</h4>
                    </div>

                    <Badge
                      variant={risk.status === "MITIGATED" ? "success" : "neutral"}
                      className="text-[10px]"
                    >
                      {risk.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pl-1">
                    {risk.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1 pl-1">
                    <span>
                      Affected Component:{" "}
                      <strong className="text-slate-700">{risk.affectedComponent}</strong>
                    </span>
                    <span>•</span>
                    <span>Detected: {new Date(risk.detectedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default RisksTab;
