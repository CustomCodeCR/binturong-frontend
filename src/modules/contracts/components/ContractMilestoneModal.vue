<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { ContractsService } from "@/core/services/contractsService";
import { SelectService } from "@/core/services/selectService";

import type { ContractMilestone } from "@/core/interfaces/contracts";
import type { SelectOption } from "@/core/interfaces/select";

const props = defineProps<{
  contractId: string;
  milestone?: ContractMilestone | null;
}>();

const { t } = useI18n();
const modalStore = useModalStore();

const loading = ref(false);
const loadingCatalogs = ref(false);

const invoices = ref<SelectOption[]>([]);

const description = ref(props.milestone?.description ?? "");
const percentage = ref<number | null>(props.milestone?.percentage ?? 0);
const amount = ref<number | null>(props.milestone?.amount ?? 0);
const scheduledDate = ref(toDateInputValue(props.milestone?.scheduledDate));
const isBilled = ref(props.milestone?.isBilled ?? false);
const invoiceId = ref(props.milestone?.invoiceId ?? "");

const isEdit = !!props.milestone?.milestoneId;

function closeModal() {
  modalStore.close();
}

function toDateInputValue(value?: string | null): string {
  if (!value) {
    return "";
  }

  const normalized = String(value).trim();

  if (!normalized) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return normalized.length >= 10 ? normalized.slice(0, 10) : normalized;
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

async function loadCatalogs() {
  if (!isEdit) {
    return;
  }

  loadingCatalogs.value = true;

  try {
    const invoicesResponse = await SelectService.selectInvoices();
    invoices.value = invoicesResponse ?? [];
  } catch (error: any) {
    console.error("Load invoices select error:", error);

    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("common.errors.loadData"),
    });
  } finally {
    loadingCatalogs.value = false;
  }
}

async function submit() {
  if (
    !description.value.trim() ||
    percentage.value === null ||
    amount.value === null ||
    !scheduledDate.value
  ) {
    modalStore.onError?.({
      code: 400,
      message: t("contracts.milestones.validation.required"),
    });
    return;
  }

  loading.value = true;

  try {
    if (isEdit && props.milestone?.milestoneId) {
      await ContractsService.updateMilestone(
        props.contractId,
        props.milestone.milestoneId,
        {
          description: description.value.trim(),
          percentage: Number(percentage.value),
          amount: Number(amount.value),
          scheduledDate: scheduledDate.value,
          isBilled: isBilled.value,
          invoiceId: invoiceId.value.trim() || null,
        },
      );
    } else {
      await ContractsService.addMilestone(props.contractId, {
        description: description.value.trim(),
        percentage: Number(percentage.value),
        amount: Number(amount.value),
        scheduledDate: scheduledDate.value,
      });
    }

    modalStore.onSuccess?.({ ok: true });
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message:
        error?.message ??
        (isEdit
          ? t("contracts.milestones.messages.updateError")
          : t("contracts.milestones.messages.createError")),
    });
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadCatalogs();
});
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-3xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{
          isEdit
            ? $t("contracts.milestones.modal.editTitle")
            : $t("contracts.milestones.modal.createTitle")
        }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{
          isEdit
            ? $t("contracts.milestones.modal.editDescription")
            : $t("contracts.milestones.modal.createDescription")
        }}
      </p>
    </div>

    <div
      v-if="loadingCatalogs"
      class="py-bt-spacing-24 text-center text-bt-grey-500"
    >
      {{ $t("common.loading") }}
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
      <div class="md:col-span-2">
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("contracts.milestones.fields.description") }}
        </label>
        <input
          v-model="description"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("contracts.milestones.fields.percentage") }}
        </label>
        <input
          v-model.number="percentage"
          type="number"
          min="0"
          step="0.01"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("contracts.milestones.fields.amount") }}
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
          {{ $t("contracts.milestones.fields.scheduledDate") }}
        </label>
        <input
          v-model="scheduledDate"
          type="date"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <template v-if="isEdit">
        <div class="flex items-center gap-bt-spacing-8 pt-bt-spacing-32">
          <input v-model="isBilled" type="checkbox" />
          <span class="text-bt-primary-700">
            {{ $t("contracts.milestones.fields.isBilled") }}
          </span>
        </div>

        <div class="md:col-span-2">
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("contracts.milestones.fields.invoiceId") }}
          </label>
          <select
            v-model="invoiceId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">
              {{ $t("contracts.milestones.placeholders.selectInvoice") }}
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
      </template>
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
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
        @click="submit"
      >
        {{ loading ? $t("common.loading") : $t("common.save") }}
      </button>
    </div>
  </div>
</template>
