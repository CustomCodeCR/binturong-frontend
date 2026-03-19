<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { PaymentsService } from "@/core/services/paymentsService";
import { InvoicesService } from "@/core/services/invoicesService";
import { SelectService } from "@/core/services/selectService";

import { useModalStore } from "@/core/stores/modalStore";

import type { SelectOption } from "@/core/interfaces/select";
import type { Invoice } from "@/core/interfaces/invoices";

type PaymentMode = "cash" | "transfer" | "card" | "partial";

const props = defineProps<{
  initialMode?: PaymentMode;
}>();

const { t } = useI18n();
const modalStore = useModalStore();

const loadingCatalogs = ref(false);
const loadingInvoice = ref(false);
const loading = ref(false);

const mode = ref<PaymentMode>(props.initialMode ?? "cash");

const invoices = ref<SelectOption[]>([]);
const clients = ref<SelectOption[]>([]);
const paymentMethods = ref<SelectOption[]>([]);

const selectedInvoice = ref<Invoice | null>(null);

const invoiceId = ref("");
const clientId = ref("");
const paymentMethodId = ref("");
const paymentDate = ref("");
const amount = ref<number | null>(null);
const amountTendered = ref<number | null>(null);
const reference = ref("");
const notes = ref("");
const isBankConfirmed = ref(false);
const isPosAvailable = ref(true);
const isApproved = ref(true);
const posAuthCode = ref("");

const pendingAmount = computed(() =>
  Number(selectedInvoice.value?.pendingAmount ?? 0),
);

const changeAmount = computed(() => {
  if (mode.value !== "cash") return 0;

  const tendered = Number(amountTendered.value ?? 0);
  return tendered > pendingAmount.value ? tendered - pendingAmount.value : 0;
});

function closeModal() {
  modalStore.close();
}

function getNowForInput(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toIsoDate(localDateTime: string): string {
  if (!localDateTime) return "";
  return new Date(localDateTime).toISOString();
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

function resolveDefaultPaymentMethod(
  currentMode: PaymentMode,
): SelectOption | null {
  const methods = paymentMethods.value ?? [];

  const candidatesByMode: Record<PaymentMode, string[]> = {
    cash: ["cash", "efectivo"],
    transfer: ["transfer", "bank transfer", "transferencia", "sinpe"],
    card: ["card", "tarjeta", "credit card", "debit card", "pos"],
    partial: ["partial", "parcial"],
  };

  const candidates = candidatesByMode[currentMode];

  for (const method of methods) {
    const haystack = `${method.label ?? ""} ${method.code ?? ""} ${method.id ?? ""}`;
    const normalizedHaystack = normalizeText(haystack);

    if (
      candidates.some((candidate) =>
        normalizedHaystack.includes(normalizeText(candidate)),
      )
    ) {
      return method;
    }
  }

  if (currentMode === "partial") {
    const transferLike = resolveDefaultPaymentMethod("transfer");
    if (transferLike) return transferLike;
  }

  return null;
}

function applyDefaultPaymentMethod(force = false) {
  if (!paymentMethods.value.length) return;
  if (!force && paymentMethodId.value.trim()) return;

  const selectedMethod = resolveDefaultPaymentMethod(mode.value);

  if (selectedMethod) {
    paymentMethodId.value = selectedMethod.id;
  }
}

function mapInvoiceToSelectOption(invoice: Invoice): SelectOption {
  const reference = invoice.consecutive || invoice.taxKey || invoice.invoiceId;
  const client = invoice.clientName || t("common.notAvailable");
  const pending = formatMoney(invoice.pendingAmount);

  return {
    id: invoice.invoiceId,
    label: `${reference} - ${client} - ${pending}`,
    code: invoice.consecutive || invoice.taxKey || invoice.invoiceId,
  };
}

async function loadCatalogs() {
  loadingCatalogs.value = true;

  try {
    const [invoiceResponse, clientOptions, paymentMethodOptions] =
      await Promise.all([
        InvoicesService.browse({
          page: 1,
          pageSize: 500,
        }),
        SelectService.selectClients({ onlyActive: true }),
        SelectService.selectPaymentMethods({ onlyActive: true }),
      ]);

    const availableInvoices = (invoiceResponse ?? []).filter(
      (invoice) =>
        !isPaidInvoice(invoice) && Number(invoice.pendingAmount ?? 0) > 0,
    );

    invoices.value = availableInvoices.map(mapInvoiceToSelectOption);
    clients.value = clientOptions ?? [];
    paymentMethods.value = paymentMethodOptions ?? [];

    applyDefaultPaymentMethod(true);
  } finally {
    loadingCatalogs.value = false;
  }
}

async function loadInvoice() {
  if (!invoiceId.value) {
    selectedInvoice.value = null;
    return;
  }

  loadingInvoice.value = true;

  try {
    const invoice = await InvoicesService.readById(invoiceId.value);

    if (isPaidInvoice(invoice)) {
      selectedInvoice.value = null;
      invoiceId.value = "";

      modalStore.onError?.({
        code: 400,
        message: t("payments.validation.invoiceAlreadyPaid"),
      });
      return;
    }

    selectedInvoice.value = invoice;
    clientId.value = invoice.clientId;

    if (mode.value === "cash") {
      amountTendered.value = Number(invoice.pendingAmount ?? 0);
      amount.value = null;
    } else {
      amount.value = Number(invoice.pendingAmount ?? 0);
      amountTendered.value = null;
    }
  } catch (error: any) {
    selectedInvoice.value = null;
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("payments.messages.loadInvoiceError"),
    });
  } finally {
    loadingInvoice.value = false;
  }
}

