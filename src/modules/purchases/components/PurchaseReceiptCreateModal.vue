<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { useToastStore } from "@/core/stores/toastStore";

import { PurchasesOrdersService } from "@/core/services/purchasesOrdersService";
import { PurchasesReceiptsService } from "@/core/services/purchasesReceiptsService";
import { InventoryMovementsService } from "@/core/services/inventoryMovementsService";
import { SelectService } from "@/core/services/selectService";
import { AccountingService } from "@/core/services/accountingService";

import type { PurchaseOrder } from "@/core/interfaces/purchasesOrders";
import type { PurchaseReceiptCreateLineRequest } from "@/core/interfaces/purchasesReceipts";
import type { SelectOption } from "@/core/interfaces/select";

const { t } = useI18n();
const modalStore = useModalStore();
const toastStore = useToastStore();

const orders = ref<PurchaseOrder[]>([]);
const orderOptions = ref<SelectOption[]>([]);
const warehouseOptions = ref<SelectOption[]>([]);

const loadingCatalogs = ref(false);
const loading = ref(false);

const purchaseOrderId = ref("");
const warehouseId = ref("");
const receiptDateLocal = ref("");
const notes = ref("");

const lines = ref<PurchaseReceiptCreateLineRequest[]>([]);

function normalizeArrayResponse<T>(response: unknown): T[] {
  if (Array.isArray(response)) {
    return response as T[];
  }

  if (
    response &&
    typeof response === "object" &&
    "items" in response &&
    Array.isArray((response as { items: T[] }).items)
  ) {
    return (response as { items: T[] }).items;
  }

  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    Array.isArray((response as { data: T[] }).data)
  ) {
    return (response as { data: T[] }).data;
  }

  return [];
}

const selectedOrder = computed(() => {
  return (
    orders.value.find(
      (item) => String(item.purchaseOrderId) === String(purchaseOrderId.value),
    ) ?? null
  );
});

const totalExpenseAmount = computed(() => {
  return lines.value.reduce((acc, line) => {
    return (
      acc + Number(line.quantityReceived ?? 0) * Number(line.unitCost ?? 0)
    );
  }, 0);
});

function closeModal() {
  modalStore.close();
}

function getNowLocalDateTimeValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toUtcIsoString(localDateTime: string): string {
  if (!localDateTime) {
    return "";
  }

  const localDate = new Date(localDateTime);

  if (Number.isNaN(localDate.getTime())) {
    return "";
  }

  return localDate.toISOString();
}

function syncLinesFromOrder() {
  if (!selectedOrder.value) {
    lines.value = [];
    return;
  }

  lines.value = (selectedOrder.value.lines ?? []).map((line) => ({
    productId: line.productId,
    quantityReceived: Number(line.quantity ?? 0),
    unitCost: Number(line.unitPrice ?? 0),
  }));
}

async function loadCatalogs() {
  loadingCatalogs.value = true;

  try {
    const [ordersResponse, orderSelectResponse, warehouseSelectResponse] =
      await Promise.all([
        PurchasesOrdersService.browse({
          page: 1,
          pageSize: 100,
        }),
        SelectService.selectPurchaseOrders({
          search: "",
          onlyActive: true,
        }),
        SelectService.selectWarehouses({
          search: "",
          onlyActive: true,
        }),
      ]);

    orders.value = normalizeArrayResponse<PurchaseOrder>(ordersResponse);
    orderOptions.value =
      normalizeArrayResponse<SelectOption>(orderSelectResponse);
    warehouseOptions.value = normalizeArrayResponse<SelectOption>(
      warehouseSelectResponse,
    );
  } catch (error: any) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: error?.message ?? t("purchases.messages.loadError"),
    });
  } finally {
    loadingCatalogs.value = false;
  }
}

async function submit() {
  const receiptDateUtc = toUtcIsoString(receiptDateLocal.value);

  if (!purchaseOrderId.value || !warehouseId.value || !receiptDateUtc) {
    modalStore.onError?.({
      code: 400,
      message: t("purchases.receipts.validation.requiredHeader"),
    });
    return;
  }

  if (!lines.value.length) {
    modalStore.onError?.({
      code: 400,
      message: t("purchases.receipts.validation.invalidLine"),
    });
    return;
  }

  const invalidLine = lines.value.some(
    (line) =>
      Number(line.quantityReceived) < 0 ||
      Number(line.unitCost) < 0 ||
      !line.productId,
  );

  if (invalidLine) {
    modalStore.onError?.({
      code: 400,
      message: t("purchases.receipts.validation.invalidLine"),
    });
    return;
  }

  loading.value = true;

  try {
    const created = await PurchasesReceiptsService.create({
      purchaseOrderId: purchaseOrderId.value,
      warehouseId: warehouseId.value,
      receiptDateUtc,
      notes: notes.value.trim(),
      lines: lines.value.map((line) => ({
        productId: line.productId,
        quantityReceived: Number(line.quantityReceived),
        unitCost: Number(line.unitCost),
      })),
    });

    for (const line of lines.value) {
      if (Number(line.quantityReceived) > 0) {
        await InventoryMovementsService.purchaseIn({
          productId: line.productId,
          warehouseId: warehouseId.value,
          quantity: Number(line.quantityReceived),
          unitCost: Number(line.unitCost),
          notes: notes.value.trim() || `Receipt ${created.receiptId}`,
          sourceId: 1,
        });
      }
    }

    if (Number(totalExpenseAmount.value) > 0 && selectedOrder.value) {
      await AccountingService.createExpense({
        amount: Number(totalExpenseAmount.value),
        detail:
          notes.value.trim() ||
          `Purchase receipt for order ${selectedOrder.value.code ?? selectedOrder.value.purchaseOrderId}`,
        category: "Purchase Receipt",
        entryDateUtc: receiptDateUtc,
        supplierId: String((selectedOrder.value as any).supplierId ?? ""),
        receiptFileS3Key: null,
      });
    }

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("purchases.receipts.messages.inventoryUpdated"),
    });

    modalStore.onSuccess?.(created);
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("purchases.receipts.messages.createError"),
    });
  } finally {
    loading.value = false;
  }
}

