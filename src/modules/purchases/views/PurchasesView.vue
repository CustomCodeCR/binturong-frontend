<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { MoreHorizontal, RefreshCw } from "lucide-vue-next";

import { PurchasesRequestsService } from "@/core/services/purchasesRequestsService";
import { PurchasesOrdersService } from "@/core/services/purchasesOrdersService";
import { PurchasesReceiptsService } from "@/core/services/purchasesReceiptsService";
import { SupplierQuotesService } from "@/core/services/supplierQuotesService";

import { useModalStore } from "@/core/stores/modalStore";
import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

import PurchaseRequestCreateModal from "@/modules/purchases/components/PurchaseRequestCreateModal.vue";
import PurchaseOrderCreateDrawer from "@/modules/purchases/components/PurchaseOrderCreateDrawer.vue";
import PurchaseReceiptCreateModal from "@/modules/purchases/components/PurchaseReceiptCreateModal.vue";
import SupplierQuoteCreateModal from "@/modules/purchases/components/SupplierQuoteCreateModal.vue";
import PurchaseDetailsDrawer from "@/modules/purchases/components/PurchaseDetailsDrawer.vue";
import PurchaseActionMenu from "@/modules/purchases/components/PurchaseActionMenu.vue";

import type { PurchaseRequest } from "@/core/interfaces/purchasesRequests";
import type { PurchaseOrder } from "@/core/interfaces/purchasesOrders";
import type { PurchaseReceipt } from "@/core/interfaces/purchasesReceipts";
import type { SupplierQuote } from "@/core/interfaces/supplierQuotes";

const { t } = useI18n();

const modalStore = useModalStore();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const activeTab = ref<"requests" | "orders" | "receipts" | "quotes">("orders");
const loading = ref(false);

// ← Filtros locales en tiempo real
const search = ref("");

// ← Paginación por tab
const page = ref(1);
const pageSize = ref(10);
const MAX_PAGE = 100;

const requests = ref<PurchaseRequest[]>([]);
const orders = ref<PurchaseOrder[]>([]);
const receipts = ref<PurchaseReceipt[]>([]);
const quotes = ref<SupplierQuote[]>([]);

function normalizeArrayResponse<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response as T[];

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

// ← MEJORADO: filtros en tiempo real (computed)
const filteredRequests = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return requests.value;

  return requests.value.filter(
    (item) =>
      (item.code ?? "").toLowerCase().includes(term) ||
      (item.branchName ?? "").toLowerCase().includes(term) ||
      (item.requestedByName ?? "").toLowerCase().includes(term) ||
      (item.status ?? "").toLowerCase().includes(term) ||
      (item.notes ?? "").toLowerCase().includes(term),
  );
});

const filteredOrders = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return orders.value;

  return orders.value.filter(
    (item) =>
      (item.code ?? "").toLowerCase().includes(term) ||
      (item.supplierName ?? "").toLowerCase().includes(term) ||
      (item.branchName ?? "").toLowerCase().includes(term) ||
      (item.status ?? "").toLowerCase().includes(term),
  );
});

const filteredReceipts = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return receipts.value;

  return receipts.value.filter(
    (item) =>
      (item.purchaseOrderCode ?? "").toLowerCase().includes(term) ||
      (item.status ?? "").toLowerCase().includes(term) ||
      (item.warehouseName ?? "").toLowerCase().includes(term),
  );
});

const filteredQuotes = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return quotes.value;

  return quotes.value.filter(
    (item) =>
      (item.code ?? "").toLowerCase().includes(term) ||
      (item.supplierName ?? "").toLowerCase().includes(term) ||
      (item.status ?? "").toLowerCase().includes(term),
  );
});

// ← NUEVO: paginación computed
const pageNumbers = computed(() => {
  const current = page.value;
  const start = Math.max(1, current - 2);
  const end = Math.min(MAX_PAGE, current + 2);
  const pages: number[] = [];
  for (let i = start; i <= end; i += 1) pages.push(i);
  return pages;
});

const canGoPrevious = computed(() => page.value > 1);
const canGoNext = computed(() => page.value < MAX_PAGE);

