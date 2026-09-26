import { AlertCircle } from "lucide-react";
import { Button } from "./button";

export function ErrorCard({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
  secondaryAction,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  secondaryAction?: React.ReactNode;
}) {
  return (
    <div
      role="alert"
      className="mx-auto w-full max-w-md space-y-4 rounded-2xl border border-red-500/30 bg-slate-950 p-8 text-center shadow-2xl"
    >
      <AlertCircle className="mx-auto h-12 w-12 text-red-400" aria-hidden="true" />
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="text-sm text-slate-400">{message}</p>
      <div className="flex items-center justify-center gap-3 pt-2">
        {onRetry && (
          <Button variant="primary" size="md" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
        {secondaryAction}
      </div>
    </div>
  );
}
