<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  MoreHorizontal,
  ShoppingBag,
  CircleDollarSign,
  UserRound,
  BadgePercent,
  ChevronLeft,
  ChevronRight,
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
const page = ref(1);
const pageSize = ref(10);

// Filtro de estado
const statusFilter = ref<"all" | "confirmed" | "pending">("all");

const MAX_PAGE = 100;

// Filtrado local en tiempo real
const filteredSalesOrders = computed(() => {
  let result = salesOrders.value;

  // Filtrar por estado
  if (statusFilter.value === "confirmed") {
    result = result.filter((item) =>
      String(item.status ?? "").toLowerCase().includes("confirm"),
    );
  } else if (statusFilter.value === "pending") {
    result = result.filter(
      (item) =>
        !String(item.status ?? "").toLowerCase().includes("confirm"),
    );
  }

  // Filtrar por búsqueda en tiempo real
  const term = search.value.trim().toLowerCase();
  if (term) {
    result = result.filter(
      (item) =>
        (item.code ?? "").toLowerCase().includes(term) ||
        (item.clientName ?? "").toLowerCase().includes(term) ||
        (item.branchName ?? "").toLowerCase().includes(term) ||
        (item.status ?? "").toLowerCase().includes(term) ||
        (item.notes ?? "").toLowerCase().includes(term) ||
        (item.sellerName ?? "").toLowerCase().includes(term),
    );
  }

  return result;
});

const pageNumbers = computed(() => {
  const current = page.value;
  const start = Math.max(1, current - 2);
  const end = Math.min(MAX_PAGE, current + 2);

  const pages: number[] = [];
  for (let index = start; index <= end; index += 1) {
    pages.push(index);
  }

  return pages;
});

const canGoPrevious = computed(() => page.value > 1);
const canGoNext = computed(() => page.value < MAX_PAGE);

const summary = computed(() => {
  const total = salesOrders.value.length;

  const confirmed = salesOrders.value.filter((item) =>
    String(item.status ?? "").toLowerCase().includes("confirm"),
  ).length;

  const totalAmount = salesOrders.value.reduce(
    (acc, item) => acc + Number(item.total || 0),
    0,
  );

  const totalDiscounts = salesOrders.value.reduce(
    (acc, item) => acc + Number(item.discounts || 0),
    0,
  );

  return { total, confirmed, totalAmount, totalDiscounts };
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function showSuccess(message: string) {
  toastStore.addToast({ severity: "success", title: t("toast.success"), message });
}

function showError(message: string) {
  toastStore.addToast({ severity: "error", title: t("toast.error"), message });
}

function isConfirmedStatus(status?: string | null): boolean {
  return String(status ?? "").trim().toLowerCase() === "confirmed";
}

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

function getSellerDisplayName(order: SalesOrder): string {
  return order.sellerName || "-";
}

function getOrderActions(order: SalesOrder) {
  const actions = [
    {
      label: t("sales.actions.viewDetails"),
      action: () => openDetailsDrawer(order),
    },
  ];

  if (!isConfirmedStatus(order.status)) {
    actions.push({
      label: t("sales.actions.confirm"),
      action: () => openConfirmModal(order),
    });
  }

  return actions;
}

async function fetchSalesOrders(): Promise<SalesOrder[]> {
  const response = await SalesOrdersService.browse({
    page: page.value,
    pageSize: pageSize.value,
  } as any);

  return Array.isArray(response) ? [...response] : [];
}

async function loadData() {
  loading.value = true;

  try {
    salesOrders.value = await fetchSalesOrders();
  } catch {
    showError(t("sales.messages.loadError"));
  } finally {
    loading.value = false;
  }
}

async function reloadEventually(attempts = 8, delayMs = 400) {
  loading.value = true;

  try {
    for (let index = 0; index < attempts; index += 1) {
      salesOrders.value = await fetchSalesOrders();
      if (index < attempts - 1) {
        await sleep(delayMs);
      }
    }
  } catch {
    showError(t("sales.messages.loadError"));
  } finally {
    loading.value = false;
  }
}

async function goToPage(targetPage: number) {
  if (targetPage < 1 || targetPage > MAX_PAGE || targetPage === page.value) {
    return;
  }
  page.value = targetPage;
  await loadData();
}

async function goPrevious() {
  if (!canGoPrevious.value) return;
  await goToPage(page.value - 1);
}

async function goNext() {
  if (!canGoNext.value) return;
  await goToPage(page.value + 1);
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
      showSuccess(t("sales.messages.createSuccess"));
      await reloadEventually();
    },
    onError: (error: any) => {
      showError(error?.message ?? t("sales.messages.createError"));
    },
  });
}

function openDetailsDrawer(order: SalesOrder) {
  drawerStore.openDrawer({
    component: SalesOrderDetailsDrawer,
    title: t("sales.drawer.detailsTitle"),
    description: t("sales.drawer.detailsDescription", { code: order.code }),
    direction: "right",
    size: "xl",
    props: { salesOrderId: order.salesOrderId },
    onSuccess: async () => {
      await reloadEventually();
    },
    onError: (error: any) => {
      showError(error?.message ?? t("sales.messages.loadError"));
    },
  });
}

function openConfirmModal(order: SalesOrder) {
  modalStore.open({
    component: SalesOrderConfirmModal,
    props: { salesOrderId: order.salesOrderId, code: order.code },
    onSuccess: async () => {
      showSuccess(t("sales.messages.confirmSuccess"));
      await reloadEventually();
    },
    onError: (error: any) => {
      showError(error?.message ?? t("sales.messages.confirmError"));
    },
  });
}

watch(pageSize, async () => {
  page.value = 1;
  await loadData();
});

