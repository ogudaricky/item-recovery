import { apiRequest } from "@/lib/api";
import type { LoginPayload, User } from "@/types/auth";

export async function login(payload: LoginPayload): Promise<User> {
  return apiRequest<User>("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logout(): Promise<void> {
  await apiRequest<void>("/api/auth/logout/", {
    method: "GET",
  });
}

export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>("/api/users/me/");
}
