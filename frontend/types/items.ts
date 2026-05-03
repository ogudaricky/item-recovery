import type { User } from "@/types/auth";

export interface LostItem {
  id: number;
  user: User;
  name: string;
  description: string;
  category: string;
  color: string;
  date_lost: string;
  location: string;
  status: "active" | "resolved";
  image: string | null;
  created_at: string;
}

export interface LostItemCreatePayload {
  name: string;
  description?: string;
  category: string;
  color?: string;
  date_lost: string;
  location: string;
  image?: File | null;
}

export interface FoundItem {
  id: number;
  user: User;
  name: string;
  description: string;
  category: string;
  color: string;
  date_found: string;
  location: string;
  status: "unclaimed" | "claimed";
  image: string | null;
  created_at: string;
}

export interface FoundItemCreatePayload {
  name: string;
  description?: string;
  category: string;
  color?: string;
  date_found: string;
  location: string;
  image?: File | null;
}
