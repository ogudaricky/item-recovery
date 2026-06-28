"use client";

import { useState, type SyntheticEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiBaseUrl } from "@/lib/api";
import { getCurrentUser, login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(false);

  const baseUrl = getApiBaseUrl();

  const handleLogin = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("Signing you in...");
    try {
      const user = await login({ username, password });
      setMessage(`Welcome, ${user.username}. Opening your dashboard...`);

      // Redirect based on user role
      if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unknown error";
      setMessage(`Sign in failed. ${text}`);
    } finally {
      setLoading(false);
    }
  };

  async function handleCheckExistingSession() {
    setCheckingSession(true);
    setMessage("Checking your sign-in status...");
    try {
      const user = await getCurrentUser();
      setMessage(`Welcome back, ${user.username}. Opening your dashboard...`);

      // Redirect based on user role
      if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unknown error";
      setMessage(`You are not signed in. ${text}`);
    } finally {
      setCheckingSession(false);
    }
  }

  const isBusy = loading || checkingSession;

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 flex flex-col lg:flex-row">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-36 -left-24 h-[24rem] w-[24rem] rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-[26rem] w-[26rem] rounded-full bg-cyan-500/30 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)]" />
      </div>

      {/* Left panel: Login form */}
      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16 xl:px-24">
        <div className="w-full max-w-sm rounded-3xl border border-white/20 bg-white/10 p-7 shadow-2xl backdrop-blur-xl">

          {/* Logo */}
          <p className="text-xs font-medium tracking-[0.1em] text-slate-200 uppercase mb-8">
            ItemRecovery
          </p>

          <h2 className="text-2xl font-semibold tracking-tight text-white mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-slate-200/90 mb-8">
            Sign in to continue to your portal.
          </p>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                placeholder="your.username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isBusy}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/25" />
            </div>
            <div className="relative flex justify-center text-xs text-slate-200">
              <span className="bg-transparent px-2">or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleCheckExistingSession}
            disabled={isBusy}
          >
            {checkingSession ? "Checking…" : "Check sign-in status"}
          </Button>

          {message && (
            <p className="mt-4 text-sm text-slate-100 text-center">{message}</p>
          )}

          <p className="mt-8 text-[11px] text-slate-300/70 text-center">
            Server: {baseUrl}
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="relative z-10 hidden lg:block w-px bg-white/20 self-stretch my-8" />

      {/* Right panel: Branding */}
      <section className="relative z-10 hidden lg:flex flex-1 flex-col items-center justify-center overflow-hidden px-16 xl:px-24">
        <div className="absolute inset-0 bg-[url('/lost-found-bg.svg')] bg-cover bg-center opacity-90" />
        <div className="absolute inset-0 bg-slate-950/45" />
        <div className="relative w-full max-w-xl rounded-3xl border border-white/25 bg-black/35 p-10 shadow-2xl backdrop-blur-md space-y-8">

          {/* Headline */}
          <div className="space-y-3">
            <p className="text-xs font-medium tracking-[0.1em] text-cyan-200 uppercase">
              For students &amp; staff
            </p>
            <h1 className="text-3xl xl:text-5xl font-semibold tracking-tight text-white leading-tight">
              Lost and found,<br />made clear and fast.
            </h1>
            <p className="text-base leading-7 text-slate-200">
              Report lost and found items, check possible matches, and follow
              claim updates — all in one place.
            </p>
          </div>

          {/* Feature tiles */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { title: "Report", desc: "Log items instantly" },
              { title: "Match", desc: "Smart suggestions" },
              { title: "Claim", desc: "Track your request" },
            ].map(({ title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-white/20 bg-slate-900/40 px-4 py-4 space-y-1"
              >
                <p className="text-sm font-medium text-white">{title}</p>
                <p className="text-xs text-slate-200">{desc}</p>
              </div>
            ))}
          </div>

          {/* Stat strip */}
          <div className="flex gap-8 pt-2">
            {[
              { value: "98%", label: "Recovery rate" },
              { value: "< 2h", label: "Avg. match time" },
              { value: "4.9★", label: "User satisfaction" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-lg font-semibold text-white">{value}</p>
                <p className="text-xs text-cyan-100">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 lg:hidden border-t border-white/20 px-6 py-8 bg-black/20">
        <h1 className="text-xl font-semibold tracking-tight text-white mb-2">
          Lost and found, made clear and fast.
        </h1>
        <p className="text-sm text-slate-200 mb-4">
          Report, match, and claim — all in one place for students &amp; staff.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {["Report", "Match", "Claim"].map((label) => (
            <div
              key={label}
              className="rounded-lg border border-white/20 bg-slate-900/40 px-3 py-2 text-sm text-center text-slate-100"
            >
              {label}
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}