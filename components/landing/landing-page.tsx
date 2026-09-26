import Link from "next/link";
import { FileText, Globe2, GraduationCap, CheckCircle2, ArrowRight } from "lucide-react";

// Minimal product landing (logged-out `/`). Explains JD + Research = Kit and
// routes into the app. Deliberately small: no pricing, no testimonials, no animation.
export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="flex items-center gap-2.5" aria-label="Trao">
            <span className="rounded-lg bg-indigo-600 p-2 text-sm font-bold text-white">Trao</span>
            <span className="text-sm font-bold tracking-tight text-white">AI Interview Prep Kit</span>
          </span>
          <nav className="flex items-center gap-2" aria-label="Account">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Get started <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-14 pt-16 text-center sm:px-6 sm:pt-24">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Turn any job description into a focused interview plan.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
            Paste the JD, add the company website and your timeline. Trao researches the company,
            extracts what the role really demands, and builds your questions, flashcards and
            day-by-day schedule.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Build your first kit <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Sign in
            </Link>
          </div>
        </section>

        {/* 3-step explainer */}
        <section aria-label="How it works" className="border-t border-slate-800 bg-slate-950">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-12 sm:px-6 md:grid-cols-3">
            {[
              { icon: FileText, step: "1. You bring the JD", text: "Job description, company URL, days until the interview. Requirements are extracted into must / nice." },
              { icon: Globe2, step: "2. Trao does the research", text: "Company site crawl, public interview discussions, brief, role breakdown and full question coverage." },
              { icon: GraduationCap, step: "3. You prepare with focus", text: "Editable question bank, flashcards with weakest-first practice, and a deterministic daily plan." },
            ].map((s) => (
              <div key={s.step} className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <s.icon className="h-6 w-6 text-indigo-400" aria-hidden="true" />
                <h2 className="mt-3 font-bold text-white">{s.step}</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Capability strip + CTA */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <ul className="flex flex-col items-center justify-center gap-2 text-sm text-slate-300 sm:flex-row sm:gap-8">
            {["Edits survive regeneration", "Coverage tracking per requirement", "Confidence-based practice"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" /> {t}
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center sm:p-10">
            <h2 className="text-2xl font-bold tracking-tight text-white">Interview coming up?</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
              Create a free account and generate your first personalized prep kit in minutes.
            </p>
            <Link
              href="/register"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Get started free <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:px-6">
          <span>Trao — AI Interview Prep Kit</span>
          <span className="flex gap-4">
            <Link href="/login" className="hover:text-slate-300">Sign in</Link>
            <Link href="/register" className="hover:text-slate-300">Register</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
