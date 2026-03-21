<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { ReportsService } from "@/core/services/reportsService";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

import type { ClientReport } from "@/core/interfaces/reports";

const props = defineProps<{
  clientId: string;
}>();

const { t } = useI18n();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const loading = ref(false);
const report = ref<ClientReport | null>(null);

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

function closeDrawer() {
  drawerStore.closeDrawer();
}

async function loadReport() {
  loading.value = true;

  try {
    report.value = await ReportsService.getClientHistory(props.clientId);
  } catch {
    report.value = null;

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("reports.client.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

async function exportExcel() {
  try {
    const blob = await ReportsService.exportClientHistoryExcel(props.clientId);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `client-report-${props.clientId}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("reports.client.messages.exportError"),
    });
  }
}

onMounted(async () => {
  await loadReport();
});

watch(
  () => props.clientId,
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
          {{ $t("reports.client.drawer.title") }}
        </h2>
        <p class="mt-bt-spacing-8 text-bt-grey-600">
          {{ report?.clientName || "-" }}
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
        v-if="!report.hasData"
        class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16 text-bt-grey-600"
      >
        {{ report.message || $t("reports.client.empty") }}
      </div>

      <template v-else>
        <div class="mb-bt-spacing-24">
          <h3
            class="mb-bt-spacing-12 text-lg font-bt-semibold text-bt-primary-700"
          >
            {{ $t("reports.client.sections.purchases") }}
          </h3>

          <div class="overflow-hidden rounded-m border border-bt-grey-200">
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-bt-primary-50 text-left">
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("reports.client.table.code") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("reports.client.table.date") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("reports.client.table.status") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("reports.client.table.total") }}
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="item in report.purchases"
                  :key="item.salesOrderId"
                  class="border-t border-bt-grey-200"
                >
                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ item.code }}
                  </td>
                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ formatDateTime(item.orderDate) }}
                  </td>
                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ item.status }}
                  </td>
                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ formatMoney(item.total) }}
                  </td>
                </tr>

                <tr v-if="!report.purchases.length">
                  <td
                    colspan="4"
                    class="px-bt-spacing-16 py-bt-spacing-20 text-center text-bt-grey-500"
                  >
                    {{ $t("reports.client.noPurchases") }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="mb-bt-spacing-24">
          <h3
            class="mb-bt-spacing-12 text-lg font-bt-semibold text-bt-primary-700"
          >
            {{ $t("reports.client.sections.services") }}
          </h3>

          <div class="overflow-hidden rounded-m border border-bt-grey-200">
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-bt-primary-50 text-left">
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("reports.client.table.code") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("reports.client.table.date") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("reports.client.table.status") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("reports.client.table.contract") }}
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="item in report.services"
                  :key="item.serviceOrderId"
                  class="border-t border-bt-grey-200"
                >
                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ item.code }}
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
                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ item.contractCode || "-" }}
                  </td>
                </tr>

                <tr v-if="!report.services.length">
                  <td
                    colspan="4"
                    class="px-bt-spacing-16 py-bt-spacing-20 text-center text-bt-grey-500"
                  >
                    {{ $t("reports.client.noServices") }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3
            class="mb-bt-spacing-12 text-lg font-bt-semibold text-bt-primary-700"
          >
            {{ $t("reports.client.sections.invoices") }}
          </h3>

          <div class="overflow-hidden rounded-m border border-bt-grey-200">
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-bt-primary-50 text-left">
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("reports.client.table.consecutive") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("reports.client.table.date") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("reports.client.table.total") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("reports.client.table.paidAmount") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("reports.client.table.pendingAmount") }}
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="item in report.invoices"
                  :key="item.invoiceId"
                  class="border-t border-bt-grey-200"
                >
                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ item.consecutive || "-" }}
                  </td>
                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ formatDateTime(item.issueDate) }}
                  </td>
                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ formatMoney(item.total) }}
                  </td>
                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ formatMoney(item.paidAmount) }}
                  </td>
                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ formatMoney(item.pendingAmount) }}
                  </td>
                </tr>

                <tr v-if="!report.invoices.length">
                  <td
                    colspan="5"
                    class="px-bt-spacing-16 py-bt-spacing-20 text-center text-bt-grey-500"
                  >
                    {{ $t("reports.client.noInvoices") }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>
