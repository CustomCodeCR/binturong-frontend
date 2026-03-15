<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { useAuthStore } from "@/core/stores/authStore";

import { BranchesService } from "@/core/services/branchesService";
import { SelectService } from "@/core/services/selectService";
import { InventoryMovementsService } from "@/core/services/inventoryMovementsService";

import type { Branch } from "@/core/interfaces/branches";
import type { SelectOption } from "@/core/interfaces/select";

const props = defineProps<{
  mode: "purchase-in" | "service-out" | "physical-adjustment";
}>();

const { t } = useI18n();
const modalStore = useModalStore();
const authStore = useAuthStore();

const branches = ref<Branch[]>([]);
const products = ref<SelectOption[]>([]);

const branchId = ref("");
const warehouseId = ref("");
const productId = ref("");
const quantity = ref<number | null>(null);
const unitCost = ref<number | null>(null);
const notes = ref("");

const countedStock = ref<number | null>(null);
const justification = ref("");

const loading = ref(false);
const loadingCatalogs = ref(false);

const selectedBranch = computed(
  () =>
    branches.value.find((branch) => branch.branchId === branchId.value) ?? null,
);

const title = computed(() => {
  if (props.mode === "purchase-in") return t("inventory.modal.purchaseInTitle");
  if (props.mode === "service-out") return t("inventory.modal.serviceOutTitle");
  return t("inventory.modal.adjustmentTitle");
});

const description = computed(() => {
  if (props.mode === "purchase-in") {
    return t("inventory.modal.purchaseInDescription");
  }

  if (props.mode === "service-out") {
    return t("inventory.modal.serviceOutDescription");
  }

  return t("inventory.modal.adjustmentDescription");
});

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
  loading.value = true;

  try {
    if (props.mode === "physical-adjustment") {
      if (
        !productId.value ||
        !warehouseId.value ||
        countedStock.value === null ||
        unitCost.value === null ||
        !justification.value.trim()
      ) {
        modalStore.onError?.({
          code: 400,
          message: t("inventory.adjustment.validation.required"),
        });
        return;
      }

      const response = await InventoryMovementsService.physicalAdjustment({
        productId: productId.value,
        warehouseId: warehouseId.value,
        countedStock: Number(countedStock.value),
        unitCost: Number(unitCost.value),
        justification: justification.value.trim(),
      });

      modalStore.onSuccess?.(response);
      modalStore.close();
      return;
    }

    if (
      !productId.value ||
      !warehouseId.value ||
      quantity.value === null ||
      quantity.value <= 0 ||
      unitCost.value === null ||
      !notes.value.trim()
    ) {
      modalStore.onError?.({
        code: 400,
        message:
          props.mode === "purchase-in"
            ? t("inventory.movements.validation.purchaseInRequired")
            : t("inventory.movements.validation.serviceOutRequired"),
      });
      return;
    }

    if (!authStore.userId) {
      modalStore.onError?.({
        code: 400,
        message: t("inventory.movements.validation.userRequired"),
      });
      return;
    }

    if (props.mode === "purchase-in") {
      const response = await InventoryMovementsService.purchaseIn({
        productId: productId.value,
        warehouseId: warehouseId.value,
        quantity: Number(quantity.value),
        unitCost: Number(unitCost.value),
        notes: notes.value.trim(),
        sourceId: 1,
      });

      modalStore.onSuccess?.(response);
      modalStore.close();
      return;
    }

    const response = await InventoryMovementsService.serviceOut({
      productId: productId.value,
      warehouseId: warehouseId.value,
      quantity: Number(quantity.value),
      unitCost: Number(unitCost.value),
      notes: notes.value.trim(),
      sourceId: 0,
    });

    modalStore.onSuccess?.(response);
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message:
        error?.message ??
        (props.mode === "purchase-in"
          ? t("inventory.messages.purchaseInError")
          : props.mode === "service-out"
            ? t("inventory.messages.serviceOutError")
            : t("inventory.messages.adjustmentError")),
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
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-3xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ title }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ description }}
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
          {{ $t("inventory.fields.branch") }}
        </label>
        <select
          v-model="branchId"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">
            {{ $t("inventory.placeholders.selectBranch") }}
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
          {{ $t("inventory.fields.warehouse") }}
        </label>
        <select
          v-model="warehouseId"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">
            {{ $t("inventory.placeholders.selectWarehouse") }}
          </option>
          <option
            v-for="warehouse in selectedBranch?.warehouses ?? []"
            :key="warehouse.warehouseId"
            :value="warehouse.warehouseId"
          >
            {{ warehouse.code }} - {{ warehouse.name }}
          </option>
        </select>
      </div>

      <div class="md:col-span-2">
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("inventory.fields.product") }}
        </label>
        <select
          v-model="productId"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">
            {{ $t("inventory.placeholders.selectProduct") }}
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

      <template v-if="props.mode !== 'physical-adjustment'">
        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("inventory.fields.quantity") }}
          </label>
          <input
            v-model.number="quantity"
            type="number"
            min="0.01"
            step="0.01"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("inventory.fields.unitCost") }}
          </label>
          <input
            v-model.number="unitCost"
            type="number"
            min="0"
            step="0.01"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div class="md:col-span-2">
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("inventory.fields.notes") }}
          </label>
          <textarea
            v-model="notes"
            rows="4"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>
      </template>

      <template v-else>
        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("inventory.fields.countedStock") }}
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
            {{ $t("inventory.fields.unitCost") }}
          </label>
          <input
            v-model.number="unitCost"
            type="number"
            min="0"
            step="0.01"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div class="md:col-span-2">
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("inventory.fields.justification") }}
          </label>
          <textarea
            v-model="justification"
            rows="4"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>
      </template>
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
        {{ loading ? $t("common.loading") : $t("common.save") }}
      </button>
    </div>
  </div>
</template>
