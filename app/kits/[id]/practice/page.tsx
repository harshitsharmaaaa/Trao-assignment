"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, RotateCcw, Star, Filter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorCard } from "@/components/ui/error-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PracticeCard {
  id: string;
  front: string;
  back: string;
  requirement_ids: string[];
  confidence?: number;
}

const CONFIDENCE_LABELS: Record<number, string> = {
  1: "Shaky",
  2: "Unsure",
  3: "Okay",
  4: "Solid",
  5: "Nailed it",
};

export default function PracticeModePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [cards, setCards] = React.useState<PracticeCard[]>([]);
  const [coveredReqIds, setCoveredReqIds] = React.useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [showBack, setShowBack] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [completed, setCompleted] = React.useState(false);
  const [ratedCount, setRatedCount] = React.useState(0);
  const [weakOnly, setWeakOnly] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const fetchSession = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [cardsRes, kitRes] = await Promise.all([
        fetch(`/api/kits/${params.id}/practice`),
        fetch(`/api/kits/${params.id}`),
      ]);
      if (cardsRes.status === 401 || kitRes.status === 401) {
        router.push("/login");
        return;
      }
      if (!cardsRes.ok) throw new Error("Could not load flashcards.");
      const cardsData = await cardsRes.json();
      setCards(cardsData.flashcards || []);
      if (kitRes.ok) {
        const kitData = await kitRes.json();
        const qs: { requirement_ids: string[] }[] = kitData?.internalKit?.questions ?? [];
        setCoveredReqIds(new Set(qs.flatMap((q) => q.requirement_ids)));
      }
      setCurrentIndex(0);
      setShowBack(false);
      setCompleted(false);
      setRatedCount(0);
    } catch (err: any) {
      setLoadError(err?.message || "Could not load flashcards.");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  React.useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const deck = React.useMemo(
    () => (weakOnly ? cards.filter((c) => (c.confidence ?? 0) <= 2) : cards),
    [cards, weakOnly]
  );
  const currentCard = deck[currentIndex];
  const weakRemaining = cards.filter((c) => (c.confidence ?? 0) <= 2).length;

  const flip = React.useCallback(() => setShowBack((s) => !s), []);

  const handleRate = async (confidence: number) => {
    if (!currentCard || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/kits/${params.id}/practice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashcardId: currentCard.id, confidence }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Rating not saved");
      setCards((prev) => prev.map((c) => (c.id === currentCard.id ? { ...c, confidence } : c)));
      setRatedCount((n) => n + 1);
      setShowBack(false);
      if (currentIndex + 1 < deck.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCompleted(true);
      }
    } catch (err: any) {
      toast.error("Rating not saved", { description: err?.message, action: { label: "Retry", onClick: () => handleRate(confidence) } });
    } finally {
      setSaving(false);
    }
  };

  const onCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      flip();
    } else if (showBack && ["1", "2", "3", "4", "5"].includes(e.key)) {
      e.preventDefault();
      handleRate(Number(e.key));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-cyber-bg text-slate-100">
        <div className="border-b border-white/5 bg-cyber-surface px-4 py-4 sm:px-6">
          <Skeleton className="mx-auto h-5 w-full max-w-4xl" />
        </div>
        <main className="flex flex-1 flex-col items-center justify-center p-6">
          <div className="w-full max-w-2xl space-y-4" role="status" aria-label="Loading practice session">
            <Skeleton className="h-2 w-full" />
            <Skeleton className="min-h-[300px] w-full rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cyber-bg p-6">
        <ErrorCard
          title="Practice unavailable"
          message={loadError}
          onRetry={fetchSession}
          secondaryAction={
            <Link href={`/kits/${params.id}`} className="rounded-xl border border-white/10 bg-cyber-surface px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-cyber-elevated">
              Back to kit
            </Link>
          }
        />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cyber-bg p-6">
        <EmptyState
          icon={<Star className="h-12 w-12" aria-hidden="true" />}
          title="No flashcards available"
          description="This kit has no flashcards yet. Generate or add some in the kit workspace first."
          action={
            <Link href={`/kits/${params.id}`} className="inline-flex items-center gap-2 rounded-xl bg-neon px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-neon/30 transition-all hover:bg-neon-bright">
              Return to Kit Builder
            </Link>
          }
        />
      </div>
    );
  }

  if (weakOnly && deck.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cyber-bg p-6">
        <EmptyState
          icon={<CheckCircle2 className="h-12 w-12 text-emerald-400" aria-hidden="true" />}
          title="No weak cards — nice work"
          description="Every card is rated 3 or higher. Run the full deck or head back to the kit."
          action={
            <div className="flex gap-3">
              <Button variant="secondary" size="md" onClick={() => { setWeakOnly(false); setCurrentIndex(0); setCompleted(false); }}>
                Full deck
              </Button>
              <Link href={`/kits/${params.id}`} className="inline-flex items-center gap-2 rounded-xl bg-neon px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-neon/30 transition-all hover:bg-neon-bright">
                Back to kit
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  const weakCards = cards.filter((c) => (c.confidence ?? 0) <= 2);

  return (
    <div className="flex min-h-screen flex-col bg-cyber-bg text-slate-100">
      {/* Header */}
      <header className="border-b border-white/5 bg-cyber-surface/80 backdrop-blur px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <Link
            href={`/kits/${params.id}`}
            className="flex items-center gap-1.5 rounded-lg text-sm font-medium text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Kit
          </Link>
          <p className="text-sm font-medium tabular-nums text-slate-400" role="status">
            {completed ? "Session complete" : `Card ${Math.min(currentIndex + 1, deck.length)} of ${deck.length}`}
            {weakOnly && " · weak only"}
          </p>
          <span className="hidden items-center gap-1.5 text-xs text-slate-500 sm:inline-flex" title="Cards rated 2 or below">
            <Star className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
            {weakRemaining} weak
          </span>
        </div>
        {!completed && deck.length > 0 && (
          <div className="mx-auto mt-2 h-1.5 max-w-4xl overflow-hidden rounded-full bg-white/5" role="progressbar" aria-label="Session progress" aria-valuenow={currentIndex} aria-valuemin={0} aria-valuemax={deck.length}>
            <div className="h-full rounded-full bg-gradient-to-r from-neon to-indigo-400 transition-all duration-300" style={{ width: `${(currentIndex / deck.length) * 100}%` }} />
          </div>
        )}
      </header>

      <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl">
          {!completed && currentCard ? (
            <div className="space-y-5">
              {/* Flip Card */}
              <div
                role="button"
                tabIndex={0}
                aria-label={showBack ? "Answer shown. Activate to hide." : "Question shown. Activate to reveal the answer."}
                onClick={flip}
                onKeyDown={onCardKeyDown}
                className="flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-white/10 bg-cyber-surface/80 backdrop-blur p-6 text-center shadow-2xl transition-all duration-300 hover:border-neon/30 neon-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon sm:p-8"
              >
                <span className="mb-3 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-neon-bright">
                  {showBack ? "Answer" : "Question"}
                  {currentCard.requirement_ids.map((r) => {
                    const covered = coveredReqIds.has(r);
                    return (
                      <span
                        key={r}
                        title={covered ? "Covered by your question bank" : "No covering question"}
                        className={cn(
                          "rounded-full px-1.5 py-0.5 font-mono normal-case tracking-normal text-[10px]",
                          covered ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
                        )}
                      >
                        {r}{covered ? " ✓" : " !"}
                      </span>
                    );
                  })}
                </span>
                <p className="max-w-[60ch] text-lg font-bold leading-relaxed text-white sm:text-xl">
                  {showBack ? currentCard.back : currentCard.front}
                </p>
                {!showBack && (
                  <span className="mt-6 text-xs text-slate-500">Tap, or press Space, to reveal the answer</span>
                )}
              </div>

              {/* Rating Buttons */}
              {showBack ? (
                <div className="rounded-2xl border border-white/5 bg-cyber-surface/50 backdrop-blur p-5 text-center">
                  <p className="text-xs font-semibold text-slate-400">
                    How confident were you? <span className="text-slate-500">(keys 1–5)</span>
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => handleRate(level)}
                        disabled={saving}
                        title={CONFIDENCE_LABELS[level]}
                        className={cn(
                          "flex min-h-[48px] min-w-[72px] flex-col items-center justify-center gap-0.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon disabled:opacity-50",
                          level <= 2
                            ? "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                            : level === 3
                              ? "border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                              : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                        )}
                      >
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                          {level}
                        </span>
                        <span className="text-[10px] font-medium opacity-80">{CONFIDENCE_LABELS[level]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Button variant="secondary" size="lg" onClick={flip} className="w-full sm:w-auto">
                    Reveal answer
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Results Screen */
            <div className="space-y-6 rounded-2xl border border-white/10 bg-cyber-surface/80 backdrop-blur p-6 text-center shadow-2xl sm:p-8 animate-slide-up">
              <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-400" aria-hidden="true" />
              <h1 className="text-2xl font-bold tracking-tight text-white">Session complete</h1>
              <p className="mx-auto max-w-md text-sm text-slate-400">
                You rated {ratedCount} card{ratedCount === 1 ? "" : "s"} this session. Weak cards sort
                first next time — ratings are saved to your kit.
              </p>
              {weakCards.length > 0 ? (
                <div className="mx-auto max-w-md rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-left">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Weak areas ({weakCards.length})
                  </p>
                  <ul className="mt-3 space-y-2">
                    {weakCards.slice(0, 5).map((c) => (
                      <li key={c.id} className="truncate text-sm text-slate-300" title={c.front}>
                        <span className="mr-2 font-mono text-xs text-amber-400">{c.confidence ?? 0}/5</span>
                        {c.front}
                      </li>
                    ))}
                    {weakCards.length > 5 && (
                      <li className="text-xs text-slate-500">+ {weakCards.length - 5} more</li>
                    )}
                  </ul>
                </div>
              ) : (
                <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                  <Badge variant="success">No weak cards</Badge>
                </p>
              )}
              <div className="flex flex-col justify-center gap-3 pt-3 sm:flex-row">
                {weakCards.length > 0 && !weakOnly && (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => { setWeakOnly(true); setCurrentIndex(0); setShowBack(false); setCompleted(false); setRatedCount(0); }}
                    className="w-full sm:w-auto gap-2"
                  >
                    <Filter className="h-4 w-4" aria-hidden="true" /> Drill weak only ({weakCards.length})
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => { setWeakOnly(false); fetchSession(); }}
                  className="w-full sm:w-auto gap-2"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" /> Practice again
                </Button>
                <Link
                  href={`/kits/${params.id}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neon px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-neon/30 transition-all hover:bg-neon-bright sm:w-auto"
                >
                  Return to kit
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
