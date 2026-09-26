"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Code2, Network, MessagesSquare, Building2, Plus, RotateCw, CheckCircle2, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { QuestionCard } from "./question-card";
import {
  categoryLabel,
  type BuilderQuestion,
  type BuilderRequirement,
  type QuestionCategory,
} from "./types";

const CATEGORY_ICONS: Record<QuestionCategory, typeof Code2> = {
  technical: Code2,
  "system-design": Network,
  behavioural: MessagesSquare,
  "company-fit": Building2,
};

export interface RegenSummary {
  created: number;
  preserved: number;
}

export function CategorySection({
  category,
  questions,
  requirements,
  editingId,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onMove,
  onMoveCategory,
  onAdd,
  regenerating,
  onRegenerate,
  regenError,
  regenSummary,
  onDismissSummary,
  disabled,
}: {
  category: QuestionCategory;
  questions: BuilderQuestion[];
  requirements: BuilderRequirement[];
  editingId: string | null;
  onStartEdit: (id: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string, patch: Partial<BuilderQuestion>) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onMoveCategory: (id: string, category: QuestionCategory) => void;
  onAdd: () => void;
  regenerating: boolean;
  onRegenerate: () => void;
  regenError: string | null;
  regenSummary: RegenSummary | null;
  onDismissSummary: () => void;
  disabled?: boolean;
}) {
  // Empty categories are droppable so cards can be dragged back into them.
  const { setNodeRef, isOver } = useDroppable({ id: `droppable-${category}` });
  const Icon = CATEGORY_ICONS[category];

  return (
    <section aria-labelledby={`cat-heading-${category}`} className="rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <h3 id={`cat-heading-${category}`} className="flex items-center gap-2 text-base font-bold text-white">
          <Icon className="h-4 w-4 text-indigo-400" aria-hidden="true" />
          <span className="capitalize">{categoryLabel(category)}</span>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-300">
            {questions.length}
          </span>
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onAdd} disabled={disabled}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add
          </Button>
          <Button variant="ghost" size="sm" onClick={onRegenerate} loading={regenerating} disabled={disabled}>
            <RotateCw className="h-3.5 w-3.5" aria-hidden="true" /> Regenerate
          </Button>
        </div>
      </div>

      {regenSummary && (
        <div
          role="status"
          className="mt-3 flex items-start justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            {regenSummary.created} new question{regenSummary.created === 1 ? "" : "s"} generated ·{" "}
            {regenSummary.preserved} edited question{regenSummary.preserved === 1 ? "" : "s"} preserved
          </span>
          <button
            onClick={onDismissSummary}
            aria-label="Dismiss regeneration summary"
            className="rounded p-1 hover:bg-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {regenError && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Regeneration failed: {regenError}{" "}
            <button onClick={onRegenerate} className="font-semibold underline hover:text-red-200">
              Retry
            </button>
          </span>
        </div>
      )}

      <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`mt-4 space-y-3 rounded-lg transition ${isOver ? "outline outline-2 outline-indigo-500/60" : ""} ${questions.length === 0 ? "min-h-24" : ""}`}
        >
          {questions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              requirements={requirements}
              isEditing={editingId === q.id}
              onStartEdit={() => onStartEdit(q.id)}
              onCancelEdit={onCancelEdit}
              onSaveEdit={(patch) => onSaveEdit(q.id, patch)}
              onDelete={() => onDelete(q.id)}
              onMove={(dir) => onMove(q.id, dir)}
              onMoveCategory={(c) => onMoveCategory(q.id, c)}
              disabled={disabled}
            />
          ))}
          {questions.length === 0 && (
            <EmptyState
              icon={<Icon className="h-8 w-8" aria-hidden="true" />}
              title={`No ${categoryLabel(category)} questions yet`}
              description="Add one manually, move one here from another category, or regenerate this section."
              action={
                <Button variant="secondary" size="sm" onClick={onAdd}>
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add question
                </Button>
              }
              className="border-solid p-8"
            />
          )}
        </div>
      </SortableContext>
    </section>
  );
}
