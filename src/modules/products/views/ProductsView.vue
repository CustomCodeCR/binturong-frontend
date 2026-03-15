<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-vue-next";

import { ProductsService } from "@/core/services/productsService";
import { useModalStore } from "@/core/stores/modalStore";
import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

import ProductCreateModal from "@/modules/products/components/ProductCreateModal.vue";
import ProductEditModal from "@/modules/products/components/ProductEditModal.vue";
import ProductDetailsDrawer from "@/modules/products/components/ProductDetailsDrawer.vue";
import ProductActionMenu from "@/modules/products/components/ProductActionMenu.vue";

import type { Product } from "@/core/interfaces/products";

interface ProductSuccessPayload {
  productId: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  categoryId: string;
  categoryName?: string | null;
  uomId: string;
  uomCode?: string | null;
  uomName?: string | null;
  taxId: string;
  taxCode?: string | null;
  taxPercentage: number;
  basePrice: number;
  averageCost: number;
  isService: boolean;
  isActive: boolean;
}

const { t } = useI18n();

const modalStore = useModalStore();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const products = ref<Product[]>([]);
const loading = ref(false);
const search = ref("");
const page = ref(1);
const pageSize = ref(10);

const MAX_PAGE = 100;

const pageNumbers = computed(() => {
  const current = page.value;
  const start = Math.max(1, current - 2);
  const end = Math.min(MAX_PAGE, current + 2);

  const pages: number[] = [];
  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }

  return pages;
});

const canGoPrevious = computed(() => page.value > 1);
const canGoNext = computed(() => page.value < MAX_PAGE);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchProducts(): Promise<Product[]> {
  return await ProductsService.browse({
    page: page.value,
    pageSize: pageSize.value,
    search: search.value.trim() || undefined,
  });
}

function replaceProducts(nextProducts: Product[]) {
  products.value = [...nextProducts];
}

async function loadProducts() {
  loading.value = true;

  try {
    replaceProducts(await fetchProducts());
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("products.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

function patchProductInList(payload: ProductSuccessPayload) {
  const existingIndex = products.value.findIndex(
    (product) => product.productId === payload.productId,
  );

  if (existingIndex >= 0) {
    replaceProducts(
      products.value.map((product) =>
        product.productId === payload.productId
          ? {
              ...product,
              productId: payload.productId,
              sku: payload.sku,
              barcode: payload.barcode,
              name: payload.name,
              description: payload.description,
              categoryId: payload.categoryId,
              categoryName: payload.categoryName ?? product.categoryName,
              uomId: payload.uomId,
              uomCode: payload.uomCode ?? product.uomCode,
              uomName: payload.uomName ?? product.uomName,
              taxId: payload.taxId,
              taxCode: payload.taxCode ?? product.taxCode,
              taxPercentage: payload.taxPercentage,
              basePrice: payload.basePrice,
              averageCost: payload.averageCost,
              isService: payload.isService,
              isActive: payload.isActive,
            }
          : product,
      ),
    );
    return;
  }

  replaceProducts([
    {
      id: `product:${payload.productId}`,
      productId: payload.productId,
      sku: payload.sku,
      barcode: payload.barcode,
      name: payload.name,
      description: payload.description,
      categoryId: payload.categoryId,
      categoryName: payload.categoryName ?? null,
      uomId: payload.uomId,
      uomCode: payload.uomCode ?? null,
      uomName: payload.uomName ?? null,
      taxId: payload.taxId,
      taxCode: payload.taxCode ?? null,
      taxPercentage: payload.taxPercentage,
      basePrice: payload.basePrice,
      averageCost: payload.averageCost,
      isService: payload.isService,
      isActive: payload.isActive,
    } as Product,
    ...products.value,
  ]);
}

function patchProductStatusInList(productId: string, isActive: boolean) {
  replaceProducts(
    products.value.map((product) =>
      product.productId === productId
        ? {
            ...product,
            isActive,
          }
        : product,
    ),
  );
}

function removeProductFromList(productId: string) {
  replaceProducts(
    products.value.filter((product) => product.productId !== productId),
  );
}

function hasProductReachedExpectedState(
  fetchedProducts: Product[],
  expected: ProductSuccessPayload,
): boolean {
  const fetchedProduct = fetchedProducts.find(
    (product) => product.productId === expected.productId,
  );

  if (!fetchedProduct) {
    return false;
  }

  return (
    fetchedProduct.sku === expected.sku &&
    String(fetchedProduct.barcode ?? "") === String(expected.barcode ?? "") &&
    fetchedProduct.name === expected.name &&
    String(fetchedProduct.description ?? "") ===
      String(expected.description ?? "") &&
    fetchedProduct.categoryId === expected.categoryId &&
    fetchedProduct.uomId === expected.uomId &&
    fetchedProduct.taxId === expected.taxId &&
    Number(fetchedProduct.basePrice) === Number(expected.basePrice) &&
    Number(fetchedProduct.averageCost) === Number(expected.averageCost) &&
    fetchedProduct.isService === expected.isService &&
    fetchedProduct.isActive === expected.isActive
  );
}

async function reloadProductsUntil(
  predicate: (fetchedProducts: Product[]) => boolean,
  options?: {
    attempts?: number;
    delayMs?: number;
  },
) {
  const attempts = options?.attempts ?? 12;
  const delayMs = options?.delayMs ?? 500;

  loading.value = true;

  try {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const fetchedProducts = await fetchProducts();

      if (predicate(fetchedProducts)) {
        replaceProducts(fetchedProducts);
        return;
      }

      if (attempt < attempts - 1) {
        await sleep(delayMs);
      }
    }

    replaceProducts(await fetchProducts());
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("products.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

function openCreateModal() {
  modalStore.open({
    component: ProductCreateModal,
    onSuccess: async (payload?: ProductSuccessPayload) => {
      if (payload?.productId) {
        patchProductInList(payload);
      }

      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("products.messages.createSuccess"),
      });

      if (payload?.productId) {
        await reloadProductsUntil(
          (fetchedProducts) =>
            fetchedProducts.some(
              (product) => product.productId === payload.productId,
            ),
          {
            attempts: 12,
            delayMs: 500,
          },
        );
        return;
      }

      await loadProducts();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("products.messages.createError"),
      });
    },
  });
}

function openEditModal(product: Product) {
  modalStore.open({
    component: ProductEditModal,
    props: {
      productId: product.productId,
    },
    onSuccess: async (payload?: ProductSuccessPayload) => {
      if (!payload?.productId) {
        await loadProducts();
        return;
      }

      patchProductInList(payload);

      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("products.messages.updateSuccess"),
      });

      await reloadProductsUntil(
        (fetchedProducts) =>
          hasProductReachedExpectedState(fetchedProducts, payload),
        {
          attempts: 12,
          delayMs: 500,
        },
      );
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("products.messages.updateError"),
      });
    },
  });
}

