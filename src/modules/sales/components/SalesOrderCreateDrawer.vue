<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";
import { useAuthStore } from "@/core/stores/authStore";

import { SalesOrdersService } from "@/core/services/salesOrdersService";
import { SelectService } from "@/core/services/selectService";
import { ProductsService } from "@/core/services/productsService";
import { ServicesService } from "@/core/services/servicesService";

import type { SelectOption } from "@/core/interfaces/select";
import type {
  SalesOrderLineCreateRequest,
  SalesOrderLineItemType,
} from "@/core/interfaces/salesOrders";
import type { Product } from "@/core/interfaces/products";
import type { Service } from "@/core/interfaces/services";

const { t } = useI18n();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();
const authStore = useAuthStore();

const clients = ref<SelectOption[]>([]);
const branches = ref<SelectOption[]>([]);
const users = ref<SelectOption[]>([]);
const products = ref<SelectOption[]>([]);
const services = ref<SelectOption[]>([]);

const productCatalog = ref<Product[]>([]);
const serviceCatalog = ref<Service[]>([]);

const loadingCatalogs = ref(false);
const loadingExchangeRate = ref(false);
const loading = ref(false);

const clientId = ref("");
const branchId = ref("");
const sellerUserId = ref("");
const currency = ref("CRC");
const exchangeRate = ref(1);
const notes = ref("");

const lines = ref<SalesOrderLineCreateRequest[]>([
  {
    itemType: "Product",
    itemId: "",
    quantity: 1,
    unitPrice: 0,
    discountPerc: 0,
    taxPerc: 0,
  },
]);

const currentSellerLabel = computed(() => {
  return (
    authStore.employeeFullName || authStore.username || authStore.email || "-"
  );
});

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

function getLineTotal(line: SalesOrderLineCreateRequest): number {
  const lineSubtotal = Number(line.quantity) * Number(line.unitPrice);
  const discount = lineSubtotal * (Number(line.discountPerc) / 100);
  const taxable = lineSubtotal - discount;
  const taxes = taxable * (Number(line.taxPerc) / 100);

  return taxable + taxes;
}

