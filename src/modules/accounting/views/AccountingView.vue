<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  MoreHorizontal,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Scale,
  ArrowRightLeft,
  BarChart3,
} from "lucide-vue-next";

import { AccountingService } from "@/core/services/accountingService";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useModalStore } from "@/core/stores/modalStore";
import { useToastStore } from "@/core/stores/toastStore";

import AccountingActionMenu from "@/modules/accounting/components/AccountingActionMenu.vue";
import AccountingIncomeModal from "@/modules/accounting/components/AccountingIncomeModal.vue";
import AccountingExpenseModal from "@/modules/accounting/components/AccountingExpenseModal.vue";
import AccountingReconciliationDrawer from "@/modules/accounting/components/AccountingReconciliationDrawer.vue";

import type {
  AccountingEntry,
  CashFlow,
  IncomeStatement,
} from "@/core/interfaces/accounting";

const { t } = useI18n();

const drawerStore = useDrawerStore();
const modalStore = useModalStore();
const toastStore = useToastStore();

const activeTab = ref<"entries" | "incomeStatement" | "cashFlow">("entries");

const loadingEntries = ref(false);
const loadingIncomeStatement = ref(false);
const loadingCashFlow = ref(false);

const entries = ref<AccountingEntry[]>([]);
const incomeStatement = ref<IncomeStatement | null>(null);
const cashFlow = ref<CashFlow | null>(null);

// ← Filtros locales (tiempo real)
const search = ref("");
const entryTypeFilter = ref("");

// ← Paginación de entries
const entryPage = ref(1);
const entryPageSize = ref(10);
const ENTRY_MAX_PAGE = 100;

const reportFrom = ref("");
const reportTo = ref("");

function getLocalDateInput(daysOffset = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toUtcStartOfDay(localDate: string): string {
  if (!localDate) return "";
  return new Date(`${localDate}T00:00:00`).toISOString();
}

function toUtcEndOfDay(localDate: string): string {
  if (!localDate) return "";
  return new Date(`${localDate}T23:59:59`).toISOString();
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

function formatShortDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-CR");
}

// ← MEJORADO: filtro en tiempo real, sin fetch al buscar
const filteredEntries = computed(() => {
  const term = search.value.trim().toLowerCase();

  return entries.value.filter((entry) => {
    const matchesType = entryTypeFilter.value
      ? String(entry.entryType ?? "").toLowerCase() ===
        entryTypeFilter.value.toLowerCase()
      : true;

    const matchesSearch = term
      ? [
          entry.detail,
          entry.category,
          entry.clientName,
          entry.supplierName,
          entry.invoiceNumber,
        ]
          .map((v) => String(v ?? "").toLowerCase())
          .some((v) => v.includes(term))
      : true;

    return matchesType && matchesSearch;
  });
});

// ← NUEVO: paginación computed para entries
const entryPageNumbers = computed(() => {
  const current = entryPage.value;
  const start = Math.max(1, current - 2);
  const end = Math.min(ENTRY_MAX_PAGE, current + 2);
  const pages: number[] = [];
  for (let i = start; i <= end; i += 1) pages.push(i);
  return pages;
});

const canEntryGoPrevious = computed(() => entryPage.value > 1);
const canEntryGoNext = computed(() => entryPage.value < ENTRY_MAX_PAGE);

const summary = computed(() => {
  const totalIncome = entries.value
    .filter((item) => String(item.entryType).toLowerCase() === "income")
    .reduce((acc, item) => acc + Number(item.amount ?? 0), 0);

  const totalExpense = entries.value
    .filter((item) => String(item.entryType).toLowerCase() === "expense")
    .reduce((acc, item) => acc + Number(item.amount ?? 0), 0);

  const reconciled = entries.value.filter((item) => item.isReconciled).length;

  return {
    totalIncome,
    totalExpense,
    reconciled,
    balance: totalIncome - totalExpense,
  };
});

// ← NUEVO: reset de página al cambiar filtros
watch([search, entryTypeFilter], () => {
  entryPage.value = 1;
});

// ← NUEVO: reset al cambiar pageSize
watch(entryPageSize, async () => {
  entryPage.value = 1;
  await loadEntries();
});

// ← NUEVO: reset al cambiar de tab
watch(activeTab, () => {
  entryPage.value = 1;
  search.value = "";
  entryTypeFilter.value = "";
});

async function loadEntries() {
  loadingEntries.value = true;

  try {
    entries.value = await AccountingService.browseEntries({
      page: entryPage.value,
      pageSize: entryPageSize.value,
      // ← REMOVIDO: search y entryType del backend, ahora filtramos localmente
    });
  } catch {
    entries.value = [];

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("accounting.messages.loadEntriesError"),
    });
  } finally {
    loadingEntries.value = false;
  }
}

