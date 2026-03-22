<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { AccountingService } from "@/core/services/accountingService";
import { SelectService } from "@/core/services/selectService";

import { useModalStore } from "@/core/stores/modalStore";
import { useToastStore } from "@/core/stores/toastStore";

import type { SelectOption } from "@/core/interfaces/select";

const { t } = useI18n();
const modalStore = useModalStore();
const toastStore = useToastStore();

const loading = ref(false);
const loadingCatalogs = ref(false);

const suppliers = ref<SelectOption[]>([]);

const amount = ref<number | null>(null);
const detail = ref("");
const category = ref("Operating Expense");
const entryDateLocal = ref("");
const supplierId = ref("");
const receiptFileS3Key = ref("");

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

function toUtcIsoString(localDateTime: string): string {
  if (!localDateTime) {
    return "";
  }

  const date = new Date(localDateTime);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString();
}

async function loadCatalogs() {
  loadingCatalogs.value = true;

  try {
    suppliers.value =
      (await SelectService.selectSuppliers({ onlyActive: true })) ?? [];
  } catch (error: any) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: error?.message ?? t("accounting.messages.loadCatalogsError"),
    });
  } finally {
    loadingCatalogs.value = false;
  }
}

async function submit() {
  const normalizedAmount = Number(amount.value ?? 0);
  const normalizedDetail = detail.value.trim();
  const normalizedCategory = category.value.trim();
  const normalizedEntryDateUtc = toUtcIsoString(entryDateLocal.value);
  const normalizedSupplierId = supplierId.value.trim();
  const normalizedReceiptFileS3Key = receiptFileS3Key.value.trim() || null;

  if (
    Number.isNaN(normalizedAmount) ||
    normalizedAmount <= 0 ||
    !normalizedDetail ||
    !normalizedCategory ||
    !normalizedEntryDateUtc ||
    !normalizedSupplierId
  ) {
    modalStore.onError?.({
      code: 400,
      message: t("accounting.validation.requiredExpense"),
    });
    return;
  }

  loading.value = true;

  try {
    const created = await AccountingService.createExpense({
      amount: normalizedAmount,
      detail: normalizedDetail,
      category: normalizedCategory,
      entryDateUtc: normalizedEntryDateUtc,
      supplierId: normalizedSupplierId,
      receiptFileS3Key: normalizedReceiptFileS3Key,
    });

    modalStore.onSuccess?.(created);
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("accounting.messages.createExpenseError"),
    });
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  entryDateLocal.value = getNowForInput();
  await loadCatalogs();
});
</script>

<template>
  <div
    class="w-full max-w-3xl rounded-l bg-bt-white p-bt-spacing-24 shadow-bt-elevation-400"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("accounting.modal.expenseTitle") }}
      </h2>
      <p class="mt-bt-spacing-8 text-bt-grey-600">
        {{ $t("accounting.modal.expenseDescription") }}
      </p>
    </div>

    <div
      v-if="loadingCatalogs"
      class="py-bt-spacing-24 text-center text-bt-grey-500"
    >
      {{ $t("common.loading") }}
    </div>

    <div v-else class="grid grid-cols-1 gap-bt-spacing-16 md:grid-cols-2">
      <div>
        <label class="mb-bt-spacing-8 block text-sm text-bt-primary-700">
          {{ $t("accounting.fields.amount") }}
        </label>
        <input
          v-model.number="amount"
          type="number"
          min="0"
          step="0.01"
          class="w-full rounded-m border border-bt-grey-300 px-bt-spacing-16 py-bt-spacing-12 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="mb-bt-spacing-8 block text-sm text-bt-primary-700">
          {{ $t("accounting.fields.entryDate") }}
        </label>
        <input
          v-model="entryDateLocal"
          type="datetime-local"
          class="w-full rounded-m border border-bt-grey-300 px-bt-spacing-16 py-bt-spacing-12 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="mb-bt-spacing-8 block text-sm text-bt-primary-700">
          {{ $t("accounting.fields.supplier") }}
        </label>
        <select
          v-model="supplierId"
          class="w-full rounded-m border border-bt-grey-300 bg-bt-white px-bt-spacing-16 py-bt-spacing-12 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">
            {{ $t("accounting.placeholders.selectSupplier") }}
          </option>
          <option
            v-for="supplier in suppliers"
            :key="supplier.id"
            :value="supplier.id"
          >
            {{ supplier.label }}
          </option>
        </select>
      </div>

      <div>
        <label class="mb-bt-spacing-8 block text-sm text-bt-primary-700">
          {{ $t("accounting.fields.receiptFileS3Key") }}
        </label>
        <input
          v-model="receiptFileS3Key"
          type="text"
          class="w-full rounded-m border border-bt-grey-300 px-bt-spacing-16 py-bt-spacing-12 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div class="md:col-span-2">
        <label class="mb-bt-spacing-8 block text-sm text-bt-primary-700">
          {{ $t("accounting.fields.category") }}
        </label>
        <input
          v-model="category"
          type="text"
          class="w-full rounded-m border border-bt-grey-300 px-bt-spacing-16 py-bt-spacing-12 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div class="md:col-span-2">
        <label class="mb-bt-spacing-8 block text-sm text-bt-primary-700">
          {{ $t("accounting.fields.detail") }}
        </label>
        <textarea
          v-model="detail"
          rows="4"
          class="w-full rounded-m border border-bt-grey-300 px-bt-spacing-16 py-bt-spacing-12 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>
    </div>

    <div class="mt-bt-spacing-24 flex justify-end gap-bt-spacing-12">
      <button
        type="button"
        class="rounded-m bg-bt-grey-200 px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 hover:bg-bt-grey-300"
        @click="closeModal"
      >
        {{ $t("common.cancel") }}
      </button>

      <button
        type="button"
        :disabled="loading"
        class="rounded-m bg-bt-error-500 px-bt-spacing-16 py-bt-spacing-12 text-bt-white hover:bg-bt-error-700 disabled:bg-bt-disabled"
        @click="submit"
      >
        {{ loading ? $t("common.loading") : $t("common.save") }}
      </button>
    </div>
  </div>
</template>
