<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-vue-next";

import { TaxesService } from "@/core/services/taxesService";
import { useModalStore } from "@/core/stores/modalStore";
import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

import TaxCreateModal from "@/modules/taxes/components/TaxCreateModal.vue";
import TaxEditModal from "@/modules/taxes/components/TaxEditModal.vue";
import TaxDetailsDrawer from "@/modules/taxes/components/TaxDetailsDrawer.vue";
import TaxActionMenu from "@/modules/taxes/components/TaxActionMenu.vue";

import type { Tax } from "@/core/interfaces/taxes";

interface TaxSuccessPayload {
  taxId: string;
  name: string;
  code: string;
  percentage: number;
  isActive: boolean;
}

const { t } = useI18n();

const modalStore = useModalStore();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const taxes = ref<Tax[]>([]);
const loading = ref(false);
const search = ref("");
const statusFilter = ref<"all" | "active" | "inactive">("all");
const page = ref(1);
const pageSize = ref(10);

const MAX_PAGE = 100;

const filteredTaxes = computed(() => {
  let result = taxes.value;

  if (statusFilter.value === "active") {
    result = result.filter((tx) => tx.isActive);
  } else if (statusFilter.value === "inactive") {
    result = result.filter((tx) => !tx.isActive);
  }

  const term = search.value.trim().toLowerCase();
  if (term) {
    result = result.filter(
      (tx) =>
        (tx.name ?? "").toLowerCase().includes(term) ||
        (tx.code ?? "").toLowerCase().includes(term),
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

async function fetchTaxes(): Promise<Tax[]> {
  return await TaxesService.browse({
    page: page.value,
    pageSize: pageSize.value,
    search: search.value.trim() || undefined,
  });
}

function replaceTaxes(nextTaxes: Tax[]) {
  taxes.value = [...nextTaxes];
}

async function loadTaxes() {
  loading.value = true;
  try {
    replaceTaxes(await fetchTaxes());
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("taxes.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

function patchTaxInList(payload: TaxSuccessPayload) {
  const existingIndex = taxes.value.findIndex((tax) => tax.taxId === payload.taxId);

  if (existingIndex >= 0) {
    replaceTaxes(
      taxes.value.map((tax) =>
        tax.taxId === payload.taxId
          ? { ...tax, taxId: payload.taxId, name: payload.name, code: payload.code, percentage: payload.percentage, isActive: payload.isActive }
          : tax,
      ),
    );
    return;
  }

  replaceTaxes([
    { id: `tax:${payload.taxId}`, taxId: payload.taxId, name: payload.name, code: payload.code, percentage: payload.percentage, isActive: payload.isActive } as Tax,
    ...taxes.value,
  ]);
}

function patchTaxStatusInList(taxId: string, isActive: boolean) {
  replaceTaxes(taxes.value.map((tax) => tax.taxId === taxId ? { ...tax, isActive } : tax));
}

function removeTaxFromList(taxId: string) {
  replaceTaxes(taxes.value.filter((tax) => tax.taxId !== taxId));
}

function hasTaxReachedExpectedState(fetchedTaxes: Tax[], expected: TaxSuccessPayload): boolean {
  const fetchedTax = fetchedTaxes.find((tax) => tax.taxId === expected.taxId);
  if (!fetchedTax) return false;
  return (
    fetchedTax.name === expected.name &&
    fetchedTax.code === expected.code &&
    Number(fetchedTax.percentage) === Number(expected.percentage) &&
    fetchedTax.isActive === expected.isActive
  );
}

async function reloadTaxesUntil(
  predicate: (fetchedTaxes: Tax[]) => boolean,
  options?: { attempts?: number; delayMs?: number },
) {
  const attempts = options?.attempts ?? 12;
  const delayMs = options?.delayMs ?? 500;
  loading.value = true;

  try {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const fetchedTaxes = await fetchTaxes();
      if (predicate(fetchedTaxes)) {
        replaceTaxes(fetchedTaxes);
        return;
      }
      if (attempt < attempts - 1) await sleep(delayMs);
    }
    replaceTaxes(await fetchTaxes());
  } catch {
    toastStore.addToast({ severity: "error", title: t("toast.error"), message: t("taxes.messages.loadError") });
  } finally {
    loading.value = false;
  }
}

function openCreateModal() {
  modalStore.open({
    component: TaxCreateModal,
    onSuccess: async (payload?: TaxSuccessPayload) => {
      if (payload?.taxId) patchTaxInList(payload);
      toastStore.addToast({ severity: "success", title: t("toast.success"), message: t("taxes.messages.createSuccess") });
      if (payload?.taxId) {
        await reloadTaxesUntil(
          (fetchedTaxes) => fetchedTaxes.some((tax) => tax.taxId === payload.taxId),
          { attempts: 12, delayMs: 500 },
        );
        return;
      }
      await loadTaxes();
    },
    onError: (error) => {
      toastStore.addToast({ severity: "error", title: t("toast.error"), message: error?.message ?? t("taxes.messages.createError") });
    },
  });
}

function openEditModal(tax: Tax) {
  modalStore.open({
    component: TaxEditModal,
    props: { taxId: tax.taxId },
    onSuccess: async (payload?: TaxSuccessPayload) => {
      if (!payload?.taxId) { await loadTaxes(); return; }
      patchTaxInList(payload);
      toastStore.addToast({ severity: "success", title: t("toast.success"), message: t("taxes.messages.updateSuccess") });
      await reloadTaxesUntil(
        (fetchedTaxes) => hasTaxReachedExpectedState(fetchedTaxes, payload),
        { attempts: 12, delayMs: 500 },
      );
    },
    onError: (error) => {
      toastStore.addToast({ severity: "error", title: t("toast.error"), message: error?.message ?? t("taxes.messages.updateError") });
    },
  });
}

function openDetailsDrawer(tax: Tax) {
  drawerStore.openDrawer({
    component: TaxDetailsDrawer,
    props: { taxId: tax.taxId },
    title: t("taxes.drawer.title"),
    description: t("taxes.drawer.description", { name: tax.name }),
    direction: "right",
    size: "lg",
  });
}

async function toggleTaxStatus(tax: Tax) {
  const nextIsActive = !tax.isActive;
  try {
    await TaxesService.update(tax.taxId, {
      name: tax.name,
      code: tax.code,
      percentage: tax.percentage,
      isActive: nextIsActive,
    });
    patchTaxStatusInList(tax.taxId, nextIsActive);
    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: tax.isActive ? t("taxes.messages.deactivateSuccess") : t("taxes.messages.reactivateSuccess"),
    });
    await reloadTaxesUntil(
      (fetchedTaxes) => fetchedTaxes.find((item) => item.taxId === tax.taxId)?.isActive === nextIsActive,
      { attempts: 12, delayMs: 500 },
    );
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: tax.isActive ? t("taxes.messages.deactivateError") : t("taxes.messages.reactivateError"),
    });
  }
}

async function deleteTax(tax: Tax) {
  try {
    await TaxesService.delete(tax.taxId);
    removeTaxFromList(tax.taxId);
    toastStore.addToast({ severity: "success", title: t("toast.success"), message: t("taxes.messages.deleteSuccess") });
    await reloadTaxesUntil(
      (fetchedTaxes) => !fetchedTaxes.some((item) => item.taxId === tax.taxId),
      { attempts: 12, delayMs: 500 },
    );
  } catch {
    toastStore.addToast({ severity: "error", title: t("toast.error"), message: t("taxes.messages.deleteError") });
  }
}

async function goToPage(targetPage: number) {
  if (targetPage < 1 || targetPage > MAX_PAGE || targetPage === page.value) return;
  page.value = targetPage;
  await loadTaxes();
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
  await loadTaxes();
}

watch(pageSize, async () => {
  page.value = 1;
  await loadTaxes();
});

watch(filteredTaxes, () => {
  page.value = 1;
}, { deep: true });

onMounted(async () => {
  await loadTaxes();
});
</script>

<template>
  <section class="h-full min-h-0 bg-bt-grey-50 p-bt-spacing-24 flex flex-col">
    <div class="mb-bt-spacing-24 shrink-0">
      <h1 class="text-2xl font-bt-bold text-bt-primary-700">
        {{ $t("taxes.title") }}
      </h1>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("taxes.subtitle") }}
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
            :placeholder="$t('taxes.searchPlaceholder')"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            @keyup.enter="onSearch"
          />

          <select
            v-model="statusFilter"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="all">{{ $t("taxes.filters.allStatus") }}</option>
            <option value="active">{{ $t("taxes.filters.active") }}</option>
            <option value="inactive">{{ $t("taxes.filters.inactive") }}</option>
          </select>

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition"
            @click="onSearch"
          >
            {{ $t("taxes.actions.search") }}
          </button>

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
            @click="loadTaxes"
          >
            {{ $t("taxes.actions.refresh") }}
          </button>
        </div>

        <!-- Right: page size + New Tax -->
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
            {{ $t("taxes.actions.newTax") }}
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
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("taxes.table.name") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("taxes.table.code") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("taxes.table.percentage") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("taxes.table.status") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20">{{ $t("taxes.table.options") }}</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="tax in filteredTaxes"
              :key="tax.taxId"
              class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 font-bt-semibold">
                {{ tax.name }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ tax.code }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ tax.percentage }}%
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <span
                  class="inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold"
                  :class="tax.isActive ? 'bg-bt-success-100 text-bt-success-700' : 'bg-bt-error-100 text-bt-error-700'"
                >
                  {{ tax.isActive ? $t("taxes.status.active") : $t("taxes.status.inactive") }}
                </span>
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <TaxActionMenu
                  :items="[
                    { label: t('taxes.actions.viewDetails'), action: () => openDetailsDrawer(tax) },
                    { label: t('taxes.actions.edit'), action: () => openEditModal(tax) },
                    { label: tax.isActive ? t('taxes.actions.deactivate') : t('taxes.actions.reactivate'), action: () => toggleTaxStatus(tax), danger: tax.isActive },
                    { label: t('taxes.actions.delete'), action: () => deleteTax(tax), danger: true },
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
                </TaxActionMenu>
              </td>
            </tr>

            <tr v-if="!filteredTaxes.length && !loading">
              <td colspan="5" class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500">
                {{ $t("taxes.empty") }}
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
            ({{ filteredTaxes.length }} {{ $t("taxes.filtered") }})
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