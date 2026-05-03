import { apiRequest } from "@/lib/api";
import type { ItemMatch } from "@/types/matches";

export async function listMatches(params?: {
  lost_id?: string;
  found_id?: string;
}): Promise<ItemMatch[]> {
  const search = new URLSearchParams();
  if (params?.lost_id) search.set("lost_id", params.lost_id);
  if (params?.found_id) search.set("found_id", params.found_id);
  const query = search.toString();
  const path = query ? `/api/matches/?${query}` : "/api/matches/";
  return apiRequest<ItemMatch[]>(path);
}

export async function recomputeMatches(lostItemId: number): Promise<ItemMatch[]> {
  return apiRequest<ItemMatch[]>("/api/matches/recompute/", {
    method: "POST",
    body: JSON.stringify({ lost_item: lostItemId }),
  });
}
