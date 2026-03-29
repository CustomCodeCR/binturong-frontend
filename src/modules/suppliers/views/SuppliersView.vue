<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-vue-next";

import { SuppliersService } from "@/core/services/suppliersService";
import { useModalStore } from "@/core/stores/modalStore";
import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

import SupplierCreateModal from "@/modules/suppliers/components/SupplierCreateModal.vue";
import SupplierEditModal from "@/modules/suppliers/components/SupplierEditModal.vue";
import SupplierDetailsDrawer from "@/modules/suppliers/components/SupplierDetailsDrawer.vue";
import SupplierActionMenu from "@/modules/suppliers/components/SupplierActionMenu.vue";

import type { Supplier } from "@/core/interfaces/suppliers";

interface SupplierSuccessPayload {
  supplierId: string;
  identification: string;
  identificationType: string;
  legalName: string;
  tradeName: string;
  email: string;
  phone: string;
  paymentTerms: string;
  mainCurrency: string;
  pendingPayables: number;
  isActive: boolean;
}

const { t } = useI18n();

const modalStore = useModalStore();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const suppliers = ref<Supplier[]>([]);
const loading = ref(false);
const search = ref("");
const page = ref(1);
const pageSize = ref(10);
const statusFilter = ref<"all" | "active" | "inactive">("all");

const MAX_PAGE = 100;

const filteredSuppliers = computed(() => {
  let result = suppliers.value;

  if (statusFilter.value === "active") {
    result = result.filter((s) => s.isActive);
  } else if (statusFilter.value === "inactive") {
    result = result.filter((s) => !s.isActive);
  }

  return result;
});

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

async function fetchSuppliers(): Promise<Supplier[]> {
  return await SuppliersService.browse({
    page: page.value,
    pageSize: pageSize.value,
    search: search.value.trim() || undefined,
  });
}

function replaceSuppliers(nextSuppliers: Supplier[]) {
  suppliers.value = [...nextSuppliers];
}

async function loadSuppliers() {
  loading.value = true;
  try {
    replaceSuppliers(await fetchSuppliers());
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("suppliers.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

function patchSupplierInList(payload: SupplierSuccessPayload) {
  const existingIndex = suppliers.value.findIndex(
    (supplier) => supplier.supplierId === payload.supplierId,
  );

  if (existingIndex >= 0) {
    replaceSuppliers(
      suppliers.value.map((supplier) =>
        supplier.supplierId === payload.supplierId
          ? {
              ...supplier,
              supplierId: payload.supplierId,
              identification: payload.identification,
              identificationType: payload.identificationType,
              legalName: payload.legalName,
              tradeName: payload.tradeName,
              email: payload.email,
              phone: payload.phone,
              paymentTerms: payload.paymentTerms,
              mainCurrency: payload.mainCurrency,
              pendingPayables: payload.pendingPayables,
              isActive: payload.isActive,
            }
          : supplier,
      ),
    );
    return;
  }

  replaceSuppliers([
    {
      id: `supplier:${payload.supplierId}`,
      supplierId: payload.supplierId,
      identification: payload.identification,
      identificationType: payload.identificationType,
      legalName: payload.legalName,
      tradeName: payload.tradeName,
      email: payload.email,
      phone: payload.phone,
      paymentTerms: payload.paymentTerms,
      mainCurrency: payload.mainCurrency,
      pendingPayables: payload.pendingPayables,
      isActive: payload.isActive,
    } as Supplier,
    ...suppliers.value,
  ]);
}

function patchSupplierStatusInList(supplierId: string, isActive: boolean) {
  replaceSuppliers(
    suppliers.value.map((supplier) =>
      supplier.supplierId === supplierId ? { ...supplier, isActive } : supplier,
    ),
  );
}

function removeSupplierFromList(supplierId: string) {
  replaceSuppliers(
    suppliers.value.filter((supplier) => supplier.supplierId !== supplierId),
  );
}

function hasSupplierReachedExpectedState(
  fetchedSuppliers: Supplier[],
  expected: SupplierSuccessPayload,
): boolean {
  const fetchedSupplier = fetchedSuppliers.find(
    (supplier) => supplier.supplierId === expected.supplierId,
  );

  if (!fetchedSupplier) return false;

  return (
    fetchedSupplier.identification === expected.identification &&
    fetchedSupplier.identificationType === expected.identificationType &&
    fetchedSupplier.legalName === expected.legalName &&
    fetchedSupplier.tradeName === expected.tradeName &&
    fetchedSupplier.email === expected.email &&
    fetchedSupplier.phone === expected.phone &&
    fetchedSupplier.paymentTerms === expected.paymentTerms &&
    fetchedSupplier.mainCurrency === expected.mainCurrency &&
    Number(fetchedSupplier.pendingPayables) === Number(expected.pendingPayables) &&
    fetchedSupplier.isActive === expected.isActive
  );
}

async function reloadSuppliersUntil(
  predicate: (fetchedSuppliers: Supplier[]) => boolean,
  options?: { attempts?: number; delayMs?: number },
) {
  const attempts = options?.attempts ?? 12;
  const delayMs = options?.delayMs ?? 500;

  loading.value = true;

  try {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const fetchedSuppliers = await fetchSuppliers();

      if (predicate(fetchedSuppliers)) {
        replaceSuppliers(fetchedSuppliers);
        return;
      }

      if (attempt < attempts - 1) {
        await sleep(delayMs);
      }
    }

    replaceSuppliers(await fetchSuppliers());
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("suppliers.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

function openCreateModal() {
  modalStore.open({
    component: SupplierCreateModal,
    onSuccess: async (payload?: SupplierSuccessPayload) => {
      if (payload?.supplierId) patchSupplierInList(payload);

      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("suppliers.messages.createSuccess"),
      });

      if (payload?.supplierId) {
        await reloadSuppliersUntil(
          (fetchedSuppliers) =>
            fetchedSuppliers.some((supplier) => supplier.supplierId === payload.supplierId),
          { attempts: 12, delayMs: 500 },
        );
        return;
      }

      await loadSuppliers();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("suppliers.messages.createError"),
      });
    },
  });
}

function openEditModal(supplier: Supplier) {
  modalStore.open({
    component: SupplierEditModal,
    props: { supplierId: supplier.supplierId },
    onSuccess: async (payload?: SupplierSuccessPayload) => {
      if (!payload?.supplierId) {
        await loadSuppliers();
        return;
      }

      patchSupplierInList(payload);

      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("suppliers.messages.updateSuccess"),
      });

      await reloadSuppliersUntil(
        (fetchedSuppliers) => hasSupplierReachedExpectedState(fetchedSuppliers, payload),
        { attempts: 12, delayMs: 500 },
      );
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("suppliers.messages.updateError"),
      });
    },
  });
}

