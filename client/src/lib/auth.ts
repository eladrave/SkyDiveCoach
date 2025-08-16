import { apiRequest } from "./queryClient";
import type { User, LoginRequest, SignupRequest } from "@shared/schema";

export interface AuthResponse {
  user: User;
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await apiRequest("POST", "/api/auth/login", credentials);
  return response.json();
}

export async function signup(userData: SignupRequest): Promise<AuthResponse> {
  const response = await apiRequest("POST", "/api/auth/signup", userData);
  return response.json();
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
}

export async function getCurrentUser(): Promise<AuthResponse | null> {
  try {
    const response = await apiRequest("GET", "/api/auth/me");
    return response.json();
  } catch (error) {
    return null;
  }
}
