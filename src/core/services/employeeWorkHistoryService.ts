import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";

import type { EmployeeWorkHistory } from "@/core/interfaces/employeeWorkHistory";

export const EmployeeWorkHistoryService = {
  readByEmployeeId(id: string): Promise<EmployeeWorkHistory> {
    return callEndpoint<EmployeeWorkHistory>(
      Endpoints.readEmployeeWorkHistory,
      {
        params: { id },
      },
    );
  },

  exportByEmployeeId(id: string): Promise<Blob> {
    return callEndpoint<Blob>(Endpoints.exportEmployeeWorkHistory, {
      params: { id },
      responseType: "blob",
    });
  },
};
