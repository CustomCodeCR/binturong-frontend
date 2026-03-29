<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-vue-next";

import { ReportsService } from "@/core/services/reportsService";
import { SelectService } from "@/core/services/selectService";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useModalStore } from "@/core/stores/modalStore";
import { useToastStore } from "@/core/stores/toastStore";

import ReportsActionMenu from "@/modules/reports/components/ReportsActionMenu.vue";
import ReportScheduleModal from "@/modules/reports/components/ReportScheduleModal.vue";
import ClientReportDrawer from "@/modules/reports/components/ClientReportDrawer.vue";
import ServiceOrdersReportDrawer from "@/modules/reports/components/ServiceOrdersReportDrawer.vue";

import type {
  FinancialReport,
  InventoryReport,
  ReportSchedule,
  ServiceOrdersReport,
} from "@/core/interfaces/reports";
import type { SelectOption } from "@/core/interfaces/select";

const { t } = useI18n();

const drawerStore = useDrawerStore();
const modalStore = useModalStore();
const toastStore = useToastStore();

const activeTab = ref<
  "financial" | "inventory" | "client" | "serviceOrders" | "schedules"
>("financial");

const loadingCatalogs = ref(false);
const loadingFinancial = ref(false);
const loadingInventory = ref(false);
const loadingServiceOrders = ref(false);
const loadingSchedules = ref(false);

const branches = ref<SelectOption[]>([]);
const categories = ref<SelectOption[]>([]);
const clients = ref<SelectOption[]>([]);
const employees = ref<SelectOption[]>([]);

const financialReport = ref<FinancialReport | null>(null);
const inventoryReport = ref<InventoryReport | null>(null);
const clientPreviewLoaded = ref(false);
const serviceOrdersReport = ref<ServiceOrdersReport | null>(null);
const schedules = ref<ReportSchedule[]>([]);

const financialFromUtc = ref("");
const financialToUtc = ref("");

const inventoryCategoryId = ref("");

const clientId = ref("");

const serviceOrdersFromUtc = ref("");
const serviceOrdersToUtc = ref("");
const serviceOrdersEmployeeId = ref("");

const scheduleSearch = ref("");
const schedulePage = ref(1);
const schedulePageSize = ref(10);
const SCHEDULE_MAX_PAGE = 100;

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
  const local = new Date(`${localDate}T00:00:00`);
  return local.toISOString();
}

function toUtcEndOfDay(localDate: string): string {
  if (!localDate) return "";
  const local = new Date(`${localDate}T23:59:59`);
  return local.toISOString();
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

function formatNumber(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }
  return Number(value).toLocaleString("es-CR");
}

const filteredSchedules = computed(() => {
  if (!scheduleSearch.value.trim()) return schedules.value;
  const query = scheduleSearch.value.toLowerCase().trim();
  return schedules.value.filter(
    (s) =>
      s.name.toLowerCase().includes(query) ||
      s.recipientEmail.toLowerCase().includes(query) ||
      s.reportType.toLowerCase().includes(query),
  );
});

const schedulePageNumbers = computed(() => {
  const current = schedulePage.value;
  const start = Math.max(1, current - 2);
  const end = Math.min(SCHEDULE_MAX_PAGE, current + 2);
  const pages: number[] = [];
  for (let i = start; i <= end; i += 1) pages.push(i);
  return pages;
});

const canScheduleGoPrevious = computed(() => schedulePage.value > 1);
const canScheduleGoNext = computed(
  () => schedulePage.value < SCHEDULE_MAX_PAGE,
);

const schedulesSummary = computed(() => {
  const total = schedules.value.length;
  const active = schedules.value.filter((item) => item.isActive).length;
  const failed = schedules.value.filter((item) => item.lastError).length;
  return { total, active, failed };
});

watch(scheduleSearch, () => {
  schedulePage.value = 1;
});

watch(schedulePageSize, async () => {
  schedulePage.value = 1;
  await loadSchedules();
});

watch(activeTab, () => {
  schedulePage.value = 1;
  scheduleSearch.value = "";
});

