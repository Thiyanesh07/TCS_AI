import * as React from "react";
import { Link } from "react-router-dom";
import { EvaluationFinding } from "@/types/evaluation.types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, FileCode, AlertOctagon, CheckCircle2, ExternalLink } from "lucide-react";

interface FindingsLedgerProps {
  findings: EvaluationFinding[];
}

export function FindingsLedger({ findings }: FindingsLedgerProps) {
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
    <Card className="border border-slate-200 bg-white shadow-xs">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Surfaced Findings, Anomalies & Evidence Citations
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Detailed breakdown of ground-truth discrepancies, adversarial probes, and remediation guidance.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {findings.length} Findings
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {findings.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold text-slate-800">Zero Findings Detected</p>
            <p className="text-[11px] text-slate-500">
              All outputs matched golden assertion ground truth with zero detected safety violations.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {findings.map((finding) => {
              const isExpanded = expandedId === finding.id;

              return (
                <div
                  key={finding.id}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all shadow-2xs"
                >
                  <div
                    onClick={() => toggleExpand(finding.id)}
                    className="p-4 cursor-pointer hover:bg-slate-50/70 transition-colors flex items-start justify-between gap-3 select-none"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {getSeverityBadge(finding.severity)}
                        <Badge variant="outline" className="text-[10px]">
                          {finding.pillar}
                        </Badge>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{finding.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {finding.description}
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
                      {finding.promptExcerpt && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                            <FileCode className="h-3.5 w-3.5 text-indigo-600" />
                            <span>Evaluation Prompt Input:</span>
                          </span>
                          <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                            {finding.promptExcerpt}
                          </pre>
                        </div>
                      )}

                      {finding.responseExcerpt && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-700">
                            Evaluated Model Output:
                          </span>
                          <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-slate-800">
                            {finding.responseExcerpt}
                          </div>
                        </div>
                      )}

                      {finding.groundTruthDiscrepancy && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1 text-red-900">
                          <span className="font-bold flex items-center gap-1 text-[11px]">
                            <AlertOctagon className="h-3.5 w-3.5 text-red-600" />
                            <span>Ground-Truth Invariant Discrepancy:</span>
                          </span>
                          <p className="text-[11px] text-red-700 leading-relaxed">
                            {finding.groundTruthDiscrepancy}
                          </p>
                        </div>
                      )}

                      {finding.remediation && (
                        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1 text-indigo-900">
                          <span className="font-bold text-[11px] block">
                            Recommended Engineering Remediation:
                          </span>
                          <p className="text-[11px] text-indigo-700 leading-relaxed">
                            {finding.remediation}
                          </p>
                        </div>
                      )}

                      <div className="pt-2 flex justify-end">
                        <Link
                          to={`/findings/${finding.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200"
                        >
                          <span>Open Deep Evidence Explorer</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FindingsLedger;