async function refreshInvoicesSelect() {
  try {
    const invoiceResponse = await InvoicesService.browse({
      page: 1,
      pageSize: 500,
    });

    const availableInvoices = (invoiceResponse ?? []).filter(
      (invoice) =>
        !isPaidInvoice(invoice) && Number(invoice.pendingAmount ?? 0) > 0,
    );

    invoices.value = availableInvoices.map(mapInvoiceToSelectOption);
  } catch {
    // silencioso a propósito
  }
}

async function submit() {
  const normalizedInvoiceId = invoiceId.value.trim();
  const normalizedClientId = clientId.value.trim();
  const normalizedPaymentMethodId = paymentMethodId.value.trim();
  const normalizedPaymentDate = toIsoDate(paymentDate.value);

  if (
    !normalizedInvoiceId ||
    !normalizedClientId ||
    !normalizedPaymentMethodId ||
    !normalizedPaymentDate
  ) {
    modalStore.onError?.({
      code: 400,
      message: t("payments.validation.requiredHeader"),
    });
    return;
  }

  if (!selectedInvoice.value) {
    modalStore.onError?.({
      code: 400,
      message: t("payments.validation.invoiceRequired"),
    });
    return;
  }

  if (isPaidInvoice(selectedInvoice.value)) {
    modalStore.onError?.({
      code: 400,
      message: t("payments.validation.invoiceAlreadyPaid"),
    });
    return;
  }

  loading.value = true;

  try {
    if (mode.value === "cash") {
      const tendered = Number(amountTendered.value ?? 0);

      if (Number.isNaN(tendered) || tendered < pendingAmount.value) {
        throw new Error(t("payments.validation.cashInsufficient"));
      }

      const result = await PaymentsService.registerPaymentCash({
        invoiceId: normalizedInvoiceId,
        clientId: normalizedClientId,
        paymentMethodId: normalizedPaymentMethodId,
        paymentDate: normalizedPaymentDate,
        amountTendered: tendered,
        notes: notes.value.trim() || null,
      });

      await refreshInvoicesSelect();
      modalStore.onSuccess?.(result);
      modalStore.close();
      return;
    }

    if (mode.value === "transfer") {
      const applied = Number(amount.value ?? 0);

      if (Number.isNaN(applied) || applied <= 0) {
        throw new Error(t("payments.validation.amountRequired"));
      }

      const result = await PaymentsService.registerPaymentTransfer({
        invoiceId: normalizedInvoiceId,
        clientId: normalizedClientId,
        paymentMethodId: normalizedPaymentMethodId,
        paymentDate: normalizedPaymentDate,
        amount: applied,
        reference: reference.value.trim(),
        isBankConfirmed: isBankConfirmed.value,
        notes: notes.value.trim() || null,
      });

      await refreshInvoicesSelect();
      modalStore.onSuccess?.(result);
      modalStore.close();
      return;
    }

    if (mode.value === "card") {
      const applied = Number(amount.value ?? 0);

      if (Number.isNaN(applied) || applied <= 0) {
        throw new Error(t("payments.validation.amountRequired"));
      }

      const result = await PaymentsService.registerPaymentCard({
        invoiceId: normalizedInvoiceId,
        clientId: normalizedClientId,
        paymentMethodId: normalizedPaymentMethodId,
        paymentDate: normalizedPaymentDate,
        amount: applied,
        isPosAvailable: isPosAvailable.value,
        isApproved: isApproved.value,
        posAuthCode: posAuthCode.value.trim(),
        notes: notes.value.trim() || null,
      });

      await refreshInvoicesSelect();
      modalStore.onSuccess?.(result);
      modalStore.close();
      return;
    }

    const partialAmount = Number(amount.value ?? 0);

    if (Number.isNaN(partialAmount) || partialAmount <= 0) {
      throw new Error(t("payments.validation.amountRequired"));
    }

    if (partialAmount > pendingAmount.value) {
      throw new Error(t("payments.validation.partialExceedsBalance"));
    }

    const result = await PaymentsService.registerPartialPayment({
      invoiceId: normalizedInvoiceId,
      clientId: normalizedClientId,
      paymentMethodId: normalizedPaymentMethodId,
      paymentDate: normalizedPaymentDate,
      amount: partialAmount,
      reference: reference.value.trim(),
      notes: notes.value.trim() || null,
    });

    await refreshInvoicesSelect();
    modalStore.onSuccess?.(result);
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("payments.messages.registerError"),
    });
  } finally {
    loading.value = false;
  }
}

watch(invoiceId, async () => {
  await loadInvoice();
});

