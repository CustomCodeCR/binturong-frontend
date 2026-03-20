import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  Service,
  ServiceCreateRequest,
  ServiceCreateResponse,
  ServicesBrowseQuery,
  ServiceUpdateRequest,
} from "@/core/interfaces/services";

type NoContent = Record<string, never>;

export const ServicesService = {
  create(payload: ServiceCreateRequest): Promise<ServiceCreateResponse> {
    return callEndpoint<ServiceCreateResponse, ServiceCreateRequest>(
      Endpoints.createService,
      {
        body: payload,
      },
    );
  },

  browse(query?: ServicesBrowseQuery): Promise<Service[]> {
    const endpointWithQuery =
      Endpoints.browseServices.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<Service[]>({
      ...Endpoints.browseServices,
      path: endpointWithQuery,
    });
  },

  readById(id: string): Promise<Service> {
    return callEndpoint<Service>(Endpoints.readServiceById, {
      params: { id },
    });
  },

  update(id: string, payload: ServiceUpdateRequest): Promise<NoContent> {
    return callEndpoint<NoContent, ServiceUpdateRequest>(
      Endpoints.updateService,
      {
        params: { id },
        body: payload,
      },
    );
  },
};
