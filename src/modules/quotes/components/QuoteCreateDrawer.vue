<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

import { QuotesService } from "@/core/services/quotesService";
import { SelectService } from "@/core/services/selectService";
import { ProductsService } from "@/core/services/productsService";

import type { SelectOption } from "@/core/interfaces/select";
import type {
  Quote,
  QuoteDetail,
  QuoteDetailCreateRequest,
} from "@/core/interfaces/quotes";
import type { Product } from "@/core/interfaces/products";

const { t } = useI18n();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const clients = ref<SelectOption[]>([]);
const branches = ref<SelectOption[]>([]);
const products = ref<SelectOption[]>([]);
const productCatalog = ref<Product[]>([]);

const loadingCatalogs = ref(false);
const loading = ref(false);
const loadingExchangeRate = ref(false);

const code = ref("");
const clientId = ref("");
const branchId = ref("");
const issueDate = ref("");
const validUntil = ref("");
const currency = ref("CRC");
const exchangeRate = ref(1);
const notes = ref("");

const lines = ref<QuoteDetailCreateRequest[]>([
  {
    productId: "",
    quantity: 1,
    unitPrice: 0,
    discountPerc: 0,
    taxPerc: 0,
  },
]);

const total = computed(() => {
  return lines.value.reduce((acc, line) => {
    const lineSubtotal = Number(line.quantity) * Number(line.unitPrice);
    const discount = lineSubtotal * (Number(line.discountPerc) / 100);
    const taxable = lineSubtotal - discount;
    const taxes = taxable * (Number(line.taxPerc) / 100);

    return acc + taxable + taxes;
  }, 0);
});

const subtotal = computed(() => {
  return lines.value.reduce((acc, line) => {
    return acc + Number(line.quantity) * Number(line.unitPrice);
  }, 0);
});

const discounts = computed(() => {
  return lines.value.reduce((acc, line) => {
    const lineSubtotal = Number(line.quantity) * Number(line.unitPrice);
    return acc + lineSubtotal * (Number(line.discountPerc) / 100);
  }, 0);
});

const taxes = computed(() => {
  return lines.value.reduce((acc, line) => {
    const lineSubtotal = Number(line.quantity) * Number(line.unitPrice);
    const discount = lineSubtotal * (Number(line.discountPerc) / 100);
    const taxable = lineSubtotal - discount;

    return acc + taxable * (Number(line.taxPerc) / 100);
  }, 0);
});

function getLineTotal(line: QuoteDetailCreateRequest): number {
  const lineSubtotal = Number(line.quantity) * Number(line.unitPrice);
  const discount = lineSubtotal * (Number(line.discountPerc) / 100);
  const taxable = lineSubtotal - discount;
  const taxes = taxable * (Number(line.taxPerc) / 100);

  return taxable + taxes;
}