async function loadCatalogs() {
  loadingCatalogs.value = true;
  try {
    const [
      branchesResponse,
      categoriesResponse,
      clientsResponse,
      employeesResponse,
    ] = await Promise.all([
      SelectService.selectBranches({ onlyActive: true }),
      SelectService.selectProductCategories({ onlyActive: true }),
      SelectService.selectClients({ onlyActive: true }),
      SelectService.selectEmployees({ onlyActive: true }),
    ]);

    branches.value = Array.isArray(branchesResponse) ? branchesResponse : [];
    categories.value = Array.isArray(categoriesResponse)
      ? categoriesResponse
      : [];
    clients.value = Array.isArray(clientsResponse) ? clientsResponse : [];
    employees.value = Array.isArray(employeesResponse) ? employeesResponse : [];
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("reports.messages.catalogsError"),
    });
  } finally {
    loadingCatalogs.value = false;
  }
}

async function loadFinancialReport() {
  if (!financialFromUtc.value || !financialToUtc.value) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("reports.financial.validation.rangeRequired"),
    });
    return;
  }

  loadingFinancial.value = true;
  try {
    financialReport.value = await ReportsService.getFinancial(
      toUtcStartOfDay(financialFromUtc.value),
      toUtcEndOfDay(financialToUtc.value),
    );
  } catch {
    financialReport.value = null;
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("reports.financial.messages.loadError"),
    });
  } finally {
    loadingFinancial.value = false;
  }
}

async function exportFinancialPdf() {
  if (!financialFromUtc.value || !financialToUtc.value) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("reports.financial.validation.rangeRequired"),
    });
    return;
  }

  try {
    const blob = await ReportsService.exportFinancialPdf(
      toUtcStartOfDay(financialFromUtc.value),
      toUtcEndOfDay(financialToUtc.value),
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "financial-report.pdf";
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("reports.financial.messages.exportError"),
    });
  }
}

async function loadInventoryReport() {
  loadingInventory.value = true;
  try {
    inventoryReport.value = await ReportsService.getInventory(
      inventoryCategoryId.value || null,
    );
  } catch {
    inventoryReport.value = null;
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("reports.inventory.messages.loadError"),
    });
  } finally {
    loadingInventory.value = false;
  }
}

async function exportInventoryExcel() {
  try {
    const blob = await ReportsService.exportInventoryExcel(
      inventoryCategoryId.value || null,
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "inventory-report.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("reports.inventory.messages.exportError"),
    });
  }
}

function openClientDrawer() {
  if (!clientId.value.trim()) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("reports.client.validation.clientRequired"),
    });
    return;
  }

  clientPreviewLoaded.value = true;

  drawerStore.openDrawer({
    component: ClientReportDrawer,
    title: t("reports.client.drawer.title"),
    description: t("reports.client.drawer.description"),
    direction: "right",
    size: "xl",
    props: { clientId: clientId.value },
  });
}

async function loadServiceOrdersReport() {
  if (!serviceOrdersFromUtc.value || !serviceOrdersToUtc.value) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("reports.serviceOrders.validation.rangeRequired"),
    });
    return;
  }

  loadingServiceOrders.value = true;
  try {
    serviceOrdersReport.value = await ReportsService.getServiceOrders(
      toUtcStartOfDay(serviceOrdersFromUtc.value),
      toUtcEndOfDay(serviceOrdersToUtc.value),
      serviceOrdersEmployeeId.value || null,
    );
  } catch {
    serviceOrdersReport.value = null;
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("reports.serviceOrders.messages.loadError"),
    });
  } finally {
    loadingServiceOrders.value = false;
  }
}

function openServiceOrdersDrawer() {
  if (!serviceOrdersFromUtc.value || !serviceOrdersToUtc.value) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("reports.serviceOrders.validation.rangeRequired"),
    });
    return;
  }

  drawerStore.openDrawer({
    component: ServiceOrdersReportDrawer,
    title: t("reports.serviceOrders.drawer.title"),
    description: t("reports.serviceOrders.drawer.description"),
    direction: "right",
    size: "xl",
    props: {
      fromUtc: toUtcStartOfDay(serviceOrdersFromUtc.value),
      toUtc: toUtcEndOfDay(serviceOrdersToUtc.value),
      employeeId: serviceOrdersEmployeeId.value || null,
    },
  });
}

async function loadSchedules() {
  loadingSchedules.value = true;
  try {
    const response = await ReportsService.browseSchedules({
      page: schedulePage.value,
      pageSize: schedulePageSize.value,
    });

    schedules.value = Array.isArray(response) ? response : [];
  } catch {
    schedules.value = [];
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("reports.schedules.messages.loadError"),
    });
  } finally {
    loadingSchedules.value = false;
  }
}

