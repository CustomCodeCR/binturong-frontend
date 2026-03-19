<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useModalStore } from "@/core/stores/modalStore";
import { useToastStore } from "@/core/stores/toastStore";

import { InvoicesService } from "@/core/services/invoicesService";

import InvoiceEmitModal from "@/modules/billing/components/InvoiceEmitModal.vue";

import type { Invoice } from "@/core/interfaces/invoices";

const props = defineProps<{
  invoiceId: string;
}>();

const { t } = useI18n();

const drawerStore = useDrawerStore();
const modalStore = useModalStore();
const toastStore = useToastStore();

const loadingInvoice = ref(false);
const invoice = ref<Invoice | null>(null);

const canEmit = computed(() => {
  const status = String(invoice.value?.taxStatus ?? "")
    .trim()
    .toLowerCase();

  return !(
    status.includes("emit") ||
    status.includes("accept") ||
    status.includes("proces") ||
    status.includes("aprob") ||
    status.includes("sent")
  );
});

function formatDateTime(value?: string | null): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("es-CR");
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

function closeDrawer() {
  drawerStore.closeDrawer();
}

async function loadInvoice() {
  loadingInvoice.value = true;

  try {
    invoice.value = await InvoicesService.readById(props.invoiceId);
  } catch {
    invoice.value = null;

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("billing.messages.loadDetailError"),
    });
  } finally {
    loadingInvoice.value = false;
  }
}

function openEmitModal() {
  if (!invoice.value || !canEmit.value) return;

  modalStore.open({
    component: InvoiceEmitModal,
    props: {
      invoiceId: invoice.value.invoiceId,
      code: invoice.value.consecutive || invoice.value.invoiceId,
      currentTaxStatus: invoice.value.taxStatus,
    },
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("billing.messages.emitSuccess"),
      });

      await loadInvoice();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("billing.messages.emitError"),
      });
    },
  });
}

onMounted(async () => {
  await loadInvoice();
});

watch(
  () => props.invoiceId,
  async () => {
    await loadInvoice();
  },
);
</script>

<template>
  <div class="h-full bg-bt-white p-bt-spacing-24 overflow-y-auto">
    <div class="flex items-start justify-between mb-bt-spacing-24">
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t("billing.drawer.detailsTitle") }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{
            $t("billing.drawer.detailsDescription", {
              code: invoice?.consecutive || invoice?.invoiceId || "",
            })
          }}
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

    <div v-if="loadingInvoice" class="text-bt-grey-500">
      {{ $t("common.loading") }}
    </div>

    <template v-else-if="invoice">
      <div v-if="canEmit" class="mb-bt-spacing-16 flex justify-end">
        <button
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600"
          @click="openEmitModal"
        >
          {{ $t("billing.actions.emit") }}
        </button>
      </div>

      <div
        class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16 mb-bt-spacing-24"
      >
        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("billing.fields.consecutive") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ invoice.consecutive || "-" }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("billing.fields.taxKey") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold break-all">
            {{ invoice.taxKey || "-" }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("billing.fields.client") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ invoice.clientName || "-" }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("billing.fields.branch") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ invoice.branchName || "-" }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("billing.fields.issueDate") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ formatDateTime(invoice.issueDate) }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("billing.fields.documentType") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ invoice.documentType }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("billing.fields.taxStatus") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ invoice.taxStatus }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("billing.fields.internalStatus") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ invoice.internalStatus }}
          </div>
        </div>

        <div
          class="md:col-span-2 p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("billing.fields.notes") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold whitespace-pre-wrap">
            {{ invoice.notes || "-" }}
          </div>
        </div>
      </div>

      <div
        class="grid grid-cols-1 md:grid-cols-5 gap-bt-spacing-16 mb-bt-spacing-24"
      >
        <div
          class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("billing.fields.subtotal") }}
          </div>
          <div class="text-xl font-bt-bold text-bt-primary-700 mt-bt-spacing-8">
            {{ formatMoney(invoice.subtotal) }}
          </div>
        </div>

        <div
          class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("billing.fields.discounts") }}
          </div>
          <div class="text-xl font-bt-bold text-bt-warning-700 mt-bt-spacing-8">
            {{ formatMoney(invoice.discounts) }}
          </div>
        </div>

        <div
          class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("billing.fields.taxes") }}
          </div>
          <div class="text-xl font-bt-bold text-bt-info-700 mt-bt-spacing-8">
            {{ formatMoney(invoice.taxes) }}
          </div>
        </div>

        <div
          class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("billing.fields.paidAmount") }}
          </div>
          <div class="text-xl font-bt-bold text-bt-success-700 mt-bt-spacing-8">
            {{ formatMoney(invoice.paidAmount) }}
          </div>
        </div>

        <div
          class="rounded-m border border-bt-grey-200 bg-bt-primary-700 p-bt-spacing-16"
        >
          <div class="text-xs text-bt-grey-200">
            {{ $t("billing.fields.pendingAmount") }}
          </div>
          <div class="text-2xl font-bt-bold text-bt-accent-300 mt-bt-spacing-8">
            {{ formatMoney(invoice.pendingAmount) }}
          </div>
        </div>
      </div>

      <div class="rounded-m border border-bt-grey-200 overflow-hidden">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("billing.lines.table.description") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("billing.lines.table.quantity") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("billing.lines.table.unitPrice") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("billing.lines.table.discountPerc") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("billing.lines.table.taxPerc") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("billing.lines.table.total") }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="line in invoice.lines"
              :key="line.invoiceDetailId"
              class="border-t border-bt-grey-200"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ line.description || line.productName || line.productId }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ line.quantity }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ formatMoney(line.unitPrice) }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ line.discountPerc }}%
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ line.taxPerc }}%
              </td>
              <td
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700 font-bt-semibold"
              >
                {{ formatMoney(line.lineTotal) }}
              </td>
            </tr>

            <tr v-if="!invoice.lines.length">
              <td
                colspan="6"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("billing.lines.empty") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
