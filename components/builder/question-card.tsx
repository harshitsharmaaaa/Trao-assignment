"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ArrowRightLeft,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  QUESTION_CATEGORIES,
  categoryLabel,
  type BuilderQuestion,
  type BuilderRequirement,
  type QuestionCategory,
} from "./types";

function DifficultyDots({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`Difficulty ${level} of 3`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn("h-1.5 w-1.5 rounded-full", i <= level ? "bg-indigo-400" : "bg-slate-700")}
        />
      ))}
    </span>
  );
}

export function QuestionStateBadges({ question }: { question: BuilderQuestion }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {question.is_custom && <Badge variant="custom">Custom</Badge>}
      {question.user_edited && !question.is_custom && <Badge variant="edited">Edited</Badge>}
      {!question.user_edited && !question.is_custom && (
        <Badge variant="generated">Generated</Badge>
      )}
    </span>
  );
}

export function QuestionCard({
  question,
  requirements,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onMove,
  onMoveCategory,
  disabled,
}: {
  question: BuilderQuestion;
  requirements: BuilderRequirement[];
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (patch: Partial<BuilderQuestion>) => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  onMoveCategory: (category: QuestionCategory) => void;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
    disabled: disabled || isEditing,
  });

  const [draftPrompt, setDraftPrompt] = React.useState(question.prompt);
  const [draftOutline, setDraftOutline] = React.useState(question.answer_outline);
  const [draftReqIds, setDraftReqIds] = React.useState<string[]>(question.requirement_ids);
  const [draftDifficulty, setDraftDifficulty] = React.useState(question.difficulty);
  const [categoryMenuOpen, setCategoryMenuOpen] = React.useState(false);

  // Reset drafts whenever a different question enters edit mode.
  React.useEffect(() => {
    if (isEditing) {
      setDraftPrompt(question.prompt);
      setDraftOutline(question.answer_outline);
      setDraftReqIds(question.requirement_ids);
      setDraftDifficulty(question.difficulty);
    }
  }, [isEditing, question]);

  // Close the category menu on Esc.
  React.useEffect(() => {
    if (!categoryMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCategoryMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [categoryMenuOpen]);

  const toggleReqId = (id: string) => {
    setDraftReqIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  const canSave = draftPrompt.trim().length > 0 && draftReqIds.length > 0;

  return (
    <article
      ref={setNodeRef}
      id={`question-${question.id}`}
      aria-label={`Question ${question.id}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "scroll-mt-32 rounded-lg border bg-slate-900 p-4 transition duration-150",
        isDragging ? "border-indigo-500 shadow-lg shadow-indigo-500/10" : "border-slate-800",
        isEditing && "border-indigo-500/60"
      )}
    >
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label htmlFor={`edit-prompt-${question.id}`} className="block text-xs font-medium text-slate-400">
              Question prompt
            </label>
            <textarea
              id={`edit-prompt-${question.id}`}
              rows={2}
              value={draftPrompt}
              onChange={(e) => setDraftPrompt(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor={`edit-outline-${question.id}`} className="block text-xs font-medium text-slate-400">
              Answer outline
            </label>
            <textarea
              id={`edit-outline-${question.id}`}
              rows={3}
              value={draftOutline}
              onChange={(e) => setDraftOutline(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <fieldset>
            <legend className="text-xs font-medium text-slate-400">Linked requirements</legend>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {requirements.map((r) => {
                const checked = draftReqIds.includes(r.id);
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
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => toggleReqId(r.id)}
                    />
                    <span className="font-mono font-bold text-indigo-400">{r.id}</span>
                    <span className="max-w-40 truncate">{r.text}</span>
                  </label>
                );
              })}
            </div>
            {draftReqIds.length === 0 && (
              <p className="mt-1 text-xs text-red-400">Link at least one requirement.</p>
            )}
          </fieldset>
          <fieldset>
            <legend className="text-xs font-medium text-slate-400">Difficulty</legend>
            <div className="mt-1.5 flex gap-1.5" role="radiogroup" aria-label="Difficulty">
              {[1, 2, 3].map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={draftDifficulty === d}
                  onClick={() => setDraftDifficulty(d)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                    draftDifficulty === d
                      ? "border-indigo-500 bg-indigo-600/15 text-white"
                      : "border-slate-700 text-slate-400 hover:border-slate-600"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={onCancelEdit}>
              <X className="h-3.5 w-3.5" aria-hidden="true" /> Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!canSave}
              onClick={() =>
                onSaveEdit({
                  prompt: draftPrompt.trim(),
                  answer_outline: draftOutline,
                  requirement_ids: draftReqIds,
                  difficulty: draftDifficulty,
                  user_edited: true,
                })
              }
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" /> Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              {/* Drag handle: the ONLY drag activator; everything else stays interactive. */}
              <button
                type="button"
                aria-label={`Drag to reorder question ${question.id}. Press Space to lift, arrow keys to move, Space to drop.`}
                className="cursor-grab touch-none rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="font-mono text-xs font-bold text-indigo-400">{question.id}</span>
              <span className="hidden text-xs text-slate-500 sm:inline" title={question.requirement_ids.join(", ")}>
                [{question.requirement_ids.join(", ")}]
              </span>
              <QuestionStateBadges question={question} />
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
              {/* Keyboard / touch reorder: the guaranteed non-drag alternative. */}
              <button
                type="button"
                onClick={() => onMove(-1)}
                aria-label={`Move question ${question.id} up`}
                title="Move up"
                className="rounded p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onMove(1)}
                aria-label={`Move question ${question.id} down`}
                title="Move down"
                className="rounded p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCategoryMenuOpen((o) => !o)}
                  aria-label={`Move question ${question.id} to another category`}
                  aria-expanded={categoryMenuOpen}
                  aria-haspopup="menu"
                  title="Move to category"
                  className="rounded p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                {categoryMenuOpen && (
                  <div
                    role="menu"
                    aria-label="Move to category"
                    className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-slate-700 bg-slate-950 p-1 shadow-xl"
                  >
                    {QUESTION_CATEGORIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        role="menuitemradio"
                        aria-checked={c === question.category}
                        disabled={c === question.category}
                        onClick={() => {
                          onMoveCategory(c);
                          setCategoryMenuOpen(false);
                        }}
                        className="block w-full rounded-md px-3 py-2 text-left text-xs capitalize text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      >
                        {categoryLabel(c)}
                        {c === question.category && " (current)"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={onStartEdit}
                aria-label={`Edit question ${question.id}`}
                title="Edit"
                className="rounded p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                aria-label={`Delete question ${question.id}`}
                title="Delete"
                className="rounded p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <p className="pl-8 text-[15px] font-semibold leading-snug text-white">{question.prompt}</p>
          <div className="ml-8 rounded-lg border border-slate-800/60 bg-slate-950/60 p-2.5">
            <p className="text-xs leading-relaxed text-slate-400">
              <span className="mb-1 block font-semibold text-slate-500">Answer outline</span>
              {question.answer_outline}
            </p>
          </div>
          <div className="flex items-center gap-3 pl-8">
            <DifficultyDots level={question.difficulty} />
          </div>
        </div>
      )}
    </article>
  );
}
