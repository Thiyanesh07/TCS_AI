import { QualityDimensions } from "@/types/evaluation.types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Shield, Target, FileText, CheckCircle2, Lock, Scale, Sparkles, TrendingUp, Cpu } from "lucide-react";
import { cn } from "@/utils/cn";

interface QualityDimensionBarProps {
  dimensions: QualityDimensions;
}

export function QualityDimensionBar({ dimensions }: QualityDimensionBarProps) {
  const dimensionList = [
    {
      key: "accuracy",
      name: "1. Accuracy & Factuality",
      score: dimensions.accuracy,
      icon: Target,
      desc: "Exactness of analytical calculations and domain correctness.",
    },
    {
      key: "grounding",
      name: "2. Grounding & Citations",
      score: dimensions.grounding,
      icon: FileText,
      desc: "Faithfulness of assertions to source vector chunks without extrapolation.",
    },
    {
      key: "completeness",
      name: "3. Completeness",
      score: dimensions.completeness,
      icon: CheckCircle2,
      desc: "Full coverage of all required clauses, parameters, and entities.",
    },
    {
      key: "safety",
      name: "4. Output Safety & Harm",
      score: dimensions.safety,
      icon: Shield,
      desc: "Zero tolerance for toxic, dangerous, or unauthorized instructions.",
    },
    {
      key: "security",
      name: "5. Security & Injection Resistance",
      score: dimensions.security,
      icon: Lock,
      desc: "Resilience against adversarial prompt injection, jailbreaks, and leaks.",
    },
    {
      key: "consistency",
      name: "6. Semantic Consistency",
      score: dimensions.consistency,
      icon: Sparkles,
      desc: "Deterministic variance bounds across repeated multi-turn inferences.",
    },
    {
      key: "bias",
      name: "7. Demographic Fairness & Bias",
      score: dimensions.bias,
      icon: Scale,
      desc: "Neutrality across demographic attributes and protected classes.",
    },
    {
      key: "modelDrift",
      name: "8. Model Drift & Stability",
      score: dimensions.modelDrift,
      icon: TrendingUp,
      desc: "Stability differential compared against historical baseline runs.",
    },
    {
      key: "releaseReadiness",
      name: "9. Release Readiness Index",
      score: dimensions.releaseReadiness,
      icon: Cpu,
      desc: "Aggregated release gate composite score weighting critical invariants.",
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600 bg-emerald-500";
    if (score >= 80) return "text-indigo-600 bg-indigo-600";
    if (score >= 70) return "text-amber-600 bg-amber-500";
    return "text-red-600 bg-red-500";
  };

  return (
    <Card className="border border-slate-200 bg-white shadow-xs">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-sm font-bold text-slate-900">
          9-Dimension Quality & Safety Evaluation Matrix
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Granular scoring breakdown evaluating model behavior across deterministic safety boundaries and quality pillars.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dimensionList.map((dim) => {
            const Icon = dim.icon;
            const scoreColor = getScoreColor(dim.score);

            return (
              <div
                key={dim.key}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                      <h4 className="text-xs font-bold text-slate-800 truncate">{dim.name}</h4>
                    </div>
                    <span className={cn("text-xs font-mono font-extrabold", scoreColor.split(" ")[0])}>
                      {dim.score}%
                    </span>
                  </div>

                  <p className="text-[10.5px] text-slate-500 mt-1 leading-relaxed">{dim.desc}</p>
                </div>

                {/* Score Bar */}
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={cn("h-1.5 rounded-full transition-all duration-300", scoreColor.split(" ")[1])}
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

export default QualityDimensionBar;

