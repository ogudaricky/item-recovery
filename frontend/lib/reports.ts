import { apiRequest } from "@/lib/api";

export interface AdminReportSummary {
  total_users: number;
  active_users: number;
  inactive_users: number;
  total_lost_items: number;
  total_found_items: number;
  total_matches: number;
  total_claims: number;
  match_status: Record<string, number>;
  claim_status: Record<string, number>;
  user_roles: Record<string, number>;
}

export async function getAdminReportSummary(): Promise<AdminReportSummary> {
  return apiRequest<AdminReportSummary>("/api/reports/");
}
