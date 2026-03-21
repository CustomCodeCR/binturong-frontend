import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type { Dashboard, DashboardQuery } from "@/core/interfaces/dashboard";

export const DashboardService = {
  read(query?: DashboardQuery): Promise<Dashboard> {
    const endpointWithQuery =
      Endpoints.readDashboard.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<Dashboard>({
      ...Endpoints.readDashboard,
      path: endpointWithQuery,
    });
  },
};