function addLine() {
  lines.value.push({
    itemType: "Product",
    itemId: "",
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

function normalizeItemType(value?: string | null): SalesOrderLineItemType {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (normalized === "service") {
    return "Service";
  }

  return "Product";
}

function getItemOptions(itemType: SalesOrderLineItemType): SelectOption[] {
  return normalizeItemType(itemType) === "Service"
    ? services.value
    : products.value;
}

function findProduct(productId: string): Product | undefined {
  return productCatalog.value.find(
    (product) => product.productId === productId || product.id === productId,
  );
}

function findService(serviceId: string): Service | undefined {
  return serviceCatalog.value.find(
    (service) => service.serviceId === serviceId || service.id === serviceId,
  );
}

function applyItemDefaults(line: SalesOrderLineCreateRequest) {
  const itemType = normalizeItemType(line.itemType);
  const itemId = String(line.itemId ?? "").trim();

  if (!itemId) {
    return;
  }

  if (itemType === "Product") {
    const selectedProduct = findProduct(itemId);

    if (!selectedProduct) {
      return;
    }

    line.unitPrice = Number(selectedProduct.basePrice ?? 0);
    line.taxPerc = Number(selectedProduct.taxPercentage ?? 0);
    return;
  }

  const selectedService = findService(itemId);

  if (!selectedService) {
    return;
  }

  line.unitPrice = Number(selectedService.basePrice ?? 0);
  line.taxPerc = Number(selectedService.taxPercentage ?? 0);
}

function onItemTypeChange(line: SalesOrderLineCreateRequest) {
  line.itemType = normalizeItemType(line.itemType);
  line.itemId = "";
  line.unitPrice = 0;
  line.discountPerc = 0;
  line.taxPerc = 0;
}

function onItemChange(line: SalesOrderLineCreateRequest) {
  applyItemDefaults(line);
}

async function loadCatalogs() {
  loadingCatalogs.value = true;

  try {
    const [
      clientsResponse,
      branchesResponse,
      usersResponse,
      productsResponse,
      servicesResponse,
      productsCatalogResponse,
      servicesCatalogResponse,
    ] = await Promise.all([
      SelectService.selectClients({ onlyActive: true }),
      SelectService.selectBranches({ onlyActive: true }),
      SelectService.selectUsers({ onlyActive: true }),
      SelectService.selectProducts({ onlyActive: true }),
      SelectService.selectServices({ onlyActive: true }),
      ProductsService.browse({
        page: 1,
        pageSize: 500,
      }),
      ServicesService.browse({
        page: 1,
        pageSize: 500,
      }),
    ]);

    clients.value = clientsResponse ?? [];
    branches.value = branchesResponse ?? [];
    users.value = usersResponse ?? [];
    products.value = productsResponse ?? [];
    services.value = servicesResponse ?? [];

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

    if (Array.isArray(servicesCatalogResponse)) {
      serviceCatalog.value = servicesCatalogResponse;
    } else if (
      servicesCatalogResponse &&
      typeof servicesCatalogResponse === "object" &&
      "items" in servicesCatalogResponse &&
      Array.isArray((servicesCatalogResponse as { items: Service[] }).items)
    ) {
      serviceCatalog.value = (
        servicesCatalogResponse as { items: Service[] }
      ).items;
    } else if (
      servicesCatalogResponse &&
      typeof servicesCatalogResponse === "object" &&
      "data" in servicesCatalogResponse &&
      Array.isArray((servicesCatalogResponse as { data: Service[] }).data)
    ) {
      serviceCatalog.value = (
        servicesCatalogResponse as { data: Service[] }
      ).data;
    } else {
      serviceCatalog.value = [];
    }
  } catch (error: any) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: error?.message ?? t("sales.messages.loadCatalogsError"),
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
    } catch {
      exchangeRate.value = 1;
    } finally {
      loadingExchangeRate.value = false;
    }
  }
}

async function submit() {
  const normalizedClientId = clientId.value.trim();
  const normalizedBranchId = branchId.value.trim();
  const normalizedSellerUserId = sellerUserId.value.trim();
  const normalizedCurrency = currency.value.trim().toUpperCase();
  const normalizedExchangeRate = Number(exchangeRate.value);

  if (!normalizedClientId) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("sales.validation.clientRequired"),
    });
    return;
  }

  if (!normalizedBranchId || !normalizedSellerUserId) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("sales.validation.headerRequired"),
    });
    return;
  }

  if (!lines.value.length) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("sales.validation.linesRequired"),
    });
    return;
  }

  const normalizedLines: SalesOrderLineCreateRequest[] = lines.value.map(
    (line) => ({
      itemType: normalizeItemType(line.itemType),
      itemId: String(line.itemId ?? "").trim(),
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
      discountPerc: Number(line.discountPerc),
      taxPerc: Number(line.taxPerc),
    }),
  );

  const invalidLine = normalizedLines.some(
    (line) =>
      !line.itemType ||
      !line.itemId ||
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
      message: t("sales.validation.invalidLine"),
    });
    return;
  }

  loading.value = true;

  try {
    const created = await SalesOrdersService.create({
      clientId: normalizedClientId,
      branchId: normalizedBranchId,
      sellerUserId: normalizedSellerUserId,
      currency: normalizedCurrency,
      exchangeRate: normalizedExchangeRate,
      notes: notes.value.trim() || null,
      lines: normalizedLines,
    });

    drawerStore.onSuccess?.({
      salesOrderId: created.salesOrderId,
    });

    drawerStore.closeDrawer();
  } catch (error: any) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: error?.message ?? t("sales.messages.createError"),
    });
  } finally {
    loading.value = false;
  }
}

watch(currency, async () => {
  await loadExchangeRate();
});

watch(
  lines,
  (currentLines) => {
    for (const line of currentLines) {
      const itemId = String(line.itemId ?? "").trim();
      const itemType = normalizeItemType(line.itemType);

      if (!itemId) {
        continue;
      }

      if (itemType === "Product") {
        const selectedProduct = findProduct(itemId);

        if (!selectedProduct) {
          continue;
        }

        if (Number(line.unitPrice) <= 0) {
          line.unitPrice = Number(selectedProduct.basePrice ?? 0);
        }

        if (Number(line.taxPerc) < 0 || Number.isNaN(Number(line.taxPerc))) {
          line.taxPerc = Number(selectedProduct.taxPercentage ?? 0);
        }

        continue;
      }

      const selectedService = findService(itemId);

      if (!selectedService) {
        continue;
      }

      if (Number(line.unitPrice) <= 0) {
        line.unitPrice = Number(selectedService.basePrice ?? 0);
      }

      if (Number(line.taxPerc) < 0 || Number.isNaN(Number(line.taxPerc))) {
        line.taxPerc = Number(selectedService.taxPercentage ?? 0);
      }
    }
  },
  { deep: true },
);

