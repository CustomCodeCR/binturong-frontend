import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  AssignServiceOrderTechnicianRequest,
  ServiceOrder,
  ServiceOrderCreateRequest,
  ServiceOrderCreateResponse,
  ServiceOrdersBrowseQuery,
} from "@/core/interfaces/serviceOrders";

type NoContent = Record<string, never>;

export const ServiceOrdersService = {
  create(
    payload: ServiceOrderCreateRequest,
  ): Promise<ServiceOrderCreateResponse> {
    return callEndpoint<ServiceOrderCreateResponse, ServiceOrderCreateRequest>(
      Endpoints.createServiceOrder,
      {
        body: payload,
      },
    );
  },

  browse(query?: ServiceOrdersBrowseQuery): Promise<ServiceOrder[]> {
    const endpointWithQuery =
      Endpoints.browseServiceOrders.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<ServiceOrder[]>({
      ...Endpoints.browseServiceOrders,
      path: endpointWithQuery,
    });
  },

  readById(id: string): Promise<ServiceOrder> {
    return callEndpoint<ServiceOrder>(Endpoints.readServiceOrderById, {
      params: { id },
    });
  },

  assignTechnician(
    id: string,
    payload: AssignServiceOrderTechnicianRequest,
  ): Promise<NoContent> {
    return callEndpoint<NoContent, AssignServiceOrderTechnicianRequest>(
      Endpoints.assignServiceOrderTechnician,
      {
        params: { id },
        body: payload,
      },
    );
  },
};
