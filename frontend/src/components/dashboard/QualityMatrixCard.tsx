import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, ShieldCheck, Info } from "lucide-react";

export interface QualityDimensionItem {
  id: string;
  name: string;
  score: number; // 0 - 100
  status: "PASS" | "WARN" | "FAIL";
  benchmark: string;
}

const DEFAULT_DIMENSIONS: QualityDimensionItem[] = [
  { id: "acc", name: "Accuracy", score: 96, status: "PASS", benchmark: "> 90% benchmark" },
  { id: "grd", name: "Grounding", score: 94, status: "PASS", benchmark: "Source fidelity" },
  { id: "cmp", name: "Completeness", score: 91, status: "PASS", benchmark: "Coverage metric" },
  { id: "sft", name: "Safety", score: 98, status: "PASS", benchmark: "Content safety" },
  { id: "sec", name: "Security", score: 99, status: "PASS", benchmark: "Prompt injection defense" },
  { id: "cns", name: "Consistency", score: 88, status: "WARN", benchmark: "Variance test" },
  { id: "bia", name: "Bias", score: 95, status: "PASS", benchmark: "Parity metric" },
  { id: "drf", name: "Model Drift", score: 92, status: "PASS", benchmark: "Baseline delta < 5%" },
  { id: "red", name: "Release Readiness", score: 94, status: "PASS", benchmark: "Composite score" },
];

export interface QualityMatrixCardProps {
  dimensions?: QualityDimensionItem[];
  isPendingContract?: boolean;
}

export function QualityMatrixCard({
  dimensions = DEFAULT_DIMENSIONS,
  isPendingContract = true,
}: QualityMatrixCardProps) {
  return (
    <Card className="border-slate-200 shadow-xs">
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-indigo-600" />
            <CardTitle className="text-base font-semibold text-slate-900">
              9-Dimension AI Quality Matrix
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500 mt-1">
            Standardized evaluation vectors governing enterprise AI application reliability
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isPendingContract && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 text-[11px] text-amber-800 border border-amber-200/60">
            <Info className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span>Dimension scoring schema pending backend OpenAPI sign-off.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {dimensions.map((dim) => {
            const isPass = dim.status === "PASS";
            const isWarn = dim.status === "WARN";

            return (
              <div
                key={dim.id}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">{dim.name}</span>
                  {isPass && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                  {isWarn && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                  {!isPass && !isWarn && <span className="h-2 w-2 rounded-full bg-red-500" />}
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold text-slate-900 tracking-tight">
                    {dim.score}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{dim.benchmark}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isPass ? "bg-emerald-500" : isWarn ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${dim.score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default QualityMatrixCard;

