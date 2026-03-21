<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { useToastStore } from "@/core/stores/toastStore";

import { DiscountsService } from "@/core/services/discountsService";
import { SelectService } from "@/core/services/selectService";

import type { SelectOption } from "@/core/interfaces/select";
import type { DiscountPolicy } from "@/core/interfaces/discounts";

const props = defineProps<{
  salesOrderId: string;
  salesOrderDetailId?: string;
  scope: "Global" | "Line";
  currentDiscountPerc?: number;
  currentDiscountReason?: string | null;
}>();

const { t } = useI18n();
const modalStore = useModalStore();
const toastStore = useToastStore();

const loading = ref(false);
const loadingPolicies = ref(false);

const discountPerc = ref(Number(props.currentDiscountPerc ?? 0));
const reason = ref(String(props.currentDiscountReason ?? ""));
const policyId = ref("");
const requestApproval = ref(true);

const policies = ref<SelectOption[]>([]);
const policiesCatalog = ref<DiscountPolicy[]>([]);

const selectedPolicy = computed<DiscountPolicy | null>(() => {
  return (
    policiesCatalog.value.find(
      (item) => item.policyId === policyId.value || item.id === policyId.value,
    ) ?? null
  );
});

const requiresApproval = computed(() => {
  if (!selectedPolicy.value) {
    return false;
  }

  return (
    Number(discountPerc.value || 0) >
      Number(selectedPolicy.value.maxDiscountPercentage || 0) &&
    Boolean(selectedPolicy.value.requiresApprovalAboveLimit)
  );
});

function closeModal() {
  modalStore.close();
}

async function loadPolicies() {
  loadingPolicies.value = true;

  try {
    const [policiesResponse, fullPoliciesResponse] = await Promise.all([
      SelectService.selectDiscountPolicies({ onlyActive: true }),
      DiscountsService.browsePolicies({
        page: 1,
        pageSize: 500,
        search: "",
      }),
    ]);

    policies.value = policiesResponse ?? [];
    policiesCatalog.value = Array.isArray(fullPoliciesResponse)
      ? fullPoliciesResponse
      : [];
  } finally {
    loadingPolicies.value = false;
  }
}

async function submit() {
  if (Number(discountPerc.value) <= 0) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("sales.discounts.validation.discountRequired"),
    });
    return;
  }

  if (!reason.value.trim()) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message:
        props.scope === "Global"
          ? t("sales.discounts.validation.globalReasonRequired")
          : t("sales.discounts.validation.lineReasonRequired"),
    });
    return;
  }

  if (!policyId.value.trim()) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("sales.discounts.validation.policyRequired"),
    });
    return;
  }

  loading.value = true;

  try {
    if (props.scope === "Global") {
      if (requiresApproval.value && requestApproval.value) {
        await DiscountsService.requestGlobalApproval({
          salesOrderId: props.salesOrderId,
          discountPerc: Number(discountPerc.value),
          reason: reason.value.trim(),
        });
      } else {
        await DiscountsService.applyGlobal({
          salesOrderId: props.salesOrderId,
          discountPerc: Number(discountPerc.value),
          reason: reason.value.trim(),
          policyId: policyId.value,
        });
      }
    } else {
      if (!props.salesOrderDetailId) {
        throw new Error("salesOrderDetailId is required for line discount");
      }

      if (requiresApproval.value && requestApproval.value) {
        await DiscountsService.requestLineApproval({
          salesOrderId: props.salesOrderId,
          salesOrderDetailId: props.salesOrderDetailId,
          discountPerc: Number(discountPerc.value),
          reason: reason.value.trim(),
        });
      } else {
        await DiscountsService.applyLine({
          salesOrderId: props.salesOrderId,
          salesOrderDetailId: props.salesOrderDetailId,
          discountPerc: Number(discountPerc.value),
          reason: reason.value.trim(),
          policyId: policyId.value,
        });
      }
    }

    modalStore.onSuccess?.();
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.(error);

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message:
        error?.message ??
        t("sales.discounts.sales.messages.discountApplyError"),
    });
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadPolicies();
});
</script>

<template>
  <div class="w-full max-w-2xl bg-bt-white rounded-l p-bt-spacing-24">
    <div class="flex items-start justify-between mb-bt-spacing-24">
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{
            scope === "Global"
              ? $t("sales.discounts.modal.globalTitle")
              : $t("sales.discounts.modal.lineTitle")
          }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{
            scope === "Global"
              ? $t("sales.discounts.modal.globalDescription")
              : $t("sales.discounts.modal.lineDescription")
          }}
        </p>
      </div>

      <button
        type="button"
        class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
        @click="closeModal"
      >
        {{ $t("common.close") }}
      </button>
    </div>

    <div v-if="loadingPolicies" class="text-bt-grey-500">
      {{ $t("common.loading") }}
    </div>

    <div v-else class="space-y-bt-spacing-16">
      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("sales.discounts.fields.policy") }}
        </label>
        <select
          v-model="policyId"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-warning-500"
        >
          <option value="">
            {{ $t("sales.discounts.placeholders.selectPolicy") }}
          </option>
          <option
            v-for="policy in policies"
            :key="policy.id"
            :value="policy.id"
          >
            {{ policy.label }}
          </option>
        </select>
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("sales.discounts.fields.discountPerc") }}
        </label>
        <input
          v-model.number="discountPerc"
          type="number"
          min="0"
          max="100"
          step="0.01"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-warning-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{
            scope === "Global"
              ? $t("sales.discounts.fields.globalDiscountReason")
              : $t("sales.discounts.fields.discountReason")
          }}
        </label>
        <textarea
          v-model="reason"
          rows="3"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-warning-500"
        />
      </div>

      <div class="flex flex-wrap items-center gap-bt-spacing-12">
        <label
          class="inline-flex items-center gap-bt-spacing-8 text-sm text-bt-grey-700"
        >
          <input v-model="requestApproval" type="checkbox" />
          {{ $t("sales.discounts.fields.requestApprovalIfNeeded") }}
        </label>

        <span
          v-if="requiresApproval"
          class="inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold bg-bt-warning-100 text-bt-warning-700"
        >
          {{ $t("sales.discounts.labels.requiresApproval") }}
        </span>
      </div>

      <div class="flex justify-end gap-bt-spacing-12 pt-bt-spacing-8">
        <button
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
          @click="closeModal"
        >
          {{ $t("common.cancel") }}
        </button>

        <button
          type="button"
          :disabled="loading"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-warning-500 text-bt-white hover:bg-bt-warning-700 disabled:bg-bt-disabled"
          @click="submit"
        >
          {{
            loading ? $t("common.loading") : $t("sales.discounts.actions.apply")
          }}
        </button>
      </div>
    </div>
  </div>
</template>
