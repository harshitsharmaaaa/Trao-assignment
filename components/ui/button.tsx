import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "dangerGhost";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    "bg-neon text-white font-semibold",
    "hover:bg-neon-bright",
    "shadow-lg shadow-neon/20",
    "hover:shadow-neon hover:shadow-neon/40",
    "transition-all duration-200",
    "disabled:opacity-50 disabled:shadow-none",
  ].join(" "),
  secondary: [
    "border border-white/10 bg-white/[0.05] backdrop-blur",
    "text-slate-300 hover:text-white",
    "hover:bg-white/[0.08] hover:border-white/15",
    "disabled:opacity-50",
  ].join(" "),
  ghost: [
    "text-slate-400 hover:text-white",
    "hover:bg-white/[0.05]",
    "disabled:opacity-50",
  ].join(" "),
  dangerGhost: [
    "text-slate-400 hover:text-red-400",
    "hover:bg-red-500/10",
    "disabled:opacity-50",
  ].join(" "),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
  icon: "p-2",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading = false, className, children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-2 focus-visible:ring-offset-cyber-bg",
        "min-h-[36px]",
        "disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";