function formatMoney(value: number): string {
  return value.toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function addLine() {
  lines.value.push({
    productId: "",
    quantity: 1,
    unitPrice: 0,
    discountPerc: 0,
    taxPerc: 0,
  });
}

function removeLine(index: number) {
  lines.value.splice(index, 1);
}

function closeDrawer() {
  drawerStore.closeDrawer();
}

function getLocalDateTimeForInput(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function addDaysToLocalDateTime(localDateTime: string, days: number): string {
  if (!localDateTime) return "";

  const date = new Date(localDateTime);
  if (Number.isNaN(date.getTime())) return "";

  date.setDate(date.getDate() + days);
  return getLocalDateTimeForInput(date);
}

function localDateTimeToUtcIso(localDateTime: string): string {
  if (!localDateTime) return "";

  const date = new Date(localDateTime);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString();
}

function findProduct(productId: string): Product | undefined {
  return productCatalog.value.find(
    (product) => product.productId === productId || product.id === productId,
  );
}

function applyProductDefaults(line: QuoteDetailCreateRequest) {
  const selectedProduct = findProduct(String(line.productId ?? "").trim());

  if (!selectedProduct) {
    return;
  }

  line.unitPrice = Number(selectedProduct.basePrice ?? 0);
  line.taxPerc = Number(selectedProduct.taxPercentage ?? 0);
}

function onProductChange(line: QuoteDetailCreateRequest) {
  applyProductDefaults(line);
}

function findClientLabel(id: string): string | null {
  return clients.value.find((item) => item.id === id)?.label ?? null;
}

function findBranchLabel(id: string): string | null {
  return branches.value.find((item) => item.id === id)?.label ?? null;
}

function buildQuoteLinesPayload(): QuoteDetail[] {
  return lines.value.map((line, index) => {
    const product = findProduct(String(line.productId ?? "").trim());

    return {
      quoteDetailId: `temp-${index + 1}`,
      productId: String(line.productId ?? "").trim(),
      productName: product?.name ?? product?.description ?? null,
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
      discountPerc: Number(line.discountPerc),
      taxPerc: Number(line.taxPerc),
      lineTotal: getLineTotal(line),
    };
  });
}

async function loadCatalogs() {
  loadingCatalogs.value = true;

  try {
    const [
      clientsResponse,
      branchesResponse,
      productsResponse,
      productsCatalogResponse,
    ] = await Promise.all([
      SelectService.selectClients({ onlyActive: true }),
      SelectService.selectBranches({ onlyActive: true }),
      SelectService.selectProducts({ onlyActive: true }),
      ProductsService.browse({
        page: 1,
        pageSize: 500,
      }),
    ]);

    clients.value = clientsResponse ?? [];
    branches.value = branchesResponse ?? [];
    products.value = productsResponse ?? [];

    if (Array.isArray(productsCatalogResponse)) {
      productCatalog.value = productsCatalogResponse;
    } else if (
      productsCatalogResponse &&
      typeof productsCatalogResponse === "object" &&
      "items" in productsCatalogResponse &&
      Array.isArray((productsCatalogResponse as { items: Product[] }).items)
    ) {
      productCatalog.value = (
        productsCatalogResponse as { items: Product[] }
      ).items;
    } else if (
      productsCatalogResponse &&
      typeof productsCatalogResponse === "object" &&
      "data" in productsCatalogResponse &&
      Array.isArray((productsCatalogResponse as { data: Product[] }).data)
    ) {
      productCatalog.value = (
        productsCatalogResponse as { data: Product[] }
      ).data;
    } else {
      productCatalog.value = [];
    }
  } catch (error: any) {
    console.error("Load quote catalogs error:", error);

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: error?.message ?? t("common.errors.loadData"),
    });
  } finally {
    loadingCatalogs.value = false;
  }
}

async function loadExchangeRate() {
  if (currency.value === "CRC") {
    exchangeRate.value = 1;
    return;
  }

  if (currency.value === "USD") {
    loadingExchangeRate.value = true;

    try {
      const response = await fetch("https://open.er-api.com/v6/latest/USD");
      const data = await response.json();

      const rate = Number(data?.rates?.CRC);

      if (!Number.isNaN(rate) && rate > 0) {
        exchangeRate.value = rate;
      } else {
        exchangeRate.value = 1;
      }
    } catch (error) {
      console.error("Load exchange rate error:", error);
      exchangeRate.value = 1;
    } finally {
      loadingExchangeRate.value = false;
    }
  }
}

