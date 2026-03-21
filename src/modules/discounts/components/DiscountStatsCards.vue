<script setup lang="ts">
import { computed } from "vue";

import type {
  DiscountPolicy,
  DiscountApprovalRequest,
  DiscountHistoryItem,
} from "@/core/interfaces/discounts";

const props = defineProps<{
  policies: DiscountPolicy[];
  approvals: DiscountApprovalRequest[];
  history: DiscountHistoryItem[];
}>();

const activePolicies = computed(() => {
  return props.policies.filter((item) => item.isActive).length;
});

const pendingApprovals = computed(() => {
  return props.approvals.filter(
    (item) => String(item.status).toLowerCase() === "pending",
  ).length;
});

const totalDiscountAmount = computed(() => {
  return props.history.reduce((acc, item) => {
    return acc + Number(item.discountAmount ?? 0);
  }, 0);
});

function formatMoney(value: number): string {
  return value.toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
</script>

<template>
  <div
    class="grid grid-cols-1 md:grid-cols-3 gap-bt-spacing-16 mb-bt-spacing-24"
  >
    <div
      class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
    >
      <div class="text-xs text-bt-grey-500">Políticas activas</div>
      <div class="mt-bt-spacing-8 text-2xl font-bt-bold text-bt-primary-700">
        {{ activePolicies }}
      </div>
    </div>

    <div
      class="rounded-m border border-bt-grey-200 bg-bt-warning-100 p-bt-spacing-16"
    >
      <div class="text-xs text-bt-warning-700">Solicitudes pendientes</div>
      <div class="mt-bt-spacing-8 text-2xl font-bt-bold text-bt-warning-700">
        {{ pendingApprovals }}
      </div>
    </div>

    <div
      class="rounded-m border border-bt-grey-200 bg-bt-primary-700 p-bt-spacing-16"
    >
      <div class="text-xs text-bt-grey-200">Monto histórico descontado</div>
      <div class="mt-bt-spacing-8 text-2xl font-bt-bold text-bt-accent-300">
        {{ formatMoney(totalDiscountAmount) }}
      </div>
    </div>
  </div>
</template>
