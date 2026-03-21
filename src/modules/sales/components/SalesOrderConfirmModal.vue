<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { useAuthStore } from "@/core/stores/authStore";
import { useToastStore } from "@/core/stores/toastStore";

import { SalesOrdersService } from "@/core/services/salesOrdersService";
import { InventoryMovementsService } from "@/core/services/inventoryMovementsService";
import { BranchesService } from "@/core/services/branchesService";
import { SelectService } from "@/core/services/selectService";

import type { SelectOption } from "@/core/interfaces/select";
import type { SalesOrder } from "@/core/interfaces/salesOrders";
import type { BranchInventoryItem } from "@/core/interfaces/branches";

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

const productLines = computed(() => {
  return (salesOrder.value?.lines ?? []).filter((line) => {
    const itemType = String((line as any).itemType ?? "")
      .trim()
      .toLowerCase();

    return (
      itemType === "product" && String((line as any).productId ?? "").trim()
    );
  });
});

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

function isProductLine(line: SalesOrder["lines"][number]): boolean {
  const itemType = String((line as any).itemType ?? "")
    .trim()
    .toLowerCase();

  if (itemType) {
    return itemType === "product";
  }

  return Boolean(String((line as any).productId ?? "").trim());
}

function isServiceLine(line: SalesOrder["lines"][number]): boolean {
  const itemType = String((line as any).itemType ?? "")
    .trim()
    .toLowerCase();

  if (itemType) {
    return itemType === "service";
  }

  return Boolean(String((line as any).serviceId ?? "").trim());
}

function getLineDisplayName(line: SalesOrder["lines"][number]): string {
  return (
    (line as any).itemName ||
    (line as any).productName ||
    (line as any).serviceName ||
    (line as any).productId ||
    (line as any).serviceId ||
    "-"
  );
}

function getLineTypeLabel(line: SalesOrder["lines"][number]): string {
  if (isServiceLine(line)) {
    return t("sales.lines.serviceType");
  }

  return t("sales.lines.productType");
}

function buildRequiredProductsMap(order: SalesOrder): Map<string, number> {
  const requiredMap = new Map<string, number>();

  for (const line of order.lines ?? []) {
    if (!isProductLine(line)) {
      continue;
    }

    const productId = String((line as any).productId ?? "").trim();
    if (!productId) {
      continue;
    }

    const current = requiredMap.get(productId) ?? 0;
    requiredMap.set(productId, current + Number(line.quantity || 0));
  }

  return requiredMap;
}

function buildAvailableProductsMap(
  inventory: BranchInventoryItem[],
): Map<string, number> {
  const availableMap = new Map<string, number>();

  for (const item of inventory) {
    const productId = String(item.productId ?? "").trim();
    if (!productId) {
      continue;
    }

    const current = availableMap.get(productId) ?? 0;
    availableMap.set(productId, current + Number(item.stock || 0));
  }

  return availableMap;
}

function hasEnoughStockForOrder(
  availableMap: Map<string, number>,
  order: SalesOrder,
): boolean {
  const requiredMap = buildRequiredProductsMap(order);

  for (const [productId, required] of requiredMap.entries()) {
    const available = availableMap.get(productId) ?? 0;

    if (available < required) {
      return false;
    }
  }

  return true;
}

async function validateBranchStock(branchId: string) {
  if (!salesOrder.value?.lines?.length) {
    branchHasEnoughStock.value = false;
    return;
  }

  if (!productLines.value.length) {
    branchHasEnoughStock.value = true;
    return;
  }

  const inventory = await BranchesService.browseInventoryByBranchId(branchId);
  const availableMap = buildAvailableProductsMap(inventory);

  branchHasEnoughStock.value = hasEnoughStockForOrder(
    availableMap,
    salesOrder.value,
  );
}