function openDetailsDrawer(supplier: Supplier) {
  drawerStore.openDrawer({
    component: SupplierDetailsDrawer,
    props: { supplierId: supplier.supplierId },
    title: t("suppliers.drawer.title"),
    description: t("suppliers.drawer.description", {
      name: supplier.tradeName || supplier.legalName,
    }),
    direction: "right",
    size: "xl",
  });
}

async function toggleSupplierStatus(supplier: Supplier) {
  const nextIsActive = !supplier.isActive;

  try {
    await SuppliersService.update(supplier.supplierId, {
      legalName: supplier.legalName,
      tradeName: supplier.tradeName,
      email: supplier.email,
      phone: supplier.phone,
      paymentTerms: supplier.paymentTerms,
      mainCurrency: supplier.mainCurrency,
      isActive: nextIsActive,
    });

    patchSupplierStatusInList(supplier.supplierId, nextIsActive);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: supplier.isActive
        ? t("suppliers.messages.deactivateSuccess")
        : t("suppliers.messages.reactivateSuccess"),
    });

    await reloadSuppliersUntil(
      (fetchedSuppliers) => {
        const fetchedSupplier = fetchedSuppliers.find(
          (item) => item.supplierId === supplier.supplierId,
        );
        return fetchedSupplier?.isActive === nextIsActive;
      },
      { attempts: 12, delayMs: 500 },
    );
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: supplier.isActive
        ? t("suppliers.messages.deactivateError")
        : t("suppliers.messages.reactivateError"),
    });
  }
}

async function deleteSupplier(supplier: Supplier) {
  try {
    await SuppliersService.delete(supplier.supplierId);

    removeSupplierFromList(supplier.supplierId);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("suppliers.messages.deleteSuccess"),
    });

    await reloadSuppliersUntil(
      (fetchedSuppliers) =>
        !fetchedSuppliers.some((item) => item.supplierId === supplier.supplierId),
      { attempts: 12, delayMs: 500 },
    );
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("suppliers.messages.deleteError"),
    });
  }
}

async function onSearch() {
  page.value = 1;
  await loadSuppliers();
}

async function goToPage(targetPage: number) {
  if (targetPage < 1 || targetPage > MAX_PAGE || targetPage === page.value) return;
  page.value = targetPage;
  await loadSuppliers();
}

async function goPrevious() {
  if (!canGoPrevious.value) return;
  await goToPage(page.value - 1);
}

