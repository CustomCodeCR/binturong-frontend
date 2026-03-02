import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";
import type {
  WarehouseCreateRequest,
  WarehouseCreateResponse,
  WarehouseUpdateRequest,
} from "@/core/interfaces/warehouses";

export const WarehousesService = {
  create(payload: WarehouseCreateRequest): Promise<WarehouseCreateResponse> {
    return callEndpoint<WarehouseCreateResponse, WarehouseCreateRequest>(
      Endpoints.createWarehouse,
      { body: payload },
    );
  },

  update(
    id: string,
    payload: WarehouseUpdateRequest,
  ): Promise<Record<string, never>> {
    return callEndpoint<Record<string, never>, WarehouseUpdateRequest>(
      Endpoints.updateWarehouse,
      {
        params: { id },
        body: payload,
      },
    );
  },

  delete(id: string): Promise<Record<string, never>> {
    return callEndpoint<Record<string, never>>(Endpoints.deleteWarehouse, {
      params: { id },
    });
  },
};
