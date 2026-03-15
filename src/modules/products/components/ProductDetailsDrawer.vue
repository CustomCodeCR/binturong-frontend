<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";
import { useAuthStore } from "@/core/stores/authStore";

import { ProductsService } from "@/core/services/productsService";
import { BranchesService } from "@/core/services/branchesService";
import { InventoryTransfersService } from "@/core/services/inventoryTransfersService";
import { InventoryMovementsService } from "@/core/services/inventoryMovementsService";

import type { Product } from "@/core/interfaces/products";
import type { Branch, BranchInventoryItem } from "@/core/interfaces/branches";

const props = defineProps<{
  productId: string;
}>();

const { t } = useI18n();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();
const authStore = useAuthStore();

const loadingProduct = ref(false);
const loadingBranches = ref(false);
const loadingStock = ref(false);
const transferLoading = ref(false);
const adjustmentLoading = ref(false);

const activeTab = ref<"details" | "stock" | "transfer" | "adjustment">(
  "details",
);

const product = ref<Product | null>(null);
const branches = ref<Branch[]>([]);
const branchStock = ref<Array<{ branch: Branch; stock: number }>>([]);

const fromBranchId = ref("");
const toBranchId = ref("");
const fromWarehouseId = ref("");
const toWarehouseId = ref("");
const transferQuantity = ref<number | null>(null);
const transferNotes = ref("");
const requireApproval = ref(true);

const adjustmentBranchId = ref("");
const adjustmentWarehouseId = ref("");
const countedStock = ref<number | null>(null);
const adjustmentUnitCost = ref<number | null>(null);
const adjustmentJustification = ref("");

const fromBranch = computed(
  () =>
    branches.value.find((branch) => branch.branchId === fromBranchId.value) ??
    null,
);

const toBranch = computed(
  () =>
    branches.value.find((branch) => branch.branchId === toBranchId.value) ??
    null,
);

const adjustmentBranch = computed(
  () =>
    branches.value.find(
      (branch) => branch.branchId === adjustmentBranchId.value,
    ) ?? null,
);

async function loadProduct() {
  loadingProduct.value = true;

  try {
    product.value = await ProductsService.readById(props.productId);
  } finally {
    loadingProduct.value = false;
  }
}

async function loadBranches() {
  loadingBranches.value = true;

  try {
    branches.value = await BranchesService.browse({
      page: 1,
      pageSize: 100,
    });
  } finally {
    loadingBranches.value = false;
  }
}

async function loadStock() {
  if (!product.value) {
    return;
  }

  loadingStock.value = true;

  try {
    const responses = await Promise.all(
      branches.value.map(async (branch) => {
        const items = await BranchesService.browseInventoryByBranchId(
          branch.branchId,
        );

        const productStock = items.find(
          (item: BranchInventoryItem) =>
            item.productId === product.value?.productId,
        );

        return {
          branch,
          stock: productStock?.stock ?? 0,
        };
      }),
    );

    branchStock.value = responses;
  } finally {
    loadingStock.value = false;
  }
}

async function submitTransfer() {
  if (
    !product.value ||
    !fromBranchId.value ||
    !toBranchId.value ||
    !fromWarehouseId.value ||
    !toWarehouseId.value ||
    transferQuantity.value === null ||
    transferQuantity.value <= 0
  ) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("products.transfer.validation.required"),
    });
    return;
  }

  if (!authStore.userId) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("products.transfer.validation.userRequired"),
    });
    return;
  }

  transferLoading.value = true;

  try {
    const created = await InventoryTransfersService.createInventoryTransfer({
      fromBranchId: fromBranchId.value,
      toBranchId: toBranchId.value,
      notes: transferNotes.value.trim(),
      createdByUserId: authStore.userId,
      lines: [
        {
          productId: product.value.productId,
          quantity: Number(transferQuantity.value),
          fromWarehouseId: fromWarehouseId.value,
          toWarehouseId: toWarehouseId.value,
        },
      ],
    });

    await InventoryTransfersService.confirmInventoryTransfer(
      created.transferId,
      {
        requireApproval: requireApproval.value,
      },
    );

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("products.messages.transferSuccess"),
    });

    transferQuantity.value = null;
    transferNotes.value = "";
    await loadStock();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("products.messages.transferError"),
    });
  } finally {
    transferLoading.value = false;
  }
}

