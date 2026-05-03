import { apiRequest } from "@/lib/api";
import type {
  FoundItem,
  FoundItemCreatePayload,
  LostItem,
  LostItemCreatePayload,
} from "@/types/items";

export async function listLostItems(params?: {
  status?: string;
  category?: string;
}): Promise<LostItem[]> {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.category) search.set("category", params.category);
  const query = search.toString();
  const path = query ? `/api/items/lost/?${query}` : "/api/items/lost/";
  return apiRequest<LostItem[]>(path);
}

export async function createLostItem(
  payload: LostItemCreatePayload,
): Promise<LostItem> {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("description", payload.description ?? "");
  formData.append("category", payload.category);
  formData.append("color", payload.color ?? "");
  formData.append("date_lost", payload.date_lost);
  formData.append("location", payload.location);
  if (payload.image) {
    formData.append("image", payload.image);
  }
  return apiRequest<LostItem>("/api/items/lost/", {
    method: "POST",
    body: formData,
  });
}

export async function listFoundItems(params?: {
  status?: string;
  category?: string;
}): Promise<FoundItem[]> {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.category) search.set("category", params.category);
  const query = search.toString();
  const path = query ? `/api/items/found/?${query}` : "/api/items/found/";
  return apiRequest<FoundItem[]>(path);
}

export async function createFoundItem(
  payload: FoundItemCreatePayload,
): Promise<FoundItem> {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("description", payload.description ?? "");
  formData.append("category", payload.category);
  formData.append("color", payload.color ?? "");
  formData.append("date_found", payload.date_found);
  formData.append("location", payload.location);
  if (payload.image) {
    formData.append("image", payload.image);
  }
  return apiRequest<FoundItem>("/api/items/found/", {
    method: "POST",
    body: formData,
  });
}
