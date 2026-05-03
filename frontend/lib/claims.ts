import { apiRequest } from "@/lib/api";
import type { ItemClaim } from "@/types/claims";

export async function listClaims(params?: { status?: string }): Promise<ItemClaim[]> {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  const query = search.toString();
  const path = query ? `/api/claims/?${query}` : "/api/claims/";
  return apiRequest<ItemClaim[]>(path);
}

export async function createClaim(matchId: number): Promise<ItemClaim> {
  return apiRequest<ItemClaim>("/api/claims/", {
    method: "POST",
    body: JSON.stringify({ match: matchId }),
  });
}

export async function verifyClaim(
  claimId: number,
  decision: "approved" | "rejected",
): Promise<ItemClaim> {
  return apiRequest<ItemClaim>(`/api/claims/${claimId}/verify/`, {
    method: "POST",
    body: JSON.stringify({ decision }),
  });
}
