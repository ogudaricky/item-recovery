export type UserRole = "student" | "staff" | "admin";

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  department: string;
  phone_number: string;
  campus_id: string | null;
  profile_image: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}
