"use client";

import * as React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SaveStateIndicator } from "@/components/ui/save-state";
import { CategorySection, type RegenSummary } from "./category-section";
import { AddQuestionDialog } from "./add-question-dialog";
import { useKitBuilder } from "./use-kit-builder";
import {
  QUESTION_CATEGORIES,
  categoryLabel,
  newCustomQuestionId,
  type BuilderQuestion,
  type BuilderRequirement,
  type QuestionCategory,
} from "./types";

function containerOf(id: string, questions: BuilderQuestion[]): QuestionCategory | null {
  if (id.startsWith("droppable-")) return id.replace("droppable-", "") as QuestionCategory;
  return questions.find((q) => q.id === id)?.category ?? null;
}

function idsIn(category: QuestionCategory, questions: BuilderQuestion[]): string[] {
  return questions.filter((q) => q.category === category).map((q) => q.id);
}

/** Rebuild the flat array after a container's order changed, keeping other categories stable. */
function reorderContainer(
  prev: BuilderQuestion[],
  category: QuestionCategory,
  orderedIds: string[]
): BuilderQuestion[] {
  const byId = new Map(prev.map((q) => [q.id, q]));
  const ordered = orderedIds.map((id) => byId.get(id)).filter((q): q is BuilderQuestion => !!q);
  const remaining = new Set(orderedIds);
  const result: BuilderQuestion[] = [];
  for (const q of prev) {
    if (q.category !== category) {
      result.push(q);
    } else if (remaining.size > 0) {
      const next = ordered.find((o) => remaining.has(o.id));
      if (next) {
        remaining.delete(next.id);
        result.push(next);
      }
    }
  }
  // Any leftovers (shouldn't happen) append at the end of their container run.
  for (const q of ordered) {
    if (remaining.has(q.id)) result.push(q);
  }
  return result;
}

