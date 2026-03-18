<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { useAuthStore } from "@/core/stores/authStore";
import { SalesOrdersService } from "@/core/services/salesOrdersService";

const props = defineProps<{
  salesOrderId: string;
  currentSellerUserId?: string;
  code?: string;
}>();

const { t } = useI18n();
const modalStore = useModalStore();
const authStore = useAuthStore();

const loading = ref(false);
const sellerUserId = ref(authStore.userId ?? props.currentSellerUserId ?? "");

const sellerLabel =
  authStore.employeeFullName || authStore.username || authStore.email || "-";

const sellerBranchLabel = authStore.employeeBranchName || "-";

function closeModal() {
  modalStore.close();
}

async function submit() {
  if (!sellerUserId.value.trim()) {
    modalStore.onError?.({
      code: 400,
      message: t("sales.validation.sellerRequired"),
    });
    return;
  }

  loading.value = true;

  try {
    await SalesOrdersService.confirm(props.salesOrderId, {
      sellerUserId: sellerUserId.value.trim(),
    });

    modalStore.onSuccess?.({
      ok: true,
      salesOrderId: props.salesOrderId,
    });

    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("sales.messages.confirmError"),
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-2xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("sales.confirmModal.title") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{
          $t("sales.confirmModal.description", { code: code || salesOrderId })
        }}
      </p>
    </div>

    <div class="space-y-bt-spacing-24">
      <div
        class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
      >
        <div class="text-sm text-bt-grey-600">
          {{ $t("sales.fields.seller") }}
        </div>

        <div
          class="text-base font-bt-semibold text-bt-primary-700 mt-bt-spacing-4"
        >
          {{ sellerLabel }}
        </div>

        <div class="text-xs text-bt-grey-500 mt-bt-spacing-4">
          {{ sellerBranchLabel }}
        </div>

        <p class="mt-bt-spacing-12 text-sm text-bt-grey-500">
          {{ $t("sales.confirmModal.commissionHint") }}
        </p>
      </div>

      <div class="flex justify-end gap-bt-spacing-12">
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
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
          @click="submit"
        >
          {{ loading ? $t("common.loading") : $t("sales.actions.confirm") }}
        </button>
      </div>
    </div>
  </div>
</template>
