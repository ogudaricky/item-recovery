import type { User } from "@/types/auth";
import type { ItemMatch } from "@/types/matches";

export interface ItemClaim {
  id: number;
  claimant: User;
  match: ItemMatch;
  status: "pending" | "approved" | "rejected";
  verification_method: "admin_review" | "security_question";
  verified_by: User | null;
  verified_at: string | null;
  created_at: string;
}
