import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Badge component with cyberpunk styling.
 * Status is never color-only - always paired with icon and/or text.
 */
type BadgeVariant =
  | "must"
  | "nice"
  | "kind"
  | "edited"
  | "custom"
  | "generated"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted";

const variantClasses: Record<BadgeVariant, string> = {
  must: "bg-red-500/20 text-red-300 border border-red-500/30",
  nice: "bg-slate-700/60 text-slate-300 border border-slate-600/50",
  kind: "bg-slate-800 text-slate-400 border border-slate-700/50",
  edited: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  custom: "bg-violet-500/20 text-violet-300 border border-violet-500/30",
  generated: "bg-slate-800 text-slate-400 border border-slate-700/50",
  success: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  danger: "bg-red-500/15 text-red-400 border border-red-500/30",
  info: "bg-neon/15 text-neon-bright border border-neon/30",
  muted: "bg-slate-800/70 text-slate-500 border border-slate-700/50",
};

export function Badge({
  variant = "muted",
  className,
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
