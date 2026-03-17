<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { MoreHorizontal } from "lucide-vue-next";

import { QuotesService } from "@/core/services/quotesService";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useModalStore } from "@/core/stores/modalStore";
import { useToastStore } from "@/core/stores/toastStore";

import QuoteActionMenu from "@/modules/quotes/components/QuoteActionMenu.vue";
import QuoteCreateDrawer from "@/modules/quotes/components/QuoteCreateDrawer.vue";
import QuoteDetailsDrawer from "@/modules/quotes/components/QuoteDetailsDrawer.vue";
import QuoteExpireModal from "@/modules/quotes/components/QuoteExpireModal.vue";
import QuoteConvertContractModal from "@/modules/quotes/components/QuoteConvertContractModal.vue";
import QuoteConvertInvoiceModal from "@/modules/quotes/components/QuoteConvertInvoiceModal.vue";

import type { Quote } from "@/core/interfaces/quotes";

const { t } = useI18n();

const drawerStore = useDrawerStore();
const modalStore = useModalStore();
const toastStore = useToastStore();

const loading = ref(false);
const quotes = ref<Quote[]>([]);
const search = ref("");

async function fetchQuotes(): Promise<Quote[]> {
  const response = await QuotesService.browse({
    page: 1,
    pageSize: 100,
    search: search.value.trim() || undefined,
  });

  if (Array.isArray(response)) {
    return response;
  }

  if (
    response &&
    typeof response === "object" &&
    "items" in response &&
    Array.isArray((response as { items: Quote[] }).items)
  ) {
    return (response as { items: Quote[] }).items;
  }

  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    Array.isArray((response as { data: Quote[] }).data)
  ) {
    return (response as { data: Quote[] }).data;
  }

  return [];
}

function replaceQuotes(nextQuotes: Quote[]) {
  quotes.value = [...nextQuotes];
}

async function loadQuotes() {
  loading.value = true;

  try {
    replaceQuotes(await fetchQuotes());
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("quotes.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

const filteredQuotes = computed(() => {
  const term = search.value.trim().toLowerCase();

  if (!term) {
    return quotes.value;
  }

  return quotes.value.filter((quote) => {
    return (
      (quote.code ?? "").toLowerCase().includes(term) ||
      (quote.clientName ?? "").toLowerCase().includes(term) ||
      (quote.branchName ?? "").toLowerCase().includes(term) ||
      (quote.status ?? "").toLowerCase().includes(term) ||
      (quote.currency ?? "").toLowerCase().includes(term)
    );
  });
});

function formatMoney(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return Number(value).toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value?: string | null): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function upsertQuoteInList(quote: Quote) {
  const index = quotes.value.findIndex(
    (item) => item.quoteId === quote.quoteId,
  );

  if (index === -1) {
    quotes.value = [quote, ...quotes.value];
    return;
  }

  quotes.value = quotes.value.map((item) =>
    item.quoteId === quote.quoteId
      ? {
          ...item,
          ...quote,
        }
      : item,
  );
}

function patchQuoteInList(quoteId: string, patch: Partial<Quote>) {
  quotes.value = quotes.value.map((quote) =>
    quote.quoteId === quoteId
      ? {
          ...quote,
          ...patch,
        }
      : quote,
  );
}

function openCreateDrawer() {
  drawerStore.openDrawer({
    component: QuoteCreateDrawer,
    props: {},
    title: t("quotes.modal.createTitle"),
    description: t("quotes.modal.createDescription"),
    direction: "right",
    size: "xl",
    onSuccess: async (payload?: Quote) => {
      if (payload?.quoteId) {
        upsertQuoteInList(payload);
      }

      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("quotes.messages.createSuccess"),
      });
    },
    onError: (error: any) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("quotes.messages.createError"),
      });
    },
  });
}

function openDetailsDrawer(quoteId: string) {
  drawerStore.openDrawer({
    component: QuoteDetailsDrawer,
    props: {
      quoteId,
    },
    title: t("quotes.drawer.title"),
    description: t("quotes.drawer.description"),
    direction: "right",
    size: "xl",
    onSuccess: async (payload?: Partial<Quote>) => {
      if (payload?.quoteId) {
        patchQuoteInList(payload.quoteId, payload);
      }
    },
    onError: (error: any) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("quotes.messages.loadDetailError"),
      });
    },
  });
}

async function sendQuote(quote: Quote) {
  try {
    await QuotesService.send(quote.quoteId);

    patchQuoteInList(quote.quoteId, {
      status: "Sent",
    });

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("quotes.messages.sendSuccess"),
    });
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("quotes.messages.sendError"),
    });
  }
}

async function acceptQuote(quote: Quote) {
  try {
    await QuotesService.accept(quote.quoteId);

    patchQuoteInList(quote.quoteId, {
      status: "Accepted",
      acceptedByClient: true,
      acceptanceDate: new Date().toISOString(),
    });

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("quotes.messages.acceptSuccess"),
    });
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("quotes.messages.acceptError"),
    });
  }
}

