"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, BookOpen, Clock, AlertCircle, LogOut, FileText, CheckCircle2 } from "lucide-react";

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

  useEffect(() => {
    fetchUserAndKits();
  }, []);

  const fetchUserAndKits = async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        router.push("/login");
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
      router.push(`/kits/${data.kitId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-slate-400">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Top Header Navigation */}
      <header className="border-b border-slate-800 bg-slate-950 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-600 p-2 font-bold text-white">Trao</div>
            <h1 className="text-xl font-bold tracking-tight text-white">AI Interview Prep Kit</h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Your Interview Prep Kits</h2>
            <p className="mt-1 text-sm text-slate-400">
              Generate personalized company briefs, role breakdowns, question banks, flashcards, and study schedules.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            New Prep Kit
          </button>
        </div>

        {/* List of Owned Kits */}
        {kits.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/50 p-12 text-center">
            <BookOpen className="mb-4 h-12 w-12 text-slate-600" />
            <h3 className="text-lg font-semibold text-white">No prep kits generated yet</h3>
            <p className="mt-1 max-w-md text-sm text-slate-400">
              Paste a job description, provide the company website, and specify your prep timeframe to get started.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              Create your first kit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {kits.map((kit) => (
              <Link
                key={kit.kitId}
                href={`/kits/${kit.kitId}`}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-md transition hover:border-indigo-500/50 hover:shadow-indigo-500/10"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                      {kit.source?.company || "Company Research"}
                    </span>
                    {kit.status === "ok" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Ready
                      </span>
                    ) : kit.status === "running" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 animate-pulse">
                        <Clock className="h-3 w-3" /> Generating
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
                        <AlertCircle className="h-3 w-3" /> Failed
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-white group-hover:text-indigo-300">
                    {kit.source?.role || "Untitled Preparation Kit"}
                  </h3>

                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                    {kit.source?.company_url}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {kit.daysRequested} Days Plan
                  </span>
                  <span>{new Date(kit.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Kit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">Create New Interview Prep Kit</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateKit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">Job Description (pasted text)</label>
                <textarea
                  required
                  rows={6}
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 p-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="Paste the complete job description here..."
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Company Website URL</label>
                  <input
                    type="url"
                    required
                    value={companyUrl}
                    onChange={(e) => setCompanyUrl(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300">Days Until Interview</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    required
                    value={days}
                    onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                    className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {generating ? "Starting Research..." : "Generate Prep Kit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
