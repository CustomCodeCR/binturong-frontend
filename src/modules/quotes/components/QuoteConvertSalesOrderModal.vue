<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { SelectService } from "@/core/services/selectService";
import { SalesOrdersService } from "@/core/services/salesOrdersService";

import type { SelectOption } from "@/core/interfaces/select";

const props = defineProps<{
  quoteId: string;
  quoteStatus: string;
  quoteValidUntil?: string | null;
  branchId?: string | null;
  currency?: string | null;
  exchangeRate?: number | null;
  notes?: string | null;
}>();

const { t } = useI18n();
const modalStore = useModalStore();

const loading = ref(false);
const loadingBranches = ref(false);

const branchId = ref("");
const branchSearch = ref("");
const branchOptions = ref<SelectOption[]>([]);

const currency = ref("CRC");
const exchangeRate = ref(1);
const notes = ref("");

const selectedBranch = computed(() => {
  return branchOptions.value.find((item) => item.id === branchId.value) ?? null;
});

function closeModal() {
  modalStore.close();
}

function isAcceptedStatus(status?: string | null): boolean {
  return (
    String(status ?? "")
      .trim()
      .toLowerCase() === "accepted"
  );
}

function isQuoteExpired(validUntil?: string | null): boolean {
  if (!validUntil) return false;

  const date = new Date(validUntil);
  if (Number.isNaN(date.getTime())) return false;

  return date.getTime() < Date.now();
}

async function loadBranches(searchText?: string) {
  loadingBranches.value = true;

  try {
    const options = await SelectService.selectBranches({
      search: searchText?.trim() || undefined,
      onlyActive: true,
    });

    branchOptions.value = Array.isArray(options) ? options : [];

    if (
      branchId.value &&
      !branchOptions.value.some((item) => item.id === branchId.value)
    ) {
      branchOptions.value = [
        ...branchOptions.value,
        {
          id: branchId.value,
          label: selectedBranch.value?.label ?? branchId.value,
        },
      ];
    }
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message:
        error?.message ??
        t("quotes.convertSalesOrder.validation.branchLoadError"),
    });
  } finally {
    loadingBranches.value = false;
  }
}

async function submit() {
  if (!isAcceptedStatus(props.quoteStatus)) {
    modalStore.onError?.({
      code: 400,
      message: t("quotes.convertSalesOrder.validation.notAccepted"),
    });
    return;
  }

  if (isQuoteExpired(props.quoteValidUntil)) {
    modalStore.onError?.({
      code: 400,
      message: t("quotes.convertSalesOrder.validation.expired"),
    });
    return;
  }

  if (
    !branchId.value ||
    !currency.value.trim() ||
    Number(exchangeRate.value) <= 0
  ) {
    modalStore.onError?.({
      code: 400,
      message: t("quotes.convertSalesOrder.validation.required"),
    });
    return;
  }

  loading.value = true;

  try {
    const created = await SalesOrdersService.fromQuote(props.quoteId, {
      branchId: branchId.value,
      currency: currency.value.trim().toUpperCase(),
      exchangeRate: Number(exchangeRate.value),
      notes: notes.value.trim(),
    });

    modalStore.onSuccess?.(created);
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("quotes.messages.convertSalesOrderError"),
    });
  } finally {
    loading.value = false;
  }
}

watch(
  () => branchSearch.value,
  async (value) => {
    await loadBranches(value);
  },
);

onMounted(async () => {
  branchId.value = props.branchId ?? "";
  currency.value = props.currency?.trim() || "CRC";
  exchangeRate.value = Number(props.exchangeRate ?? 1);
  notes.value = props.notes?.trim() ?? "";

  await loadBranches();
});
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-4xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("quotes.convertSalesOrder.modal.title") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("quotes.convertSalesOrder.modal.description") }}
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
      <div class="md:col-span-2">
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("quotes.convertSalesOrder.fields.branchSearch") }}
        </label>
        <input
          v-model="branchSearch"
          type="text"
          :placeholder="
            $t('quotes.convertSalesOrder.fields.branchSearchPlaceholder')
          "
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div class="md:col-span-2">
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("quotes.convertSalesOrder.fields.branch") }}
        </label>

        <select
          v-model="branchId"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">
            {{ $t("quotes.convertSalesOrder.fields.branchPlaceholder") }}
          </option>

          <option
            v-for="option in branchOptions"
            :key="option.id"
            :value="option.id"
          >
            {{ option.label }}
          </option>
        </select>

        <p
          v-if="loadingBranches"
          class="mt-bt-spacing-8 text-sm text-bt-grey-500"
        >
          {{ $t("common.loading") }}
        </p>
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("quotes.convertSalesOrder.fields.currency") }}
        </label>
        <input
          v-model="currency"
          type="text"
          maxlength="10"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("quotes.convertSalesOrder.fields.exchangeRate") }}
        </label>
        <input
          v-model.number="exchangeRate"
          type="number"
          min="0.000001"
          step="0.000001"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div class="md:col-span-2">
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("quotes.convertSalesOrder.fields.notes") }}
        </label>
        <textarea
          v-model="notes"
          rows="4"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
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
        :disabled="loading"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 disabled:bg-bt-disabled"
        @click="submit"
      >
        {{
          loading
            ? $t("common.loading")
            : $t("quotes.convertSalesOrder.actions.confirm")
        }}
      </button>
    </div>
  </div>
</template>
