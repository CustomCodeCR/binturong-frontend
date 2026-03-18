<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { useAuthStore } from "@/core/stores/authStore";
import { ContractsService } from "@/core/services/contractsService";
import { SelectService } from "@/core/services/selectService";

import type { Contract } from "@/core/interfaces/contracts";
import type { SelectOption } from "@/core/interfaces/select";

const props = defineProps<{
  contractId: string;
}>();

const { t } = useI18n();
const modalStore = useModalStore();
const authStore = useAuthStore();

const loading = ref(false);
const saving = ref(false);
const loadingCatalogs = ref(false);

const clients = ref<SelectOption[]>([]);
const quotes = ref<SelectOption[]>([]);
const salesOrders = ref<SelectOption[]>([]);
const contract = ref<Contract | null>(null);

const code = ref("");
const clientId = ref("");
const quoteId = ref("");
const salesOrderId = ref("");
const startDate = ref("");
const endDate = ref("");
const status = ref("");
const description = ref("");
const notes = ref("");

const autoRenewEnabled = ref(false);
const autoRenewEveryDays = ref(365);
const expiryNoticeDays = ref(30);

function closeModal() {
  modalStore.close();
}

function toDateInputValue(value?: string | null): string {
  if (!value) return "";

  const normalized = String(value).trim();
  if (!normalized) return "";

  return normalized.length >= 10 ? normalized.slice(0, 10) : normalized;
}

async function loadCatalogs() {
  loadingCatalogs.value = true;

  try {
    const [clientsResponse, quotesResponse, salesOrdersResponse] =
      await Promise.all([
        SelectService.selectClients({ onlyActive: true }),
        SelectService.selectQuotes(),
        SelectService.selectSalesOrders(),
      ]);

    clients.value = clientsResponse ?? [];
    quotes.value = quotesResponse ?? [];
    salesOrders.value = salesOrdersResponse ?? [];
  } catch (error: any) {
    console.error("Load contract catalogs error:", error);

    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("common.errors.loadData"),
    });
  } finally {
    loadingCatalogs.value = false;
  }
}

