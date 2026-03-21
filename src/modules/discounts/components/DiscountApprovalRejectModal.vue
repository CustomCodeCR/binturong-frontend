<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

import { DiscountsService } from "@/core/services/discountsService";
import { useModalStore } from "@/core/stores/modalStore";
import { useToastStore } from "@/core/stores/toastStore";

const props = defineProps<{
  approvalRequestId: string;
}>();

const { t } = useI18n();
const modalStore = useModalStore();
const toastStore = useToastStore();

const saving = ref(false);
const rejectionReason = ref("");

function closeModal() {
  modalStore.close();
}

async function submit() {
  const normalizedReason = rejectionReason.value.trim();

  if (!normalizedReason) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("discounts.approvals.validation.rejectionReasonRequired"),
    });
    return;
  }

  saving.value = true;

  try {
    await DiscountsService.rejectApprovalRequest(props.approvalRequestId, {
      rejectionReason: normalizedReason,
    });

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
    class="w-full max-w-xl bg-bt-white rounded-l shadow-bt-elevation-400 border border-bt-grey-200"
  >
    <div
      class="px-bt-spacing-24 py-bt-spacing-16 border-b border-bt-grey-200 flex items-start justify-between"
    >
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t("discounts.approvals.rejectModal.title") }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{ $t("discounts.approvals.rejectModal.description") }}
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

    <div class="p-bt-spacing-24">
      <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
        {{ $t("discounts.approvals.fields.rejectionReason") }}
      </label>

      <textarea
        v-model="rejectionReason"
        rows="5"
        class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
      />
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
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-error-500 text-bt-white hover:bg-bt-error-700 disabled:bg-bt-disabled"
        @click="submit"
      >
        {{ saving ? $t("common.loading") : $t("discounts.actions.reject") }}
      </button>
    </div>
  </div>
</template>
