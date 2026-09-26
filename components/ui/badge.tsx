import * as React from "react";
import { cn } from "@/lib/utils";

// Subtle state indicators per design system. Status is never color-only:
// every badge pairs color with an icon and/or explicit text.
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
  must: "bg-red-500/20 text-red-300",
  nice: "bg-slate-700/60 text-slate-300",
  kind: "bg-slate-800 text-slate-400",
  edited: "bg-amber-500/20 text-amber-300",
  custom: "bg-violet-500/20 text-violet-300",
  generated: "bg-slate-800 text-slate-400",
  success: "bg-emerald-500/10 text-emerald-400",
  warning: "bg-amber-500/10 text-amber-400",
  danger: "bg-red-500/10 text-red-400",
  info: "bg-indigo-500/10 text-indigo-300",
  muted: "bg-slate-800/70 text-slate-500",
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
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
