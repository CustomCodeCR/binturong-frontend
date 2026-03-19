<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { useAuthStore } from "@/core/stores/authStore";
import { useToastStore } from "@/core/stores/toastStore";

import { SalesOrdersService } from "@/core/services/salesOrdersService";
import { InventoryMovementsService } from "@/core/services/inventoryMovementsService";
import { BranchesService } from "@/core/services/branchesService";
import { WarehousesService } from "@/core/services/warehousesService";

import type { SelectOption } from "@/core/interfaces/select";
import type { SalesOrder } from "@/core/interfaces/salesOrders";
import type { WarehouseInventoryItem } from "@/core/services/warehousesService";

const props = defineProps<{
  salesOrderId: string;
  currentSellerUserId?: string;
  code?: string;
}>();

const { t } = useI18n();
const modalStore = useModalStore();
const authStore = useAuthStore();
const toastStore = useToastStore();

const loadingCatalogs = ref(false);
const loading = ref(false);

const salesOrder = ref<SalesOrder | null>(null);
const warehouseOptions = ref<SelectOption[]>([]);
const warehouseId = ref("");

const sellerUserId = ref(authStore.userId ?? props.currentSellerUserId ?? "");

const sellerLabel =
  authStore.employeeFullName || authStore.username || authStore.email || "-";

const sellerBranchLabel = authStore.employeeBranchName || "-";

const branchHasEnoughStock = ref(true);

function closeModal() {
  modalStore.close();
}

function getSalesOrderBranchId(order: SalesOrder | null): string {
  if (!order) return "";

  const possibleBranchId =
    (order as any).branchId ||
    (order as any).clientBranchId ||
    (order as any).branch?.branchId ||
    (order as any).branch?.id ||
    "";

  return String(possibleBranchId || "").trim();
}

function warehouseHasEnoughStock(
  inventory: WarehouseInventoryItem[],
  order: SalesOrder,
): boolean {
  const inventoryMap = new Map<string, number>(
    inventory.map((item) => [item.productId, Number(item.stock || 0)]),
  );

  return order.lines.every((line) => {
    const required = Number(line.quantity || 0);
    const available = inventoryMap.get(line.productId) ?? 0;
    return available >= required;
  });
}

async function validateBranchStock(branchId: string) {
  if (!salesOrder.value?.lines?.length) {
    branchHasEnoughStock.value = false;
    return;
  }

  const inventory = await BranchesService.browseInventoryByBranchId(branchId);

  const inventoryMap = new Map<string, number>(
    inventory.map((item) => [item.productId, Number(item.stock || 0)]),
  );

  branchHasEnoughStock.value = salesOrder.value.lines.every((line) => {
    const required = Number(line.quantity || 0);
    const available = inventoryMap.get(line.productId) ?? 0;
    return available >= required;
  });
}

async function loadWarehousesWithEnoughStock(branchId: string) {
  if (!salesOrder.value?.lines?.length) {
    warehouseOptions.value = [];
    return;
  }

  const branch = await BranchesService.readById(branchId);

  const activeWarehouses = (branch.warehouses || []).filter(
    (warehouse) => warehouse.isActive,
  );

  const validWarehouses: SelectOption[] = [];

  for (const warehouse of activeWarehouses) {
    const inventory = await WarehousesService.browseInventoryByWarehouseId(
      warehouse.warehouseId,
    );

    const hasEnough = warehouseHasEnoughStock(inventory, salesOrder.value);

    if (hasEnough) {
      validWarehouses.push({
        id: warehouse.warehouseId,
        label: `${warehouse.code} - ${warehouse.name}`,
      });
    }
  }

  warehouseOptions.value = validWarehouses;

  if (warehouseOptions.value.length === 1) {
    warehouseId.value = warehouseOptions.value[0].id;
  }
}

async function loadData() {
  loadingCatalogs.value = true;

  try {
    const salesOrderResponse = await SalesOrdersService.readById(
      props.salesOrderId,
    );

    salesOrder.value = salesOrderResponse;

    const branchId =
      getSalesOrderBranchId(salesOrder.value) ||
      authStore.employeeBranchId ||
      "";

    if (!branchId) {
      throw new Error(t("sales.messages.loadDetailError"));
    }

    await validateBranchStock(branchId);
    await loadWarehousesWithEnoughStock(branchId);

    if (!warehouseOptions.value.length) {
      toastStore.addToast({
        severity: "warning",
        title: t("toast.warning"),
        message: t("sales.validation.noWarehouseWithStock"),
      });
    }
  } catch (error: any) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: error?.message ?? t("sales.messages.loadDetailError"),
    });
  } finally {
    loadingCatalogs.value = false;
  }
}

