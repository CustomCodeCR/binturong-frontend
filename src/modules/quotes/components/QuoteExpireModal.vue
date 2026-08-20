<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { QuotesService } from "@/core/services/quotesService";
import { useValidation } from "@/shared/composables/useValidation";
import BTFieldError from "@/shared/components/ui/BTFieldError.vue";

/**
 * Modal de cierre de una cotización.
 *
 * `reject` exige un motivo (el backend lo recibe en el cuerpo); `expire` no
 * lleva datos, así que solo pide confirmación.
 */
const props = withDefaults(
  defineProps<{
    quoteId: string;
    mode?: "reject" | "expire";
  }>(),
  { mode: "reject" },
);

const { t } = useI18n();
const modalStore = useModalStore();
const { rules, validate, getError, fieldClass, firstError } = useValidation();

const reason = ref("");
const loading = ref(false);

const isReject = computed(() => props.mode === "reject");

const title = computed(() =>
  isReject.value
    ? t("quotes.reject.modal.title")
    : t("quotes.expire.modal.title"),
);

const description = computed(() =>
  isReject.value
    ? t("quotes.reject.modal.description")
    : t("quotes.expire.modal.description"),
);

function closeModal() {
  modalStore.close();
}

function validateForm(): boolean {
  if (!isReject.value) return true;

  const reasonLabel = t("quotes.expire.fields.reason");

  return validate(
    { reason: reason.value },
    {
      reason: [
        rules.required(reasonLabel),
        rules.meaningfulText(reasonLabel, 5),
        rules.maxLength(255, reasonLabel),
      ],
    },
  );
}

async function submit() {
  if (!validateForm()) {
    modalStore.onError?.({ code: 400, message: firstError.value });
    return;
  }

  loading.value = true;

  try {
    if (isReject.value) {
      await QuotesService.reject(props.quoteId, {
        reason: reason.value.trim(),
      });
    } else {
      await QuotesService.expire(props.quoteId);
    }

    modalStore.onSuccess?.({ ok: true });
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message:
        error?.message ??
        (isReject.value
          ? t("quotes.messages.rejectError")
          : t("quotes.messages.expireError")),
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
        {{ title }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ description }}
      </p>
    </div>

    <div v-if="isReject">
      <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
        {{ $t("quotes.expire.fields.reason") }}
      </label>
      <textarea
        v-model="reason"
        rows="4"
        class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        :class="fieldClass('reason')"
      />
      <BTFieldError :message="getError('reason')" />
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
