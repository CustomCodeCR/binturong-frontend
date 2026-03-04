import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  PaymentMethod,
  PaymentMethodsBrowseQuery,
  PaymentMethodCreateRequest,
  PaymentMethodCreateResponse,
  PaymentMethodUpdateRequest,
} from "@/core/interfaces/paymentMethods";

type NoContent = Record<string, never>;

export const PaymentMethodsService = {
  create(
    payload: PaymentMethodCreateRequest,
  ): Promise<PaymentMethodCreateResponse> {
    return callEndpoint<
      PaymentMethodCreateResponse,
      PaymentMethodCreateRequest
    >(Endpoints.createPaymentMethod, {
      body: payload,
    });
  },

  browse(query?: PaymentMethodsBrowseQuery): Promise<PaymentMethod[]> {
    const endpointWithQuery =
      Endpoints.getPaymentMethods.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<PaymentMethod[]>({
      ...Endpoints.getPaymentMethods,
      path: endpointWithQuery,
    });
  },

  readById(id: string): Promise<PaymentMethod> {
    return callEndpoint<PaymentMethod>(Endpoints.getPaymentMethodById, {
      params: { id },
    });
  },

  update(id: string, payload: PaymentMethodUpdateRequest): Promise<NoContent> {
    return callEndpoint<NoContent, PaymentMethodUpdateRequest>(
      Endpoints.updatePaymentMethod,
      {
        params: { id },
        body: payload,
      },
    );
  },

  delete(id: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.deletePaymentMethod, {
      params: { id },
    });
  },
};