async function loadWarehouses(branchId: string) {
  if (!salesOrder.value?.lines?.length) {
    warehouseOptions.value = [];
    warehouseId.value = "";
    return;
  }

  if (!productLines.value.length) {
    warehouseOptions.value = [];
    warehouseId.value = "";
    return;
  }

  try {
    const branch = await BranchesService.readById(branchId);

    const activeBranchWarehouses = (branch.warehouses || [])
      .filter((warehouse) => warehouse.isActive)
      .map((warehouse) => ({
        id: warehouse.warehouseId,
        label: `${warehouse.code} - ${warehouse.name}`,
      }));

    if (activeBranchWarehouses.length) {
      warehouseOptions.value = activeBranchWarehouses;
    } else {
      const fallbackWarehouses = await SelectService.selectWarehouses({
        onlyActive: true,
      });

      warehouseOptions.value = fallbackWarehouses ?? [];
    }

    if (
      warehouseId.value &&
      !warehouseOptions.value.some((option) => option.id === warehouseId.value)
    ) {
      warehouseId.value = "";
    }

    if (warehouseOptions.value.length === 1) {
      warehouseId.value = warehouseOptions.value[0].id;
    }
  } catch {
    const fallbackWarehouses = await SelectService.selectWarehouses({
      onlyActive: true,
    });

    warehouseOptions.value = fallbackWarehouses ?? [];

    if (warehouseOptions.value.length === 1) {
      warehouseId.value = warehouseOptions.value[0].id;
    }
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
    await loadWarehouses(branchId);

    if (productLines.value.length > 0 && !warehouseOptions.value.length) {
      toastStore.addToast({
        severity: "warning",
        title: t("toast.warning"),
        message: t("sales.validation.noWarehouseAvailable"),
      });
    }

    if (productLines.value.length > 0 && !branchHasEnoughStock.value) {
      toastStore.addToast({
        severity: "warning",
        title: t("toast.warning"),
        message: t("sales.validation.insufficientStock"),
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

  if (productLines.value.length > 0) {
    if (!warehouseId.value.trim()) {
      modalStore.onError?.({
        code: 400,
        message: t("sales.validation.warehouseRequired"),
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
  }

  loading.value = true;

  try {
    await SalesOrdersService.confirm(props.salesOrderId, {
      sellerUserId: sellerUserId.value.trim(),
    });

    for (const line of productLines.value) {
      if (Number(line.quantity) > 0) {
        await InventoryMovementsService.serviceOut({
          productId: String((line as any).productId),
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
      message:
        productLines.value.length > 0
          ? t("sales.messages.inventoryUpdated")
          : t("sales.messages.confirmSuccess"),
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

      <div v-if="productLines.length > 0">
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
        v-if="productLines.length > 0 && !warehouseOptions.length"
        class="rounded-m bg-bt-danger-100 text-bt-danger-700 px-bt-spacing-16 py-bt-spacing-12 text-sm"
      >
        {{ $t("sales.validation.noWarehouseAvailable") }}
      </div>

      <div
        v-else-if="productLines.length === 0"
        class="rounded-m bg-bt-info-100 text-bt-info-700 px-bt-spacing-16 py-bt-spacing-12 text-sm"
      >
        {{ $t("sales.messages.noInventoryMovementRequired") }}
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
            class="grid grid-cols-1 md:grid-cols-4 gap-bt-spacing-12 p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div>
              <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
                {{ $t("sales.lines.itemType") }}
              </label>
              <input
                :value="getLineTypeLabel(line)"
                type="text"
                disabled
                class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-grey-100 text-bt-grey-600"
              />
            </div>

            <div>
              <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
                {{ $t("sales.lines.item") }}
              </label>
              <input
                :value="getLineDisplayName(line)"
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
        v-if="productLines.length > 0"
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
          :disabled="
            loading || (productLines.length > 0 && !warehouseOptions.length)
          "
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
          @click="submit"
        >
          {{ loading ? $t("common.loading") : $t("sales.actions.confirm") }}
        </button>
      </div>
    </div>
  </div>
</template>
