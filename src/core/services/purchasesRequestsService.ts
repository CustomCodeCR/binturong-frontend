import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  PurchaseRequest,
  PurchaseRequestCreateRequest,
  PurchaseRequestCreateResponse,
  PurchaseRequestsBrowseQuery,
} from "@/core/interfaces/purchasesRequests";

export const PurchasesRequestsService = {
  create(
    payload: PurchaseRequestCreateRequest,
  ): Promise<PurchaseRequestCreateResponse> {
    return callEndpoint<
      PurchaseRequestCreateResponse,
      PurchaseRequestCreateRequest
    >(Endpoints.createPurchaseRequest, { body: payload });
  },

  browse(query?: PurchaseRequestsBrowseQuery): Promise<PurchaseRequest[]> {
    const endpointWithQuery =
      Endpoints.browsePurchaseRequests.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<PurchaseRequest[]>({
      ...Endpoints.browsePurchaseRequests,
      path: endpointWithQuery,
    });
  },

  readById(id: string): Promise<PurchaseRequest> {
    return callEndpoint<PurchaseRequest>(Endpoints.readPurchaseRequestById, {
      params: { id },
    });
  },
};
