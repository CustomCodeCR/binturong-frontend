<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  BadgePercent,
  CircleDollarSign,
  Tag,
  Receipt,
  Wallet,
} from "lucide-vue-next";

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
import type { DiscountPolicy } from "@/core/interfaces/discounts";

const { t } = useI18n();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();
const authStore = useAuthStore();

const clients = ref<SelectOption[]>([]);
const branches = ref<SelectOption[]>([]);
const products = ref<SelectOption[]>([]);
const services = ref<SelectOption[]>([]);
const discountPolicies = ref<SelectOption[]>([]);

const productCatalog = ref<Product[]>([]);
const serviceCatalog = ref<Service[]>([]);
const discountPoliciesCatalog = ref<DiscountPolicy[]>([]);

const loadingCatalogs = ref(false);
const loadingExchangeRate = ref(false);
const loading = ref(false);

const clientId = ref("");
const branchId = ref("");
const sellerUserId = ref("");
const currency = ref("CRC");
const exchangeRate = ref(1);
const notes = ref("");

const selectedGlobalPolicyId = ref("");
const globalDiscountPerc = ref(0);
const globalDiscountReason = ref("");
const requestApprovalIfNeeded = ref(true);

type ExtendedSalesOrderLineCreateRequest = SalesOrderLineCreateRequest;

const lines = ref<ExtendedSalesOrderLineCreateRequest[]>([
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
  return authStore.employeeFullName || authStore.username || authStore.email || "-";
});

const selectedGlobalPolicy = computed<DiscountPolicy | null>(() => {
  return (
    discountPoliciesCatalog.value.find(
      (item) =>
        item.policyId === selectedGlobalPolicyId.value ||
        item.id === selectedGlobalPolicyId.value,
    ) ?? null
  );
});

const subtotal = computed(() => {
  return lines.value.reduce((acc, line) => {
    return acc + Number(line.quantity) * Number(line.unitPrice);
  }, 0);
});

const globalDiscountAmount = computed(() => {
  return subtotal.value * (Number(globalDiscountPerc.value || 0) / 100);
});

const subtotalAfterGlobalDiscount = computed(() => {
  return subtotal.value - globalDiscountAmount.value;
});

const totalDiscount = computed(() => {
  return globalDiscountAmount.value;
});

const totalTaxes = computed(() => {
  const baseTaxes = lines.value.reduce((acc, line) => {
    const lineSubtotal = Number(line.quantity) * Number(line.unitPrice);
    return acc + lineSubtotal * (Number(line.taxPerc) / 100);
  }, 0);

  if (subtotal.value <= 0) return 0;

  const globalFactor = 1 - Number(globalDiscountPerc.value || 0) / 100;
  return baseTaxes * globalFactor;
});

const total = computed(() => {
  return subtotalAfterGlobalDiscount.value + totalTaxes.value;
});

const globalRequiresApproval = computed(() => {
  if (!selectedGlobalPolicy.value) return false;
  return (
    Number(globalDiscountPerc.value || 0) >
      Number(selectedGlobalPolicy.value.maxDiscountPercentage || 0) &&
    Boolean(selectedGlobalPolicy.value.requiresApprovalAboveLimit)
  );
});