// ← Cantidad filtrada según tab activo
const filteredCount = computed(() => {
  if (activeTab.value === "requests") return filteredRequests.value.length;
  if (activeTab.value === "orders") return filteredOrders.value.length;
  if (activeTab.value === "receipts") return filteredReceipts.value.length;
  return filteredQuotes.value.length;
});

// ← NUEVO: reset de página al cambiar filtros o tab
watch(search, () => {
  page.value = 1;
});

watch(activeTab, () => {
  page.value = 1;
  search.value = "";
});

watch(pageSize, async () => {
  page.value = 1;
  await loadData();
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchRequests(): Promise<PurchaseRequest[]> {
  const response = await PurchasesRequestsService.browse({
    page: page.value,
    pageSize: pageSize.value,
  });
  return normalizeArrayResponse<PurchaseRequest>(response);
}

async function fetchOrders(): Promise<PurchaseOrder[]> {
  const response = await PurchasesOrdersService.browse({
    page: page.value,
    pageSize: pageSize.value,
  });
  return normalizeArrayResponse<PurchaseOrder>(response);
}

async function fetchReceipts(): Promise<PurchaseReceipt[]> {
  const response = await PurchasesReceiptsService.browse({
    page: page.value,
    pageSize: pageSize.value,
  });
  return normalizeArrayResponse<PurchaseReceipt>(response);
}

async function fetchQuotes(): Promise<SupplierQuote[]> {
  const response = await SupplierQuotesService.browse({
    skip: (page.value - 1) * pageSize.value,
    take: pageSize.value,
  });
  return normalizeArrayResponse<SupplierQuote>(response);
}

function replaceRequests(next: PurchaseRequest[]) {
  requests.value = [...next];
}

function replaceOrders(next: PurchaseOrder[]) {
  orders.value = [...next];
}

function replaceReceipts(next: PurchaseReceipt[]) {
  receipts.value = [...next];
}

function replaceQuotes(next: SupplierQuote[]) {
  quotes.value = [...next];
}

async function loadRequests() {
  replaceRequests(await fetchRequests());
}

async function loadOrders() {
  replaceOrders(await fetchOrders());
}

async function loadReceipts() {
  replaceReceipts(await fetchReceipts());
}

async function loadQuotes() {
  replaceQuotes(await fetchQuotes());
}

async function loadData() {
  loading.value = true;

  try {
    await Promise.all([
      loadRequests(),
      loadOrders(),
      loadReceipts(),
      loadQuotes(),
    ]);
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("purchases.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

async function reloadEventually(
  loaders: Array<() => Promise<void>>,
  attempts = 10,
  delayMs = 500,
) {
  loading.value = true;

  try {
    for (let index = 0; index < attempts; index += 1) {
      await Promise.all(loaders.map((loader) => loader()));
      if (index < attempts - 1) await sleep(delayMs);
    }
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("purchases.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

async function reloadAllEventually(attempts = 10, delayMs = 500) {
  await reloadEventually(
    [loadRequests, loadOrders, loadReceipts, loadQuotes],
    attempts,
    delayMs,
  );
}

function showSuccess(message: string) {
  toastStore.addToast({
    severity: "success",
    title: t("toast.success"),
    message,
  });
}

function showError(message: string) {
  toastStore.addToast({
    severity: "error",
    title: t("toast.error"),
    message,
  });
}

function openCreateRequestModal() {
  modalStore.open({
    component: PurchaseRequestCreateModal,
    onSuccess: async () => {
      showSuccess(t("purchases.requests.messages.createSuccess"));
      await reloadAllEventually();
    },
    onError: (error) => {
      showError(error?.message ?? t("purchases.requests.messages.createError"));
    },
  });
}

function openCreateOrderDrawer() {
  drawerStore.openDrawer({
    component: PurchaseOrderCreateDrawer,
    props: {},
    title: t("purchases.orders.modal.createTitle"),
    description: t("purchases.orders.modal.createDescription"),
    direction: "right",
    size: "xl",
    onSuccess: async () => {
      showSuccess(t("purchases.orders.messages.createSuccess"));
      await reloadAllEventually();
    },
    onError: (error: any) => {
      showError(error?.message ?? t("purchases.orders.messages.createError"));
    },
  });
}

function openCreateReceiptModal() {
  modalStore.open({
    component: PurchaseReceiptCreateModal,
    onSuccess: async () => {
      showSuccess(t("purchases.receipts.messages.createSuccess"));
      await reloadAllEventually();
    },
    onError: (error) => {
      showError(error?.message ?? t("purchases.receipts.messages.createError"));
    },
  });
}

function openCreateQuoteModal() {
  modalStore.open({
    component: SupplierQuoteCreateModal,
    onSuccess: async () => {
      showSuccess(t("purchases.quotes.messages.createSuccess"));
      await reloadAllEventually();
    },
    onError: (error) => {
      showError(error?.message ?? t("purchases.quotes.messages.createError"));
    },
  });
}

function openOrderDrawer(orderId: string) {
  drawerStore.openDrawer({
    component: PurchaseDetailsDrawer,
    props: { type: "order", entityId: orderId },
    title: t("purchases.drawer.orderTitle"),
    description: t("purchases.drawer.orderDescription"),
    direction: "right",
    size: "xl",
    onSuccess: async () => {
      await reloadAllEventually();
    },
    onError: (error: any) => {
      showError(error?.message ?? t("purchases.messages.loadError"));
    },
  });
}

function openReceiptDrawer(receiptId: string) {
  drawerStore.openDrawer({
    component: PurchaseDetailsDrawer,
    props: { type: "receipt", entityId: receiptId },
    title: t("purchases.drawer.receiptTitle"),
    description: t("purchases.drawer.receiptDescription"),
    direction: "right",
    size: "xl",
    onSuccess: async () => {
      await reloadAllEventually();
    },
    onError: (error: any) => {
      showError(error?.message ?? t("purchases.messages.loadError"));
    },
  });
}

function openQuoteDrawer(quoteId: string) {
  drawerStore.openDrawer({
    component: PurchaseDetailsDrawer,
    props: { type: "quote", entityId: quoteId },
    title: t("purchases.drawer.quoteTitle"),
    description: t("purchases.drawer.quoteDescription"),
    direction: "right",
    size: "xl",
    onSuccess: async () => {
      await reloadAllEventually();
    },
    onError: (error: any) => {
      showError(error?.message ?? t("purchases.messages.loadError"));
    },
  });
}

// ← NUEVO: paginación
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

onMounted(async () => {
  await loadData();
});
</script>

<template>
  <section class="h-full min-h-0 bg-bt-grey-50 p-bt-spacing-24 flex flex-col">

    <!-- HEADER — estandarizado igual que Users -->
    <div class="mb-bt-spacing-24 shrink-0">
      <h1 class="text-2xl font-bt-bold text-bt-primary-700">
        {{ $t("purchases.title") }}
      </h1>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("purchases.subtitle") }}
      </p>
    </div>

    <div
      class="bg-bt-white rounded-l shadow-bt-elevation-200 border border-bt-grey-200 p-bt-spacing-24 flex-1 min-h-0 flex flex-col"
    >
      <!-- TOOLBAR — tabs + refresh alineado a la derecha -->
      <div
        class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 mb-bt-spacing-24 shrink-0"
      >
        <div class="flex flex-wrap gap-bt-spacing-8">
          <button
            v-for="tab in ['requests', 'orders', 'receipts', 'quotes']"
            :key="tab"
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m transition"
            :class="
              activeTab === tab
                ? 'bg-bt-primary-500 text-bt-white'
                : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'
            "
            @click="activeTab = tab as any"
          >
            {{ $t(`purchases.tabs.${tab}`) }}
          </button>
        </div>

        <!-- ← ESTANDARIZADO: Refresh en el toolbar igual que Users -->
        <div class="flex items-center gap-bt-spacing-12 shrink-0">
          <button
            type="button"
            class="inline-flex items-center gap-bt-spacing-8 px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
            @click="loadData"
          >
            <RefreshCw :size="16" />
            {{ $t("common.refresh") }}
          </button>
        </div>
      </div>

      <!-- FILTROS + ACCIONES — estandarizado igual que Users -->
      <div
        class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 mb-bt-spacing-24 shrink-0"
      >
        <div
          class="flex flex-col sm:flex-row gap-bt-spacing-12 w-full lg:max-w-2xl"
        >
          <!-- ← MEJORADO: filtro en tiempo real -->
          <input
            v-model="search"
            type="text"
            :placeholder="$t('purchases.searchPlaceholder')"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
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

          <!-- Botón de acción según tab activo -->
          <button
            v-if="activeTab === 'requests'"
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition font-bt-semibold"
            @click="openCreateRequestModal"
          >
            {{ $t("purchases.requests.actions.newRequest") }}
          </button>

          <button
            v-if="activeTab === 'orders'"
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 transition font-bt-semibold"
            @click="openCreateOrderDrawer"
          >
            {{ $t("purchases.orders.actions.newOrder") }}
          </button>

          <button
            v-if="activeTab === 'receipts'"
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-success-500 text-bt-white hover:bg-bt-success-700 transition font-bt-semibold"
            @click="openCreateReceiptModal"
          >
            {{ $t("purchases.receipts.actions.newReceipt") }}
          </button>

          <button
            v-if="activeTab === 'quotes'"
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-info-500 text-bt-white hover:bg-bt-info-700 transition font-bt-semibold"
            @click="openCreateQuoteModal"
          >
            {{ $t("purchases.quotes.actions.newQuote") }}
          </button>
        </div>
      </div>

      <!-- TABLA -->
      <div class="flex-1 min-h-0 overflow-auto">
        <div
          v-if="loading"
          class="py-bt-spacing-32 text-center text-bt-grey-500"
        >
          {{ $t("common.loading") }}
        </div>

        <!-- ── REQUESTS ── -->
        <template v-else-if="activeTab === 'requests'">
          <table class="w-full border-collapse min-w-[1100px]">
            <thead class="sticky top-0 z-10">
              <tr class="bg-bt-primary-50 text-left">
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                  {{ $t("purchases.requests.table.code") }}
                </th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                  {{ $t("purchases.requests.table.branch") }}
                </th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                  {{ $t("purchases.requests.table.requestedBy") }}
                </th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                  {{ $t("purchases.requests.table.status") }}
                </th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                  {{ $t("purchases.requests.table.date") }}
                </th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                  {{ $t("purchases.requests.table.notes") }}
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- ← requestId solo como :key, no se renderiza -->
              <tr
                v-for="request in filteredRequests"
                :key="request.requestId"
                class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
              >
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 font-bt-semibold">
                  {{ request.code }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ request.branchName ?? "-" }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ request.requestedByName ?? "-" }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ request.status }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ request.requestDate }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ request.notes ?? "-" }}
                </td>
              </tr>

              <tr v-if="!filteredRequests.length">
                <td
                  colspan="6"
                  class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
                >
                  {{ $t("purchases.requests.empty") }}
                </td>
              </tr>
            </tbody>
          </table>
        </template>

        <!-- ── ORDERS ── -->
        <template v-else-if="activeTab === 'orders'">
          <table class="w-full border-collapse min-w-[1200px]">
            <thead class="sticky top-0 z-10">
              <tr class="bg-bt-primary-50 text-left">
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                  {{ $t("purchases.orders.table.code") }}
                </th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                  {{ $t("purchases.orders.table.supplier") }}
                </th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                  {{ $t("purchases.orders.table.branch") }}
                </th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                  {{ $t("purchases.orders.table.status") }}
                </th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                  {{ $t("purchases.orders.table.currency") }}
                </th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                  {{ $t("purchases.orders.table.total") }}
                </th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20">
                  {{ $t("purchases.orders.table.options") }}
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- ← purchaseOrderId solo como :key, no se renderiza -->
              <tr
                v-for="order in filteredOrders"
                :key="order.purchaseOrderId"
                class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
              >
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 font-bt-semibold">
                  {{ order.code }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ order.supplierName ?? "-" }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ order.branchName ?? "-" }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ order.status }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ order.currency }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ order.total }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12">
                  <PurchaseActionMenu
                    :items="[
                      {
                        label: t('purchases.orders.actions.viewDetails'),
                        action: () => openOrderDrawer(order.purchaseOrderId),
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
                  </PurchaseActionMenu>
                </td>
              </tr>

              <tr v-if="!filteredOrders.length">
                <td
                  colspan="7"
                  class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
                >
                  {{ $t("purchases.orders.empty") }}
                </td>
              </tr>
            </tbody>
          </table>
        </template>

        <!-- ── RECEIPTS ── -->
        <template v-else-if="activeTab === 'receipts'">
          <table class="w-full border-collapse min-w-[1100px]">
            <thead class="sticky top-0 z-10">
              <tr class="bg-bt-primary-50 text-left">
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                  {{ $t("purchases.receipts.table.order") }}
                </th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                  {{ $t("purchases.receipts.table.warehouse") }}
                </th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                  {{ $t("purchases.receipts.table.status") }}
                </th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                  {{ $t("purchases.receipts.table.date") }}
                </th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20">
                  {{ $t("purchases.receipts.table.options") }}
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- ← CORREGIDO: receiptId solo como :key, eliminado de la celda -->
              <tr
                v-for="receipt in filteredReceipts"
                :key="receipt.receiptId"
                class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
              >
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 font-bt-semibold">
                  {{ receipt.purchaseOrderCode ?? "-" }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ receipt.warehouseName ?? "-" }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ receipt.status }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ receipt.receiptDate }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12">
                  <PurchaseActionMenu
                    :items="[
                      {
                        label: t('purchases.receipts.actions.viewDetails'),
                        action: () => openReceiptDrawer(receipt.receiptId),
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
                  </PurchaseActionMenu>
                </td>
              </tr>

              <tr v-if="!filteredReceipts.length">
                <td
                  colspan="5"
                  class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
                >
                  {{ $t("purchases.receipts.empty") }}
                </td>
              </tr>
            </tbody>
          </table>
        </template>

        <!-- ── QUOTES ── -->
        <template v-else>
          <table class="w-full border-collapse min-w-[1100px]">
            <thead class="sticky top-0 z-10">
              <tr class="bg-bt-primary-50 text-left">
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                  {{ $t("purchases.quotes.table.code") }}
                </th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                  {{ $t("purchases.quotes.table.supplier") }}
                </th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                  {{ $t("purchases.quotes.table.branch") }}
                </th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                  {{ $t("purchases.quotes.table.status") }}
                </th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                  {{ $t("purchases.quotes.table.requestedAt") }}
                </th>
                <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20">
                  {{ $t("purchases.quotes.table.options") }}
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- ← supplierQuoteId solo como :key, no se renderiza -->
              <tr
                v-for="quote in filteredQuotes"
                :key="quote.supplierQuoteId"
                class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
              >
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 font-bt-semibold">
                  {{ quote.code }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ quote.supplierName ?? "-" }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ quote.branchName ?? "-" }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ quote.status }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ quote.requestedAtUtc }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12">
                  <PurchaseActionMenu
                    :items="[
                      {
                        label: t('purchases.quotes.actions.viewDetails'),
                        action: () => openQuoteDrawer(quote.supplierQuoteId),
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
                  </PurchaseActionMenu>
                </td>
              </tr>

              <tr v-if="!filteredQuotes.length">
                <td
                  colspan="6"
                  class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
                >
                  {{ $t("purchases.quotes.empty") }}
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </div>

      <!-- ← NUEVO: Paginación estandarizada igual que Users -->
      <div
        class="mt-bt-spacing-24 pt-bt-spacing-16 border-t border-bt-grey-200 flex flex-col md:flex-row md:items-center md:justify-between gap-bt-spacing-16 shrink-0"
      >
        <div class="text-sm text-bt-grey-600">
          {{ $t("pagination.page") }} {{ page }} {{ $t("pagination.of") }}
          {{ MAX_PAGE }}
          <span class="text-bt-grey-500">
            ({{ filteredCount }} {{ $t("users.filtered") }})
          </span>
        </div>

        <div class="flex items-center gap-bt-spacing-8 flex-wrap">
          <button
            type="button"
            :disabled="!canGoPrevious"
            class="inline-flex items-center gap-bt-spacing-8 px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 disabled:bg-bt-disabled disabled:text-bt-grey-500 disabled:cursor-not-allowed"
            @click="goPrevious"
          >
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

          <span
            v-if="pageNumbers[0] > 2"
            class="px-bt-spacing-8 text-bt-grey-500"
          >
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
          </button>
        </div>
      </div>
    </div>
  </section>
</template>