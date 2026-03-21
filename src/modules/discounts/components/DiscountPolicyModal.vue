<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { DiscountsService } from "@/core/services/discountsService";
import { useModalStore } from "@/core/stores/modalStore";
import { useToastStore } from "@/core/stores/toastStore";

import type {
  DiscountPolicy,
  CreateDiscountPolicyRequest,
  UpdateDiscountPolicyRequest,
} from "@/core/interfaces/discounts";

const props = defineProps<{
  policy?: DiscountPolicy | null;
}>();

const { t } = useI18n();
const modalStore = useModalStore();
const toastStore = useToastStore();

const saving = ref(false);

const name = ref("");
const maxDiscountPercentage = ref(0);
const requiresApprovalAboveLimit = ref(true);
const isActive = ref(true);

const isEdit = computed(() => Boolean(props.policy?.policyId));

watch(
  () => props.policy,
  (policy) => {
    name.value = policy?.name ?? "";
    maxDiscountPercentage.value = Number(policy?.maxDiscountPercentage ?? 0);
    requiresApprovalAboveLimit.value =
      policy?.requiresApprovalAboveLimit ?? true;
    isActive.value = policy?.isActive ?? true;
  },
  { immediate: true },
);

function closeModal() {
  modalStore.close();
}

async function submit() {
  const normalizedName = name.value.trim();
  const normalizedMaxDiscountPercentage = Number(maxDiscountPercentage.value);

  if (!normalizedName) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("discounts.policies.validation.nameRequired"),
    });
    return;
  }

  if (
    Number.isNaN(normalizedMaxDiscountPercentage) ||
    normalizedMaxDiscountPercentage < 0 ||
    normalizedMaxDiscountPercentage > 100
  ) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("discounts.policies.validation.maxDiscountInvalid"),
    });
    return;
  }

  saving.value = true;

  try {
    if (isEdit.value && props.policy?.policyId) {
      const payload: UpdateDiscountPolicyRequest = {
        name: normalizedName,
        maxDiscountPercentage: normalizedMaxDiscountPercentage,
        requiresApprovalAboveLimit: requiresApprovalAboveLimit.value,
        isActive: isActive.value,
      };

      await DiscountsService.updatePolicy(props.policy.policyId, payload);
    } else {
      const payload: CreateDiscountPolicyRequest = {
        name: normalizedName,
        maxDiscountPercentage: normalizedMaxDiscountPercentage,
        requiresApprovalAboveLimit: requiresApprovalAboveLimit.value,
        isActive: isActive.value,
      };

      await DiscountsService.createPolicy(payload);
    }

    modalStore.onSuccess?.();
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.(error);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div
    class="w-full max-w-2xl bg-bt-white rounded-l shadow-bt-elevation-400 border border-bt-grey-200"
  >
    <div
      class="px-bt-spacing-24 py-bt-spacing-16 border-b border-bt-grey-200 flex items-start justify-between"
    >
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{
            isEdit
              ? $t("discounts.policies.modal.editTitle")
              : $t("discounts.policies.modal.createTitle")
          }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{
            isEdit
              ? $t("discounts.policies.modal.editDescription")
              : $t("discounts.policies.modal.createDescription")
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

    <div class="p-bt-spacing-24 space-y-bt-spacing-16">
      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("discounts.policies.fields.name") }}
        </label>
        <input
          v-model="name"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("discounts.policies.fields.maxDiscountPercentage") }}
        </label>
        <input
          v-model.number="maxDiscountPercentage"
          type="number"
          min="0"
          max="100"
          step="0.01"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <label class="flex items-center gap-bt-spacing-12">
        <input
          v-model="requiresApprovalAboveLimit"
          type="checkbox"
          class="w-4 h-4"
        />
        <span class="text-bt-primary-700">
          {{ $t("discounts.policies.fields.requiresApprovalAboveLimit") }}
        </span>
      </label>

      <label class="flex items-center gap-bt-spacing-12">
        <input v-model="isActive" type="checkbox" class="w-4 h-4" />
        <span class="text-bt-primary-700">
          {{ $t("discounts.policies.fields.isActive") }}
        </span>
      </label>
    </div>

    <div
      class="px-bt-spacing-24 py-bt-spacing-16 border-t border-bt-grey-200 flex justify-end gap-bt-spacing-12"
    >
      <button
        type="button"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
        @click="closeModal"
      >
        {{ $t("common.cancel") }}
      </button>

      <button
        type="button"
        :disabled="saving"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
        @click="submit"
      >
        {{ saving ? $t("common.loading") : $t("common.save") }}
      </button>
    </div>
  </div>
</template>