watch(mode, () => {
  applyDefaultPaymentMethod(true);

  if (!selectedInvoice.value) return;

  if (mode.value === "cash") {
    amountTendered.value = Number(selectedInvoice.value.pendingAmount ?? 0);
    amount.value = null;
  } else {
    amount.value = Number(selectedInvoice.value.pendingAmount ?? 0);
    amountTendered.value = null;
  }
});

onMounted(async () => {
  paymentDate.value = getNowForInput();
  await loadCatalogs();
});
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-3xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("payments.modal.title") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("payments.modal.description") }}
      </p>
    </div>

    <div
      v-if="loadingCatalogs"
      class="py-bt-spacing-24 text-center text-bt-grey-500"
    >
      {{ $t("common.loading") }}
    </div>

    <div v-else class="space-y-bt-spacing-24">
      <div class="flex flex-wrap gap-bt-spacing-8">
        <button
          v-for="item in ['cash', 'transfer', 'card', 'partial']"
          :key="item"
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m transition"
          :class="
            mode === item
              ? 'bg-bt-primary-500 text-bt-white'
              : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'
          "
          @click="mode = item as PaymentMode"
        >
          {{ $t(`payments.modes.${item}`) }}
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("payments.fields.invoice") }}
          </label>
          <select
            v-model="invoiceId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">
              {{ $t("payments.placeholders.selectInvoice") }}
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

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("payments.fields.client") }}
          </label>
          <select
            v-model="clientId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">
              {{ $t("payments.placeholders.selectClient") }}
            </option>
            <option
              v-for="client in clients"
              :key="client.id"
              :value="client.id"
            >
              {{ client.label }}
            </option>
          </select>
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("payments.fields.paymentMethod") }}
          </label>
          <select
            v-model="paymentMethodId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">
              {{ $t("payments.placeholders.selectPaymentMethod") }}
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

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("payments.fields.paymentDate") }}
          </label>
          <input
            v-model="paymentDate"
            type="datetime-local"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>
      </div>

      <div
        class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
      >
        <div
          class="flex flex-col md:flex-row md:items-center md:justify-between gap-bt-spacing-12"
        >
          <div>
            <div class="text-sm text-bt-grey-500">
              {{ $t("payments.fields.pendingAmount") }}
            </div>
            <div class="text-2xl font-bt-bold text-bt-primary-700">
              {{ loadingInvoice ? "..." : formatMoney(pendingAmount) }}
            </div>
          </div>

          <div v-if="mode === 'cash'">
            <div class="text-sm text-bt-grey-500">
              {{ $t("payments.fields.changeAmount") }}
            </div>
            <div class="text-2xl font-bt-bold text-bt-success-700">
              {{ formatMoney(changeAmount) }}
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="mode === 'cash'"
        class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16"
      >
        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("payments.fields.amountTendered") }}
          </label>
          <input
            v-model.number="amountTendered"
            type="number"
            min="0"
            step="0.01"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("payments.fields.notes") }}
          </label>
          <input
            v-model="notes"
            type="text"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>
      </div>

      <div
        v-else-if="mode === 'transfer'"
        class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16"
      >
        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("payments.fields.amount") }}
          </label>
          <input
            v-model.number="amount"
            type="number"
            min="0"
            step="0.01"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("payments.fields.reference") }}
          </label>
          <input
            v-model="reference"
            type="text"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <label
          class="inline-flex items-center gap-bt-spacing-8 text-bt-primary-700"
        >
          <input v-model="isBankConfirmed" type="checkbox" />
          <span>{{ $t("payments.fields.isBankConfirmed") }}</span>
        </label>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("payments.fields.notes") }}
          </label>
          <input
            v-model="notes"
            type="text"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>
      </div>

      <div
        v-else-if="mode === 'card'"
        class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16"
      >
        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("payments.fields.amount") }}
          </label>
          <input
            v-model.number="amount"
            type="number"
            min="0"
            step="0.01"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("payments.fields.posAuthCode") }}
          </label>
          <input
            v-model="posAuthCode"
            type="text"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <label
          class="inline-flex items-center gap-bt-spacing-8 text-bt-primary-700"
        >
          <input v-model="isPosAvailable" type="checkbox" />
          <span>{{ $t("payments.fields.isPosAvailable") }}</span>
        </label>

        <label
          class="inline-flex items-center gap-bt-spacing-8 text-bt-primary-700"
        >
          <input v-model="isApproved" type="checkbox" />
          <span>{{ $t("payments.fields.isApproved") }}</span>
        </label>

        <div class="md:col-span-2">
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("payments.fields.notes") }}
          </label>
          <input
            v-model="notes"
            type="text"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("payments.fields.amount") }}
          </label>
          <input
            v-model.number="amount"
            type="number"
            min="0"
            step="0.01"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("payments.fields.reference") }}
          </label>
          <input
            v-model="reference"
            type="text"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div class="md:col-span-2">
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("payments.fields.notes") }}
          </label>
          <input
            v-model="notes"
            type="text"
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
          :disabled="loading"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
          @click="submit"
        >
          {{ loading ? $t("common.loading") : $t("payments.actions.register") }}
        </button>
      </div>
    </div>
  </div>
</template>
