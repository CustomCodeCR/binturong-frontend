<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useModalStore } from "@/core/stores/modalStore";
import { useToastStore } from "@/core/stores/toastStore";

import { QuotesService } from "@/core/services/quotesService";

import QuoteExpireModal from "@/modules/quotes/components/QuoteExpireModal.vue";
import QuoteConvertContractModal from "@/modules/quotes/components/QuoteConvertContractModal.vue";
import QuoteConvertInvoiceModal from "@/modules/quotes/components/QuoteConvertInvoiceModal.vue";

import type { Quote, QuoteDetail } from "@/core/interfaces/quotes";

const props = defineProps<{
  quoteId: string;
}>();

const { t } = useI18n();

const drawerStore = useDrawerStore();
const modalStore = useModalStore();
const toastStore = useToastStore();

const loading = ref(false);
const quote = ref<Quote | null>(null);

function toNumber(value: unknown): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? 0 : numericValue;
}

function normalizeLine(line: Partial<QuoteDetail>): QuoteDetail {
  return {
    quoteDetailId: String(line.quoteDetailId ?? ""),
    productId: String(line.productId ?? ""),
    productName: line.productName ?? null,
    quantity: toNumber(line.quantity),
    unitPrice: toNumber(line.unitPrice),
    discountPerc: toNumber(line.discountPerc),
    taxPerc: toNumber(line.taxPerc),
    lineTotal: toNumber(line.lineTotal),
  };
}

const financialSummary = computed(() => {
  const q = quote.value;

  if (!q) {
    return {
      subtotal: 0,
      taxes: 0,
      discounts: 0,
      total: 0,
    };
  }

  const lines = Array.isArray(q.lines) ? q.lines : [];

  const calculatedSubtotal = lines.reduce(
    (sum, line) => sum + toNumber(line.quantity) * toNumber(line.unitPrice),
    0,
  );

  const calculatedDiscounts = lines.reduce((sum, line) => {
    const base = toNumber(line.quantity) * toNumber(line.unitPrice);
    return sum + base * (toNumber(line.discountPerc) / 100);
  }, 0);

  const calculatedTaxes = lines.reduce((sum, line) => {
    const base = toNumber(line.quantity) * toNumber(line.unitPrice);
    const discountAmount = base * (toNumber(line.discountPerc) / 100);
    const taxable = base - discountAmount;
    return sum + taxable * (toNumber(line.taxPerc) / 100);
  }, 0);

  const calculatedTotal = lines.reduce(
    (sum, line) => sum + toNumber(line.lineTotal),
    0,
  );

  const subtotal = toNumber(q.subtotal);
  const taxes = toNumber(q.taxes);
  const discounts = toNumber(q.discounts);
  const total = toNumber(q.total);

  return {
    subtotal: subtotal > 0 ? subtotal : calculatedSubtotal,
    taxes: taxes > 0 ? taxes : calculatedTaxes,
    discounts: discounts > 0 ? discounts : calculatedDiscounts,
    total: total > 0 ? total : calculatedTotal,
  };
});

function formatMoney(value?: number | string | null): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return "-";
  }

  return numericValue.toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value?: string | null): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("es-CR");
}

async function loadQuote() {
  loading.value = true;

  try {
    const response = await QuotesService.readById(props.quoteId);

    quote.value = {
      id: String(response?.id ?? `quote:${props.quoteId}`),
      quoteId: String(response?.quoteId ?? props.quoteId),
      code: String(response?.code ?? ""),
      clientId: String(response?.clientId ?? ""),
      clientName: response?.clientName ?? null,
      branchId: String(response?.branchId ?? ""),
      branchName: response?.branchName ?? null,
      issueDate: String(response?.issueDate ?? ""),
      validUntil: String(response?.validUntil ?? ""),
      status: String(response?.status ?? ""),
      currency: String(response?.currency ?? "CRC"),
      exchangeRate: toNumber(response?.exchangeRate),
      subtotal: toNumber(response?.subtotal),
      taxes: toNumber(response?.taxes),
      discounts: toNumber(response?.discounts),
      total: toNumber(response?.total),
      acceptedByClient: Boolean(response?.acceptedByClient),
      acceptanceDate: response?.acceptanceDate ?? null,
      version: toNumber(response?.version),
      notes: response?.notes ?? null,
      lines: Array.isArray(response?.lines)
        ? response.lines.map((line) => normalizeLine(line))
        : [],
    };

    console.log("QUOTE =>", quote.value);
    console.log("FINANCIAL SUMMARY =>", financialSummary.value);
  } catch {
    quote.value = null;

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("quotes.messages.loadDetailError"),
    });
  } finally {
    loading.value = false;
  }
}

async function sendQuote() {
  if (!quote.value) return;

  try {
    await QuotesService.send(quote.value.quoteId);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("quotes.messages.sendSuccess"),
    });

    await loadQuote();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("quotes.messages.sendError"),
    });
  }
}