function openCreateScheduleModal() {
  modalStore.open({
    component: ReportScheduleModal,
    props: { schedule: null },
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("reports.schedules.messages.createSuccess"),
      });
      await loadSchedules();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message:
          error?.message ?? t("reports.schedules.messages.createError"),
      });
    },
  });
}

function openEditScheduleModal(schedule: ReportSchedule) {
  modalStore.open({
    component: ReportScheduleModal,
    props: { schedule },
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("reports.schedules.messages.updateSuccess"),
      });
      await loadSchedules();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message:
          error?.message ?? t("reports.schedules.messages.updateError"),
      });
    },
  });
}

async function toggleScheduleStatus(schedule: ReportSchedule) {
  try {
    await ReportsService.updateSchedule(schedule.reportScheduleId, {
      name: schedule.name,
      reportType: schedule.reportType,
      frequency: schedule.frequency,
      recipientEmail: schedule.recipientEmail,
      timeOfDayUtc: schedule.timeOfDayUtc,
      isActive: !schedule.isActive,
      branchId: schedule.branchId,
      categoryId: schedule.categoryId,
      clientId: schedule.clientId,
      employeeId: schedule.employeeId,
    });

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: schedule.isActive
        ? t("reports.schedules.messages.deactivateSuccess")
        : t("reports.schedules.messages.activateSuccess"),
    });

    await loadSchedules();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("reports.schedules.messages.statusError"),
    });
  }
}

function getScheduleActions(schedule: ReportSchedule) {
  return [
    {
      label: t("reports.actions.edit"),
      action: () => openEditScheduleModal(schedule),
    },
    {
      label: schedule.isActive
        ? t("reports.actions.deactivate")
        : t("reports.actions.activate"),
      action: () => toggleScheduleStatus(schedule),
      danger: schedule.isActive,
    },
  ];
}

async function goToSchedulePage(targetPage: number) {
  if (
    targetPage < 1 ||
    targetPage > SCHEDULE_MAX_PAGE ||
    targetPage === schedulePage.value
  ) {
    return;
  }
  schedulePage.value = targetPage;
  await loadSchedules();
}

async function scheduleGoPrevious() {
  if (!canScheduleGoPrevious.value) return;
  await goToSchedulePage(schedulePage.value - 1);
}

async function scheduleGoNext() {
  if (!canScheduleGoNext.value) return;
  await goToSchedulePage(schedulePage.value + 1);
}

async function onScheduleSearch() {
  schedulePage.value = 1;
  await loadSchedules();
}

onMounted(async () => {
  financialFromUtc.value = getLocalDateInput(-30);
  financialToUtc.value = getLocalDateInput(0);

  serviceOrdersFromUtc.value = getLocalDateInput(-30);
  serviceOrdersToUtc.value = getLocalDateInput(0);

  await loadCatalogs();
  await loadFinancialReport();
  await loadInventoryReport();
  await loadSchedules();
});
</script>

