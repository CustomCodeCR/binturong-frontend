<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

import { PurchasesOrdersService } from "@/core/services/purchasesOrdersService";
import { PurchasesReceiptsService } from "@/core/services/purchasesReceiptsService";
import { SupplierQuotesService } from "@/core/services/supplierQuotesService";

import type { PurchaseOrder } from "@/core/interfaces/purchasesOrders";
import type { PurchaseReceipt } from "@/core/interfaces/purchasesReceipts";
import type { SupplierQuote } from "@/core/interfaces/supplierQuotes";

const props = defineProps<{
  type: "order" | "receipt" | "quote";
  entityId: string;
}>();

const { t } = useI18n();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const loading = ref(false);
const order = ref<PurchaseOrder | null>(null);
const receipt = ref<PurchaseReceipt | null>(null);
const quote = ref<SupplierQuote | null>(null);

async function loadEntity() {
  loading.value = true;
  try {
    order.value = null;
    receipt.value = null;
    quote.value = null;

    if (props.type === "order") {
      order.value = await PurchasesOrdersService.readById(props.entityId);
    } else if (props.type === "receipt") {
      receipt.value = await PurchasesReceiptsService.readById(props.entityId);
    } else {
      quote.value = await SupplierQuotesService.readById(props.entityId);
    }
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("purchases.drawer.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

function closeDrawer() {
  drawerStore.closeDrawer();
}

onMounted(async () => {
  await loadEntity();
});

watch(
  () => [props.type, props.entityId],
  async () => {
    await loadEntity();
  },
);
</script>

<template>
  <div class="h-full bg-bt-white p-bt-spacing-24 overflow-y-auto">
    <div class="flex items-start justify-between mb-bt-spacing-24">
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t(`purchases.drawer.${props.type}Title`) }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{ $t(`purchases.drawer.${props.type}Description`) }}
        </p>
      </div>

      <button
        type="button"
        class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
        @click="closeDrawer"
      >
        {{ $t("common.close") }}
      </button>
    </div>

    <div v-if="loading" class="text-bt-grey-500">
      {{ $t("common.loading") }}
    </div>

    <!-- ORDER -->
    <template v-else-if="order">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16 mb-bt-spacing-24">
        <div class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50">
          <div class="text-xs text-bt-grey-500">{{ $t("purchases.orders.fields.code") }}</div>
          <div class="text-bt-primary-700 font-bt-semibold">{{ order.code }}</div>
        </div>
        <div class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50">
          <div class="text-xs text-bt-grey-500">{{ $t("purchases.orders.fields.status") }}</div>
          <div class="text-bt-primary-700 font-bt-semibold">{{ order.status }}</div>
        </div>
        <div class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50">
          <div class="text-xs text-bt-grey-500">{{ $t("purchases.orders.fields.supplier") }}</div>
          <div class="text-bt-primary-700 font-bt-semibold">{{ order.supplierName ?? "-" }}</div>
        </div>
        <div class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50">
          <div class="text-xs text-bt-grey-500">{{ $t("purchases.orders.fields.branch") }}</div>
          <div class="text-bt-primary-700 font-bt-semibold">{{ order.branchName ?? "-" }}</div>
        </div>
      </div>

      <div class="rounded-m border border-bt-grey-200 overflow-hidden">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("purchases.orders.lines.product") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("purchases.orders.lines.quantity") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("purchases.orders.lines.unitPrice") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("purchases.orders.lines.taxPerc") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("purchases.orders.lines.lineTotal") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="line in order.lines"
              :key="`${line.productId}-${line.purchaseOrderDetailId}`"
              class="border-t border-bt-grey-200"
            >
              <!-- ← productId no se muestra, solo el nombre -->
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ line.productName ?? "-" }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ line.quantity }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ line.unitPrice }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ line.taxPerc }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ line.lineTotal ?? "-" }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- RECEIPT -->
    <template v-else-if="receipt">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16 mb-bt-spacing-24">
        <!-- ← receiptId eliminado, mostramos purchaseOrder y warehouse -->
        <div class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50">
          <div class="text-xs text-bt-grey-500">{{ $t("purchases.receipts.fields.status") }}</div>
          <div class="text-bt-primary-700 font-bt-semibold">{{ receipt.status }}</div>
        </div>
        <div class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50">
          <div class="text-xs text-bt-grey-500">{{ $t("purchases.receipts.fields.purchaseOrder") }}</div>
          <!-- ← mostrar code si existe, sino no mostrar ID interno -->
          <div class="text-bt-primary-700 font-bt-semibold">{{ receipt.purchaseOrderCode ?? "-" }}</div>
        </div>
        <div class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50">
          <div class="text-xs text-bt-grey-500">{{ $t("purchases.receipts.fields.warehouse") }}</div>
          <!-- ← mostrar name si existe, sino no mostrar ID interno -->
          <div class="text-bt-primary-700 font-bt-semibold">{{ receipt.warehouseName ?? "-" }}</div>
        </div>
        <div class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50">
          <div class="text-xs text-bt-grey-500">{{ $t("purchases.receipts.fields.receiptDate") }}</div>
          <div class="text-bt-primary-700 font-bt-semibold">{{ receipt.receiptDate ?? "-" }}</div>
        </div>
      </div>

      <div class="rounded-m border border-bt-grey-200 overflow-hidden">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("purchases.receipts.lines.product") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("purchases.receipts.lines.quantityReceived") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("purchases.receipts.lines.unitCost") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="line in receipt.lines"
              :key="`${line.productId}-${line.receiptDetailId}`"
              class="border-t border-bt-grey-200"
            >
              <!-- ← productId no se muestra, solo el nombre -->
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ line.productName ?? "-" }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ line.quantityReceived }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ line.unitCost }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- QUOTE -->
    <template v-else-if="quote">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16 mb-bt-spacing-24">
        <div class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50">
          <div class="text-xs text-bt-grey-500">{{ $t("purchases.quotes.fields.code") }}</div>
          <div class="text-bt-primary-700 font-bt-semibold">{{ quote.code }}</div>
        </div>
        <div class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50">
          <div class="text-xs text-bt-grey-500">{{ $t("purchases.quotes.fields.status") }}</div>
          <div class="text-bt-primary-700 font-bt-semibold">{{ quote.status }}</div>
        </div>
        <div class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50">
          <div class="text-xs text-bt-grey-500">{{ $t("purchases.quotes.fields.supplier") }}</div>
          <div class="text-bt-primary-700 font-bt-semibold">{{ quote.supplierName ?? "-" }}</div>
        </div>
        <div class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50">
          <div class="text-xs text-bt-grey-500">{{ $t("purchases.quotes.fields.branch") }}</div>
          <div class="text-bt-primary-700 font-bt-semibold">{{ quote.branchName ?? "-" }}</div>
        </div>
      </div>

      <div class="rounded-m border border-bt-grey-200 overflow-hidden">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("purchases.quotes.lines.product") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("purchases.quotes.lines.quantity") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="line in quote.lines"
              :key="line.supplierQuoteLineId"
              class="border-t border-bt-grey-200"
            >
              <!-- ← productId no se muestra, solo el nombre -->
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ line.productName ?? "-" }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ line.quantity }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>