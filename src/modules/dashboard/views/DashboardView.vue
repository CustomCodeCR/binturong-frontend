<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  RefreshCw,
  Activity,
  ShoppingBag,
  FileSignature,
  AlertTriangle,
  Clock3,
  Building2,
} from "lucide-vue-next";

import { DashboardService } from "@/core/services/dashboardService";
import { SelectService } from "@/core/services/selectService";

import { useToastStore } from "@/core/stores/toastStore";

import DashboardKpiCard from "@/modules/dashboard/components/DashboardKpiCard.vue";

import type { Dashboard } from "@/core/interfaces/dashboard";
import type { SelectOption } from "@/core/interfaces/select";

const { t } = useI18n();
const toastStore = useToastStore();

const loading = ref(false);
const refreshing = ref(false);
const dashboard = ref<Dashboard | null>(null);
const branches = ref<SelectOption[]>([]);
const selectedBranchId = ref<string>("");
const autoRefreshEnabled = ref(true);
const autoRefreshSeconds = ref(60);
const permissionDenied = ref(false);
const hasLoadedOnce = ref(false);

let autoRefreshTimer: number | null = null;

const hasDashboard = computed(() => dashboard.value !== null);

const lastUpdatedLabel = computed(() => {
  if (!dashboard.value?.lastUpdatedAtUtc) {
    return "-";
  }

  const date = new Date(dashboard.value.lastUpdatedAtUtc);

  if (Number.isNaN(date.getTime())) {
    return dashboard.value.lastUpdatedAtUtc;
  }

  return date.toLocaleString("es-CR");
});

const inventoryCategoryOptions = computed(() => {
  if (!dashboard.value?.criticalInventory?.items?.length) {
    return [];
  }

  const map = new Map<string, string>();

  for (const item of dashboard.value.criticalInventory.items) {
    const key = item.categoryId || "uncategorized";
    const label =
      item.categoryName || t("dashboard.inventory.filters.uncategorized");

    if (!map.has(key)) {
      map.set(key, label);
    }
  }

  return Array.from(map.entries()).map(([id, label]) => ({
    id,
    label,
  }));
});

const selectedCategoryId = ref("");

const filteredCriticalItems = computed(() => {
  const items = dashboard.value?.criticalInventory?.items ?? [];

  if (!selectedCategoryId.value) {
    return items;
  }

  if (selectedCategoryId.value === "uncategorized") {
    return items.filter((item) => !item.categoryId);
  }

  return items.filter((item) => item.categoryId === selectedCategoryId.value);
});

const monthlySalesTone = computed(() => {
  if (!dashboard.value?.monthlySales) {
    return "primary";
  }

  return dashboard.value.monthlySales.hasRecords ? "success" : "warning";
});

const contractsTone = computed(() => {
  if (!dashboard.value?.contracts) {
    return "primary";
  }

  if (dashboard.value.contracts.expiredCount > 0) {
    return "danger";
  }

  if (dashboard.value.contracts.expiringSoonCount > 0) {
    return "warning";
  }

  return "success";
});

const inventoryTone = computed(() => {
  if (!dashboard.value?.criticalInventory) {
    return "primary";
  }

  return dashboard.value.criticalInventory.hasAlerts ? "danger" : "success";
});

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

function getStockSeverityClass(currentStock: number, minStock: number) {
  if (currentStock <= 0) {
    return "bg-bt-error-100 text-bt-error-700 border border-bt-error-200";
  }

  if (currentStock <= minStock) {
    return "bg-bt-warning-100 text-bt-warning-700 border border-bt-warning-200";
  }

  return "bg-bt-success-100 text-bt-success-700 border border-bt-success-200";
}

async function loadBranches() {
  try {
    const response = await SelectService.selectBranches({ onlyActive: true });
    branches.value = Array.isArray(response) ? response : [];
  } catch {
    branches.value = [];
  }
}

