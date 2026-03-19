<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { CreditNotesService } from "@/core/services/creditNotesService";
import { InvoicesService } from "@/core/services/invoicesService";

import { useModalStore } from "@/core/stores/modalStore";

import type { SelectOption } from "@/core/interfaces/select";
import type { Invoice } from "@/core/interfaces/invoices";

type CreditNoteReason = "Return" | "PriceCorrection" | "ServiceCanceled";

const { t } = useI18n();
const modalStore = useModalStore();

const loadingCatalogs = ref(false);
const loadingInvoice = ref(false);
const loading = ref(false);

const invoices = ref<SelectOption[]>([]);
const selectedInvoice = ref<Invoice | null>(null);

const invoiceId = ref("");
const reason = ref<CreditNoteReason | "">("");
const totalAmount = ref<number | null>(null);
const issueDate = ref("");

const reasonOptions: Array<{ value: CreditNoteReason; labelKey: string }> = [
  {
    value: "Return",
    labelKey: "payments.creditNotes.reasons.return",
  },
  {
    value: "PriceCorrection",
    labelKey: "payments.creditNotes.reasons.priceCorrection",
  },
  {
    value: "ServiceCanceled",
    labelKey: "payments.creditNotes.reasons.serviceCanceled",
  },
];

function closeModal() {
  modalStore.close();
}

function getTodayForInput(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toIsoDate(dateText: string): string {
  if (!dateText) return "";

  const normalized = `${dateText}T00:00:00`;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString();
}

function normalizeText(value?: string | null): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

function isPaidInvoice(invoice: Invoice | null | undefined): boolean {
  return normalizeText(invoice?.internalStatus) === "paid";
}

function formatMoney(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "0.00";
  }

  return Number(value).toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function mapInvoiceToSelectOption(invoice: Invoice): SelectOption {
  const reference = invoice.consecutive || invoice.taxKey || invoice.invoiceId;
  const client = invoice.clientName || "-";
  const pending = formatMoney(invoice.pendingAmount ?? invoice.total ?? 0);

  return {
    id: invoice.invoiceId,
    label: `${reference} - ${client} - ${pending}`,
    code: invoice.consecutive || invoice.taxKey || invoice.invoiceId,
  };
}

async function loadCatalogs() {
  loadingCatalogs.value = true;

  try {
    const response = await InvoicesService.browse({
      page: 1,
      pageSize: 500,
    });

    invoices.value = (response ?? [])
      .filter(
        (invoice) =>
          !isPaidInvoice(invoice) &&
          Number(invoice.pendingAmount ?? invoice.total ?? 0) > 0,
      )
      .map(mapInvoiceToSelectOption);
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("payments.creditNotes.messages.loadError"),
    });
  } finally {
    loadingCatalogs.value = false;
  }
}

async function loadInvoice() {
  if (!invoiceId.value.trim()) {
    selectedInvoice.value = null;
    totalAmount.value = null;
    return;
  }

  loadingInvoice.value = true;

  try {
    const invoice = await InvoicesService.readById(invoiceId.value.trim());

    if (isPaidInvoice(invoice)) {
      selectedInvoice.value = null;
      totalAmount.value = null;
      invoiceId.value = "";

      modalStore.onError?.({
        code: 400,
        message: t("payments.creditNotes.validation.invoiceAlreadyPaid"),
      });
      return;
    }

    selectedInvoice.value = invoice;
    totalAmount.value = Number(invoice.pendingAmount ?? invoice.total ?? 0);
  } catch (error: any) {
    selectedInvoice.value = null;
    totalAmount.value = null;

    modalStore.onError?.({
      code: error?.status ?? 500,
      message:
        error?.message ?? t("payments.creditNotes.messages.loadInvoiceError"),
    });
  } finally {
    loadingInvoice.value = false;
  }
}

async function submit() {
  const normalizedInvoiceId = invoiceId.value.trim();
  const normalizedReason = reason.value;
  const normalizedIssueDate = toIsoDate(issueDate.value.trim());
  const normalizedTotalAmount = Number(totalAmount.value ?? 0);

  if (!normalizedInvoiceId || !normalizedReason || !normalizedIssueDate) {
    modalStore.onError?.({
      code: 400,
      message: t("payments.creditNotes.validation.required"),
    });
    return;
  }

  if (Number.isNaN(normalizedTotalAmount) || normalizedTotalAmount <= 0) {
    modalStore.onError?.({
      code: 400,
      message: t("payments.creditNotes.validation.amountRequired"),
    });
    return;
  }

  loading.value = true;

  try {
    const created = await CreditNotesService.create({
      invoiceId: normalizedInvoiceId,
      reason: normalizedReason,
      totalAmount: normalizedTotalAmount,
      issueDate: normalizedIssueDate,
    });

    await CreditNotesService.emit(created.creditNoteId);

    modalStore.onSuccess?.(created);
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("payments.creditNotes.messages.createError"),
    });
  } finally {
    loading.value = false;
  }
}

watch(invoiceId, async () => {
  await loadInvoice();
});

onMounted(async () => {
  issueDate.value = getTodayForInput();
  await loadCatalogs();
});
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-2xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("payments.creditNotes.modal.title") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("payments.creditNotes.modal.description") }}
      </p>
    </div>

    <div
      v-if="loadingCatalogs"
      class="py-bt-spacing-24 text-center text-bt-grey-500"
    >
      {{ $t("common.loading") }}
    </div>

    <div v-else class="space-y-bt-spacing-16">
      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("payments.creditNotes.fields.invoice") }}
        </label>
        <select
          v-model="invoiceId"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">
            {{ $t("payments.creditNotes.placeholders.selectInvoice") }}
          </option>
          <option
            v-for="invoice in invoices"
            :key="invoice.id"
            :value="invoice.id"
          >
            {{ invoice.label }}
          </option>
        </select>
      </div>

      <div
        v-if="selectedInvoice"
        class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
      >
        <div class="text-sm text-bt-grey-500">
          {{ $t("payments.creditNotes.fields.selectedInvoiceBalance") }}
        </div>
        <div class="text-lg font-bt-bold text-bt-primary-700 mt-bt-spacing-4">
          {{
            formatMoney(selectedInvoice.pendingAmount ?? selectedInvoice.total)
          }}
        </div>
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("payments.creditNotes.fields.reason") }}
        </label>
        <select
          v-model="reason"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">
            {{ $t("payments.creditNotes.placeholders.selectReason") }}
          </option>
          <option
            v-for="option in reasonOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ $t(option.labelKey) }}
          </option>
        </select>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("payments.creditNotes.fields.totalAmount") }}
          </label>
          <input
            v-model.number="totalAmount"
            type="number"
            min="0"
            step="0.01"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("payments.creditNotes.fields.issueDate") }}
          </label>
          <input
            v-model="issueDate"
            type="date"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
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
          :disabled="loading || loadingInvoice"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-warning-500 text-bt-white hover:bg-bt-warning-700 disabled:bg-bt-disabled"
          @click="submit"
        >
          {{ loading ? $t("common.loading") : $t("common.save") }}
        </button>
      </div>
    </div>
  </div>
</template>
