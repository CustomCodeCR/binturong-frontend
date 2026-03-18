<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  MoreHorizontal,
  ShoppingBag,
  CircleDollarSign,
  UserRound,
} from "lucide-vue-next";

import { SalesOrdersService } from "@/core/services/salesOrdersService";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useModalStore } from "@/core/stores/modalStore";
import { useToastStore } from "@/core/stores/toastStore";

import SalesOrderCreateDrawer from "@/modules/sales/components/SalesOrderCreateDrawer.vue";
import SalesOrderDetailsDrawer from "@/modules/sales/components/SalesOrderDetailsDrawer.vue";
import SalesOrderConfirmModal from "@/modules/sales/components/SalesOrderConfirmModal.vue";
import SalesOrderActionMenu from "@/modules/sales/components/SalesOrderActionMenu.vue";

import type { SalesOrder } from "@/core/interfaces/salesOrders";

const { t } = useI18n();

const drawerStore = useDrawerStore();
const modalStore = useModalStore();
const toastStore = useToastStore();

const loading = ref(false);
const salesOrders = ref<SalesOrder[]>([]);
const search = ref("");

async function loadSalesOrders() {
  loading.value = true;

  try {
    salesOrders.value = await SalesOrdersService.browse({
      page: 1,
      pageSize: 100,
      search: search.value.trim() || undefined,
    });
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("sales.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

const filteredSalesOrders = computed(() => {
  const term = search.value.trim().toLowerCase();

  if (!term) {
    return salesOrders.value;
  }

  return salesOrders.value.filter((item) => {
    return (
      item.code.toLowerCase().includes(term) ||
      (item.clientName ?? "").toLowerCase().includes(term) ||
      (item.branchName ?? "").toLowerCase().includes(term) ||
      item.status.toLowerCase().includes(term) ||
      (item.notes ?? "").toLowerCase().includes(term)
    );
  });
});

const summary = computed(() => {
  const total = salesOrders.value.length;

  const confirmed = salesOrders.value.filter((item) =>
    item.status.toLowerCase().includes("confirm"),
  ).length;

  const totalAmount = salesOrders.value.reduce(
    (acc, item) => acc + Number(item.total || 0),
    0,
  );

  return {
    total,
    confirmed,
    totalAmount,
  };
});

function formatDateTime(value?: string | null): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
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

function openCreateDrawer() {
  drawerStore.openDrawer({
    component: SalesOrderCreateDrawer,
    title: t("sales.drawer.createTitle"),
    description: t("sales.drawer.createDescription"),
    direction: "right",
    size: "xl",
    props: {},
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("sales.messages.createSuccess"),
      });

      await loadSalesOrders();
    },
    onError: (error: any) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("sales.messages.createError"),
      });
    },
  });
}

function openDetailsDrawer(order: SalesOrder) {
  drawerStore.openDrawer({
    component: SalesOrderDetailsDrawer,
    title: t("sales.drawer.detailsTitle"),
    description: t("sales.drawer.detailsDescription", {
      code: order.code,
    }),
    direction: "right",
    size: "xl",
    props: {
      salesOrderId: order.salesOrderId,
    },
  });
}

function openConfirmModal(order: SalesOrder) {
  modalStore.open({
    component: SalesOrderConfirmModal,
    props: {
      salesOrderId: order.salesOrderId,
      currentSellerUserId: order.sellerUserId ?? "",
      code: order.code,
    },
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("sales.messages.confirmSuccess"),
      });

      await loadSalesOrders();
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
  await loadSalesOrders();
});
</script>