async function loadDashboard(options?: { silent?: boolean }) {
  if (!options?.silent) {
    loading.value = true;
  } else {
    refreshing.value = true;
  }

  permissionDenied.value = false;

  try {
    const response = await DashboardService.read({
      branchId: selectedBranchId.value || null,
    });

    dashboard.value = response;
    hasLoadedOnce.value = true;
  } catch (error: any) {
    const status = Number(
      error?.status ?? error?.response?.status ?? error?.response?.data?.status,
    );

    if (status === 401 || status === 403) {
      permissionDenied.value = true;
      dashboard.value = null;
    } else {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: t("dashboard.messages.loadError"),
      });
    }
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

async function refreshDashboard() {
  await loadDashboard({ silent: true });

  if (!permissionDenied.value) {
    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("dashboard.messages.refreshSuccess"),
    });
  }
}

function clearAutoRefreshTimer() {
  if (autoRefreshTimer !== null) {
    window.clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
}

function configureAutoRefresh() {
  clearAutoRefreshTimer();

  if (!autoRefreshEnabled.value || autoRefreshSeconds.value <= 0) {
    return;
  }

  autoRefreshTimer = window.setInterval(async () => {
    await loadDashboard({ silent: true });
  }, autoRefreshSeconds.value * 1000);
}

watch(selectedBranchId, async () => {
  selectedCategoryId.value = "";
  await loadDashboard();
});

watch(autoRefreshEnabled, () => {
  configureAutoRefresh();
});

watch(autoRefreshSeconds, () => {
  configureAutoRefresh();
});

onMounted(async () => {
  await loadBranches();
  await loadDashboard();
  configureAutoRefresh();
});

onBeforeUnmount(() => {
  clearAutoRefreshTimer();
});
</script>

<template>
  <section class="min-h-full bg-bt-grey-50 p-bt-spacing-24">
    <div class="mx-auto flex max-w-[1600px] flex-col gap-bt-spacing-24">
      <div
        class="relative overflow-hidden rounded-[28px] border border-bt-primary-100 bg-gradient-to-r from-bt-primary-700 via-bt-primary-600 to-bt-accent-500 px-bt-spacing-24 py-bt-spacing-24 text-bt-white shadow-bt-elevation-300"
      >
        <div
          class="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl"
        ></div>
        <div
          class="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-white/10 blur-3xl"
        ></div>

        <div
          class="relative flex flex-col gap-bt-spacing-16 xl:flex-row xl:items-start xl:justify-between"
        >
          <div class="max-w-3xl">
            <div
              class="mb-bt-spacing-12 inline-flex items-center gap-bt-spacing-8 rounded-full border border-white/20 bg-white/10 px-bt-spacing-12 py-bt-spacing-8 text-sm"
            >
              <Activity :size="16" />
              <span>{{ $t("dashboard.title") }}</span>
            </div>

            <h1 class="text-3xl font-bt-bold tracking-tight">
              {{ $t("dashboard.title") }}
            </h1>

            <p
              class="mt-bt-spacing-8 max-w-2xl text-sm text-white/85 md:text-base"
            >
              {{ $t("dashboard.subtitle") }}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-bt-spacing-12">
            <div
              class="inline-flex items-center gap-bt-spacing-8 rounded-xl border border-white/20 bg-white/10 px-bt-spacing-14 py-bt-spacing-10 backdrop-blur-sm"
            >
              <Clock3 :size="16" class="text-white/90" />
              <span class="text-sm text-white/80">
                {{ $t("dashboard.lastUpdated") }}:
              </span>
              <span class="text-sm font-bt-semibold text-white">
                {{ lastUpdatedLabel }}
              </span>
            </div>

            <button
              type="button"
              :disabled="refreshing || loading"
              class="inline-flex items-center gap-bt-spacing-8 rounded-xl bg-white px-bt-spacing-16 py-bt-spacing-12 font-bt-semibold text-bt-primary-700 transition hover:scale-[1.01] hover:bg-bt-grey-50 disabled:cursor-not-allowed disabled:opacity-70"
              @click="refreshDashboard"
            >
              <RefreshCw :size="16" :class="{ 'animate-spin': refreshing }" />
              <span>
                {{
                  refreshing
                    ? $t("dashboard.actions.refreshing")
                    : $t("dashboard.actions.refresh")
                }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div
        class="rounded-[24px] border border-bt-grey-200 bg-bt-white p-bt-spacing-20 shadow-bt-elevation-200"
      >
        <div
          class="grid grid-cols-1 gap-bt-spacing-16 lg:grid-cols-[1.3fr_0.8fr_0.8fr]"
        >
          <div>
            <label
              class="mb-bt-spacing-8 block text-sm font-bt-medium text-bt-primary-700"
            >
              {{ $t("dashboard.filters.branch") }}
            </label>

            <div class="relative">
              <Building2
                :size="16"
                class="absolute left-bt-spacing-12 top-1/2 -translate-y-1/2 text-bt-grey-500"
              />

              <select
                v-model="selectedBranchId"
                class="w-full rounded-xl border border-bt-grey-300 bg-bt-grey-50 py-bt-spacing-12 pl-[42px] pr-bt-spacing-16 text-bt-primary-700 transition focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
              >
                <option value="">
                  {{ $t("dashboard.filters.allBranches") }}
                </option>
                <option
                  v-for="branch in branches"
                  :key="branch.id"
                  :value="branch.id"
                >
                  {{ branch.label }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label
              class="mb-bt-spacing-8 block text-sm font-bt-medium text-bt-primary-700"
            >
              {{ $t("dashboard.filters.autoRefresh") }}
            </label>

            <div
              class="flex h-[46px] items-center rounded-xl border border-bt-grey-300 bg-bt-grey-50 px-bt-spacing-12"
            >
              <label
                class="inline-flex items-center gap-bt-spacing-8 text-sm text-bt-grey-700"
              >
                <input
                  v-model="autoRefreshEnabled"
                  type="checkbox"
                  class="rounded border-bt-grey-300 text-bt-accent-500 focus:ring-bt-accent-500"
                />
                {{ $t("dashboard.filters.enabled") }}
              </label>
            </div>
          </div>

          <div>
            <label
              class="mb-bt-spacing-8 block text-sm font-bt-medium text-bt-primary-700"
            >
              {{ $t("dashboard.filters.interval") }}
            </label>

            <select
              v-model.number="autoRefreshSeconds"
              :disabled="!autoRefreshEnabled"
              class="h-[46px] w-full rounded-xl border border-bt-grey-300 bg-bt-grey-50 px-bt-spacing-16 text-bt-primary-700 transition focus:outline-none focus:ring-2 focus:ring-bt-accent-500 disabled:bg-bt-grey-100 disabled:text-bt-grey-500"
            >
              <option :value="30">30s</option>
              <option :value="60">60s</option>
              <option :value="120">120s</option>
              <option :value="300">300s</option>
            </select>
          </div>
        </div>
      </div>

      <div
        v-if="loading && !hasLoadedOnce"
        class="flex min-h-[320px] items-center justify-center rounded-[24px] border border-bt-grey-200 bg-bt-white shadow-bt-elevation-200"
      >
        <div
          class="flex flex-col items-center gap-bt-spacing-12 text-bt-grey-500"
        >
          <RefreshCw :size="22" class="animate-spin" />
          <span>{{ $t("common.loading") }}</span>
        </div>
      </div>

      <div
        v-else-if="permissionDenied"
        class="flex min-h-[320px] items-center justify-center rounded-[24px] border border-bt-error-200 bg-bt-white p-bt-spacing-24 shadow-bt-elevation-200"
      >
        <div
          class="max-w-xl rounded-[20px] border border-bt-error-200 bg-bt-error-100 p-bt-spacing-24 text-center"
        >
          <div class="mb-bt-spacing-12 flex justify-center">
            <div class="rounded-full bg-bt-white p-bt-spacing-12 shadow-sm">
              <AlertTriangle :size="28" class="text-bt-error-700" />
            </div>
          </div>

          <h3 class="text-lg font-bt-bold text-bt-error-700">
            {{ $t("dashboard.permission.title") }}
          </h3>

          <p class="mt-bt-spacing-8 text-bt-error-700">
            {{ $t("dashboard.permission.description") }}
          </p>
        </div>
      </div>

      <template v-else-if="dashboard">
        <div
          class="grid grid-cols-1 gap-bt-spacing-16 md:grid-cols-2 xl:grid-cols-3"
        >
          <div
            class="rounded-[22px] border border-bt-primary-100 bg-gradient-to-br from-bt-white to-bt-primary-50 p-bt-spacing-16 shadow-bt-elevation-200"
          >
            <div class="mb-bt-spacing-12 flex items-center justify-between">
              <div
                class="rounded-xl bg-bt-primary-100 p-bt-spacing-10 text-bt-primary-700"
              >
                <ShoppingBag :size="18" />
              </div>
              <span class="text-xs font-bt-medium text-bt-grey-500"> KPI </span>
            </div>

            <DashboardKpiCard
              :title="$t('dashboard.mainIndicators.monthlySalesTotal')"
              :value="formatMoney(dashboard.mainIndicators.monthlySalesTotal)"
              :subtitle="$t('dashboard.mainIndicators.monthlySalesSubtitle')"
              tone="primary"
            />
          </div>

          <div
            class="rounded-[22px] border border-bt-success-100 bg-gradient-to-br from-bt-white to-bt-success-50 p-bt-spacing-16 shadow-bt-elevation-200"
          >
            <div class="mb-bt-spacing-12 flex items-center justify-between">
              <div
                class="rounded-xl bg-bt-success-100 p-bt-spacing-10 text-bt-success-700"
              >
                <FileSignature :size="18" />
              </div>
              <span class="text-xs font-bt-medium text-bt-grey-500"> KPI </span>
            </div>

            <DashboardKpiCard
              :title="$t('dashboard.mainIndicators.activeContractsCount')"
              :value="
                formatNumber(dashboard.mainIndicators.activeContractsCount)
              "
              :subtitle="$t('dashboard.mainIndicators.activeContractsSubtitle')"
              tone="success"
            />
          </div>

          <div
            class="rounded-[22px] border p-bt-spacing-16 shadow-bt-elevation-200"
            :class="
              dashboard.mainIndicators.criticalInventoryCount > 0
                ? 'border-bt-error-100 bg-gradient-to-br from-bt-white to-bt-error-50'
                : 'border-bt-success-100 bg-gradient-to-br from-bt-white to-bt-success-50'
            "
          >
            <div class="mb-bt-spacing-12 flex items-center justify-between">
              <div
                class="rounded-xl p-bt-spacing-10"
                :class="
                  dashboard.mainIndicators.criticalInventoryCount > 0
                    ? 'bg-bt-error-100 text-bt-error-700'
                    : 'bg-bt-success-100 text-bt-success-700'
                "
              >
                <AlertTriangle :size="18" />
              </div>
              <span class="text-xs font-bt-medium text-bt-grey-500"> KPI </span>
            </div>

            <DashboardKpiCard
              :title="$t('dashboard.mainIndicators.criticalInventoryCount')"
              :value="
                formatNumber(dashboard.mainIndicators.criticalInventoryCount)
              "
              :subtitle="
                $t('dashboard.mainIndicators.criticalInventorySubtitle')
              "
              :tone="
                dashboard.mainIndicators.criticalInventoryCount > 0
                  ? 'danger'
                  : 'success'
              "
            />
          </div>
        </div>

        <div
          class="grid grid-cols-1 gap-bt-spacing-24 xl:grid-cols-[1.05fr_0.95fr]"
        >
          <div class="space-y-bt-spacing-24">
            <div
              class="overflow-hidden rounded-[24px] border border-bt-grey-200 bg-bt-white shadow-bt-elevation-200"
            >
              <div
                class="flex items-center gap-bt-spacing-10 border-b border-bt-grey-200 bg-gradient-to-r from-bt-primary-50 to-bt-white px-bt-spacing-18 py-bt-spacing-14"
              >
                <div
                  class="rounded-xl bg-bt-primary-100 p-bt-spacing-8 text-bt-primary-700"
                >
                  <ShoppingBag :size="18" />
                </div>
                <h3 class="font-bt-semibold text-bt-primary-700">
                  {{ $t("dashboard.monthlySales.title") }}
                </h3>
              </div>

              <div class="p-bt-spacing-18">
                <div
                  v-if="!dashboard.monthlySales.hasRecords"
                  class="rounded-[18px] border border-bt-warning-200 bg-bt-warning-100 p-bt-spacing-16 text-bt-warning-700"
                >
                  {{
                    dashboard.monthlySales.message ||
                    $t("dashboard.monthlySales.empty")
                  }}
                </div>

                <div
                  v-else
                  class="grid grid-cols-1 gap-bt-spacing-16 md:grid-cols-3"
                >
                  <DashboardKpiCard
                    :title="$t('dashboard.monthlySales.totalSalesAmount')"
                    :value="
                      formatMoney(dashboard.monthlySales.totalSalesAmount)
                    "
                    tone="success"
                  />

                  <DashboardKpiCard
                    :title="$t('dashboard.monthlySales.salesOrdersCount')"
                    :value="
                      formatNumber(dashboard.monthlySales.salesOrdersCount)
                    "
                    tone="info"
                  />

                  <DashboardKpiCard
                    :title="$t('dashboard.monthlySales.servicesSoldQuantity')"
                    :value="
                      formatNumber(dashboard.monthlySales.servicesSoldQuantity)
                    "
                    :tone="monthlySalesTone as any"
                  />
                </div>
              </div>
            </div>

            <div
              class="overflow-hidden rounded-[24px] border border-bt-grey-200 bg-bt-white shadow-bt-elevation-200"
            >
              <div
                class="flex items-center gap-bt-spacing-10 border-b border-bt-grey-200 bg-gradient-to-r from-bt-primary-50 to-bt-white px-bt-spacing-18 py-bt-spacing-14"
              >
                <div
                  class="rounded-xl bg-bt-primary-100 p-bt-spacing-8 text-bt-primary-700"
                >
                  <FileSignature :size="18" />
                </div>
                <h3 class="font-bt-semibold text-bt-primary-700">
                  {{ $t("dashboard.contracts.title") }}
                </h3>
              </div>

              <div class="p-bt-spacing-18">
                <div
                  v-if="!dashboard.contracts.hasActiveContracts"
                  class="rounded-[18px] border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16 text-bt-grey-600"
                >
                  {{
                    dashboard.contracts.message ||
                    $t("dashboard.contracts.empty")
                  }}
                </div>

                <div
                  v-else
                  class="grid grid-cols-1 gap-bt-spacing-16 md:grid-cols-3"
                >
                  <DashboardKpiCard
                    :title="$t('dashboard.contracts.activeContractsCount')"
                    :value="
                      formatNumber(dashboard.contracts.activeContractsCount)
                    "
                    tone="success"
                  />

                  <DashboardKpiCard
                    :title="$t('dashboard.contracts.expiringSoonCount')"
                    :value="formatNumber(dashboard.contracts.expiringSoonCount)"
                    tone="warning"
                  />

                  <DashboardKpiCard
                    :title="$t('dashboard.contracts.expiredCount')"
                    :value="formatNumber(dashboard.contracts.expiredCount)"
                    :tone="contractsTone as any"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div
              class="flex h-full min-h-[420px] flex-col overflow-hidden rounded-[24px] border border-bt-grey-200 bg-bt-white shadow-bt-elevation-200"
            >
              <div
                class="flex flex-col gap-bt-spacing-12 border-b border-bt-grey-200 bg-gradient-to-r from-bt-primary-50 to-bt-white px-bt-spacing-18 py-bt-spacing-14 md:flex-row md:items-center md:justify-between"
              >
                <div class="flex items-center gap-bt-spacing-10">
                  <div
                    class="rounded-xl bg-bt-primary-100 p-bt-spacing-8 text-bt-primary-700"
                  >
                    <Activity :size="18" />
                  </div>
                  <h3 class="font-bt-semibold text-bt-primary-700">
                    {{ $t("dashboard.inventory.title") }}
                  </h3>
                </div>

                <div class="w-full md:w-[260px]">
                  <select
                    v-model="selectedCategoryId"
                    class="w-full rounded-xl border border-bt-grey-300 bg-bt-grey-50 px-bt-spacing-12 py-bt-spacing-10 text-sm text-bt-primary-700 transition focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                  >
                    <option value="">
                      {{ $t("dashboard.inventory.filters.allCategories") }}
                    </option>
                    <option
                      v-for="category in inventoryCategoryOptions"
                      :key="category.id"
                      :value="category.id"
                    >
                      {{ category.label }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="flex-1 overflow-auto p-bt-spacing-18">
                <div
                  v-if="!dashboard.criticalInventory.hasAlerts"
                  class="rounded-[18px] border border-bt-success-200 bg-bt-success-100 p-bt-spacing-16 text-bt-success-700"
                >
                  {{
                    dashboard.criticalInventory.message ||
                    $t("dashboard.inventory.noAlerts")
                  }}
                </div>

                <div
                  v-else-if="!filteredCriticalItems.length"
                  class="rounded-[18px] border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16 text-bt-grey-600"
                >
                  {{ $t("dashboard.inventory.noMatches") }}
                </div>

                <div v-else class="space-y-bt-spacing-14">
                  <div
                    v-for="item in filteredCriticalItems"
                    :key="`${item.productId}-${item.warehouseId}`"
                    class="rounded-[20px] border border-bt-grey-200 bg-gradient-to-br from-bt-white to-bt-grey-50 p-bt-spacing-16 transition hover:-translate-y-[1px] hover:shadow-bt-elevation-200"
                  >
                    <div
                      class="flex flex-col gap-bt-spacing-12 xl:flex-row xl:items-start xl:justify-between"
                    >
                      <div>
                        <div
                          class="text-base font-bt-semibold text-bt-primary-700"
                        >
                          {{ item.productName }}
                        </div>

                        <div class="mt-bt-spacing-4 text-sm text-bt-grey-600">
                          {{
                            item.categoryName ||
                            $t("dashboard.inventory.filters.uncategorized")
                          }}
                        </div>

                        <div class="mt-bt-spacing-8 text-sm text-bt-grey-600">
                          {{ item.warehouseCode }} - {{ item.warehouseName }}
                        </div>
                      </div>

                      <div class="flex flex-wrap gap-bt-spacing-8">
                        <span
                          class="inline-flex rounded-full px-bt-spacing-12 py-bt-spacing-6 text-xs font-bt-semibold"
                          :class="
                            getStockSeverityClass(
                              item.currentStock,
                              item.minStock,
                            )
                          "
                        >
                          {{
                            $t("dashboard.inventory.currentStockBadge", {
                              stock: formatNumber(item.currentStock),
                            })
                          }}
                        </span>

                        <span
                          class="inline-flex rounded-full border border-bt-grey-200 bg-bt-white px-bt-spacing-12 py-bt-spacing-6 text-xs font-bt-semibold text-bt-primary-700"
                        >
                          {{
                            $t("dashboard.inventory.minStockBadge", {
                              stock: formatNumber(item.minStock),
                            })
                          }}
                        </span>
                      </div>
                    </div>

                    <div
                      class="mt-bt-spacing-14 grid grid-cols-1 gap-bt-spacing-12 md:grid-cols-3"
                    >
                      <div
                        class="rounded-[16px] border border-bt-grey-200 bg-bt-white p-bt-spacing-12"
                      >
                        <div
                          class="text-xs font-bt-medium uppercase tracking-wide text-bt-grey-500"
                        >
                          {{ $t("dashboard.inventory.fields.branchId") }}
                        </div>
                        <div
                          class="mt-bt-spacing-4 text-sm font-bt-medium text-bt-primary-700"
                        >
                          {{ item.branchId }}
                        </div>
                      </div>

                      <div
                        class="rounded-[16px] border border-bt-grey-200 bg-bt-white p-bt-spacing-12"
                      >
                        <div
                          class="text-xs font-bt-medium uppercase tracking-wide text-bt-grey-500"
                        >
                          {{ $t("dashboard.inventory.fields.maxStock") }}
                        </div>
                        <div
                          class="mt-bt-spacing-4 text-sm font-bt-medium text-bt-primary-700"
                        >
                          {{ formatNumber(item.maxStock) }}
                        </div>
                      </div>

                      <div
                        class="rounded-[16px] border border-bt-grey-200 bg-bt-white p-bt-spacing-12"
                      >
                        <div
                          class="text-xs font-bt-medium uppercase tracking-wide text-bt-grey-500"
                        >
                          {{ $t("dashboard.inventory.fields.minStock") }}
                        </div>
                        <div
                          class="mt-bt-spacing-4 text-sm font-bt-medium text-bt-primary-700"
                        >
                          {{ formatNumber(item.minStock) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>
