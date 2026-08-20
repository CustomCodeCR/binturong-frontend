/** Preferencias de interfaz que el backend guarda por usuario. */

export interface DashboardPreferencesResponse {
  userId: string;
  autoRefreshEnabled: boolean;
  /** El backend solo acepta valores entre 15 y 3600 segundos. */
  refreshIntervalSeconds: number;
  updatedAtUtc?: string | null;
}

export interface DashboardPreferencesUpdateRequest {
  autoRefreshEnabled: boolean;
  refreshIntervalSeconds: number;
}
