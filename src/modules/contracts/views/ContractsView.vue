<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle,
  Milestone,
  RefreshCw,
} from "lucide-vue-next";

import { ContractsService } from "@/core/services/contractsService";
import { useModalStore } from "@/core/stores/modalStore";
import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

import ContractCreateDrawer from "@/modules/contracts/components/ContractCreateDrawer.vue";
import ContractEditModal from "@/modules/contracts/components/ContractEditModal.vue";
import ContractDetailsDrawer from "@/modules/contracts/components/ContractDetailsDrawer.vue";
import ContractActionMenu from "@/modules/contracts/components/ContractActionMenu.vue";

import type { Contract } from "@/core/interfaces/contracts";

const { t } = useI18n();

const modalStore = useModalStore();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const loading = ref(false);
const contracts = ref<Contract[]>([]);
const search = ref("");
const page = ref(1);
const pageSize = ref(10);
const statusFilter = ref<"all" | "active" | "inactive">("all");

const MAX_PAGE = 100;

const filteredContracts = computed(() => {
  let result = contracts.value;

  if (statusFilter.value === "active") {
    result = result.filter((c) => (c.status ?? "").toLowerCase().includes("active"));
  } else if (statusFilter.value === "inactive") {
    result = result.filter((c) => !(c.status ?? "").toLowerCase().includes("active"));
  }

  const term = search.value.trim().toLowerCase();
  if (term) {
    result = result.filter(
      (contract) =>
        (contract.code ?? "").toLowerCase().includes(term) ||
        (contract.clientName ?? "").toLowerCase().includes(term) ||
        (contract.status ?? "").toLowerCase().includes(term) ||
        (contract.description ?? "").toLowerCase().includes(term) ||
        (contract.notes ?? "").toLowerCase().includes(term),
    );
  }

  return result;
});

const pageNumbers = computed(() => {
  const current = page.value;
  const start = Math.max(1, current - 2);
  const end = Math.min(MAX_PAGE, current + 2);
  const pages: number[] = [];
  for (let index = start; index <= end; index += 1) pages.push(index);
  return pages;
});

const canGoPrevious = computed(() => page.value > 1);
const canGoNext = computed(() => page.value < MAX_PAGE);

const summary = computed(() => {
  const total = contracts.value.length;
  const active = contracts.value.filter((c) =>
    (c.status ?? "").toLowerCase().includes("active"),
  ).length;
  const withMilestones = contracts.value.filter(
    (c) => (c.milestones?.length ?? 0) > 0,
  ).length;
  const autoRenew = contracts.value.filter((c) => c.autoRenewEnabled).length;
  return { total, active, withMilestones, autoRenew };
});

function normalizeArrayResponse<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response as T[];
  if (response && typeof response === "object" && "items" in response && Array.isArray((response as any).items))
    return (response as any).items;
  if (response && typeof response === "object" && "data" in response && Array.isArray((response as any).data))
    return (response as any).data;
  return [];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function showSuccess(message: string) {
  toastStore.addToast({ severity: "success", title: t("toast.success"), message });
}

