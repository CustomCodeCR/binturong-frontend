import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  SupplierEvaluation,
  SupplierEvaluationCreateRequest,
  SupplierEvaluationCreateResponse,
  SupplierEvaluationsBrowseQuery,
} from "@/core/interfaces/supplierEvaluations";

export const SupplierEvaluationsService = {
  create(
    payload: SupplierEvaluationCreateRequest,
  ): Promise<SupplierEvaluationCreateResponse> {
    return callEndpoint<
      SupplierEvaluationCreateResponse,
      SupplierEvaluationCreateRequest
    >(Endpoints.createSupplierEvaluation, { body: payload });
  },

  browseBySupplierId(
    supplierId: string,
    query?: SupplierEvaluationsBrowseQuery,
  ): Promise<SupplierEvaluation[]> {
    const endpointWithQuery =
      Endpoints.browseSupplierEvaluationsBySupplierId.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<SupplierEvaluation[]>(
      {
        ...Endpoints.browseSupplierEvaluationsBySupplierId,
        path: endpointWithQuery,
      },
      { params: { supplierId } } as any,
    );
  },
};
