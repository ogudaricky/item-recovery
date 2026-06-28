import { apiRequest } from "@/lib/api";
import type { User } from "@/types/auth";

export async function listUsers(params?: {
  role?: string;
  is_active?: boolean;
}): Promise<User[]> {
  const search = new URLSearchParams();
  if (params?.role) search.set("role", params.role);
  if (params?.is_active !== undefined) search.set("is_active", String(params.is_active));
  const query = search.toString();
  const path = query ? `/api/users/?${query}` : "/api/users/";
  return apiRequest<User[]>(path);
}

export async function getUser(id: number): Promise<User> {
  return apiRequest<User>(`/api/users/${id}/`);
}

export async function updateUser(
  id: number,
  payload: Partial<Omit<User, "id">>
): Promise<User> {
  return apiRequest<User>(`/api/users/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(id: number): Promise<void> {
  await apiRequest<void>(`/api/users/${id}/`, {
    method: "DELETE",
  });
}

export async function toggleUserStatus(
  id: number,
  is_active: boolean
): Promise<User> {
  return apiRequest<User>(`/api/users/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ is_active }),
  });
}

export async function updateUserRole(
  id: number,
  role: "student" | "staff" | "admin"
): Promise<User> {
  return apiRequest<User>(`/api/users/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}