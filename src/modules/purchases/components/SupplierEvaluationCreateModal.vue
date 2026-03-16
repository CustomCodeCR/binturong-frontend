<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { SupplierEvaluationsService } from "@/core/services/supplierEvaluationsService";
import { SelectService } from "@/core/services/selectService";

import type { SelectOption } from "@/core/interfaces/select";

const props = defineProps<{
  initialSupplierId?: string | null;
}>();

const { t } = useI18n();
const modalStore = useModalStore();

const suppliers = ref<SelectOption[]>([]);

const supplierId = ref(props.initialSupplierId?.trim() ?? "");
const score = ref<number | null>(null);
const comment = ref("");
const evaluatedAtUtc = ref("");

const loading = ref(false);
const loadingCatalogs = ref(false);

const shouldShowSupplierSelect = computed(() => !props.initialSupplierId);

function closeModal() {
  modalStore.close();
}

function getLocalDateTimeForInput(date = new Date()): string {
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

  let normalized = localDateTime.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    normalized = `${normalized}T00:00`;
  }

  const localDate = new Date(normalized);

  if (Number.isNaN(localDate.getTime())) {
    return "";
  }

  return localDate.toISOString();
}

async function loadCatalogs() {
  if (!shouldShowSupplierSelect.value) {
    return;
  }

  loadingCatalogs.value = true;

  try {
    suppliers.value =
      (await SelectService.selectSuppliers({ onlyActive: true })) ?? [];
  } catch (error: any) {
    console.error("Load suppliers error:", error);

    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("common.errors.loadData"),
    });
  } finally {
    loadingCatalogs.value = false;
  }
}

async function submit() {
  const normalizedSupplierId = supplierId.value.trim();
  const normalizedScore = score.value === null ? null : Number(score.value);
  const normalizedEvaluatedAtUtc = toUtcIsoString(evaluatedAtUtc.value);
  const normalizedComment = comment.value.trim();

  console.log("submit evaluation debug", {
    supplierIdRaw: supplierId.value,
    supplierIdNormalized: normalizedSupplierId,
    scoreRaw: score.value,
    scoreNormalized: normalizedScore,
    evaluatedAtUtcRaw: evaluatedAtUtc.value,
    evaluatedAtUtcNormalized: normalizedEvaluatedAtUtc,
    commentRaw: comment.value,
    commentNormalized: normalizedComment,
    initialSupplierId: props.initialSupplierId,
  });

  if (
    !normalizedSupplierId ||
    normalizedScore === null ||
    Number.isNaN(normalizedScore) ||
    !normalizedEvaluatedAtUtc
  ) {
    modalStore.onError?.({
      code: 400,
      message: t("purchases.evaluations.validation.required"),
    });
    return;
  }

  if (normalizedScore < 0 || normalizedScore > 100) {
    modalStore.onError?.({
      code: 400,
      message: t("purchases.evaluations.validation.invalidScore"),
    });
    return;
  }

  loading.value = true;

  try {
    const payload = {
      supplierId: normalizedSupplierId,
      score: normalizedScore,
      comment: normalizedComment,
      evaluatedAtUtc: normalizedEvaluatedAtUtc,
    };

    console.log("Supplier evaluation payload:", payload);

    const created = await SupplierEvaluationsService.create(payload);

    modalStore.onSuccess?.(created);
    modalStore.close();
  } catch (error: any) {
    console.error("Create supplier evaluation error:", error);

    modalStore.onError?.({
      code: error?.status ?? 500,
      message:
        error?.response?.data?.message ??
        error?.message ??
        t("purchases.evaluations.messages.createError"),
    });
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  evaluatedAtUtc.value = getLocalDateTimeForInput();
  await loadCatalogs();
});
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-2xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("purchases.evaluations.modal.createTitle") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{
          shouldShowSupplierSelect
            ? $t("purchases.evaluations.modal.createDescription")
            : $t("suppliers.evaluations.modal.createDescription")
        }}
      </p>
    </div>

    <div
      v-if="loadingCatalogs"
      class="py-bt-spacing-24 text-center text-bt-grey-500"
    >
      {{ $t("common.loading") }}
    </div>

    <div v-else class="grid grid-cols-1 gap-bt-spacing-16">
      <div v-if="shouldShowSupplierSelect">
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("purchases.evaluations.fields.supplier") }}
        </label>
        <select
          v-model="supplierId"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">
            {{ $t("purchases.evaluations.placeholders.selectSupplier") }}
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
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("purchases.evaluations.fields.score") }}
        </label>
        <input
          v-model.number="score"
          type="number"
          min="0"
          max="100"
          step="1"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("purchases.evaluations.fields.evaluatedAt") }}
        </label>
        <input
          v-model="evaluatedAtUtc"
          type="datetime-local"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("purchases.evaluations.fields.comment") }}
        </label>
        <textarea
          v-model="comment"
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
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-warning-500 text-bt-white hover:bg-bt-warning-700 disabled:bg-bt-disabled"
        @click="submit"
      >
        {{ loading ? $t("common.loading") : $t("common.save") }}
      </button>
    </div>
  </div>
</template>
