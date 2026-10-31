import * as React from "react";
import { cn } from "@/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "outline" | "neutral";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    warning: "bg-amber-50 text-amber-700 border-amber-200/60",
    destructive: "bg-red-50 text-red-700 border-red-200/60",
    outline: "bg-white text-slate-700 border-slate-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200/60",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border select-none tracking-tight",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

