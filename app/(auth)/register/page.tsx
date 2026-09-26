"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthGradientBackground, FrostedGlassCard, glassInputClasses } from "@/components/ui/frosted-glass-card";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGradientBackground>
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        {/* Logo */}
        <Link
          href="/"
          className="mb-8 flex items-center gap-2.5 transition-opacity hover:opacity-90"
          aria-label="Trao home"
        >
          <span className="rounded-lg bg-neon p-2 text-sm font-bold text-white shadow-lg shadow-neon/30">
            Trao
          </span>
          <span className="text-sm font-bold tracking-tight text-white">
            AI Interview Prep Kit
          </span>
        </Link>

        {/* Frosted glass card */}
        <FrostedGlassCard className="w-full max-w-md animate-slide-up">
          <div className="relative z-10">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Create your account
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Generate your first personalized interview prep kit in minutes
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="register-email"
                  className="mb-1.5 block text-sm font-medium text-slate-300"
                >
                  Email address
                </label>
                <input
                  id="register-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={error ? true : undefined}
                  className={glassInputClasses(!!error)}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="register-password"
                  className="mb-1.5 block text-sm font-medium text-slate-300"
                >
                  Password
                </label>
                <input
                  id="register-password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby="register-password-hint"
                  className={glassInputClasses(!!error)}
                  placeholder="At least 6 characters"
                />
                <p id="register-password-hint" className="mt-1 text-xs text-slate-500">
                  Minimum 6 characters
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full"
              >
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-neon-bright hover:text-white transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </FrostedGlassCard>
      </div>
    </AuthGradientBackground>
  );
}
