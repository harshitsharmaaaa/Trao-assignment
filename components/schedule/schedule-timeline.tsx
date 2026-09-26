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
 * Vertical timeline for the deterministic study plan. Day numbers map to
 * calendar dates from kit creation (day 1 = creation date); "today" is the
 * clamped day index. Done-toggles are client-side only (localStorage) and
 * never touch the authoritative schedule.
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
        // Private-mode storage failure: toggles still work for the session.
      }
      return next;
    });
  };

  const baseDate = createdAt ? new Date(createdAt) : null;
  const validBase = baseDate && !Number.isNaN(baseDate.getTime()) ? baseDate : null;  const todayIndex = validBase
    ? Math.min(
        days.length,
        Math.max(1, Math.floor((Date.now() - validBase.getTime()) / 86_400_000) + 1)
      )
    : 1;

  // Explicit standalone regeneration: deterministic recompute only (no LLM call).
  // User edits are never touched — only the day allocation is rebuilt.
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
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm text-slate-400">
          Allocated deterministically across {daysAvailable} days.{" "}
          {validBase ? (
            <>Day 1 started {validBase.toLocaleDateString()}. Check off days as you finish them.</>
          ) : (
            <>Check off days as you finish them.</>
          )}
        </p>
        <Button variant="ghost" size="sm" onClick={handleRebuild} loading={rebuilding} className="shrink-0">
          <RotateCw className="h-3.5 w-3.5" aria-hidden="true" /> Rebuild schedule
        </Button>
      </div>
      {rebuildError && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Rebuild failed: {rebuildError}{" "}
            <button onClick={handleRebuild} className="font-semibold underline hover:text-red-200">
              Retry
            </button>
          </span>
        </div>
      )}
      <ol className="relative space-y-3 border-l-2 border-slate-800 pl-0 sm:ml-2">
        {days.map((day) => {
          const isToday = day.day === todayIndex;
          const isPast = day.day < todayIndex;
          const isDone = doneDays.includes(day.day);
          const dateLabel = dateFor(day.day);
          return (
            <li key={day.day} className="relative pl-8">
              <span
                aria-hidden="true"
                className={cn(
                  "absolute -left-[9px] top-5 h-4 w-4 rounded-full border-2",
                  isDone
                    ? "border-emerald-500 bg-emerald-500"
                    : isToday
                      ? "border-indigo-400 bg-indigo-500 ring-4 ring-indigo-500/20"
                      : isPast
                        ? "border-slate-600 bg-slate-800"
                        : "border-slate-700 bg-slate-900"
                )}
              />
              <div
                className={cn(
                  "rounded-xl border bg-slate-950 p-4",
                  isToday ? "border-indigo-500/60" : "border-slate-800"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase">
                      <span className={isToday ? "text-indigo-300" : "text-indigo-400"}>Day {day.day}</span>
                      {dateLabel && <span className="font-medium normal-case text-slate-500">{dateLabel}</span>}
                      {isToday && (
                        <span aria-current="date" className="rounded-full bg-indigo-600/20 px-2 py-0.5 text-[10px] text-indigo-200">
                          Today
                        </span>
                      )}
                      {isDone && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300">
                          <Check className="h-3 w-3" aria-hidden="true" /> Done
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">{day.focus}</p>
                    <p className="mt-2 flex flex-wrap gap-1" aria-label={`Day ${day.day} questions`}>
                      {day.question_ids?.map((qid) => (
                        <button
                          key={qid}
                          onClick={() => onJumpToQuestion(qid)}
                          className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-indigo-300 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        >
                          {qid}
                        </button>
                      ))}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium tabular-nums text-slate-400">
                      <Clock className="h-4 w-4 text-slate-500" aria-hidden="true" />
                      {day.minutes} mins
                    </span>
                    <button
                      onClick={() => toggleDone(day.day)}
                      aria-pressed={isDone}
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                        isDone
                          ? "border-emerald-500/50 text-emerald-300"
                          : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
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
