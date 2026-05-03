"use client";

import { useEffect, useMemo, useState, type SyntheticEvent } from "react";

import { AppSidebar } from "@/components/layout/top-nav";
import { createClaim, listClaims, verifyClaim } from "@/lib/claims";
import { listMatches } from "@/lib/matches";
import type { ItemClaim } from "@/types/claims";
import type { ItemMatch } from "@/types/matches";

function formatDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function ClaimsPage() {
  const [availableMatches, setAvailableMatches] = useState<ItemMatch[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [claims, setClaims] = useState<ItemClaim[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Choose a possible match, then submit your claim.");

  const selectedMatch = useMemo(
      () => availableMatches.find((match) => String(match.id) === selectedMatchId) ?? null,
      [availableMatches, selectedMatchId],
  );

  useEffect(() => {
    let alive = true;

    async function bootstrap() {
      setLoading(true);
      setMessage("Loading available possible matches and claims...");
      try {
        const [matchesRows, claimsRows] = await Promise.all([
          listMatches(),
          listClaims(),
        ]);
        if (!alive) return;
        const pendingMatches = matchesRows.filter((row) => row.status === "pending");
        setAvailableMatches(pendingMatches);
        setClaims(claimsRows);
        if (pendingMatches.length > 0) {
          setSelectedMatchId(String(pendingMatches[0].id));
          setMessage("Choose a possible match, then submit your claim.");
        } else {
          setMessage("No open possible matches are available right now.");
        }
      } catch (error) {
        if (!alive) return;
        const text = error instanceof Error ? error.message : "Unknown error";
        setMessage(`We could not load claims information. ${text}`);
      } finally {
        if (alive) setLoading(false);
      }
    }

    void bootstrap();
    return () => {
      alive = false;
    };
  }, []);

  async function handleLoadClaims() {
    setLoading(true);
    setMessage("Loading claims...");
    try {
      const rows = await listClaims();
      setClaims(rows);
      setMessage(`Loaded ${rows.length} claims.`);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unknown error";
      setMessage(`We could not load claims. ${text}`);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateClaim = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = Number(selectedMatchId);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setMessage("Please select a match.");
      return;
    }
    setLoading(true);
    setMessage("Submitting your claim...");
    try {
      const created = await createClaim(parsed);
      setClaims((previous) => [created, ...previous]);
      setMessage(`Your claim was submitted. Reference number: ${created.id}.`);
      const matchesRows = await listMatches();
      const pendingMatches = matchesRows.filter((row) => row.status === "pending");
      setAvailableMatches(pendingMatches);
      if (!pendingMatches.find((match) => String(match.id) === selectedMatchId)) {
        setSelectedMatchId(pendingMatches[0] ? String(pendingMatches[0].id) : "");
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unknown error";
      setMessage(`We could not submit your claim. ${text}`);
    } finally {
      setLoading(false);
    }
  };

  async function handleVerify(claimId: number, decision: "approved" | "rejected") {
    setLoading(true);
    setMessage(`Saving decision for claim #${claimId}...`);
    try {
      const updated = await verifyClaim(claimId, decision);
      setClaims((previous) =>
          previous.map((claim) => (claim.id === claimId ? updated : claim)),
      );
      setMessage(`Claim #${claimId} updated to ${updated.status}.`);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unknown error";
      setMessage(`We could not save this decision. ${text}`);
    } finally {
      setLoading(false);
    }
  }

  return (
      <main className="relative min-h-screen overflow-hidden px-6 py-10 lg:pl-[240px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_8%,_#8686AC22,_transparent_44%),radial-gradient(circle_at_92%_90%,_#2727571C,_transparent_50%)]" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6">
          <AppSidebar />
          <header className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm">
            <h1 className="text-2xl font-semibold">Claims</h1>
            <p className="text-sm text-muted-foreground">
              Submit ownership claims from available possible matches. Staff can approve or reject.
            </p>
          </header>

          <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm">
            <h2 className="mb-3 text-base font-medium">Submit a Claim</h2>
            <form className="flex flex-wrap items-end gap-3" onSubmit={handleCreateClaim}>
              <div className="min-w-96 space-y-1">
                <label className="text-sm" htmlFor="match-select">
                  Choose possible match
                </label>
                <select
                    id="match-select"
                    className="w-full rounded-lg border border-border/80 bg-background/70 px-3 py-2 text-sm"
                    value={selectedMatchId}
                    onChange={(event) => setSelectedMatchId(event.target.value)}
                    disabled={availableMatches.length === 0}
                    required
                >
                  {availableMatches.length === 0 ? (
                      <option value="">No pending matches</option>
                  ) : (
                      availableMatches.map((match) => (
                          <option key={match.id} value={match.id}>
                            {match.lost_item.name} to {match.found_item.name} (score {match.match_score})
                          </option>
                      ))
                  )}
                </select>
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedMatch
                    ? `Selected: ${selectedMatch.lost_item.location} / ${selectedMatch.found_item.location}`
                    : "Select a possible match to continue."}
              </div>
              <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground shadow-sm transition-opacity disabled:opacity-60"
                  disabled={loading || !selectedMatchId}
              >
                Create claim
              </button>
              <button
                  type="button"
                  className="rounded-lg border border-border/80 bg-background/70 px-4 py-2 text-sm transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60"
                  onClick={handleLoadClaims}
                  disabled={loading}
              >
                Refresh
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm">
            <h2 className="mb-3 text-base font-medium">Claim History</h2>
            <p className="mb-3 text-sm text-muted-foreground">{message}</p>

            {claims.length === 0 ? (
                <p className="text-sm text-muted-foreground">No claims to show yet.</p>
            ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px] text-left text-sm">
                    <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Reference</th>
                      <th className="py-2 pr-3 font-medium">Match</th>
                      <th className="py-2 pr-3 font-medium">Claimant</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="py-2 pr-3 font-medium">Created</th>
                      <th className="py-2 pr-3 font-medium">Reviewed by</th>
                      <th className="py-2 pr-3 font-medium">Reviewed at</th>
                      <th className="py-2 font-medium">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {claims.map((claim) => (
                        <tr key={claim.id} className="border-b border-border/60">
                          <td className="py-2 pr-3">#{claim.id}</td>
                          <td className="py-2 pr-3">
                            Match #{claim.match.id} ({claim.match.match_score})
                          </td>
                          <td className="py-2 pr-3">{claim.claimant.username}</td>
                          <td className="py-2 pr-3">{claim.status}</td>
                          <td className="py-2 pr-3">{formatDate(claim.created_at)}</td>
                          <td className="py-2 pr-3">{claim.verified_by?.username ?? "-"}</td>
                          <td className="py-2 pr-3">{formatDate(claim.verified_at)}</td>
                          <td className="py-2">
                            {claim.status === "pending" ? (
                                <div className="flex gap-2">
                                  <button
                                      type="button"
                                      className="rounded-md border border-border/80 bg-background/70 px-3 py-1 text-xs transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60"
                                      onClick={() => handleVerify(claim.id, "approved")}
                                      disabled={loading}
                                  >
                                    Approve
                                  </button>
                                  <button
                                      type="button"
                                      className="rounded-md border border-border/80 bg-background/70 px-3 py-1 text-xs transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60"
                                      onClick={() => handleVerify(claim.id, "rejected")}
                                      disabled={loading}
                                  >
                                    Reject
                                  </button>
                                </div>
                            ) : (
                                <span className="text-xs text-muted-foreground">No actions</span>
                            )}
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