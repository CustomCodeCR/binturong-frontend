<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { useAuthStore } from "@/core/stores/authStore";
import { ContractsService } from "@/core/services/contractsService";

const props = defineProps<{
  quoteId: string;
  quoteStatus: string;
}>();

const { t } = useI18n();
const modalStore = useModalStore();
const authStore = useAuthStore();

const startDate = ref("");
const endDate = ref("");
const description = ref("");
const notes = ref("");
const autoRenewEnabled = ref(false);
const autoRenewEveryDays = ref(30);
const expiryNoticeDays = ref(10);

const loading = ref(false);

const responsibleUserId = computed(() => authStore.userId ?? "");
const responsibleUserLabel = computed(() => {
  return (
    authStore.employeeFullName || authStore.username || authStore.email || "-"
  );
});

function closeModal() {
  modalStore.close();
}

function getLocalDateForInput(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateText: string, days: number): string {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + days);
  return getLocalDateForInput(date);
}

async function submit() {
  if (props.quoteStatus.toLowerCase() !== "accepted") {
    modalStore.onError?.({
      code: 400,
      message: t("quotes.convertContract.validation.notAccepted"),
    });
    return;
  }

  if (!responsibleUserId.value) {
    modalStore.onError?.({
      code: 400,
      message: t("quotes.convertContract.validation.required"),
    });
    return;
  }

  if (!startDate.value || !endDate.value || !description.value.trim()) {
    modalStore.onError?.({
      code: 400,
      message: t("quotes.convertContract.validation.required"),
    });
    return;
  }

  loading.value = true;

  try {
    const created = await ContractsService.convertFromQuote(props.quoteId, {
      startDate: startDate.value,
      endDate: endDate.value,
      responsibleUserId: responsibleUserId.value,
      description: description.value.trim(),
      notes: notes.value.trim(),
      autoRenewEnabled: autoRenewEnabled.value,
      autoRenewEveryDays: Number(autoRenewEveryDays.value),
      expiryNoticeDays: Number(expiryNoticeDays.value),
    });

    modalStore.onSuccess?.(created);
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("quotes.messages.convertContractError"),
    });
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  startDate.value = getLocalDateForInput();
  endDate.value = addDays(startDate.value, 30);
});
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-4xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("quotes.convertContract.modal.title") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("quotes.convertContract.modal.description") }}
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("quotes.convertContract.fields.startDate") }}
        </label>
        <input
          v-model="startDate"
          type="date"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("quotes.convertContract.fields.endDate") }}
        </label>
        <input
          v-model="endDate"
          type="date"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div class="md:col-span-2">
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("quotes.convertContract.fields.responsibleUser") }}
        </label>
        <input
          :value="responsibleUserLabel"
          type="text"
          disabled
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-grey-100 text-bt-grey-700"
        />
      </div>

      <div class="md:col-span-2">
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("quotes.convertContract.fields.description") }}
        </label>
        <textarea
          v-model="description"
          rows="3"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div class="md:col-span-2">
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("quotes.convertContract.fields.notes") }}
        </label>
        <textarea
          v-model="notes"
          rows="3"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div class="flex items-center gap-bt-spacing-8">
        <input v-model="autoRenewEnabled" type="checkbox" />
        <span class="text-bt-primary-700">
          {{ $t("quotes.convertContract.fields.autoRenewEnabled") }}
        </span>
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("quotes.convertContract.fields.autoRenewEveryDays") }}
        </label>
        <input
          v-model.number="autoRenewEveryDays"
          type="number"
          min="1"
          step="1"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("quotes.convertContract.fields.expiryNoticeDays") }}
        </label>
        <input
          v-model.number="expiryNoticeDays"
          type="number"
          min="1"
          step="1"
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
            : $t("quotes.convertContract.actions.confirm")
        }}
      </button>
    </div>
  </div>
</template>
