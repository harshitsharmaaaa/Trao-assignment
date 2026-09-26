import Link from "next/link";
import { FileText, Globe2, GraduationCap, CheckCircle2 } from "lucide-react";

// Shared login-02-style split shell: form column + product-explainer panel.
// The panel teaches the real pipeline (no stock imagery, no invented features).
export function AuthSplit({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-slate-900 text-slate-100 lg:grid-cols-2">
      <div className="flex flex-col p-6 md:p-10">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Trao home">
          <span className="rounded-lg bg-indigo-600 p-2 text-sm font-bold text-white">Trao</span>
          <span className="text-sm font-bold tracking-tight text-white">AI Interview Prep Kit</span>
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
              <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
            </div>
            {children}
            <div className="text-center text-sm text-slate-400">{footer}</div>
          </div>
        </div>
      </div>

      <aside className="relative hidden flex-col justify-center overflow-hidden border-l border-slate-800 bg-slate-950 p-10 lg:flex" aria-label="How it works">
        <div className="mx-auto w-full max-w-md space-y-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">How your kit gets built</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-white">
              Job description in, interview readiness out.
            </h2>
          </div>
          <ol className="space-y-4">
            {[
              { icon: FileText, title: "Paste the JD", text: "Requirements are extracted into must / nice, technical / behavioural / domain." },
              { icon: Globe2, title: "We research the company", text: "Site crawl plus public interview discussions become your company brief." },
              { icon: GraduationCap, title: "You prepare with focus", text: "Questions, flashcards, coverage tracking and a day-by-day plan." },
            ].map((step, i) => (
              <li key={step.title} className="flex items-start gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600/15 text-indigo-300">
                  <step.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">
                    <span className="mr-1.5 tabular-nums text-slate-500">{i + 1}.</span>
                    {step.title}
                  </span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-slate-400">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
          <ul className="space-y-2 border-t border-slate-800 pt-5 text-sm text-slate-400">
            {["Edit-preserving regeneration", "Weakest-first practice", "Deterministic study schedule"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
