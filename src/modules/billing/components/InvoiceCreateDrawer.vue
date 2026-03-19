<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useModalStore } from "@/core/stores/modalStore";
import { useToastStore } from "@/core/stores/toastStore";

import { InvoicesService } from "@/core/services/invoicesService";
import { SelectService } from "@/core/services/selectService";
import { SalesOrdersService } from "@/core/services/salesOrdersService";
import { ProductsService } from "@/core/services/productsService";

import InvoiceEmitModal from "@/modules/billing/components/InvoiceEmitModal.vue";

import type { SelectOption } from "@/core/interfaces/select";
import type { Product } from "@/core/interfaces/products";
import type { SalesOrder } from "@/core/interfaces/salesOrders";
import type { InvoiceCreateRequest } from "@/core/interfaces/invoices";

interface InvoiceLineForm {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPerc: number;
  taxPerc: number;
}

const { t } = useI18n();

const drawerStore = useDrawerStore();
const modalStore = useModalStore();
const toastStore = useToastStore();

const clients = ref<SelectOption[]>([]);
const branches = ref<SelectOption[]>([]);
const salesOrders = ref<SelectOption[]>([]);
const products = ref<SelectOption[]>([]);
const productCatalog = ref<Product[]>([]);

const loadingCatalogs = ref(false);
const loadingExchangeRate = ref(false);
const loadingSource = ref(false);
const loading = ref(false);

const salesOrderId = ref("");
const clientId = ref("");
const branchId = ref("");
const issueDate = ref("");
const documentType = ref("FE");
const currency = ref("CRC");
const exchangeRate = ref(1);
const notes = ref("");

const lines = ref<InvoiceLineForm[]>([
  {
    productId: "",
    description: "",
    quantity: 1,
    unitPrice: 0,
    discountPerc: 0,
    taxPerc: 0,
  },
]);

const subtotal = computed(() => {
  return lines.value.reduce((acc, line) => {
    return acc + Number(line.quantity) * Number(line.unitPrice);
  }, 0);
});

const totalDiscount = computed(() => {
  return lines.value.reduce((acc, line) => {
    const lineSubtotal = Number(line.quantity) * Number(line.unitPrice);
    return acc + lineSubtotal * (Number(line.discountPerc) / 100);
  }, 0);
});

const totalTaxes = computed(() => {
  return lines.value.reduce((acc, line) => {
    const lineSubtotal = Number(line.quantity) * Number(line.unitPrice);
    const discount = lineSubtotal * (Number(line.discountPerc) / 100);
    const taxable = lineSubtotal - discount;
    return acc + taxable * (Number(line.taxPerc) / 100);
  }, 0);
});

const total = computed(() => {
  return subtotal.value - totalDiscount.value + totalTaxes.value;
});