watch(purchaseOrderId, () => {
  syncLinesFromOrder();
});

onMounted(async () => {
  receiptDateLocal.value = getNowLocalDateTimeValue();
  await loadCatalogs();
});
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-6xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("purchases.receipts.modal.createTitle") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("purchases.receipts.modal.createDescription") }}
      </p>
    </div>

    <div
      v-if="loadingCatalogs"
      class="py-bt-spacing-24 text-center text-bt-grey-500"
    >
      {{ $t("common.loading") }}
    </div>

    <div v-else>
      <div
        class="grid grid-cols-1 md:grid-cols-3 gap-bt-spacing-16 mb-bt-spacing-24"
      >
        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("purchases.receipts.fields.purchaseOrder") }}
          </label>
          <select
            v-model="purchaseOrderId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">
              {{ $t("purchases.receipts.placeholders.selectOrder") }}
            </option>
            <option
              v-for="option in orderOptions"
              :key="option.id"
              :value="option.id"
            >
              {{ option.label }}
            </option>
          </select>
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("purchases.receipts.fields.warehouse") }}
          </label>
          <select
            v-model="warehouseId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">
              {{ $t("purchases.receipts.placeholders.selectWarehouse") }}
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

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("purchases.receipts.fields.receiptDate") }}
          </label>
          <input
            v-model="receiptDateLocal"
            type="datetime-local"
            step="60"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div class="md:col-span-3">
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("purchases.receipts.fields.notes") }}
          </label>
          <textarea
            v-model="notes"
            rows="3"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>
      </div>

      <div
        class="mb-bt-spacing-16 rounded-m border border-bt-error-200 bg-bt-error-100 px-bt-spacing-16 py-bt-spacing-12"
      >
        <div class="text-sm text-bt-error-700">
          {{ $t("accounting.fields.amount") }}
        </div>
        <div class="mt-bt-spacing-4 text-xl font-bt-bold text-bt-error-700">
          {{
            totalExpenseAmount.toLocaleString("es-CR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          }}
        </div>
      </div>

      <div class="rounded-l border border-bt-grey-200 overflow-hidden">
        <div
          class="px-bt-spacing-16 py-bt-spacing-12 bg-bt-primary-50 border-b border-bt-grey-200"
        >
          <h3 class="font-bt-semibold text-bt-primary-700">
            {{ $t("purchases.receipts.lines.title") }}
          </h3>
        </div>

        <div class="p-bt-spacing-16 space-y-bt-spacing-16">
          <div
            v-for="(line, index) in lines"
            :key="`${line.productId}-${index}`"
            class="grid grid-cols-1 md:grid-cols-3 gap-bt-spacing-12 p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div>
              <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
                {{ $t("purchases.receipts.lines.product") }}
              </label>
              <input
                :value="
                  selectedOrder?.lines?.[index]?.productName ?? line.productId
                "
                type="text"
                disabled
                class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-grey-100 text-bt-grey-600"
              />
            </div>

            <div>
              <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
                {{ $t("purchases.receipts.lines.quantityReceived") }}
              </label>
              <input
                v-model.number="line.quantityReceived"
                type="number"
                min="0"
                step="0.01"
                class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
              />
            </div>

            <div>
              <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
                {{ $t("purchases.receipts.lines.unitCost") }}
              </label>
              <input
                v-model.number="line.unitCost"
                type="number"
                min="0"
                step="0.01"
                class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div
        class="mt-bt-spacing-12 rounded-m bg-bt-info-100 text-bt-info-700 px-bt-spacing-16 py-bt-spacing-12 text-sm"
      >
        {{ $t("purchases.receipts.messages.inventoryMovementInfo") }}
      </div>
    </div>

    <div class="mt-bt-spacing-24 flex justify-end gap-bt-spacing-12">
      <button
        type="button"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
        @click="closeModal"
      >
        {{ $t("common.cancel") }}
      </button>

      <button
        type="button"
        :disabled="loading"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-success-500 text-bt-white hover:bg-bt-success-700 disabled:bg-bt-disabled"
        @click="submit"
      >
        {{ loading ? $t("common.loading") : $t("common.save") }}
      </button>
    </div>
  </div>
</template>
