"use client";

import * as React from "react";
import { toast } from "sonner";
import type { SaveState } from "@/components/ui/save-state";
import type { BuilderFlashcard, BuilderQuestion, QuestionCategory } from "./types";

const SAVE_DEBOUNCE_MS = 800;

interface PersistEnvelope {
  internalKit: {
    questions: BuilderQuestion[];
    flashcards: BuilderFlashcard[];
  } | null;
}

interface BuilderState {
  questions: BuilderQuestion[];
  flashcards: BuilderFlashcard[];
}

/**
 * Builder state: optimistic local questions/flashcards with debounced persistence.
 * The backend remains authoritative — every persist returns the canonical
 * internalKit (with recomputed schedule/coverage), which reconciles local state.
 * Mutations are pure state updates; persistence is scheduled by an effect, so no
 * backend call ever happens per keystroke or inside a state updater.
 */
export function useKitBuilder(kitId: string) {
  const [state, setState] = React.useState<BuilderState>({ questions: [], flashcards: [] });
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const [hydrated, setHydrated] = React.useState(false);

  const stateRef = React.useRef(state);
  stateRef.current = state;
  const suppressRef = React.useRef(false);
  // Monotonic generation: a slower persist response never overwrites newer state.
  const generationRef = React.useRef(0);

  const persistSnapshot = React.useCallback(
    async (snapshot: BuilderState) => {
      const generation = ++generationRef.current;
      setSaveState("saving");
      try {
        const res = await fetch(`/api/kits/${kitId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questions: snapshot.questions, flashcards: snapshot.flashcards }),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Save failed");
        const data = (await res.json()) as PersistEnvelope;
        if (generation !== generationRef.current) return; // stale response
        if (data.internalKit) {
          suppressRef.current = true;
          setState({
            questions: data.internalKit.questions ?? snapshot.questions,
            flashcards: data.internalKit.flashcards ?? snapshot.flashcards,
          });
        }
        setSaveState("saved");
      } catch (err: any) {
        if (generation !== generationRef.current) return; // stale response
        setSaveState("failed");
        toast.error("Could not save changes", {
          description: err?.message || "Your edits are kept locally.",
          action: { label: "Retry", onClick: () => persistSnapshot(stateRef.current) },
        });
      }
    },
    [kitId]
  );

  // Debounced persistence: runs only for user mutations, never for hydration
  // or server reconciliation (both set suppressRef).
  React.useEffect(() => {
    if (!hydrated) return;
    if (suppressRef.current) {
      suppressRef.current = false;
      return;
    }
    setSaveState("saving");
    const timer = setTimeout(() => {
      persistSnapshot(stateRef.current);
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [state, hydrated, persistSnapshot]);

  /** Replace local state with authoritative server state (initial load, regen). */
  const hydrate = React.useCallback((questions: BuilderQuestion[], flashcards: BuilderFlashcard[]) => {
    generationRef.current += 1; // invalidate in-flight persists
    suppressRef.current = true;
    setState({ questions, flashcards });
    setSaveState("idle");
    setHydrated(true);
  }, []);

  const updateQuestions = React.useCallback((updater: (prev: BuilderQuestion[]) => BuilderQuestion[]) => {
    setState((prev) => ({ ...prev, questions: updater(prev.questions) }));
  }, []);

  const updateFlashcards = React.useCallback((updater: (prev: BuilderFlashcard[]) => BuilderFlashcard[]) => {
    setState((prev) => ({ ...prev, flashcards: updater(prev.flashcards) }));
  }, []);

  const moveQuestion = React.useCallback(
    (questionId: string, direction: -1 | 1) => {
      updateQuestions((prev) => {
        const idx = prev.findIndex((q) => q.id === questionId);
        if (idx < 0) return prev;
        const target = prev[idx];
        // Swap with nearest sibling in the SAME category (stable, predictable).
        let swapIdx = -1;
        for (let i = idx + direction; i >= 0 && i < prev.length; i += direction) {
          if (prev[i].category === target.category) {
            swapIdx = i;
            break;
          }
        }
        if (swapIdx < 0) return prev;
        const next = [...prev];
        [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
        return next;
      });
    },
    [updateQuestions]
  );

  const moveQuestionToCategory = React.useCallback(
    (questionId: string, category: QuestionCategory) => {
      updateQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId && q.category !== category ? { ...q, category, user_edited: true } : q
        )
      );
    },
    [updateQuestions]
  );

  return {
    questions: state.questions,
    flashcards: state.flashcards,
    saveState,
    hydrated,
    updateQuestions,
    updateFlashcards,
    moveQuestion,
    moveQuestionToCategory,
    hydrate,
    retrySave: () => persistSnapshot(stateRef.current),
  };
}
