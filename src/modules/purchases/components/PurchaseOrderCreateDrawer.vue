<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

import { PurchasesOrdersService } from "@/core/services/purchasesOrdersService";
import { SelectService } from "@/core/services/selectService";

import type { SelectOption } from "@/core/interfaces/select";
import type { PurchaseOrderCreateLineRequest } from "@/core/interfaces/purchasesOrders";

const { t } = useI18n();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const suppliers = ref<SelectOption[]>([]);
const branches = ref<SelectOption[]>([]);
const products = ref<SelectOption[]>([]);
const requests = ref<SelectOption[]>([]);

const loadingCatalogs = ref(false);
const loadingExchangeRate = ref(false);
const loading = ref(false);

const code = ref("");
const supplierId = ref("");
const branchId = ref("");
const requestId = ref("");
const orderDateUtc = ref("");
const currency = ref("CRC");
const exchangeRate = ref(1);

const lines = ref<PurchaseOrderCreateLineRequest[]>([
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
    const subtotal = Number(line.quantity) * Number(line.unitPrice);
    const discount = subtotal * (Number(line.discountPerc) / 100);
    const taxable = subtotal - discount;
    const taxes = taxable * (Number(line.taxPerc) / 100);

    return acc + taxable + taxes;
  }, 0);
});

function formatMoney(value: number): string {
  return value.toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getLineTotal(line: PurchaseOrderCreateLineRequest): number {
  const subtotal = Number(line.quantity) * Number(line.unitPrice);
  const discount = subtotal * (Number(line.discountPerc) / 100);
  const taxable = subtotal - discount;
  const taxes = taxable * (Number(line.taxPerc) / 100);

  return taxable + taxes;
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
    const [
      suppliersResponse,
      branchesResponse,
      productsResponse,
      requestsResponse,
    ] = await Promise.all([
      SelectService.selectSuppliers({ onlyActive: true }),
      SelectService.selectBranches({ onlyActive: true }),
      SelectService.selectProducts({ onlyActive: true }),
      SelectService.selectPurchaseRequests(),
    ]);

    suppliers.value = suppliersResponse ?? [];
    branches.value = branchesResponse ?? [];
    products.value = productsResponse ?? [];
    requests.value = requestsResponse ?? [];
  } catch (error: any) {
    console.error("Load purchase order catalogs error:", error);

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
  const normalizedSupplierId = supplierId.value.trim();
  const normalizedBranchId = branchId.value.trim();
  const normalizedRequestId = requestId.value.trim();
  const normalizedOrderDateUtc = toUtcIsoString(orderDateUtc.value);
  const normalizedCurrency = currency.value.trim().toUpperCase();
  const normalizedExchangeRate = Number(exchangeRate.value);

  if (
    !normalizedSupplierId ||
    !normalizedBranchId ||
    !normalizedRequestId ||
    !normalizedCode ||
    !normalizedOrderDateUtc
  ) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("purchases.orders.validation.requiredHeader"),
    });
    return;
  }

  if (!lines.value.length) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("purchases.orders.validation.requiredLines"),
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
      message: t("purchases.orders.validation.invalidLine"),
    });
    return;
  }

  if (!normalizedCurrency) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("purchases.orders.validation.requiredHeader"),
    });
    return;
  }

  if (Number.isNaN(normalizedExchangeRate) || normalizedExchangeRate <= 0) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("purchases.orders.validation.requiredHeader"),
    });
    return;
  }

  loading.value = true;

  try {
    const payload = {
      code: normalizedCode,
      supplierId: normalizedSupplierId,
      branchId: normalizedBranchId,
      requestId: normalizedRequestId,
      orderDateUtc: normalizedOrderDateUtc,
      currency: normalizedCurrency,
      exchangeRate: normalizedExchangeRate,
      lines: normalizedLines,
    };

    const created = await PurchasesOrdersService.create(payload);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("purchases.orders.messages.createSuccess"),
    });

    drawerStore.onSuccess?.(created);
    drawerStore.closeDrawer();
  } catch (error: any) {
    console.error("Create purchase order error:", error);

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message:
        error?.response?.data?.message ??
        error?.message ??
        t("purchases.orders.messages.createError"),
    });
  } finally {
    loading.value = false;
  }
}

watch(currency, async () => {
  await loadExchangeRate();
});

onMounted(async () => {
  orderDateUtc.value = getLocalDateTimeForInput();
  await loadCatalogs();
  await loadExchangeRate();
});
</script>