async function submit() {
  if (!sellerUserId.value.trim()) {
    modalStore.onError?.({
      code: 400,
      message: t("sales.validation.sellerRequired"),
    });
    return;
  }

  if (!warehouseId.value.trim()) {
    modalStore.onError?.({
      code: 400,
      message: t("sales.validation.warehouseRequired"),
    });
    return;
  }

  if (!salesOrder.value) {
    modalStore.onError?.({
      code: 400,
      message: t("sales.messages.loadDetailError"),
    });
    return;
  }

  if (!salesOrder.value.lines?.length) {
    modalStore.onError?.({
      code: 400,
      message: t("sales.validation.linesRequired"),
    });
    return;
  }

  if (!branchHasEnoughStock.value) {
    modalStore.onError?.({
      code: 400,
      message: t("sales.validation.insufficientStock"),
    });
    return;
  }

  loading.value = true;

  try {
    await SalesOrdersService.confirm(props.salesOrderId, {
      sellerUserId: sellerUserId.value.trim(),
    });

    for (const line of salesOrder.value.lines) {
      if (Number(line.quantity) > 0) {
        await InventoryMovementsService.serviceOut({
          productId: line.productId,
          warehouseId: warehouseId.value.trim(),
          quantity: Number(line.quantity),
          unitCost: Number(line.unitPrice),
          notes:
            salesOrder.value.notes?.trim() ||
            `Sales order ${salesOrder.value.code || props.salesOrderId}`,
          sourceId: 2,
        });
      }
    }

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("sales.messages.inventoryUpdated"),
    });

    modalStore.onSuccess?.({
      ok: true,
      salesOrderId: props.salesOrderId,
    });

    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("sales.messages.confirmError"),
    });
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadData();
});
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-3xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("sales.confirmModal.title") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{
          $t("sales.confirmModal.description", { code: code || salesOrderId })
        }}
      </p>
    </div>

    <div
      v-if="loadingCatalogs"
      class="py-bt-spacing-24 text-center text-bt-grey-500"
    >
      {{ $t("common.loading") }}
    </div>

    <div v-else class="space-y-bt-spacing-24">
      <div
        class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
      >
        <div class="text-sm text-bt-grey-600">
          {{ $t("sales.fields.seller") }}
        </div>

        <div
          class="text-base font-bt-semibold text-bt-primary-700 mt-bt-spacing-4"
        >
          {{ sellerLabel }}
        </div>

        <div class="text-xs text-bt-grey-500 mt-bt-spacing-4">
          {{ sellerBranchLabel }}
        </div>

        <p class="mt-bt-spacing-12 text-sm text-bt-grey-500">
          {{ $t("sales.confirmModal.commissionHint") }}
        </p>
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("sales.fields.warehouse") }}
        </label>

        <select
          v-model="warehouseId"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">
            {{ $t("sales.placeholders.selectWarehouse") }}
          </option>

          <option
            v-for="option in warehouseOptions"
            :key="option.id"
            :value="option.id"
          >
            {{ option.label }}
          </option>
        </select>
      </div>

      <div
        v-if="!warehouseOptions.length"
        class="rounded-m bg-bt-danger-100 text-bt-danger-700 px-bt-spacing-16 py-bt-spacing-12 text-sm"
      >
        {{ $t("sales.validation.noWarehouseWithStock") }}
      </div>

      <div
        v-if="salesOrder?.lines?.length"
        class="rounded-l border border-bt-grey-200 overflow-hidden"
      >
        <div
          class="px-bt-spacing-16 py-bt-spacing-12 bg-bt-primary-50 border-b border-bt-grey-200"
        >
          <h3 class="font-bt-semibold text-bt-primary-700">
            {{ $t("sales.lines.title") }}
          </h3>
        </div>

        <div class="p-bt-spacing-16 space-y-bt-spacing-12">
          <div
            v-for="(line, index) in salesOrder.lines"
            :key="`${line.salesOrderDetailId}-${index}`"
            class="grid grid-cols-1 md:grid-cols-3 gap-bt-spacing-12 p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div>
              <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
                {{ $t("sales.lines.product") }}
              </label>
              <input
                :value="line.productName || line.productId"
                type="text"
                disabled
                class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-grey-100 text-bt-grey-600"
              />
            </div>

            <div>
              <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
                {{ $t("sales.lines.quantity") }}
              </label>
              <input
                :value="line.quantity"
                type="number"
                disabled
                class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-grey-100 text-bt-grey-600"
              />
            </div>

            <div>
              <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
                {{ $t("sales.lines.unitPrice") }}
              </label>
              <input
                :value="line.unitPrice"
                type="number"
                disabled
                class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-grey-100 text-bt-grey-600"
              />
            </div>
          </div>
        </div>
      </div>

      <div
        class="rounded-m bg-bt-info-100 text-bt-info-700 px-bt-spacing-16 py-bt-spacing-12 text-sm"
      >
        {{ $t("sales.messages.inventoryMovementInfo") }}
      </div>

      <div class="flex justify-end gap-bt-spacing-12">
        <button
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
          @click="closeModal"
        >
          {{ $t("common.cancel") }}
        </button>

        <button
          type="button"
          :disabled="loading || !warehouseOptions.length"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
          @click="submit"
        >
          {{ loading ? $t("common.loading") : $t("sales.actions.confirm") }}
        </button>
      </div>
    </div>
  </div>
</template>
