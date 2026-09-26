"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, BookOpen, Clock, AlertCircle, CheckCircle2, Trash2, X, CalendarDays, Target } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { LandingPage } from "@/components/landing/landing-page";
import { daysRemaining } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCardList } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KitSummary {
  _id: string;
  kitId: string;
  status: "queued" | "running" | "ok" | "failed";
  progressStage?: string;
  progressMessage?: string;
  source?: {
    company?: string;
    role?: string;
    company_url?: string;
  };
  daysRequested: number;
  createdAt: string;
  summary?: {
    requirementsTotal: number;
    mustTotal: number;
    mustCovered: number;
    mustUncovered: number;
    questionsTotal: number;
    flashcardsTotal: number;
  };
}

function StatusBadge({ status }: { status: KitSummary["status"] }) {
  if (status === "ok") {
    return (
      <Badge variant="success">
        <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Ready
      </Badge>
    );
  }
  if (status === "running" || status === "queued") {
    return (
      <Badge variant="warning" className="status-pulse">
        <Clock className="h-3 w-3" aria-hidden="true" /> Generating
      </Badge>
    );
  }
  return (
    <Badge variant="danger">
      <AlertCircle className="h-3 w-3" aria-hidden="true" /> Failed
    </Badge>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ userId: string; email: string } | null>(null);
  const [kits, setKits] = useState<KitSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [jd, setJd] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [days, setDays] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUserAndKits();
  }, []);

  const fetchUserAndKits = async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        setUser(null);
        setKits([]);
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      const kitsRes = await fetch("/api/kits");
      if (kitsRes.ok) {
        const kitsData = await kitsRes.json();
        setKits(kitsData.kits || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGenerating(true);

    try {
      const res = await fetch("/api/kits/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jd,
          company_url: companyUrl,
          days,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate generation");
      }

      setIsModalOpen(false);
      setJd("");
      setCompanyUrl("");
      toast.success("Kit generation started");
      router.push(`/kits/${data.kitId}`);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "Failed to start generation");
    } finally {
      setGenerating(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleDeleteKit = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/kits/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setKits((prev) => prev.filter((k) => k.kitId !== deleteId));
      toast.success("Kit deleted");
    } catch (err: any) {
      toast.error("Could not delete kit", { description: err?.message });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const inPrep = kits.filter((k) => k.status === "running" || k.status === "queued");
  const readyKits = kits.filter((k) => k.status === "ok" && k.summary && k.summary.mustTotal > 0);
  const avgMustCoverage =
    readyKits.length === 0
      ? null
      : Math.round(
          (readyKits.reduce((n, k) => n + k.summary!.mustCovered / Math.max(1, k.summary!.mustTotal), 0) /
            readyKits.length) *
            100
        );
  const activeKits = kits.filter((k) => k.status !== "failed");
  const nextInterview =
    activeKits.length === 0 ? null : Math.min(...activeKits.map((k) => daysRemaining(k)));

  if (loading) {
    return (
      <AppShell email={null} onSignOut={handleLogout} breadcrumbs={[{ label: "My Kits" }]}>
        <SkeletonCardList rows={3} />
      </AppShell>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <AppShell
      email={user?.email}
      onSignOut={handleLogout}
      breadcrumbs={[{ label: "My Kits" }]}
      onNewKit={() => setIsModalOpen(true)}
    >
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Your Interview Prep Kits</h1>
          <p className="mt-1 text-sm text-slate-400">
            Generate personalized company briefs, role breakdowns, question banks, flashcards, and study schedules.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Prep Kit
        </Button>
      </div>

      {/* Stats strip */}
      {kits.length > 0 && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3" role="region" aria-label="Preparation overview">
          <div className="rounded-2xl border border-white/5 bg-cyber-surface/50 backdrop-blur p-5 transition-all duration-300 hover:border-neon/20">
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Kits in preparation
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-white">{inPrep.length}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-cyber-surface/50 backdrop-blur p-5 transition-all duration-300 hover:border-neon/20">
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> Next interview in
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-white">
              {nextInterview === null ? "—" : `${nextInterview} day${nextInterview === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-cyber-surface/50 backdrop-blur p-5 transition-all duration-300 hover:border-neon/20">
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Target className="h-3.5 w-3.5" aria-hidden="true" /> Avg MUST coverage
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-white">
              {avgMustCoverage === null ? "—" : `${avgMustCoverage}%`}
            </p>
          </div>
        </div>
      )}

      {/* Kit grid */}
      {kits.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-12 w-12" aria-hidden="true" />}
          title="No prep kits generated yet"
          description="Paste a job description, provide the company website, and specify your prep timeframe to get started."
          action={
            <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create your first kit
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {kits.map((kit) => {
            const remaining = daysRemaining(kit);
            const resumeLabel = kit.status === "ok" ? "Continue prep" : kit.status === "failed" ? "View error" : "View progress";
            return (
              <article
                key={kit.kitId}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/5 bg-cyber-surface/50 backdrop-blur p-6 transition-all duration-300 hover:border-neon/30 hover:shadow-neon cyber-card"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold uppercase tracking-wider text-neon-bright">
                      {kit.source?.company || "Company Research"}
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <StatusBadge status={kit.status} />
                      <button
                        onClick={() => setDeleteId(kit.kitId)}
                        aria-label={`Delete kit ${kit.source?.role || kit.kitId}`}
                        title="Delete kit"
                        className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </span>
                  </div>

                  <Link
                    href={`/kits/${kit.kitId}`}
                    className="mt-3 block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon"
                    aria-label={`${resumeLabel}: ${kit.source?.role || "Untitled Preparation Kit"}`}
                  >
                    <h3 className="text-lg font-bold text-white transition-colors group-hover:text-neon-bright">
                      {kit.source?.role || "Untitled Preparation Kit"}
                    </h3>
                  </Link>

                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">{kit.source?.company_url}</p>

                  {kit.status === "ok" && kit.summary && (
                    <div className="mt-4">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>
                          MUST {kit.summary.mustCovered}/{kit.summary.mustTotal} · {kit.summary.questionsTotal} questions ·{" "}
                          {kit.summary.flashcardsTotal} cards
                        </span>
                      </div>
                      <div
                        className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5"
                        role="progressbar"
                        aria-label={`MUST coverage for ${kit.source?.role || "kit"}`}
                        aria-valuenow={kit.summary.mustCovered}
                        aria-valuemin={0}
                        aria-valuemax={Math.max(1, kit.summary.mustTotal)}
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-neon to-emerald-400 transition-all duration-500"
                          style={{ width: `${kit.summary.mustTotal === 0 ? 100 : (kit.summary.mustCovered / kit.summary.mustTotal) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {(kit.status === "running" || kit.status === "queued") && kit.progressMessage && (
                    <p className="mt-4 truncate text-[11px] text-amber-400">{kit.progressMessage}</p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1 tabular-nums">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {remaining === 0 ? "Interview now" : `${remaining} day${remaining === 1 ? "" : "s"} left`}
                  </span>
                  <Link
                    href={`/kits/${kit.kitId}`}
                    className="font-semibold text-neon-bright transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon rounded-lg"
                  >
                    {resumeLabel} →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Create Kit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-0 sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-kit-title"
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/10 bg-cyber-surface/95 backdrop-blur-xl p-6 shadow-2xl sm:rounded-3xl animate-slide-up"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 id="create-kit-title" className="text-xl font-bold text-white">
                Create New Interview Prep Kit
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon"
              >
                ✕
              </button>
            </div>

            {error && (
              <div role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateKit} className="mt-6 space-y-5">
              <div>
                <label htmlFor="create-jd" className="block text-sm font-medium text-slate-300">
                  Job Description (pasted text)
                </label>
                <textarea
                  id="create-jd"
                  required
                  rows={6}
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  aria-describedby="create-jd-hint"
                  className="mt-1.5 block w-full rounded-xl border border-white/10 bg-cyber-bg/50 p-4 text-sm text-white placeholder-slate-500 backdrop-blur transition-colors focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/30"
                  placeholder="Paste the complete job description here..."
                />
                <p id="create-jd-hint" className="mt-1.5 flex justify-between text-xs text-slate-500">
                  <span>Paste the full posting for the best requirements.</span>
                  <span className="tabular-nums">{jd.length} chars</span>
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="create-url" className="block text-sm font-medium text-slate-300">
                    Company Website URL
                  </label>
                  <input
                    id="create-url"
                    type="url"
                    required
                    value={companyUrl}
                    onChange={(e) => setCompanyUrl(e.target.value)}
                    className="mt-1.5 block w-full rounded-xl border border-white/10 bg-cyber-bg/50 p-3 text-sm text-white placeholder-slate-500 backdrop-blur transition-colors focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/30"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label htmlFor="create-days" className="block text-sm font-medium text-slate-300">
                    Days Until Interview
                  </label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      aria-label="One fewer day"
                      onClick={() => setDays((d) => Math.max(1, d - 1))}
                    >
                      −
                    </Button>
                    <input
                      id="create-days"
                      type="number"
                      min={1}
                      max={60}
                      required
                      value={days}
                      onChange={(e) => setDays(Math.min(60, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="block w-full rounded-xl border border-white/10 bg-cyber-bg/50 p-3 text-center text-sm tabular-nums text-white backdrop-blur transition-colors focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/30"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      aria-label="One more day"
                      onClick={() => setDays((d) => Math.min(60, d + 1))}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col-reverse justify-end gap-3 border-t border-white/5 pt-6 sm:flex-row">
                <Button type="button" variant="secondary" size="md" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" loading={generating} className="w-full sm:w-auto gap-2">
                  {generating ? "Starting Research…" : "Generate Prep Kit"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-kit-title"
            aria-describedby="delete-kit-desc"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-cyber-surface/95 backdrop-blur-xl p-6 shadow-2xl"
          >
            <h3 id="delete-kit-title" className="flex items-center gap-2 text-base font-bold text-white">
              <Trash2 className="h-4 w-4 text-red-400" aria-hidden="true" /> Delete this kit?
            </h3>
            <p id="delete-kit-desc" className="mt-2 text-sm text-slate-400">
              All questions, flashcards, progress and practice history will be permanently removed.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" size="md" onClick={() => setDeleteId(null)} disabled={deleting}>
                <X className="h-3.5 w-3.5" aria-hidden="true" /> Keep it
              </Button>
              <Button variant="primary" size="md" onClick={handleDeleteKit} loading={deleting} className="bg-red-500 hover:bg-red-400 shadow-red-500/20">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