function showError(message: string) {
  toastStore.addToast({ severity: "error", title: t("toast.error"), message });
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatBool(value?: boolean | null): string {
  return value ? t("common.yes") : t("common.no");
}

async function fetchContracts(): Promise<Contract[]> {
  const response = await ContractsService.browse({
    page: page.value,
    pageSize: pageSize.value,
  });
  return normalizeArrayResponse<Contract>(response);
}

function replaceContracts(nextContracts: Contract[]) {
  contracts.value = [...nextContracts];
}

async function loadContracts() {
  replaceContracts(await fetchContracts());
}

async function loadData() {
  loading.value = true;
  try {
    await loadContracts();
  } catch {
    showError(t("contracts.messages.loadError"));
  } finally {
    loading.value = false;
  }
}

async function reloadEventually(attempts = 10, delayMs = 500) {
  loading.value = true;
  try {
    for (let index = 0; index < attempts; index += 1) {
      await loadContracts();
      if (index < attempts - 1) await sleep(delayMs);
    }
  } catch {
    showError(t("contracts.messages.loadError"));
  } finally {
    loading.value = false;
  }
}

async function onSearch() {
  page.value = 1;
  await loadData();
}

async function goToPage(targetPage: number) {
  if (targetPage < 1 || targetPage > MAX_PAGE || targetPage === page.value) return;
  page.value = targetPage;
  await loadData();
}

async function goPrevious() {
  if (!canGoPrevious.value) return;
  await goToPage(page.value - 1);
}

async function goNext() {
  if (!canGoNext.value) return;
  await goToPage(page.value + 1);
}

function openCreateDrawer() {
  drawerStore.openDrawer({
    component: ContractCreateDrawer,
    props: {},
    title: t("contracts.modal.createTitle"),
    description: t("contracts.modal.createDescription"),
    direction: "right",
    size: "xl",
    onSuccess: async () => {
      showSuccess(t("contracts.messages.createSuccess"));
      await reloadEventually();
    },
    onError: (error: any) => {
      showError(error?.message ?? t("contracts.messages.createError"));
    },
  });
}

function openEditModal(contract: Contract) {
  modalStore.open({
    component: ContractEditModal,
    props: { contractId: contract.contractId },
    onSuccess: async () => {
      showSuccess(t("contracts.messages.updateSuccess"));
      await reloadEventually();
    },
    onError: (error: any) => {
      showError(error?.message ?? t("contracts.messages.updateError"));
    },
  });
}

function openDetailsDrawer(contract: Contract) {
  drawerStore.openDrawer({
    component: ContractDetailsDrawer,
    props: { contractId: contract.contractId },
    title: t("contracts.drawer.title"),
    description: t("contracts.drawer.description", { code: contract.code }),
    direction: "right",
    size: "xl",
    onSuccess: async () => { await reloadEventually(); },
    onError: (error: any) => {
      showError(error?.message ?? t("contracts.messages.loadError"));
    },
  });
}

async function deleteContract(contract: Contract) {
  try {
    await ContractsService.delete(contract.contractId);
    showSuccess(t("contracts.messages.deleteSuccess"));
    await reloadEventually();
  } catch {
    showError(t("contracts.messages.deleteError"));
  }
}

watch(pageSize, async () => {
  page.value = 1;
  await loadData();
});

onMounted(async () => {
  await loadData();
});
</script>

<template>
  <section class="h-full min-h-0 bg-bt-grey-50 p-bt-spacing-24 flex flex-col">
    <div class="mb-bt-spacing-24 shrink-0">
      <h1 class="text-2xl font-bt-bold text-bt-primary-700">
        {{ $t("contracts.title") }}
      </h1>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("contracts.subtitle") }}
      </p>
    </div>

    <!-- KPI Cards: icon + label + number style -->
    <div class="mb-bt-spacing-24 grid shrink-0 grid-cols-1 gap-bt-spacing-16 md:grid-cols-4">
      <div class="rounded-l border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100">
        <div class="flex items-center gap-bt-spacing-12">
          <div class="w-12 h-12 rounded-full bg-bt-primary-50 flex items-center justify-center text-bt-primary-600">
            <FileText :size="22" />
          </div>
          <div>
            <div class="text-sm text-bt-grey-500">{{ $t("contracts.summary.total") }}</div>
            <div class="text-2xl font-bt-bold text-bt-primary-700">{{ summary.total }}</div>
          </div>
        </div>
      </div>

      <div class="rounded-l border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100">
        <div class="flex items-center gap-bt-spacing-12">
          <div class="w-12 h-12 rounded-full bg-bt-success-100 flex items-center justify-center text-bt-success-700">
            <CheckCircle :size="22" />
          </div>
          <div>
            <div class="text-sm text-bt-grey-500">{{ $t("contracts.summary.active") }}</div>
            <div class="text-2xl font-bt-bold text-bt-success-700">{{ summary.active }}</div>
          </div>
        </div>
      </div>

      <div class="rounded-l border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100">
        <div class="flex items-center gap-bt-spacing-12">
          <div class="w-12 h-12 rounded-full bg-bt-accent-50 flex items-center justify-center text-bt-accent-600">
            <Milestone :size="22" />
          </div>
          <div>
            <div class="text-sm text-bt-grey-500">{{ $t("contracts.summary.withMilestones") }}</div>
            <div class="text-2xl font-bt-bold text-bt-accent-600">{{ summary.withMilestones }}</div>
          </div>
        </div>
      </div>

      <div class="rounded-l border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100">
        <div class="flex items-center gap-bt-spacing-12">
          <div class="w-12 h-12 rounded-full bg-bt-warning-100 flex items-center justify-center text-bt-warning-700">
            <RefreshCw :size="22" />
          </div>
          <div>
            <div class="text-sm text-bt-grey-500">{{ $t("contracts.summary.autoRenew") }}</div>
            <div class="text-2xl font-bt-bold text-bt-warning-700">{{ summary.autoRenew }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-bt-white rounded-l shadow-bt-elevation-200 border border-bt-grey-200 p-bt-spacing-24 flex-1 min-h-0 flex flex-col">

      <!-- TOOLBAR -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 mb-bt-spacing-24 shrink-0">
        <!-- Left: search + status filter + search button + refresh -->
        <div class="flex flex-col sm:flex-row gap-bt-spacing-12 w-full lg:max-w-2xl">
          <input
            v-model="search"
            type="text"
            :placeholder="$t('contracts.searchPlaceholder')"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            @keyup.enter="onSearch"
          />

          <select
            v-model="statusFilter"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="all">{{ $t("contracts.filters.allStatus") }}</option>
            <option value="active">{{ $t("contracts.filters.active") }}</option>
            <option value="inactive">{{ $t("contracts.filters.inactive") }}</option>
          </select>

          <!-- Primary query action -->
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition"
            @click="onSearch"
          >
            {{ $t("contracts.actions.search") }}
          </button>

          <!-- Secondary: no data impact -->
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
            @click="loadData"
          >
            {{ $t("contracts.actions.refresh") }}
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
            @click="openCreateDrawer"
          >
            {{ $t("contracts.actions.newContract") }}
          </button>
        </div>
      </div>

      <!-- TABLE -->
      <div class="flex-1 min-h-0 overflow-auto">
        <div v-if="loading" class="py-bt-spacing-32 text-center text-bt-grey-500">
          {{ $t("common.loading") }}
        </div>

        <table v-else class="w-full border-collapse min-w-[1200px]">
          <thead class="sticky top-0 z-10">
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("contracts.table.code") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("contracts.table.client") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("contracts.table.startDate") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("contracts.table.endDate") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("contracts.table.status") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("contracts.table.autoRenew") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("contracts.table.expiryNoticeDays") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("contracts.table.milestones") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20">{{ $t("contracts.table.options") }}</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="contract in filteredContracts"
              :key="contract.contractId"
              class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12 font-bt-semibold text-bt-primary-700">
                {{ contract.code }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ contract.clientName }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ formatDate(contract.startDate) }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ formatDate(contract.endDate) }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <span class="inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold bg-bt-info-100 text-bt-info-700">
                  {{ contract.status }}
                </span>
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <span
                  class="inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold"
                  :class="contract.autoRenewEnabled ? 'bg-bt-success-100 text-bt-success-700' : 'bg-bt-grey-200 text-bt-grey-700'"
                >
                  {{ formatBool(contract.autoRenewEnabled) }}
                </span>
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ contract.expiryNoticeDays }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ contract.milestones?.length ?? 0 }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <ContractActionMenu
                  :items="[
                    { label: t('contracts.actions.viewDetails'), action: () => openDetailsDrawer(contract) },
                    { label: t('contracts.actions.edit'), action: () => openEditModal(contract) },
                    { label: t('contracts.actions.delete'), action: () => deleteContract(contract), danger: true },
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
                </ContractActionMenu>
              </td>
            </tr>

            <tr v-if="!filteredContracts.length && !loading">
              <td colspan="9" class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500">
                {{ $t("contracts.empty") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div class="mt-bt-spacing-24 pt-bt-spacing-16 border-t border-bt-grey-200 flex flex-col md:flex-row md:items-center md:justify-between gap-bt-spacing-16 shrink-0">
        <div class="text-sm text-bt-grey-600">
          {{ $t("pagination.page") }} {{ page }} {{ $t("pagination.of") }} {{ MAX_PAGE }}
          <span class="text-bt-grey-500">
            ({{ filteredContracts.length }} {{ $t("contracts.filtered") }})
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