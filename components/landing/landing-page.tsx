"use client";

import Link from "next/link";
import { FileText, Globe2, GraduationCap, CheckCircle2, ArrowRight, Zap, Target, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Animated landing page with engineering product aesthetic.
 * Features animated gradient background, staggered animations, and hover effects.
 */
export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-cyber-bg text-slate-100">
      {/* Animated gradient background */}
      <div className="absolute inset-0 auth-gradient-bg" aria-hidden="true" />
      
      {/* Mesh overlay */}
      <div className="absolute inset-0 mesh-overlay opacity-60" aria-hidden="true" />
      
      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute top-0 right-1/4 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(14, 165, 233, 0.4) 0%, transparent 70%)",
            animation: "float 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-1/4 left-0 h-80 w-80 rounded-full opacity-20 blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)",
            animation: "float 25s ease-in-out infinite reverse",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-white/5 bg-transparent backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Trao home">
            <span className="rounded-lg bg-neon p-2 text-sm font-bold text-white shadow-lg shadow-neon/30">
              Trao
            </span>
            <span className="text-sm font-bold tracking-tight text-white">
              AI Interview Prep Kit
            </span>
          </Link>
          <nav className="flex items-center gap-3" aria-label="Account">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
            >
              Sign in
            </Link>
            <Link href="/register">
              <Button variant="primary" size="md" className="gap-2">
                Get started <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28">
          <div className="text-center">
            {/* Eyebrow */}
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-neon/20 bg-neon/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-neon-bright animate-fade-in">
              <Zap className="h-3.5 w-3.5" aria-hidden="true" />
              Interview preparation, automated
            </p>
            
            {/* Headline */}
            <h1 className="mx-auto max-w-4xl animate-slide-up text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl" style={{ animationDelay: "100ms" }}>
              Turn any job description into a{" "}
              <span className="bg-gradient-to-r from-neon to-indigo-400 bg-clip-text text-transparent">
                focused interview plan
              </span>
            </h1>
            
            {/* Subheadline */}
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl animate-fade-in" style={{ animationDelay: "200ms" }}>
              Paste the JD, add the company website, and specify your timeline. Trao researches the company,
              extracts what the role really demands, and builds your questions, flashcards, and study schedule.
            </p>
            
            {/* CTAs */}
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row animate-fade-in" style={{ animationDelay: "300ms" }}>
              <Link href="/register">
                <Button variant="primary" size="lg" className="w-full gap-2 sm:w-auto">
                  Build your first kit <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg" className="w-full gap-2 sm:w-auto">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* 3-step explainer */}
        <section aria-label="How it works" className="relative border-t border-white/5 bg-gradient-to-b from-transparent to-white/[0.02]">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">How it works</h2>
              <p className="mt-3 text-slate-400">Three steps to interview readiness</p>
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                {
                  icon: FileText,
                  step: "01",
                  title: "Paste the JD",
                  text: "Job description, company URL, days until the interview. Requirements are extracted into must / nice categories.",
                  color: "neon",
                },
                {
                  icon: Globe2,
                  step: "02",
                  title: "We research",
                  text: "Company site crawl, public interview discussions, comprehensive brief, and full question coverage.",
                  color: "indigo-400",
                },
                {
                  icon: GraduationCap,
                  step: "03",
                  title: "You prepare",
                  text: "Editable question bank, flashcards with weakest-first practice, and a deterministic daily plan.",
                  color: "emerald-400",
                },
              ].map((s, i) => (
                <div
                  key={s.step}
                  className="group relative overflow-hidden rounded-2xl border border-white/5 bg-cyber-surface/50 p-8 backdrop-blur transition-all duration-300 hover:border-neon/30 hover:shadow-neon animate-fade-in"
                  style={{ animationDelay: `${400 + i * 100}ms` }}
                >
                  {/* Glow effect on hover */}
                  <div
                    className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(400px at 50% 50%, rgba(14, 165, 233, 0.1), transparent 70%)`,
                    }}
                  />
                  
                  {/* Step number */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className={cn("rounded-xl p-3 transition-colors", `bg-${s.color}/10`)}>
                      <s.icon className={cn("h-6 w-6", `text-${s.color}`)} aria-hidden="true" />
                    </div>
                    <span className="font-mono text-sm font-bold text-slate-600">{s.step}</span>
                  </div>
                  
                  <h3 className="mb-2 text-xl font-bold text-white">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-400">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="border-t border-white/5 bg-cyber-surface/30 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                { label: "Requirements extracted", value: "Automatically", icon: Target },
                { label: "Questions generated", value: "Role-specific", icon: FileText },
                { label: "Study schedule", value: "Day-by-day", icon: Clock },
              ].map((stat, i) => (
                <div key={stat.label} className="flex items-center gap-4 rounded-xl border border-white/5 bg-cyber-surface/50 p-5">
                  <div className="rounded-lg bg-neon/10 p-3">
                    <stat.icon className="h-5 w-5 text-neon-bright" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm text-slate-400">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Capability strip */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <ul className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-300 sm:gap-8">
            {["Edits survive regeneration", "Coverage tracking per requirement", "Confidence-based practice", "Deterministic scheduling"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </section>

        {/* CTA section */}
        <section className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-neon/20 bg-gradient-to-br from-cyber-surface via-cyber-elevated to-cyber-surface p-10 sm:p-14">
            {/* Background glow */}
            <div
              className="pointer-events-none absolute -top-20 right-0 h-80 w-80 rounded-full opacity-30 blur-3xl"
              style={{
                background: "radial-gradient(circle, rgba(14, 165, 233, 0.3) 0%, transparent 70%)",
              }}
            />
            
            <div className="relative z-10 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Interview coming up?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-slate-400">
                Create a free account and generate your first personalized prep kit in minutes.
              </p>
              <div className="mt-8">
                <Link href="/register">
                  <Button variant="primary" size="lg" className="gap-2">
                    Get started free <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 text-xs text-slate-500 sm:flex-row sm:px-6">
          <span className="font-medium text-slate-400">Trao — AI Interview Prep Kit</span>
          <span className="flex gap-6">
            <Link href="/login" className="transition-colors hover:text-slate-300">
              Sign in
            </Link>
            <Link href="/register" className="transition-colors hover:text-slate-300">
              Register
            </Link>
          </span>
        </div>
      </footer>

      {/* Float animation styles */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0);
          }
          33% {
            transform: translate(3%, 3%);
          }
          66% {
            transform: translate(-3%, 3%);
          }
        }
      `}</style>
    </div>
  );
}
