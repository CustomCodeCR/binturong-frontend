<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { useDrawerStore } from "@/core/stores/drawerStore";

import type { DiscountHistoryItem } from "@/core/interfaces/discounts";

const props = defineProps<{
  historyItem: DiscountHistoryItem;
}>();

const { t } = useI18n();
const drawerStore = useDrawerStore();

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
</script>

<template>
  <div class="h-full bg-bt-white p-bt-spacing-24 overflow-y-auto">
    <div class="flex items-start justify-between mb-bt-spacing-24">
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t("discounts.history.drawer.title") }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{
            $t("discounts.history.drawer.description", {
              code: historyItem.salesOrderCode || "-",
            })
          }}
        </p>
      </div>

      <button
        type="button"
        class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
        @click="closeDrawer"
      >
        {{ $t("common.close") }}
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
      <div
        class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
      >
        <div class="text-xs text-bt-grey-500">
          {{ $t("discounts.history.table.salesOrder") }}
        </div>
        <div class="text-bt-primary-700 font-bt-semibold">
          {{ historyItem.salesOrderCode || "-" }}
        </div>
      </div>

      <div
        class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
      >
        <div class="text-xs text-bt-grey-500">
          {{ $t("discounts.history.table.scope") }}
        </div>
        <div class="text-bt-primary-700 font-bt-semibold">
          {{ historyItem.scope }}
        </div>
      </div>

      <div
        class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
      >
        <div class="text-xs text-bt-grey-500">
          {{ $t("discounts.history.table.action") }}
        </div>
        <div class="text-bt-primary-700 font-bt-semibold">
          {{ historyItem.action }}
        </div>
      </div>

      <div
        class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
      >
        <div class="text-xs text-bt-grey-500">
          {{ $t("discounts.history.table.percentage") }}
        </div>
        <div class="text-bt-primary-700 font-bt-semibold">
          {{ historyItem.discountPercentage }}%
        </div>
      </div>

      <div
        class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
      >
        <div class="text-xs text-bt-grey-500">
          {{ $t("discounts.history.table.amount") }}
        </div>
        <div class="text-bt-primary-700 font-bt-semibold">
          {{ formatMoney(historyItem.discountAmount) }}
        </div>
      </div>

      <div
        class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
      >
        <div class="text-xs text-bt-grey-500">
          {{ $t("discounts.history.table.user") }}
        </div>
        <div class="text-bt-primary-700 font-bt-semibold">
          {{ historyItem.userName || "-" }}
        </div>
      </div>

      <div
        class="md:col-span-2 p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
      >
        <div class="text-xs text-bt-grey-500">
          {{ $t("discounts.history.table.reason") }}
        </div>
        <div class="text-bt-primary-700 font-bt-semibold whitespace-pre-wrap">
          {{ historyItem.reason || historyItem.rejectionReason || "-" }}
        </div>
      </div>

      <div
        class="md:col-span-2 p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
      >
        <div class="text-xs text-bt-grey-500">
          {{ $t("discounts.history.table.eventDate") }}
        </div>
        <div class="text-bt-primary-700 font-bt-semibold">
          {{ formatDateTime(historyItem.eventDateUtc) }}
        </div>
      </div>
    </div>
  </div>
</template>