export function QuestionBuilder({
  kitId,
  requirements,
  builder,
  onRegenerated,
}: {
  kitId: string;
  requirements: BuilderRequirement[];
  builder: ReturnType<typeof useKitBuilder>;
  /** Refresh server state (schedule/coverage/brief) after regen/reorder persists. */
  onRegenerated: () => void;
}) {
  const { questions, updateQuestions, moveQuestion, moveQuestionToCategory, saveState, hydrate } = builder;

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [addCategory, setAddCategory] = React.useState<QuestionCategory>("technical");
  const [regenTarget, setRegenTarget] = React.useState<QuestionCategory | null>(null);
  const [regenConfirm, setRegenConfirm] = React.useState<QuestionCategory | null>(null);
  const [regenErrors, setRegenErrors] = React.useState<Partial<Record<QuestionCategory, string | null>>>({});
  const [regenSummaries, setRegenSummaries] = React.useState<Partial<Record<QuestionCategory, RegenSummary | null>>>({});

  const sensors = useSensors(
    // Distance constraint: small scrolls still scroll (touch), deliberate drags reorder.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;
    const activeContainer = containerOf(activeId, questions);
    const overContainer = containerOf(overId, questions);
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;
    // Cross-category move during drag: adopt the target category immediately so the
    // card renders in its new home while dragging (standard dnd-kit multi-container).
    updateQuestions((prev) => {
      const activeIdx = prev.findIndex((q) => q.id === activeId);
      if (activeIdx < 0) return prev;
      const overIdx = prev.findIndex((q) => q.id === overId);
      const moved = { ...prev[activeIdx], category: overContainer, user_edited: true };
      const next = [...prev];
      next.splice(activeIdx, 1);
      next.splice(overIdx >= 0 ? overIdx : next.length, 0, moved);
      return next;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const activeContainer = containerOf(activeId, questions);
    const overContainer = containerOf(overId, questions);
    if (!activeContainer || !overContainer) return;
    if (activeContainer !== overContainer) {
      // Category already updated in onDragOver; normalize ordering within the target.
      updateQuestions((prev) => {
        const ids = idsIn(overContainer, prev);
        return reorderContainer(prev, overContainer, ids);
      });
      const moved = questions.find((q) => q.id === activeId);
      toast.success(`Moved to ${categoryLabel(overContainer)}`, {
        description: moved ? truncate(moved.prompt, 80) : undefined,
      });
      return;
    }
    const ids = idsIn(activeContainer, questions);
    const oldIndex = ids.indexOf(activeId);
    const newIndex = ids.indexOf(overId);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
    const reordered = arrayMove(ids, oldIndex, newIndex);
    updateQuestions((prev) => reorderContainer(prev, activeContainer, reordered));
  };

  const handleSaveEdit = (id: string, patch: Partial<BuilderQuestion>) => {
    updateQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
    setEditingId(null);
    toast.success("Question updated", { description: "Marked as edited — it will survive regeneration." });
  };

  const handleDeleteConfirm = () => {
    if (!deleteId) return;
    updateQuestions((prev) => prev.filter((q) => q.id !== deleteId));
    toast.success("Question deleted");
    setDeleteId(null);
  };

  const handleCreate = (draft: {
    category: QuestionCategory;
    prompt: string;
    answer_outline: string;
    requirement_ids: string[];
    difficulty: number;
  }) => {
    const created: BuilderQuestion = {
      id: newCustomQuestionId(),
      requirement_ids: draft.requirement_ids,
      category: draft.category,
      prompt: draft.prompt,
      answer_outline: draft.answer_outline,
      difficulty: draft.difficulty,
      is_custom: true,
      user_edited: false,
    };
    updateQuestions((prev) => [...prev, created]);
    setAddOpen(false);
    toast.success("Custom question added", { description: "Custom questions are never replaced by regeneration." });
  };

  const preservedCount = (category: QuestionCategory) =>
    questions.filter((q) => q.category === category && (q.user_edited || q.is_custom)).length;

  const handleRegenerate = async (category: QuestionCategory) => {
    setRegenConfirm(null);
    setRegenTarget(category);
    setRegenErrors((prev) => ({ ...prev, [category]: null }));
    try {
      const res = await fetch(`/api/kits/${kitId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: category }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || data?.details || "Regeneration failed");
      const fresh: BuilderQuestion[] = data.internalKit?.questions ?? [];
      const beforeIds = new Set(questions.map((q) => q.id));
      const created = fresh.filter((q) => !beforeIds.has(q.id)).length;
      const preserved = fresh.filter(
        (q) => q.category === category && (q.user_edited || q.is_custom)
      ).length;
      hydrate(fresh, data.internalKit?.flashcards ?? builder.flashcards);
      setRegenSummaries((prev) => ({ ...prev, [category]: { created, preserved } }));
      if (created === 0) {
        // Honest empty result: the backend succeeded but returned nothing new.
        // Existing questions are untouched — say so explicitly.
        toast.info(`No new ${categoryLabel(category)} questions returned`, {
          description: `Your existing questions are unchanged · ${preserved} edited preserved`,
        });
      } else {
        toast.success(`${categoryLabel(category)} regenerated`, {
          description: `${created} new · ${preserved} edited preserved`,
        });
      }
      onRegenerated();
    } catch (err: any) {
      setRegenErrors((prev) => ({ ...prev, [category]: err?.message || "Regeneration failed" }));
      toast.error("Regeneration failed", { description: err?.message });
    } finally {
      setRegenTarget(null);
    }
  };

  const regenBusy = regenTarget !== null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          Drag cards to reorder · <span className="text-slate-300">↑↓</span> buttons and the{" "}
          <span className="text-slate-300">move menu</span> work everywhere, including touch and keyboard.
        </p>
        <SaveStateIndicator state={saveState} />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6" aria-live="polite">
          {QUESTION_CATEGORIES.map((category) => (
            <CategorySection
              key={category}
              category={category}
              questions={questions.filter((q) => q.category === category)}
              requirements={requirements}
              editingId={editingId}
              onStartEdit={setEditingId}
              onCancelEdit={() => setEditingId(null)}
              onSaveEdit={handleSaveEdit}
              onDelete={setDeleteId}
              onMove={moveQuestion}
              onMoveCategory={moveQuestionToCategory}
              onAdd={() => {
                setAddCategory(category);
                setAddOpen(true);
              }}
              regenerating={regenTarget === category}
              onRegenerate={() => setRegenConfirm(category)}
              regenError={regenErrors[category] ?? null}
              regenSummary={regenSummaries[category] ?? null}
              onDismissSummary={() =>
                setRegenSummaries((prev) => ({ ...prev, [category]: null }))
              }
              disabled={regenBusy}
            />
          ))}
        </div>
      </DndContext>

      <AddQuestionDialog
        open={addOpen}
        defaultCategory={addCategory}
        requirements={requirements}
        onClose={() => setAddOpen(false)}
        onCreate={handleCreate}
      />

      {/* Delete confirmation — destructive actions are never one-click. */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            aria-describedby="delete-desc"
            className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl"
          >
            <h3 id="delete-title" className="text-base font-bold text-white">
              Delete this question?
            </h3>
            <p id="delete-desc" className="mt-1 text-sm text-slate-400">
              This removes it from your kit and your study schedule. You can regenerate the category
              afterwards to get a replacement.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="secondary" size="md" onClick={() => setDeleteId(null)}>
                Keep it
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-500"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate confirmation — preservation guarantee stated BEFORE acting. */}
      {regenConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="regen-title"
            aria-describedby="regen-desc"
            className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl"
          >
            <h3 id="regen-title" className="text-base font-bold text-white">
              Regenerate {categoryLabel(regenConfirm)} questions?
            </h3>
            <p id="regen-desc" className="mt-1 text-sm text-slate-400">
              Your edited and custom questions will be preserved — only generated questions in this
              category are replaced.{" "}
              {preservedCount(regenConfirm) > 0 && (
                <span className="font-semibold text-amber-300">
                  {preservedCount(regenConfirm)} edited/custom question
                  {preservedCount(regenConfirm) === 1 ? "" : "s"} protected.
                </span>
              )}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="secondary" size="md" onClick={() => setRegenConfirm(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={() => handleRegenerate(regenConfirm)}>
                Regenerate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
