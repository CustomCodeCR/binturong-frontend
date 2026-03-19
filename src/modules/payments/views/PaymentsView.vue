<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  MoreHorizontal,
  Wallet,
  CreditCard,
  Landmark,
  FileDown,
  BadgeDollarSign,
} from "lucide-vue-next";

import { PaymentsService } from "@/core/services/paymentsService";
import { CreditNotesService } from "@/core/services/creditNotesService";
import { DebitNotesService } from "@/core/services/debitNotesService";
import { SelectService } from "@/core/services/selectService";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useModalStore } from "@/core/stores/modalStore";
import { useToastStore } from "@/core/stores/toastStore";

import PaymentActionMenu from "@/modules/payments/components/PaymentActionMenu.vue";
import PaymentRegisterModal from "@/modules/payments/components/PaymentRegisterModal.vue";
import PaymentDetailsDrawer from "@/modules/payments/components/PaymentDetailsDrawer.vue";
import CreditNoteCreateModal from "@/modules/payments/components/CreditNoteCreateModal.vue";
import DebitNoteCreateModal from "@/modules/payments/components/DebitNoteCreateModal.vue";

import type { Payment, ReportPaymentQuery } from "@/core/interfaces/payments";
import type { CreditNote } from "@/core/interfaces/creditNotes";
import type { DebitNote } from "@/core/interfaces/debitNotes";
import type { SelectOption } from "@/core/interfaces/select";

const { t } = useI18n();

const drawerStore = useDrawerStore();
const modalStore = useModalStore();
const toastStore = useToastStore();

const loadingPayments = ref(false);
const loadingCreditNotes = ref(false);
const loadingDebitNotes = ref(false);
const loadingFilters = ref(false);

const activeTab = ref<"payments" | "creditNotes" | "debitNotes">("payments");

const payments = ref<Payment[]>([]);
const creditNotes = ref<CreditNote[]>([]);
const debitNotes = ref<DebitNote[]>([]);

const invoices = ref<SelectOption[]>([]);
const paymentMethods = ref<SelectOption[]>([]);
const clients = ref<SelectOption[]>([]);

const search = ref("");
const filterPaymentMethodId = ref("");
const filterClientId = ref("");

function formatDateTime(value?: string | null): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function formatMoney(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return Number(value).toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const paymentSummary = computed(() => {
  const totalPayments = payments.value.length;
  const totalCollected = payments.value.reduce(
    (acc, item) => acc + Number(item.totalAmount ?? 0),
    0,
  );

  const cashCount = payments.value.filter((item) =>
    (item.paymentMethodCode || "").toLowerCase().includes("cash"),
  ).length;

  const transferCount = payments.value.filter((item) =>
    (item.paymentMethodCode || "").toLowerCase().includes("transfer"),
  ).length;

  return {
    totalPayments,
    totalCollected,
    cashCount,
    transferCount,
  };
});

const filteredPayments = computed(() => {
  const term = search.value.trim().toLowerCase();

  return payments.value.filter((item) => {
    const matchesSearch =
      !term ||
      (item.clientName || "").toLowerCase().includes(term) ||
      (item.paymentMethodCode || "").toLowerCase().includes(term) ||
      (item.paymentMethodDescription || "").toLowerCase().includes(term) ||
      (item.reference || "").toLowerCase().includes(term) ||
      (item.notes || "").toLowerCase().includes(term) ||
      item.appliedInvoices.some((invoice) =>
        (invoice.invoiceConsecutive || "").toLowerCase().includes(term),
      );

    const matchesMethod =
      !filterPaymentMethodId.value ||
      item.paymentMethodId === filterPaymentMethodId.value;

    const matchesClient =
      !filterClientId.value || item.clientId === filterClientId.value;

    return matchesSearch && matchesMethod && matchesClient;
  });
});

async function loadFilters() {
  loadingFilters.value = true;

  try {
    const [invoicesResponse, paymentMethodsResponse, clientsResponse] =
      await Promise.all([
        SelectService.selectInvoices(),
        SelectService.selectPaymentMethods({ onlyActive: true }),
        SelectService.selectClients({ onlyActive: true }),
      ]);

    invoices.value = invoicesResponse ?? [];
    paymentMethods.value = paymentMethodsResponse ?? [];
    clients.value = clientsResponse ?? [];
  } catch {
    toastStore.addToast({
      severity: "warning",
      title: t("toast.warning"),
      message: t("payments.messages.loadCatalogsError"),
    });
  } finally {
    loadingFilters.value = false;
  }
}

async function loadPayments() {
  loadingPayments.value = true;

  try {
    payments.value = await PaymentsService.getPayments({
      page: 1,
      pageSize: 100,
      search: search.value.trim() || undefined,
      paymentMethodId: filterPaymentMethodId.value || undefined,
    });
  } catch {
    payments.value = [];

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("payments.messages.loadError"),
    });
  } finally {
    loadingPayments.value = false;
  }
}