async function goNext() {
  if (!canGoNext.value) return;
  await goToPage(page.value + 1);
}

watch(pageSize, async () => {
  page.value = 1;
  await loadSuppliers();
});

onMounted(async () => {
  await loadSuppliers();
});
</script>

<template>
  <section class="h-full min-h-0 bg-bt-grey-50 p-bt-spacing-24 flex flex-col">
    <div class="mb-bt-spacing-24 shrink-0">
      <h1 class="text-2xl font-bt-bold text-bt-primary-700">
        {{ $t("suppliers.title") }}
      </h1>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("suppliers.subtitle") }}
      </p>
    </div>

    <div
      class="bg-bt-white rounded-l shadow-bt-elevation-200 border border-bt-grey-200 p-bt-spacing-24 flex-1 min-h-0 flex flex-col"
    >
      <!-- TOOLBAR -->
      <div
        class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 mb-bt-spacing-24 shrink-0"
      >
        <!-- Left: search + status filter + search button + refresh -->
        <div class="flex flex-col sm:flex-row gap-bt-spacing-12 w-full lg:max-w-2xl">
          <input
            v-model="search"
            type="text"
            :placeholder="$t('suppliers.searchPlaceholder')"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            @keyup.enter="onSearch"
          />

          <select
            v-model="statusFilter"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="all">{{ $t("suppliers.filters.allStatus") }}</option>
            <option value="active">{{ $t("suppliers.filters.active") }}</option>
            <option value="inactive">{{ $t("suppliers.filters.inactive") }}</option>
          </select>

          <!-- Primary query action -->
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition"
            @click="onSearch"
          >
            {{ $t("suppliers.actions.search") }}
          </button>

          <!-- Secondary: no data impact -->
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
            @click="loadSuppliers"
          >
            {{ $t("suppliers.actions.refresh") }}
          </button>
        </div>

        <!-- Right: page size + create -->
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
            {{ $t("suppliers.actions.newSupplier") }}
          </button>
        </div>
      </div>

      <!-- TABLE -->
      <div class="flex-1 min-h-0 overflow-auto">
        <div
          v-if="loading"
          class="py-bt-spacing-32 text-center text-bt-grey-500"
        >
          {{ $t("common.loading") }}
        </div>

        <table v-else class="w-full border-collapse min-w-[1300px]">
          <thead class="sticky top-0 z-10">
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("suppliers.table.identification") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("suppliers.table.legalName") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("suppliers.table.tradeName") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("suppliers.table.email") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("suppliers.table.phone") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("suppliers.table.pendingPayables") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("suppliers.table.status") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20">{{ $t("suppliers.table.options") }}</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="supplier in filteredSuppliers"
              :key="supplier.supplierId"
              class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                <div class="font-bt-semibold text-bt-primary-700">{{ supplier.identification }}</div>
                <div class="text-xs text-bt-grey-500">{{ supplier.identificationType }}</div>
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ supplier.legalName }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ supplier.tradeName }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ supplier.email }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ supplier.phone }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ supplier.pendingPayables }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <span
                  :class="[
                    'inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold',
                    supplier.isActive
                      ? 'bg-bt-success-100 text-bt-success-700'
                      : 'bg-bt-error-100 text-bt-error-700',
                  ]"
                >
                  {{ supplier.isActive ? $t("suppliers.status.active") : $t("suppliers.status.inactive") }}
                </span>
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <SupplierActionMenu
                  :items="[
                    {
                      label: t('suppliers.actions.viewDetails'),
                      action: () => openDetailsDrawer(supplier),
                    },
                    {
                      label: t('suppliers.actions.edit'),
                      action: () => openEditModal(supplier),
                    },
                    {
                      label: supplier.isActive
                        ? t('suppliers.actions.deactivate')
                        : t('suppliers.actions.reactivate'),
                      action: () => toggleSupplierStatus(supplier),
                      danger: supplier.isActive,
                    },
                    {
                      label: t('suppliers.actions.delete'),
                      action: () => deleteSupplier(supplier),
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
                </SupplierActionMenu>
              </td>
            </tr>

            <tr v-if="!filteredSuppliers.length && !loading">
              <td
                colspan="8"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("suppliers.empty") }}
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
            ({{ filteredSuppliers.length }} {{ $t("suppliers.filtered") }})
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

          <button
            v-if="pageNumbers[0] > 1"
            type="button"
            class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100"
            @click="goToPage(1)"
          >
            1
          </button>

          <span v-if="pageNumbers[0] > 2" class="px-bt-spacing-8 text-bt-grey-500">...</span>

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
          >...</span>

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