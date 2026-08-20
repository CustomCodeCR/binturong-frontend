import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";

import type {
  DashboardPreferencesResponse,
  DashboardPreferencesUpdateRequest,
} from "@/core/interfaces/userPreferences";

type NoContent = Record<string, never>;

export const UserPreferencesService = {
  readDashboard(): Promise<DashboardPreferencesResponse> {
    return callEndpoint<DashboardPreferencesResponse>(
      Endpoints.getDashboardPreferences,
    );
  },

  updateDashboard(
    payload: DashboardPreferencesUpdateRequest,
  ): Promise<NoContent> {
    return callEndpoint<NoContent, DashboardPreferencesUpdateRequest>(
      Endpoints.updateDashboardPreferences,
      { body: payload },
    );
  },
};
