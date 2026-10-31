import React from "react";
import { cn } from "@/utils/cn";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface MetricCardProps {
  title: string;
  value?: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  comparison?: string;
  icon: React.ComponentType<{ className?: string }>;
  isPendingContract?: boolean;
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  comparison = "vs baseline",
  icon: Icon,
  isPendingContract = false,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-700 border border-slate-100">
          <Icon className="h-4 w-4 text-indigo-600" />
        </div>
      </div>

      <div className="mt-3">
        {value !== undefined ? (
          <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
        ) : (
          <div className="text-sm font-medium text-slate-400 italic">Pending backend data</div>
        )}

        {isPendingContract && (
          <div className="mt-1 text-[10px] text-amber-600 font-medium">
            Contract: Pending Confirmation
          </div>
        )}

        {change && !isPendingContract && (
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-semibold text-[11px] px-1.5 py-0.5 rounded",
                changeType === "positive" && "bg-emerald-50 text-emerald-700",
                changeType === "negative" && "bg-red-50 text-red-700",
                changeType === "neutral" && "bg-slate-100 text-slate-700"
              )}
            >
              {changeType === "positive" && <TrendingUp className="h-3 w-3" />}
              {changeType === "negative" && <TrendingDown className="h-3 w-3" />}
              {changeType === "neutral" && <Minus className="h-3 w-3" />}
              <span>{change}</span>
            </span>
            <span className="text-[11px] text-slate-400">{comparison}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default MetricCard;