function rejectQuote(quote: Quote) {
  modalStore.open({
    component: QuoteExpireModal,
    props: {
      quoteId: quote.quoteId,
    },
    onSuccess: async () => {
      patchQuoteInList(quote.quoteId, {
        status: "Rejected",
        acceptedByClient: false,
        acceptanceDate: null,
      });

      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("quotes.messages.rejectSuccess"),
      });
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

async function expireQuote(quote: Quote) {
  try {
    await QuotesService.expire(quote.quoteId);

    patchQuoteInList(quote.quoteId, {
      status: "Expired",
    });

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("quotes.messages.expireSuccess"),
    });
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("quotes.messages.expireError"),
    });
  }
}

function openConvertContractModal(quote: Quote) {
  modalStore.open({
    component: QuoteConvertContractModal,
    props: {
      quoteId: quote.quoteId,
      quoteStatus: quote.status,
    },
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("quotes.messages.convertContractSuccess"),
      });
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

function openConvertInvoiceModal(quote: Quote) {
  modalStore.open({
    component: QuoteConvertInvoiceModal,
    props: {
      quoteId: quote.quoteId,
      quoteStatus: quote.status,
    },
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("quotes.messages.convertInvoiceSuccess"),
      });
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

onMounted(async () => {
  await loadQuotes();
});
</script>

<template>
  <section class="h-full min-h-0 bg-bt-grey-50 p-bt-spacing-24 flex flex-col">
    <div class="mb-bt-spacing-24 shrink-0">
      <h1 class="text-2xl font-bt-bold text-bt-primary-700">
        {{ $t("quotes.title") }}
      </h1>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("quotes.subtitle") }}
      </p>
    </div>

    <div
      class="bg-bt-white rounded-l shadow-bt-elevation-200 border border-bt-grey-200 p-bt-spacing-24 flex-1 min-h-0 flex flex-col"
    >
      <div
        class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 mb-bt-spacing-24 shrink-0"
      >
        <div
          class="flex flex-col sm:flex-row gap-bt-spacing-12 w-full lg:max-w-2xl"
        >
          <input
            v-model="search"
            type="text"
            :placeholder="$t('quotes.searchPlaceholder')"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            @keyup.enter="loadQuotes"
          />

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition"
            @click="loadQuotes"
          >
            {{ $t("quotes.actions.search") }}
          </button>

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
            @click="loadQuotes"
          >
            {{ $t("quotes.actions.refresh") }}
          </button>
        </div>

        <button
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 transition font-bt-semibold"
          @click="openCreateDrawer"
        >
          {{ $t("quotes.actions.newQuote") }}
        </button>
      </div>

      <div class="flex-1 min-h-0 overflow-auto">
        <div
          v-if="loading"
          class="py-bt-spacing-32 text-center text-bt-grey-500"
        >
          {{ $t("common.loading") }}
        </div>

        <table v-else class="w-full border-collapse min-w-[1350px]">
          <thead class="sticky top-0 z-10">
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("quotes.table.code") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("quotes.table.client") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("quotes.table.branch") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("quotes.table.issueDate") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("quotes.table.validUntil") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("quotes.table.status") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("quotes.table.total") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("quotes.table.accepted") }}
              </th>
              <th
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20"
              >
                {{ $t("quotes.table.options") }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="quote in filteredQuotes"
              :key="quote.quoteId"
              class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
            >
              <td
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 font-bt-semibold"
              >
                {{ quote.code }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ quote.clientName ?? "-" }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ quote.branchName ?? "-" }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ formatDate(quote.issueDate) }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ formatDate(quote.validUntil) }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <span
                  class="inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold bg-bt-info-100 text-bt-info-700"
                >
                  {{ quote.status }}
                </span>
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ formatMoney(quote.total) }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <span
                  :class="[
                    'inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold',
                    quote.acceptedByClient
                      ? 'bg-bt-success-100 text-bt-success-700'
                      : 'bg-bt-grey-200 text-bt-grey-700',
                  ]"
                >
                  {{
                    quote.acceptedByClient
                      ? $t("quotes.accepted.yes")
                      : $t("quotes.accepted.no")
                  }}
                </span>
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <QuoteActionMenu
                  :items="[
                    {
                      label: t('quotes.actions.viewDetails'),
                      action: () => openDetailsDrawer(quote.quoteId),
                    },
                    {
                      label: t('quotes.actions.send'),
                      action: () => sendQuote(quote),
                    },
                    {
                      label: t('quotes.actions.accept'),
                      action: () => acceptQuote(quote),
                    },
                    {
                      label: t('quotes.actions.reject'),
                      action: () => rejectQuote(quote),
                      danger: true,
                    },
                    {
                      label: t('quotes.actions.expire'),
                      action: () => expireQuote(quote),
                      danger: true,
                    },
                    {
                      label: t('quotes.actions.convertToContract'),
                      action: () => openConvertContractModal(quote),
                    },
                    {
                      label: t('quotes.actions.convertToInvoice'),
                      action: () => openConvertInvoiceModal(quote),
                    },
                  ]"
                >
                  <template #trigger>
                    <button
                      type="button"
                      class="inline-flex items-center justify-center w-10 h-10 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 transition"
                    >
                      <MoreHorizontal :size="18" />
                    </button>
                  </template>
                </QuoteActionMenu>
              </td>
            </tr>

            <tr v-if="!filteredQuotes.length && !loading">
              <td
                colspan="9"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("quotes.empty") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
