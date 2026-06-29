"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getCurrentUser } from "@/lib/auth";
import { listFoundItems, listLostItems } from "@/lib/items";
import { AppSidebar } from "@/components/layout/top-nav";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import type { User } from "@/types/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("Loading your dashboard...");
  const [loading, setLoading] = useState(true);
  const [lostCount, setLostCount] = useState<number | null>(null);
  const [foundCount, setFoundCount] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;

    async function loadSession() {
      try {
        const current = await getCurrentUser();
        if (!alive) return;
        setUser(current);
        setMessage(`Welcome back, ${current.username}.`);
        const lost = await listLostItems();
        if (!alive) return;
        setLostCount(lost.count ?? lost.results.length);
        const found = await listFoundItems();
        if (!alive) return;
        setFoundCount(found.count ?? found.results.length);
      } catch (error) {
        if (!alive) return;
        const text = error instanceof Error ? error.message : "Unknown error";
        setMessage(`Please sign in again. ${text}`);
        router.replace("/login");
      } finally {
        if (alive) setLoading(false);
      }
    }

    void loadSession();
    return () => {
      alive = false;
    };
  }, [router]);

  if (loading) {
    return (
        <main className="relative min-h-screen overflow-hidden px-6 py-10 lg:pl-[240px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_8%,_#8686AC22,_transparent_45%),radial-gradient(circle_at_90%_92%,_#2727571C,_transparent_48%)]" />
          <AppSidebar />
          <div className="relative mx-auto flex min-h-[80vh] w-full max-w-5xl items-center justify-center text-sm text-muted-foreground">
            {message}
          </div>
        </main>
    );
  }

  return (
      <main className="relative min-h-screen overflow-hidden px-6 py-10 lg:pl-[240px]">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_8%,_#8686AC22,_transparent_45%),radial-gradient(circle_at_90%_92%,_#2727571C,_transparent_48%)]" />

        <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-4">

          {/* Nav */}
          <AppSidebar />

          {/* Account info */}
          {user ? (
              <section
                  className="rounded-2xl border border-border/70 bg-card/80 p-5 text-sm shadow-sm backdrop-blur-sm"
                  style={{ animation: "page-fade-up 400ms cubic-bezier(0.23,1,0.32,1) 120ms both" }}
              >
                <h2 className="mb-3 text-base font-medium">Your Account</h2>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-muted-foreground">
              <span>
                <span className="mr-1 font-medium text-foreground">Name</span>
                {user.username}
              </span>
                  <span>
                <span className="mr-1 font-medium text-foreground">Email</span>
                    {user.email}
              </span>
                  <span>
                <span className="mr-1 font-medium text-foreground">Role</span>
                    {user.role}
              </span>
                </div>
              </section>
          ) : null}

          {/* Stats + charts */}
          <DashboardOverview lostCount={lostCount} foundCount={foundCount} />

          {/* Quick actions */}
          <section
              className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm"
              style={{ animation: "page-fade-up 400ms cubic-bezier(0.23,1,0.32,1) 300ms both" }}
          >
            <h2 className="mb-3 text-base font-medium">Quick Actions</h2>
            <div className="flex flex-wrap gap-2 text-sm">
              <Link
                  className="rounded-lg border border-border/80 bg-background/70 px-3 py-2 transition-colors hover:border-primary/40 hover:text-primary"
                  href="/report-lost"
              >
                Report a lost item
              </Link>
              <Link
                  className="rounded-lg border border-border/80 bg-background/70 px-3 py-2 transition-colors hover:border-primary/40 hover:text-primary"
                  href="/report-found"
              >
                Report a found item
              </Link>
            </div>
          </section>
        </div>

        {/* Page-level keyframes */}
        <style>{`
        @keyframes page-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="page-fade-up"] { animation: none !important; }
        }
      `}</style>
      </main>
  );
}