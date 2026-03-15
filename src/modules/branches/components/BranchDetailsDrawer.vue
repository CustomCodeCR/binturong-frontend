<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useModalStore } from "@/core/stores/modalStore";
import { useToastStore } from "@/core/stores/toastStore";
import { useAuthStore } from "@/core/stores/authStore";

import { BranchesService } from "@/core/services/branchesService";
import { ProductsService } from "@/core/services/productsService";
import { WarehousesService } from "@/core/services/warehousesService";
import { InventoryTransfersService } from "@/core/services/inventoryTransfersService";

import WarehouseCreateModal from "@/modules/branches/components/WarehouseCreateModal.vue";
import WarehouseEditModal from "@/modules/branches/components/WarehouseEditModal.vue";

import type {
  Branch,
  BranchInventoryItem,
  CompareBranchesResponse,
  BranchSalesReport,
} from "@/core/interfaces/branches";
import type { Product } from "@/core/interfaces/products";

interface WarehouseSuccessPayload {
  warehouseId: string;
  code: string;
  name: string;
  isActive: boolean;
}

const props = defineProps<{
  branchId: string;
  onWarehousesChanged?: (
    warehouses: Branch["warehouses"],
  ) => void | Promise<void>;
}>();

const { t } = useI18n();

const drawerStore = useDrawerStore();
const modalStore = useModalStore();
const toastStore = useToastStore();
const authStore = useAuthStore();

const activeTab = ref<
  "details" | "inventory" | "transfer" | "warehouses" | "reports"
>("details");

const loadingBranch = ref(false);
const loadingInventory = ref(false);
const loadingProducts = ref(false);
const loadingReport = ref(false);
const loadingCompare = ref(false);
const transferLoading = ref(false);

const branch = ref<Branch | null>(null);
const inventory = ref<BranchInventoryItem[]>([]);
const products = ref<Product[]>([]);
const salesReport = ref<BranchSalesReport | null>(null);
const compareReport = ref<CompareBranchesResponse | null>(null);
const branchesForCompare = ref<Branch[]>([]);

const inventorySearch = ref("");
const compareBranchId = ref("");
const reportFrom = ref("");
const reportTo = ref("");

const transferProductId = ref("");
const transferToBranchId = ref("");
const transferFromWarehouseId = ref("");
const transferToWarehouseId = ref("");
const transferQuantity = ref<number | null>(null);
const transferNotes = ref("");
const transferRequireApproval = ref(true);

const filteredInventory = computed(() => {
  const term = inventorySearch.value.trim().toLowerCase();
  if (!term) return inventory.value;

  return inventory.value.filter((item) => {
    return (
      item.productId.toLowerCase().includes(term) ||
      (item.productName ?? "").toLowerCase().includes(term)
    );
  });
});

const selectedToBranch = computed(() => {
  return (
    branchesForCompare.value.find(
      (item) => item.branchId === transferToBranchId.value,
    ) ?? null
  );
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function replaceBranch(nextBranch: Branch | null) {
  branch.value = nextBranch
    ? {
        ...nextBranch,
        warehouses: [...(nextBranch.warehouses ?? [])],
      }
    : null;
}

async function fetchBranch(): Promise<Branch> {
  return await BranchesService.readById(props.branchId);
}

async function loadBranch() {
  loadingBranch.value = true;

  try {
    replaceBranch(await fetchBranch());
  } finally {
    loadingBranch.value = false;
  }
}

async function loadInventory() {
  loadingInventory.value = true;

  try {
    inventory.value = await BranchesService.browseInventoryByBranchId(
      props.branchId,
    );
  } finally {
    loadingInventory.value = false;
  }
}

async function loadProducts() {
  loadingProducts.value = true;

  try {
    products.value = await ProductsService.browse({
      page: 1,
      pageSize: 100,
    });
  } finally {
    loadingProducts.value = false;
  }
}

async function loadBranchesForCompare() {
  try {
    branchesForCompare.value = await BranchesService.browse({
      page: 1,
      pageSize: 100,
    });
  } catch {
    branchesForCompare.value = [];
  }
}

async function loadSalesReport() {
  loadingReport.value = true;

  try {
    salesReport.value = await BranchesService.reportSalesByBranch(
      props.branchId,
      {
        from: reportFrom.value || undefined,
        to: reportTo.value || undefined,
      },
    );
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("branches.reports.messages.loadError"),
    });
  } finally {
    loadingReport.value = false;
  }
}

