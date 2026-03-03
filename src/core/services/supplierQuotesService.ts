import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  SupplierQuote,
  SupplierQuoteCreateRequest,
  SupplierQuoteCreateResponse,
  SupplierQuotesBrowseQuery,
  SupplierQuoteRespondRequest,
  SupplierQuoteRejectRequest,
} from "@/core/interfaces/supplierQuotes";

type NoContent = Record<string, never>;

export const SupplierQuotesService = {
  create(
    payload: SupplierQuoteCreateRequest,
  ): Promise<SupplierQuoteCreateResponse> {
    return callEndpoint<
      SupplierQuoteCreateResponse,
      SupplierQuoteCreateRequest
    >(Endpoints.createSupplierQuote, { body: payload });
  },

  browse(query?: SupplierQuotesBrowseQuery): Promise<SupplierQuote[]> {
    const endpointWithQuery =
      Endpoints.browseSupplierQuotes.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<SupplierQuote[]>({
      ...Endpoints.browseSupplierQuotes,
      path: endpointWithQuery,
    });
  },

  readById(id: string): Promise<SupplierQuote> {
    return callEndpoint<SupplierQuote>(Endpoints.readSupplierQuoteById, {
      params: { id },
    });
  },

  respond(
    id: string,
    payload: SupplierQuoteRespondRequest,
  ): Promise<NoContent> {
    return callEndpoint<NoContent, SupplierQuoteRespondRequest>(
      Endpoints.respondSupplierQuote,
      {
        params: { id },
        body: payload,
      },
    );
  },

  reject(id: string, payload: SupplierQuoteRejectRequest): Promise<NoContent> {
    return callEndpoint<NoContent, SupplierQuoteRejectRequest>(
      Endpoints.rejectSupplierQuote,
      {
        params: { id },
        body: payload,
      },
    );
  },
};
