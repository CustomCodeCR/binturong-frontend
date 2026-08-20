import { defineStore } from "pinia";

import { useAuthStore } from "@/core/stores/authStore";
import { UserPreferencesService } from "@/core/services/userPreferencesService";

/**
 * Preferencias de interfaz por usuario.
 *
 * La fuente de verdad es el backend (`/api/users/me/preferences/dashboard`),
 * de modo que la configuración acompaña al usuario entre dispositivos.
 * `localStorage` se mantiene como caché local: permite pintar la preferencia
 * correcta de inmediato y sobrevivir a una caída de la API.
 */

const STORAGE_PREFIX = "bt:preferences";

export interface DashboardPreferences {
  autoRefreshEnabled: boolean;
  autoRefreshSeconds: number;
}

export interface PreferencesState {
  dashboard: DashboardPreferences;
  loadedForUserId: string | null;
  syncing: boolean;
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

function writeStorage(userId: string | null, dashboard: DashboardPreferences) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify({ dashboard }));
  } catch {
    // Modo privado o cuota llena: la caché local se omite sin romper nada.
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
    syncing: false,
  }),

  actions: {
    /**
     * Carga las preferencias del usuario activo (idempotente).
     *
     * Pinta primero la caché local para evitar el parpadeo y luego consulta al
     * backend. Si la API falla, se conserva lo que había en caché.
     */
    async load() {
      const userId = useAuthStore().userId ?? null;

      if (this.loadedForUserId === userId) return;

      this.dashboard = sanitizeDashboard(readStorage(userId)?.dashboard);
      this.loadedForUserId = userId;

      if (!userId) return;

      try {
        const remote = await UserPreferencesService.readDashboard();

        this.dashboard = sanitizeDashboard({
          autoRefreshEnabled: remote.autoRefreshEnabled,
          autoRefreshSeconds: remote.refreshIntervalSeconds,
        });

        writeStorage(userId, this.dashboard);
      } catch {
        // Sin conexión con la API se sigue usando la preferencia en caché.
      }
    },

    /**
     * Aplica el cambio de inmediato y lo persiste en el backend.
     * Si la llamada falla, la preferencia igual sobrevive al refresco gracias
     * a la caché local.
     */
    async setDashboardPreferences(patch: Partial<DashboardPreferences>) {
      const previous = this.dashboard;
      const next = sanitizeDashboard({ ...this.dashboard, ...patch });

      if (
        next.autoRefreshEnabled === previous.autoRefreshEnabled &&
        next.autoRefreshSeconds === previous.autoRefreshSeconds
      ) {
        return;
      }

      this.dashboard = next;
      writeStorage(this.loadedForUserId, next);

      if (!this.loadedForUserId) return;

      this.syncing = true;

      try {
        await UserPreferencesService.updateDashboard({
          autoRefreshEnabled: next.autoRefreshEnabled,
          refreshIntervalSeconds: next.autoRefreshSeconds,
        });
      } catch {
        // El backend no aceptó el cambio; la caché local mantiene la elección
        // del usuario en este dispositivo.
      } finally {
        this.syncing = false;
      }
    },
  },
});