onMounted(async () => {
  sellerUserId.value = authStore.userId ?? "";
  branchId.value = authStore.employeeBranchId ?? "";

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
            {{ $t("sales.drawer.createTitle") }}
          </h2>
          <p class="text-bt-grey-600 mt-bt-spacing-8">
            {{ $t("sales.drawer.createDescription") }}
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
              {{ $t("sales.sections.generalData") }}
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
              <div>
                <label
                  class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                >
                  {{ $t("sales.fields.client") }}
                </label>
                <select
                  v-model="clientId"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                >
                  <option value="">
                    {{ $t("sales.placeholders.selectClient") }}
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
                  {{ $t("sales.fields.branch") }}
                </label>
                <select
                  v-model="branchId"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                >
                  <option value="">
                    {{ $t("sales.placeholders.selectBranch") }}
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

              <div class="md:col-span-2">
                <label
                  class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                >
                  {{ $t("sales.fields.seller") }}
                </label>
                <input
                  :value="currentSellerLabel"
                  type="text"
                  disabled
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-grey-100 text-bt-grey-700"
                />
              </div>

              <div>
                <label
                  class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                >
                  {{ $t("sales.fields.currency") }}
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
                  {{ $t("sales.fields.exchangeRate") }}
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
                  {{ $t("sales.fields.notes") }}
                </label>
                <textarea
                  v-model="notes"
                  rows="3"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                />
              </div>
            </div>
          </div>

          <div
            class="rounded-l border border-bt-grey-200 bg-bt-primary-700 text-bt-white p-bt-spacing-16"
          >
            <h3 class="text-base font-bt-semibold mb-bt-spacing-16">
              {{ $t("sales.sections.summary") }}
            </h3>

            <div class="space-y-bt-spacing-12">
              <div class="flex items-center justify-between">
                <span class="text-bt-grey-200">{{
                  $t("sales.fields.subtotal")
                }}</span>
                <span class="font-bt-semibold">{{
                  formatMoney(subtotal)
                }}</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-bt-grey-200">{{
                  $t("sales.fields.discounts")
                }}</span>
                <span class="font-bt-semibold">{{
                  formatMoney(totalDiscount)
                }}</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-bt-grey-200">{{
                  $t("sales.fields.taxes")
                }}</span>
                <span class="font-bt-semibold">{{
                  formatMoney(totalTaxes)
                }}</span>
              </div>

              <div class="h-px bg-bt-primary-300/30 my-bt-spacing-8"></div>

              <div class="flex items-center justify-between">
                <span class="text-lg font-bt-semibold">{{
                  $t("sales.fields.total")
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
              {{ $t("sales.lines.title") }}
            </h3>

            <button
              type="button"
              class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600"
              @click="addLine"
            >
              {{ $t("sales.lines.addLine") }}
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
                <div>
                  <label
                    class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                  >
                    {{ $t("sales.lines.itemType") }}
                  </label>
                  <select
                    v-model="line.itemType"
                    class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                    @change="onItemTypeChange(line)"
                  >
                    <option value="Product">
                      {{ $t("sales.lines.productType") }}
                    </option>
                    <option value="Service">
                      {{ $t("sales.lines.serviceType") }}
                    </option>
                  </select>
                </div>

                <div class="xl:col-span-2">
                  <label
                    class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                  >
                    {{ $t("sales.lines.item") }}
                  </label>
                  <select
                    v-model="line.itemId"
                    class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                    @change="onItemChange(line)"
                  >
                    <option value="">
                      {{ $t("sales.placeholders.selectItem") }}
                    </option>
                    <option
                      v-for="item in getItemOptions(line.itemType)"
                      :key="item.id"
                      :value="item.id"
                    >
                      {{ item.label }}
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    class="block mb-bt-spacing-8 text-sm text-bt-primary-700"
                  >
                    {{ $t("sales.lines.quantity") }}
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
                    {{ $t("sales.lines.unitPrice") }}
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
                    {{ $t("sales.lines.discountPerc") }}
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
                    {{ $t("sales.lines.taxPerc") }}
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
                    {{ $t("sales.fields.lineTotal") }}
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
                {{ $t("sales.fields.total") }}
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
