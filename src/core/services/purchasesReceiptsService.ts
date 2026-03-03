import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  PurchaseReceipt,
  PurchaseReceiptCreateRequest,
  PurchaseReceiptCreateResponse,
  PurchasesReceiptsBrowseQuery,
  PurchaseReceiptRejectRequest,
} from "@/core/interfaces/purchasesReceipts";

type NoContent = Record<string, never>;

export const PurchasesReceiptsService = {
  create(
    payload: PurchaseReceiptCreateRequest,
  ): Promise<PurchaseReceiptCreateResponse> {
    return callEndpoint<
      PurchaseReceiptCreateResponse,
      PurchaseReceiptCreateRequest
    >(Endpoints.createPurchaseReceipt, { body: payload });
  },

  browse(query?: PurchasesReceiptsBrowseQuery): Promise<PurchaseReceipt[]> {
    const endpointWithQuery =
      Endpoints.browsePurchaseReceipts.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<PurchaseReceipt[]>({
      ...Endpoints.browsePurchaseReceipts,
      path: endpointWithQuery,
    });
  },

  readById(id: string): Promise<PurchaseReceipt> {
    return callEndpoint<PurchaseReceipt>(Endpoints.readPurchaseReceiptById, {
      params: { id },
    });
  },

  reject(
    id: string,
    payload: PurchaseReceiptRejectRequest,
  ): Promise<NoContent> {
    return callEndpoint<NoContent, PurchaseReceiptRejectRequest>(
      Endpoints.rejectPurchaseReceipt,
      {
        params: { id },
        body: payload,
      },
    );
  },
};
