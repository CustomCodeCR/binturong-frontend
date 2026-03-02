import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  Tax,
  TaxCreateRequest,
  TaxCreateResponse,
  TaxesBrowseQuery,
  TaxUpdateRequest,
} from "@/core/interfaces/taxes";

type NoContent = Record<string, never>;

export const TaxesService = {
  create(payload: TaxCreateRequest): Promise<TaxCreateResponse> {
    return callEndpoint<TaxCreateResponse, TaxCreateRequest>(
      Endpoints.createTax,
      {
        body: payload,
      },
    );
  },

  browse(query?: TaxesBrowseQuery): Promise<Tax[]> {
    const endpointWithQuery =
      Endpoints.browseTaxes.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<Tax[]>({
      ...Endpoints.browseTaxes,
      path: endpointWithQuery,
    });
  },

  readById(id: string): Promise<Tax> {
    return callEndpoint<Tax>(Endpoints.readTaxById, {
      params: { id },
    });
  },

  update(id: string, payload: TaxUpdateRequest): Promise<NoContent> {
    return callEndpoint<NoContent, TaxUpdateRequest>(Endpoints.updateTax, {
      params: { id },
      body: payload,
    });
  },

  delete(id: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.deleteTax, {
      params: { id },
    });
  },
};
