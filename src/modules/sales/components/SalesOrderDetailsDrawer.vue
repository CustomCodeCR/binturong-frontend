<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { MoreHorizontal } from "lucide-vue-next";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useModalStore } from "@/core/stores/modalStore";
import { useToastStore } from "@/core/stores/toastStore";

import { SalesOrdersService } from "@/core/services/salesOrdersService";
import { DiscountsService } from "@/core/services/discountsService";

import DiscountActionMenu from "@/modules/discounts/components/DiscountActionMenu.vue";
import SalesOrderConfirmModal from "@/modules/sales/components/SalesOrderConfirmModal.vue";
import SalesOrderDiscountModal from "@/modules/sales/components/SalesOrderDiscountModal.vue";

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
      drawerStore.onSuccess?.();
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

function openGlobalDiscountModal() {
  if (!salesOrder.value) {
    return;
  }

  modalStore.open({
    component: SalesOrderDiscountModal,
    props: {
      salesOrderId: salesOrder.value.salesOrderId,
      scope: "Global",
      currentDiscountPerc: salesOrder.value.globalDiscountPerc,
      currentDiscountReason: salesOrder.value.globalDiscountReason,
    },
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("sales.discounts.sales.messages.discountApplied"),
      });

      await loadSalesOrder();
      drawerStore.onSuccess?.();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message:
          error?.message ??
          t("sales.discounts.sales.messages.discountApplyError"),
      });
    },
  });
}

function openLineDiscountModal(line: SalesOrder["lines"][number]) {
  if (!salesOrder.value) {
    return;
  }

  modalStore.open({
    component: SalesOrderDiscountModal,
    props: {
      salesOrderId: salesOrder.value.salesOrderId,
      salesOrderDetailId: line.salesOrderDetailId,
      scope: "Line",
      currentDiscountPerc: line.discountPerc,
      currentDiscountReason: line.discountReason,
    },
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("sales.discounts.sales.messages.discountApplied"),
      });

      await loadSalesOrder();
      drawerStore.onSuccess?.();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message:
          error?.message ??
          t("sales.discounts.sales.messages.discountApplyError"),
      });
    },
  });
}

async function removeGlobalDiscount() {
  if (!salesOrder.value) {
    return;
  }

  try {
    await DiscountsService.removeGlobal({
      salesOrderId: salesOrder.value.salesOrderId,
    });

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("sales.discounts.sales.messages.discountRemoved"),
    });

    await loadSalesOrder();
    drawerStore.onSuccess?.();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("sales.discounts.sales.messages.discountRemoveError"),
    });
  }
}

async function removeLineDiscount(line: SalesOrder["lines"][number]) {
  if (!salesOrder.value) {
    return;
  }

  try {
    await DiscountsService.removeLine({
      salesOrderId: salesOrder.value.salesOrderId,
      salesOrderDetailId: line.salesOrderDetailId,
    });

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("sales.discounts.sales.messages.discountRemoved"),
    });

    await loadSalesOrder();
    drawerStore.onSuccess?.();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("sales.discounts.sales.messages.discountRemoveError"),
    });
  }
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
      <div
        class="mb-bt-spacing-16 flex flex-wrap justify-end gap-bt-spacing-12"
      >
        <button
          v-if="canConfirm"
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600"
          @click="openConfirmModal"
        >
          {{ $t("sales.actions.confirm") }}
        </button>

        <button
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-warning-500 text-bt-white hover:bg-bt-warning-700"
          @click="openGlobalDiscountModal"
        >
          {{ $t("sales.discounts.actions.globalDiscount") }}
        </button>

        <button
          v-if="
            Number(salesOrder.globalDiscountPerc) > 0 ||
            Number(salesOrder.globalDiscountAmount) > 0
          "
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-error-100 text-bt-error-700 hover:bg-bt-error-300"
          @click="removeGlobalDiscount"
        >
          {{ $t("sales.discounts.actions.removeGlobalDiscount") }}
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
        class="grid grid-cols-1 md:grid-cols-5 gap-bt-spacing-16 mb-bt-spacing-24"
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
          class="rounded-m border border-bt-grey-200 bg-bt-warning-100 p-bt-spacing-16"
        >
          <div class="text-xs text-bt-warning-700">
            {{ $t("sales.discounts.fields.globalDiscountPerc") }}
          </div>
          <div class="text-xl font-bt-bold text-bt-warning-700 mt-bt-spacing-8">
            {{ salesOrder.globalDiscountPerc }}%
          </div>
        </div>

        <div
          class="rounded-m border border-bt-grey-200 bg-bt-warning-100 p-bt-spacing-16"
        >
          <div class="text-xs text-bt-warning-700">
            {{ $t("sales.discounts.fields.globalDiscountAmount") }}
          </div>
          <div class="text-xl font-bt-bold text-bt-warning-700 mt-bt-spacing-8">
            {{ formatMoney(salesOrder.globalDiscountAmount) }}
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

      <div
        v-if="salesOrder.globalDiscountReason"
        class="mb-bt-spacing-24 rounded-m border border-bt-warning-300 bg-bt-warning-100 p-bt-spacing-16"
      >
        <div class="text-xs text-bt-warning-700">
          {{ $t("sales.discounts.fields.globalDiscountReason") }}
        </div>
        <div class="mt-bt-spacing-8 text-bt-primary-700 font-bt-semibold">
          {{ salesOrder.globalDiscountReason }}
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
                {{ $t("sales.discounts.fields.discountAmount") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("sales.discounts.fields.discountReason") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("sales.lines.table.taxPerc") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("sales.lines.table.total") }}
              </th>
              <th
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20"
              >
                {{ $t("common.actions") }}
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
                {{ formatMoney((line as any).discountAmount) }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ line.discountReason || "-" }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ line.taxPerc }}%
              </td>
              <td
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700 font-bt-semibold"
              >
                {{ formatMoney(line.lineTotal) }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <DiscountActionMenu
                  :items="[
                    {
                      label: t('sales.discounts.actions.lineDiscount'),
                      action: () => openLineDiscountModal(line),
                    },
                    {
                      label: t('sales.discounts.actions.removeLineDiscount'),
                      action: () => removeLineDiscount(line),
                      danger: true,
                      disabled:
                        Number(line.discountPerc) <= 0 &&
                        Number((line as any).discountAmount) <= 0,
                    },
                  ]"
                >
                  <template #trigger>
                    <button
                      type="button"
                      class="inline-flex items-center justify-center w-10 h-10 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 transition"
                    >
                      <MoreHorizontal :size="18" />
                    </button>
                  </template>
                </DiscountActionMenu>
              </td>
            </tr>

            <tr v-if="!salesOrder.lines.length">
              <td
                colspan="10"
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
