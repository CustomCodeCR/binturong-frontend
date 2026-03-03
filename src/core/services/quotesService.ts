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
  QuoteExpireRequest,
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

  reject(id: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.rejectQuote, { params: { id } });
  },

  expire(id: string, payload: QuoteExpireRequest): Promise<NoContent> {
    return callEndpoint<NoContent, QuoteExpireRequest>(Endpoints.expireQuote, {
      params: { id },
      body: payload,
    });
  },
};