onMounted(async () => {
  await loadData();
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

    <!-- KPI Cards -->
    <div
      class="grid grid-cols-1 md:grid-cols-4 gap-bt-spacing-16 mb-bt-spacing-24 shrink-0"
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

      <div
        class="rounded-l border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100"
      >
        <div class="flex items-center gap-bt-spacing-12">
          <div
            class="w-12 h-12 rounded-full bg-bt-warning-100 flex items-center justify-center text-bt-warning-700"
          >
            <BadgePercent :size="22" />
          </div>
          <div>
            <div class="text-sm text-bt-grey-500">
              {{ $t("sales.discounts.summary.totalDiscounts") }}
            </div>
            <div class="text-2xl font-bt-bold text-bt-warning-700">
              {{ formatMoney(summary.totalDiscounts) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="bg-bt-white rounded-l shadow-bt-elevation-200 border border-bt-grey-200 p-bt-spacing-24 flex-1 min-h-0 flex flex-col"
    >
      <!-- Toolbar -->
      <div
        class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 mb-bt-spacing-24 shrink-0"
      >
        <div
          class="flex flex-col sm:flex-row gap-bt-spacing-12 w-full lg:max-w-2xl"
        >
          <!-- Search en tiempo real -->
          <input
            v-model="search"
            type="text"
            :placeholder="$t('sales.searchPlaceholder')"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />

          <!-- Filtro de estado -->
          <select
            v-model="statusFilter"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="all">{{ $t("sales.filters.allStatus") }}</option>
            <option value="confirmed">{{ $t("sales.filters.confirmed") }}</option>
            <option value="pending">{{ $t("sales.filters.pending") }}</option>
          </select>

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
            @click="loadData"
          >
            {{ $t("sales.actions.refresh") }}
          </button>
        </div>

        <div class="flex items-center gap-bt-spacing-12 shrink-0">
          <select
            v-model.number="pageSize"
            class="px-bt-spacing-12 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 transition font-bt-semibold"
            @click="openCreateDrawer"
          >
            {{ $t("sales.actions.newSale") }}
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="flex-1 min-h-0 overflow-auto">
        <div
          v-if="loading"
          class="py-bt-spacing-32 text-center text-bt-grey-500"
        >
          {{ $t("common.loading") }}
        </div>

        <table v-else class="w-full border-collapse min-w-[1200px]">
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
                {{ $t("sales.discounts.fields.globalDiscountPerc") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("sales.fields.discounts") }}
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
              <td
                class="px-bt-spacing-16 py-bt-spacing-12 font-bt-semibold text-bt-primary-700"
              >
                {{ order.code }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ order.clientName || "-" }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ order.branchName || "-" }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ getSellerDisplayName(order) }}
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

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                <span
                  v-if="Number(order.globalDiscountPerc) > 0"
                  class="inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold bg-bt-warning-100 text-bt-warning-700"
                >
                  {{ order.globalDiscountPerc }}%
                </span>
                <span v-else>-</span>
              </td>

              <td
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-warning-700 font-bt-semibold"
              >
                {{ formatMoney(order.discounts) }}
              </td>

              <td
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700 font-bt-semibold"
              >
                {{ formatMoney(order.total) }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <SalesOrderActionMenu :items="getOrderActions(order)">
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
                colspan="10"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("sales.empty") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        class="mt-bt-spacing-24 pt-bt-spacing-16 border-t border-bt-grey-200 flex flex-col md:flex-row md:items-center md:justify-between gap-bt-spacing-16 shrink-0"
      >
        <div class="text-sm text-bt-grey-600">
          {{ $t("pagination.page") }} {{ page }} {{ $t("pagination.of") }}
          {{ MAX_PAGE }}
          <span class="text-bt-grey-500">
            ({{ filteredSalesOrders.length }} {{ $t("sales.filtered") }})
          </span>
        </div>

        <div class="flex items-center gap-bt-spacing-8 flex-wrap">
          <button
            type="button"
            :disabled="!canGoPrevious"
            class="inline-flex items-center gap-bt-spacing-8 px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 disabled:bg-bt-disabled disabled:text-bt-grey-500 disabled:cursor-not-allowed"
            @click="goPrevious"
          >
            <ChevronLeft :size="16" />
            <span>{{ $t("pagination.previous") }}</span>
          </button>

          <button
            v-if="pageNumbers[0] > 1"
            type="button"
            class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100"
            @click="goToPage(1)"
          >
            1
          </button>

          <span v-if="pageNumbers[0] > 2" class="px-bt-spacing-8 text-bt-grey-500">
            ...
          </span>

          <button
            v-for="pageNumber in pageNumbers"
            :key="pageNumber"
            type="button"
            class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border transition"
            :class="
              pageNumber === page
                ? 'bg-bt-primary-500 border-bt-primary-500 text-bt-white'
                : 'border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100'
            "
            @click="goToPage(pageNumber)"
          >
            {{ pageNumber }}
          </button>

          <span
            v-if="pageNumbers[pageNumbers.length - 1] < MAX_PAGE - 1"
            class="px-bt-spacing-8 text-bt-grey-500"
          >
            ...
          </span>

          <button
            v-if="pageNumbers[pageNumbers.length - 1] < MAX_PAGE"
            type="button"
            class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100"
            @click="goToPage(MAX_PAGE)"
          >
            {{ MAX_PAGE }}
          </button>

          <button
            type="button"
            :disabled="!canGoNext"
            class="inline-flex items-center gap-bt-spacing-8 px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 disabled:bg-bt-disabled disabled:text-bt-grey-500 disabled:cursor-not-allowed"
            @click="goNext"
          >
            <span>{{ $t("pagination.next") }}</span>
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>