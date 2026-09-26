import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Days left until the interview, derived from kit creation date. Never negative. */
export function daysRemaining(
  kit: Pick<{ daysRequested: number; createdAt: string }, "daysRequested" | "createdAt">,
  now = Date.now()
): number {
  const elapsed = Math.floor((now - new Date(kit.createdAt).getTime()) / 86_400_000);
  return Math.max(0, kit.daysRequested - elapsed);
}
