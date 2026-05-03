import { apiRequest } from "@/lib/api";
import type { AppNotification } from "@/types/notifications";

export async function listNotifications(params?: {
  unread?: boolean;
}): Promise<AppNotification[]> {
  const search = new URLSearchParams();
  if (params?.unread) {
    search.set("unread", "true");
  }
  const query = search.toString();
  const path = query ? `/api/notifications/?${query}` : "/api/notifications/";
  return apiRequest<AppNotification[]>(path);
}

export async function markNotificationRead(id: number): Promise<AppNotification> {
  return apiRequest<AppNotification>(`/api/notifications/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ is_read: true }),
  });
}
