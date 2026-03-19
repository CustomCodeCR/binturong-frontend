<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { PaymentsService } from "@/core/services/paymentsService";
import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

import type { Payment } from "@/core/interfaces/payments";

const props = defineProps<{
  paymentId: string;
}>();

const { t } = useI18n();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const loading = ref(false);
const payment = ref<Payment | null>(null);

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

function closeDrawer() {
  drawerStore.closeDrawer();
}

async function loadPayment() {
  loading.value = true;

  try {
    payment.value = await PaymentsService.getPaymentById(props.paymentId);
  } catch {
    payment.value = null;

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("payments.messages.loadDetailError"),
    });
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadPayment();
});

watch(
  () => props.paymentId,
  async () => {
    await loadPayment();
  },
);
</script>

<template>
  <div class="h-full bg-bt-white p-bt-spacing-24 overflow-y-auto">
    <div class="flex items-start justify-between mb-bt-spacing-24">
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t("payments.drawer.detailsTitle") }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{
            $t("payments.drawer.detailsDescription", {
              reference: payment?.reference || payment?.paymentId || "",
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

    <div v-if="loading" class="text-bt-grey-500">
      {{ $t("common.loading") }}
    </div>

    <template v-else-if="payment">
      <div
        class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16 mb-bt-spacing-24"
      >
        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("payments.fields.client") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ payment.clientName }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("payments.fields.paymentMethod") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ payment.paymentMethodDescription }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("payments.fields.paymentDate") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ formatDateTime(payment.paymentDate) }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("payments.fields.reference") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ payment.reference || "-" }}
          </div>
        </div>

        <div
          class="md:col-span-2 p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("payments.fields.notes") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold whitespace-pre-wrap">
            {{ payment.notes || "-" }}
          </div>
        </div>
      </div>

      <div
        class="rounded-m border border-bt-grey-200 bg-bt-primary-700 p-bt-spacing-16 mb-bt-spacing-24"
      >
        <div class="text-xs text-bt-grey-200">
          {{ $t("payments.fields.totalAmount") }}
        </div>
        <div class="text-3xl font-bt-bold text-bt-accent-300 mt-bt-spacing-8">
          {{ formatMoney(payment.totalAmount) }}
        </div>
      </div>

      <div class="rounded-m border border-bt-grey-200 overflow-hidden">
        <div
          class="px-bt-spacing-16 py-bt-spacing-12 bg-bt-primary-50 border-b border-bt-grey-200"
        >
          <h3 class="font-bt-semibold text-bt-primary-700">
            {{ $t("payments.drawer.appliedInvoicesTitle") }}
          </h3>
        </div>

        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-bt-grey-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("payments.table.invoice") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("payments.table.appliedAmount") }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="invoice in payment.appliedInvoices"
              :key="invoice.invoiceId"
              class="border-t border-bt-grey-200"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ invoice.invoiceConsecutive || invoice.invoiceId }}
              </td>
              <td
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700 font-bt-semibold"
              >
                {{ formatMoney(invoice.appliedAmount) }}
              </td>
            </tr>

            <tr v-if="!payment.appliedInvoices.length">
              <td
                colspan="2"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("payments.drawer.emptyAppliedInvoices") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
