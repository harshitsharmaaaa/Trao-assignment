"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Play,
  Sparkles,
  ExternalLink,
  Clock,
  CheckCircle2,
  RotateCw,
  Pencil,
  Trash2,
  Check,
  X,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorCard } from "@/components/ui/error-card";
import { SkeletonCardList } from "@/components/ui/skeleton";
import { SaveStateIndicator } from "@/components/ui/save-state";
import { StageSteps } from "@/components/generation/stage-steps";
import { ScheduleTimeline } from "@/components/schedule/schedule-timeline";
import { cn } from "@/lib/utils";
import { useKitBuilder } from "@/components/builder/use-kit-builder";
import { QuestionBuilder } from "@/components/builder/question-builder";
import type { BuilderRequirement } from "@/components/builder/types";

type TabId = "overview" | "brief" | "role" | "questions" | "coverage" | "flashcards" | "schedule";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "brief", label: "Company Brief" },
  { id: "role", label: "Role & Requirements" },
  { id: "questions", label: "Questions" },
  { id: "coverage", label: "Coverage" },
  { id: "flashcards", label: "Flashcards" },
  { id: "schedule", label: "Schedule" },
];

export default function KitDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState<TabId>("overview");
  const [briefRegen, setBriefRegen] = React.useState(false);
  const [briefConfirm, setBriefConfirm] = React.useState(false);
  const [briefError, setBriefError] = React.useState<string | null>(null);
  const [reqFilter, setReqFilter] = React.useState<"all" | "must" | "nice">("all");
  const [editingFlashId, setEditingFlashId] = React.useState<string | null>(null);
  const [flashFront, setFlashFront] = React.useState("");
  const [flashBack, setFlashBack] = React.useState("");
  const [confirmFlashDelete, setConfirmFlashDelete] = React.useState<string | null>(null);

  const builder = useKitBuilder(params.id);
  const hydratedForRef = React.useRef<string | null>(null);

  const fetchKitData = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/kits/${params.id}`);
      if (!res.ok) {
        if (res.status === 401) router.push("/login");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  React.useEffect(() => {
    fetchKitData();
  }, [fetchKitData]);

  // Poll while the pipeline is running (unchanged cadence).
  React.useEffect(() => {
    if (!data || (data.status !== "running" && data.status !== "queued")) return;
    const interval = setInterval(fetchKitData, 2000);
    return () => clearInterval(interval);
  }, [data?.status, fetchKitData]);

  // Hydrate the builder exactly once per kit (never clobber optimistic edits).
  const internalKit = data?.internalKit;
  React.useEffect(() => {
    if (data?.status === "ok" && internalKit && hydratedForRef.current !== params.id) {
      hydratedForRef.current = params.id;
      builder.hydrate(internalKit.questions ?? [], internalKit.flashcards ?? []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.status, params.id]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const jumpToQuestion = (questionId: string) => {
    setTab("questions");
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.getElementById(`question-${questionId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 60);
    });
  };

  const handleRegenerateBrief = async () => {
    setBriefConfirm(false);
    setBriefError(null);
    setBriefRegen(true);
    try {
      const res = await fetch(`/api/kits/${params.id}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "company_brief" }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error || payload?.details || "Regeneration failed");
      toast.success("Company brief regenerated");
      await fetchKitData();
    } catch (err: any) {
      setBriefError(err?.message || "Regeneration failed");
      toast.error("Brief regeneration failed", { description: err?.message });
    } finally {
      setBriefRegen(false);
    }
  };

  const startFlashEdit = (card: any) => {
    setEditingFlashId(card.id);
    setFlashFront(card.front);
    setFlashBack(card.back);
    setConfirmFlashDelete(null);
  };

  const saveFlashEdit = (id: string) => {
    if (!flashFront.trim() || !flashBack.trim()) {
      toast.error("Front and back cannot be empty");
      return;
    }
    builder.updateFlashcards((prev) =>
      prev.map((f) => (f.id === id ? { ...f, front: flashFront.trim(), back: flashBack.trim(), user_edited: true } : f))
    );
    setEditingFlashId(null);
    toast.success("Flashcard updated");
  };

  if (loading) {
    return (
      <AppShell email={null} onSignOut={handleLogout} breadcrumbs={[{ label: "My Kits", href: "/" }, { label: "Loading…" }]}>
        <SkeletonCardList rows={4} />
      </AppShell>
    );
  }

  const externalKit = data?.kit;
  const requirements: BuilderRequirement[] = externalKit?.role?.requirements ?? [];
  const questions = builder.questions;
  const flashcards = builder.flashcards;

  // View 1: Generation in Progress (real stage visualization, 2s polling).
  if (data?.status === "running" || data?.status === "queued") {
    return (
      <AppShell email={null} onSignOut={handleLogout} breadcrumbs={[{ label: "My Kits", href: "/" }, { label: "Generating…" }]}>
        <div className="mx-auto w-full max-w-xl space-y-5 rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl sm:p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">Generating Your Prep Kit</h1>
            <p className="mt-1 text-sm text-slate-400">
              Researching, writing and scheduling — this usually takes a few minutes. You can leave
              and come back; progress is saved.
            </p>
          </div>
          <StageSteps stage={data.progress?.stage || "queued"} message={data.progress?.message || ""} />
          <div className="flex justify-center">
            <Link href="/" className="text-sm font-medium text-slate-400 hover:text-white">
              ← Back to dashboard (generation continues)
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // View 2: Fatal Failure.
  if (data?.status === "failed") {
    return (
      <AppShell email={null} onSignOut={handleLogout} breadcrumbs={[{ label: "My Kits", href: "/" }, { label: "Failed" }]}>
        <div className="flex flex-col items-center py-10">
          <ErrorCard
            title="Generation Failed"
            message={data.error?.message || "Could not generate kit."}
            secondaryAction={
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Return to Dashboard
              </Link>
            }
          />
        </div>
      </AppShell>
    );
  }

  const mustReqs = requirements.filter((r) => r.priority === "must");
  const coveredIds = new Set(questions.flatMap((q) => q.requirement_ids));
  const uncoveredMust = mustReqs.filter((r) => !coveredIds.has(r.id));
  const filteredReqs = reqFilter === "all" ? requirements : requirements.filter((r) => r.priority === reqFilter);

  const onTabKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const idx = TABS.findIndex((t) => t.id === tab);
    const next = e.key === "ArrowRight" ? (idx + 1) % TABS.length : (idx - 1 + TABS.length) % TABS.length;
    setTab(TABS[next].id);
  };

  return (
    <AppShell
      email={null}
      onSignOut={handleLogout}
      breadcrumbs={[
        { label: "My Kits", href: "/" },
        { label: externalKit?.source?.company || "Kit" },
      ]}
    >
      {/* Workspace header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-white">
            {externalKit?.source?.role || "Interview Prep Kit"}
          </h1>
          <p className="mt-0.5 text-sm text-indigo-400">
            {externalKit?.source?.company}
            {externalKit?.role?.seniority ? ` · ${externalKit.role.seniority}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <SaveStateIndicator state={builder.saveState} />
          <Link
            href={`/kits/${params.id}/practice`}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <Play className="h-4 w-4 fill-white" aria-hidden="true" />
            Practice
          </Link>
        </div>
      </div>

      {/* Section tabs */}
      <div className="sticky top-16 z-20 -mx-4 mb-6 border-b border-slate-800 bg-slate-900/95 px-4 backdrop-blur md:-mx-6 md:px-6">
        <div
          role="tablist"
          aria-label="Kit sections"
          onKeyDown={onTabKeyDown}
          className="flex gap-1 overflow-x-auto"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              id={`tab-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => setTab(t.id)}
              className={cn(
                "whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                tab === t.id
                  ? "border-indigo-500 text-white"
                  : "border-transparent text-slate-400 hover:border-slate-700 hover:text-slate-200"
              )}
            >
              {t.label}
              {t.id === "questions" && (
                <span className="ml-1.5 rounded-full bg-slate-800 px-1.5 py-0.5 text-[11px] tabular-nums text-slate-300">
                  {questions.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Panels */}
      {tab === "overview" && (
        <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview" className="space-y-6">
          <section className="rounded-xl border border-slate-800 bg-slate-950 p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Research summary</p>
            <h2 className="mt-1 text-2xl font-bold text-white">{externalKit?.source?.company}</h2>
            <a
              href={externalKit?.source?.company_url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-400 hover:underline"
            >
              {externalKit?.source?.company_url} <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Requirements", String(requirements.length)],
                ["Questions", String(questions.length)],
                ["Flashcards", String(flashcards.length)],
                ["Study days", String(externalKit?.schedule?.days_available ?? "—")],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-900 p-3">
                  <dt className="text-xs font-medium text-slate-500">{label}</dt>
                  <dd className="text-lg font-bold tabular-nums text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(
              [
                ["questions", "Review & edit your question bank", `${questions.length} question${questions.length === 1 ? "" : "s"}`],
                ["practice", "Drill flashcards weakest-first", `${flashcards.length} card${flashcards.length === 1 ? "" : "s"}`],
                ["schedule", "See today's study plan", `${externalKit?.schedule?.days_available ?? 0} days`],
              ] as const
            ).map(([target, title, meta]) =>
              target === "practice" ? (
                <Link
                  key={target}
                  href={`/kits/${params.id}/practice`}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-5 transition hover:border-indigo-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-1 text-xs text-slate-400">{meta}</p>
                </Link>
              ) : (
                <button
                  key={target}
                  onClick={() => setTab(target)}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-left transition hover:border-indigo-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-1 text-xs text-slate-400">{meta}</p>
                </button>
              )
            )}
          </section>
        </div>
      )}

      {tab === "brief" && (
        <div role="tabpanel" id="panel-brief" aria-labelledby="tab-brief" className="space-y-4">
          <section className="rounded-xl border border-slate-800 bg-slate-950 p-6">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                <Sparkles className="h-5 w-5 text-indigo-400" aria-hidden="true" />
                Company Brief
              </h2>
              <Button variant="ghost" size="sm" onClick={() => { setBriefError(null); setBriefConfirm(true); }} loading={briefRegen}>
                <RotateCw className="h-3.5 w-3.5" aria-hidden="true" /> Regenerate
              </Button>
            </div>
            {briefError && (
              <div role="alert" className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  Regeneration failed: {briefError}{" "}
                  <button onClick={handleRegenerateBrief} className="font-semibold underline hover:text-red-200">
                    Retry
                  </button>
                </span>
              </div>
            )}
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-slate-900 p-4">
                <h3 className="mb-1 font-semibold text-indigo-300">Company Summary</h3>
                <p className="max-w-[70ch] text-sm leading-relaxed text-slate-300">{externalKit?.company_brief?.summary}</p>
              </div>
              <div className="rounded-lg bg-slate-900 p-4">
                <h3 className="mb-1 font-semibold text-indigo-300">What They Do</h3>
                <p className="max-w-[70ch] text-sm leading-relaxed text-slate-300">{externalKit?.company_brief?.what_they_do}</p>
              </div>
            </div>
            {externalKit?.company_brief?.sources?.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Research sources</h3>
                <ul className="mt-2 space-y-1">
                  {externalKit.company_brief.sources.map((s: string) => (
                    <li key={s}>
                      <a href={s} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:underline">
                        <span className="truncate">{s}</span> <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      )}

      {tab === "role" && (
        <div role="tabpanel" id="panel-role" aria-labelledby="tab-role" className="space-y-4">
          <section className="rounded-xl border border-slate-800 bg-slate-950 p-6">
            <div className="flex flex-col gap-3 border-b border-slate-800 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-white">
                Role Requirements <span className="text-sm font-semibold tabular-nums text-slate-400">({filteredReqs.length}/{requirements.length})</span>
              </h2>
              <div className="flex gap-1.5" role="radiogroup" aria-label="Filter requirements">
                {(["all", "must", "nice"] as const).map((f) => (
                  <button
                    key={f}
                    role="radio"
                    aria-checked={reqFilter === f}
                    onClick={() => setReqFilter(f)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                      reqFilter === f ? "border-indigo-500 bg-indigo-600/15 text-white" : "border-slate-700 text-slate-400 hover:border-slate-600"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            {externalKit?.role?.responsibilities?.length > 0 && (
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-300">
                {externalKit.role.responsibilities.map((r: string, i: number) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            )}
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {filteredReqs.map((req) => {
                const covering = questions.filter((q) => q.requirement_ids.includes(req.id));
                return (
                  <div key={req.id} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-slate-200">
                        <span className="mr-2 font-mono text-xs font-bold uppercase text-indigo-400">{req.id}</span>
                        {req.text}
                      </p>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <Badge variant={req.priority === "must" ? "must" : "nice"}>{req.priority}</Badge>
                        <Badge variant="kind">{req.kind}</Badge>
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {covering.length === 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-red-400">
                          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" /> Uncovered
                        </span>
                      ) : (
                        covering.map((q) => (
                          <button
                            key={q.id}
                            onClick={() => jumpToQuestion(q.id)}
                            title={q.prompt}
                            className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-indigo-300 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                          >
                            {q.id}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {tab === "questions" && (
        <div role="tabpanel" id="panel-questions" aria-labelledby="tab-questions">
          <QuestionBuilder
            kitId={params.id}
            requirements={requirements}
            builder={builder}
            onRegenerated={fetchKitData}
          />
        </div>
      )}

      {tab === "coverage" && (
        <div role="tabpanel" id="panel-coverage" aria-labelledby="tab-coverage" className="space-y-4">
          <section className="rounded-xl border border-slate-800 bg-slate-950 p-6">
            <h2 className="border-b border-slate-800 pb-3 text-lg font-bold text-white">Coverage Status</h2>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>MUST requirements covered</span>
                  <span className="tabular-nums">
                    {mustReqs.length - uncoveredMust.length}/{mustReqs.length}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-label="MUST coverage" aria-valuenow={mustReqs.length - uncoveredMust.length} aria-valuemin={0} aria-valuemax={Math.max(1, mustReqs.length)}>
                  <div
                    className={cn("h-full transition-all", uncoveredMust.length === 0 ? "bg-emerald-500" : "bg-amber-500")}
                    style={{ width: `${mustReqs.length === 0 ? 100 : ((mustReqs.length - uncoveredMust.length) / mustReqs.length) * 100}%` }}
                  />
                </div>
              </div>
              {uncoveredMust.length === 0 ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> 100% MUST covered
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-semibold text-red-400">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" /> {uncoveredMust.length} uncovered
                </span>
              )}
            </div>
            <ul className="mt-4 space-y-2">
              {requirements.map((req) => {
                const isCovered = coveredIds.has(req.id);
                const covering = questions.filter((q) => q.requirement_ids.includes(req.id));
                return (
                  <li key={req.id} className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-900 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-200">
                      <span className="mr-2 font-mono text-xs font-bold uppercase text-indigo-400">{req.id}</span>
                      {req.text} <Badge variant={req.priority === "must" ? "must" : "nice"}>{req.priority}</Badge>{" "}
                      <span className="text-xs tabular-nums text-slate-500">
                        · {covering.length} question{covering.length === 1 ? "" : "s"}
                      </span>
                    </p>
                    <span className="flex flex-wrap items-center gap-1.5">
                      {isCovered ? (
                        covering.map((q) => (
                          <button
                            key={q.id}
                            onClick={() => jumpToQuestion(q.id)}
                            className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-indigo-300 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                          >
                            {q.id}
                          </button>
                        ))
                      ) : (
                        <span className="text-xs text-red-400">No covering question</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}

      {tab === "flashcards" && (
        <div role="tabpanel" id="panel-flashcards" aria-labelledby="tab-flashcards" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white">
              Flashcards <span className="text-sm font-semibold tabular-nums text-slate-400">({flashcards.length})</span>
            </h2>
            <div className="flex items-center gap-3">
              <SaveStateIndicator state={builder.saveState} />
              <Link
                href={`/kits/${params.id}/practice`}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Play className="h-4 w-4 fill-white" aria-hidden="true" /> Practice now
              </Link>
            </div>
          </div>
          {flashcards.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-12 w-12" aria-hidden="true" />}
              title="No flashcards in this kit"
              description="Flashcards are generated with your kit. If this kit was built before flashcards existed, regenerate a question category."
            />
          ) : (
            <ul className="space-y-3">
              {flashcards.map((card) => (
                <li key={card.id} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                  {editingFlashId === card.id ? (
                    <div className="space-y-3">
                      <div>
                        <label htmlFor={`flash-front-${card.id}`} className="block text-xs font-medium text-slate-400">Front</label>
                        <textarea id={`flash-front-${card.id}`} rows={2} value={flashFront} onChange={(e) => setFlashFront(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                      </div>
                      <div>
                        <label htmlFor={`flash-back-${card.id}`} className="block text-xs font-medium text-slate-400">Back</label>
                        <textarea id={`flash-back-${card.id}`} rows={3} value={flashBack} onChange={(e) => setFlashBack(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm text-slate-300 focus:border-indigo-500 focus:outline-none" />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingFlashId(null)}>
                          <X className="h-3.5 w-3.5" aria-hidden="true" /> Cancel
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => saveFlashEdit(card.id)}>
                          <Check className="h-3.5 w-3.5" aria-hidden="true" /> Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 font-mono text-xs font-bold text-indigo-400">
                          {card.id}
                          {card.user_edited && <Badge variant="edited">Edited</Badge>}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <button onClick={() => startFlashEdit(card)} aria-label={`Edit flashcard ${card.id}`} className="rounded p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          {confirmFlashDelete === card.id ? (
                            <span className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  builder.updateFlashcards((prev) => prev.filter((f) => f.id !== card.id));
                                  setConfirmFlashDelete(null);
                                  toast.success("Flashcard deleted");
                                }}
                                className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-500"
                              >
                                Confirm
                              </button>
                              <button onClick={() => setConfirmFlashDelete(null)} aria-label="Cancel delete" className="rounded p-1.5 text-slate-400 hover:text-white">
                                <X className="h-4 w-4" aria-hidden="true" />
                              </button>
                            </span>
                          ) : (
                            <button onClick={() => setConfirmFlashDelete(card.id)} aria-label={`Delete flashcard ${card.id}`} className="rounded p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          )}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white">{card.front}</p>
                      <p className="rounded-lg border border-slate-800/60 bg-slate-900 p-2.5 text-xs leading-relaxed text-slate-400">{card.back}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "schedule" && (
        <ScheduleTimeline
          kitId={params.id}
          days={externalKit?.schedule?.days ?? []}
          daysAvailable={externalKit?.schedule?.days_available ?? 0}
          createdAt={data?.createdAt}
          onJumpToQuestion={jumpToQuestion}
          onRebuilt={fetchKitData}
        />
      )}

      {/* Brief regenerate confirmation */}
      {briefConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="brief-regen-title"
            aria-describedby="brief-regen-desc"
            className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl"
          >
            <h3 id="brief-regen-title" className="text-base font-bold text-white">
              Regenerate company brief?
            </h3>
            <p id="brief-regen-desc" className="mt-1 text-sm text-slate-400">
              This replaces the current summary and focus description with a freshly researched
              version. Sources are re-attached automatically.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="secondary" size="md" onClick={() => setBriefConfirm(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleRegenerateBrief}>
                Regenerate
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
