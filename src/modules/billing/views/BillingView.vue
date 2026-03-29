<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ReceiptText,
  TriangleAlert,
  CircleDollarSign,
} from "lucide-vue-next";

import { InvoicesService } from "@/core/services/invoicesService";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useModalStore } from "@/core/stores/modalStore";
import { useToastStore } from "@/core/stores/toastStore";

import InvoiceCreateDrawer from "@/modules/billing/components/InvoiceCreateDrawer.vue";
import InvoiceDetailsDrawer from "@/modules/billing/components/InvoiceDetailsDrawer.vue";
import InvoiceEmitModal from "@/modules/billing/components/InvoiceEmitModal.vue";
import InvoiceActionMenu from "@/modules/billing/components/InvoiceActionMenu.vue";

import type { Invoice } from "@/core/interfaces/invoices";

const { t } = useI18n();

const drawerStore = useDrawerStore();
const modalStore = useModalStore();
const toastStore = useToastStore();

const loading = ref(false);
const invoices = ref<Invoice[]>([]);
const search = ref("");
const page = ref(1);
const pageSize = ref(10);
const statusFilter = ref<"all" | "emitted" | "pending">("all");

const MAX_PAGE = 100;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTaxStatusEmitted(status?: string | null): boolean {
  const normalized = String(status ?? "").trim().toLowerCase();
  return (
    normalized.includes("accepted") ||
    normalized.includes("issued") ||
    normalized.includes("emitted") ||
    normalized.includes("sent") ||
    normalized.includes("proces") ||
    normalized.includes("aprob")
  );
}

async function fetchInvoices(): Promise<Invoice[]> {
  const response = await InvoicesService.browse({
    page: page.value,
    pageSize: pageSize.value,
  });
  return Array.isArray(response) ? [...response] : [];
}