<template>
  <section class="h-full min-h-0 bg-bt-grey-50 p-bt-spacing-24 flex flex-col">
    <div class="mb-bt-spacing-24 shrink-0">
      <h1 class="text-2xl font-bt-bold text-bt-primary-700">
        {{ $t("sales.title") }}
      </h1>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("sales.subtitle") }}
      </p>
    </div>

    <div
      class="grid grid-cols-1 md:grid-cols-3 gap-bt-spacing-16 mb-bt-spacing-24 shrink-0"
    >
      <div
        class="rounded-l border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100"
      >
        <div class="flex items-center gap-bt-spacing-12">
          <div
            class="w-12 h-12 rounded-full bg-bt-primary-50 flex items-center justify-center text-bt-primary-600"
          >
            <ShoppingBag :size="22" />
          </div>
          <div>
            <div class="text-sm text-bt-grey-500">
              {{ $t("sales.summary.totalOrders") }}
            </div>
            <div class="text-2xl font-bt-bold text-bt-primary-700">
              {{ summary.total }}
            </div>
          </div>
        </div>
      </div>

      <div
        class="rounded-l border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100"
      >
        <div class="flex items-center gap-bt-spacing-12">
          <div
            class="w-12 h-12 rounded-full bg-bt-success-100 flex items-center justify-center text-bt-success-700"
          >
            <UserRound :size="22" />
          </div>
          <div>
            <div class="text-sm text-bt-grey-500">
              {{ $t("sales.summary.confirmedOrders") }}
            </div>
            <div class="text-2xl font-bt-bold text-bt-success-700">
              {{ summary.confirmed }}
            </div>
          </div>
        </div>
      </div>

      <div
        class="rounded-l border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100"
      >
        <div class="flex items-center gap-bt-spacing-12">
          <div
            class="w-12 h-12 rounded-full bg-bt-accent-50 flex items-center justify-center text-bt-accent-600"
          >
            <CircleDollarSign :size="22" />
          </div>
          <div>
            <div class="text-sm text-bt-grey-500">
              {{ $t("sales.summary.totalAmount") }}
            </div>
            <div class="text-2xl font-bt-bold text-bt-accent-700">
              {{ formatMoney(summary.totalAmount) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="bg-bt-white rounded-l shadow-bt-elevation-200 border border-bt-grey-200 p-bt-spacing-24 flex-1 min-h-0 flex flex-col"
    >
      <div
        class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 mb-bt-spacing-24 shrink-0"
      >
        <div
          class="flex flex-col sm:flex-row gap-bt-spacing-12 w-full lg:max-w-2xl"
        >
          <input
            v-model="search"
            type="text"
            :placeholder="$t('sales.searchPlaceholder')"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            @keyup.enter="loadSalesOrders"
          />

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition"
            @click="loadSalesOrders"
          >
            {{ $t("sales.actions.search") }}
          </button>

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
            @click="loadSalesOrders"
          >
            {{ $t("sales.actions.refresh") }}
          </button>
        </div>

        <button
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 transition font-bt-semibold"
          @click="openCreateDrawer"
        >
          {{ $t("sales.actions.newSale") }}
        </button>
      </div>

      <div class="flex-1 min-h-0 overflow-auto">
        <div
          v-if="loading"
          class="py-bt-spacing-32 text-center text-bt-grey-500"
        >
          {{ $t("common.loading") }}
        </div>

        <table v-else class="w-full border-collapse min-w-[1300px]">
          <thead class="sticky top-0 z-10">
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("sales.table.code") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("sales.table.client") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("sales.table.branch") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("sales.table.seller") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("sales.table.date") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("sales.table.status") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("sales.table.total") }}
              </th>
              <th
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20"
              >
                {{ $t("sales.table.options") }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="order in filteredSalesOrders"
              :key="order.salesOrderId"
              class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <div class="font-bt-semibold text-bt-primary-700">
                  {{ order.code }}
                </div>
                <div class="text-xs text-bt-grey-500">
                  {{ order.salesOrderId }}
                </div>
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ order.clientName || "-" }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ order.branchName || "-" }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ order.sellerUserId || "-" }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ formatDateTime(order.orderDate) }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <span
                  class="inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold bg-bt-info-100 text-bt-info-700"
                >
                  {{ order.status }}
                </span>
              </td>

              <td
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700 font-bt-semibold"
              >
                {{ formatMoney(order.total) }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <SalesOrderActionMenu
                  :items="[
                    {
                      label: t('sales.actions.viewDetails'),
                      action: () => openDetailsDrawer(order),
                    },
                    {
                      label: t('sales.actions.confirm'),
                      action: () => openConfirmModal(order),
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
                </SalesOrderActionMenu>
              </td>
            </tr>

            <tr v-if="!filteredSalesOrders.length && !loading">
              <td
                colspan="8"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("sales.empty") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
