<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-vue-next";

import { ProductCategoriesService } from "@/core/services/productCategoriesService";
import { useModalStore } from "@/core/stores/modalStore";
import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

import CategoryCreateModal from "@/modules/categories/components/CategoryCreateModal.vue";
import CategoryEditModal from "@/modules/categories/components/CategoryEditModal.vue";
import CategoryDetailsDrawer from "@/modules/categories/components/CategoryDetailsDrawer.vue";
import CategoryActionMenu from "@/modules/categories/components/CategoryActionMenu.vue";

import type { ProductCategory } from "@/core/interfaces/productCategories";

interface CategorySuccessPayload {
  categoryId: string;
  name: string;
  description: string;
  isActive: boolean;
}

const { t } = useI18n();

const modalStore = useModalStore();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const categories = ref<ProductCategory[]>([]);
const loading = ref(false);
const search = ref("");
const statusFilter = ref<"all" | "active" | "inactive">("all");
const page = ref(1);
const pageSize = ref(10);

const MAX_PAGE = 100;

const filteredCategories = computed(() => {
  let result = categories.value;

  if (statusFilter.value === "active") {
    result = result.filter((c) => c.isActive);
  } else if (statusFilter.value === "inactive") {
    result = result.filter((c) => !c.isActive);
  }

  const term = search.value.trim().toLowerCase();
  if (term) {
    result = result.filter(
      (c) =>
        (c.name ?? "").toLowerCase().includes(term) ||
        (c.description ?? "").toLowerCase().includes(term),
    );
  }

  return result;
});

const pageNumbers = computed(() => {
  const current = page.value;
  const start = Math.max(1, current - 2);
  const end = Math.min(MAX_PAGE, current + 2);
  const pages: number[] = [];
  for (let i = start; i <= end; i += 1) pages.push(i);
  return pages;
});

const canGoPrevious = computed(() => page.value > 1);
const canGoNext = computed(() => page.value < MAX_PAGE);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchCategories(): Promise<ProductCategory[]> {
  return await ProductCategoriesService.browse({
    page: page.value,
    pageSize: pageSize.value,
    search: search.value.trim() || undefined,
  });
}

function replaceCategories(nextCategories: ProductCategory[]) {
  categories.value = [...nextCategories];
}