function openDetailsDrawer(product: Product) {
  drawerStore.openDrawer({
    component: ProductDetailsDrawer,
    props: {
      productId: product.productId,
    },
    title: t("products.drawer.title"),
    description: t("products.drawer.description", { name: product.name }),
    direction: "right",
    size: "xl",
  });
}

async function toggleProductStatus(product: Product) {
  const nextIsActive = !product.isActive;

  try {
    await ProductsService.update(product.productId, {
      sku: product.sku,
      barcode: product.barcode,
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      uomId: product.uomId,
      taxId: product.taxId,
      basePrice: product.basePrice,
      averageCost: product.averageCost,
      isService: product.isService,
      isActive: nextIsActive,
    });

    patchProductStatusInList(product.productId, nextIsActive);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: product.isActive
        ? t("products.messages.deactivateSuccess")
        : t("products.messages.reactivateSuccess"),
    });

    await reloadProductsUntil(
      (fetchedProducts) => {
        const fetchedProduct = fetchedProducts.find(
          (item) => item.productId === product.productId,
        );
        return fetchedProduct?.isActive === nextIsActive;
      },
      {
        attempts: 12,
        delayMs: 500,
      },
    );
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: product.isActive
        ? t("products.messages.deactivateError")
        : t("products.messages.reactivateError"),
    });
  }
}

async function deleteProduct(product: Product) {
  try {
    await ProductsService.delete(product.productId);

    removeProductFromList(product.productId);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("products.messages.deleteSuccess"),
    });

    await reloadProductsUntil(
      (fetchedProducts) =>
        !fetchedProducts.some((item) => item.productId === product.productId),
      {
        attempts: 12,
        delayMs: 500,
      },
    );
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("products.messages.deleteError"),
    });
  }
}

async function goToPage(targetPage: number) {
  if (targetPage < 1 || targetPage > MAX_PAGE || targetPage === page.value) {
    return;
  }

  page.value = targetPage;
  await loadProducts();
}

async function goPrevious() {
  if (!canGoPrevious.value) return;
  await goToPage(page.value - 1);
}

async function goNext() {
  if (!canGoNext.value) return;
  await goToPage(page.value + 1);
}

async function onSearch() {
  page.value = 1;
  await loadProducts();
}

watch(pageSize, async () => {
  page.value = 1;
  await loadProducts();
});

onMounted(async () => {
  await loadProducts();
});
</script>

