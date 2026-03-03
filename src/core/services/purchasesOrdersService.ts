import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  PurchaseOrder,
  PurchaseOrderCreateRequest,
  PurchaseOrderCreateResponse,
  PurchasesOrdersBrowseQuery,
} from "@/core/interfaces/purchasesOrders";

export const PurchasesOrdersService = {
  create(
    payload: PurchaseOrderCreateRequest,
  ): Promise<PurchaseOrderCreateResponse> {
    return callEndpoint<
      PurchaseOrderCreateResponse,
      PurchaseOrderCreateRequest
    >(Endpoints.createPurchaseOrder, { body: payload });
  },

  browse(query?: PurchasesOrdersBrowseQuery): Promise<PurchaseOrder[]> {
    const endpointWithQuery =
      Endpoints.browsePurchaseOrders.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<PurchaseOrder[]>({
      ...Endpoints.browsePurchaseOrders,
      path: endpointWithQuery,
    });
  },

  readById(id: string): Promise<PurchaseOrder> {
    return callEndpoint<PurchaseOrder>(Endpoints.readPurchaseOrderById, {
      params: { id },
    });
  },
};