async function submit() {
  const normalizedCode = code.value.trim();
  const normalizedClientId = clientId.value.trim();
  const normalizedBranchId = branchId.value.trim();
  const normalizedIssueDate = localDateTimeToUtcIso(issueDate.value.trim());
  const normalizedValidUntil = localDateTimeToUtcIso(validUntil.value.trim());
  const normalizedCurrency = currency.value.trim().toUpperCase();
  const normalizedExchangeRate = Number(exchangeRate.value);

  if (
    !normalizedCode ||
    !normalizedClientId ||
    !normalizedBranchId ||
    !normalizedIssueDate ||
    !normalizedValidUntil
  ) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("quotes.validation.requiredHeader"),
    });
    return;
  }

  if (!lines.value.length) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("quotes.validation.requiredLines"),
    });
    return;
  }

  const normalizedLines = lines.value.map((line) => ({
    productId: String(line.productId ?? "").trim(),
    quantity: Number(line.quantity),
    unitPrice: Number(line.unitPrice),
    discountPerc: Number(line.discountPerc),
    taxPerc: Number(line.taxPerc),
  }));

  const invalidLine = normalizedLines.some(
    (line) =>
      !line.productId ||
      Number.isNaN(line.quantity) ||
      line.quantity <= 0 ||
      Number.isNaN(line.unitPrice) ||
      line.unitPrice < 0 ||
      Number.isNaN(line.discountPerc) ||
      line.discountPerc < 0 ||
      Number.isNaN(line.taxPerc) ||
      line.taxPerc < 0,
  );

  if (invalidLine) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("quotes.validation.invalidLine"),
    });
    return;
  }

  if (!normalizedCurrency) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("quotes.validation.requiredHeader"),
    });
    return;
  }

  if (Number.isNaN(normalizedExchangeRate) || normalizedExchangeRate <= 0) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("quotes.validation.requiredHeader"),
    });
    return;
  }

  loading.value = true;

  try {
    const created = await QuotesService.create({
      code: normalizedCode,
      clientId: normalizedClientId,
      branchId: normalizedBranchId,
      issueDate: normalizedIssueDate,
      validUntil: normalizedValidUntil,
      currency: normalizedCurrency,
      exchangeRate: normalizedExchangeRate,
      notes: notes.value.trim(),
    });

    for (const line of normalizedLines) {
      await QuotesService.addDetail(created.quoteId, {
        productId: line.productId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountPerc: line.discountPerc,
        taxPerc: line.taxPerc,
      });
    }

    const payload: Quote = {
      id: `quote:${created.quoteId}`,
      quoteId: created.quoteId,
      code: normalizedCode,
      clientId: normalizedClientId,
      clientName: findClientLabel(normalizedClientId),
      branchId: normalizedBranchId,
      branchName: findBranchLabel(normalizedBranchId),
      issueDate: normalizedIssueDate,
      validUntil: normalizedValidUntil,
      status: "Draft",
      currency: normalizedCurrency,
      exchangeRate: normalizedExchangeRate,
      subtotal: Number(subtotal.value),
      taxes: Number(taxes.value),
      discounts: Number(discounts.value),
      total: Number(total.value),
      acceptedByClient: false,
      acceptanceDate: null,
      version: normalizedLines.length,
      notes: notes.value.trim() || null,
      lines: buildQuoteLinesPayload(),
    };

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("quotes.messages.createSuccess"),
    });

    drawerStore.onSuccess?.(payload);
    drawerStore.closeDrawer();
  } catch (error: any) {
    console.error("Create quote error:", error);

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message:
        error?.response?.data?.message ??
        error?.message ??
        t("quotes.messages.createError"),
    });
  } finally {
    loading.value = false;
  }
}

watch(currency, async () => {
  await loadExchangeRate();
});

watch(issueDate, (value) => {
  if (!validUntil.value && value) {
    validUntil.value = addDaysToLocalDateTime(value, 15);
  }
});

watch(
  lines,
  (currentLines) => {
    for (const line of currentLines) {
      if (!line.productId) {
        continue;
      }

      const selectedProduct = findProduct(String(line.productId).trim());

      if (!selectedProduct) {
        continue;
      }

      if (Number(line.unitPrice) <= 0) {
        line.unitPrice = Number(selectedProduct.basePrice ?? 0);
      }

      if (Number(line.taxPerc) < 0 || Number.isNaN(Number(line.taxPerc))) {
        line.taxPerc = Number(selectedProduct.taxPercentage ?? 0);
      }
    }
  },
  { deep: true },
);

onMounted(async () => {
  issueDate.value = getLocalDateTimeForInput();
  validUntil.value = addDaysToLocalDateTime(issueDate.value, 15);

  await loadCatalogs();
  await loadExchangeRate();
});
</script>

