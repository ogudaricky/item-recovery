"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { List, Archive, ShieldCheck, CheckCircle2, Activity } from "lucide-react";

import { AppSidebar } from "@/components/layout/top-nav";
import { getCurrentUser } from "@/lib/auth";
import { getAdminReportSummary, type AdminReportSummary } from "@/lib/reports";
import type { User } from "@/types/auth";

type ReportData = AdminReportSummary;

export default function AdminReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Loading reports...");
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const loadReportData = async () => {
      try {
        const current = await getCurrentUser();
        if (!alive) return;

        if (current.role !== "admin") {
          setMessage("Access denied. Admin privileges required.");
          router.replace("/dashboard");
          return;
        }

        setUser(current);

        const reportData = await getAdminReportSummary();
        if (!alive) return;

        setReport(reportData);
      } catch (e) {
        if (!alive) return;
        const message = e instanceof Error ? e.message : "Unable to load report data.";
        setError(message);
        setMessage("Unable to load reports.");
        console.error("Admin reports error:", e);
      } finally {
        if (alive) setLoading(false);
      }
    };

    void loadReportData();
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
          Loading admin session...
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10 lg:pl-[240px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_8%,_#8686AC22,_transparent_45%),radial-gradient(circle_at_90%_92%,_#2727571C,_transparent_48%)]" />
      <AppSidebar />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-4">
        <section className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Admin Reports</p>
              <h1 className="text-3xl font-semibold">System summary</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin"
                className="rounded-lg border border-border/80 bg-background/70 px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:text-primary"
              >
                Back to dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  setReport(null);
                  void router.refresh();
                }}
                className="rounded-lg border border-border/80 bg-background/70 px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:text-primary"
              >
                Refresh
              </button>
            </div>
          </div>
        </section>

        {error && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
            <p>Unable to load report data: {error}</p>
          </section>
        )}

        {report ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard
                icon={<List size={20} />}
                label="Total users"
                value={report.total_users}
                color="text-sky-600"
                bgColor="bg-sky-600/10"
              />
              <StatCard
                icon={<Archive size={20} />}
                label="Lost reports"
                value={report.total_lost_items}
                color="text-emerald-600"
                bgColor="bg-emerald-600/10"
              />
              <StatCard
                icon={<Activity size={20} />}
                label="Found reports"
                value={report.total_found_items}
                color="text-fuchsia-600"
                bgColor="bg-fuchsia-600/10"
              />
              <StatCard
                icon={<ShieldCheck size={20} />}
                label="Matches"
                value={report.total_matches}
                color="text-violet-600"
                bgColor="bg-violet-600/10"
              />
              <StatCard
                icon={<CheckCircle2 size={20} />}
                label="Claims"
                value={report.total_claims}
                color="text-amber-600"
                bgColor="bg-amber-600/10"
              />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <StatusCard
                title="Match status"
                statuses={report.match_status}
                total={report.total_matches}
              />
              <StatusCard
                title="Claim status"
                statuses={report.claim_status}
                total={report.total_claims}
              />
            </section>

            <section className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-sm">
              <h2 className="text-lg font-semibold mb-4">User role distribution</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {Object.entries(report.user_roles).map(([role, count]) => (
                  <div key={role} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                    <p className="text-sm text-muted-foreground uppercase tracking-[0.2em]">{role}</p>
                    <p className="mt-2 text-2xl font-semibold">{count}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-sm">
            <p className="text-sm text-muted-foreground">No report data available yet.</p>
          </section>
        )}
      </div>

      <style>{`
        @keyframes page-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm">
      <div className={`mb-4 inline-flex rounded-xl p-2.5 ${bgColor}`}>
        <span className={color}>{icon}</span>
      </div>
      <p className="text-3xl font-semibold">{value.toLocaleString()}</p>
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function StatusCard({
  title,
  statuses,
  total,
}: {
  title: string;
  statuses: Record<string, number>;
  total: number;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-sm">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">No data available.</p>
      ) : (
        <div className="space-y-3">
          {Object.entries(statuses).map(([status, count]) => (
            <div key={status} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="capitalize text-foreground">{status}</span>
                <span className="font-semibold">{count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-border/50">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(count / total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
