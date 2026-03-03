import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  Employee,
  EmployeeCreateRequest,
  EmployeeCreateResponse,
  EmployeesBrowseQuery,
  EmployeeUpdateRequest,
} from "@/core/interfaces/employees";

type NoContent = Record<string, never>;

export const EmployeesService = {
  create(payload: EmployeeCreateRequest): Promise<EmployeeCreateResponse> {
    return callEndpoint<EmployeeCreateResponse, EmployeeCreateRequest>(
      Endpoints.createEmployee,
      {
        body: payload,
      },
    );
  },

  browse(query?: EmployeesBrowseQuery): Promise<Employee[]> {
    const endpointWithQuery =
      Endpoints.browseEmployees.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<Employee[]>({
      ...Endpoints.browseEmployees,
      path: endpointWithQuery,
    });
  },

  readById(id: string): Promise<Employee> {
    return callEndpoint<Employee>(Endpoints.readEmployeeById, {
      params: { id },
    });
  },

  update(id: string, payload: EmployeeUpdateRequest): Promise<NoContent> {
    return callEndpoint<NoContent, EmployeeUpdateRequest>(
      Endpoints.updateEmployee,
      {
        params: { id },
        body: payload,
      },
    );
  },

  delete(id: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.deleteEmployee, {
      params: { id },
    });
  },

  checkIn(id: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.checkInEmployee, {
      params: { id },
    });
  },

  checkOut(id: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.checkOutEmployee, {
      params: { id },
    });
  },
};
