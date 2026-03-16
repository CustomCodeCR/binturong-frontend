<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { SupplierQuotesService } from "@/core/services/supplierQuotesService";
import { SelectService } from "@/core/services/selectService";

import type { SelectOption } from "@/core/interfaces/select";
import type { SupplierQuoteCreateLineRequest } from "@/core/interfaces/supplierQuotes";

const { t } = useI18n();
const modalStore = useModalStore();

const suppliers = ref<SelectOption[]>([]);
const branches = ref<SelectOption[]>([]);
const products = ref<SelectOption[]>([]);

const code = ref("");
const supplierId = ref("");
const branchId = ref("");
const requestedAtUtc = ref("");
const notes = ref("");

const lines = ref<SupplierQuoteCreateLineRequest[]>([
  {
    productId: "",
    quantity: 1,
  },
]);

const loadingCatalogs = ref(false);
const loading = ref(false);

function addLine() {
  lines.value.push({
    productId: "",
    quantity: 1,
  });
}

function removeLine(index: number) {
  lines.value.splice(index, 1);
}

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
  loadingCatalogs.value = true;

  try {
    const [suppliersResponse, branchesResponse, productsResponse] =
      await Promise.all([
        SelectService.selectSuppliers({ onlyActive: true }),
        SelectService.selectBranches({ onlyActive: true }),
        SelectService.selectProducts({ onlyActive: true }),
      ]);

    suppliers.value = suppliersResponse ?? [];
    branches.value = branchesResponse ?? [];
    products.value = productsResponse ?? [];
  } catch (error: any) {
    console.error("Load catalogs error:", error);

    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("common.errors.loadData"),
    });
  } finally {
    loadingCatalogs.value = false;
  }
}

async function submit() {
  const normalizedCode = code.value.trim();
  const normalizedSupplierId = supplierId.value.trim();
  const normalizedBranchId = branchId.value.trim();
  const normalizedRequestedAtUtc = toUtcIsoString(requestedAtUtc.value);

  const normalizedLines = lines.value.map((line) => ({
    productId: String(line.productId ?? "").trim(),
    quantity: Number(line.quantity),
  }));

  console.log("submit debug", {
    codeRaw: code.value,
    supplierIdRaw: supplierId.value,
    branchIdRaw: branchId.value,
    requestedAtUtcRaw: requestedAtUtc.value,
    requestedAtUtcNormalized: normalizedRequestedAtUtc,
    notesRaw: notes.value,
    linesRaw: lines.value,
    linesNormalized: normalizedLines,
  });

  if (
    !normalizedCode ||
    !normalizedSupplierId ||
    !normalizedBranchId ||
    !normalizedRequestedAtUtc
  ) {
    modalStore.onError?.({
      code: 400,
      message: t("purchases.quotes.validation.requiredHeader"),
    });
    return;
  }

  const invalidLine = normalizedLines.some(
    (line) =>
      !line.productId || Number.isNaN(line.quantity) || line.quantity <= 0,
  );

  if (invalidLine) {
    modalStore.onError?.({
      code: 400,
      message: t("purchases.quotes.validation.invalidLine"),
    });
    return;
  }

  loading.value = true;

  try {
    const payload = {
      code: normalizedCode,
      supplierId: normalizedSupplierId,
      branchId: normalizedBranchId,
      requestedAtUtc: normalizedRequestedAtUtc,
      notes: notes.value.trim(),
      lines: normalizedLines,
    };

    console.log("Supplier quote payload:", payload);

    const created = await SupplierQuotesService.create(payload);

    modalStore.onSuccess?.(created);
    modalStore.close();
  } catch (error: any) {
    console.error("Create supplier quote error:", error);

    modalStore.onError?.({
      code: error?.status ?? 500,
      message:
        error?.response?.data?.message ??
        error?.message ??
        t("purchases.quotes.messages.createError"),
    });
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  requestedAtUtc.value = getLocalDateTimeForInput();
  await loadCatalogs();
});
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-5xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("purchases.quotes.modal.createTitle") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("purchases.quotes.modal.createDescription") }}
      </p>
    </div>

    <div
      v-if="loadingCatalogs"
      class="py-bt-spacing-24 text-center text-bt-grey-500"
    >
      {{ $t("common.loading") }}
    </div>

    <div v-else>
      <div
        class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16 mb-bt-spacing-24"
      >
        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("purchases.quotes.fields.code") }}
          </label>
          <input
            v-model="code"
            type="text"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("purchases.quotes.fields.supplier") }}
          </label>
          <select
            v-model="supplierId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">
              {{ $t("purchases.quotes.placeholders.selectSupplier") }}
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
            {{ $t("purchases.quotes.fields.branch") }}
          </label>
          <select
            v-model="branchId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">
              {{ $t("purchases.quotes.placeholders.selectBranch") }}
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
            {{ $t("purchases.quotes.fields.requestedAt") }}
          </label>
          <input
            v-model="requestedAtUtc"
            type="datetime-local"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div class="md:col-span-2">
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("purchases.quotes.fields.notes") }}
          </label>
          <textarea
            v-model="notes"
            rows="3"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>
      </div>

      <div class="rounded-l border border-bt-grey-200 overflow-hidden">
        <div
          class="flex items-center justify-between px-bt-spacing-16 py-bt-spacing-12 bg-bt-primary-50 border-b border-bt-grey-200"
        >
          <h3 class="font-bt-semibold text-bt-primary-700">
            {{ $t("purchases.quotes.lines.title") }}
          </h3>

          <button
            type="button"
            class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600"
            @click="addLine"
          >
            {{ $t("purchases.quotes.lines.addLine") }}
          </button>
        </div>

        <div class="p-bt-spacing-16 space-y-bt-spacing-16">
          <div
            v-for="(line, index) in lines"
            :key="index"
            class="grid grid-cols-1 md:grid-cols-3 gap-bt-spacing-12 p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="md:col-span-2">
              <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
                {{ $t("purchases.quotes.lines.product") }}
              </label>
              <select
                v-model="line.productId"
                class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
              >
                <option value="">
                  {{ $t("purchases.quotes.placeholders.selectProduct") }}
                </option>
                <option
                  v-for="product in products"
                  :key="product.id"
                  :value="product.id"
                >
                  {{ product.label }}
                </option>
              </select>
            </div>

            <div>
              <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
                {{ $t("purchases.quotes.lines.quantity") }}
              </label>
              <div class="flex gap-bt-spacing-8">
                <input
                  v-model.number="line.quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                />
                <button
                  v-if="lines.length > 1"
                  type="button"
                  class="px-bt-spacing-12 py-bt-spacing-12 rounded-m bg-bt-error-100 text-bt-error-700 hover:bg-bt-error-300"
                  @click="removeLine(index)"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>
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
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-info-500 text-bt-white hover:bg-bt-info-700 disabled:bg-bt-disabled"
        @click="submit"
      >
        {{ loading ? $t("common.loading") : $t("common.save") }}
      </button>
    </div>
  </div>
</template>
