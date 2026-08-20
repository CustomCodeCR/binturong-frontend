import { defineStore } from "pinia";

import { useAuthStore } from "@/core/stores/authStore";

/**
 * Preferencias de interfaz por usuario.
 *
 * Se persisten en `localStorage` bajo una clave derivada del usuario activo,
 * de modo que la configuración sobrevive a un refresco o a navegar a otro
 * módulo, y dos usuarios en el mismo equipo no comparten ajustes.
 */

const STORAGE_PREFIX = "bt:preferences";

export interface DashboardPreferences {
  autoRefreshEnabled: boolean;
  autoRefreshSeconds: number;
}

export interface PreferencesState {
  dashboard: DashboardPreferences;
  loadedForUserId: string | null;
}

const DEFAULT_DASHBOARD: DashboardPreferences = {
  autoRefreshEnabled: true,
  autoRefreshSeconds: 60,
};

export const ALLOWED_AUTO_REFRESH_SECONDS = [30, 60, 120, 300];

function storageKey(userId: string | null): string {
  return `${STORAGE_PREFIX}:${userId || "anonymous"}`;
}

function readStorage(userId: string | null): Partial<PreferencesState> | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as Partial<PreferencesState>) : null;
  } catch {
    return null;
  }
}

function writeStorage(userId: string | null, state: PreferencesState): void {
  try {
    localStorage.setItem(
      storageKey(userId),
      JSON.stringify({ dashboard: state.dashboard }),
    );
  } catch {
    // Modo privado o cuota llena: la preferencia solo dura la sesión actual.
  }
}

function sanitizeDashboard(value: unknown): DashboardPreferences {
  const source = (value ?? {}) as Partial<DashboardPreferences>;

  const seconds = Number(source.autoRefreshSeconds);

  return {
    autoRefreshEnabled:
      typeof source.autoRefreshEnabled === "boolean"
        ? source.autoRefreshEnabled
        : DEFAULT_DASHBOARD.autoRefreshEnabled,
    autoRefreshSeconds: ALLOWED_AUTO_REFRESH_SECONDS.includes(seconds)
      ? seconds
      : DEFAULT_DASHBOARD.autoRefreshSeconds,
  };
}

export const usePreferencesStore = defineStore("preferences", {
  state: (): PreferencesState => ({
    dashboard: { ...DEFAULT_DASHBOARD },
    loadedForUserId: null,
  }),

  actions: {
    /** Carga las preferencias del usuario activo (idempotente). */
    load() {
      const userId = useAuthStore().userId ?? null;

      if (this.loadedForUserId === userId) return;

      const stored = readStorage(userId);
      this.dashboard = sanitizeDashboard(stored?.dashboard);
      this.loadedForUserId = userId;
    },

    setDashboardPreferences(patch: Partial<DashboardPreferences>) {
      this.dashboard = sanitizeDashboard({ ...this.dashboard, ...patch });
      writeStorage(this.loadedForUserId, this.$state);
    },
  },
});