async function loadCreditNotes() {
  loadingCreditNotes.value = true;

  try {
    creditNotes.value = await CreditNotesService.browse({
      page: 1,
      pageSize: 100,
      search: search.value.trim() || undefined,
    });
  } catch {
    creditNotes.value = [];

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("payments.creditNotes.messages.loadError"),
    });
  } finally {
    loadingCreditNotes.value = false;
  }
}

async function loadDebitNotes() {
  loadingDebitNotes.value = true;

  try {
    debitNotes.value = await DebitNotesService.browse({
      page: 1,
      pageSize: 100,
      search: search.value.trim() || undefined,
    });
  } catch {
    debitNotes.value = [];

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("payments.debitNotes.messages.loadError"),
    });
  } finally {
    loadingDebitNotes.value = false;
  }
}

async function refreshCurrentTab() {
  if (activeTab.value === "payments") {
    await loadPayments();
    return;
  }

  if (activeTab.value === "creditNotes") {
    await loadCreditNotes();
    return;
  }

  await loadDebitNotes();
}

function openRegisterPaymentModal() {
  modalStore.open({
    component: PaymentRegisterModal,
    props: {},
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("payments.messages.registerSuccess"),
      });

      await loadPayments();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("payments.messages.registerError"),
      });
    },
  });
}

function openPaymentDetailsDrawer(payment: Payment) {
  drawerStore.openDrawer({
    component: PaymentDetailsDrawer,
    title: t("payments.drawer.detailsTitle"),
    description: t("payments.drawer.detailsDescription", {
      reference: payment.reference || payment.paymentId,
    }),
    direction: "right",
    size: "lg",
    props: {
      paymentId: payment.paymentId,
    },
  });
}

function openCreateCreditNoteModal() {
  modalStore.open({
    component: CreditNoteCreateModal,
    props: {},
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("payments.creditNotes.messages.createSuccess"),
      });

      await loadCreditNotes();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message:
          error?.message ?? t("payments.creditNotes.messages.createError"),
      });
    },
  });
}

function openCreateDebitNoteModal() {
  modalStore.open({
    component: DebitNoteCreateModal,
    props: {},
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("payments.debitNotes.messages.createSuccess"),
      });

      await loadDebitNotes();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message:
          error?.message ?? t("payments.debitNotes.messages.createError"),
      });
    },
  });
}

async function exportPdf() {
  try {
    const query: ReportPaymentQuery = {
      search: search.value.trim() || undefined,
      clientId: filterClientId.value || undefined,
      paymentMethodId: filterPaymentMethodId.value || undefined,
    };

    const blob = await PaymentsService.reportPaymentPdf(query);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "payments-report.pdf";
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("payments.messages.exportPdfError"),
    });
  }
}

async function exportExcel() {
  try {
    const query: ReportPaymentQuery = {
      search: search.value.trim() || undefined,
      clientId: filterClientId.value || undefined,
      paymentMethodId: filterPaymentMethodId.value || undefined,
    };

    const blob = await PaymentsService.reportPaymentExcel(query);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "payments-report.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("payments.messages.exportExcelError"),
    });
  }
}

onMounted(async () => {
  await Promise.all([
    loadFilters(),
    loadPayments(),
    loadCreditNotes(),
    loadDebitNotes(),
  ]);
});

window.addEventListener("payments-updated", async () => {
  await Promise.all([loadPayments(), loadCreditNotes(), loadDebitNotes()]);
});
</script>

