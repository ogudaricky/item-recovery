"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getCurrentUser } from "@/lib/auth";
import { listUsers } from "@/lib/users";
import { AppSidebar } from "@/components/layout/top-nav";
import { AdminOverview } from "@/components/admin/admin-overview";
import type { User } from "@/types/auth";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("Loading admin dashboard...");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    let alive = true;

    async function loadAdminSession() {
      try {
        const current = await getCurrentUser();
        if (!alive) return;

        // Check if user is admin
        if (current.role !== "admin") {
          setMessage("Access denied. Admin privileges required.");
          router.replace("/dashboard");
          return;
        }

        setUser(current);
        setMessage(`Welcome back, Admin ${current.username}.`);

        // Load users for admin overview
        const usersList = await listUsers();
        if (!alive) return;
        setUsers(usersList);
      } catch (error) {
        if (!alive) return;
        const text = error instanceof Error ? error.message : "Unknown error";
        setMessage(`Please sign in again. ${text}`);
        router.replace("/login");
      } finally {
        if (alive) setLoading(false);
      }
    }

    void loadAdminSession();
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

  if (!user) {
    return (
        <main className="relative min-h-screen overflow-hidden px-6 py-10 lg:pl-[240px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_8%,_#8686AC22,_transparent_45%),radial-gradient(circle_at_90%_92%,_#2727571C,_transparent_48%)]" />
          <AppSidebar />
          <div className="relative mx-auto flex min-h-[80vh] w-full max-w-5xl items-center justify-center text-sm text-muted-foreground">
            Loading admin dashboard...
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
          <section
              className="rounded-2xl border border-border/70 bg-card/80 p-5 text-sm shadow-sm backdrop-blur-sm"
              style={{ animation: "page-fade-up 400ms cubic-bezier(0.23,1,0.32,1) 120ms both" }}
          >
            <h2 className="mb-3 text-base font-medium">Admin Account</h2>
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
                  <span>
                <span className="mr-1 font-medium text-foreground">Status</span>
                    {user.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </section>

          {/* Admin Overview */}
          <AdminOverview users={users} />

          {/* Quick actions */}
          <section
              className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm"
              style={{ animation: "page-fade-up 400ms cubic-bezier(0.23,1,0.32,1) 300ms both" }}
          >
            <h2 className="mb-3 text-base font-medium">Admin Quick Actions</h2>
            <div className="flex flex-wrap gap-2 text-sm">
              <Link
                  className="rounded-lg border border-border/80 bg-background/70 px-3 py-2 transition-colors hover:border-primary/40 hover:text-primary"
                  href="/admin/users"
              >
                Manage Users
              </Link>
              <Link
                  className="rounded-lg border border-border/80 bg-background/70 px-3 py-2 transition-colors hover:border-primary/40 hover:text-primary"
                  href="/admin/items"
              >
                Manage Items
              </Link>
              <Link
                  className="rounded-lg border border-border/80 bg-background/70 px-3 py-2 transition-colors hover:border-primary/40 hover:text-primary"
                  href="/admin/reports"
              >
                View Reports
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