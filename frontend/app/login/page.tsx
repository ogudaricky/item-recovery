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
      router.push("/dashboard");
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
      router.push("/dashboard");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unknown error";
      setMessage(`You are not signed in. ${text}`);
    } finally {
      setCheckingSession(false);
    }
  }

  const isBusy = loading || checkingSession;

  return (
    <main className="min-h-screen bg-background flex flex-col lg:flex-row">

      {/* Left panel: Login form */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16 xl:px-24">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <p className="text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase mb-8">
            ItemRecovery
          </p>

          <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
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
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs text-muted-foreground">
              <span className="bg-background px-2">or</span>
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
            <p className="mt-4 text-sm text-muted-foreground text-center">{message}</p>
          )}

          <p className="mt-8 text-[11px] text-muted-foreground/50 text-center">
            Server: {baseUrl}
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="hidden lg:block w-px bg-border/40 self-stretch my-8" />

      {/* Right panel: Branding */}
      <section className="hidden lg:flex flex-1 flex-col items-center justify-center px-16 xl:px-24 bg-muted/30">
        <div className="max-w-md w-full space-y-8">

          {/* Headline */}
          <div className="space-y-3">
            <p className="text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase">
              For students &amp; staff
            </p>
            <h1 className="text-3xl xl:text-4xl font-semibold tracking-tight text-foreground leading-snug">
              Lost and found,<br />made clear and fast.
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
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
                className="rounded-xl border border-border/60 bg-background/70 px-4 py-4 space-y-1"
              >
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
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
                <p className="text-lg font-semibold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lg:hidden border-t border-border/40 px-6 py-8 bg-muted/20">
        <h1 className="text-xl font-semibold tracking-tight text-foreground mb-2">
          Lost and found, made clear and fast.
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          Report, match, and claim — all in one place for students &amp; staff.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {["Report", "Match", "Claim"].map((label) => (
            <div
              key={label}
              className="rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm text-center text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}