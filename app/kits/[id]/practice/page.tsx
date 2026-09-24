"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, RotateCcw, Star, Sparkles } from "lucide-react";

export default function PracticeModePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [cards, setCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    fetchPracticeCards();
  }, []);

  const fetchPracticeCards = async () => {
    try {
      const res = await fetch(`/api/kits/${params.id}/practice`);
      if (res.ok) {
        const data = await res.json();
        setCards(data.flashcards || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRateConfidence = async (confidence: number) => {
    const currentCard = cards[currentIndex];
    if (!currentCard) return;

    try {
      await fetch(`/api/kits/${params.id}/practice/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flashcardId: currentCard.id,
          confidence,
        }),
      });

      setShowBack(false);
      if (currentIndex + 1 < cards.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCompleted(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Loading flashcards...
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-white">No flashcards available</h2>
        <Link
          href={`/kits/${params.id}`}
          className="mt-4 text-sm font-semibold text-indigo-400 hover:underline"
        >
          Return to Kit Builder
        </Link>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href={`/kits/${params.id}`}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Kit
          </Link>
          <div className="text-sm font-medium text-slate-400">
            Card {currentIndex + 1} of {cards.length}
          </div>
        </div>
      </header>

      {/* Practice Mode Card Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-6">
          {!completed ? (
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-indigo-500 h-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                ></div>
              </div>

              {/* Flashcard Component */}
              <div
                onClick={() => setShowBack(!showBack)}
                className="cursor-pointer min-h-[300px] flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 p-8 shadow-2xl text-center transition transform hover:scale-[1.01]"
              >
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">
                  {showBack ? "Answer Outline" : "Question Prompt (Click to Flip)"}
                </span>

                <p className="text-xl font-bold text-white leading-relaxed">
                  {showBack ? currentCard.back : currentCard.front}
                </p>

                {!showBack && (
                  <span className="mt-8 text-xs text-slate-500 font-medium">
                    Tap anywhere to reveal answer
                  </span>
                )}
              </div>

              {/* Confidence Rating Buttons */}
              {showBack && (
                <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
                  <span className="text-xs font-semibold text-slate-400 block">
                    How confident were you with this card?
                  </span>
                  <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => handleRateConfidence(level)}
                        className={`flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-bold transition ${
                          level <= 2
                            ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                            : level === 3
                            ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                        }`}
                      >
                        <Star className="h-3.5 w-3.5 fill-current" />
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-8 shadow-2xl text-center space-y-4">
              <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-400" />
              <h2 className="text-2xl font-bold text-white">Session Completed!</h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Your confidence ratings have been saved. Weaker flashcards are automatically prioritized for your next review.
              </p>

              <div className="flex justify-center gap-4 pt-4">
                <button
                  onClick={() => {
                    setCurrentIndex(0);
                    setCompleted(false);
                    fetchPracticeCards();
                  }}
                  className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
                >
                  <RotateCcw className="h-4 w-4" /> Practice Again
                </button>
                <Link
                  href={`/kits/${params.id}`}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  Return to Kit
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
