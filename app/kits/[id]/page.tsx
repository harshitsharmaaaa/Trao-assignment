"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  RotateCw,
  Play,
  Trash2,
  Edit2,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export default function KitDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [editOutline, setEditOutline] = useState("");

  useEffect(() => {
    fetchKitData();

    // Auto-poll status if kit is running
    const interval = setInterval(() => {
      if (data && (data.status === "running" || data.status === "queued")) {
        fetchKitData();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [data?.status]);

  const fetchKitData = async () => {
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
  };

  const handleRegenerateSection = async (section: string) => {
    setRegeneratingSection(section);
    try {
      const res = await fetch(`/api/kits/${params.id}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section }),
      });

      if (res.ok) {
        await fetchKitData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRegeneratingSection(null);
    }
  };

  const handleSaveQuestionEdit = async (questionId: string) => {
    if (!data?.internalKit) return;
    const updatedQuestions = data.internalKit.questions.map((q: any) => {
      if (q.id === questionId) {
        return {
          ...q,
          prompt: editPrompt,
          answer_outline: editOutline,
          user_edited: true,
        };
      }
      return q;
    });

    try {
      const res = await fetch(`/api/kits/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: updatedQuestions }),
      });
      if (res.ok) {
        setEditingQuestionId(null);
        await fetchKitData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!data?.internalKit) return;
    const updatedQuestions = data.internalKit.questions.filter((q: any) => q.id !== questionId);
    try {
      const res = await fetch(`/api/kits/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: updatedQuestions }),
      });
      if (res.ok) await fetchKitData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveQuestionCategory = async (questionId: string, newCategory: string) => {
    if (!data?.internalKit) return;
    const updatedQuestions = data.internalKit.questions.map((q: any) => {
      if (q.id === questionId) {
        return { ...q, category: newCategory, user_edited: true };
      }
      return q;
    });

    try {
      const res = await fetch(`/api/kits/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: updatedQuestions }),
      });
      if (res.ok) await fetchKitData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Loading kit details...
      </div>
    );
  }

  const internalKit = data?.internalKit;
  const externalKit = data?.kit;

  // View 1: Generation in Progress
  if (data?.status === "running" || data?.status === "queued") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-6 text-center">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-950 p-8 shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400 animate-spin">
            <Sparkles className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Generating Your Prep Kit</h2>
            <p className="mt-2 text-sm text-indigo-400 font-medium">
              Stage: {data.progress?.stage || "Processing"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {data.progress?.message || "Researching company website and generating role breakdown..."}
            </p>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
            <div className="bg-indigo-500 h-full animate-pulse w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  // View 2: Fatal Failure
  if (data?.status === "failed") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-6 text-center">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-red-500/30 bg-slate-950 p-8 shadow-2xl">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h2 className="text-xl font-bold text-white">Generation Failed</h2>
          <p className="text-sm text-slate-400">{data.error?.message || "Could not generate kit."}</p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // View 3: Complete Reshapeable Builder View
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-16">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white">{externalKit?.source?.role || "Interview Prep Kit"}</h1>
              <p className="text-xs text-indigo-400">{externalKit?.source?.company}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/kits/${params.id}/practice`}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 shadow-md"
            >
              <Play className="h-4 w-4 fill-white" />
              Practice Flashcards
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-10">
        {/* Source & Research Badges */}
        <section className="rounded-xl border border-slate-800 bg-slate-950 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Research Summary</span>
              <h2 className="text-2xl font-bold text-white mt-1">{externalKit?.source?.company}</h2>
              <a
                href={externalKit?.source?.company_url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-400 hover:underline"
              >
                {externalKit?.source?.company_url} <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="flex gap-4 text-xs text-slate-400">
              <div className="rounded-lg bg-slate-900 p-3">
                <span className="block text-slate-500 font-medium">JD Characters</span>
                <span className="text-sm font-bold text-white">{externalKit?.source?.jd_chars}</span>
              </div>
              <div className="rounded-lg bg-slate-900 p-3">
                <span className="block text-slate-500 font-medium">Pages Crawled</span>
                <span className="text-sm font-bold text-white">{externalKit?.source?.pages_used?.length || 0}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Company Brief */}
        <section className="rounded-xl border border-slate-800 bg-slate-950 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              Company Brief
            </h3>
            <button
              onClick={() => handleRegenerateSection("company_brief")}
              disabled={regeneratingSection === "company_brief"}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white disabled:opacity-50"
            >
              <RotateCw className={`h-3.5 w-3.5 ${regeneratingSection === "company_brief" ? "animate-spin" : ""}`} />
              Regenerate Brief
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="rounded-lg bg-slate-900 p-4">
              <h4 className="font-semibold text-indigo-300 mb-1">Company Summary</h4>
              <p className="text-slate-300 leading-relaxed">{externalKit?.company_brief?.summary}</p>
            </div>
            <div className="rounded-lg bg-slate-900 p-4">
              <h4 className="font-semibold text-indigo-300 mb-1">What They Do</h4>
              <p className="text-slate-300 leading-relaxed">{externalKit?.company_brief?.what_they_do}</p>
            </div>
          </div>
        </section>

        {/* Role Breakdown & Extracted Requirements */}
        <section className="rounded-xl border border-slate-800 bg-slate-950 p-6 space-y-4">
          <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
            Extracted Role Requirements ({externalKit?.role?.requirements?.length || 0})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {externalKit?.role?.requirements?.map((req: any) => (
              <div key={req.id} className="flex items-start justify-between rounded-lg border border-slate-800 bg-slate-900 p-3">
                <div>
                  <span className="text-xs font-bold text-indigo-400 uppercase mr-2">{req.id}</span>
                  <span className="text-sm text-slate-200">{req.text}</span>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${req.priority === "must" ? "bg-red-500/20 text-red-300" : "bg-slate-700 text-slate-300"}`}>
                    {req.priority}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-400 rounded">
                    {req.kind}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Question Bank with Category Regeneration */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Categorized Question Bank</h3>
          </div>

          {["technical", "system-design", "behavioural", "company-fit"].map((category) => {
            const categoryQuestions = internalKit?.questions?.filter((q: any) => q.category === category) || [];
            return (
              <div key={category} className="rounded-xl border border-slate-800 bg-slate-950 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-md font-bold text-white capitalize flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                    {category.replace("-", " ")} Questions ({categoryQuestions.length})
                  </h4>
                  <button
                    onClick={() => handleRegenerateSection(category)}
                    disabled={regeneratingSection === category}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white disabled:opacity-50"
                  >
                    <RotateCw className={`h-3.5 w-3.5 ${regeneratingSection === category ? "animate-spin" : ""}`} />
                    Regenerate Category
                  </button>
                </div>

                <div className="space-y-4">
                  {categoryQuestions.map((q: any) => (
                    <div key={q.id} className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-2">
                      {editingQuestionId === q.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            className="w-full rounded bg-slate-950 p-2 text-sm text-white border border-slate-700"
                          />
                          <textarea
                            rows={3}
                            value={editOutline}
                            onChange={(e) => setEditOutline(e.target.value)}
                            className="w-full rounded bg-slate-950 p-2 text-sm text-slate-300 border border-slate-700"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingQuestionId(null)}
                              className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveQuestionEdit(q.id)}
                              className="px-3 py-1 text-xs bg-indigo-600 text-white rounded font-medium"
                            >
                              Save Edit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-indigo-400">{q.id}</span>
                              <span className="text-xs text-slate-500">Requirements: [{q.requirement_ids.join(", ")}]</span>
                              {q.user_edited && (
                                <span className="px-1.5 py-0.5 text-[9px] bg-amber-500/20 text-amber-300 font-bold rounded">
                                  User Edited (Preserved)
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Move category selector */}
                              <select
                                value={q.category}
                                onChange={(e) => handleMoveQuestionCategory(q.id, e.target.value)}
                                className="bg-slate-950 text-xs text-slate-400 rounded border border-slate-800 px-2 py-1"
                              >
                                <option value="technical">Technical</option>
                                <option value="system-design">System Design</option>
                                <option value="behavioural">Behavioural</option>
                                <option value="company-fit">Company Fit</option>
                              </select>

                              <button
                                onClick={() => {
                                  setEditingQuestionId(q.id);
                                  setEditPrompt(q.prompt);
                                  setEditOutline(q.answer_outline);
                                }}
                                className="text-slate-400 hover:text-white p-1"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="text-slate-400 hover:text-red-400 p-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-sm font-semibold text-white">{q.prompt}</p>
                          <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/50 p-2.5 rounded border border-slate-800/50">
                            <span className="font-semibold text-slate-500 block mb-1">Answer Outline:</span>
                            {q.answer_outline}
                          </p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* Study Schedule */}
        <section className="rounded-xl border border-slate-800 bg-slate-950 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-lg font-bold text-white">Day-by-Day Study Schedule</h3>
              <p className="text-xs text-slate-400">Allocated deterministically across {externalKit?.schedule?.days_available} days</p>
            </div>
          </div>

          <div className="space-y-3">
            {externalKit?.schedule?.days?.map((day: any) => (
              <div key={day.day} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-4">
                <div>
                  <span className="text-xs font-bold text-indigo-400 uppercase">Day {day.day}</span>
                  <h4 className="text-sm font-semibold text-white mt-0.5">{day.focus}</h4>
                  <p className="text-xs text-slate-500 mt-1">Questions: [{day.question_ids?.join(", ")}]</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Clock className="h-4 w-4 text-slate-500" />
                  {day.minutes} mins
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Deterministic Coverage Summary */}
        <section className="rounded-xl border border-slate-800 bg-slate-950 p-6">
          <h3 className="text-md font-bold text-white border-b border-slate-800 pb-3 mb-4">
            Deterministic Coverage Status
          </h3>
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-xs text-slate-500 block">Passes Executed</span>
              <span className="font-bold text-white">{externalKit?.coverage?.passes} / 2</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Uncovered MUST Requirements</span>
              {externalKit?.coverage?.uncovered_requirement_ids?.length === 0 ? (
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" /> 100% MUST Covered
                </span>
              ) : (
                <span className="font-semibold text-red-400">
                  [{externalKit?.coverage?.uncovered_requirement_ids?.join(", ")}]
                </span>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
