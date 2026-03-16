import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { AuthService } from "@/core/services/authService";
import { EmployeesService } from "@/core/services/employeesService";

import type { LoginRequest, LoginResponse } from "@/core/interfaces/auth";
import type { Employee } from "@/core/interfaces/employees";

const STORAGE_KEYS = {
  token: "token",
  userId: "auth.userId",
  username: "auth.username",
  email: "auth.email",
  roles: "auth.roles",
  scopes: "auth.scopes",
  employeeProfile: "auth.employeeProfile",
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

function readEmployeeFromStorage(): Employee | null {
  const value = localStorage.getItem(STORAGE_KEYS.employeeProfile);
  if (!value) return null;

  try {
    return JSON.parse(value) as Employee;
  } catch {
    return null;
  }
}

function readStringFromStorage(key: string): string | null {
  const value = localStorage.getItem(key);

  if (!value || value === "undefined" || value === "null") {
    return null;
  }

  return value;
}

export const useAuthStore = defineStore("auth", () => {
  const userId = ref<string | null>(readStringFromStorage(STORAGE_KEYS.userId));
  const username = ref<string | null>(
    readStringFromStorage(STORAGE_KEYS.username),
  );
  const email = ref<string | null>(readStringFromStorage(STORAGE_KEYS.email));
  const token = ref<string | null>(readStringFromStorage(STORAGE_KEYS.token));
  const roles = ref<string[]>(readArrayFromStorage(STORAGE_KEYS.roles));
  const scopes = ref<string[]>(readArrayFromStorage(STORAGE_KEYS.scopes));
  const employeeProfile = ref<Employee | null>(readEmployeeFromStorage());

  const isAuthenticated = computed(() => hasValidSession());

  const employeeAssigned = computed(() => !!employeeProfile.value?.employeeId);
  const employeeId = computed(() => employeeProfile.value?.employeeId ?? null);
  const employeeFullName = computed(
    () => employeeProfile.value?.fullName ?? null,
  );
  const employeeBranchName = computed(
    () => employeeProfile.value?.branchName ?? null,
  );
  const employeeBranchId = computed(
    () => employeeProfile.value?.branchId ?? null,
  );

  function setSession(data: LoginResponse) {
    userId.value = data.userId ?? null;
    username.value = data.username ?? null;
    email.value = data.email ?? null;
    token.value = data.token ?? null;
    roles.value = data.roles ?? [];
    scopes.value = data.scopes ?? [];

    if (data.userId) {
      localStorage.setItem(STORAGE_KEYS.userId, data.userId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.userId);
    }

    if (data.username) {
      localStorage.setItem(STORAGE_KEYS.username, data.username);
    } else {
      localStorage.removeItem(STORAGE_KEYS.username);
    }

    if (data.email) {
      localStorage.setItem(STORAGE_KEYS.email, data.email);
    } else {
      localStorage.removeItem(STORAGE_KEYS.email);
    }

    if (data.token) {
      localStorage.setItem(STORAGE_KEYS.token, data.token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.token);
    }

    localStorage.setItem(STORAGE_KEYS.roles, JSON.stringify(data.roles ?? []));
    localStorage.setItem(
      STORAGE_KEYS.scopes,
      JSON.stringify(data.scopes ?? []),
    );
  }

  function setEmployeeProfile(employee: Employee | null) {
    employeeProfile.value = employee;

    if (employee) {
      localStorage.setItem(
        STORAGE_KEYS.employeeProfile,
        JSON.stringify(employee),
      );
    } else {
      localStorage.removeItem(STORAGE_KEYS.employeeProfile);
    }
  }

  function clearSession() {
    userId.value = null;
    username.value = null;
    email.value = null;
    token.value = null;
    roles.value = [];
    scopes.value = [];
    employeeProfile.value = null;

    localStorage.removeItem(STORAGE_KEYS.userId);
    localStorage.removeItem(STORAGE_KEYS.username);
    localStorage.removeItem(STORAGE_KEYS.email);
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.roles);
    localStorage.removeItem(STORAGE_KEYS.scopes);
    localStorage.removeItem(STORAGE_KEYS.employeeProfile);
  }

  function isTokenExpired(currentToken?: string | null): boolean {
    if (!currentToken) return true;

    const expiresAt = getTokenExpiration(currentToken);

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

  async function loadEmployeeProfile() {
    const currentUserId = userId.value;

    if (
      !currentUserId ||
      currentUserId === "undefined" ||
      currentUserId === "null"
    ) {
      setEmployeeProfile(null);
      return null;
    }

    try {
      const employee = await EmployeesService.readByUserId(currentUserId);
      setEmployeeProfile(employee);
      return employee;
    } catch {
      setEmployeeProfile(null);
      return null;
    }
  }

  async function login(payload: LoginRequest): Promise<LoginResponse> {
    const response = await AuthService.login(payload);

    if (!response?.token) {
      throw new Error("Authentication token was not returned by the server");
    }

    setSession(response);
    await loadEmployeeProfile();

    return response;
  }

  function logout() {
    clearSession();
  }

  async function initialize() {
    if (!token.value) return;

    if (isTokenExpired(token.value)) {
      clearSession();
      return;
    }

    if (userId.value && !employeeProfile.value) {
      await loadEmployeeProfile();
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
    employeeProfile,
    employeeAssigned,
    employeeId,
    employeeFullName,
    employeeBranchName,
    employeeBranchId,
    isAuthenticated,
    login,
    logout,
    initialize,
    hasValidSession,
    hasRole,
    hasScope,
    isTokenExpired,
    loadEmployeeProfile,
    setEmployeeProfile,
  };
});
