import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EvaluationConfigForm } from "@/components/evaluations/EvaluationConfigForm";

export function StartEvaluationPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="space-y-1">
        <Link
          to="/applications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Applications</span>
        </Link>

        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Start Quality & Safety Evaluation
          </h1>
          <Badge variant="default" className="text-[11px]">
            Benchmark
          </Badge>
        </div>
        <p className="text-xs text-slate-500 max-w-2xl">
          Configure and trigger an automated multi-agent evaluation across the 9 quality dimensions,
          grounding benchmarks, and release readiness gates.
        </p>
      </div>

      {/* Configuration Form */}
      <EvaluationConfigForm />

      {/* Safety Policy Guarantee Notice */}
      <Card className="border border-slate-200/80 bg-slate-50/50">
        <CardContent className="p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 space-y-1">
            <h4 className="font-bold text-slate-900">Deterministic Release Gate Policy</h4>
            <p className="leading-relaxed">
              Upon run completion, the QualiTrust AI Release Intelligence Engine will evaluate 
              the 9-dimension vector. Applications with zero critical blockers and composite scores ≥ 90 
              are automatically approved for production deployment.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default StartEvaluationPage;
