<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { InvoicesService } from "@/core/services/invoicesService";

const props = defineProps<{
  invoiceId: string;
  code?: string;
  currentTaxStatus?: string;
}>();

const { t } = useI18n();
const modalStore = useModalStore();

const loading = ref(false);
const mode = ref("normal");

function closeModal() {
  modalStore.close();
}

async function submit() {
  loading.value = true;

  try {
    const result = await InvoicesService.emit(props.invoiceId, {
      mode: mode.value,
    });

    modalStore.onSuccess?.({
      ok: true,
      invoiceId: props.invoiceId,
      result,
    });

    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("billing.messages.emitError"),
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
        {{ $t("billing.emitModal.title") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("billing.emitModal.description", { code: code || invoiceId }) }}
      </p>
    </div>

    <div class="space-y-bt-spacing-24">
      <div
        class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
      >
        <div class="text-sm text-bt-grey-500">
          {{ $t("billing.emitModal.currentStatus") }}
        </div>
        <div class="mt-bt-spacing-8 font-bt-semibold text-bt-primary-700">
          {{ currentTaxStatus || "-" }}
        </div>
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("billing.emitModal.mode") }}
        </label>

        <select
          v-model="mode"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="normal">
            {{ $t("billing.emitModal.modes.normal") }}
          </option>
          <option value="contingency">
            {{ $t("billing.emitModal.modes.contingency") }}
          </option>
        </select>

        <p class="mt-bt-spacing-8 text-sm text-bt-grey-500">
          {{ $t("billing.emitModal.helpText") }}
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
          {{ loading ? $t("common.loading") : $t("billing.actions.emit") }}
        </button>
      </div>
    </div>
  </div>
</template>