async function loadCompareReport() {
  if (!compareBranchId.value) return;

  loadingCompare.value = true;

  try {
    compareReport.value = await BranchesService.compare({
      branchAId: props.branchId,
      branchBId: compareBranchId.value,
      from: reportFrom.value || undefined,
      to: reportTo.value || undefined,
    });
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("branches.reports.messages.compareError"),
    });
  } finally {
    loadingCompare.value = false;
  }
}

async function exportPdf() {
  try {
    const blob = await BranchesService.reportSalesByBranchPdf(props.branchId, {
      from: reportFrom.value || undefined,
      to: reportTo.value || undefined,
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `branch-report-${props.branchId}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("branches.reports.messages.exportPdfError"),
    });
  }
}

async function exportExcel() {
  try {
    const blob = await BranchesService.reportSalesByBranchExcel(
      props.branchId,
      {
        from: reportFrom.value || undefined,
        to: reportTo.value || undefined,
      },
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `branch-report-${props.branchId}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("branches.reports.messages.exportExcelError"),
    });
  }
}

function patchWarehouseInBranch(payload: WarehouseSuccessPayload) {
  if (!branch.value) return;

  const currentWarehouses = [...(branch.value.warehouses ?? [])];
  const warehouseIndex = currentWarehouses.findIndex(
    (warehouse) => warehouse.warehouseId === payload.warehouseId,
  );

  const nextWarehouse = {
    warehouseId: payload.warehouseId,
    code: payload.code,
    name: payload.name,
    isActive: payload.isActive,
  };

  if (warehouseIndex >= 0) {
    currentWarehouses[warehouseIndex] = {
      ...currentWarehouses[warehouseIndex],
      ...nextWarehouse,
    };
  } else {
    currentWarehouses.unshift(nextWarehouse);
  }

  replaceBranch({
    ...branch.value,
    warehouses: currentWarehouses,
  });
}

function removeWarehouseFromBranch(warehouseId: string) {
  if (!branch.value) return;

  replaceBranch({
    ...branch.value,
    warehouses: (branch.value.warehouses ?? []).filter(
      (warehouse) => warehouse.warehouseId !== warehouseId,
    ),
  });
}

function hasWarehouseReachedExpectedState(
  currentBranch: Branch | null,
  payload: WarehouseSuccessPayload,
): boolean {
  if (!currentBranch) return false;

  const warehouse = (currentBranch.warehouses ?? []).find(
    (item) => item.warehouseId === payload.warehouseId,
  );

  if (!warehouse) return false;

  return (
    warehouse.code === payload.code &&
    warehouse.name === payload.name &&
    warehouse.isActive === payload.isActive
  );
}

async function reloadBranchUntil(
  predicate: (fetchedBranch: Branch) => boolean,
  options?: {
    attempts?: number;
    delayMs?: number;
  },
) {
  const attempts = options?.attempts ?? 12;
  const delayMs = options?.delayMs ?? 500;

  loadingBranch.value = true;

  try {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const fetchedBranch = await fetchBranch();

      if (predicate(fetchedBranch)) {
        replaceBranch(fetchedBranch);
        return;
      }

      if (attempt < attempts - 1) {
        await sleep(delayMs);
      }
    }

    replaceBranch(await fetchBranch());
  } finally {
    loadingBranch.value = false;
  }
}

function openCreateWarehouseModal() {
  modalStore.open({
    component: WarehouseCreateModal,
    props: {
      branchId: props.branchId,
    },
    onSuccess: async (payload?: WarehouseSuccessPayload) => {
      if (payload?.warehouseId) {
        patchWarehouseInBranch(payload);
      }

      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("branches.warehouses.messages.createSuccess"),
      });

      if (payload?.warehouseId) {
        await reloadBranchUntil(
          (fetchedBranch) =>
            (fetchedBranch.warehouses ?? []).some(
              (warehouse) => warehouse.warehouseId === payload.warehouseId,
            ),
          {
            attempts: 12,
            delayMs: 500,
          },
        );

        await props.onWarehousesChanged?.(branch.value?.warehouses ?? []);
        return;
      }

      await loadBranch();
      await props.onWarehousesChanged?.(branch.value?.warehouses ?? []);
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message:
          error?.message ?? t("branches.warehouses.messages.createError"),
      });
    },
  });
}

