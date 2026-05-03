import type { FoundItem, LostItem } from "@/types/items";

export interface ItemMatch {
  id: number;
  lost_item: LostItem;
  found_item: FoundItem;
  match_score: number;
  status: "pending" | "verified" | "claimed";
  created_at: string;
}
