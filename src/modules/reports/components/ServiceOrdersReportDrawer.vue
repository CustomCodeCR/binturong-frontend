<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { ReportsService } from "@/core/services/reportsService";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

import type { ServiceOrdersReport } from "@/core/interfaces/reports";

const props = defineProps<{
  fromUtc: string;
  toUtc: string;
  employeeId?: string | null;
}>();

const { t } = useI18n();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const loading = ref(false);
const report = ref<ServiceOrdersReport | null>(null);

function formatDateTime(value?: string | null): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("es-CR");
}

function closeDrawer() {
  drawerStore.closeDrawer();
}

async function loadReport() {
  loading.value = true;

  try {
    report.value = await ReportsService.getServiceOrders(
      props.fromUtc,
      props.toUtc,
      props.employeeId ?? null,
    );
  } catch {
    report.value = null;

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("reports.serviceOrders.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

async function exportExcel() {
  try {
    const blob = await ReportsService.exportServiceOrdersExcel(
      props.fromUtc,
      props.toUtc,
      props.employeeId ?? null,
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "service-orders-report.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("reports.serviceOrders.messages.exportError"),
    });
  }
}

onMounted(async () => {
  await loadReport();
});

watch(
  () => [props.fromUtc, props.toUtc, props.employeeId],
  async () => {
    await loadReport();
  },
);
</script>

<template>
  <div class="h-full overflow-y-auto bg-bt-white p-bt-spacing-24">
    <div
      class="mb-bt-spacing-24 flex items-start justify-between gap-bt-spacing-16"
    >
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t("reports.serviceOrders.drawer.title") }}
        </h2>
        <p class="mt-bt-spacing-8 text-bt-grey-600">
          {{ formatDateTime(props.fromUtc) }} -
          {{ formatDateTime(props.toUtc) }}
        </p>
      </div>

      <div class="flex gap-bt-spacing-8">
        <button
          type="button"
          class="rounded-m bg-bt-success-500 px-bt-spacing-16 py-bt-spacing-12 text-bt-white hover:bg-bt-success-700"
          @click="exportExcel"
        >
          {{ $t("reports.actions.exportExcel") }}
        </button>

        <button
          type="button"
          class="rounded-m bg-bt-grey-200 px-bt-spacing-12 py-bt-spacing-8 text-bt-primary-700 hover:bg-bt-grey-300"
          @click="closeDrawer"
        >
          {{ $t("common.close") }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-bt-grey-500">
      {{ $t("common.loading") }}
    </div>

    <template v-else-if="report">
      <div
        class="mb-bt-spacing-24 grid grid-cols-1 gap-bt-spacing-16 md:grid-cols-3"
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
            {{ report.completedCount }}
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
            {{ report.pendingCount }}
          </div>
        </div>

        <div
          class="rounded-m border border-bt-error-200 bg-bt-error-100 p-bt-spacing-16"
        >
          <div class="text-sm text-bt-error-700">
            {{ $t("reports.serviceOrders.summary.canceled") }}
          </div>
          <div class="mt-bt-spacing-8 text-2xl font-bt-bold text-bt-error-700">
            {{ report.canceledCount }}
          </div>
        </div>
      </div>

      <div
        v-if="!report.hasData"
        class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16 text-bt-grey-600"
      >
        {{ report.message || $t("reports.serviceOrders.empty") }}
      </div>

      <div v-else class="overflow-hidden rounded-m border border-bt-grey-200">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("reports.serviceOrders.table.code") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("reports.serviceOrders.table.client") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("reports.serviceOrders.table.date") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("reports.serviceOrders.table.status") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("reports.serviceOrders.table.technicians") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("reports.serviceOrders.table.services") }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="item in report.items"
              :key="item.serviceOrderId"
              class="border-t border-bt-grey-200"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ item.code }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                <div>{{ item.clientName }}</div>
                <div class="text-xs text-bt-grey-500">
                  {{ item.serviceAddress }}
                </div>
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ formatDateTime(item.scheduledDate) }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ item.status }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ item.technicians.join(", ") || "-" }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ item.services.join(", ") || "-" }}
              </td>
            </tr>

            <tr v-if="!report.items.length">
              <td
                colspan="6"
                class="px-bt-spacing-16 py-bt-spacing-20 text-center text-bt-grey-500"
              >
                {{ $t("reports.serviceOrders.empty") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