function openEditWarehouseModal(warehouse: Branch["warehouses"][number]) {
  modalStore.open({
    component: WarehouseEditModal,
    props: {
      warehouseId: warehouse.warehouseId,
      code: warehouse.code,
      name: warehouse.name,
      isActive: warehouse.isActive,
    },
    onSuccess: async (payload?: WarehouseSuccessPayload) => {
      if (payload?.warehouseId) {
        patchWarehouseInBranch(payload);
      }

      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("branches.warehouses.messages.updateSuccess"),
      });

      if (payload?.warehouseId) {
        await reloadBranchUntil(
          (fetchedBranch) =>
            hasWarehouseReachedExpectedState(fetchedBranch, payload),
          {
            attempts: 12,
            delayMs: 500,
          },
        );

        await props.onWarehousesChanged?.(branch.value?.warehouses ?? []);
        return;
      }

      await loadBranch();
      await props.onWarehousesChanged?.(branch.value?.warehouses ?? []);
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message:
          error?.message ?? t("branches.warehouses.messages.updateError"),
      });
    },
  });
}

async function deleteWarehouse(warehouseId: string) {
  try {
    removeWarehouseFromBranch(warehouseId);

    await WarehousesService.delete(warehouseId);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("branches.warehouses.messages.deleteSuccess"),
    });

    await reloadBranchUntil(
      (fetchedBranch) =>
        !(fetchedBranch.warehouses ?? []).some(
          (warehouse) => warehouse.warehouseId === warehouseId,
        ),
      {
        attempts: 12,
        delayMs: 500,
      },
    );

    await props.onWarehousesChanged?.(branch.value?.warehouses ?? []);
  } catch {
    await loadBranch();

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("branches.warehouses.messages.deleteError"),
    });
  }
}

async function submitTransfer() {
  if (
    !branch.value ||
    !transferProductId.value ||
    !transferToBranchId.value ||
    !transferFromWarehouseId.value ||
    !transferToWarehouseId.value ||
    transferQuantity.value === null ||
    transferQuantity.value <= 0
  ) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("branches.transfer.validation.required"),
    });
    return;
  }

  if (!authStore.userId) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("branches.transfer.validation.userRequired"),
    });
    return;
  }

  try {
    transferLoading.value = true;

    const created = await InventoryTransfersService.createInventoryTransfer({
      fromBranchId: branch.value.branchId,
      toBranchId: transferToBranchId.value,
      notes: transferNotes.value.trim(),
      createdByUserId: authStore.userId,
      lines: [
        {
          productId: transferProductId.value,
          quantity: Number(transferQuantity.value),
          fromWarehouseId: transferFromWarehouseId.value,
          toWarehouseId: transferToWarehouseId.value,
        },
      ],
    });

    await InventoryTransfersService.confirmInventoryTransfer(
      created.transferId,
      {
        requireApproval: transferRequireApproval.value,
      },
    );

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: transferRequireApproval.value
        ? t("branches.messages.transferPending")
        : t("branches.messages.transferSuccess"),
    });

    transferProductId.value = "";
    transferToBranchId.value = "";
    transferFromWarehouseId.value = "";
    transferToWarehouseId.value = "";
    transferQuantity.value = null;
    transferNotes.value = "";

    await loadInventory();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("branches.messages.transferError"),
    });
  } finally {
    transferLoading.value = false;
  }
}

function closeDrawer() {
  drawerStore.closeDrawer();
}

onMounted(async () => {
  await Promise.all([
    loadBranch(),
    loadInventory(),
    loadProducts(),
    loadBranchesForCompare(),
    loadSalesReport(),
  ]);
});

watch(
  () => props.branchId,
  async () => {
    await Promise.all([
      loadBranch(),
      loadInventory(),
      loadProducts(),
      loadBranchesForCompare(),
      loadSalesReport(),
    ]);
  },
);
</script>

