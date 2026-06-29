"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, type CSSProperties } from "react";
import {
  Bell,
  FileCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  PackageX,
  Radar,
  ScanSearch,
  X,
} from "lucide-react";
import { getCurrentUser, logout } from "@/lib/auth";
import type { User } from "@/types/auth";

/* ─── Nav items ──────────────────────────────────────────────────────── */

const NAV = [
  { href: "/dashboard",    label: "Dashboard",        Icon: LayoutDashboard },
  { href: "/report-lost",  label: "Report Lost",       Icon: PackageX },
  { href: "/report-found", label: "Report Found",      Icon: PackageCheck },
  { href: "/matches",      label: "Possible Matches",  Icon: ScanSearch },
  { href: "/claims",       label: "Claims",            Icon: FileCheck },
  { href: "/notifications",label: "Notifications",     Icon: Bell },
] as const;

const ADMIN_NAV = [
  { href: "/admin",        label: "Admin Home",       Icon: LayoutDashboard },
  { href: "/admin/users",  label: "Users",            Icon: PackageCheck },
  { href: "/admin/items",  label: "Items",            Icon: PackageX },
  { href: "/admin/reports",label: "Reports",          Icon: FileCheck },
] as const;

/* ─── Types ──────────────────────────────────────────────────────────── */

interface AppSidebarProps {
  user?: User | null;
  onLogout?: () => void | Promise<void>;
  loggingOut?: boolean;
}

/* ─── Component ──────────────────────────────────────────────────────── */

export function AppSidebar({
                             user: userProp,
                             onLogout,
                             loggingOut = false,
                           }: AppSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [resolvedUser, setResolvedUser] = useState<User | null>(userProp ?? null);
  const [internalLoggingOut, setInternalLoggingOut] = useState(false);

  useEffect(() => {
    if (userProp !== undefined) {
      setResolvedUser(userProp);
      return;
    }

    let alive = true;

    void getCurrentUser()
      .then((current) => {
        if (!alive) return;
        setResolvedUser(current);
      })
      .catch(() => {
        if (!alive) return;
        setResolvedUser(null);
      });

    return () => {
      alive = false;
    };
  }, [userProp]);

  /* Close on route change (mobile) */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /* Lock body scroll while mobile nav is open */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  async function handleLogout() {
    if (onLogout) {
      await onLogout();
      return;
    }

    setInternalLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setInternalLoggingOut(false);
    }
  }

  const effectiveLoggingOut = loggingOut || internalLoggingOut;
  const initials = resolvedUser?.username?.charAt(0).toUpperCase() ?? "?";

  return (
      <>
        {/* ── Keyframes ── */}
        <style>{`
        @keyframes sb-in {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0);   }
        }
        .sb-link {
          animation: sb-in 300ms cubic-bezier(0.23, 1, 0.32, 1) var(--d, 0ms) both;
        }
      `}</style>

        {/* ── Mobile trigger ── */}
        <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
            className="fixed left-4 top-3.5 z-30 flex h-8 w-8 items-center justify-center rounded-xl border border-border/70 bg-card/90 shadow-sm backdrop-blur-sm lg:hidden"
        >
          <Menu className="h-4 w-4 text-foreground" />
        </button>

        {/* ── Mobile backdrop ── */}
        {open && (
            <div
                aria-hidden
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] lg:hidden"
            />
        )}

        {/* ── Sidebar shell ── */}
        <aside
            className={[
              "fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col",
              "border-r border-border/60 bg-card",
              "transition-transform duration-[220ms] ease-out",
              "lg:translate-x-0",
              open ? "translate-x-0 shadow-2xl" : "-translate-x-full",
            ].join(" ")}
        >
          {/* Brand bar */}
          <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border/60 px-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Radar className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={2} />
            </div>
            <span className="text-[13.5px] font-semibold tracking-tight text-foreground">
            ItemRecovery
          </span>
            {/* Mobile close */}
            <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setOpen(false)}
                className="ml-auto flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground lg:hidden"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
            <p className="mb-2 px-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/40">
              Main
            </p>

            <div className="flex flex-col gap-px">
              {(pathname?.startsWith("/admin") ? ADMIN_NAV : NAV).map(({ href, label, Icon }, i) => {
                const active = pathname === href;
                return (
                    <Link
                        key={href}
                        href={href}
                        style={{ "--d": `${i * 42}ms` } as CSSProperties}
                        className={[
                          "sb-link group relative flex items-center gap-2.5 rounded-lg px-2.5 py-[7px]",
                          "text-[13px] font-medium transition-colors duration-150 outline-none",
                          "focus-visible:ring-2 focus-visible:ring-ring/50",
                          active
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        ].join(" ")}
                    >
                      {/* Active left accent */}
                      {active && (
                          <span className="absolute left-0 h-5 w-0.5 rounded-full bg-primary" />
                      )}

                      <Icon
                          className={[
                            "h-[15px] w-[15px] shrink-0 transition-colors duration-150",
                            active
                                ? "text-primary"
                                : "text-muted-foreground/60 group-hover:text-foreground",
                          ].join(" ")}
                      />

                      <span className="truncate">{label}</span>

                      {active && (
                          <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      )}
                    </Link>
                );
              })}
            </div>
          </nav>

          {/* User section */}
          <div className="shrink-0 border-t border-border/60 p-3">
            {resolvedUser && (
                <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
                  {/* Avatar initial */}
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold uppercase text-primary">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold leading-tight text-foreground">
                      {resolvedUser.username}
                    </p>
                    <p className="truncate text-[11px] leading-tight text-muted-foreground capitalize">
                      {resolvedUser.role}
                    </p>
                  </div>
                </div>
            )}

            <button
                type="button"
                onClick={handleLogout}
                disabled={effectiveLoggingOut}
                className={[
                  "mt-1.5 flex w-full items-center gap-2 rounded-lg px-2.5 py-[7px]",
                  "text-[13px] text-muted-foreground outline-none",
                  "transition-colors duration-150",
                  "hover:bg-destructive/8 hover:text-destructive",
                  "focus-visible:ring-2 focus-visible:ring-ring/50",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                ].join(" ")}
            >
              <LogOut className="h-[14px] w-[14px] shrink-0" />
              {effectiveLoggingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </aside>
      </>
  );
}