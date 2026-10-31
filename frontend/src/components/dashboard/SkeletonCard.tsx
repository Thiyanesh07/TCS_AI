import { cn } from "@/utils/cn";

export interface SkeletonCardProps {
  className?: string;
  rows?: number;
}

export function SkeletonCard({ className, rows = 3 }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 animate-pulse",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 bg-slate-200 rounded" />
        <div className="h-8 w-8 bg-slate-100 rounded-lg" />
      </div>

      <div className="h-8 w-36 bg-slate-200 rounded" />

      <div className="space-y-2 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-100 rounded w-full" />
        ))}
      </div>
    </div>
  );
}

export default SkeletonCard;

