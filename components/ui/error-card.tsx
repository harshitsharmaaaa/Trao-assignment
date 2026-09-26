import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Error card component with cyberpunk styling.
 * Displays error message with retry action.
 */
export function ErrorCard({
  title,
  message,
  onRetry,
  secondaryAction,
  className,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
  secondaryAction?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-2xl border border-red-500/30 bg-red-500/5 p-6",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-red-500/10 p-2.5">
          <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white">{title}</h3>
          <p className="mt-1 text-sm text-slate-400">{message}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Retry
          </button>
        )}
        {secondaryAction}
      </div>
    </div>
  );
}