function formatMoney(value: number): string {
  return value.toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getLineTotal(line: InvoiceLineForm): number {
  const lineSubtotal = Number(line.quantity) * Number(line.unitPrice);
  const discount = lineSubtotal * (Number(line.discountPerc) / 100);
  const taxable = lineSubtotal - discount;
  const taxes = taxable * (Number(line.taxPerc) / 100);

  return taxable + taxes;
}

function closeDrawer() {
  drawerStore.closeDrawer();
}

function addLine() {
  lines.value.push({
    productId: "",
    description: "",
    quantity: 1,
    unitPrice: 0,
    discountPerc: 0,
    taxPerc: 0,
  });
}

function removeLine(index: number) {
  lines.value.splice(index, 1);
}

function getTodayForInput(): string {
  const date = new Date();
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

function findProduct(productId: string): Product | undefined {
  return productCatalog.value.find(
    (product) => product.productId === productId || product.id === productId,
  );
}

function applyProductDefaults(line: InvoiceLineForm) {
  const selectedProduct = findProduct(String(line.productId ?? "").trim());

  if (!selectedProduct) return;

  line.description = selectedProduct.name || selectedProduct.description || "";
  line.unitPrice = Number(selectedProduct.basePrice ?? 0);
  line.taxPerc = Number(selectedProduct.taxPercentage ?? 0);
}

function onProductChange(line: InvoiceLineForm) {
  applyProductDefaults(line);
}

async function loadCatalogs() {
  loadingCatalogs.value = true;

  try {
    const [
      clientsResponse,
      branchesResponse,
      salesOrdersResponse,
      productsResponse,
      productCatalogResponse,
    ] = await Promise.all([
      SelectService.selectClients({ onlyActive: true }),
      SelectService.selectBranches({ onlyActive: true }),
      SelectService.selectSalesOrders(),
      SelectService.selectProducts({ onlyActive: true }),
      ProductsService.browse({
        page: 1,
        pageSize: 500,
      }),
    ]);

    clients.value = clientsResponse ?? [];
    branches.value = branchesResponse ?? [];
    salesOrders.value = salesOrdersResponse ?? [];
    products.value = productsResponse ?? [];

    if (Array.isArray(productCatalogResponse)) {
      productCatalog.value = productCatalogResponse;
    } else if (
      productCatalogResponse &&
      typeof productCatalogResponse === "object" &&
      "items" in productCatalogResponse &&
      Array.isArray((productCatalogResponse as { items: Product[] }).items)
    ) {
      productCatalog.value = (
        productCatalogResponse as { items: Product[] }
      ).items;
    } else if (
      productCatalogResponse &&
      typeof productCatalogResponse === "object" &&
      "data" in productCatalogResponse &&
      Array.isArray((productCatalogResponse as { data: Product[] }).data)
    ) {
      productCatalog.value = (
        productCatalogResponse as { data: Product[] }
      ).data;
    } else {
      productCatalog.value = [];
    }
  } catch (error: any) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: error?.message ?? t("billing.messages.loadCatalogsError"),
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

      exchangeRate.value = !Number.isNaN(rate) && rate > 0 ? rate : 1;
    } catch {
      exchangeRate.value = 1;
    } finally {
      loadingExchangeRate.value = false;
    }
  }
}

async function preloadFromSalesOrder(selectedSalesOrderId: string) {
  if (!selectedSalesOrderId) {
    return;
  }

  loadingSource.value = true;

  try {
    const order: SalesOrder =
      await SalesOrdersService.readById(selectedSalesOrderId);

    clientId.value = order.clientId;
    branchId.value = order.branchId;
    currency.value = order.currency || "CRC";
    exchangeRate.value = Number(order.exchangeRate ?? 1);
    notes.value = order.notes ?? "";

    lines.value = order.lines.map((line) => ({
      productId: line.productId,
      description: line.productName || "",
      quantity: Number(line.quantity ?? 0),
      unitPrice: Number(line.unitPrice ?? 0),
      discountPerc: Number(line.discountPerc ?? 0),
      taxPerc: Number(line.taxPerc ?? 0),
    }));

    if (!lines.value.length) {
      addLine();
    }
  } catch {
    toastStore.addToast({
      severity: "warning",
      title: t("toast.warning"),
      message: t("billing.messages.loadSalesOrderError"),
    });
  } finally {
    loadingSource.value = false;
  }
}

function openEmitAfterCreate(invoiceId: string) {
  modalStore.open({
    component: InvoiceEmitModal,
    props: {
      invoiceId,
      code: invoiceId,
      currentTaxStatus: "Draft",
    },
    onSuccess: () => {
      drawerStore.onSuccess?.({
        invoiceId,
        action: "created-and-emitted",
      });
    },
    onError: () => {
      drawerStore.onSuccess?.({
        invoiceId,
        action: "created",
      });
    },
  });
}

