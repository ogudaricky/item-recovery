"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getCurrentUser } from "@/lib/auth";
import { AppSidebar } from "@/components/layout/top-nav";

export default function AdminReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    let mounted = true;
    const loadUser = async () => {
      try {
        const current = await getCurrentUser();
        if (!mounted) return;
        if (current.role !== "admin") {
          setMessage("Access denied. Admin privileges required.");
          router.replace("/dashboard");
          return;
        }
        setUser(current);
        setMessage(`Welcome back, Admin ${current.username}.`);
      } catch (error) {
        if (!mounted) return;
        setMessage("Please sign in again.");
        router.replace("/login");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void loadUser();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="relative min-h-screen overflow-hidden px-6 py-10 lg:pl-[240px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_8%,_#8686AC22,_transparent_45%),radial-gradient(circle_at_90%_92%,_#2727571C,_transparent_48%)]" />
        <AppSidebar />
        <div className="relative mx-auto flex min-h-[80vh] w-full max-w-5xl items-center justify-center text-sm text-muted-foreground">
          Loading...
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
          Loading user session...
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10 lg:pl-[240px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_8%,_#8686AC22,_transparent_45%),radial-gradient(circle_at_90%_92%,_#2727571C,_transparent_48%)]" />
      <AppSidebar />
      <div className="relative mx-auto flex min-h-[80vh] w-full max-w-5xl items-center justify-center text-sm text-muted-foreground">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Reports</h1>
          <p className="mb-4">This is the reports page.</p>
          <Link
            href="/admin"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Back to Dashboard
          </Link>
        </div>
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
