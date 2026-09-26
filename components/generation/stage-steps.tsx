"use client";

import * as React from "react";
import { Check, Loader2, Circle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StageMeta {
  key: string;
  title: string;
  description: string;
}

// Real pipeline stages, in order
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

  // Keep the current step visible
  React.useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "nearest" });
  }, [stage]);

  return (
    <div className="w-full">
      {/* Condensed mobile header */}
      <div className="mb-3 sm:hidden">
        <button
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-cyber-surface px-4 py-3 text-left backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon"
        >
          <span>
            <span className="block text-xs font-medium text-slate-400">
              {known ? `Step ${doneCount + 1} of ${STAGES.length}` : "Working…"}
            </span>
            <span className="block text-sm font-semibold text-white">
              {known ? STAGES[currentIndex].title : humanize(stage)}
            </span>
          </span>
          <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", expanded && "rotate-180")} aria-hidden="true" />
        </button>
      </div>

      <ol aria-label="Generation progress" className={cn(!expanded && "hidden", "space-y-2 sm:block")}>
        {STAGES.map((s, i) => {
          const isDone = known && i < currentIndex;
          const isCurrent = known && i === currentIndex;
          return (
            <li
              key={s.key}
              ref={isCurrent ? currentRef : undefined}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex items-start gap-3 rounded-xl px-4 py-3 transition-all duration-300",
                isCurrent && "bg-neon/10 border border-neon/30 shadow-neon/20"
              )}
            >
              <span className="mt-0.5 shrink-0" aria-hidden="true">
                {isDone ? (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">
                    <Check className="h-3 w-3 text-emerald-400" />
                  </div>
                ) : isCurrent ? (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-neon/20 neon-glow-static">
                    <Loader2 className="h-3 w-3 animate-spin text-neon-bright" />
                  </div>
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
          <li aria-current="step" className="flex items-start gap-3 rounded-xl bg-neon/10 border border-neon/30 px-4 py-3">
            <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-neon/20 neon-glow-static">
              <Loader2 className="h-3 w-3 animate-spin text-neon-bright" aria-hidden="true" />
            </div>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-white">
                {humanize(stage)} <span className="sr-only">(in progress)</span>
              </span>
              <span className="block truncate text-xs text-slate-400">{message}</span>
            </span>
          </li>
        )}
      </ol>

      {/* Progress counter */}
      {known && (
        <p className="mt-4 hidden text-xs tabular-nums text-slate-500 sm:block" role="status">
          Step {doneCount + 1} of {STAGES.length} · {message || STAGES[currentIndex].description}
        </p>
      )}
    </div>
  );
}