<template>
  <section class="h-full min-h-0 bg-bt-grey-50 p-bt-spacing-24 flex flex-col">
    <div class="mb-bt-spacing-24 shrink-0">
      <h1 class="text-2xl font-bt-bold text-bt-primary-700">
        {{ $t("payments.title") }}
      </h1>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("payments.subtitle") }}
      </p>
    </div>

    <div
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-bt-spacing-16 mb-bt-spacing-24 shrink-0"
    >
      <div
        class="rounded-l border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100"
      >
        <div class="flex items-center gap-bt-spacing-12">
          <div
            class="w-12 h-12 rounded-full bg-bt-primary-50 flex items-center justify-center text-bt-primary-600"
          >
            <Wallet :size="22" />
          </div>
          <div>
            <div class="text-sm text-bt-grey-500">
              {{ $t("payments.summary.totalPayments") }}
            </div>
            <div class="text-2xl font-bt-bold text-bt-primary-700">
              {{ paymentSummary.totalPayments }}
            </div>
          </div>
        </div>
      </div>

      <div
        class="rounded-l border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100"
      >
        <div class="flex items-center gap-bt-spacing-12">
          <div
            class="w-12 h-12 rounded-full bg-bt-success-100 flex items-center justify-center text-bt-success-700"
          >
            <BadgeDollarSign :size="22" />
          </div>
          <div>
            <div class="text-sm text-bt-grey-500">
              {{ $t("payments.summary.totalCollected") }}
            </div>
            <div class="text-2xl font-bt-bold text-bt-success-700">
              {{ formatMoney(paymentSummary.totalCollected) }}
            </div>
          </div>
        </div>
      </div>

      <div
        class="rounded-l border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100"
      >
        <div class="flex items-center gap-bt-spacing-12">
          <div
            class="w-12 h-12 rounded-full bg-bt-warning-100 flex items-center justify-center text-bt-warning-700"
          >
            <Wallet :size="22" />
          </div>
          <div>
            <div class="text-sm text-bt-grey-500">
              {{ $t("payments.summary.cashPayments") }}
            </div>
            <div class="text-2xl font-bt-bold text-bt-warning-700">
              {{ paymentSummary.cashCount }}
            </div>
          </div>
        </div>
      </div>

      <div
        class="rounded-l border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100"
      >
        <div class="flex items-center gap-bt-spacing-12">
          <div
            class="w-12 h-12 rounded-full bg-bt-info-100 flex items-center justify-center text-bt-info-700"
          >
            <Landmark :size="22" />
          </div>
          <div>
            <div class="text-sm text-bt-grey-500">
              {{ $t("payments.summary.transferPayments") }}
            </div>
            <div class="text-2xl font-bt-bold text-bt-info-700">
              {{ paymentSummary.transferCount }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="bg-bt-white rounded-l shadow-bt-elevation-200 border border-bt-grey-200 p-bt-spacing-24 flex-1 min-h-0 flex flex-col"
    >
      <div class="flex flex-wrap gap-bt-spacing-8 mb-bt-spacing-24 shrink-0">
        <button
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m transition"
          :class="
            activeTab === 'payments'
              ? 'bg-bt-primary-500 text-bt-white'
              : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'
          "
          @click="activeTab = 'payments'"
        >
          {{ $t("payments.tabs.payments") }}
        </button>

        <button
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m transition"
          :class="
            activeTab === 'creditNotes'
              ? 'bg-bt-primary-500 text-bt-white'
              : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'
          "
          @click="activeTab = 'creditNotes'"
        >
          {{ $t("payments.tabs.creditNotes") }}
        </button>

        <button
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m transition"
          :class="
            activeTab === 'debitNotes'
              ? 'bg-bt-primary-500 text-bt-white'
              : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'
          "
          @click="activeTab = 'debitNotes'"
        >
          {{ $t("payments.tabs.debitNotes") }}
        </button>
      </div>

      <div
        class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-bt-spacing-16 mb-bt-spacing-24 shrink-0"
      >
        <div
          class="grid grid-cols-1 md:grid-cols-3 gap-bt-spacing-12 w-full xl:max-w-4xl"
        >
          <input
            v-model="search"
            type="text"
            :placeholder="$t('payments.searchPlaceholder')"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />

          <select
            v-model="filterClientId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            :disabled="loadingFilters"
          >
            <option value="">
              {{ $t("payments.filters.allClients") }}
            </option>
            <option
              v-for="client in clients"
              :key="client.id"
              :value="client.id"
            >
              {{ client.label }}
            </option>
          </select>

          <select
            v-model="filterPaymentMethodId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            :disabled="loadingFilters"
          >
            <option value="">
              {{ $t("payments.filters.allPaymentMethods") }}
            </option>
            <option
              v-for="method in paymentMethods"
              :key="method.id"
              :value="method.id"
            >
              {{ method.label }}
            </option>
          </select>
        </div>

        <div class="flex flex-wrap gap-bt-spacing-12">
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600"
            @click="refreshCurrentTab"
          >
            {{ $t("payments.actions.refresh") }}
          </button>

          <button
            v-if="activeTab === 'payments'"
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600"
            @click="openRegisterPaymentModal"
          >
            {{ $t("payments.actions.newPayment") }}
          </button>

          <button
            v-if="activeTab === 'creditNotes'"
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-warning-500 text-bt-white hover:bg-bt-warning-700"
            @click="openCreateCreditNoteModal"
          >
            {{ $t("payments.creditNotes.actions.new") }}
          </button>

          <button
            v-if="activeTab === 'debitNotes'"
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-info-500 text-bt-white hover:bg-bt-info-700"
            @click="openCreateDebitNoteModal"
          >
            {{ $t("payments.debitNotes.actions.new") }}
          </button>

          <button
            v-if="activeTab === 'payments'"
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 inline-flex items-center gap-bt-spacing-8"
            @click="exportPdf"
          >
            <FileDown :size="18" />
            {{ $t("payments.actions.exportPdf") }}
          </button>

          <button
            v-if="activeTab === 'payments'"
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 inline-flex items-center gap-bt-spacing-8"
            @click="exportExcel"
          >
            <FileDown :size="18" />
            {{ $t("payments.actions.exportExcel") }}
          </button>
        </div>
      </div>

      <div class="flex-1 min-h-0 overflow-auto">
        <table
          v-if="activeTab === 'payments'"
          class="w-full border-collapse min-w-[1350px]"
        >
          <thead class="sticky top-0 z-10">
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("payments.table.client") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("payments.table.method") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("payments.table.paymentDate") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("payments.table.totalAmount") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("payments.table.reference") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("payments.table.appliedInvoices") }}
              </th>
              <th
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20"
              >
                {{ $t("payments.table.options") }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="payment in filteredPayments"
              :key="payment.paymentId"
              class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ payment.clientName }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <div
                  class="flex items-center gap-bt-spacing-8 text-bt-grey-700"
                >
                  <CreditCard :size="16" />
                  <span>{{ payment.paymentMethodDescription }}</span>
                </div>
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ formatDateTime(payment.paymentDate) }}
              </td>

              <td
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700 font-bt-semibold"
              >
                {{ formatMoney(payment.totalAmount) }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ payment.reference || "-" }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                <div
                  v-for="invoice in payment.appliedInvoices"
                  :key="invoice.invoiceId"
                  class="text-sm"
                >
                  {{ invoice.invoiceConsecutive || invoice.invoiceId }} —
                  {{ formatMoney(invoice.appliedAmount) }}
                </div>
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <PaymentActionMenu
                  :items="[
                    {
                      label: t('payments.actions.viewDetails'),
                      action: () => openPaymentDetailsDrawer(payment),
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
                </PaymentActionMenu>
              </td>
            </tr>

            <tr v-if="!filteredPayments.length && !loadingPayments">
              <td
                colspan="7"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("payments.empty") }}
              </td>
            </tr>
          </tbody>
        </table>

        <table
          v-else-if="activeTab === 'creditNotes'"
          class="w-full border-collapse min-w-[1100px]"
        >
          <thead>
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("payments.creditNotes.table.invoice") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("payments.creditNotes.table.consecutive") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("payments.creditNotes.table.issueDate") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("payments.creditNotes.table.reason") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("payments.creditNotes.table.totalAmount") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("payments.creditNotes.table.taxStatus") }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="note in creditNotes"
              :key="note.creditNoteId"
              class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ note.invoiceConsecutive || note.invoiceId }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ note.consecutive || "-" }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ formatDateTime(note.issueDate) }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ note.reason }}
              </td>
              <td
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700 font-bt-semibold"
              >
                {{ formatMoney(note.totalAmount) }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ note.taxStatus }}
              </td>
            </tr>

            <tr v-if="!creditNotes.length && !loadingCreditNotes">
              <td
                colspan="6"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("payments.creditNotes.empty") }}
              </td>
            </tr>
          </tbody>
        </table>

        <table v-else class="w-full border-collapse min-w-[1100px]">
          <thead>
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("payments.debitNotes.table.invoice") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("payments.debitNotes.table.consecutive") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("payments.debitNotes.table.issueDate") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("payments.debitNotes.table.reason") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("payments.debitNotes.table.totalAmount") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("payments.debitNotes.table.taxStatus") }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="note in debitNotes"
              :key="note.debitNoteId"
              class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ note.invoiceConsecutive || note.invoiceId }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ note.consecutive || "-" }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ formatDateTime(note.issueDate) }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ note.reason }}
              </td>
              <td
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700 font-bt-semibold"
              >
                {{ formatMoney(note.totalAmount) }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ note.taxStatus }}
              </td>
            </tr>

            <tr v-if="!debitNotes.length && !loadingDebitNotes">
              <td
                colspan="6"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("payments.debitNotes.empty") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