function formatMoney(value: number): string {
  return value.toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getLineSubtotal(line: ExtendedSalesOrderLineCreateRequest): number {
  return Number(line.quantity) * Number(line.unitPrice);
}

function getLineTaxableBase(line: ExtendedSalesOrderLineCreateRequest): number {
  return getLineSubtotal(line);
}

function getLineTaxes(line: ExtendedSalesOrderLineCreateRequest): number {
  return getLineTaxableBase(line) * (Number(line.taxPerc) / 100);
}

function getLineTotal(line: ExtendedSalesOrderLineCreateRequest): number {
  return getLineTaxableBase(line) + getLineTaxes(line);
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
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "service" ? "Service" : "Product";
}

function getItemOptions(itemType: SalesOrderLineItemType): SelectOption[] {
  return normalizeItemType(itemType) === "Service" ? services.value : products.value;
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

function applyItemDefaults(line: ExtendedSalesOrderLineCreateRequest) {
  const itemType = normalizeItemType(line.itemType);
  const itemId = String(line.itemId ?? "").trim();
  if (!itemId) return;

  if (itemType === "Product") {
    const selectedProduct = findProduct(itemId);
    if (!selectedProduct) return;
    line.unitPrice = Number((selectedProduct as any).basePrice ?? 0);
    line.taxPerc = Number((selectedProduct as any).taxPercentage ?? 0);
    return;
  }

  const selectedService = findService(itemId);
  if (!selectedService) return;
  line.unitPrice = Number((selectedService as any).baseRate ?? 0);
  line.taxPerc = Number((selectedService as any).taxPercentage ?? 0);
}

function onItemTypeChange(line: ExtendedSalesOrderLineCreateRequest) {
  line.itemType = normalizeItemType(line.itemType);
  line.itemId = "";
  line.unitPrice = 0;
  line.discountPerc = 0;
  line.taxPerc = 0;
}

function onItemChange(line: ExtendedSalesOrderLineCreateRequest) {
  applyItemDefaults(line);
}

function resolvePolicyReason(policy: DiscountPolicy | null): string {
  if (!policy) return "";
  const candidate =
    (policy as any).defaultReason ??
    (policy as any).reason ??
    (policy as any).description ??
    (policy as any).name ??
    "";
  return String(candidate).trim();
}

function onGlobalPolicyChange() {
  const policy = selectedGlobalPolicy.value;
  if (!policy) {
    globalDiscountPerc.value = 0;
    globalDiscountReason.value = "";
    return;
  }
  globalDiscountPerc.value = Number(policy.maxDiscountPercentage ?? 0);
  globalDiscountReason.value = resolvePolicyReason(policy);
}

async function loadCatalogs() {
  loadingCatalogs.value = true;
  try {
    const [
      clientsResponse,
      branchesResponse,
      productsResponse,
      servicesResponse,
      discountPoliciesResponse,
      productsCatalogResponse,
      servicesCatalogResponse,
      policiesCatalogResponse,
    ] = await Promise.all([
      SelectService.selectClients({ onlyActive: true }),
      SelectService.selectBranches({ onlyActive: true }),
      SelectService.selectProducts({ onlyActive: true }),
      SelectService.selectServices({ onlyActive: true }),
      SelectService.selectDiscountPolicies({ onlyActive: true }),
      ProductsService.browse({ page: 1, pageSize: 500 } as any),
      ServicesService.browse({ page: 1, pageSize: 500 } as any),
      (async () => {
        const svc: any = await import("@/core/services/discountsService");
        return await svc.DiscountsService.browsePolicies({ page: 1, pageSize: 500, search: "" });
      })(),
    ]);

    clients.value = clientsResponse ?? [];
    branches.value = branchesResponse ?? [];
    products.value = productsResponse ?? [];
    services.value = servicesResponse ?? [];
    discountPolicies.value = discountPoliciesResponse ?? [];
    productCatalog.value = Array.isArray(productsCatalogResponse) ? productsCatalogResponse : [];
    serviceCatalog.value = Array.isArray(servicesCatalogResponse) ? servicesCatalogResponse : [];
    discountPoliciesCatalog.value = Array.isArray(policiesCatalogResponse) ? policiesCatalogResponse : [];
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
      exchangeRate.value = !Number.isNaN(rate) && rate > 0 ? rate : 1;
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
  const normalizedGlobalDiscountPerc = Number(globalDiscountPerc.value || 0);
  const normalizedGlobalDiscountReason = globalDiscountReason.value.trim();
  const normalizedSelectedGlobalPolicyId = selectedGlobalPolicyId.value.trim();

  if (!normalizedClientId) {
    toastStore.addToast({ severity: "error", title: t("toast.error"), message: t("sales.validation.clientRequired") });
    return;
  }

  if (!normalizedBranchId || !normalizedSellerUserId) {
    toastStore.addToast({ severity: "error", title: t("toast.error"), message: t("sales.validation.headerRequired") });
    return;
  }

  if (!lines.value.length) {
    toastStore.addToast({ severity: "error", title: t("toast.error"), message: t("sales.validation.linesRequired") });
    return;
  }

  if (normalizedGlobalDiscountPerc > 0 && !normalizedSelectedGlobalPolicyId) {
    toastStore.addToast({ severity: "error", title: t("toast.error"), message: t("sales.discounts.validation.policyRequired") });
    return;
  }

  if (normalizedGlobalDiscountPerc > 0 && !normalizedGlobalDiscountReason) {
    toastStore.addToast({ severity: "error", title: t("toast.error"), message: t("sales.discounts.validation.globalReasonRequired") });
    return;
  }

  const normalizedLines = lines.value.map((line) => ({
    itemType: normalizeItemType(line.itemType),
    itemId: String(line.itemId ?? "").trim(),
    quantity: Number(line.quantity),
    unitPrice: Number(line.unitPrice),
    discountPerc: 0,
    taxPerc: Number(line.taxPerc),
  }));

  const invalidLine = normalizedLines.some(
    (line) =>
      !line.itemType || !line.itemId ||
      Number.isNaN(line.quantity) || line.quantity <= 0 ||
      Number.isNaN(line.unitPrice) || line.unitPrice < 0 ||
      Number.isNaN(line.taxPerc) || line.taxPerc < 0,
  );

  if (invalidLine) {
    toastStore.addToast({ severity: "error", title: t("toast.error"), message: t("sales.validation.invalidLine") });
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
    } as any);

    const salesOrderId = created.salesOrderId;
    const discountsServiceModule: any = await import("@/core/services/discountsService");
    const discountsService = discountsServiceModule.DiscountsService;

    let globalDiscountRequestedForApproval = false;
    let globalDiscountApplied = false;

    if (normalizedGlobalDiscountPerc > 0) {
      if (globalRequiresApproval.value && requestApprovalIfNeeded.value) {
        await discountsService.requestGlobalApproval({
          salesOrderId,
          discountPerc: normalizedGlobalDiscountPerc,
          reason: normalizedGlobalDiscountReason,
        });
        globalDiscountRequestedForApproval = true;
      } else {
        await discountsService.applyGlobal({
          salesOrderId,
          discountPerc: normalizedGlobalDiscountPerc,
          reason: normalizedGlobalDiscountReason,
          policyId: normalizedSelectedGlobalPolicyId,
        });
        globalDiscountApplied = true;
      }
    }

    drawerStore.onSuccess?.({ salesOrderId });

    if (globalDiscountRequestedForApproval) {
      toastStore.addToast({ severity: "success", title: t("toast.success"), message: t("sales.discounts.sales.messages.approvalRequested") || "Discount approval requested successfully." });
    } else if (globalDiscountApplied) {
      toastStore.addToast({ severity: "success", title: t("toast.success"), message: t("sales.discounts.sales.messages.discountApplied") || "Discount applied successfully." });
    } else {
      toastStore.addToast({ severity: "success", title: t("toast.success"), message: t("sales.messages.createSuccess") });
    }

    drawerStore.closeDrawer();
  } catch (error: any) {
    toastStore.addToast({ severity: "error", title: t("toast.error"), message: error?.message ?? t("sales.messages.createError") });
  } finally {
    loading.value = false;
  }
}

watch(currency, async () => {
  await loadExchangeRate();
});

onMounted(async () => {
  sellerUserId.value = authStore.userId ?? "";
  branchId.value = authStore.employeeBranchId ?? "";
  await loadCatalogs();
  await loadExchangeRate();
});
</script>

<template>
  <div class="h-full bg-bt-white flex flex-col">
    <!-- Header -->
    <div class="px-bt-spacing-24 pt-bt-spacing-24 pb-bt-spacing-16 border-b border-bt-grey-200 shrink-0">
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

    <div v-if="loadingCatalogs" class="flex-1 flex items-center justify-center text-bt-grey-500">
      {{ $t("common.loading") }}
    </div>

    <div v-else class="flex-1 min-h-0 overflow-y-auto">
      <div class="p-bt-spacing-24 space-y-bt-spacing-24">

        <!-- General data + Summary -->
        <div class="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-bt-spacing-24">

          <!-- General data -->
          <div class="rounded-l border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16">
            <h3 class="text-base font-bt-semibold text-bt-primary-700 mb-bt-spacing-16">
              {{ $t("sales.sections.generalData") }}
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
              <div>
                <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{ $t("sales.fields.client") }}</label>
                <select
                  v-model="clientId"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                >
                  <option value="">{{ $t("sales.placeholders.selectClient") }}</option>
                  <option v-for="client in clients" :key="client.id" :value="client.id">{{ client.label }}</option>
                </select>
              </div>

              <div>
                <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{ $t("sales.fields.branch") }}</label>
                <select
                  v-model="branchId"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                >
                  <option value="">{{ $t("sales.placeholders.selectBranch") }}</option>
                  <option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.label }}</option>
                </select>
              </div>

              <div class="md:col-span-2">
                <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{ $t("sales.fields.seller") }}</label>
                <input
                  :value="currentSellerLabel"
                  type="text"
                  disabled
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-grey-100 text-bt-grey-700"
                />
              </div>

              <div>
                <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{ $t("sales.fields.currency") }}</label>
                <select
                  v-model="currency"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                >
                  <option value="CRC">CRC</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              <div>
                <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{ $t("sales.fields.exchangeRate") }}</label>
                <input
                  :value="loadingExchangeRate ? '...' : exchangeRate"
                  type="text"
                  disabled
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-grey-100 text-bt-grey-700"
                />
              </div>

              <div class="md:col-span-2">
                <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{ $t("sales.fields.notes") }}</label>
                <textarea
                  v-model="notes"
                  rows="3"
                  class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                />
              </div>
            </div>
          </div>

          <!-- Summary: KPI card style -->
          <div class="rounded-l border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16">
            <h3 class="text-base font-bt-semibold text-bt-primary-700 mb-bt-spacing-16">
              {{ $t("sales.sections.summary") }}
            </h3>

            <div class="space-y-bt-spacing-12">
              <!-- Subtotal -->
              <div class="rounded-m border border-bt-grey-200 bg-bt-white p-bt-spacing-12 shadow-bt-elevation-100">
                <div class="flex items-center gap-bt-spacing-12">
                  <div class="w-9 h-9 rounded-full bg-bt-primary-50 flex items-center justify-center text-bt-primary-600 shrink-0">
                    <CircleDollarSign :size="16" />
                  </div>
                  <div class="flex items-center justify-between flex-1 min-w-0">
                    <span class="text-sm text-bt-grey-500">{{ $t("sales.fields.subtotal") }}</span>
                    <span class="font-bt-bold text-bt-primary-700">{{ formatMoney(subtotal) }}</span>
                  </div>
                </div>
              </div>

              <!-- Discounts -->
              <div class="rounded-m border border-bt-warning-200 bg-bt-white p-bt-spacing-12 shadow-bt-elevation-100">
                <div class="flex items-center gap-bt-spacing-12">
                  <div class="w-9 h-9 rounded-full bg-bt-warning-100 flex items-center justify-center text-bt-warning-700 shrink-0">
                    <Tag :size="16" />
                  </div>
                  <div class="flex items-center justify-between flex-1 min-w-0">
                    <span class="text-sm text-bt-grey-500">{{ $t("sales.fields.discounts") }}</span>
                    <span class="font-bt-bold text-bt-warning-700">{{ formatMoney(totalDiscount) }}</span>
                  </div>
                </div>
              </div>

              <!-- Taxes -->
              <div class="rounded-m border border-bt-grey-200 bg-bt-white p-bt-spacing-12 shadow-bt-elevation-100">
                <div class="flex items-center gap-bt-spacing-12">
                  <div class="w-9 h-9 rounded-full bg-bt-info-100 flex items-center justify-center text-bt-info-700 shrink-0">
                    <Receipt :size="16" />
                  </div>
                  <div class="flex items-center justify-between flex-1 min-w-0">
                    <span class="text-sm text-bt-grey-500">{{ $t("sales.fields.taxes") }}</span>
                    <span class="font-bt-bold text-bt-info-700">{{ formatMoney(totalTaxes) }}</span>
                  </div>
                </div>
              </div>

              <!-- Total -->
              <div class="rounded-m border border-bt-primary-200 bg-bt-white p-bt-spacing-12 shadow-bt-elevation-100">
                <div class="flex items-center gap-bt-spacing-12">
                  <div class="w-9 h-9 rounded-full bg-bt-primary-50 flex items-center justify-center text-bt-primary-700 shrink-0">
                    <Wallet :size="16" />
                  </div>
                  <div class="flex items-center justify-between flex-1 min-w-0">
                    <span class="text-base font-bt-semibold text-bt-primary-700">{{ $t("sales.fields.total") }}</span>
                    <span class="text-xl font-bt-bold text-bt-primary-700">{{ formatMoney(total) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Global discount section -->
        <div class="rounded-l border border-bt-warning-200 bg-bt-warning-50 p-bt-spacing-16">
          <div class="flex items-center gap-bt-spacing-8 mb-bt-spacing-12">
            <BadgePercent :size="18" class="text-bt-warning-700" />
            <h3 class="font-bt-semibold text-bt-warning-700">
              {{ $t("sales.discounts.sections.globalDiscount") }}
            </h3>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-bt-spacing-16">
            <div>
              <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{ $t("sales.discounts.fields.policy") }}</label>
              <select
                v-model="selectedGlobalPolicyId"
                class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-warning-500"
                @change="onGlobalPolicyChange"
              >
                <option value="">{{ $t("sales.discounts.placeholders.selectPolicy") }}</option>
                <option v-for="policy in discountPolicies" :key="policy.id" :value="policy.id">{{ policy.label }}</option>
              </select>
            </div>

            <div>
              <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{ $t("sales.discounts.fields.discountPerc") }}</label>
              <input
                v-model.number="globalDiscountPerc"
                type="number"
                min="0"
                max="100"
                step="0.01"
                class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-warning-500"
              />
            </div>

            <div>
              <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{ $t("sales.discounts.fields.discountAmount") }}</label>
              <input
                :value="formatMoney(globalDiscountAmount)"
                type="text"
                disabled
                class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-grey-100 text-bt-grey-700"
              />
            </div>

            <div>
              <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{ $t("sales.discounts.fields.globalDiscountReason") }}</label>
              <input
                v-model="globalDiscountReason"
                type="text"
                class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-warning-500"
              />
            </div>
          </div>

          <div class="mt-bt-spacing-12 flex flex-wrap items-center gap-bt-spacing-12">
            <label class="inline-flex items-center gap-bt-spacing-8 text-sm text-bt-grey-700">
              <input v-model="requestApprovalIfNeeded" type="checkbox" />
              {{ $t("sales.discounts.fields.requestApprovalIfNeeded") }}
            </label>

            <span
              v-if="Number(globalDiscountPerc) > 0"
              class="inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold bg-bt-info-100 text-bt-info-700"
            >
              {{ globalDiscountPerc }}%
            </span>

            <span
              v-if="globalRequiresApproval"
              class="inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold bg-bt-warning-100 text-bt-warning-700"
            >
              {{ $t("sales.discounts.labels.requiresApproval") }}
            </span>

            <span
              v-else-if="Number(globalDiscountPerc) > 0"
              class="inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold bg-bt-success-100 text-bt-success-700"
            >
              {{ $t("sales.discounts.labels.withinPolicy") }}
            </span>
          </div>
        </div>

        <!-- Lines -->
        <div class="rounded-l border border-bt-grey-200 overflow-hidden">
          <div class="flex items-center justify-between px-bt-spacing-16 py-bt-spacing-12 bg-bt-primary-50 border-b border-bt-grey-200">
            <h3 class="font-bt-semibold text-bt-primary-700">{{ $t("sales.lines.title") }}</h3>
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
              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-bt-spacing-12 items-end">
                <div>
                  <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{ $t("sales.lines.itemType") }}</label>
                  <select
                    v-model="line.itemType"
                    class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                    @change="onItemTypeChange(line)"
                  >
                    <option value="Product">{{ $t("sales.lines.productType") }}</option>
                    <option value="Service">{{ $t("sales.lines.serviceType") }}</option>
                  </select>
                </div>

                <div class="xl:col-span-2">
                  <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{ $t("sales.lines.item") }}</label>
                  <select
                    v-model="line.itemId"
                    class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                    @change="onItemChange(line)"
                  >
                    <option value="">{{ $t("sales.placeholders.selectItem") }}</option>
                    <option v-for="item in getItemOptions(line.itemType)" :key="item.id" :value="item.id">{{ item.label }}</option>
                  </select>
                </div>

                <div>
                  <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{ $t("sales.lines.quantity") }}</label>
                  <input
                    v-model.number="line.quantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                  />
                </div>

                <div>
                  <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{ $t("sales.lines.unitPrice") }}</label>
                  <input
                    v-model.number="line.unitPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
                  />
                </div>

                <div>
                  <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{ $t("sales.lines.taxPerc") }}</label>
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
                      class="px-bt-spacing-12 py-bt-spacing-12 rounded-m bg-bt-error-100 text-bt-error-700 hover:bg-bt-error-200"
                      @click="removeLine(index)"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[220px_220px] gap-bt-spacing-12 mt-bt-spacing-12 justify-end">
                <div class="rounded-m border border-bt-grey-200 bg-bt-white px-bt-spacing-16 py-bt-spacing-12">
                  <div class="text-xs text-bt-grey-500">{{ $t("sales.fields.subtotal") }}</div>
                  <div class="text-base font-bt-bold text-bt-primary-700 mt-bt-spacing-4">{{ formatMoney(getLineSubtotal(line)) }}</div>
                </div>
                <div class="rounded-m border border-bt-grey-200 bg-bt-white px-bt-spacing-16 py-bt-spacing-12">
                  <div class="text-xs text-bt-grey-500">{{ $t("sales.fields.lineTotal") }}</div>
                  <div class="text-base font-bt-bold text-bt-primary-700 mt-bt-spacing-4">{{ formatMoney(getLineTotal(line)) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Lines footer total -->
          <div class="px-bt-spacing-16 py-bt-spacing-16 border-t border-bt-grey-200 bg-bt-grey-50 flex justify-end">
            <div class="text-right">
              <div class="text-sm text-bt-grey-600">{{ $t("sales.fields.total") }}</div>
              <div class="text-2xl font-bt-bold text-bt-primary-700">{{ formatMoney(total) }}</div>
            </div>
          </div>
        </div>

        <!-- Footer actions -->
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
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled font-bt-semibold"
            @click="submit"
          >
            {{ loading ? $t("common.loading") : $t("common.save") }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>