async function loadIncomeStatement() {
  if (!reportFrom.value || !reportTo.value) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("accounting.validation.rangeRequired"),
    });
    return;
  }

  loadingIncomeStatement.value = true;

  try {
    incomeStatement.value = await AccountingService.getIncomeStatement(
      toUtcStartOfDay(reportFrom.value),
      toUtcEndOfDay(reportTo.value),
    );
  } catch {
    incomeStatement.value = null;

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("accounting.messages.loadIncomeStatementError"),
    });
  } finally {
    loadingIncomeStatement.value = false;
  }
}

async function exportIncomeStatementPdf() {
  if (!reportFrom.value || !reportTo.value) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("accounting.validation.rangeRequired"),
    });
    return;
  }

  try {
    const blob = await AccountingService.exportIncomeStatementPdf(
      toUtcStartOfDay(reportFrom.value),
      toUtcEndOfDay(reportTo.value),
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "income-statement.pdf";
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("accounting.messages.exportIncomeStatementError"),
    });
  }
}

async function loadCashFlow() {
  if (!reportFrom.value || !reportTo.value) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("accounting.validation.rangeRequired"),
    });
    return;
  }

  loadingCashFlow.value = true;

  try {
    cashFlow.value = await AccountingService.getCashFlow(
      toUtcStartOfDay(reportFrom.value),
      toUtcEndOfDay(reportTo.value),
    );
  } catch {
    cashFlow.value = null;

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("accounting.messages.loadCashFlowError"),
    });
  } finally {
    loadingCashFlow.value = false;
  }
}

async function exportCashFlowExcel() {
  if (!reportFrom.value || !reportTo.value) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("accounting.validation.rangeRequired"),
    });
    return;
  }

  try {
    const blob = await AccountingService.exportCashFlowExcel(
      toUtcStartOfDay(reportFrom.value),
      toUtcEndOfDay(reportTo.value),
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cash-flow.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("accounting.messages.exportCashFlowError"),
    });
  }
}

function openIncomeModal() {
  modalStore.open({
    component: AccountingIncomeModal,
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("accounting.messages.createIncomeSuccess"),
      });

      await loadEntries();
      await loadIncomeStatement();
      await loadCashFlow();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("accounting.messages.createIncomeError"),
      });
    },
  });
}

function openExpenseModal() {
  modalStore.open({
    component: AccountingExpenseModal,
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("accounting.messages.createExpenseSuccess"),
      });

      await loadEntries();
      await loadIncomeStatement();
      await loadCashFlow();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("accounting.messages.createExpenseError"),
      });
    },
  });
}

function openReconciliationDrawer() {
  drawerStore.openDrawer({
    component: AccountingReconciliationDrawer,
    title: t("accounting.reconciliation.drawerTitle"),
    description: t("accounting.reconciliation.drawerDescription"),
    direction: "right",
    size: "xl",
    props: {},
  });
}

function getEntryActions(entry: AccountingEntry) {
  return [
    {
      label: entry.isReconciled
        ? t("accounting.actions.alreadyReconciled")
        : t("accounting.actions.viewReconciliation"),
      action: () => openReconciliationDrawer(),
      disabled: false,
    },
  ];
}

// ← ESTANDARIZADO: refresh inteligente por tab activo
async function refreshActiveTab() {
  if (activeTab.value === "entries") {
    await loadEntries();
    return;
  }
  if (activeTab.value === "incomeStatement") {
    await loadIncomeStatement();
    return;
  }
  if (activeTab.value === "cashFlow") {
    await loadCashFlow();
  }
}

