import * as React from "react";
import { FindingItem } from "@/types/application.types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, FileCode, CheckCircle2 } from "lucide-react";

interface FindingsTabProps {
  findings?: FindingItem[];
}

export function FindingsTab({ findings = [] }: FindingsTabProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-red-100 text-red-700 border border-red-200">
            CRITICAL
          </span>
        );
      case "HIGH":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            HIGH
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            LOW
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Quality Findings & Evaluation Evidence Ledger
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Specific assertions, prompt evaluations, and grounding mismatches surfaced during test runs.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {findings.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">Zero active defects detected</p>
              <p className="text-[11px] text-slate-500">
                All evaluation outputs adhered strictly to grounding invariants and safety rules.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {findings.map((item) => {
                const isExpanded = expandedId === item.id;
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all shadow-2xs"
                  >
                    <div
                      onClick={() => toggleExpand(item.id)}
                      className="p-4 cursor-pointer hover:bg-slate-50/70 transition-colors flex items-start justify-between gap-3 select-none"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {getSeverityBadge(item.severity)}
                          <Badge variant="outline" className="text-[10px]">
                            {item.pillar}
                          </Badge>
                          <span className="font-mono text-[11px] text-slate-400">
                            {item.runId}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 shrink-0 text-slate-400 hover:text-slate-700"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="p-4 bg-slate-50/80 border-t border-slate-100 text-xs space-y-3">
                        {item.promptExcerpt && (
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                              <FileCode className="h-3.5 w-3.5 text-indigo-600" />
                              <span>Evaluation Prompt Excerpt:</span>
                            </span>
                            <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                              {item.promptExcerpt}
                            </pre>
                          </div>
                        )}

                        {item.evidenceSnippet && (
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-slate-700">
                              Target Response / Evidence Output:
                            </span>
                            <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-slate-800">
                              {item.evidenceSnippet}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default FindingsTab;

