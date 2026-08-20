<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { InvoicesService } from "@/core/services/invoicesService";
import { useValidation } from "@/shared/composables/useValidation";
import BTFieldError from "@/shared/components/ui/BTFieldError.vue";

import type { Invoice } from "@/core/interfaces/invoices";

/**
 * Edición del encabezado de una factura.
 *
 * El backend (`UpdateInvoiceFromApiCommand`) solo acepta estos seis campos: las
 * líneas y los totales no se editan desde aquí, se recalculan en el servidor.
 */

const props = defineProps<{
  invoiceId: string;
  code?: string;
}>();

const { t } = useI18n();
const modalStore = useModalStore();
const { rules, validate, getError, fieldClass, firstError } = useValidation();

const loading = ref(false);
const saving = ref(false);

const invoice = ref<Invoice | null>(null);

const issueDate = ref("");
const documentType = ref("FE");
const currency = ref("CRC");
const exchangeRate = ref<number | null>(1);
const notes = ref("");
const internalStatus = ref("Draft");

const title = computed(() => props.code || props.invoiceId);

function closeModal() {
  modalStore.close();
}

/** El backend devuelve ISO y el input `type="date"` solo entiende YYYY-MM-DD. */
function toDateInput(value?: string | null): string {
  if (!value) return "";
  return String(value).slice(0, 10);
}

async function loadInvoice() {
  loading.value = true;

  try {
    const response = await InvoicesService.readById(props.invoiceId);
    invoice.value = response;

    issueDate.value = toDateInput(response.issueDate);
    documentType.value = response.documentType || "FE";
    currency.value = response.currency || "CRC";
    exchangeRate.value = Number(response.exchangeRate ?? 1);
    notes.value = response.notes ?? "";
    internalStatus.value = response.internalStatus || "Draft";
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("billing.messages.loadError"),
    });
    modalStore.close();
  } finally {
    loading.value = false;
  }
}

function validateForm(): boolean {
  const issueDateLabel = t("billing.fields.issueDate");
  const documentTypeLabel = t("billing.fields.documentType");
  const currencyLabel = t("billing.fields.currency");
  const exchangeRateLabel = t("billing.fields.exchangeRate");
  const notesLabel = t("billing.fields.notes");

  return validate(
    {
      issueDate: issueDate.value,
      documentType: documentType.value,
      currency: currency.value,
      exchangeRate: exchangeRate.value,
      notes: notes.value,
    },
    {
      issueDate: [rules.required(issueDateLabel)],
      documentType: [rules.required(documentTypeLabel)],
      currency: [rules.required(currencyLabel)],
      exchangeRate: [
        rules.required(exchangeRateLabel),
        rules.positive(exchangeRateLabel),
      ],
      // Las notas son opcionales, pero si se escriben no pueden ser solo números.
      notes: [rules.meaningfulText(notesLabel, 3), rules.maxLength(1000, notesLabel)],
    },
  );
}

async function submit() {
  if (!invoice.value) return;

  if (!validateForm()) {
    modalStore.onError?.({ code: 400, message: firstError.value });
    return;
  }

  saving.value = true;

  try {
    await InvoicesService.update(props.invoiceId, {
      issueDate: issueDate.value,
      documentType: documentType.value.trim(),
      currency: currency.value.trim().toUpperCase(),
      exchangeRate: Number(exchangeRate.value),
      notes: notes.value.trim(),
      internalStatus: internalStatus.value,
    });

    modalStore.onSuccess?.({ ok: true, invoiceId: props.invoiceId });
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("billing.messages.updateError"),
    });
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await loadInvoice();
});
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-3xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("billing.editModal.title") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("billing.editModal.description", { code: title }) }}
      </p>
    </div>

    <div v-if="loading" class="py-bt-spacing-24 text-bt-grey-600">
      {{ $t("common.loading") }}
    </div>

    <div v-else class="space-y-bt-spacing-24">
      <p
        class="rounded-m border border-bt-info-200 bg-bt-info-100 px-bt-spacing-16 py-bt-spacing-12 text-sm text-bt-info-700"
      >
        {{ $t("billing.editModal.linesNotice") }}
      </p>

      <div class="grid grid-cols-1 gap-bt-spacing-16 md:grid-cols-2">
        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("billing.fields.issueDate") }}
          </label>
          <input
            v-model="issueDate"
            type="date"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            :class="fieldClass('issueDate')"
          />
          <BTFieldError :message="getError('issueDate')" />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("billing.fields.documentType") }}
          </label>
          <select
            v-model="documentType"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            :class="fieldClass('documentType')"
          >
            <option value="FE">FE</option>
            <option value="TE">TE</option>
          </select>
          <BTFieldError :message="getError('documentType')" />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("billing.fields.currency") }}
          </label>
          <select
            v-model="currency"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            :class="fieldClass('currency')"
          >
            <option value="CRC">CRC</option>
            <option value="USD">USD</option>
          </select>
          <BTFieldError :message="getError('currency')" />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("billing.fields.exchangeRate") }}
          </label>
          <input
            v-model.number="exchangeRate"
            type="number"
            min="0"
            step="0.01"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            :class="fieldClass('exchangeRate')"
          />
          <BTFieldError :message="getError('exchangeRate')" />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("billing.table.internalStatus") }}
          </label>
          <input
            :value="internalStatus"
            type="text"
            disabled
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-grey-100 text-bt-grey-600 cursor-not-allowed focus:outline-none"
          />
          <p class="mt-bt-spacing-8 text-sm text-bt-grey-600">
            {{ $t("billing.editModal.internalStatusLocked") }}
          </p>
        </div>

        <div class="md:col-span-2">
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("billing.fields.notes") }}
          </label>
          <textarea
            v-model="notes"
            rows="3"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            :class="fieldClass('notes')"
          ></textarea>
          <BTFieldError :message="getError('notes')" />
        </div>
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
          :disabled="saving"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
          @click="submit"
        >
          {{ saving ? $t("common.loading") : $t("common.save") }}
        </button>
      </div>
    </div>
  </div>
</template>
