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
  date_lost__gte?: string;
  date_lost__lte?: string;
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<{
  results: LostItem[];
  count: number;
  next: string | null;
  previous: string | null;
}> {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.category) search.set("category", params.category);
  if (params?.date_lost__gte) search.set("date_lost__gte", params.date_lost__gte);
  if (params?.date_lost__lte) search.set("date_lost__lte", params.date_lost__lte);
  if (params?.search) search.set("search", params.search);
  if (params?.page) search.set("page", String(params.page));
  if (params?.page_size) search.set("page_size", String(params.page_size));
  const query = search.toString();
  const path = query ? `/api/items/lost/?${query}` : `/api/items/lost/`;

  const response = await apiRequest<{
    results?: LostItem[];
    count?: number;
    next?: string | null;
    previous?: string | null;
  } | LostItem[]>(path);

  if (Array.isArray(response)) {
    return {
      results: response,
      count: response.length,
      next: null,
      previous: null,
    };
  }

  return {
    results: response.results ?? [],
    count: response.count ?? response.results?.length ?? 0,
    next: response.next ?? null,
    previous: response.previous ?? null,
  };
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
  date_found__gte?: string;
  date_found__lte?: string;
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<{
  results: FoundItem[];
  count: number;
  next: string | null;
  previous: string | null;
}> {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.category) search.set("category", params.category);
  if (params?.date_found__gte) search.set("date_found__gte", params.date_found__gte);
  if (params?.date_found__lte) search.set("date_found__lte", params.date_found__lte);
  if (params?.search) search.set("search", params.search);
  if (params?.page) search.set("page", String(params.page));
  if (params?.page_size) search.set("page_size", String(params.page_size));
  const query = search.toString();
  const path = query ? `/api/items/found/?${query}` : `/api/items/found/`;

  const response = await apiRequest<{
    results?: FoundItem[];
    count?: number;
    next?: string | null;
    previous?: string | null;
  } | FoundItem[]>(path);

  if (Array.isArray(response)) {
    return {
      results: response,
      count: response.length,
      next: null,
      previous: null,
    };
  }

  return {
    results: response.results ?? [],
    count: response.count ?? response.results?.length ?? 0,
    next: response.next ?? null,
    previous: response.previous ?? null,
  };
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