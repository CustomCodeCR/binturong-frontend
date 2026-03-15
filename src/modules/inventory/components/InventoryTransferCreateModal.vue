<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { useToastStore } from "@/core/stores/toastStore";
import { useAuthStore } from "@/core/stores/authStore";

import { BranchesService } from "@/core/services/branchesService";
import { SelectService } from "@/core/services/selectService";
import { InventoryTransfersService } from "@/core/services/inventoryTransfersService";

import type { Branch } from "@/core/interfaces/branches";
import type { SelectOption } from "@/core/interfaces/select";

const { t } = useI18n();
const modalStore = useModalStore();
const toastStore = useToastStore();
const authStore = useAuthStore();

const branches = ref<Branch[]>([]);
const products = ref<SelectOption[]>([]);

const fromBranchId = ref("");
const toBranchId = ref("");
const fromWarehouseId = ref("");
const toWarehouseId = ref("");
const productId = ref("");
const quantity = ref<number | null>(null);
const notes = ref("");

const loading = ref(false);
const loadingCatalogs = ref(false);

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

function closeModal() {
  modalStore.close();
}

async function loadCatalogs() {
  loadingCatalogs.value = true;

  try {
    const [branchesResponse, productsResponse] = await Promise.all([
      BranchesService.browse({ page: 1, pageSize: 100 }),
      SelectService.selectProducts({ onlyActive: true }),
    ]);

    branches.value = branchesResponse ?? [];
    products.value = productsResponse ?? [];
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("inventory.messages.loadCatalogsError"),
    });
  } finally {
    loadingCatalogs.value = false;
  }
}

async function submit() {
  if (
    !fromBranchId.value ||
    !toBranchId.value ||
    !fromWarehouseId.value ||
    !toWarehouseId.value ||
    !productId.value ||
    quantity.value === null ||
    quantity.value <= 0
  ) {
    modalStore.onError?.({
      code: 400,
      message: t("inventory.transfer.validation.required"),
    });
    return;
  }

  if (!authStore.userId) {
    modalStore.onError?.({
      code: 400,
      message: t("inventory.transfer.validation.userRequired"),
    });
    return;
  }

  loading.value = true;

  try {
    const created = await InventoryTransfersService.createInventoryTransfer({
      fromBranchId: fromBranchId.value,
      toBranchId: toBranchId.value,
      notes: notes.value.trim(),
      createdByUserId: authStore.userId,
      lines: [
        {
          productId: productId.value,
          quantity: Number(quantity.value),
          fromWarehouseId: fromWarehouseId.value,
          toWarehouseId: toWarehouseId.value,
        },
      ],
    });

    await InventoryTransfersService.requestReviewInventoryTransfer(
      created.transferId,
    );

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("inventory.messages.transferCreated"),
    });

    modalStore.onSuccess?.({
      ...created,
      status: "REVIEW_REQUESTED",
    });

    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("inventory.messages.transferCreateError"),
    });
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadCatalogs();
});
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-4xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("inventory.modal.transferTitle") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("inventory.modal.transferDescription") }}
      </p>
    </div>

    <div
      v-if="loadingCatalogs"
      class="py-bt-spacing-24 text-center text-bt-grey-500"
    >
      {{ $t("common.loading") }}
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("inventory.transfer.fromBranch") }}
        </label>
        <select
          v-model="fromBranchId"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">{{ $t("inventory.transfer.selectBranch") }}</option>
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
          {{ $t("inventory.transfer.toBranch") }}
        </label>
        <select
          v-model="toBranchId"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">{{ $t("inventory.transfer.selectBranch") }}</option>
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
          {{ $t("inventory.transfer.fromWarehouse") }}
        </label>
        <select
          v-model="fromWarehouseId"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">
            {{ $t("inventory.transfer.selectWarehouse") }}
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
          {{ $t("inventory.transfer.toWarehouse") }}
        </label>
        <select
          v-model="toWarehouseId"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">
            {{ $t("inventory.transfer.selectWarehouse") }}
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
          {{ $t("inventory.transfer.product") }}
        </label>
        <select
          v-model="productId"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">{{ $t("inventory.transfer.selectProduct") }}</option>
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
          {{ $t("inventory.transfer.quantity") }}
        </label>
        <input
          v-model.number="quantity"
          type="number"
          min="0.01"
          step="0.01"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div class="md:col-span-2">
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("inventory.transfer.notes") }}
        </label>
        <textarea
          v-model="notes"
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
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
        @click="submit"
      >
        {{ loading ? $t("common.loading") : $t("inventory.transfer.submit") }}
      </button>
    </div>
  </div>
</template>
