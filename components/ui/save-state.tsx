import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type SaveState = "idle" | "saving" | "saved" | "failed";

// Persistence indicator for debounced saves: saving → saved → idle, failed persists until retry.
export function SaveStateIndicator({ state, className }: { state: SaveState; className?: string }) {
  if (state === "idle") return null;
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        state === "saving" && "text-slate-400",
        state === "saved" && "text-emerald-400",
        state === "failed" && "text-red-400",
        className
      )}
    >
      {state === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
      {state === "saved" && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
      {state === "failed" && <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />}
      {state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "Save failed"}
    </span>
  );
}
