import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  Invoice,
  InvoicesBrowseQuery,
  InvoiceCreateRequest,
  InvoiceCreateResponse,
  InvoiceUpdateRequest,
  InvoiceEmitRequest,
  InvoiceEmitResponse,
  QuoteToInvoiceRequest,
  QuoteToInvoiceResponse,
} from "@/core/interfaces/invoices";

type NoContent = Record<string, never>;

export const InvoicesService = {
  create(payload: InvoiceCreateRequest): Promise<InvoiceCreateResponse> {
    return callEndpoint<InvoiceCreateResponse, InvoiceCreateRequest>(
      Endpoints.createInvoices,
      { body: payload },
    );
  },

  browse(query?: InvoicesBrowseQuery): Promise<Invoice[]> {
    const endpointWithQuery =
      Endpoints.getInvoices.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<Invoice[]>({
      ...Endpoints.getInvoices,
      path: endpointWithQuery,
    });
  },

  readById(id: string): Promise<Invoice> {
    return callEndpoint<Invoice>(Endpoints.getInvoiceById, {
      params: { id },
    });
  },

  update(id: string, payload: InvoiceUpdateRequest): Promise<NoContent> {
    return callEndpoint<NoContent, InvoiceUpdateRequest>(
      Endpoints.updateInvoices,
      {
        params: { id },
        body: payload,
      },
    );
  },

  delete(id: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.deleteInvoices, {
      params: { id },
    });
  },

  emit(id: string, payload: InvoiceEmitRequest): Promise<InvoiceEmitResponse> {
    return callEndpoint<InvoiceEmitResponse, InvoiceEmitRequest>(
      Endpoints.emitInvoices,
      {
        params: { id },
        body: payload,
      },
    );
  },

  convertFromQuote(
    quoteId: string,
    payload: QuoteToInvoiceRequest,
  ): Promise<QuoteToInvoiceResponse> {
    return callEndpoint<QuoteToInvoiceResponse, QuoteToInvoiceRequest>(
      Endpoints.quoteToInvoice,
      {
        params: { quoteId },
        body: payload,
      },
    );
  },
};