// ← NUEVO: paginación de entries
async function goToEntryPage(targetPage: number) {
  if (
    targetPage < 1 ||
    targetPage > ENTRY_MAX_PAGE ||
    targetPage === entryPage.value
  ) {
    return;
  }
  entryPage.value = targetPage;
  await loadEntries();
}

async function entryGoPrevious() {
  if (!canEntryGoPrevious.value) return;
  await goToEntryPage(entryPage.value - 1);
}

async function entryGoNext() {
  if (!canEntryGoNext.value) return;
  await goToEntryPage(entryPage.value + 1);
}

onMounted(async () => {
  reportFrom.value = getLocalDateInput(-30);
  reportTo.value = getLocalDateInput(0);

  await loadEntries();
  await loadIncomeStatement();
  await loadCashFlow();
});
</script>

<template>
  <section class="h-full min-h-0 bg-bt-grey-50 p-bt-spacing-24 flex flex-col">

    <!-- HEADER — estandarizado igual que Users -->
    <div class="mb-bt-spacing-24 shrink-0">
      <h1 class="text-2xl font-bt-bold text-bt-primary-700">
        {{ $t("accounting.title") }}
      </h1>
      <p class="mt-bt-spacing-8 text-bt-grey-600">
        {{ $t("accounting.subtitle") }}
      </p>
    </div>

    <!-- TARJETAS DE RESUMEN -->
    <div
      class="mb-bt-spacing-24 grid grid-cols-1 gap-bt-spacing-16 md:grid-cols-4 shrink-0"
    >
      <div
        class="rounded-l border border-bt-success-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100"
      >
        <div class="flex items-center gap-bt-spacing-12">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full bg-bt-success-100 text-bt-success-700"
          >
            <TrendingUp :size="22" />
          </div>
          <div>
            <div class="text-sm text-bt-grey-500">
              {{ $t("accounting.summary.totalIncome") }}
            </div>
            <div class="text-2xl font-bt-bold text-bt-success-700">
              {{ formatMoney(summary.totalIncome) }}
            </div>
          </div>
        </div>
      </div>

      <div
        class="rounded-l border border-bt-error-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100"
      >
        <div class="flex items-center gap-bt-spacing-12">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full bg-bt-error-100 text-bt-error-700"
          >
            <TrendingDown :size="22" />
          </div>
          <div>
            <div class="text-sm text-bt-grey-500">
              {{ $t("accounting.summary.totalExpenses") }}
            </div>
            <div class="text-2xl font-bt-bold text-bt-error-700">
              {{ formatMoney(summary.totalExpense) }}
            </div>
          </div>
        </div>
      </div>

      <div
        class="rounded-l border border-bt-primary-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100"
      >
        <div class="flex items-center gap-bt-spacing-12">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full bg-bt-primary-50 text-bt-primary-700"
          >
            <Scale :size="22" />
          </div>
          <div>
            <div class="text-sm text-bt-grey-500">
              {{ $t("accounting.summary.balance") }}
            </div>
            <div class="text-2xl font-bt-bold text-bt-primary-700">
              {{ formatMoney(summary.balance) }}
            </div>
          </div>
        </div>
      </div>

      <div
        class="rounded-l border border-bt-warning-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100"
      >
        <div class="flex items-center gap-bt-spacing-12">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full bg-bt-warning-100 text-bt-warning-700"
          >
            <ArrowRightLeft :size="22" />
          </div>
          <div>
            <div class="text-sm text-bt-grey-500">
              {{ $t("accounting.summary.reconciled") }}
            </div>
            <div class="text-2xl font-bt-bold text-bt-warning-700">
              {{ summary.reconciled }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- PANEL PRINCIPAL -->
    <div
      class="bg-bt-white rounded-l border border-bt-grey-200 p-bt-spacing-24 shadow-bt-elevation-200 flex-1 min-h-0 flex flex-col"
    >
      <!-- TOOLBAR — tabs + acciones + refresh -->
      <div
        class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 mb-bt-spacing-24 shrink-0"
      >
        <!-- Tabs -->
        <div class="flex flex-wrap gap-bt-spacing-8">
          <button
            type="button"
            class="rounded-m px-bt-spacing-16 py-bt-spacing-12 transition"
            :class="
              activeTab === 'entries'
                ? 'bg-bt-primary-500 text-bt-white'
                : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'
            "
            @click="activeTab = 'entries'"
          >
            {{ $t("accounting.tabs.entries") }}
          </button>

          <button
            type="button"
            class="rounded-m px-bt-spacing-16 py-bt-spacing-12 transition"
            :class="
              activeTab === 'incomeStatement'
                ? 'bg-bt-primary-500 text-bt-white'
                : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'
            "
            @click="activeTab = 'incomeStatement'"
          >
            {{ $t("accounting.tabs.incomeStatement") }}
          </button>

          <button
            type="button"
            class="rounded-m px-bt-spacing-16 py-bt-spacing-12 transition"
            :class="
              activeTab === 'cashFlow'
                ? 'bg-bt-primary-500 text-bt-white'
                : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'
            "
            @click="activeTab = 'cashFlow'"
          >
            {{ $t("accounting.tabs.cashFlow") }}
          </button>
        </div>

        <!-- Acciones + Refresh -->
        <div class="flex flex-wrap items-center gap-bt-spacing-12 shrink-0">
          <button
            type="button"
            class="rounded-m bg-bt-success-500 px-bt-spacing-16 py-bt-spacing-12 text-bt-white hover:bg-bt-success-700 transition"
            @click="openIncomeModal"
          >
            {{ $t("accounting.actions.newIncome") }}
          </button>

          <button
            type="button"
            class="rounded-m bg-bt-error-500 px-bt-spacing-16 py-bt-spacing-12 text-bt-white hover:bg-bt-error-700 transition"
            @click="openExpenseModal"
          >
            {{ $t("accounting.actions.newExpense") }}
          </button>

          <button
            type="button"
            class="rounded-m bg-bt-warning-500 px-bt-spacing-16 py-bt-spacing-12 text-bt-white hover:bg-bt-warning-700 transition"
            @click="openReconciliationDrawer"
          >
            {{ $t("accounting.actions.reconcile") }}
          </button>

          <!-- ← ESTANDARIZADO: Refresh igual que Users/Reports -->
          <button
            type="button"
            class="inline-flex items-center gap-bt-spacing-8 px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
            @click="refreshActiveTab"
          >
            <RefreshCw :size="16" />
            {{ $t("accounting.actions.refreshActiveTab") }}
          </button>
        </div>
      </div>

      <!-- ── ENTRIES ── -->
      <div
        v-if="activeTab === 'entries'"
        class="flex-1 min-h-0 flex flex-col"
      >
        <!-- Filtros — estandarizado igual que Users -->
        <div
          class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 mb-bt-spacing-24 shrink-0"
        >
          <div
            class="flex flex-col sm:flex-row gap-bt-spacing-12 w-full lg:max-w-2xl"
          >
            <!-- ← MEJORADO: filtro en tiempo real, sin botón buscar -->
            <input
              v-model="search"
              type="text"
              :placeholder="$t('accounting.searchPlaceholder')"
              class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            />

            <!-- ← MEJORADO: filtro tipo reactivo -->
            <select
              v-model="entryTypeFilter"
              class="px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            >
              <option value="">{{ $t("accounting.filters.allTypes") }}</option>
              <option value="Income">
                {{ $t("accounting.entryTypes.income") }}
              </option>
              <option value="Expense">
                {{ $t("accounting.entryTypes.expense") }}
              </option>
            </select>

            <button
              type="button"
              class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
              @click="loadEntries"
            >
              {{ $t("users.actions.refresh") }}
            </button>
          </div>

          <div class="flex items-center gap-bt-spacing-12 shrink-0">
            <select
              v-model.number="entryPageSize"
              class="px-bt-spacing-12 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            >
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </div>
        </div>

        <!-- Tabla -->
        <div class="flex-1 min-h-0 overflow-auto">
          <div
            v-if="loadingEntries"
            class="py-bt-spacing-32 text-center text-bt-grey-500"
          >
            {{ $t("common.loading") }}
          </div>

          <table v-else class="w-full min-w-[1200px] border-collapse">
            <thead class="sticky top-0 z-10">
              <tr class="bg-bt-primary-50 text-left">
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("accounting.table.entryType") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("accounting.table.amount") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("accounting.table.detail") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("accounting.table.category") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("accounting.table.clientSupplier") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("accounting.table.invoiceNumber") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("accounting.table.entryDate") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("accounting.table.reconciled") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20"
                >
                  {{ $t("accounting.table.options") }}
                </th>
              </tr>
            </thead>

            <tbody>
              <!-- ← accountingEntryId solo como :key de Vue, no se renderiza -->
              <tr
                v-for="entry in filteredEntries"
                :key="entry.accountingEntryId"
                class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
              >
                <td
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                >
                  <span
                    class="inline-flex rounded-full px-bt-spacing-12 py-bt-spacing-4 text-xs font-bt-semibold"
                    :class="
                      String(entry.entryType).toLowerCase() === 'income'
                        ? 'bg-bt-success-100 text-bt-success-700'
                        : 'bg-bt-error-100 text-bt-error-700'
                    "
                  >
                    {{
                      String(entry.entryType).toLowerCase() === "income"
                        ? $t("accounting.entryTypes.income")
                        : $t("accounting.entryTypes.expense")
                    }}
                  </span>
                </td>

                <td
                  class="px-bt-spacing-16 py-bt-spacing-12 font-bt-semibold text-bt-grey-700"
                >
                  {{ formatMoney(entry.amount) }}
                </td>

                <td
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                >
                  {{ entry.detail }}
                </td>

                <td
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                >
                  {{ entry.category }}
                </td>

                <td
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                >
                  {{ entry.clientName || entry.supplierName || "-" }}
                </td>

                <td
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                >
                  {{ entry.invoiceNumber || "-" }}
                </td>

                <td
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                >
                  {{ formatDateTime(entry.entryDateUtc) }}
                </td>

                <td class="px-bt-spacing-16 py-bt-spacing-12">
                  <span
                    class="inline-flex rounded-full px-bt-spacing-12 py-bt-spacing-4 text-xs font-bt-semibold"
                    :class="
                      entry.isReconciled
                        ? 'bg-bt-success-100 text-bt-success-700'
                        : 'bg-bt-warning-100 text-bt-warning-700'
                    "
                  >
                    {{
                      entry.isReconciled
                        ? $t("accounting.status.reconciled")
                        : $t("accounting.status.pending")
                    }}
                  </span>
                </td>

                <td class="px-bt-spacing-16 py-bt-spacing-12">
                  <AccountingActionMenu :items="getEntryActions(entry)">
                    <template #trigger>
                      <button
                        type="button"
                        class="inline-flex items-center justify-center w-10 h-10 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 transition"
                      >
                        <MoreHorizontal :size="18" />
                      </button>
                    </template>
                  </AccountingActionMenu>
                </td>
              </tr>

              <tr v-if="!filteredEntries.length && !loadingEntries">
                <td
                  colspan="9"
                  class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
                >
                  {{ $t("accounting.emptyEntries") }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ← NUEVO: Paginación estandarizada igual que Users -->
        <div
          class="mt-bt-spacing-24 pt-bt-spacing-16 border-t border-bt-grey-200 flex flex-col md:flex-row md:items-center md:justify-between gap-bt-spacing-16 shrink-0"
        >
          <div class="text-sm text-bt-grey-600">
            {{ $t("pagination.page") }} {{ entryPage }}
            {{ $t("pagination.of") }} {{ ENTRY_MAX_PAGE }}
            <span class="text-bt-grey-500">
              ({{ filteredEntries.length }} {{ $t("users.filtered") }})
            </span>
          </div>

          <div class="flex items-center gap-bt-spacing-8 flex-wrap">
            <button
              type="button"
              :disabled="!canEntryGoPrevious"
              class="inline-flex items-center gap-bt-spacing-8 px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 disabled:bg-bt-disabled disabled:text-bt-grey-500 disabled:cursor-not-allowed"
              @click="entryGoPrevious"
            >
              <span>{{ $t("pagination.previous") }}</span>
            </button>

            <button
              v-if="entryPageNumbers[0] > 1"
              type="button"
              class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100"
              @click="goToEntryPage(1)"
            >
              1
            </button>

            <span
              v-if="entryPageNumbers[0] > 2"
              class="px-bt-spacing-8 text-bt-grey-500"
            >
              ...
            </span>

            <button
              v-for="pageNumber in entryPageNumbers"
              :key="pageNumber"
              type="button"
              class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border transition"
              :class="
                pageNumber === entryPage
                  ? 'bg-bt-primary-500 border-bt-primary-500 text-bt-white'
                  : 'border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100'
              "
              @click="goToEntryPage(pageNumber)"
            >
              {{ pageNumber }}
            </button>

            <span
              v-if="
                entryPageNumbers[entryPageNumbers.length - 1] <
                ENTRY_MAX_PAGE - 1
              "
              class="px-bt-spacing-8 text-bt-grey-500"
            >
              ...
            </span>

            <button
              v-if="
                entryPageNumbers[entryPageNumbers.length - 1] < ENTRY_MAX_PAGE
              "
              type="button"
              class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100"
              @click="goToEntryPage(ENTRY_MAX_PAGE)"
            >
              {{ ENTRY_MAX_PAGE }}
            </button>

            <button
              type="button"
              :disabled="!canEntryGoNext"
              class="inline-flex items-center gap-bt-spacing-8 px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 disabled:bg-bt-disabled disabled:text-bt-grey-500 disabled:cursor-not-allowed"
              @click="entryGoNext"
            >
              <span>{{ $t("pagination.next") }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ── INCOME STATEMENT ── -->
      <div
        v-else-if="activeTab === 'incomeStatement'"
        class="flex-1 min-h-0 overflow-auto space-y-bt-spacing-24"
      >
        <div
          class="grid grid-cols-1 gap-bt-spacing-16 rounded-l border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16 md:grid-cols-[1fr_1fr_auto]"
        >
          <div>
            <label class="mb-bt-spacing-8 block text-sm text-bt-primary-700">
              {{ $t("accounting.fields.from") }}
            </label>
            <input
              v-model="reportFrom"
              type="date"
              class="w-full rounded-m border border-bt-grey-300 bg-bt-white px-bt-spacing-16 py-bt-spacing-12 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            />
          </div>

          <div>
            <label class="mb-bt-spacing-8 block text-sm text-bt-primary-700">
              {{ $t("accounting.fields.to") }}
            </label>
            <input
              v-model="reportTo"
              type="date"
              class="w-full rounded-m border border-bt-grey-300 bg-bt-white px-bt-spacing-16 py-bt-spacing-12 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            />
          </div>

          <div class="flex items-end gap-bt-spacing-12">
            <button
              type="button"
              class="rounded-m bg-bt-primary-500 px-bt-spacing-16 py-bt-spacing-12 text-bt-white hover:bg-bt-primary-600"
              @click="loadIncomeStatement"
            >
              {{ $t("accounting.actions.generate") }}
            </button>

            <button
              type="button"
              class="rounded-m bg-bt-warning-500 px-bt-spacing-16 py-bt-spacing-12 text-bt-white hover:bg-bt-warning-700"
              @click="exportIncomeStatementPdf"
            >
              {{ $t("accounting.actions.exportPdf") }}
            </button>
          </div>
        </div>

        <div
          v-if="loadingIncomeStatement"
          class="py-bt-spacing-32 text-center text-bt-grey-500"
        >
          {{ $t("common.loading") }}
        </div>

        <template v-else-if="incomeStatement">
          <div
            v-if="!incomeStatement.hasData"
            class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16 text-bt-grey-600"
          >
            {{
              incomeStatement.message || $t("accounting.emptyIncomeStatement")
            }}
          </div>

          <div
            v-else
            class="grid grid-cols-1 gap-bt-spacing-16 md:grid-cols-4"
          >
            <div
              class="rounded-m border border-bt-success-200 bg-bt-success-100 p-bt-spacing-16"
            >
              <div class="text-sm text-bt-success-700">
                {{ $t("accounting.incomeStatement.totalIncome") }}
              </div>
              <div
                class="mt-bt-spacing-8 text-2xl font-bt-bold text-bt-success-700"
              >
                {{ formatMoney(incomeStatement.totalIncome) }}
              </div>
            </div>

            <div
              class="rounded-m border border-bt-error-200 bg-bt-error-100 p-bt-spacing-16"
            >
              <div class="text-sm text-bt-error-700">
                {{ $t("accounting.incomeStatement.totalExpenses") }}
              </div>
              <div
                class="mt-bt-spacing-8 text-2xl font-bt-bold text-bt-error-700"
              >
                {{ formatMoney(incomeStatement.totalExpenses) }}
              </div>
            </div>

            <div
              class="rounded-m border border-bt-primary-200 bg-bt-primary-50 p-bt-spacing-16"
            >
              <div class="text-sm text-bt-primary-700">
                {{ $t("accounting.incomeStatement.grossProfit") }}
              </div>
              <div
                class="mt-bt-spacing-8 text-2xl font-bt-bold text-bt-primary-700"
              >
                {{ formatMoney(incomeStatement.grossProfit) }}
              </div>
            </div>

            <div
              class="rounded-m border p-bt-spacing-16"
              :class="
                Number(incomeStatement.netProfit) >= 0
                  ? 'border-bt-success-200 bg-bt-success-100'
                  : 'border-bt-warning-200 bg-bt-warning-100'
              "
            >
              <div
                class="text-sm"
                :class="
                  Number(incomeStatement.netProfit) >= 0
                    ? 'text-bt-success-700'
                    : 'text-bt-warning-700'
                "
              >
                {{ $t("accounting.incomeStatement.netProfit") }}
              </div>
              <div
                class="mt-bt-spacing-8 text-2xl font-bt-bold"
                :class="
                  Number(incomeStatement.netProfit) >= 0
                    ? 'text-bt-success-700'
                    : 'text-bt-warning-700'
                "
              >
                {{ formatMoney(incomeStatement.netProfit) }}
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- ── CASH FLOW ── -->
      <div v-else class="flex-1 min-h-0 overflow-auto space-y-bt-spacing-24">
        <div
          class="grid grid-cols-1 gap-bt-spacing-16 rounded-l border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16 md:grid-cols-[1fr_1fr_auto]"
        >
          <div>
            <label class="mb-bt-spacing-8 block text-sm text-bt-primary-700">
              {{ $t("accounting.fields.from") }}
            </label>
            <input
              v-model="reportFrom"
              type="date"
              class="w-full rounded-m border border-bt-grey-300 bg-bt-white px-bt-spacing-16 py-bt-spacing-12 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            />
          </div>

          <div>
            <label class="mb-bt-spacing-8 block text-sm text-bt-primary-700">
              {{ $t("accounting.fields.to") }}
            </label>
            <input
              v-model="reportTo"
              type="date"
              class="w-full rounded-m border border-bt-grey-300 bg-bt-white px-bt-spacing-16 py-bt-spacing-12 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            />
          </div>

          <div class="flex items-end gap-bt-spacing-12">
            <button
              type="button"
              class="rounded-m bg-bt-primary-500 px-bt-spacing-16 py-bt-spacing-12 text-bt-white hover:bg-bt-primary-600"
              @click="loadCashFlow"
            >
              {{ $t("accounting.actions.generate") }}
            </button>

            <button
              type="button"
              class="rounded-m bg-bt-success-500 px-bt-spacing-16 py-bt-spacing-12 text-bt-white hover:bg-bt-success-700"
              @click="exportCashFlowExcel"
            >
              {{ $t("accounting.actions.exportExcel") }}
            </button>
          </div>
        </div>

        <div
          v-if="loadingCashFlow"
          class="py-bt-spacing-32 text-center text-bt-grey-500"
        >
          {{ $t("common.loading") }}
        </div>

        <template v-else-if="cashFlow">
          <div class="grid grid-cols-1 gap-bt-spacing-16 md:grid-cols-3">
            <div
              class="rounded-m border border-bt-success-200 bg-bt-success-100 p-bt-spacing-16"
            >
              <div class="text-sm text-bt-success-700">
                {{ $t("accounting.cashFlow.totalIncome") }}
              </div>
              <div
                class="mt-bt-spacing-8 text-2xl font-bt-bold text-bt-success-700"
              >
                {{ formatMoney(cashFlow.totalIncome) }}
              </div>
            </div>

            <div
              class="rounded-m border border-bt-error-200 bg-bt-error-100 p-bt-spacing-16"
            >
              <div class="text-sm text-bt-error-700">
                {{ $t("accounting.cashFlow.totalExpenses") }}
              </div>
              <div
                class="mt-bt-spacing-8 text-2xl font-bt-bold text-bt-error-700"
              >
                {{ formatMoney(cashFlow.totalExpenses) }}
              </div>
            </div>

            <div
              class="rounded-m border p-bt-spacing-16"
              :class="
                Number(cashFlow.balance) >= 0
                  ? 'border-bt-primary-200 bg-bt-primary-50'
                  : 'border-bt-warning-200 bg-bt-warning-100'
              "
            >
              <div
                class="text-sm"
                :class="
                  Number(cashFlow.balance) >= 0
                    ? 'text-bt-primary-700'
                    : 'text-bt-warning-700'
                "
              >
                {{ $t("accounting.cashFlow.balance") }}
              </div>
              <div
                class="mt-bt-spacing-8 text-2xl font-bt-bold"
                :class="
                  Number(cashFlow.balance) >= 0
                    ? 'text-bt-primary-700'
                    : 'text-bt-warning-700'
                "
              >
                {{ formatMoney(cashFlow.balance) }}
              </div>
            </div>
          </div>

          <div
            class="rounded-m border border-bt-grey-200 bg-bt-white p-bt-spacing-16"
          >
            <div class="mb-bt-spacing-12 flex items-center gap-bt-spacing-12">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-full bg-bt-primary-50 text-bt-primary-700"
              >
                <BarChart3 :size="18" />
              </div>
              <div>
                <div class="font-bt-semibold text-bt-primary-700">
                  {{ $t("accounting.cashFlow.chartTitle") }}
                </div>
                <div class="text-sm text-bt-grey-600">
                  {{ $t("accounting.cashFlow.chartDescription") }}
                </div>
              </div>
            </div>

            <div class="space-y-bt-spacing-12">
              <!-- ← point.dateUtc solo como :key de Vue, no se renderiza -->
              <div
                v-for="point in cashFlow.points"
                :key="point.dateUtc"
                class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-12"
              >
                <div
                  class="mb-bt-spacing-8 flex items-center justify-between"
                >
                  <span class="font-bt-semibold text-bt-primary-700">
                    {{ formatShortDate(point.dateUtc) }}
                  </span>
                  <span class="text-sm text-bt-grey-600">
                    {{ $t("accounting.cashFlow.balance") }}:
                    <strong>{{ formatMoney(point.balance) }}</strong>
                  </span>
                </div>

                <div
                  class="grid grid-cols-1 gap-bt-spacing-8 md:grid-cols-2"
                >
                  <div
                    class="rounded-m bg-bt-success-100 px-bt-spacing-12 py-bt-spacing-8 text-bt-success-700"
                  >
                    {{ $t("accounting.cashFlow.income") }}:
                    {{ formatMoney(point.income) }}
                  </div>
                  <div
                    class="rounded-m bg-bt-error-100 px-bt-spacing-12 py-bt-spacing-8 text-bt-error-700"
                  >
                    {{ $t("accounting.cashFlow.expense") }}:
                    {{ formatMoney(point.expense) }}
                  </div>
                </div>
              </div>

              <div
                v-if="!cashFlow.points.length"
                class="py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("accounting.emptyCashFlow") }}
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>