<template>
  <div class="h-full bg-bt-white p-bt-spacing-24 overflow-y-auto">
    <div class="flex items-start justify-between mb-bt-spacing-24">
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t("purchases.orders.modal.createTitle") }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{ $t("purchases.orders.modal.createDescription") }}
        </p>
      </div>

      <button
        type="button"
        class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
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
        class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-bt-spacing-16"
      >
        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("purchases.orders.fields.code") }}
          </label>
          <input
            v-model="code"
            type="text"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("purchases.orders.fields.supplier") }}
          </label>
          <select
            v-model="supplierId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">
              {{ $t("purchases.orders.placeholders.selectSupplier") }}
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
            {{ $t("purchases.orders.fields.branch") }}
          </label>
          <select
            v-model="branchId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">
              {{ $t("purchases.orders.placeholders.selectBranch") }}
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
            {{ $t("purchases.orders.fields.requestId") }}
          </label>
          <select
            v-model="requestId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">
              {{ $t("purchases.orders.placeholders.selectRequest") }}
            </option>
            <option
              v-for="request in requests"
              :key="request.id"
              :value="request.id"
            >
              {{ request.label }}
            </option>
          </select>
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("purchases.orders.fields.orderDate") }}
          </label>
          <input
            v-model="orderDateUtc"
            type="datetime-local"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("purchases.orders.fields.currency") }}
          </label>
          <select
            v-model="currency"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="CRC">CRC</option>
            <option value="USD">USD</option>
          </select>
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("purchases.orders.fields.exchangeRate") }}
          </label>
          <input
            :value="loadingExchangeRate ? '...' : exchangeRate"
            type="text"
            disabled
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-grey-100 text-bt-grey-700"
          />
        </div>

        <div
          class="rounded-m border border-bt-grey-200 bg-bt-grey-50 px-bt-spacing-16 py-bt-spacing-12 flex flex-col justify-center"
        >
          <span class="text-sm text-bt-grey-600">
            {{ $t("purchases.orders.fields.total") }}
          </span>
          <span class="text-xl font-bt-bold text-bt-primary-700">
            {{ formatMoney(total) }}
          </span>
        </div>
      </div>

      <div class="rounded-m border border-bt-grey-200 overflow-hidden">
        <div
          class="flex items-center justify-between px-bt-spacing-16 py-bt-spacing-12 bg-bt-primary-50 border-b border-bt-grey-200"
        >
          <h3 class="font-bt-semibold text-bt-primary-700">
            {{ $t("purchases.orders.lines.title") }}
          </h3>

          <button
            type="button"
            class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600"
            @click="addLine"
          >
            {{ $t("purchases.orders.lines.addLine") }}
          </button>
        </div>

        <div class="p-bt-spacing-16 space-y-bt-spacing-12">
          <div
            v-for="(line, index) in lines"
            :key="index"
            class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
          >
            <div
              class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-bt-spacing-12 items-end"
            >
              <div class="xl:col-span-2">
                <label
                  class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                >
                  {{ $t("purchases.orders.lines.product") }}
                </label>
                <select
                  v-model="line.productId"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                >
                  <option value="">
                    {{ $t("purchases.orders.placeholders.selectProduct") }}
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
                  class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                >
                  {{ $t("purchases.orders.lines.quantity") }}
                </label>
                <input
                  v-model.number="line.quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                />
              </div>

              <div>
                <label
                  class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                >
                  {{ $t("purchases.orders.lines.unitPrice") }}
                </label>
                <input
                  v-model.number="line.unitPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                />
              </div>

              <div>
                <label
                  class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                >
                  {{ $t("purchases.orders.lines.discountPerc") }}
                </label>
                <input
                  v-model.number="line.discountPerc"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                />
              </div>

              <div>
                <label
                  class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                >
                  {{ $t("purchases.orders.lines.taxPerc") }}
                </label>
                <div class="flex gap-bt-spacing-8">
                  <input
                    v-model.number="line.taxPerc"
                    type="number"
                    min="0"
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

            <div class="mt-bt-spacing-12 flex justify-end">
              <div class="text-right">
                <div class="text-sm text-bt-grey-600">
                  {{ $t("purchases.orders.fields.total") }}
                </div>
                <div class="text-base font-bt-bold text-bt-primary-700">
                  {{ formatMoney(getLineTotal(line)) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="px-bt-spacing-16 py-bt-spacing-16 border-t border-bt-grey-200 bg-bt-grey-50 flex justify-end"
        >
          <div class="text-right">
            <div class="text-sm text-bt-grey-600">
              {{ $t("purchases.orders.fields.total") }}
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
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
          @click="closeDrawer"
        >
          {{ $t("common.cancel") }}
        </button>

        <button
          type="button"
          :disabled="loading || loadingExchangeRate"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
          @click="submit"
        >
          {{ loading ? $t("common.loading") : $t("common.save") }}
        </button>
      </div>
    </div>
  </div>
</template>
