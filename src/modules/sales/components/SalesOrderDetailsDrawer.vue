<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useModalStore } from "@/core/stores/modalStore";
import { useToastStore } from "@/core/stores/toastStore";

import { SalesOrdersService } from "@/core/services/salesOrdersService";

import SalesOrderConfirmModal from "@/modules/sales/components/SalesOrderConfirmModal.vue";

import type { SalesOrder } from "@/core/interfaces/salesOrders";

const props = defineProps<{
  salesOrderId: string;
}>();

const { t } = useI18n();

const drawerStore = useDrawerStore();
const modalStore = useModalStore();
const toastStore = useToastStore();

const loadingOrder = ref(false);
const salesOrder = ref<SalesOrder | null>(null);

const sellerName = computed(() => {
  return salesOrder.value?.sellerName || salesOrder.value?.sellerUserId || "-";
});

const canConfirm = computed(() => {
  const status = String(salesOrder.value?.status ?? "")
    .trim()
    .toLowerCase();
  return !status.includes("confirm");
});

function formatDateTime(value?: string | null): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("es-CR");
}

function formatMoney(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return Number(value).toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getLineDisplayName(line: SalesOrder["lines"][number]): string {
  return line.itemName || line.productId || line.serviceId || "-";
}

function closeDrawer() {
  drawerStore.closeDrawer();
}

async function loadSalesOrder() {
  loadingOrder.value = true;

  try {
    salesOrder.value = await SalesOrdersService.readById(props.salesOrderId);
  } catch {
    salesOrder.value = null;

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("sales.messages.loadDetailError"),
    });
  } finally {
    loadingOrder.value = false;
  }
}

function openConfirmModal() {
  if (!salesOrder.value || !canConfirm.value) return;

  modalStore.open({
    component: SalesOrderConfirmModal,
    props: {
      salesOrderId: salesOrder.value.salesOrderId,
      currentSellerUserId: salesOrder.value.sellerUserId ?? "",
      code: salesOrder.value.code,
    },
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("sales.messages.confirmSuccess"),
      });

      await loadSalesOrder();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("sales.messages.confirmError"),
      });
    },
  });
}

onMounted(async () => {
  await loadSalesOrder();
});

watch(
  () => props.salesOrderId,
  async () => {
    await loadSalesOrder();
  },
);
</script>

<template>
  <div class="h-full bg-bt-white p-bt-spacing-24 overflow-y-auto">
    <div class="flex items-start justify-between mb-bt-spacing-24">
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t("sales.drawer.detailsTitle") }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{
            $t("sales.drawer.detailsDescription", {
              code: salesOrder?.code || "",
            })
          }}
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

    <div v-if="loadingOrder" class="text-bt-grey-500">
      {{ $t("common.loading") }}
    </div>

    <template v-else-if="salesOrder">
      <div v-if="canConfirm" class="mb-bt-spacing-16 flex justify-end">
        <button
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600"
          @click="openConfirmModal"
        >
          {{ $t("sales.actions.confirm") }}
        </button>
      </div>

      <div
        class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16 mb-bt-spacing-24"
      >
        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("sales.fields.code") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ salesOrder.code }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("sales.fields.status") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ salesOrder.status }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("sales.fields.client") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ salesOrder.clientName || "-" }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("sales.fields.branch") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ salesOrder.branchName || "-" }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("sales.fields.seller") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ sellerName }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("sales.fields.orderDate") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ formatDateTime(salesOrder.orderDate) }}
          </div>
        </div>

        <div
          class="md:col-span-2 p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("sales.fields.notes") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold whitespace-pre-wrap">
            {{ salesOrder.notes || "-" }}
          </div>
        </div>
      </div>

      <div
        class="grid grid-cols-1 md:grid-cols-4 gap-bt-spacing-16 mb-bt-spacing-24"
      >
        <div
          class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("sales.fields.subtotal") }}
          </div>
          <div class="text-xl font-bt-bold text-bt-primary-700 mt-bt-spacing-8">
            {{ formatMoney(salesOrder.subtotal) }}
          </div>
        </div>

        <div
          class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("sales.fields.discounts") }}
          </div>
          <div class="text-xl font-bt-bold text-bt-warning-700 mt-bt-spacing-8">
            {{ formatMoney(salesOrder.discounts) }}
          </div>
        </div>

        <div
          class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("sales.fields.taxes") }}
          </div>
          <div class="text-xl font-bt-bold text-bt-info-700 mt-bt-spacing-8">
            {{ formatMoney(salesOrder.taxes) }}
          </div>
        </div>

        <div
          class="rounded-m border border-bt-grey-200 bg-bt-primary-700 p-bt-spacing-16"
        >
          <div class="text-xs text-bt-grey-200">
            {{ $t("sales.fields.total") }}
          </div>
          <div class="text-2xl font-bt-bold text-bt-accent-300 mt-bt-spacing-8">
            {{ formatMoney(salesOrder.total) }}
          </div>
        </div>
      </div>

      <div class="rounded-m border border-bt-grey-200 overflow-hidden">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("sales.lines.table.item") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("sales.lines.table.itemType") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("sales.lines.table.quantity") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("sales.lines.table.unitPrice") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("sales.lines.table.discountPerc") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("sales.lines.table.taxPerc") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("sales.lines.table.total") }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="line in salesOrder.lines"
              :key="line.salesOrderDetailId"
              class="border-t border-bt-grey-200"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ getLineDisplayName(line) }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ line.itemType }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ line.quantity }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ formatMoney(line.unitPrice) }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ line.discountPerc }}%
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ line.taxPerc }}%
              </td>
              <td
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700 font-bt-semibold"
              >
                {{ formatMoney(line.lineTotal) }}
              </td>
            </tr>

            <tr v-if="!salesOrder.lines.length">
              <td
                colspan="7"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("sales.lines.empty") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