<template>
  <section class="h-full min-h-0 bg-bt-grey-50 p-bt-spacing-24 flex flex-col">
    <div class="mb-bt-spacing-24 shrink-0">
      <h1 class="text-2xl font-bt-bold text-bt-primary-700">
        {{ $t("products.title") }}
      </h1>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("products.subtitle") }}
      </p>
    </div>

    <div
      class="bg-bt-white rounded-l shadow-bt-elevation-200 border border-bt-grey-200 p-bt-spacing-24 flex-1 min-h-0 flex flex-col"
    >
      <div
        class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 mb-bt-spacing-24 shrink-0"
      >
        <div
          class="flex flex-col sm:flex-row gap-bt-spacing-12 w-full lg:max-w-2xl"
        >
          <input
            v-model="search"
            type="text"
            :placeholder="$t('products.searchPlaceholder')"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            @keyup.enter="onSearch"
          />

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition"
            @click="onSearch"
          >
            {{ $t("products.actions.search") }}
          </button>

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
            @click="loadProducts"
          >
            {{ $t("products.actions.refresh") }}
          </button>
        </div>

        <div class="flex items-center gap-bt-spacing-12 shrink-0">
          <select
            v-model.number="pageSize"
            class="px-bt-spacing-12 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 transition font-bt-semibold"
            @click="openCreateModal"
          >
            {{ $t("products.actions.newProduct") }}
          </button>
        </div>
      </div>

      <div class="flex-1 min-h-0 overflow-auto">
        <div
          v-if="loading"
          class="py-bt-spacing-32 text-center text-bt-grey-500"
        >
          {{ $t("common.loading") }}
        </div>

        <table v-else class="w-full border-collapse min-w-[1200px]">
          <thead class="sticky top-0 z-10">
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("products.table.sku") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("products.table.name") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("products.table.category") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("products.table.uom") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("products.table.tax") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("products.table.basePrice") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("products.table.status") }}
              </th>
              <th
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20"
              >
                {{ $t("products.table.options") }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="product in products"
              :key="product.productId"
              class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
            >
              <td
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 font-bt-semibold"
              >
                {{ product.sku }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                <div class="font-bt-semibold text-bt-primary-700">
                  {{ product.name }}
                </div>
                <div class="text-xs text-bt-grey-500">
                  {{ product.barcode }}
                </div>
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ product.categoryName ?? "-" }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ product.uomCode ?? product.uomName ?? "-" }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ product.taxCode ?? "-" }} ({{ product.taxPercentage }}%)
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ product.basePrice }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <span
                  :class="[
                    'inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold',
                    product.isActive
                      ? 'bg-bt-success-100 text-bt-success-700'
                      : 'bg-bt-error-100 text-bt-error-700',
                  ]"
                >
                  {{
                    product.isActive
                      ? $t("products.status.active")
                      : $t("products.status.inactive")
                  }}
                </span>
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <ProductActionMenu
                  :items="[
                    {
                      label: t('products.actions.viewDetails'),
                      action: () => openDetailsDrawer(product),
                    },
                    {
                      label: t('products.actions.edit'),
                      action: () => openEditModal(product),
                    },
                    {
                      label: product.isActive
                        ? t('products.actions.deactivate')
                        : t('products.actions.reactivate'),
                      action: () => toggleProductStatus(product),
                      danger: product.isActive,
                    },
                    {
                      label: t('products.actions.delete'),
                      action: () => deleteProduct(product),
                      danger: true,
                    },
                  ]"
                >
                  <template #trigger>
                    <button
                      type="button"
                      class="inline-flex items-center justify-center w-10 h-10 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 transition"
                    >
                      <MoreHorizontal :size="18" />
                    </button>
                  </template>
                </ProductActionMenu>
              </td>
            </tr>

            <tr v-if="!products.length && !loading">
              <td
                colspan="8"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("products.empty") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        class="mt-bt-spacing-24 pt-bt-spacing-16 border-t border-bt-grey-200 flex flex-col md:flex-row md:items-center md:justify-between gap-bt-spacing-16 shrink-0"
      >
        <div class="text-sm text-bt-grey-600">
          {{ $t("pagination.page") }} {{ page }} {{ $t("pagination.of") }}
          {{ MAX_PAGE }}
        </div>

        <div class="flex items-center gap-bt-spacing-8 flex-wrap">
          <button
            type="button"
            :disabled="!canGoPrevious"
            class="inline-flex items-center gap-bt-spacing-8 px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 disabled:bg-bt-disabled disabled:text-bt-grey-500 disabled:cursor-not-allowed"
            @click="goPrevious"
          >
            <ChevronLeft :size="16" />
            <span>{{ $t("pagination.previous") }}</span>
          </button>

          <button
            v-if="pageNumbers[0] > 1"
            type="button"
            class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100"
            @click="goToPage(1)"
          >
            1
          </button>

          <span
            v-if="pageNumbers[0] > 2"
            class="px-bt-spacing-8 text-bt-grey-500"
          >
            ...
          </span>

          <button
            v-for="pageNumber in pageNumbers"
            :key="pageNumber"
            type="button"
            class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border transition"
            :class="
              pageNumber === page
                ? 'bg-bt-primary-500 border-bt-primary-500 text-bt-white'
                : 'border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100'
            "
            @click="goToPage(pageNumber)"
          >
            {{ pageNumber }}
          </button>

          <span
            v-if="pageNumbers[pageNumbers.length - 1] < MAX_PAGE - 1"
            class="px-bt-spacing-8 text-bt-grey-500"
          >
            ...
          </span>

          <button
            v-if="pageNumbers[pageNumbers.length - 1] < MAX_PAGE"
            type="button"
            class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100"
            @click="goToPage(MAX_PAGE)"
          >
            {{ MAX_PAGE }}
          </button>

          <button
            type="button"
            :disabled="!canGoNext"
            class="inline-flex items-center gap-bt-spacing-8 px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 disabled:bg-bt-disabled disabled:text-bt-grey-500 disabled:cursor-not-allowed"
            @click="goNext"
          >
            <span>{{ $t("pagination.next") }}</span>
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