async function acceptQuote() {
  if (!quote.value) return;

  try {
    await QuotesService.accept(quote.value.quoteId);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("quotes.messages.acceptSuccess"),
    });

    await loadQuote();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("quotes.messages.acceptError"),
    });
  }
}

function rejectQuote() {
  if (!quote.value) return;

  modalStore.open({
    component: QuoteExpireModal,
    props: {
      quoteId: quote.value.quoteId,
    },
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("quotes.messages.rejectSuccess"),
      });

      await loadQuote();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("quotes.messages.rejectError"),
      });
    },
  });
}

async function expireQuote() {
  if (!quote.value) return;

  try {
    await QuotesService.expire(quote.value.quoteId);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("quotes.messages.expireSuccess"),
    });

    await loadQuote();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("quotes.messages.expireError"),
    });
  }
}

function openConvertContractModal() {
  if (!quote.value) return;

  modalStore.open({
    component: QuoteConvertContractModal,
    props: {
      quoteId: quote.value.quoteId,
      quoteStatus: quote.value.status,
    },
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("quotes.messages.convertContractSuccess"),
      });

      await loadQuote();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("quotes.messages.convertContractError"),
      });
    },
  });
}

function openConvertInvoiceModal() {
  if (!quote.value) return;

  modalStore.open({
    component: QuoteConvertInvoiceModal,
    props: {
      quoteId: quote.value.quoteId,
      quoteStatus: quote.value.status,
    },
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("quotes.messages.convertInvoiceSuccess"),
      });

      await loadQuote();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("quotes.messages.convertInvoiceError"),
      });
    },
  });
}

function closeDrawer() {
  drawerStore.closeDrawer();
}

onMounted(async () => {
  await loadQuote();
});
</script>

