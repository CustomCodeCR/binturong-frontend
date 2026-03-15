import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { AuthService } from "@/core/services/authService";
import type { LoginRequest, LoginResponse } from "@/core/interfaces/auth";

const STORAGE_KEYS = {
  token: "token",
  userId: "auth.userId",
  username: "auth.username",
  email: "auth.email",
  roles: "auth.roles",
  scopes: "auth.scopes",
};

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );

    const decoded = atob(normalized);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getTokenExpiration(token: string): number | null {
  const payload = parseJwtPayload(token);
  if (!payload) return null;

  const exp = payload.exp;
  if (typeof exp !== "number") return null;

  return exp * 1000;
}

function readArrayFromStorage(key: string): string[] {
  const value = localStorage.getItem(key);
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const useAuthStore = defineStore("auth", () => {
  const userId = ref<string | null>(localStorage.getItem(STORAGE_KEYS.userId));
  const username = ref<string | null>(
    localStorage.getItem(STORAGE_KEYS.username),
  );
  const email = ref<string | null>(localStorage.getItem(STORAGE_KEYS.email));
  const token = ref<string | null>(localStorage.getItem(STORAGE_KEYS.token));
  const roles = ref<string[]>(readArrayFromStorage(STORAGE_KEYS.roles));
  const scopes = ref<string[]>(readArrayFromStorage(STORAGE_KEYS.scopes));

  const isAuthenticated = computed(() => hasValidSession());

  function setSession(data: LoginResponse) {
    userId.value = data.userId;
    username.value = data.username;
    email.value = data.email;
    token.value = data.token;
    roles.value = data.roles ?? [];
    scopes.value = data.scopes ?? [];

    localStorage.setItem(STORAGE_KEYS.userId, data.userId);
    localStorage.setItem(STORAGE_KEYS.username, data.username);
    localStorage.setItem(STORAGE_KEYS.email, data.email);
    localStorage.setItem(STORAGE_KEYS.token, data.token);
    localStorage.setItem(STORAGE_KEYS.roles, JSON.stringify(data.roles ?? []));
    localStorage.setItem(
      STORAGE_KEYS.scopes,
      JSON.stringify(data.scopes ?? []),
    );
  }

  function clearSession() {
    userId.value = null;
    username.value = null;
    email.value = null;
    token.value = null;
    roles.value = [];
    scopes.value = [];

    localStorage.removeItem(STORAGE_KEYS.userId);
    localStorage.removeItem(STORAGE_KEYS.username);
    localStorage.removeItem(STORAGE_KEYS.email);
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.roles);
    localStorage.removeItem(STORAGE_KEYS.scopes);
  }

  function isTokenExpired(currentToken?: string | null): boolean {
    if (!currentToken) return true;

    const expiresAt = getTokenExpiration(currentToken);

    // Si no se puede leer exp, NO lo marques vencido.
    if (!expiresAt) return false;

    return Date.now() >= expiresAt;
  }

  function hasValidSession(): boolean {
    if (!token.value) return false;

    if (isTokenExpired(token.value)) {
      clearSession();
      return false;
    }

    return true;
  }

  async function login(payload: LoginRequest): Promise<LoginResponse> {
    const response = await AuthService.login(payload);

    if (!response?.token) {
      throw new Error("Authentication token was not returned by the server");
    }

    setSession(response);
    return response;
  }

  function logout() {
    clearSession();
  }

  function initialize() {
    if (!token.value) return;

    if (isTokenExpired(token.value)) {
      clearSession();
    }
  }

  function hasRole(role: string): boolean {
    return roles.value.includes(role);
  }

  function hasScope(scope: string): boolean {
    return scopes.value.includes(scope);
  }

  return {
    userId,
    username,
    email,
    token,
    roles,
    scopes,
    isAuthenticated,
    login,
    logout,
    initialize,
    hasValidSession,
    hasRole,
    hasScope,
    isTokenExpired,
  };
});
