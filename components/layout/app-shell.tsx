"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Plus, LogOut, Menu, X, ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface WorkspaceNavItem {
  label: string;
  href: string;
  active?: boolean;
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Trao home">
      <span className="rounded-lg bg-neon p-2 text-sm font-bold text-white shadow-lg shadow-neon/30">
        Trao
      </span>
      <span className="text-sm font-bold tracking-tight text-white">AI Interview Prep Kit</span>
    </Link>
  );
}

export function AppShell({
  email,
  onSignOut,
  breadcrumbs = [],
  workspaceNav = [],
  onNewKit,
  children,
}: {
  email?: string | null;
  onSignOut: () => void;
  breadcrumbs?: BreadcrumbItem[];
  workspaceNav?: WorkspaceNavItem[];
  onNewKit?: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  // Close drawer on route change
  React.useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);
  
  // Lock body scroll while drawer open
  React.useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);
  
  // Esc closes drawer
  React.useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const sidebarBody = (
    <div className="flex h-full flex-col">
      <nav aria-label="Primary" className="flex-1 space-y-6 overflow-y-auto px-3 py-4" onClick={() => setDrawerOpen(false)}>
        <div>
          <p className="sidebar-label px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            Overview
          </p>
          <ul className="mt-1.5 space-y-1">
            <li>
              <Link
                href="/"
                aria-current={pathname === "/" ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon",
                  pathname === "/"
                    ? "bg-neon/15 text-white shadow-neon/20 border-l-2 border-neon"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="sidebar-label">My Kits</span>
              </Link>
            </li>
            {onNewKit && (
              <li>
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    onNewKit();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon"
                >
                  <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="sidebar-label">New Kit</span>
                </button>
              </li>
            )}
          </ul>
        </div>

        {workspaceNav.length > 0 && (
          <div>
            <p className="sidebar-label px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Workspace
            </p>
            <ul className="mt-1.5 space-y-1">
              {workspaceNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={item.active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon",
                      item.active
                        ? "bg-neon/15 text-white border-l-2 border-neon"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-600" aria-hidden="true" />
                    <span className="sidebar-label">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      <div className="border-t border-white/5 p-3">
        {email && (
          <p className="sidebar-label truncate px-2.5 pb-2 text-xs text-slate-500" title={email}>
            {email}
          </p>
        )}
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="sidebar-label">Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cyber-bg text-slate-100">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-white/5 bg-cyber-surface transition-[width] duration-200 ease-out md:block",
          collapsed ? "w-16" : "w-60"
        )}
        aria-label="Sidebar"
      >
        <div className={cn("flex h-16 items-center border-b border-white/5 px-4", collapsed && "justify-center px-2")}>
          {collapsed ? (
            <span className="rounded-lg bg-neon p-2 text-sm font-bold text-white shadow-lg shadow-neon/30" aria-hidden="true">
              T
            </span>
          ) : (
            <Brand />
          )}
        </div>
        <div className={cn("h-[calc(100%-4rem)]", collapsed && "[&_.sidebar-label]:hidden")}>{sidebarBody}</div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-white/5 bg-cyber-surface"
          >
            <div className="flex h-16 items-center justify-between border-b border-white/5 px-4">
              <Brand />
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="h-[calc(100%-4rem)]">{sidebarBody}</div>
          </div>
        </div>
      )}

      <div className={cn("flex min-h-screen flex-col transition-[padding] duration-200 ease-out", collapsed ? "md:pl-16" : "md:pl-60")}>
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-white/5 bg-cyber-bg/80 backdrop-blur-lg">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 md:px-6">
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon md:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-pressed={collapsed}
              className="hidden rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon md:block"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
              ) : (
                <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
            {breadcrumbs.length > 0 && (
              <nav aria-label="Breadcrumb" className="ml-1 min-w-0">
                <ol className="flex min-w-0 items-center gap-1.5 text-sm">
                  {breadcrumbs.map((crumb, i) => {
                    const last = i === breadcrumbs.length - 1;
                    return (
                      <li key={i} className="flex min-w-0 items-center gap-1.5">
                        {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-600" aria-hidden="true" />}
                        {crumb.href && !last ? (
                          <Link
                            href={crumb.href}
                            className="truncate text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon rounded"
                          >
                            {crumb.label}
                          </Link>
                        ) : (
                          <span aria-current={last ? "page" : undefined} className={last ? "truncate font-semibold text-white" : "truncate text-slate-400"}>
                            {crumb.label}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6">{children}</main>
      </div>
    </div>
  );
}
