"use client";

import * as React from "react";
import { Check, Loader2, Circle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StageMeta {
  key: string;
  title: string;
  description: string;
}

// Real pipeline stages, in order (from lib/pipeline/orchestrator.ts notify calls
// plus queued/complete/failed lifecycle states). generation_pass2 is conditional —
// it is labeled as such and counts as handled once later stages are reached.
const STAGES: StageMeta[] = [
  { key: "queued", title: "Queued", description: "Waiting to start generation" },
  { key: "validation", title: "Validating input", description: "Checking job description and company URL" },
  { key: "extraction", title: "Extracting requirements", description: "Parsing the JD into must / nice requirements" },
  { key: "retrieval", title: "Crawling company website", description: "Reading about, hiring and culture pages" },
  { key: "public_research", title: "Public interview research", description: "Searching public interview discussions" },
  { key: "research", title: "Company brief & role analysis", description: "Summarizing the company and the role" },
  { key: "generation_pass1", title: "Generating questions & flashcards", description: "Building the first question bank" },
  { key: "coverage_check", title: "Checking coverage", description: "Verifying every MUST requirement is covered" },
  { key: "generation_pass2", title: "Filling coverage gaps (if needed)", description: "Targeted questions for uncovered requirements" },
  { key: "scheduling", title: "Building study schedule", description: "Allocating questions across your days" },
  { key: "complete", title: "Complete", description: "Your kit is ready" },
];

function humanize(stage: string): string {
  return stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StageSteps({ stage, message }: { stage: string; message: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const currentRef = React.useRef<HTMLLIElement | null>(null);

  const currentIndex = STAGES.findIndex((s) => s.key === stage);
  const known = currentIndex >= 0;
  const doneCount = known ? currentIndex : 0;

  // Keep the current step visible as the list grows.
  React.useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "nearest" });
  }, [stage]);

  return (
    <div className="w-full">
      {/* Condensed mobile header: current stage + count + expander. */}
      <div className="mb-3 sm:hidden">
        <button
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <span>
            <span className="block text-xs font-medium text-slate-400">
              {known ? `Step ${doneCount + 1} of ${STAGES.length}` : "Working…"}
            </span>
            <span className="block text-sm font-semibold text-white">
              {known ? STAGES[currentIndex].title : humanize(stage)}
            </span>
          </span>
          <ChevronDown className={cn("h-4 w-4 text-slate-400 transition", expanded && "rotate-180")} aria-hidden="true" />
        </button>
      </div>

      <ol aria-label="Generation progress" className={cn(!expanded && "hidden", "space-y-1 sm:block")}>
        {STAGES.map((s, i) => {
          const isDone = known && i < currentIndex;
          const isCurrent = known && i === currentIndex;
          return (
            <li
              key={s.key}
              ref={isCurrent ? currentRef : undefined}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex items-start gap-3 rounded-lg px-3 py-2.5",
                isCurrent && "bg-indigo-600/10 outline outline-1 outline-indigo-500/40"
              )}
            >
              <span className="mt-0.5 shrink-0" aria-hidden="true">
                {isDone ? (
                  <Check className="h-5 w-5 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                ) : (
                  <Circle className="h-5 w-5 text-slate-700" />
                )}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-sm font-semibold",
                    isDone ? "text-slate-300" : isCurrent ? "text-white" : "text-slate-500"
                  )}
                >
                  {s.title}
                  <span className="sr-only">{isDone ? " (completed)" : isCurrent ? " (in progress)" : " (pending)"}</span>
                </span>
                {(isCurrent || isDone) && (
                  <span className="block truncate text-xs text-slate-400">
                    {isCurrent ? message || s.description : s.description}
                  </span>
                )}
              </span>
            </li>
          );
        })}
        {!known && (
          <li aria-current="step" className="flex items-start gap-3 rounded-lg bg-indigo-600/10 px-3 py-2.5 outline outline-1 outline-indigo-500/40">
            <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-indigo-400" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-white">
                {humanize(stage)} <span className="sr-only">(in progress)</span>
              </span>
              <span className="block truncate text-xs text-slate-400">{message}</span>
            </span>
          </li>
        )}
      </ol>

      {/* Determinate count from real stages — never a fake percentage. */}
      {known && (
        <p className="mt-3 hidden text-xs tabular-nums text-slate-500 sm:block" role="status">
          Step {doneCount + 1} of {STAGES.length} · {message || STAGES[currentIndex].description}
        </p>
      )}
    </div>
  );
}
