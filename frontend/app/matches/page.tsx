"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AppSidebar } from "@/components/layout/top-nav";
import { listLostItems } from "@/lib/items";
import { listMatches, recomputeMatches } from "@/lib/matches";
import type { LostItem } from "@/types/items";
import type { ItemMatch } from "@/types/matches";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export default function MatchesPage() {
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [selectedLostId, setSelectedLostId] = useState("");
  const [matches, setMatches] = useState<ItemMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);
  const [message, setMessage] = useState("Loading your lost reports...");

  const selectedLostItem = useMemo(
      () => lostItems.find((item) => String(item.id) === selectedLostId) ?? null,
      [lostItems, selectedLostId],
  );

  useEffect(() => {
    let alive = true;

    async function loadLostItems() {
      setLoading(true);
      try {
        const items = await listLostItems({ status: "active" });
        if (!alive) return;
        setLostItems(items);
        if (items.length > 0) {
          const firstId = String(items[0].id);
          setSelectedLostId(firstId);
          setMessage("Choose a lost report, then load possible matches.");
        } else {
          setMessage("You have no active lost reports yet.");
        }
      } catch (error) {
        if (!alive) return;
        const text = error instanceof Error ? error.message : "Unknown error";
        setMessage(`We could not load your lost reports. ${text}`);
      } finally {
        if (alive) setLoading(false);
      }
    }

    void loadLostItems();
    return () => {
      alive = false;
    };
  }, []);

  async function handleLoadMatches() {
    if (!selectedLostId) return;
    setLoading(true);
    setMessage("Loading possible matches...");
    try {
      const rows = await listMatches({ lost_id: selectedLostId });
      setMatches(rows);
      setMessage(`Found ${rows.length} possible match(es).`);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unknown error";
      setMessage(`We could not load possible matches. ${text}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleRecompute() {
    if (!selectedLostItem) return;
    setRecomputing(true);
    setMessage("Checking for new possible matches...");
    try {
      const rows = await recomputeMatches(selectedLostItem.id);
      setMatches(rows);
      setMessage(`Done. ${rows.length} possible match(es) found.`);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unknown error";
      setMessage(`We could not check for new matches. ${text}`);
    } finally {
      setRecomputing(false);
    }
  }

  return (
      <main className="relative min-h-screen overflow-hidden px-6 py-10 lg:pl-[240px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_8%,_#8686AC22,_transparent_44%),radial-gradient(circle_at_92%_90%,_#2727571C,_transparent_50%)]" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6">
          <AppSidebar />
          <header className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm">
            <h1 className="text-2xl font-semibold">Possible Matches</h1>
            <p className="text-sm text-muted-foreground">
              Find and review possible matches for your lost reports.
            </p>
          </header>

          <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm">
            <h2 className="mb-3 text-base font-medium">Find Matches</h2>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-56 space-y-1">
                <label className="text-sm" htmlFor="lost-item">
                  Lost report
                </label>
                <select
                    id="lost-item"
                    value={selectedLostId}
                    onChange={(event) => setSelectedLostId(event.target.value)}
                    className="w-full rounded-lg border border-border/80 bg-background/70 px-3 py-2 text-sm"
                    disabled={lostItems.length === 0}
                >
                  {lostItems.length === 0 ? (
                      <option value="">No active items</option>
                  ) : (
                      lostItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({formatDate(item.date_lost)})
                          </option>
                      ))
                  )}
                </select>
              </div>

              <button
                  type="button"
                  className="rounded-lg border border-border/80 bg-background/70 px-4 py-2 text-sm transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60"
                  onClick={handleLoadMatches}
                  disabled={!selectedLostId || loading || recomputing}
              >
                Show matches
              </button>

              <button
                  type="button"
                  className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground shadow-sm transition-opacity disabled:opacity-60"
                  onClick={handleRecompute}
                  disabled={!selectedLostId || loading || recomputing}
              >
                Check again
              </button>

              <Link
                  href="/report-lost"
                  className="rounded-lg border border-border/80 bg-background/70 px-4 py-2 text-sm transition-colors hover:border-primary/40 hover:text-primary"
              >
                Create lost report
              </Link>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{message}</p>
          </section>

          <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm">
            <h2 className="mb-3 text-base font-medium">Match Results</h2>

            {matches.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No matches to show. Try Check again or pick another lost report.
                </p>
            ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Lost report</th>
                      <th className="py-2 pr-3 font-medium">Found report</th>
                      <th className="py-2 pr-3 font-medium">Score</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="py-2 pr-3 font-medium">Date</th>
                      <th className="py-2 font-medium">Next step</th>
                    </tr>
                    </thead>
                    <tbody>
                    {matches.map((match) => (
                        <tr key={match.id} className="border-b border-border/60">
                          <td className="py-2 pr-3">
                            {match.lost_item.name}
                            <div className="text-xs text-muted-foreground">
                              {match.lost_item.location}
                            </div>
                          </td>
                          <td className="py-2 pr-3">
                            {match.found_item.name}
                            <div className="text-xs text-muted-foreground">
                              {match.found_item.location}
                            </div>
                          </td>
                          <td className="py-2 pr-3">{match.match_score}</td>
                          <td className="py-2 pr-3">{match.status}</td>
                          <td className="py-2 pr-3">{formatDate(match.created_at)}</td>
                          <td className="py-2">
                            <Link className="text-primary underline underline-offset-2" href="/claims">
                              Go to claims
                            </Link>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
            )}
          </section>
        </div>
      </main>
  );
}