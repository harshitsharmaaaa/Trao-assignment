import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Frosted glass card component for authentication pages.
 * Creates a glassmorphism effect with blur, transparency, and subtle borders.
 */
export function FrostedGlassCard({
  children,
  className,
  variant = "default",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "strong";
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative rounded-2xl p-8 shadow-2xl",
        "backdrop-blur-3xl saturate-180",
        "border transition-all duration-300",
        variant === "default" && [
          "bg-white/[0.05]",
          "border-white/10",
          "hover:border-white/15",
        ],
        variant === "strong" && [
          "bg-white/[0.08]",
          "border-white/15",
          "hover:border-white/20",
        ],
        className
      )}
      {...props}
    >
      {/* Subtle inner glow effect */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-50"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, transparent 100%)",
        }}
      />
      {children}
    </div>
  );
}

/**
 * Animated gradient background for auth pages.
 * Creates a mesh gradient with subtle animation.
 */
export function AuthGradientBackground({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative min-h-screen overflow-hidden bg-cyber-bg", className)}>
      {/* Base gradient layer */}
      <div
        className="absolute inset-0 auth-gradient-bg"
        aria-hidden="true"
      />
      
      {/* Mesh overlay */}
      <div className="absolute inset-0 mesh-overlay" aria-hidden="true" />
      
      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-1/4 -left-1/4 h-1/2 w-1/2 rounded-full opacity-30 blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(14, 165, 233, 0.3) 0%, transparent 70%)",
            animation: "float 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full opacity-30 blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)",
            animation: "float 25s ease-in-out infinite reverse",
          }}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10">{children}</div>
      
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0);
          }
          33% {
            transform: translate(5%, 5%);
          }
          66% {
            transform: translate(-5%, 5%);
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Glass input styling
 */
export function glassInputClasses(
  hasError?: boolean
): string {
  return cn(
    "w-full rounded-lg px-4 py-3 text-white placeholder-slate-500",
    "bg-white/[0.05] backdrop-blur-xl",
    "border transition-all duration-200",
    "focus:outline-none focus:ring-2",
    hasError
      ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30"
      : "border-white/10 focus:border-neon-bright focus:ring-neon/30"
  );
}