async function submit() {
  const normalizedClientId = clientId.value.trim();
  const normalizedBranchId = branchId.value.trim() || null;
  const normalizedIssueDate = toUtcIsoString(issueDate.value);
  const normalizedDocumentType = documentType.value.trim();
  const normalizedCurrency = currency.value.trim().toUpperCase();
  const normalizedExchangeRate = Number(exchangeRate.value);
  const normalizedSalesOrderId = salesOrderId.value.trim() || null;

  if (!normalizedClientId || !normalizedIssueDate) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("billing.validation.requiredHeader"),
    });
    return;
  }

  if (!lines.value.length) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("billing.validation.requiredLines"),
    });
    return;
  }

  const normalizedLines = lines.value.map((line) => ({
    productId: String(line.productId ?? "").trim(),
    description: String(line.description ?? "").trim(),
    quantity: Number(line.quantity),
    unitPrice: Number(line.unitPrice),
    discountPerc: Number(line.discountPerc),
    taxPerc: Number(line.taxPerc),
  }));

  const invalidLine = normalizedLines.some(
    (line) =>
      !line.productId ||
      !line.description ||
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
      message: t("billing.validation.invalidLine"),
    });
    return;
  }

  loading.value = true;

  try {
    const payload: InvoiceCreateRequest = {
      clientId: normalizedClientId,
      branchId: normalizedBranchId,
      salesOrderId: normalizedSalesOrderId,
      contractId: null,
      issueDate: normalizedIssueDate,
      documentType: normalizedDocumentType,
      currency: normalizedCurrency,
      exchangeRate: normalizedExchangeRate,
      notes: notes.value.trim() || null,
      lines: normalizedLines,
    };

    const created = await InvoicesService.create(payload);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("billing.messages.createSuccess"),
    });

    drawerStore.closeDrawer();
    openEmitAfterCreate(created.invoiceId);
  } catch (error: any) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: error?.message ?? t("billing.messages.createError"),
    });
  } finally {
    loading.value = false;
  }
}

watch(currency, async () => {
  await loadExchangeRate();
});

watch(salesOrderId, async (value) => {
  if (value) {
    await preloadFromSalesOrder(value);
  }
});

onMounted(async () => {
  issueDate.value = getTodayForInput();
  await loadCatalogs();
  await loadExchangeRate();
});
</script>