async function loadInvoices() {
  loading.value = true;
  try {
    invoices.value = await fetchInvoices();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("billing.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

const filteredInvoices = computed(() => {
  let result = invoices.value;

  if (statusFilter.value === "emitted") {
    result = result.filter((inv) => isTaxStatusEmitted(inv.taxStatus));
  } else if (statusFilter.value === "pending") {
    result = result.filter((inv) => !isTaxStatusEmitted(inv.taxStatus));
  }

  if (search.value.trim()) {
    const term = search.value.trim().toLowerCase();
    result = result.filter(
      (invoice) =>
        (invoice.clientName ?? "").toLowerCase().includes(term) ||
        (invoice.branchName ?? "").toLowerCase().includes(term) ||
        (invoice.consecutive ?? "").toLowerCase().includes(term) ||
        (invoice.taxKey ?? "").toLowerCase().includes(term) ||
        (invoice.internalStatus ?? "").toLowerCase().includes(term) ||
        (invoice.taxStatus ?? "").toLowerCase().includes(term) ||
        (invoice.notes ?? "").toLowerCase().includes(term),
    );
  }

  return result;
});

const summary = computed(() => {
  const totalInvoices = filteredInvoices.value.length;
  const pendingInvoices = filteredInvoices.value.filter(
    (item) => Number(item.pendingAmount ?? 0) > 0,
  ).length;
  const totalAmount = filteredInvoices.value.reduce(
    (acc, item) => acc + Number(item.total ?? 0),
    0,
  );
  const pendingAmount = filteredInvoices.value.reduce(
    (acc, item) => acc + Number(item.pendingAmount ?? 0),
    0,
  );
  return { totalInvoices, pendingInvoices, totalAmount, pendingAmount };
});

const pageNumbers = computed(() => {
  const current = page.value;
  const start = Math.max(1, current - 2);
  const end = Math.min(MAX_PAGE, current + 2);
  const pages: number[] = [];
  for (let index = start; index <= end; index += 1) pages.push(index);
  return pages;
});

const canGoPrevious = computed(() => page.value > 1);
const canGoNext = computed(() => page.value < MAX_PAGE);

async function reloadEventually(loader: () => Promise<void>, attempts = 10, delayMs = 500) {
  loading.value = true;
  try {
    for (let index = 0; index < attempts; index += 1) {
      await loader();
      if (index < attempts - 1) await sleep(delayMs);
    }
  } catch {
    toastStore.addToast({ severity: "error", title: t("toast.error"), message: t("billing.messages.loadError") });
  } finally {
    loading.value = false;
  }
}

function showSuccess(message: string) {
  toastStore.addToast({ severity: "success", title: t("toast.success"), message });
}

function showError(message: string) {
  toastStore.addToast({ severity: "error", title: t("toast.error"), message });
}

function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-CR");
}

function formatMoney(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return Number(value).toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getInvoiceActions(invoice: Invoice) {
  const actions = [
    { label: t("billing.actions.viewDetails"), action: () => openDetailsDrawer(invoice) },
  ];
  if (!isTaxStatusEmitted(invoice.taxStatus)) {
    actions.push({ label: t("billing.actions.emit"), action: () => openEmitModal(invoice) });
  }
  return actions;
}

function openCreateDrawer() {
  drawerStore.openDrawer({
    component: InvoiceCreateDrawer,
    title: t("billing.drawer.createTitle"),
    description: t("billing.drawer.createDescription"),
    direction: "right",
    size: "xl",
    props: {},
    onSuccess: async () => {
      showSuccess(t("billing.messages.createSuccess"));
      await reloadEventually(loadInvoices);
    },
    onError: (error: any) => {
      showError(error?.message ?? t("billing.messages.createError"));
    },
  });
}

function openDetailsDrawer(invoice: Invoice) {
  drawerStore.openDrawer({
    component: InvoiceDetailsDrawer,
    title: t("billing.drawer.detailsTitle"),
    description: t("billing.drawer.detailsDescription", { code: invoice.consecutive || invoice.invoiceId }),
    direction: "right",
    size: "xl",
    props: { invoiceId: invoice.invoiceId },
    onSuccess: async () => { await reloadEventually(loadInvoices); },
    onError: (error: any) => {
      showError(error?.message ?? t("billing.messages.loadError"));
    },
  });
}

function openEmitModal(invoice: Invoice) {
  modalStore.open({
    component: InvoiceEmitModal,
    props: {
      invoiceId: invoice.invoiceId,
      code: invoice.consecutive || invoice.invoiceId,
      currentTaxStatus: invoice.taxStatus,
    },
    onSuccess: async () => {
      showSuccess(t("billing.messages.emitSuccess"));
      await reloadEventually(loadInvoices);
    },
    onError: (error: any) => {
      showError(error?.message ?? t("billing.messages.emitError"));
    },
  });
}

async function onSearch() {
  page.value = 1;
  await loadInvoices();
}

async function goToPage(targetPage: number) {
  if (targetPage < 1 || targetPage > MAX_PAGE || targetPage === page.value) return;
  page.value = targetPage;
  await loadInvoices();
}

async function goPrevious() {
  if (!canGoPrevious.value) return;
  await goToPage(page.value - 1);
}

async function goNext() {
  if (!canGoNext.value) return;
  await goToPage(page.value + 1);
}

watch(pageSize, async () => {
  page.value = 1;
  await loadInvoices();
});

onMounted(async () => {
  await loadInvoices();
});
</script>

<template>
  <section class="h-full min-h-0 bg-bt-grey-50 p-bt-spacing-24 flex flex-col">
    <div class="mb-bt-spacing-24 shrink-0">
      <h1 class="text-2xl font-bt-bold text-bt-primary-700">
        {{ $t("billing.title") }}
      </h1>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("billing.subtitle") }}
      </p>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-bt-spacing-16 mb-bt-spacing-24 shrink-0">
      <div class="rounded-l border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100">
        <div class="flex items-center gap-bt-spacing-12">
          <div class="w-12 h-12 rounded-full bg-bt-primary-50 flex items-center justify-center text-bt-primary-600">
            <ReceiptText :size="22" />
          </div>
          <div>
            <div class="text-sm text-bt-grey-500">{{ $t("billing.summary.totalInvoices") }}</div>
            <div class="text-2xl font-bt-bold text-bt-primary-700">{{ summary.totalInvoices }}</div>
          </div>
        </div>
      </div>

      <div class="rounded-l border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100">
        <div class="flex items-center gap-bt-spacing-12">
          <div class="w-12 h-12 rounded-full bg-bt-warning-100 flex items-center justify-center text-bt-warning-700">
            <TriangleAlert :size="22" />
          </div>
          <div>
            <div class="text-sm text-bt-grey-500">{{ $t("billing.summary.pendingInvoices") }}</div>
            <div class="text-2xl font-bt-bold text-bt-warning-700">{{ summary.pendingInvoices }}</div>
          </div>
        </div>
      </div>

      <div class="rounded-l border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100">
        <div class="flex items-center gap-bt-spacing-12">
          <div class="w-12 h-12 rounded-full bg-bt-success-100 flex items-center justify-center text-bt-success-700">
            <CircleDollarSign :size="22" />
          </div>
          <div>
            <div class="text-sm text-bt-grey-500">{{ $t("billing.summary.totalAmount") }}</div>
            <div class="text-2xl font-bt-bold text-bt-success-700">{{ formatMoney(summary.totalAmount) }}</div>
          </div>
        </div>
      </div>

      <div class="rounded-l border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100">
        <div class="flex items-center gap-bt-spacing-12">
          <div class="w-12 h-12 rounded-full bg-bt-error-100 flex items-center justify-center text-bt-error-700">
            <CircleDollarSign :size="22" />
          </div>
          <div>
            <div class="text-sm text-bt-grey-500">{{ $t("billing.summary.pendingAmount") }}</div>
            <div class="text-2xl font-bt-bold text-bt-error-700">{{ formatMoney(summary.pendingAmount) }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-bt-white rounded-l shadow-bt-elevation-200 border border-bt-grey-200 p-bt-spacing-24 flex-1 min-h-0 flex flex-col">

      <!-- TOOLBAR -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 mb-bt-spacing-24 shrink-0">
        <!-- Left: search + status filter + search button + refresh -->
        <div class="flex flex-col sm:flex-row gap-bt-spacing-12 w-full lg:max-w-2xl">
          <input
            v-model="search"
            type="text"
            :placeholder="$t('billing.searchPlaceholder')"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            @keyup.enter="onSearch"
          />

          <select
            v-model="statusFilter"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="all">{{ $t("billing.filters.allStatus") }}</option>
            <option value="emitted">{{ $t("billing.filters.emitted") }}</option>
            <option value="pending">{{ $t("billing.filters.pending") }}</option>
          </select>

          <!-- Primary query action -->
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition"
            @click="onSearch"
          >
            {{ $t("billing.actions.search") }}
          </button>

          <!-- Secondary: no data impact -->
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
            @click="loadInvoices"
          >
            {{ $t("billing.actions.refresh") }}
          </button>
        </div>

        <!-- Right: page size + create -->
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
            {{ $t("billing.actions.newInvoice") }}
          </button>
        </div>
      </div>

      <!-- TABLE -->
      <div class="flex-1 min-h-0 overflow-auto">
        <div v-if="loading" class="py-bt-spacing-32 text-center text-bt-grey-500">
          {{ $t("common.loading") }}
        </div>

        <table v-else class="w-full border-collapse min-w-[1200px]">
          <thead class="sticky top-0 z-10">
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("billing.table.reference") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("billing.table.client") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("billing.table.branch") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("billing.table.issueDate") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("billing.table.taxStatus") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("billing.table.internalStatus") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("billing.table.total") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("billing.table.pendingAmount") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20">{{ $t("billing.table.options") }}</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="invoice in filteredInvoices"
              :key="invoice.invoiceId"
              class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <div class="font-bt-semibold text-bt-primary-700">{{ invoice.consecutive || "-" }}</div>
                <div class="text-xs text-bt-grey-500">{{ invoice.taxKey || "-" }}</div>
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ invoice.clientName || "-" }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ invoice.branchName || "-" }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ formatDateTime(invoice.issueDate) }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <span class="inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold bg-bt-info-100 text-bt-info-700">
                  {{ invoice.taxStatus }}
                </span>
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <span class="inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold bg-bt-primary-50 text-bt-primary-700">
                  {{ invoice.internalStatus }}
                </span>
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700 font-bt-semibold">{{ formatMoney(invoice.total) }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700 font-bt-semibold">{{ formatMoney(invoice.pendingAmount) }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <InvoiceActionMenu :items="getInvoiceActions(invoice)">
                  <template #trigger>
                    <button
                      type="button"
                      class="inline-flex items-center justify-center w-10 h-10 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 transition"
                    >
                      <MoreHorizontal :size="18" />
                    </button>
                  </template>
                </InvoiceActionMenu>
              </td>
            </tr>

            <tr v-if="!filteredInvoices.length && !loading">
              <td colspan="9" class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500">
                {{ $t("billing.empty") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div class="mt-bt-spacing-24 pt-bt-spacing-16 border-t border-bt-grey-200 flex flex-col md:flex-row md:items-center md:justify-between gap-bt-spacing-16 shrink-0">
        <div class="text-sm text-bt-grey-600">
          {{ $t("pagination.page") }} {{ page }} {{ $t("pagination.of") }} {{ MAX_PAGE }}
          <span class="text-bt-grey-500">
            ({{ filteredInvoices.length }} {{ $t("billing.filtered") }})
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

          <button v-if="pageNumbers[0] > 1" type="button" class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100" @click="goToPage(1)">1</button>
          <span v-if="pageNumbers[0] > 2" class="px-bt-spacing-8 text-bt-grey-500">...</span>

          <button
            v-for="pageNumber in pageNumbers"
            :key="pageNumber"
            type="button"
            class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border transition"
            :class="pageNumber === page ? 'bg-bt-primary-500 border-bt-primary-500 text-bt-white' : 'border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100'"
            @click="goToPage(pageNumber)"
          >{{ pageNumber }}</button>

          <span v-if="pageNumbers[pageNumbers.length - 1] < MAX_PAGE - 1" class="px-bt-spacing-8 text-bt-grey-500">...</span>
          <button v-if="pageNumbers[pageNumbers.length - 1] < MAX_PAGE" type="button" class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100" @click="goToPage(MAX_PAGE)">{{ MAX_PAGE }}</button>

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