async function submitPhysicalAdjustment() {
  if (
    !product.value ||
    !adjustmentWarehouseId.value ||
    countedStock.value === null ||
    adjustmentUnitCost.value === null ||
    !adjustmentJustification.value.trim()
  ) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("products.adjustment.validation.required"),
    });
    return;
  }

  adjustmentLoading.value = true;

  try {
    await InventoryMovementsService.physicalAdjustment({
      productId: product.value.productId,
      warehouseId: adjustmentWarehouseId.value,
      countedStock: Number(countedStock.value),
      unitCost: Number(adjustmentUnitCost.value),
      justification: adjustmentJustification.value.trim(),
    });

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("products.messages.adjustmentSuccess"),
    });

    countedStock.value = null;
    adjustmentUnitCost.value = null;
    adjustmentJustification.value = "";

    await loadStock();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("products.messages.adjustmentError"),
    });
  } finally {
    adjustmentLoading.value = false;
  }
}

function closeDrawer() {
  drawerStore.closeDrawer();
}

onMounted(async () => {
  await Promise.all([loadProduct(), loadBranches()]);
  await loadStock();
});

watch(
  () => props.productId,
  async () => {
    await Promise.all([loadProduct(), loadBranches()]);
    await loadStock();
  },
);
</script>

<template>
  <div class="h-full bg-bt-white p-bt-spacing-24 overflow-y-auto">
    <div class="flex items-start justify-between mb-bt-spacing-24">
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t("products.drawer.title") }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{ $t("products.drawer.description", { name: product?.name ?? "" }) }}
        </p>
      </div>

      <button
        type="button"
        class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
        @click="closeDrawer"
      >
        {{ $t("products.actions.close") }}
      </button>
    </div>

    <div class="flex flex-wrap gap-bt-spacing-8 mb-bt-spacing-24">
      <button
        type="button"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m transition"
        :class="
          activeTab === 'details'
            ? 'bg-bt-primary-500 text-bt-white'
            : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'
        "
        @click="activeTab = 'details'"
      >
        {{ $t("products.drawer.tabs.details") }}
      </button>

      <button
        type="button"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m transition"
        :class="
          activeTab === 'stock'
            ? 'bg-bt-primary-500 text-bt-white'
            : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'
        "
        @click="activeTab = 'stock'"
      >
        {{ $t("products.drawer.tabs.stock") }}
      </button>

      <button
        type="button"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m transition"
        :class="
          activeTab === 'transfer'
            ? 'bg-bt-primary-500 text-bt-white'
            : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'
        "
        @click="activeTab = 'transfer'"
      >
        {{ $t("products.drawer.tabs.transfer") }}
      </button>

      <button
        type="button"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m transition"
        :class="
          activeTab === 'adjustment'
            ? 'bg-bt-primary-500 text-bt-white'
            : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'
        "
        @click="activeTab = 'adjustment'"
      >
        {{ $t("products.drawer.tabs.adjustment") }}
      </button>
    </div>

    <template v-if="activeTab === 'details'">
      <div v-if="loadingProduct" class="text-bt-grey-500">
        {{ $t("common.loading") }}
      </div>

      <div v-else-if="product" class="space-y-bt-spacing-16">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
          <div
            class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("products.fields.sku") }}
            </div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ product.sku }}
            </div>
          </div>

          <div
            class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("products.fields.barcode") }}
            </div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ product.barcode }}
            </div>
          </div>

          <div
            class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("products.fields.name") }}
            </div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ product.name }}
            </div>
          </div>

          <div
            class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("products.fields.category") }}
            </div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ product.categoryName ?? "-" }}
            </div>
          </div>

          <div
            class="md:col-span-2 p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("products.fields.description") }}
            </div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ product.description }}
            </div>
          </div>

          <div
            class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("products.fields.uom") }}
            </div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ product.uomCode ?? product.uomName ?? "-" }}
            </div>
          </div>

          <div
            class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("products.fields.tax") }}
            </div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ product.taxCode ?? "-" }} ({{ product.taxPercentage }}%)
            </div>
          </div>

          <div
            class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("products.fields.basePrice") }}
            </div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ product.basePrice }}
            </div>
          </div>

          <div
            class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("products.fields.averageCost") }}
            </div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ product.averageCost }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="activeTab === 'stock'">
      <div v-if="loadingStock || loadingBranches" class="text-bt-grey-500">
        {{ $t("common.loading") }}
      </div>

      <div v-else class="space-y-bt-spacing-16">
        <div class="rounded-m border border-bt-grey-200 overflow-hidden">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-bt-primary-50 text-left">
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("products.stock.branch") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("products.stock.branchCode") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("products.stock.stock") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("products.stock.warehouses") }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in branchStock"
                :key="item.branch.branchId"
                class="border-t border-bt-grey-200"
              >
                <td
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 font-bt-semibold"
                >
                  {{ item.branch.name }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ item.branch.code }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ item.stock }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  <div class="flex flex-wrap gap-bt-spacing-8">
                    <span
                      v-for="warehouse in item.branch.warehouses"
                      :key="warehouse.warehouseId"
                      class="px-bt-spacing-8 py-bt-spacing-4 rounded-full bg-bt-primary-100 text-bt-primary-700 text-xs"
                    >
                      {{ warehouse.code }} - {{ warehouse.name }}
                    </span>
                  </div>
                </td>
              </tr>

              <tr v-if="!branchStock.length">
                <td
                  colspan="4"
                  class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
                >
                  {{ $t("products.stock.empty") }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="text-xs text-bt-grey-500">
          {{ $t("products.stock.note") }}
        </div>
      </div>
    </template>

    <template v-else-if="activeTab === 'transfer'">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("products.transfer.fromBranch") }}
          </label>
          <select
            v-model="fromBranchId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">
              {{ $t("products.transfer.selectBranch") }}
            </option>
            <option
              v-for="branch in branches"
              :key="branch.branchId"
              :value="branch.branchId"
            >
              {{ branch.code }} - {{ branch.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("products.transfer.toBranch") }}
          </label>
          <select
            v-model="toBranchId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">
              {{ $t("products.transfer.selectBranch") }}
            </option>
            <option
              v-for="branch in branches"
              :key="branch.branchId"
              :value="branch.branchId"
            >
              {{ branch.code }} - {{ branch.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("products.transfer.fromWarehouse") }}
          </label>
          <select
            v-model="fromWarehouseId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">
              {{ $t("products.transfer.selectWarehouse") }}
            </option>
            <option
              v-for="warehouse in fromBranch?.warehouses ?? []"
              :key="warehouse.warehouseId"
              :value="warehouse.warehouseId"
            >
              {{ warehouse.code }} - {{ warehouse.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("products.transfer.toWarehouse") }}
          </label>
          <select
            v-model="toWarehouseId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">
              {{ $t("products.transfer.selectWarehouse") }}
            </option>
            <option
              v-for="warehouse in toBranch?.warehouses ?? []"
              :key="warehouse.warehouseId"
              :value="warehouse.warehouseId"
            >
              {{ warehouse.code }} - {{ warehouse.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("products.transfer.quantity") }}
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
          <input v-model="requireApproval" type="checkbox" />
          <span class="text-bt-primary-700">
            {{ $t("products.transfer.requireApproval") }}
          </span>
        </div>

        <div class="md:col-span-2">
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("products.transfer.notes") }}
          </label>
          <textarea
            v-model="transferNotes"
            rows="4"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>
      </div>

      <div class="mt-bt-spacing-24 flex justify-end">
        <button
          type="button"
          :disabled="transferLoading"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
          @click="submitTransfer"
        >
          {{
            transferLoading
              ? $t("common.loading")
              : $t("products.transfer.submit")
          }}
        </button>
      </div>
    </template>

    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("products.adjustment.branch") }}
          </label>
          <select
            v-model="adjustmentBranchId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">
              {{ $t("products.adjustment.selectBranch") }}
            </option>
            <option
              v-for="branch in branches"
              :key="branch.branchId"
              :value="branch.branchId"
            >
              {{ branch.code }} - {{ branch.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("products.adjustment.warehouse") }}
          </label>
          <select
            v-model="adjustmentWarehouseId"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="">
              {{ $t("products.adjustment.selectWarehouse") }}
            </option>
            <option
              v-for="warehouse in adjustmentBranch?.warehouses ?? []"
              :key="warehouse.warehouseId"
              :value="warehouse.warehouseId"
            >
              {{ warehouse.code }} - {{ warehouse.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("products.adjustment.countedStock") }}
          </label>
          <input
            v-model.number="countedStock"
            type="number"
            min="0"
            step="0.01"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("products.adjustment.unitCost") }}
          </label>
          <input
            v-model.number="adjustmentUnitCost"
            type="number"
            min="0"
            step="0.01"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div class="md:col-span-2">
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("products.adjustment.justification") }}
          </label>
          <textarea
            v-model="adjustmentJustification"
            rows="4"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>
      </div>

      <div class="mt-bt-spacing-24 flex justify-end">
        <button
          type="button"
          :disabled="adjustmentLoading"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-warning-500 text-bt-white hover:bg-bt-warning-700 disabled:bg-bt-disabled"
          @click="submitPhysicalAdjustment"
        >
          {{
            adjustmentLoading
              ? $t("common.loading")
              : $t("products.adjustment.submit")
          }}
        </button>
      </div>
    </template>
  </div>
</template>