async function loadCategories() {
  loading.value = true;
  try {
    replaceCategories(await fetchCategories());
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("categories.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

function patchCategoryInList(payload: CategorySuccessPayload) {
  const existingIndex = categories.value.findIndex(
    (category) => category.categoryId === payload.categoryId,
  );

  if (existingIndex >= 0) {
    replaceCategories(
      categories.value.map((category) =>
        category.categoryId === payload.categoryId
          ? { ...category, categoryId: payload.categoryId, name: payload.name, description: payload.description, isActive: payload.isActive }
          : category,
      ),
    );
    return;
  }

  replaceCategories([
    { id: `category:${payload.categoryId}`, categoryId: payload.categoryId, name: payload.name, description: payload.description, isActive: payload.isActive } as ProductCategory,
    ...categories.value,
  ]);
}

function patchCategoryStatusInList(categoryId: string, isActive: boolean) {
  replaceCategories(
    categories.value.map((category) =>
      category.categoryId === categoryId ? { ...category, isActive } : category,
    ),
  );
}

function removeCategoryFromList(categoryId: string) {
  replaceCategories(categories.value.filter((category) => category.categoryId !== categoryId));
}

function hasCategoryReachedExpectedState(fetchedCategories: ProductCategory[], expected: CategorySuccessPayload): boolean {
  const fetchedCategory = fetchedCategories.find((category) => category.categoryId === expected.categoryId);
  if (!fetchedCategory) return false;
  return fetchedCategory.name === expected.name && fetchedCategory.description === expected.description && fetchedCategory.isActive === expected.isActive;
}

async function reloadCategoriesUntil(
  predicate: (fetchedCategories: ProductCategory[]) => boolean,
  options?: { attempts?: number; delayMs?: number },
) {
  const attempts = options?.attempts ?? 12;
  const delayMs = options?.delayMs ?? 500;
  loading.value = true;

  try {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const fetchedCategories = await fetchCategories();
      if (predicate(fetchedCategories)) {
        replaceCategories(fetchedCategories);
        return;
      }
      if (attempt < attempts - 1) await sleep(delayMs);
    }
    replaceCategories(await fetchCategories());
  } catch {
    toastStore.addToast({ severity: "error", title: t("toast.error"), message: t("categories.messages.loadError") });
  } finally {
    loading.value = false;
  }
}

function openCreateModal() {
  modalStore.open({
    component: CategoryCreateModal,
    onSuccess: async (payload?: CategorySuccessPayload) => {
      if (payload?.categoryId) patchCategoryInList(payload);
      toastStore.addToast({ severity: "success", title: t("toast.success"), message: t("categories.messages.createSuccess") });
      if (payload?.categoryId) {
        await reloadCategoriesUntil(
          (fetchedCategories) => fetchedCategories.some((category) => category.categoryId === payload.categoryId),
          { attempts: 12, delayMs: 500 },
        );
        return;
      }
      await loadCategories();
    },
    onError: (error) => {
      toastStore.addToast({ severity: "error", title: t("toast.error"), message: error?.message ?? t("categories.messages.createError") });
    },
  });
}

function openEditModal(category: ProductCategory) {
  modalStore.open({
    component: CategoryEditModal,
    props: { categoryId: category.categoryId },
    onSuccess: async (payload?: CategorySuccessPayload) => {
      if (!payload?.categoryId) { await loadCategories(); return; }
      patchCategoryInList(payload);
      toastStore.addToast({ severity: "success", title: t("toast.success"), message: t("categories.messages.updateSuccess") });
      await reloadCategoriesUntil(
        (fetchedCategories) => hasCategoryReachedExpectedState(fetchedCategories, payload),
        { attempts: 12, delayMs: 500 },
      );
    },
    onError: (error) => {
      toastStore.addToast({ severity: "error", title: t("toast.error"), message: error?.message ?? t("categories.messages.updateError") });
    },
  });
}

function openDetailsDrawer(category: ProductCategory) {
  drawerStore.openDrawer({
    component: CategoryDetailsDrawer,
    props: { categoryId: category.categoryId },
    title: t("categories.drawer.title"),
    description: t("categories.drawer.description", { name: category.name }),
    direction: "right",
    size: "lg",
  });
}

async function toggleCategoryStatus(category: ProductCategory) {
  const nextIsActive = !category.isActive;
  try {
    await ProductCategoriesService.update(category.categoryId, {
      name: category.name,
      description: category.description,
      isActive: nextIsActive,
    });
    patchCategoryStatusInList(category.categoryId, nextIsActive);
    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: category.isActive ? t("categories.messages.deactivateSuccess") : t("categories.messages.reactivateSuccess"),
    });
    await reloadCategoriesUntil(
      (fetchedCategories) => fetchedCategories.find((item) => item.categoryId === category.categoryId)?.isActive === nextIsActive,
      { attempts: 12, delayMs: 500 },
    );
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: category.isActive ? t("categories.messages.deactivateError") : t("categories.messages.reactivateError"),
    });
  }
}

async function deleteCategory(category: ProductCategory) {
  try {
    await ProductCategoriesService.delete(category.categoryId);
    removeCategoryFromList(category.categoryId);
    toastStore.addToast({ severity: "success", title: t("toast.success"), message: t("categories.messages.deleteSuccess") });
    await reloadCategoriesUntil(
      (fetchedCategories) => !fetchedCategories.some((item) => item.categoryId === category.categoryId),
      { attempts: 12, delayMs: 500 },
    );
  } catch {
    toastStore.addToast({ severity: "error", title: t("toast.error"), message: t("categories.messages.deleteError") });
  }
}

async function goToPage(targetPage: number) {
  if (targetPage < 1 || targetPage > MAX_PAGE || targetPage === page.value) return;
  page.value = targetPage;
  await loadCategories();
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
  await loadCategories();
}

watch(pageSize, async () => {
  page.value = 1;
  await loadCategories();
});

watch(filteredCategories, () => {
  page.value = 1;
}, { deep: true });

onMounted(async () => {
  await loadCategories();
});
</script>