<template>
  <div class="h-full bg-bt-white p-bt-spacing-24 overflow-y-auto">
    <div class="flex items-start justify-between mb-bt-spacing-24">
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t("branches.drawer.title") }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{ $t("branches.drawer.description", { name: branch?.name ?? "" }) }}
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

    <div class="flex flex-wrap gap-bt-spacing-8 mb-bt-spacing-24">
      <button
        v-for="tab in [
          'details',
          'inventory',
          'transfer',
          'warehouses',
          'reports',
        ]"
        :key="tab"
        type="button"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m transition"
        :class="
          activeTab === tab
            ? 'bg-bt-primary-500 text-bt-white'
            : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'
        "
        @click="activeTab = tab as typeof activeTab.value"
      >
        {{ $t(`branches.drawer.tabs.${tab}`) }}
      </button>
    </div>

    <template v-if="activeTab === 'details'">
      <div v-if="loadingBranch" class="text-bt-grey-500">
        {{ $t("common.loading") }}
      </div>

      <div
        v-else-if="branch"
        class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16"
      >
        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("branches.fields.code") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ branch.code }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("branches.fields.name") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ branch.name }}
          </div>
        </div>

        <div
          class="md:col-span-2 p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("branches.fields.address") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ branch.address }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("branches.fields.phone") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ branch.phone }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("branches.fields.isActive") }}
          </div>
          <div
            class="font-bt-semibold"
            :class="
              branch.isActive ? 'text-bt-success-700' : 'text-bt-error-700'
            "
          >
            {{
              branch.isActive
                ? $t("branches.status.active")
                : $t("branches.status.inactive")
            }}
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="activeTab === 'inventory'">
      <div class="mb-bt-spacing-16">
        <input
          v-model="inventorySearch"
          type="text"
          :placeholder="$t('branches.inventory.searchPlaceholder')"
          class="w-full max-w-xl px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div v-if="loadingInventory" class="text-bt-grey-500">
        {{ $t("common.loading") }}
      </div>

      <div v-else class="rounded-m border border-bt-grey-200 overflow-hidden">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("branches.inventory.table.productId") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("branches.inventory.table.productName") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("branches.inventory.table.stock") }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in filteredInventory"
              :key="`${item.productId}-${item.productName}`"
              class="border-t border-bt-grey-200"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ item.productId }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ item.productName ?? "-" }}
              </td>
              <td
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700 font-bt-semibold"
              >
                {{ item.stock }}
              </td>
            </tr>

            <tr v-if="!filteredInventory.length">
              <td
                colspan="3"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("branches.inventory.empty") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <template v-else-if="activeTab === 'transfer'">
      <div v-if="!branch" class="text-bt-grey-500">
        {{ $t("common.loading") }}
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("branches.transfer.product") }}
          </label>
          <select
            v-model="transferProductId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">
              {{ $t("branches.transfer.selectProduct") }}
            </option>
            <option
              v-for="product in products"
              :key="product.productId"
              :value="product.productId"
            >
              {{ product.sku }} - {{ product.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("branches.transfer.toBranch") }}
          </label>
          <select
            v-model="transferToBranchId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">{{ $t("branches.transfer.selectBranch") }}</option>
            <option
              v-for="item in branchesForCompare.filter(
                (x) => x.branchId !== branch?.branchId,
              )"
              :key="item.branchId"
              :value="item.branchId"
            >
              {{ item.code }} - {{ item.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("branches.transfer.fromWarehouse") }}
          </label>
          <select
            v-model="transferFromWarehouseId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">
              {{ $t("branches.transfer.selectWarehouse") }}
            </option>
            <option
              v-for="warehouse in branch.warehouses"
              :key="warehouse.warehouseId"
              :value="warehouse.warehouseId"
            >
              {{ warehouse.code }} - {{ warehouse.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("branches.transfer.toWarehouse") }}
          </label>
          <select
            v-model="transferToWarehouseId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">
              {{ $t("branches.transfer.selectWarehouse") }}
            </option>
            <option
              v-for="warehouse in selectedToBranch?.warehouses ?? []"
              :key="warehouse.warehouseId"
              :value="warehouse.warehouseId"
            >
              {{ warehouse.code }} - {{ warehouse.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("branches.transfer.quantity") }}
          </label>
          <input
            v-model.number="transferQuantity"
            type="number"
            min="0.01"
            step="0.01"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div class="flex items-center gap-bt-spacing-8 pt-bt-spacing-32">
          <input v-model="transferRequireApproval" type="checkbox" />
          <span class="text-bt-primary-700">
            {{ $t("branches.transfer.requireApproval") }}
          </span>
        </div>

        <div class="md:col-span-2">
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("branches.transfer.notes") }}
          </label>
          <textarea
            v-model="transferNotes"
            rows="4"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div class="md:col-span-2 flex justify-end">
          <button
            type="button"
            :disabled="transferLoading"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
            @click="submitTransfer"
          >
            {{
              transferLoading
                ? $t("common.loading")
                : $t("branches.transfer.submit")
            }}
          </button>
        </div>
      </div>
    </template>

    <template v-else-if="activeTab === 'warehouses'">
      <div class="mb-bt-spacing-16 flex justify-end">
        <button
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600"
          @click="openCreateWarehouseModal"
        >
          {{ $t("branches.warehouses.actions.newWarehouse") }}
        </button>
      </div>

      <div v-if="loadingBranch" class="text-bt-grey-500">
        {{ $t("common.loading") }}
      </div>

      <div v-else class="rounded-m border border-bt-grey-200 overflow-hidden">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("branches.warehouses.table.code") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("branches.warehouses.table.name") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("branches.warehouses.table.status") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("branches.warehouses.table.options") }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="warehouse in branch?.warehouses ?? []"
              :key="warehouse.warehouseId"
              class="border-t border-bt-grey-200"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ warehouse.code }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ warehouse.name }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <span
                  :class="[
                    'inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold',
                    warehouse.isActive
                      ? 'bg-bt-success-100 text-bt-success-700'
                      : 'bg-bt-error-100 text-bt-error-700',
                  ]"
                >
                  {{
                    warehouse.isActive
                      ? $t("branches.status.active")
                      : $t("branches.status.inactive")
                  }}
                </span>
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <div class="flex gap-bt-spacing-8">
                  <button
                    type="button"
                    class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
                    @click="openEditWarehouseModal(warehouse)"
                  >
                    {{ $t("branches.actions.edit") }}
                  </button>

                  <button
                    type="button"
                    class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-error-100 text-bt-error-700 hover:bg-bt-error-300"
                    @click="deleteWarehouse(warehouse.warehouseId)"
                  >
                    {{ $t("branches.actions.delete") }}
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!branch?.warehouses?.length">
              <td
                colspan="4"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("branches.warehouses.empty") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <template v-else>
      <div
        class="grid grid-cols-1 md:grid-cols-3 gap-bt-spacing-16 mb-bt-spacing-16"
      >
        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("branches.reports.fields.from") }}
          </label>
          <input
            v-model="reportFrom"
            type="datetime-local"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("branches.reports.fields.to") }}
          </label>
          <input
            v-model="reportTo"
            type="datetime-local"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("branches.reports.fields.compareBranch") }}
          </label>
          <select
            v-model="compareBranchId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">
              {{ $t("branches.reports.placeholders.selectBranch") }}
            </option>
            <option
              v-for="item in branchesForCompare.filter(
                (x) => x.branchId !== props.branchId,
              )"
              :key="item.branchId"
              :value="item.branchId"
            >
              {{ item.code }} - {{ item.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="mb-bt-spacing-16 flex flex-wrap gap-bt-spacing-12">
        <button
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600"
          @click="loadSalesReport"
        >
          {{ $t("branches.reports.actions.loadReport") }}
        </button>

        <button
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-info-500 text-bt-white hover:bg-bt-info-700"
          @click="loadCompareReport"
        >
          {{ $t("branches.reports.actions.compare") }}
        </button>

        <button
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-warning-500 text-bt-white hover:bg-bt-warning-700"
          @click="exportPdf"
        >
          {{ $t("branches.reports.actions.exportPdf") }}
        </button>

        <button
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-success-500 text-bt-white hover:bg-bt-success-700"
          @click="exportExcel"
        >
          {{ $t("branches.reports.actions.exportExcel") }}
        </button>
      </div>

      <div v-if="loadingReport" class="text-bt-grey-500 mb-bt-spacing-16">
        {{ $t("common.loading") }}
      </div>

      <div
        v-else-if="salesReport"
        class="grid grid-cols-1 md:grid-cols-3 gap-bt-spacing-16 mb-bt-spacing-16"
      >
        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("branches.reports.metrics.ordersCount") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ salesReport.ordersCount }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("branches.reports.metrics.totalSales") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ salesReport.totalSales }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("branches.reports.metrics.averageOrder") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ salesReport.averageOrder }}
          </div>
        </div>
      </div>

      <div v-if="loadingCompare" class="text-bt-grey-500">
        {{ $t("common.loading") }}
      </div>

      <div
        v-else-if="compareReport"
        class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16"
      >
        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("branches.reports.compare.totalSalesDiff") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ compareReport.totalSalesDiff }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("branches.reports.compare.ordersCountDiff") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ compareReport.ordersCountDiff }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
