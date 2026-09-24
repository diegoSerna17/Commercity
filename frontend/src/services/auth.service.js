import { createContext } from "react";
import { apiRequest } from "../api/apiClient";

export const AuthContext = createContext({ user: null, loading: true, refreshUser: async () => null });

export async function register(data) {
  const response = await apiRequest("/auth/register", { method: "POST", body: data });
  return response.user;
}

export async function login(data) {
  const response = await apiRequest("/auth/login", { method: "POST", body: data });
  return response.user;
}

export async function logout() {
  return apiRequest("/auth/logout", { method: "POST" });
}

export async function currentUser() {
  const response = await apiRequest("/auth/me");
  return response.user;
}