<template>
  <div class="h-full bg-bt-white flex flex-col">
    <div
      class="px-bt-spacing-24 pt-bt-spacing-24 pb-bt-spacing-16 border-b border-bt-grey-200"
    >
      <div class="flex items-start justify-between gap-bt-spacing-16">
        <div>
          <h2 class="text-xl font-bt-bold text-bt-primary-700">
            {{ $t("billing.drawer.createTitle") }}
          </h2>
          <p class="text-bt-grey-600 mt-bt-spacing-8">
            {{ $t("billing.drawer.createDescription") }}
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
    </div>

    <div
      v-if="loadingCatalogs"
      class="flex-1 flex items-center justify-center text-bt-grey-500"
    >
      {{ $t("common.loading") }}
    </div>

    <div v-else class="flex-1 min-h-0 overflow-y-auto">
      <div class="p-bt-spacing-24 space-y-bt-spacing-24">
        <div
          class="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-bt-spacing-24"
        >
          <div
            class="rounded-l border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
          >
            <h3
              class="text-base font-bt-semibold text-bt-primary-700 mb-bt-spacing-16"
            >
              {{ $t("billing.sections.sourceData") }}
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
              <div class="md:col-span-2">
                <label
                  class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                >
                  {{ $t("billing.fields.salesOrder") }}
                </label>
                <select
                  v-model="salesOrderId"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                >
                  <option value="">
                    {{ $t("billing.placeholders.selectSalesOrder") }}
                  </option>
                  <option
                    v-for="order in salesOrders"
                    :key="order.id"
                    :value="order.id"
                  >
                    {{ order.label }}
                  </option>
                </select>
              </div>

              <div>
                <label
                  class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                >
                  {{ $t("billing.fields.client") }}
                </label>
                <select
                  v-model="clientId"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                >
                  <option value="">
                    {{ $t("billing.placeholders.selectClient") }}
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
                <label
                  class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                >
                  {{ $t("billing.fields.branch") }}
                </label>
                <select
                  v-model="branchId"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                >
                  <option value="">
                    {{ $t("billing.placeholders.selectBranch") }}
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
                <label
                  class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                >
                  {{ $t("billing.fields.issueDate") }}
                </label>
                <input
                  v-model="issueDate"
                  type="date"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                />
              </div>

              <div>
                <label
                  class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                >
                  {{ $t("billing.fields.documentType") }}
                </label>
                <select
                  v-model="documentType"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                >
                  <option value="FE">FE</option>
                  <option value="TE">TE</option>
                </select>
              </div>

              <div>
                <label
                  class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                >
                  {{ $t("billing.fields.currency") }}
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
                <label
                  class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                >
                  {{ $t("billing.fields.exchangeRate") }}
                </label>
                <input
                  :value="loadingExchangeRate ? '...' : exchangeRate"
                  type="text"
                  disabled
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-grey-100 text-bt-grey-700"
                />
              </div>

              <div class="md:col-span-2">
                <label
                  class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                >
                  {{ $t("billing.fields.notes") }}
                </label>
                <textarea
                  v-model="notes"
                  rows="3"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                />
              </div>

              <div
                v-if="loadingSource"
                class="md:col-span-2 text-sm text-bt-info-700"
              >
                {{ $t("billing.messages.preloadingFromSalesOrder") }}
              </div>
            </div>
          </div>

          <div
            class="rounded-l border border-bt-grey-200 bg-bt-primary-700 text-bt-white p-bt-spacing-16"
          >
            <h3 class="text-base font-bt-semibold mb-bt-spacing-16">
              {{ $t("billing.sections.summary") }}
            </h3>

            <div class="space-y-bt-spacing-12">
              <div class="flex items-center justify-between">
                <span class="text-bt-grey-200">{{
                  $t("billing.fields.subtotal")
                }}</span>
                <span class="font-bt-semibold">{{
                  formatMoney(subtotal)
                }}</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-bt-grey-200">{{
                  $t("billing.fields.discounts")
                }}</span>
                <span class="font-bt-semibold">{{
                  formatMoney(totalDiscount)
                }}</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-bt-grey-200">{{
                  $t("billing.fields.taxes")
                }}</span>
                <span class="font-bt-semibold">{{
                  formatMoney(totalTaxes)
                }}</span>
              </div>

              <div class="h-px bg-bt-primary-300/30 my-bt-spacing-8"></div>

              <div class="flex items-center justify-between">
                <span class="text-lg font-bt-semibold">{{
                  $t("billing.fields.total")
                }}</span>
                <span class="text-2xl font-bt-bold text-bt-accent-300">
                  {{ formatMoney(total) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-l border border-bt-grey-200 overflow-hidden">
          <div
            class="flex items-center justify-between px-bt-spacing-16 py-bt-spacing-12 bg-bt-primary-50 border-b border-bt-grey-200"
          >
            <h3 class="font-bt-semibold text-bt-primary-700">
              {{ $t("billing.lines.title") }}
            </h3>

            <button
              type="button"
              class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600"
              @click="addLine"
            >
              {{ $t("billing.lines.addLine") }}
            </button>
          </div>

          <div class="p-bt-spacing-16 space-y-bt-spacing-12">
            <div
              v-for="(line, index) in lines"
              :key="index"
              class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
            >
              <div
                class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-bt-spacing-12 items-end"
              >
                <div class="xl:col-span-2">
                  <label
                    class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                  >
                    {{ $t("billing.lines.product") }}
                  </label>
                  <select
                    v-model="line.productId"
                    class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                    @change="onProductChange(line)"
                  >
                    <option value="">
                      {{ $t("billing.placeholders.selectProduct") }}
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

                <div class="xl:col-span-2">
                  <label
                    class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                  >
                    {{ $t("billing.lines.description") }}
                  </label>
                  <input
                    v-model="line.description"
                    type="text"
                    class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                  />
                </div>

                <div>
                  <label
                    class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                  >
                    {{ $t("billing.lines.quantity") }}
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
                    {{ $t("billing.lines.unitPrice") }}
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
                    {{ $t("billing.lines.discountPerc") }}
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
                    {{ $t("billing.lines.taxPerc") }}
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
                    {{ $t("billing.fields.lineTotal") }}
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
                {{ $t("billing.fields.total") }}
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
  </div>
</template>