<template>
  <div class="h-full bg-bt-white p-bt-spacing-24 overflow-y-auto">
    <div class="flex items-start justify-between mb-bt-spacing-24">
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t("quotes.drawer.title") }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{ $t("quotes.drawer.description") }}
        </p>
      </div>

      <button
        type="button"
        class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
        @click="closeDrawer"
      >
        {{ $t("common.close") }}
      </button>
    </div>

    <div v-if="loading" class="text-bt-grey-500">
      {{ $t("common.loading") }}
    </div>

    <template v-else-if="quote">
      <div
        class="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-bt-spacing-24"
      >
        <div class="space-y-bt-spacing-24">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
            <div
              class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
            >
              <div class="text-xs text-bt-grey-500">
                {{ $t("quotes.fields.code") }}
              </div>
              <div class="text-bt-primary-700 font-bt-semibold">
                {{ quote.code || "-" }}
              </div>
            </div>

            <div
              class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
            >
              <div class="text-xs text-bt-grey-500">
                {{ $t("quotes.fields.status") }}
              </div>
              <div class="text-bt-primary-700 font-bt-semibold">
                {{ quote.status || "-" }}
              </div>
            </div>

            <div
              class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
            >
              <div class="text-xs text-bt-grey-500">
                {{ $t("quotes.fields.client") }}
              </div>
              <div class="text-bt-primary-700 font-bt-semibold">
                {{ quote.clientName ?? "-" }}
              </div>
            </div>

            <div
              class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
            >
              <div class="text-xs text-bt-grey-500">
                {{ $t("quotes.fields.branch") }}
              </div>
              <div class="text-bt-primary-700 font-bt-semibold">
                {{ quote.branchName ?? "-" }}
              </div>
            </div>

            <div
              class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
            >
              <div class="text-xs text-bt-grey-500">
                {{ $t("quotes.fields.issueDate") }}
              </div>
              <div class="text-bt-primary-700 font-bt-semibold">
                {{ formatDate(quote.issueDate) }}
              </div>
            </div>

            <div
              class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
            >
              <div class="text-xs text-bt-grey-500">
                {{ $t("quotes.fields.validUntil") }}
              </div>
              <div class="text-bt-primary-700 font-bt-semibold">
                {{ formatDate(quote.validUntil) }}
              </div>
            </div>

            <div
              class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
            >
              <div class="text-xs text-bt-grey-500">
                {{ $t("quotes.fields.currency") }}
              </div>
              <div class="text-bt-primary-700 font-bt-semibold">
                {{ quote.currency || "-" }}
              </div>
            </div>

            <div
              class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
            >
              <div class="text-xs text-bt-grey-500">
                {{ $t("quotes.fields.version") }}
              </div>
              <div class="text-bt-primary-700 font-bt-semibold">
                {{ quote.version }}
              </div>
            </div>

            <div
              class="md:col-span-2 p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
            >
              <div class="text-xs text-bt-grey-500">
                {{ $t("quotes.fields.notes") }}
              </div>
              <div
                class="text-bt-primary-700 font-bt-semibold whitespace-pre-wrap"
              >
                {{ quote.notes || "-" }}
              </div>
            </div>
          </div>

          <div class="rounded-m border border-bt-grey-200 overflow-hidden">
            <div
              class="px-bt-spacing-16 py-bt-spacing-12 bg-bt-primary-50 border-b border-bt-grey-200"
            >
              <h3 class="font-bt-semibold text-bt-primary-700">
                {{ $t("quotes.lines.title") }}
              </h3>
            </div>

            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-bt-white text-left">
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("quotes.lines.product") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("quotes.lines.quantity") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("quotes.lines.unitPrice") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("quotes.lines.discountPerc") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("quotes.lines.taxPerc") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("quotes.lines.lineTotal") }}
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="line in quote.lines"
                  :key="line.quoteDetailId"
                  class="border-t border-bt-grey-200"
                >
                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ line.productName ?? line.productId ?? "-" }}
                  </td>
                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ line.quantity }}
                  </td>
                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ formatMoney(line.unitPrice) }}
                  </td>
                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ line.discountPerc }}
                  </td>
                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ line.taxPerc }}
                  </td>
                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700 font-bt-semibold"
                  >
                    {{ formatMoney(line.lineTotal) }}
                  </td>
                </tr>

                <tr v-if="!quote.lines.length">
                  <td
                    colspan="6"
                    class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
                  >
                    {{ $t("quotes.lines.empty") }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="space-y-bt-spacing-16">
          <div class="rounded-m border border-bt-grey-200 overflow-hidden">
            <div
              class="px-bt-spacing-16 py-bt-spacing-12 bg-bt-primary-50 border-b border-bt-grey-200"
            >
              <h3 class="font-bt-semibold text-bt-primary-700">
                {{ $t("quotes.summary.title") }}
              </h3>
            </div>

            <div class="p-bt-spacing-16 space-y-bt-spacing-12">
              <div class="flex items-center justify-between">
                <span class="text-bt-grey-600">
                  {{ $t("quotes.summary.subtotal") }}
                </span>
                <span class="font-bt-semibold text-bt-primary-700">
                  {{ formatMoney(financialSummary.subtotal) }}
                </span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-bt-grey-600">
                  {{ $t("quotes.summary.discounts") }}
                </span>
                <span class="font-bt-semibold text-bt-primary-700">
                  {{ formatMoney(financialSummary.discounts) }}
                </span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-bt-grey-600">
                  {{ $t("quotes.summary.taxes") }}
                </span>
                <span class="font-bt-semibold text-bt-primary-700">
                  {{ formatMoney(financialSummary.taxes) }}
                </span>
              </div>

              <div
                class="pt-bt-spacing-12 border-t border-bt-grey-200 flex items-center justify-between"
              >
                <span class="text-bt-primary-700 font-bt-semibold">
                  {{ $t("quotes.summary.total") }}
                </span>
                <span class="text-xl font-bt-bold text-bt-primary-700">
                  {{ formatMoney(financialSummary.total) }}
                </span>
              </div>
            </div>
          </div>

          <div class="rounded-m border border-bt-grey-200 overflow-hidden">
            <div
              class="px-bt-spacing-16 py-bt-spacing-12 bg-bt-primary-50 border-b border-bt-grey-200"
            >
              <h3 class="font-bt-semibold text-bt-primary-700">
                {{ $t("quotes.actions.title") }}
              </h3>
            </div>

            <div class="p-bt-spacing-16 grid grid-cols-1 gap-bt-spacing-12">
              <button
                type="button"
                class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-info-500 text-bt-white hover:bg-bt-info-700"
                @click="sendQuote"
              >
                {{ $t("quotes.actions.send") }}
              </button>

              <button
                type="button"
                class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-success-500 text-bt-white hover:bg-bt-success-700"
                @click="acceptQuote"
              >
                {{ $t("quotes.actions.accept") }}
              </button>

              <button
                type="button"
                class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-error-500 text-bt-white hover:bg-bt-error-700"
                @click="rejectQuote"
              >
                {{ $t("quotes.actions.reject") }}
              </button>

              <button
                type="button"
                class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-warning-500 text-bt-white hover:bg-bt-warning-700"
                @click="expireQuote"
              >
                {{ $t("quotes.actions.expire") }}
              </button>

              <button
                type="button"
                class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600"
                @click="openConvertContractModal"
              >
                {{ $t("quotes.actions.convertToContract") }}
              </button>

              <button
                type="button"
                class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600"
                @click="openConvertInvoiceModal"
              >
                {{ $t("quotes.actions.convertToInvoice") }}
              </button>
            </div>
          </div>

          <div
            class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("quotes.fields.acceptedByClient") }}
            </div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{
                quote.acceptedByClient
                  ? $t("quotes.accepted.yes")
                  : $t("quotes.accepted.no")
              }}
            </div>

            <div class="text-xs text-bt-grey-500 mt-bt-spacing-12">
              {{ $t("quotes.fields.acceptanceDate") }}
            </div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ formatDate(quote.acceptanceDate) }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="text-bt-grey-500">
      {{ $t("quotes.messages.loadDetailError") }}
    </div>
  </div>
</template>
