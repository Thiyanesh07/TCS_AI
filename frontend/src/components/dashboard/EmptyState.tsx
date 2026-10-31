import React from "react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
  isPendingContract?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  className,
  isPendingContract = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center flex flex-col items-center justify-center space-y-3",
        className
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 shadow-xs">
        <Icon className="h-5 w-5 text-slate-600" />
      </div>

      <div className="max-w-sm space-y-1">
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>

      {isPendingContract && (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60">
          Contract Status: PENDING_BACKEND_CONFIRMATION
        </span>
      )}

      {actionText && onAction && (
        <Button variant="outline" size="sm" onClick={onAction} className="mt-2 text-xs">
          {actionText}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;

