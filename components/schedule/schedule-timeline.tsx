"use client";

import * as React from "react";
import { Clock, Check, RotateCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ScheduleDay {
  day: number;
  focus: string;
  question_ids: string[];
  minutes: number;
}

/**
 * Cyberpunk-styled vertical timeline for the study schedule.
 */
export function ScheduleTimeline({
  kitId,
  days,
  daysAvailable,
  createdAt,
  onJumpToQuestion,
  onRebuilt,
}: {
  kitId: string;
  days: ScheduleDay[];
  daysAvailable: number;
  createdAt?: string;
  onJumpToQuestion: (questionId: string) => void;
  onRebuilt: () => void;
}) {
  const storageKey = `trao-done-days-${kitId}`;
  const [doneDays, setDoneDays] = React.useState<number[]>(() => {
    try {
      if (typeof window === "undefined") return [];
      const raw = window.localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as number[]) : [];
    } catch {
      return [];
    }
  });

  const toggleDone = (day: number) => {
    setDoneDays((prev) => {
      const next = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day];
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Private-mode storage failure
      }
      return next;
    });
  };

  const baseDate = createdAt ? new Date(createdAt) : null;
  const validBase = baseDate && !Number.isNaN(baseDate.getTime()) ? baseDate : null;
  const todayIndex = validBase
    ? Math.min(
        days.length,
        Math.max(1, Math.floor((Date.now() - validBase.getTime()) / 86_400_000) + 1)
      )
    : 1;

  const [rebuilding, setRebuilding] = React.useState(false);
  const [rebuildError, setRebuildError] = React.useState<string | null>(null);

  const handleRebuild = async () => {
    setRebuildError(null);
    setRebuilding(true);
    try {
      const res = await fetch(`/api/kits/${kitId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "schedule" }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error || payload?.details || "Schedule rebuild failed");
      toast.success("Schedule rebuilt", {
        description: `Deterministically reallocated across ${daysAvailable} days. Your questions and edits are unchanged.`,
      });
      onRebuilt();
    } catch (err: any) {
      setRebuildError(err?.message || "Schedule rebuild failed");
      toast.error("Schedule rebuild failed", { description: err?.message });
    } finally {
      setRebuilding(false);
    }
  };

  const dateFor = (day: number): string | null => {
    if (!validBase) return null;
    const d = new Date(validBase.getTime() + (day - 1) * 86_400_000);
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div role="tabpanel" id="panel-schedule" aria-labelledby="tab-schedule">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm text-slate-400">
          Allocated deterministically across {daysAvailable} days.{" "}
          {validBase ? (
            <>Day 1 started {validBase.toLocaleDateString()}. Check off days as you finish them.</>
          ) : (
            <>Check off days as you finish them.</>
          )}
        </p>
        <Button variant="ghost" size="sm" onClick={handleRebuild} loading={rebuilding} className="shrink-0 gap-2">
          <RotateCw className="h-3.5 w-3.5" aria-hidden="true" /> Rebuild schedule
        </Button>
      </div>
      
      {rebuildError && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Rebuild failed: {rebuildError}{" "}
            <button onClick={handleRebuild} className="font-semibold underline hover:text-red-200">
              Retry
            </button>
          </span>
        </div>
      )}
      
      {/* Timeline */}
      <ol className="relative space-y-4 pl-8">
        {/* Vertical rail */}
        <div className="absolute left-[11px] top-3 bottom-3 w-0.5 timeline-connector" aria-hidden="true" />
        
        {days.map((day) => {
          const isToday = day.day === todayIndex;
          const isPast = day.day < todayIndex;
          const isDone = doneDays.includes(day.day);
          const dateLabel = dateFor(day.day);
          
          return (
            <li key={day.day} className="relative">
              {/* Node */}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute -left-8 top-5 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-300",
                  isDone
                    ? "border-emerald-500 bg-emerald-500"
                    : isToday
                      ? "border-neon bg-neon ring-4 ring-neon/20 neon-glow-static"
                      : isPast
                        ? "border-slate-600 bg-cyber-surface"
                        : "border-slate-700 bg-cyber-bg"
                )}
              >
                {isDone && <Check className="h-3 w-3 text-white" />}
              </span>
              
              {/* Day card */}
              <div
                className={cn(
                  "rounded-xl border bg-cyber-surface/50 backdrop-blur p-5 transition-all duration-300",
                  isToday ? "border-neon/50 shadow-neon/10" : "border-white/5 hover:border-white/10"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase">
                      <span className={isToday ? "text-neon-bright" : "text-neon"}>Day {day.day}</span>
                      {dateLabel && <span className="font-medium normal-case text-slate-500">{dateLabel}</span>}
                      {isToday && (
                        <span aria-current="date" className="rounded-full bg-neon/20 px-2 py-0.5 text-[10px] text-neon-bright">
                          Today
                        </span>
                      )}
                      {isDone && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-400">
                          <Check className="h-3 w-3" aria-hidden="true" /> Done
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">{day.focus}</p>
                    <p className="mt-3 flex flex-wrap gap-1.5" aria-label={`Day ${day.day} questions`}>
                      {day.question_ids?.map((qid) => (
                        <button
                          key={qid}
                          onClick={() => onJumpToQuestion(qid)}
                          className="rounded-full border border-white/10 bg-cyber-elevated px-2.5 py-1 font-mono text-[11px] text-neon-bright transition-colors hover:bg-cyber-bg hover:border-neon/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon"
                        >
                          {qid}
                        </button>
                      ))}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-3">
                    <span className="flex items-center gap-1.5 text-xs font-medium tabular-nums text-slate-400">
                      <Clock className="h-4 w-4 text-slate-500" aria-hidden="true" />
                      {day.minutes} mins
                    </span>
                    <button
                      onClick={() => toggleDone(day.day)}
                      aria-pressed={isDone}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon",
                        isDone
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                          : "border-white/10 text-slate-400 hover:border-neon/30 hover:text-white"
                      )}
                    >
                      {isDone ? "Undo" : "Mark done"}
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