<template>
  <section class="h-full min-h-0 bg-bt-grey-50 p-bt-spacing-24 flex flex-col">
    <div class="mb-bt-spacing-24 shrink-0">
      <h1 class="text-2xl font-bt-bold text-bt-primary-700">
        {{ $t("categories.title") }}
      </h1>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("categories.subtitle") }}
      </p>
    </div>

    <div
      class="bg-bt-white rounded-l shadow-bt-elevation-200 border border-bt-grey-200 p-bt-spacing-24 flex-1 min-h-0 flex flex-col"
    >
      <!-- TOOLBAR -->
      <div
        class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 mb-bt-spacing-24 shrink-0"
      >
        <!-- Left: search + status filter + Search + Refresh -->
        <div class="flex flex-col sm:flex-row gap-bt-spacing-12 w-full lg:max-w-2xl">
          <input
            v-model="search"
            type="text"
            :placeholder="$t('categories.searchPlaceholder')"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            @keyup.enter="onSearch"
          />

          <select
            v-model="statusFilter"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="all">{{ $t("categories.filters.allStatus") }}</option>
            <option value="active">{{ $t("categories.filters.active") }}</option>
            <option value="inactive">{{ $t("categories.filters.inactive") }}</option>
          </select>

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition"
            @click="onSearch"
          >
            {{ $t("categories.actions.search") }}
          </button>

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
            @click="loadCategories"
          >
            {{ $t("categories.actions.refresh") }}
          </button>
        </div>

        <!-- Right: page size + New Category -->
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
            {{ $t("categories.actions.newCategory") }}
          </button>
        </div>
      </div>

      <!-- TABLE -->
      <div class="flex-1 min-h-0 overflow-auto">
        <div v-if="loading" class="py-bt-spacing-32 text-center text-bt-grey-500">
          {{ $t("common.loading") }}
        </div>

        <table v-else class="w-full border-collapse min-w-[700px]">
          <thead class="sticky top-0 z-10">
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("categories.table.name") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("categories.table.description") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("categories.table.status") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20">{{ $t("categories.table.options") }}</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="category in filteredCategories"
              :key="category.categoryId"
              class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 font-bt-semibold">
                {{ category.name }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ category.description }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <span
                  class="inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold"
                  :class="category.isActive ? 'bg-bt-success-100 text-bt-success-700' : 'bg-bt-error-100 text-bt-error-700'"
                >
                  {{ category.isActive ? $t("categories.status.active") : $t("categories.status.inactive") }}
                </span>
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <CategoryActionMenu
                  :items="[
                    { label: t('categories.actions.viewDetails'), action: () => openDetailsDrawer(category) },
                    { label: t('categories.actions.edit'), action: () => openEditModal(category) },
                    { label: category.isActive ? t('categories.actions.deactivate') : t('categories.actions.reactivate'), action: () => toggleCategoryStatus(category), danger: category.isActive },
                    { label: t('categories.actions.delete'), action: () => deleteCategory(category), danger: true },
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
                </CategoryActionMenu>
              </td>
            </tr>

            <tr v-if="!filteredCategories.length && !loading">
              <td colspan="4" class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500">
                {{ $t("categories.empty") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div
        class="mt-bt-spacing-24 pt-bt-spacing-16 border-t border-bt-grey-200 flex flex-col md:flex-row md:items-center md:justify-between gap-bt-spacing-16 shrink-0"
      >
        <div class="text-sm text-bt-grey-600">
          {{ $t("pagination.page") }} {{ page }} {{ $t("pagination.of") }} {{ MAX_PAGE }}
          <span class="text-bt-grey-500">
            ({{ filteredCategories.length }} {{ $t("categories.filtered") }})
          </span>
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

          <button v-if="pageNumbers[0] > 1" type="button" class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100" @click="goToPage(1)">1</button>
          <span v-if="pageNumbers[0] > 2" class="px-bt-spacing-8 text-bt-grey-500">...</span>

          <button
            v-for="pageNumber in pageNumbers"
            :key="pageNumber"
            type="button"
            class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border transition"
            :class="pageNumber === page ? 'bg-bt-primary-500 border-bt-primary-500 text-bt-white' : 'border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100'"
            @click="goToPage(pageNumber)"
          >{{ pageNumber }}</button>

          <span v-if="pageNumbers[pageNumbers.length - 1] < MAX_PAGE - 1" class="px-bt-spacing-8 text-bt-grey-500">...</span>
          <button v-if="pageNumbers[pageNumbers.length - 1] < MAX_PAGE" type="button" class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100" @click="goToPage(MAX_PAGE)">{{ MAX_PAGE }}</button>

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