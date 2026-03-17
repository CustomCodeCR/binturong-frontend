<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { InvoicesService } from "@/core/services/invoicesService";
import { SelectService } from "@/core/services/selectService";

import type { SelectOption } from "@/core/interfaces/select";

const props = defineProps<{
  quoteId: string;
  quoteStatus: string;
}>();

const { t } = useI18n();
const modalStore = useModalStore();

const branches = ref<SelectOption[]>([]);

const branchId = ref("");
const issueDate = ref("");
const documentType = ref("INVOICE");
const mode = ref("normal");

const loadingCatalogs = ref(false);
const loading = ref(false);

function closeModal() {
  modalStore.close();
}

function getLocalDateForInput(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toUtcIsoString(dateText: string): string {
  if (!dateText) {
    return "";
  }

  let normalized = dateText.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    normalized = `${normalized}T00:00:00`;
  }

  const localDate = new Date(normalized);

  if (Number.isNaN(localDate.getTime())) {
    return "";
  }

  return localDate.toISOString();
}

async function loadCatalogs() {
  loadingCatalogs.value = true;

  try {
    branches.value = await SelectService.selectBranches({ onlyActive: true });
  } finally {
    loadingCatalogs.value = false;
  }
}

async function submit() {
  if (props.quoteStatus.toLowerCase() !== "accepted") {
    modalStore.onError?.({
      code: 400,
      message: t("quotes.convertInvoice.validation.notAccepted"),
    });
    return;
  }

  const normalizedBranchId = branchId.value.trim();
  const normalizedIssueDate = toUtcIsoString(issueDate.value);
  const normalizedDocumentType = "INVOICE";
  const normalizedMode = "normal";

  if (!normalizedBranchId || !normalizedIssueDate) {
    modalStore.onError?.({
      code: 400,
      message: t("quotes.convertInvoice.validation.required"),
    });
    return;
  }

  loading.value = true;

  try {
    const created = await InvoicesService.convertFromQuote(props.quoteId, {
      branchId: normalizedBranchId,
      issueDate: normalizedIssueDate,
      documentType: normalizedDocumentType,
      mode: normalizedMode,
    });

    modalStore.onSuccess?.(created);
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("quotes.messages.convertInvoiceError"),
    });
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  issueDate.value = getLocalDateForInput();
  await loadCatalogs();
});
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-3xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("quotes.convertInvoice.modal.title") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("quotes.convertInvoice.modal.description") }}
      </p>
    </div>

    <div
      v-if="loadingCatalogs"
      class="py-bt-spacing-24 text-center text-bt-grey-500"
    >
      {{ $t("common.loading") }}
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("quotes.convertInvoice.fields.branch") }}
        </label>
        <select
          v-model="branchId"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">
            {{ $t("quotes.convertInvoice.placeholders.selectBranch") }}
          </option>
          <option
            v-for="branch in branches"
            :key="branch.id"
            :value="branch.id"
          >
            {{ branch.label }}
          </option>
        </select>
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("quotes.convertInvoice.fields.issueDate") }}
        </label>
        <input
          v-model="issueDate"
          type="date"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("quotes.convertInvoice.fields.documentType") }}
        </label>
        <input
          :value="documentType"
          type="text"
          disabled
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-grey-100 text-bt-grey-700"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("quotes.convertInvoice.fields.mode") }}
        </label>
        <input
          :value="mode"
          type="text"
          disabled
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-grey-100 text-bt-grey-700"
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
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
        @click="submit"
      >
        {{
          loading
            ? $t("common.loading")
            : $t("quotes.convertInvoice.actions.confirm")
        }}
      </button>
    </div>
  </div>
</template>
