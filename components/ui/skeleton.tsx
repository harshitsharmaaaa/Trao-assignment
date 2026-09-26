import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Skeleton component with shimmer effect.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg bg-white/5 shimmer",
        className
      )}
      {...props}
    />
  );
}

/**
 * Skeleton card for loading states.
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/5 bg-cyber-surface p-6",
        className
      )}
    >
      <div className="space-y-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

/**
 * Skeleton card list for loading states.
 */
export function SkeletonCardList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for question cards.
 */
export function SkeletonQuestionCard() {
  return (
    <div className="rounded-xl border border-white/5 bg-cyber-surface p-5">
      <div className="flex items-start gap-4">
        <Skeleton className="h-5 w-5 rounded" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  );
}
