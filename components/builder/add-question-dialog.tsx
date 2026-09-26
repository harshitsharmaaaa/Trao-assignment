"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  QUESTION_CATEGORIES,
  categoryLabel,
  type BuilderRequirement,
  type QuestionCategory,
} from "./types";

export function AddQuestionDialog({
  open,
  defaultCategory,
  requirements,
  onClose,
  onCreate,
}: {
  open: boolean;
  defaultCategory: QuestionCategory;
  requirements: BuilderRequirement[];
  onClose: () => void;
  onCreate: (draft: {
    category: QuestionCategory;
    prompt: string;
    answer_outline: string;
    requirement_ids: string[];
    difficulty: number;
  }) => void;
}) {
  const [category, setCategory] = React.useState<QuestionCategory>(defaultCategory);
  const [prompt, setPrompt] = React.useState("");
  const [outline, setOutline] = React.useState("");
  const [reqIds, setReqIds] = React.useState<string[]>(requirements[0] ? [requirements[0].id] : []);
  const [difficulty, setDifficulty] = React.useState(2);

  // Reset the form every time the dialog opens.
  React.useEffect(() => {
    if (open) {
      setCategory(defaultCategory);
      setPrompt("");
      setOutline("");
      setReqIds(requirements[0] ? [requirements[0].id] : []);
      setDifficulty(2);
    }
  }, [open, defaultCategory, requirements]);

  // Esc closes.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const toggleReq = (id: string) =>
    setReqIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  const canCreate = prompt.trim().length > 0 && reqIds.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-question-title"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl sm:rounded-2xl"
      >
        <h3 id="add-question-title" className="border-b border-slate-800 pb-4 text-lg font-bold text-white">
          Add custom question
        </h3>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="add-category" className="block text-sm font-medium text-slate-300">
              Category
            </label>
            <select
              id="add-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as QuestionCategory)}
              className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              {QUESTION_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel(c)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="add-prompt" className="block text-sm font-medium text-slate-300">
              Question prompt
            </label>
            <textarea
              id="add-prompt"
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. How would you design a rate limiter for this API?"
              className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 p-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="add-outline" className="block text-sm font-medium text-slate-300">
              Answer outline
            </label>
            <textarea
              id="add-outline"
              rows={3}
              value={outline}
              onChange={(e) => setOutline(e.target.value)}
              placeholder="Key points a strong answer should cover…"
              className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 p-3 text-sm text-slate-300 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-slate-300">Linked requirements</legend>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {requirements.map((r) => {
                const checked = reqIds.includes(r.id);
                return (
                  <label
                    key={r.id}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition",
                      checked
                        ? "border-indigo-500 bg-indigo-600/15 text-white"
                        : "border-slate-700 text-slate-400 hover:border-slate-600"
                    )}
                  >
                    <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleReq(r.id)} />
                    <span className="font-mono font-bold text-indigo-400">{r.id}</span>
                    <span className="max-w-40 truncate">{r.text}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-slate-300">Difficulty</legend>
            <div className="mt-1.5 flex gap-1.5" role="radiogroup" aria-label="Difficulty">
              {[1, 2, 3].map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={difficulty === d}
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                    difficulty === d
                      ? "border-indigo-500 bg-indigo-600/15 text-white"
                      : "border-slate-700 text-slate-400 hover:border-slate-600"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="mt-6 flex flex-col-reverse justify-end gap-3 border-t border-slate-800 pt-4 sm:flex-row">
          <Button variant="secondary" size="md" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={!canCreate}
            onClick={() =>
              onCreate({
                category,
                prompt: prompt.trim(),
                answer_outline: outline,
                requirement_ids: reqIds,
                difficulty,
              })
            }
            className="w-full sm:w-auto"
          >
            Add question
          </Button>
        </div>
      </div>
    </div>
  );
}