async function loadContract() {
  loading.value = true;

  try {
    const response = await ContractsService.readById(props.contractId);

    contract.value = response;

    code.value = response?.code ?? "";
    clientId.value = response?.clientId ?? "";
    quoteId.value = response?.quoteId ?? "";
    salesOrderId.value = response?.salesOrderId ?? "";
    startDate.value = toDateInputValue(response?.startDate);
    endDate.value = toDateInputValue(response?.endDate);
    status.value = response?.status ?? "";
    description.value = response?.description ?? "";
    notes.value = response?.notes ?? "";
    autoRenewEnabled.value = response?.autoRenewEnabled ?? false;
    autoRenewEveryDays.value = response?.autoRenewEveryDays ?? 365;
    expiryNoticeDays.value = response?.expiryNoticeDays ?? 30;
  } catch (error: any) {
    console.error("Load contract error:", error);

    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("contracts.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

async function submit() {
  const normalizedCode = code.value.trim();
  const normalizedClientId = clientId.value.trim();
  const normalizedQuoteId = quoteId.value.trim();
  const normalizedSalesOrderId = salesOrderId.value.trim();
  const normalizedStatus = status.value.trim();
  const normalizedDescription = description.value.trim();
  const normalizedNotes = notes.value.trim();
  const responsibleUserId = authStore.userId?.trim() ?? "";

  if (
    !normalizedCode ||
    !normalizedClientId ||
    !startDate.value ||
    !endDate.value ||
    !normalizedStatus ||
    !normalizedDescription ||
    !responsibleUserId
  ) {
    modalStore.onError?.({
      code: 400,
      message: t("contracts.validation.required"),
    });
    return;
  }

  if (normalizedDescription.length > 255 || normalizedNotes.length > 255) {
    modalStore.onError?.({
      code: 400,
      message: t("contracts.validation.maxLength"),
    });
    return;
  }

  if (new Date(endDate.value) < new Date(startDate.value)) {
    modalStore.onError?.({
      code: 400,
      message: t("contracts.validation.invalidRange"),
    });
    return;
  }

  if (expiryNoticeDays.value < 0) {
    modalStore.onError?.({
      code: 400,
      message: t("contracts.validation.invalidExpiryNoticeDays"),
    });
    return;
  }

  if (autoRenewEnabled.value && autoRenewEveryDays.value <= 0) {
    modalStore.onError?.({
      code: 400,
      message: t("contracts.validation.invalidAutoRenewEveryDays"),
    });
    return;
  }

  saving.value = true;

  try {
    await ContractsService.update(props.contractId, {
      code: normalizedCode,
      clientId: normalizedClientId,
      quoteId: normalizedQuoteId || undefined,
      salesOrderId: normalizedSalesOrderId || undefined,
      startDate: startDate.value,
      endDate: endDate.value,
      status: normalizedStatus,
      description: normalizedDescription,
      notes: normalizedNotes,
      responsibleUserId,
      autoRenewEnabled: autoRenewEnabled.value,
      autoRenewEveryDays: autoRenewEnabled.value
        ? Number(autoRenewEveryDays.value)
        : 365,
      expiryNoticeDays: Number(expiryNoticeDays.value),
    });

    modalStore.onSuccess?.({ ok: true });
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("contracts.messages.updateError"),
    });
  } finally {
    saving.value = false;
  }
}

watch(description, (value) => {
  if (value.length > 255) {
    description.value = value.slice(0, 255);
  }
});

watch(notes, (value) => {
  if (value.length > 255) {
    notes.value = value.slice(0, 255);
  }
});

onMounted(async () => {
  await authStore.initialize();
  await loadCatalogs();
  await loadContract();
});
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-5xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("contracts.modal.editTitle") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("contracts.modal.editDescription") }}
      </p>
    </div>

    <div
      v-if="loading || loadingCatalogs"
      class="py-bt-spacing-24 text-center text-bt-grey-500"
    >
      {{ $t("common.loading") }}
    </div>

    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-bt-spacing-16"
    >
      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("contracts.fields.code") }}
        </label>
        <input
          v-model="code"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("contracts.fields.client") }}
        </label>
        <select
          v-model="clientId"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">
            {{ $t("contracts.placeholders.selectClient") }}
          </option>
          <option v-for="client in clients" :key="client.id" :value="client.id">
            {{ client.label }}
          </option>
        </select>
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("contracts.fields.status") }}
        </label>
        <input
          v-model="status"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("contracts.fields.quoteId") }}
        </label>
        <select
          v-model="quoteId"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">
            {{ $t("contracts.placeholders.selectQuote") }}
          </option>
          <option v-for="quote in quotes" :key="quote.id" :value="quote.id">
            {{ quote.label }}
          </option>
        </select>
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("contracts.fields.salesOrderId") }}
        </label>
        <select
          v-model="salesOrderId"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">
            {{ $t("contracts.placeholders.selectSalesOrder") }}
          </option>
          <option
            v-for="salesOrder in salesOrders"
            :key="salesOrder.id"
            :value="salesOrder.id"
          >
            {{ salesOrder.label }}
          </option>
        </select>
      </div>

      <div></div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("contracts.fields.startDate") }}
        </label>
        <input
          v-model="startDate"
          type="date"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("contracts.fields.endDate") }}
        </label>
        <input
          v-model="endDate"
          type="date"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div class="flex items-center gap-bt-spacing-8 pt-bt-spacing-32">
        <input v-model="autoRenewEnabled" type="checkbox" />
        <span class="text-bt-primary-700">
          {{ $t("contracts.fields.autoRenewEnabled") }}
        </span>
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("contracts.fields.autoRenewEveryDays") }}
        </label>
        <input
          v-model.number="autoRenewEveryDays"
          type="number"
          min="1"
          step="1"
          :disabled="!autoRenewEnabled"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500 disabled:bg-bt-grey-100"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("contracts.fields.expiryNoticeDays") }}
        </label>
        <input
          v-model.number="expiryNoticeDays"
          type="number"
          min="0"
          step="1"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div class="md:col-span-2 xl:col-span-3">
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("contracts.fields.description") }}
        </label>
        <textarea
          v-model="description"
          rows="3"
          maxlength="255"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
        <p class="text-xs text-bt-grey-500 mt-bt-spacing-4 text-right">
          {{ description.length }}/255
        </p>
      </div>

      <div class="md:col-span-2 xl:col-span-3">
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("contracts.fields.notes") }}
        </label>
        <textarea
          v-model="notes"
          rows="3"
          maxlength="255"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
        <p class="text-xs text-bt-grey-500 mt-bt-spacing-4 text-right">
          {{ notes.length }}/255
        </p>
      </div>
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
        :disabled="saving"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
        @click="submit"
      >
        {{
          saving ? $t("common.loading") : $t("contracts.actions.saveChanges")
        }}
      </button>
    </div>
  </div>
</template>