<template>
  <div class="h-full bg-bt-white overflow-y-auto p-bt-spacing-24">
    <div class="mb-bt-spacing-24 flex items-start justify-between">
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t("quotes.modal.createTitle") }}
        </h2>
        <p class="mt-bt-spacing-8 text-bt-grey-600">
          {{ $t("quotes.modal.createDescription") }}
        </p>
      </div>

      <button
        type="button"
        class="rounded-m bg-bt-grey-200 px-bt-spacing-12 py-bt-spacing-8 text-bt-primary-700 hover:bg-bt-grey-300"
        @click="closeDrawer"
      >
        {{ $t("common.close") }}
      </button>
    </div>

    <div
      v-if="loadingCatalogs"
      class="py-bt-spacing-24 text-center text-bt-grey-500"
    >
      {{ $t("common.loading") }}
    </div>

    <div v-else class="space-y-bt-spacing-24">
      <div
        class="grid grid-cols-1 gap-bt-spacing-16 md:grid-cols-2 xl:grid-cols-4"
      >
        <div>
          <label class="mb-bt-spacing-8 block text-sm text-bt-primary-700">
            {{ $t("quotes.fields.code") }}
          </label>
          <input
            v-model="code"
            type="text"
            class="w-full rounded-m border border-bt-grey-300 px-bt-spacing-16 py-bt-spacing-12 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div>
          <label class="mb-bt-spacing-8 block text-sm text-bt-primary-700">
            {{ $t("quotes.fields.client") }}
          </label>
          <select
            v-model="clientId"
            class="w-full rounded-m border border-bt-grey-300 bg-bt-white px-bt-spacing-16 py-bt-spacing-12 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">
              {{ $t("quotes.placeholders.selectClient") }}
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
          <label class="mb-bt-spacing-8 block text-sm text-bt-primary-700">
            {{ $t("quotes.fields.branch") }}
          </label>
          <select
            v-model="branchId"
            class="w-full rounded-m border border-bt-grey-300 bg-bt-white px-bt-spacing-16 py-bt-spacing-12 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">
              {{ $t("quotes.placeholders.selectBranch") }}
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

        <div
          class="flex flex-col justify-center rounded-m border border-bt-grey-200 bg-bt-grey-50 px-bt-spacing-16 py-bt-spacing-12"
        >
          <span class="text-sm text-bt-grey-600">
            {{ $t("quotes.fields.total") }}
          </span>
          <span class="text-xl font-bt-bold text-bt-primary-700">
            {{ formatMoney(total) }}
          </span>
        </div>

        <div>
          <label class="mb-bt-spacing-8 block text-sm text-bt-primary-700">
            {{ $t("quotes.fields.issueDate") }}
          </label>
          <input
            v-model="issueDate"
            type="datetime-local"
            class="w-full rounded-m border border-bt-grey-300 px-bt-spacing-16 py-bt-spacing-12 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div>
          <label class="mb-bt-spacing-8 block text-sm text-bt-primary-700">
            {{ $t("quotes.fields.validUntil") }}
          </label>
          <input
            v-model="validUntil"
            type="datetime-local"
            class="w-full rounded-m border border-bt-grey-300 px-bt-spacing-16 py-bt-spacing-12 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div>
          <label class="mb-bt-spacing-8 block text-sm text-bt-primary-700">
            {{ $t("quotes.fields.currency") }}
          </label>
          <select
            v-model="currency"
            class="w-full rounded-m border border-bt-grey-300 bg-bt-white px-bt-spacing-16 py-bt-spacing-12 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="CRC">CRC</option>
            <option value="USD">USD</option>
          </select>
        </div>

        <div>
          <label class="mb-bt-spacing-8 block text-sm text-bt-primary-700">
            {{ $t("quotes.fields.exchangeRate") }}
          </label>
          <input
            :value="loadingExchangeRate ? '...' : exchangeRate"
            type="text"
            disabled
            class="w-full rounded-m border border-bt-grey-300 bg-bt-grey-100 px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
          />
        </div>

        <div class="md:col-span-2 xl:col-span-4">
          <label class="mb-bt-spacing-8 block text-sm text-bt-primary-700">
            {{ $t("quotes.fields.notes") }}
          </label>
          <textarea
            v-model="notes"
            rows="3"
            class="w-full rounded-m border border-bt-grey-300 px-bt-spacing-16 py-bt-spacing-12 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>
      </div>

      <div class="overflow-hidden rounded-m border border-bt-grey-200">
        <div
          class="flex items-center justify-between border-b border-bt-grey-200 bg-bt-primary-50 px-bt-spacing-16 py-bt-spacing-12"
        >
          <h3 class="font-bt-semibold text-bt-primary-700">
            {{ $t("quotes.lines.title") }}
          </h3>

          <button
            type="button"
            class="rounded-m bg-bt-primary-500 px-bt-spacing-12 py-bt-spacing-8 text-bt-white hover:bg-bt-primary-600"
            @click="addLine"
          >
            {{ $t("quotes.lines.addLine") }}
          </button>
        </div>

        <div class="space-y-bt-spacing-12 p-bt-spacing-16">
          <div
            v-for="(line, index) in lines"
            :key="index"
            class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
          >
            <div
              class="grid grid-cols-1 items-end gap-bt-spacing-12 md:grid-cols-2 xl:grid-cols-6"
            >
              <div class="xl:col-span-2">
                <label
                  class="mb-bt-spacing-8 block text-sm text-bt-primary-700"
                >
                  {{ $t("quotes.lines.product") }}
                </label>
                <select
                  v-model="line.productId"
                  class="w-full rounded-m border border-bt-grey-300 bg-bt-white px-bt-spacing-16 py-bt-spacing-12 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                  @change="onProductChange(line)"
                >
                  <option value="">
                    {{ $t("quotes.placeholders.selectProduct") }}
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
                <label
                  class="mb-bt-spacing-8 block text-sm text-bt-primary-700"
                >
                  {{ $t("quotes.lines.quantity") }}
                </label>
                <input
                  v-model.number="line.quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  class="w-full rounded-m border border-bt-grey-300 px-bt-spacing-16 py-bt-spacing-12 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                />
              </div>

              <div>
                <label
                  class="mb-bt-spacing-8 block text-sm text-bt-primary-700"
                >
                  {{ $t("quotes.lines.unitPrice") }}
                </label>
                <input
                  v-model.number="line.unitPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full rounded-m border border-bt-grey-300 px-bt-spacing-16 py-bt-spacing-12 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                />
              </div>

              <div>
                <label
                  class="mb-bt-spacing-8 block text-sm text-bt-primary-700"
                >
                  {{ $t("quotes.lines.discountPerc") }}
                </label>
                <input
                  v-model.number="line.discountPerc"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full rounded-m border border-bt-grey-300 px-bt-spacing-16 py-bt-spacing-12 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                />
              </div>

              <div>
                <label
                  class="mb-bt-spacing-8 block text-sm text-bt-primary-700"
                >
                  {{ $t("quotes.lines.taxPerc") }}
                </label>
                <div class="flex gap-bt-spacing-8">
                  <input
                    v-model.number="line.taxPerc"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-full rounded-m border border-bt-grey-300 px-bt-spacing-16 py-bt-spacing-12 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                  />
                  <button
                    v-if="lines.length > 1"
                    type="button"
                    class="rounded-m bg-bt-error-100 px-bt-spacing-12 py-bt-spacing-12 text-bt-error-700 hover:bg-bt-error-300"
                    @click="removeLine(index)"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            <div class="mt-bt-spacing-12 flex justify-end">
              <div class="text-right">
                <div class="text-sm text-bt-grey-600">
                  {{ $t("quotes.fields.total") }}
                </div>
                <div class="text-base font-bt-bold text-bt-primary-700">
                  {{ formatMoney(getLineTotal(line)) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="flex justify-end border-t border-bt-grey-200 bg-bt-grey-50 px-bt-spacing-16 py-bt-spacing-16"
        >
          <div class="text-right">
            <div class="text-sm text-bt-grey-600">
              {{ $t("quotes.fields.total") }}
            </div>
            <div class="text-2xl font-bt-bold text-bt-primary-700">
              {{ formatMoney(total) }}
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-bt-spacing-12">
        <button
          type="button"
          class="rounded-m bg-bt-grey-200 px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 hover:bg-bt-grey-300"
          @click="closeDrawer"
        >
          {{ $t("common.cancel") }}
        </button>

        <button
          type="button"
          :disabled="loading || loadingExchangeRate"
          class="rounded-m bg-bt-accent-500 px-bt-spacing-16 py-bt-spacing-12 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
          @click="submit"
        >
          {{ loading ? $t("common.loading") : $t("common.save") }}
        </button>
      </div>
    </div>
  </div>
</template>
