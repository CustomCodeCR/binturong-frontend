import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  SalesOrder,
  SalesOrdersBrowseQuery,
  SalesOrderCreateRequest,
  SalesOrderCreateResponse,
  SalesOrderFromQuoteRequest,
  SalesOrderFromQuoteResponse,
  SalesOrderConfirmRequest,
} from "@/core/interfaces/salesOrders";

type NoContent = Record<string, never>;

export const SalesOrdersService = {
  create(payload: SalesOrderCreateRequest): Promise<SalesOrderCreateResponse> {
    return callEndpoint<SalesOrderCreateResponse, SalesOrderCreateRequest>(
      Endpoints.createSalesOrder,
      { body: payload },
    );
  },

  browse(query?: SalesOrdersBrowseQuery): Promise<SalesOrder[]> {
    const endpointWithQuery =
      Endpoints.browseSalesOrders.path + (query ? toQueryString(query) : "");

    return callEndpoint<SalesOrder[]>({
      ...Endpoints.browseSalesOrders,
      path: endpointWithQuery,
    });
  },

  readById(id: string): Promise<SalesOrder> {
    return callEndpoint<SalesOrder>(Endpoints.readSalesOrderById, {
      params: { id },
    });
  },

  fromQuote(
    quoteId: string,
    payload: SalesOrderFromQuoteRequest,
  ): Promise<SalesOrderFromQuoteResponse> {
    return callEndpoint<
      SalesOrderFromQuoteResponse,
      SalesOrderFromQuoteRequest
    >(Endpoints.createSalesOrderFromQuote, {
      params: { quoteId },
      body: payload,
    });
  },

  confirm(id: string, payload: SalesOrderConfirmRequest): Promise<NoContent> {
    return callEndpoint<NoContent, SalesOrderConfirmRequest>(
      Endpoints.confirmSalesOrder,
      {
        params: { id },
        body: payload,
      },
    );
  },
};
