import { Endpoints } from "@/core/composables/endpoints";
import { callEndpoint } from "@/core/api/callEndpoint";

import type {
  PurchaseInInventoryRequest,
  PurchaseInInventoryResponse,
  ServiceOutInventoryRequest,
  ServiceOutInventoryResponse,
  PhysicalAdjustmentInventoryRequest,
  PhysicalAdjustmentInventoryResponse,
} from "@/core/interfaces/inventoryMovements";

export const InventoryMovementsService = {
  purchaseIn(
    payload: PurchaseInInventoryRequest,
  ): Promise<PurchaseInInventoryResponse> {
    return callEndpoint<
      PurchaseInInventoryResponse,
      PurchaseInInventoryRequest
    >(Endpoints.purchaseInInventory, { body: payload });
  },

  serviceOut(
    payload: ServiceOutInventoryRequest,
  ): Promise<ServiceOutInventoryResponse> {
    return callEndpoint<
      ServiceOutInventoryResponse,
      ServiceOutInventoryRequest
    >(Endpoints.serviceOutInventory, { body: payload });
  },

  physicalAdjustment(
    payload: PhysicalAdjustmentInventoryRequest,
  ): Promise<PhysicalAdjustmentInventoryResponse> {
    return callEndpoint<
      PhysicalAdjustmentInventoryResponse,
      PhysicalAdjustmentInventoryRequest
    >(Endpoints.physicalAdjustmentInventory, { body: payload });
  },
};
