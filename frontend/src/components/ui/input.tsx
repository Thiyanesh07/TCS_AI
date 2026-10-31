import * as React from "react";
import { cn } from "@/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-lg border bg-white px-3 py-1 text-xs text-slate-900 shadow-xs transition-colors",
          "placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-600",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50",
          error ? "border-red-500 focus-visible:ring-red-500/20 focus-visible:border-red-500" : "border-slate-200",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

