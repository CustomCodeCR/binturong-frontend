<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useModalStore } from "@/core/stores/modalStore";

import { ProductsService } from "@/core/services/productsService";
import { SelectService } from "@/core/services/selectService";

import type { SelectOption } from "@/core/interfaces/select";

const { t } = useI18n();
const modalStore = useModalStore();

const sku = ref("");
const barcode = ref("");
const name = ref("");
const description = ref("");

const categoryId = ref("");
const uomId = ref("");
const taxId = ref("");

const basePrice = ref<number | null>(null);
const averageCost = ref<number | null>(null);

const isService = ref(false);
const isActive = ref(true);

const categories = ref<SelectOption[]>([]);
const units = ref<SelectOption[]>([]);
const taxes = ref<SelectOption[]>([]);

const loading = ref(false);
const loadingCatalogs = ref(false);

function closeModal() {
  modalStore.close();
}

async function loadCatalogs() {
  loadingCatalogs.value = true;

  try {
    const [categoriesResponse, unitsResponse, taxesResponse] =
      await Promise.all([
        SelectService.selectProductCategories({ onlyActive: true }),
        SelectService.selectUnitsOfMeasure({ onlyActive: true }),
        SelectService.selectTaxes({ onlyActive: true }),
      ]);

    categories.value = categoriesResponse ?? [];
    units.value = unitsResponse ?? [];
    taxes.value = taxesResponse ?? [];
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("products.messages.catalogsLoadError"),
    });
  } finally {
    loadingCatalogs.value = false;
  }
}

async function submit() {
  if (
    !sku.value.trim() ||
    !barcode.value.trim() ||
    !name.value.trim() ||
    !description.value.trim() ||
    !categoryId.value ||
    !uomId.value ||
    !taxId.value ||
    basePrice.value === null ||
    averageCost.value === null
  ) {
    modalStore.onError?.({
      code: 400,
      message: t("products.validation.requiredCreate"),
    });
    return;
  }

  loading.value = true;

  try {
    const created = await ProductsService.create({
      sku: sku.value.trim(),
      barcode: barcode.value.trim(),
      name: name.value.trim(),
      description: description.value.trim(),
      categoryId: categoryId.value,
      uomId: uomId.value,
      taxId: taxId.value,
      basePrice: Number(basePrice.value),
      averageCost: Number(averageCost.value),
      isService: isService.value,
      isActive: isActive.value,
    });

    modalStore.onSuccess?.(created);
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("products.messages.createError"),
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
        {{ $t("products.modal.createTitle") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("products.modal.createDescription") }}
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
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{
          $t("products.fields.sku")
        }}</label>
        <input
          v-model="sku"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{
          $t("products.fields.barcode")
        }}</label>
        <input
          v-model="barcode"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{
          $t("products.fields.name")
        }}</label>
        <input
          v-model="name"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{
          $t("products.fields.category")
        }}</label>
        <select
          v-model="categoryId"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">
            {{ $t("products.placeholders.selectCategory") }}
          </option>
          <option
            v-for="category in categories"
            :key="category.id"
            :value="category.id"
          >
            {{ category.label }}
          </option>
        </select>
      </div>

      <div class="md:col-span-2">
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{
          $t("products.fields.description")
        }}</label>
        <textarea
          v-model="description"
          rows="4"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{
          $t("products.fields.uom")
        }}</label>
        <select
          v-model="uomId"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">{{ $t("products.placeholders.selectUom") }}</option>
          <option v-for="unit in units" :key="unit.id" :value="unit.id">
            {{ unit.label }}
          </option>
        </select>
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{
          $t("products.fields.tax")
        }}</label>
        <select
          v-model="taxId"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        >
          <option value="">{{ $t("products.placeholders.selectTax") }}</option>
          <option v-for="tax in taxes" :key="tax.id" :value="tax.id">
            {{ tax.label }}
          </option>
        </select>
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{
          $t("products.fields.basePrice")
        }}</label>
        <input
          v-model.number="basePrice"
          type="number"
          min="0"
          step="0.01"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">{{
          $t("products.fields.averageCost")
        }}</label>
        <input
          v-model.number="averageCost"
          type="number"
          min="0"
          step="0.01"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div class="flex items-center gap-bt-spacing-8">
        <input v-model="isService" type="checkbox" />
        <span class="text-bt-primary-700">{{
          $t("products.fields.isService")
        }}</span>
      </div>

      <div class="flex items-center gap-bt-spacing-8">
        <input v-model="isActive" type="checkbox" />
        <span class="text-bt-primary-700">{{
          $t("products.fields.isActive")
        }}</span>
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
        {{ loading ? $t("common.loading") : $t("common.save") }}
      </button>
    </div>
  </div>
</template>