<template>
  <section class="h-full min-h-0 bg-bt-grey-50 p-bt-spacing-24 flex flex-col">
    <!-- HEADER -->
    <div class="mb-bt-spacing-24 shrink-0">
      <h1 class="text-2xl font-bt-bold text-bt-primary-700">
        {{ $t("reports.title") }}
      </h1>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("reports.subtitle") }}
      </p>
    </div>

    <div
      class="bg-bt-white rounded-l shadow-bt-elevation-200 border border-bt-grey-200 p-bt-spacing-24 flex-1 min-h-0 flex flex-col"
    >
      <!-- TOOLBAR: tabs + right-side actions -->
      <div
        class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 mb-bt-spacing-24 shrink-0"
      >
        <div class="flex flex-wrap gap-bt-spacing-8">
          <button
            v-for="tab in [
              'financial',
              'inventory',
              'client',
              'serviceOrders',
              'schedules',
            ]"
            :key="tab"
            type="button"
            class="rounded-m px-bt-spacing-16 py-bt-spacing-12 transition"
            :class="
              activeTab === tab
                ? 'bg-bt-primary-500 text-bt-white'
                : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'
            "
            @click="activeTab = tab as any"
          >
            {{ $t(`reports.tabs.${tab}`) }}
          </button>
        </div>

        <!-- Right: page size + CTA — only on schedules tab -->
        <div
          v-if="activeTab === 'schedules'"
          class="flex items-center gap-bt-spacing-12 shrink-0"
        >
          <select
            v-model.number="schedulePageSize"
            class="px-bt-spacing-12 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>

          <!-- New schedule: accent-500 -->
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 transition font-bt-semibold"
            @click="openCreateScheduleModal"
          >
            {{ $t("reports.schedules.actions.newSchedule") }}
          </button>
        </div>
      </div>

      <div
        v-if="loadingCatalogs"
        class="py-bt-spacing-32 text-center text-bt-grey-500"
      >
        {{ $t("common.loading") }}
      </div>

      <template v-else>

        <!-- ── FINANCIAL ── -->
        <div
          v-if="activeTab === 'financial'"
          class="flex-1 min-h-0 flex flex-col gap-bt-spacing-24"
        >
          <!-- Filter bar -->
          <div
            class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 shrink-0"
          >
            <div class="flex flex-col sm:flex-row gap-bt-spacing-12 w-full lg:max-w-2xl">
              <input
                v-model="financialFromUtc"
                type="date"
                class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
              />
              <input
                v-model="financialToUtc"
                type="date"
                class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
              />
              <!-- Generate: primary-500 -->
              <button
                type="button"
                class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition"
                @click="loadFinancialReport"
              >
                {{ $t("reports.actions.generate") }}
              </button>
              <!-- Refresh: grey-200 -->
              <button
                type="button"
                class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
                @click="loadFinancialReport"
              >
                {{ $t("reports.actions.refresh") }}
              </button>
            </div>

            <div class="flex items-center gap-bt-spacing-12 shrink-0">
              <!-- Export PDF: warning-500 -->
              <button
                type="button"
                class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-warning-500 text-bt-white hover:bg-bt-warning-700 transition font-bt-semibold"
                @click="exportFinancialPdf"
              >
                {{ $t("reports.actions.exportPdf") }}
              </button>
            </div>
          </div>

          <!-- Results -->
          <div class="flex-1 min-h-0 overflow-auto">
            <div
              v-if="loadingFinancial"
              class="py-bt-spacing-32 text-center text-bt-grey-500"
            >
              {{ $t("common.loading") }}
            </div>

            <template v-else-if="financialReport">
              <div
                v-if="!financialReport.hasData"
                class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16 text-bt-grey-600"
              >
                {{ financialReport.message || $t("reports.financial.empty") }}
              </div>

              <div
                v-else
                class="grid grid-cols-1 gap-bt-spacing-16 md:grid-cols-3"
              >
                <div
                  class="rounded-m border border-bt-success-200 bg-bt-success-100 p-bt-spacing-16"
                >
                  <div class="text-sm text-bt-success-700">
                    {{ $t("reports.financial.summary.sales") }}
                  </div>
                  <div
                    class="mt-bt-spacing-8 text-2xl font-bt-bold text-bt-success-700"
                  >
                    {{ formatMoney(financialReport.salesTotal) }}
                  </div>
                </div>

                <div
                  class="rounded-m border border-bt-error-200 bg-bt-error-100 p-bt-spacing-16"
                >
                  <div class="text-sm text-bt-error-700">
                    {{ $t("reports.financial.summary.expenses") }}
                  </div>
                  <div
                    class="mt-bt-spacing-8 text-2xl font-bt-bold text-bt-error-700"
                  >
                    {{ formatMoney(financialReport.expensesTotal) }}
                  </div>
                </div>

                <div
                  class="rounded-m border p-bt-spacing-16"
                  :class="
                    financialReport.profit >= 0
                      ? 'border-bt-primary-200 bg-bt-primary-50'
                      : 'border-bt-warning-200 bg-bt-warning-100'
                  "
                >
                  <div
                    class="text-sm"
                    :class="
                      financialReport.profit >= 0
                        ? 'text-bt-primary-700'
                        : 'text-bt-warning-700'
                    "
                  >
                    {{ $t("reports.financial.summary.profit") }}
                  </div>
                  <div
                    class="mt-bt-spacing-8 text-2xl font-bt-bold"
                    :class="
                      financialReport.profit >= 0
                        ? 'text-bt-primary-700'
                        : 'text-bt-warning-700'
                    "
                  >
                    {{ formatMoney(financialReport.profit) }}
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- ── INVENTORY ── -->
        <div
          v-else-if="activeTab === 'inventory'"
          class="flex-1 min-h-0 flex flex-col gap-bt-spacing-24"
        >
          <!-- Filter bar -->
          <div
            class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 shrink-0"
          >
            <div class="flex flex-col sm:flex-row gap-bt-spacing-12 w-full lg:max-w-2xl">
              <select
                v-model="inventoryCategoryId"
                class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
              >
                <option value="">
                  {{ $t("reports.filters.allCategories") }}
                </option>
                <option
                  v-for="category in categories"
                  :key="category.id"
                  :value="category.id"
                >
                  {{ category.label }}
                </option>
              </select>
              <!-- Generate: primary-500 -->
              <button
                type="button"
                class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition"
                @click="loadInventoryReport"
              >
                {{ $t("reports.actions.generate") }}
              </button>
              <!-- Refresh: grey-200 -->
              <button
                type="button"
                class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
                @click="loadInventoryReport"
              >
                {{ $t("reports.actions.refresh") }}
              </button>
            </div>

            <div class="flex items-center gap-bt-spacing-12 shrink-0">
              <!-- Export Excel: success-500 -->
              <button
                type="button"
                class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-success-500 text-bt-white hover:bg-bt-success-700 transition font-bt-semibold"
                @click="exportInventoryExcel"
              >
                {{ $t("reports.actions.exportExcel") }}
              </button>
            </div>
          </div>

          <!-- Results -->
          <div class="flex-1 min-h-0 overflow-auto">
            <div
              v-if="loadingInventory"
              class="py-bt-spacing-32 text-center text-bt-grey-500"
            >
              {{ $t("common.loading") }}
            </div>

            <template v-else-if="inventoryReport">
              <div
                v-if="!inventoryReport.hasData"
                class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16 text-bt-grey-600"
              >
                {{ inventoryReport.message || $t("reports.inventory.empty") }}
              </div>

              <table v-else class="w-full border-collapse min-w-[800px]">
                <thead class="sticky top-0 z-10">
                  <tr class="bg-bt-primary-50 text-left">
                    <th
                      class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                    >
                      {{ $t("reports.inventory.table.product") }}
                    </th>
                    <th
                      class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                    >
                      {{ $t("reports.inventory.table.category") }}
                    </th>
                    <th
                      class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                    >
                      {{ $t("reports.inventory.table.stock") }}
                    </th>
                    <th
                      class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                    >
                      {{ $t("reports.inventory.table.updatedAt") }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in inventoryReport.items"
                    :key="item.productId"
                    class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
                  >
                    <td
                      class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                    >
                      {{ item.productName }}
                    </td>
                    <td
                      class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                    >
                      {{ item.categoryName || "-" }}
                    </td>
                    <td
                      class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                    >
                      {{ formatNumber(item.totalStock) }}
                    </td>
                    <td
                      class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                    >
                      {{ formatDateTime(item.updatedAt) }}
                    </td>
                  </tr>

                  <tr v-if="!inventoryReport.items.length">
                    <td
                      colspan="4"
                      class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
                    >
                      {{ $t("reports.inventory.empty") }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </template>
          </div>
        </div>

        <!-- ── CLIENT ── -->
        <div
          v-else-if="activeTab === 'client'"
          class="flex-1 min-h-0 flex flex-col gap-bt-spacing-24"
        >
          <!-- Filter bar -->
          <div
            class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 shrink-0"
          >
            <div class="flex flex-col sm:flex-row gap-bt-spacing-12 w-full lg:max-w-2xl">
              <select
                v-model="clientId"
                class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
              >
                <option value="">
                  {{ $t("reports.placeholders.selectClient") }}
                </option>
                <option
                  v-for="client in clients"
                  :key="client.id"
                  :value="client.id"
                >
                  {{ client.label }}
                </option>
              </select>
              <!-- View report: primary-500 -->
              <button
                type="button"
                class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition"
                @click="openClientDrawer"
              >
                {{ $t("reports.actions.viewReport") }}
              </button>
            </div>
          </div>

          <!-- Results -->
          <div class="flex-1 min-h-0 overflow-auto">
            <div
              class="rounded-m border border-bt-grey-200 bg-bt-white p-bt-spacing-24"
            >
              <div class="flex items-center gap-bt-spacing-12">
                <div
                  class="flex h-12 w-12 items-center justify-center rounded-full bg-bt-primary-50 text-bt-primary-700"
                >
                  <span class="text-xl">👤</span>
                </div>
                <div>
                  <div class="font-bt-semibold text-bt-primary-700">
                    {{ $t("reports.client.preview.title") }}
                  </div>
                  <div class="text-sm text-bt-grey-600">
                    {{
                      clientPreviewLoaded
                        ? $t("reports.client.preview.loaded")
                        : $t("reports.client.preview.description")
                    }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── SERVICE ORDERS ── -->
        <div
          v-else-if="activeTab === 'serviceOrders'"
          class="flex-1 min-h-0 flex flex-col gap-bt-spacing-24"
        >
          <!-- Filter bar -->
          <div
            class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 shrink-0"
          >
            <div class="flex flex-col sm:flex-row gap-bt-spacing-12 w-full lg:max-w-2xl">
              <input
                v-model="serviceOrdersFromUtc"
                type="date"
                class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
              />
              <input
                v-model="serviceOrdersToUtc"
                type="date"
                class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
              />
              <select
                v-model="serviceOrdersEmployeeId"
                class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
              >
                <option value="">
                  {{ $t("reports.placeholders.allEmployees") }}
                </option>
                <option
                  v-for="employee in employees"
                  :key="employee.id"
                  :value="employee.id"
                >
                  {{ employee.label }}
                </option>
              </select>
              <!-- Generate: primary-500 -->
              <button
                type="button"
                class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition"
                @click="loadServiceOrdersReport"
              >
                {{ $t("reports.actions.generate") }}
              </button>
              <!-- Refresh: grey-200 -->
              <button
                type="button"
                class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
                @click="loadServiceOrdersReport"
              >
                {{ $t("reports.actions.refresh") }}
              </button>
            </div>

            <div class="flex items-center gap-bt-spacing-12 shrink-0">
              <!-- View detailed report: accent-500 -->
              <button
                type="button"
                class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 transition font-bt-semibold"
                @click="openServiceOrdersDrawer"
              >
                {{ $t("reports.actions.viewReport") }}
              </button>
            </div>
          </div>

          <!-- Results -->
          <div class="flex-1 min-h-0 overflow-auto">
            <div
              v-if="loadingServiceOrders"
              class="py-bt-spacing-32 text-center text-bt-grey-500"
            >
              {{ $t("common.loading") }}
            </div>

            <template v-else-if="serviceOrdersReport">
              <div
                v-if="!serviceOrdersReport.hasData"
                class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16 text-bt-grey-600"
              >
                {{
                  serviceOrdersReport.message ||
                  $t("reports.serviceOrders.empty")
                }}
              </div>

              <template v-else>
                <div
                  class="grid grid-cols-1 gap-bt-spacing-16 md:grid-cols-3 mb-bt-spacing-24"
                >
                  <div
                    class="rounded-m border border-bt-success-200 bg-bt-success-100 p-bt-spacing-16"
                  >
                    <div class="text-sm text-bt-success-700">
                      {{ $t("reports.serviceOrders.summary.completed") }}
                    </div>
                    <div
                      class="mt-bt-spacing-8 text-2xl font-bt-bold text-bt-success-700"
                    >
                      {{ serviceOrdersReport.completedCount }}
                    </div>
                  </div>

                  <div
                    class="rounded-m border border-bt-warning-200 bg-bt-warning-100 p-bt-spacing-16"
                  >
                    <div class="text-sm text-bt-warning-700">
                      {{ $t("reports.serviceOrders.summary.pending") }}
                    </div>
                    <div
                      class="mt-bt-spacing-8 text-2xl font-bt-bold text-bt-warning-700"
                    >
                      {{ serviceOrdersReport.pendingCount }}
                    </div>
                  </div>

                  <div
                    class="rounded-m border border-bt-error-200 bg-bt-error-100 p-bt-spacing-16"
                  >
                    <div class="text-sm text-bt-error-700">
                      {{ $t("reports.serviceOrders.summary.canceled") }}
                    </div>
                    <div
                      class="mt-bt-spacing-8 text-2xl font-bt-bold text-bt-error-700"
                    >
                      {{ serviceOrdersReport.canceledCount }}
                    </div>
                  </div>
                </div>

                <table class="w-full border-collapse min-w-[800px]">
                  <thead class="sticky top-0 z-10">
                    <tr class="bg-bt-primary-50 text-left">
                      <th
                        class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                      >
                        {{ $t("reports.serviceOrders.table.code") }}
                      </th>
                      <th
                        class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                      >
                        {{ $t("reports.serviceOrders.table.client") }}
                      </th>
                      <th
                        class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                      >
                        {{ $t("reports.serviceOrders.table.date") }}
                      </th>
                      <th
                        class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                      >
                        {{ $t("reports.serviceOrders.table.status") }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in serviceOrdersReport.items"
                      :key="item.serviceOrderId"
                      class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
                    >
                      <td
                        class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                      >
                        {{ item.code }}
                      </td>
                      <td
                        class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                      >
                        {{ item.clientName }}
                      </td>
                      <td
                        class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                      >
                        {{ formatDateTime(item.scheduledDate) }}
                      </td>
                      <td
                        class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                      >
                        {{ item.status }}
                      </td>
                    </tr>

                    <tr v-if="!serviceOrdersReport.items.length">
                      <td
                        colspan="4"
                        class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
                      >
                        {{ $t("reports.serviceOrders.empty") }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </template>
            </template>
          </div>
        </div>

        <!-- ── SCHEDULES ── -->
        <div v-else class="flex-1 min-h-0 flex flex-col">
          <!-- Summary cards -->
          <div
            class="grid grid-cols-1 gap-bt-spacing-16 md:grid-cols-3 mb-bt-spacing-24 shrink-0"
          >
            <div
              class="rounded-m border border-bt-primary-200 bg-bt-primary-50 p-bt-spacing-16"
            >
              <div class="text-sm text-bt-primary-700">
                {{ $t("reports.schedules.summary.total") }}
              </div>
              <div
                class="mt-bt-spacing-8 text-2xl font-bt-bold text-bt-primary-700"
              >
                {{ schedulesSummary.total }}
              </div>
            </div>

            <div
              class="rounded-m border border-bt-success-200 bg-bt-success-100 p-bt-spacing-16"
            >
              <div class="text-sm text-bt-success-700">
                {{ $t("reports.schedules.summary.active") }}
              </div>
              <div
                class="mt-bt-spacing-8 text-2xl font-bt-bold text-bt-success-700"
              >
                {{ schedulesSummary.active }}
              </div>
            </div>

            <div
              class="rounded-m border border-bt-error-200 bg-bt-error-100 p-bt-spacing-16"
            >
              <div class="text-sm text-bt-error-700">
                {{ $t("reports.schedules.summary.failed") }}
              </div>
              <div
                class="mt-bt-spacing-8 text-2xl font-bt-bold text-bt-error-700"
              >
                {{ schedulesSummary.failed }}
              </div>
            </div>
          </div>

          <!-- Search bar (mirrors Users toolbar) -->
          <div
            class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 mb-bt-spacing-24 shrink-0"
          >
            <div
              class="flex flex-col sm:flex-row gap-bt-spacing-12 w-full lg:max-w-2xl"
            >
              <input
                v-model="scheduleSearch"
                type="text"
                :placeholder="$t('reports.schedules.searchPlaceholder')"
                class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                @keyup.enter="onScheduleSearch"
              />
              <!-- Search: primary-500 -->
              <button
                type="button"
                class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition"
                @click="onScheduleSearch"
              >
                {{ $t("reports.actions.search") }}
              </button>
              <!-- Refresh: grey-200 -->
              <button
                type="button"
                class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
                @click="loadSchedules"
              >
                {{ $t("reports.actions.refresh") }}
              </button>
            </div>
          </div>

          <!-- Table -->
          <div class="flex-1 min-h-0 overflow-auto">
            <div
              v-if="loadingSchedules"
              class="py-bt-spacing-32 text-center text-bt-grey-500"
            >
              {{ $t("common.loading") }}
            </div>

            <table v-else class="w-full border-collapse min-w-[1100px]">
              <thead class="sticky top-0 z-10">
                <tr class="bg-bt-primary-50 text-left">
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("reports.schedules.table.name") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("reports.schedules.table.reportType") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("reports.schedules.table.frequency") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("reports.schedules.table.recipient") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("reports.schedules.table.time") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("reports.schedules.table.status") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("reports.schedules.table.lastAttempt") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20"
                  >
                    {{ $t("reports.schedules.table.options") }}
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="schedule in filteredSchedules"
                  :key="schedule.reportScheduleId"
                  class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
                >
                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 font-bt-semibold"
                  >
                    <div>{{ schedule.name }}</div>
                    <div
                      v-if="schedule.lastError"
                      class="mt-bt-spacing-4 text-xs font-bt-normal text-bt-error-700"
                    >
                      {{ schedule.lastError }}
                    </div>
                  </td>
                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ schedule.reportType }}
                  </td>
                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ schedule.frequency }}
                  </td>
                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ schedule.recipientEmail }}
                  </td>
                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ schedule.timeOfDayUtc }}
                  </td>
                  <td class="px-bt-spacing-16 py-bt-spacing-12">
                    <span
                      class="inline-flex rounded-full px-bt-spacing-12 py-bt-spacing-4 text-xs font-bt-semibold"
                      :class="
                        schedule.isActive
                          ? 'bg-bt-success-100 text-bt-success-700'
                          : 'bg-bt-error-100 text-bt-error-700'
                      "
                    >
                      {{
                        schedule.isActive
                          ? $t("reports.status.active")
                          : $t("reports.status.inactive")
                      }}
                    </span>
                  </td>
                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ formatDateTime(schedule.lastAttemptAtUtc) }}
                  </td>
                  <td class="px-bt-spacing-16 py-bt-spacing-12">
                    <ReportsActionMenu :items="getScheduleActions(schedule)">
                      <template #trigger>
                        <button
                          type="button"
                          class="inline-flex items-center justify-center w-10 h-10 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 transition"
                        >
                          <MoreHorizontal :size="18" />
                        </button>
                      </template>
                    </ReportsActionMenu>
                  </td>
                </tr>

                <tr v-if="!filteredSchedules.length && !loadingSchedules">
                  <td
                    colspan="8"
                    class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
                  >
                    {{ $t("reports.schedules.empty") }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination (mirrors Users) -->
          <div
            class="mt-bt-spacing-24 pt-bt-spacing-16 border-t border-bt-grey-200 flex flex-col md:flex-row md:items-center md:justify-between gap-bt-spacing-16 shrink-0"
          >
            <div class="text-sm text-bt-grey-600">
              {{ $t("pagination.page") }} {{ schedulePage }}
              {{ $t("pagination.of") }} {{ SCHEDULE_MAX_PAGE }}
              <span class="text-bt-grey-500">
                ({{ filteredSchedules.length }}
                {{ $t("reports.schedules.filtered") }})
              </span>
            </div>

            <div class="flex items-center gap-bt-spacing-8 flex-wrap">
              <button
                type="button"
                :disabled="!canScheduleGoPrevious"
                class="inline-flex items-center gap-bt-spacing-8 px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 disabled:bg-bt-disabled disabled:text-bt-grey-500 disabled:cursor-not-allowed"
                @click="scheduleGoPrevious"
              >
                <ChevronLeft :size="16" />
                <span>{{ $t("pagination.previous") }}</span>
              </button>

              <button
                v-if="schedulePageNumbers[0] > 1"
                type="button"
                class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100"
                @click="goToSchedulePage(1)"
              >
                1
              </button>

              <span
                v-if="schedulePageNumbers[0] > 2"
                class="px-bt-spacing-8 text-bt-grey-500"
              >
                ...
              </span>

              <button
                v-for="pageNumber in schedulePageNumbers"
                :key="pageNumber"
                type="button"
                class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border transition"
                :class="
                  pageNumber === schedulePage
                    ? 'bg-bt-primary-500 border-bt-primary-500 text-bt-white'
                    : 'border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100'
                "
                @click="goToSchedulePage(pageNumber)"
              >
                {{ pageNumber }}
              </button>

              <span
                v-if="
                  schedulePageNumbers[schedulePageNumbers.length - 1] <
                  SCHEDULE_MAX_PAGE - 1
                "
                class="px-bt-spacing-8 text-bt-grey-500"
              >
                ...
              </span>

              <button
                v-if="
                  schedulePageNumbers[schedulePageNumbers.length - 1] <
                  SCHEDULE_MAX_PAGE
                "
                type="button"
                class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100"
                @click="goToSchedulePage(SCHEDULE_MAX_PAGE)"
              >
                {{ SCHEDULE_MAX_PAGE }}
              </button>

              <button
                type="button"
                :disabled="!canScheduleGoNext"
                class="inline-flex items-center gap-bt-spacing-8 px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 disabled:bg-bt-disabled disabled:text-bt-grey-500 disabled:cursor-not-allowed"
                @click="scheduleGoNext"
              >
                <span>{{ $t("pagination.next") }}</span>
                <ChevronRight :size="16" />
              </button>
            </div>
          </div>
        </div>

      </template>
    </div>
  </section>
</template>