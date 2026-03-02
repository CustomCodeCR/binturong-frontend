import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import { toQueryString } from "@/core/api/queryString";

import type {
  UnitOfMeasure,
  UnitOfMeasureCreateRequest,
  UnitOfMeasureCreateResponse,
  UnitsOfMeasureBrowseQuery,
  UnitOfMeasureUpdateRequest,
} from "@/core/interfaces/unitsOfMeasure";

type NoContent = Record<string, never>;

export const UnitsOfMeasureService = {
  create(
    payload: UnitOfMeasureCreateRequest,
  ): Promise<UnitOfMeasureCreateResponse> {
    return callEndpoint<
      UnitOfMeasureCreateResponse,
      UnitOfMeasureCreateRequest
    >(Endpoints.createUnitOfMeasure, { body: payload });
  },

  browse(query?: UnitsOfMeasureBrowseQuery): Promise<UnitOfMeasure[]> {
    const endpointWithQuery =
      Endpoints.browseUnitsOfMeasure.path +
      (query ? toQueryString(query as Record<string, unknown>) : "");

    return callEndpoint<UnitOfMeasure[]>({
      ...Endpoints.browseUnitsOfMeasure,
      path: endpointWithQuery,
    });
  },

  readById(id: string): Promise<UnitOfMeasure> {
    return callEndpoint<UnitOfMeasure>(Endpoints.readUnitOfMeasureById, {
      params: { id },
    });
  },

  update(id: string, payload: UnitOfMeasureUpdateRequest): Promise<NoContent> {
    return callEndpoint<NoContent, UnitOfMeasureUpdateRequest>(
      Endpoints.updateUnitOfMeasure,
      {
        params: { id },
        body: payload,
      },
    );
  },

  delete(id: string): Promise<NoContent> {
    return callEndpoint<NoContent>(Endpoints.deleteUnitOfMeasure, {
      params: { id },
    });
  },
};
