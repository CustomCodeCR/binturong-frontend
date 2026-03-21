<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { useDrawerStore } from "@/core/stores/drawerStore";

import type { DiscountPolicy } from "@/core/interfaces/discounts";

const props = defineProps<{
  policy: DiscountPolicy;
}>();

const { t } = useI18n();
const drawerStore = useDrawerStore();

function formatPercent(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return `${Number(value).toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
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
          {{ $t("discounts.policies.drawer.title") }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{
            $t("discounts.policies.drawer.description", {
              name: policy.name || "-",
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
          {{ $t("discounts.policies.table.name") }}
        </div>
        <div class="text-bt-primary-700 font-bt-semibold">
          {{ policy.name || "-" }}
        </div>
      </div>

      <div
        class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
      >
        <div class="text-xs text-bt-grey-500">
          {{ $t("discounts.policies.table.maxDiscount") }}
        </div>
        <div class="text-bt-primary-700 font-bt-semibold">
          {{ formatPercent(policy.maxDiscountPercentage) }}
        </div>
      </div>

      <div
        class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
      >
        <div class="text-xs text-bt-grey-500">
          {{ $t("discounts.policies.table.requiresApproval") }}
        </div>
        <div class="text-bt-primary-700 font-bt-semibold">
          {{
            policy.requiresApprovalAboveLimit
              ? $t("common.yes")
              : $t("common.no")
          }}
        </div>
      </div>

      <div
        class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
      >
        <div class="text-xs text-bt-grey-500">
          {{ $t("discounts.policies.table.status") }}
        </div>
        <div class="text-bt-primary-700 font-bt-semibold">
          {{ policy.isActive ? $t("common.active") : $t("common.inactive") }}
        </div>
      </div>

      <div
        v-if="'policyId' in policy"
        class="md:col-span-2 p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
      >
        <div class="text-xs text-bt-grey-500">ID</div>
        <div class="text-bt-primary-700 font-bt-semibold break-all">
          {{ policy.policyId || "-" }}
        </div>
      </div>
    </div>
  </div>
</template>
