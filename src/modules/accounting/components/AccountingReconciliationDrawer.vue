<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { AccountingService } from "@/core/services/accountingService";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

import type { AccountingReconciliationSummary } from "@/core/interfaces/accounting";

const { t } = useI18n();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const loading = ref(false);
const summary = ref<AccountingReconciliationSummary | null>(null);

function closeDrawer() {
  drawerStore.closeDrawer();
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

async function loadSummary() {
  loading.value = true;

  try {
    summary.value = await AccountingService.getReconciliationSummary();
  } catch {
    summary.value = null;

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("accounting.messages.reconciliationLoadError"),
    });
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadSummary();
});
</script>

<template>
  <div class="h-full overflow-y-auto bg-bt-white p-bt-spacing-24">
    <div
      class="mb-bt-spacing-24 flex items-start justify-between gap-bt-spacing-16"
    >
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t("accounting.reconciliation.drawerTitle") }}
        </h2>
        <p class="mt-bt-spacing-8 text-bt-grey-600">
          {{ $t("accounting.reconciliation.drawerDescription") }}
        </p>
      </div>

      <button
        type="button"
        class="rounded-m bg-bt-grey-200 px-bt-spacing-12 py-bt-spacing-8 text-bt-primary-700 hover:bg-bt-grey-300"
        @click="closeDrawer"
      >
        {{ $t("common.close") }}
      </button>
    </div>

    <div v-if="loading" class="text-bt-grey-500">
      {{ $t("common.loading") }}
    </div>

    <template v-else-if="summary">
      <div
        class="mb-bt-spacing-24 grid grid-cols-1 gap-bt-spacing-16 md:grid-cols-2"
      >
        <div
          class="rounded-m border border-bt-success-200 bg-bt-success-100 p-bt-spacing-16"
        >
          <div class="text-sm text-bt-success-700">
            {{ $t("accounting.reconciliation.fields.matchedCount") }}
          </div>
          <div
            class="mt-bt-spacing-8 text-2xl font-bt-bold text-bt-success-700"
          >
            {{ summary.matchedCount }}
          </div>
        </div>

        <div
          class="rounded-m border border-bt-warning-200 bg-bt-warning-100 p-bt-spacing-16"
        >
          <div class="text-sm text-bt-warning-700">
            {{ $t("accounting.reconciliation.fields.unmatchedCount") }}
          </div>
          <div
            class="mt-bt-spacing-8 text-2xl font-bt-bold text-bt-warning-700"
          >
            {{ summary.unmatchedCount }}
          </div>
        </div>
      </div>

      <div class="overflow-hidden rounded-m border border-bt-grey-200">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("accounting.reconciliation.table.entryType") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("accounting.reconciliation.table.detail") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("accounting.reconciliation.table.date") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("accounting.reconciliation.table.invoiceNumber") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("accounting.reconciliation.table.amount") }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="item in summary.differences"
              :key="item.accountingEntryId"
              class="border-t border-bt-grey-200"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ item.entryType }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ item.detail }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ formatDateTime(item.entryDateUtc) }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ item.invoiceNumber || "-" }}
              </td>
              <td
                class="px-bt-spacing-16 py-bt-spacing-12 font-bt-semibold text-bt-grey-700"
              >
                {{ formatMoney(item.amount) }}
              </td>
            </tr>

            <tr v-if="!summary.differences.length">
              <td
                colspan="5"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("accounting.reconciliation.empty") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
