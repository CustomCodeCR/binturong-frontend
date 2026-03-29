<script setup lang="ts">
import { computed } from "vue";
import { FileText, Clock, BadgePercent } from "lucide-vue-next";
import { useI18n } from "vue-i18n";

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

const { t } = useI18n();

const activePolicies = computed(() =>
  props.policies.filter((item) => item.isActive).length,
);

const pendingApprovals = computed(() =>
  props.approvals.filter(
    (item) => String(item.status).toLowerCase() === "pending",
  ).length,
);

const totalDiscountAmount = computed(() =>
  props.history.reduce((acc, item) => acc + Number(item.discountAmount ?? 0), 0),
);

function formatMoney(value: number): string {
  return value.toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-bt-spacing-16 mb-bt-spacing-24 shrink-0">

    <!-- Políticas activas -->
    <div class="rounded-l border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100">
      <div class="flex items-center gap-bt-spacing-12">
        <div class="w-12 h-12 rounded-full bg-bt-primary-50 flex items-center justify-center text-bt-primary-600">
          <FileText :size="22" />
        </div>
        <div>
          <div class="text-sm text-bt-grey-500">
            {{ t("discounts.stats.activePolicies") }}
          </div>
          <div class="text-2xl font-bt-bold text-bt-primary-700">
            {{ activePolicies }}
          </div>
        </div>
      </div>
    </div>

    <!-- Solicitudes pendientes -->
    <div class="rounded-l border border-bt-warning-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100">
      <div class="flex items-center gap-bt-spacing-12">
        <div class="w-12 h-12 rounded-full bg-bt-warning-100 flex items-center justify-center text-bt-warning-700">
          <Clock :size="22" />
        </div>
        <div>
          <div class="text-sm text-bt-grey-500">
            {{ t("discounts.stats.pendingApprovals") }}
          </div>
          <div class="text-2xl font-bt-bold text-bt-warning-700">
            {{ pendingApprovals }}
          </div>
        </div>
      </div>
    </div>

    <!-- Monto histórico descontado -->
    <div class="rounded-l border border-bt-accent-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100">
      <div class="flex items-center gap-bt-spacing-12">
        <div class="w-12 h-12 rounded-full bg-bt-accent-50 flex items-center justify-center text-bt-accent-600">
          <BadgePercent :size="22" />
        </div>
        <div>
          <div class="text-sm text-bt-grey-500">
            {{ t("discounts.stats.totalDiscounted") }}
          </div>
          <div class="text-2xl font-bt-bold text-bt-accent-700">
            {{ formatMoney(totalDiscountAmount) }}
          </div>
        </div>
      </div>
    </div>

  </div>
</template>