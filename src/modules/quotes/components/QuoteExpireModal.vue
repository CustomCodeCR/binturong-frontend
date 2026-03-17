<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { QuotesService } from "@/core/services/quotesService";

const props = defineProps<{
  quoteId: string;
}>();

const { t } = useI18n();
const modalStore = useModalStore();

const reason = ref("");
const loading = ref(false);

function closeModal() {
  modalStore.close();
}

async function submit() {
  if (!reason.value.trim()) {
    modalStore.onError?.({
      code: 400,
      message: t("quotes.expire.validation.required"),
    });
    return;
  }

  loading.value = true;

  try {
    await QuotesService.reject(props.quoteId, {
      reason: reason.value.trim(),
    });

    modalStore.onSuccess?.({ ok: true });
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("quotes.messages.rejectError"),
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
        {{ $t("quotes.expire.modal.title") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("quotes.expire.modal.description") }}
      </p>
    </div>

    <div>
      <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
        {{ $t("quotes.expire.fields.reason") }}
      </label>
      <textarea
        v-model="reason"
        rows="4"
        class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
      />
    </div>

    <div class="mt-bt-spacing-24 flex justify-end gap-bt-spacing-12">
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
          loading ? $t("common.loading") : $t("quotes.expire.actions.confirm")
        }}
      </button>
    </div>
  </div>
</template>
