import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  Quote,
  QuotesBrowseQuery,
  QuoteCreateRequest,
  QuoteCreateResponse,
  QuoteDetailCreateRequest,
  QuoteDetailCreateResponse,
  QuoteRejectRequest,
} from "@/core/interfaces/quotes";

type NoContent = Record<string, never>;

export const QuotesService = {
  create(payload: QuoteCreateRequest): Promise<QuoteCreateResponse> {
    return callEndpoint<QuoteCreateResponse, QuoteCreateRequest>(
      Endpoints.createQuote,
      {
        body: payload,
      },
    );
  },

  addDetail(
    id: string,
    payload: QuoteDetailCreateRequest,
  ): Promise<QuoteDetailCreateResponse> {
    return callEndpoint<QuoteDetailCreateResponse, QuoteDetailCreateRequest>(
      Endpoints.createQuoteDetail,
      { params: { id }, body: payload },
    );
  },

  browse(query?: QuotesBrowseQuery): Promise<Quote[]> {
    const endpointWithQuery =
      Endpoints.browseQuotes.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<Quote[]>({
      ...Endpoints.browseQuotes,
      path: endpointWithQuery,
    });
  },

  readById(id: string): Promise<Quote> {
    return callEndpoint<Quote>(Endpoints.readQuoteById, { params: { id } });
  },

  send(id: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.sendQuote, { params: { id } });
  },

  accept(id: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.acceptQuote, { params: { id } });
  },

  /**
   * `POST /api/quotes/{id}/reject` — requiere el motivo en el cuerpo.
   *
   * `reject` y `expire` tenían los endpoints intercambiados: rechazar una
   * cotización marcaba "expirada" y descartaba el motivo, y expirar llamaba a
   * `/reject` sin cuerpo (lo que el backend rechaza).
   */
  reject(id: string, payload: QuoteRejectRequest): Promise<NoContent> {
    return callEndpoint<NoContent, QuoteRejectRequest>(Endpoints.rejectQuote, {
      params: { id },
      body: payload,
    });
  },

  /** `POST /api/quotes/{id}/expire` — no lleva cuerpo. */
  expire(id: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.expireQuote, { params: { id } });
  },
};
