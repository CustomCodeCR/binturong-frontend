<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { MoreHorizontal } from "lucide-vue-next";

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

function normalizeArrayResponse<T>(response: unknown): T[] {
  if (Array.isArray(response)) {
    return response as T[];
  }

  if (
    response &&
    typeof response === "object" &&
    "items" in response &&
    Array.isArray((response as { items: T[] }).items)
  ) {
    return (response as { items: T[] }).items;
  }

  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    Array.isArray((response as { data: T[] }).data)
  ) {
    return (response as { data: T[] }).data;
  }

  return [];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchContracts(): Promise<Contract[]> {
  const response = await ContractsService.browse({
    page: 1,
    pageSize: 100,
    search: search.value.trim() || undefined,
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
  } catch (error) {
    console.error("Load contracts error:", error);

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

      if (index < attempts - 1) {
        await sleep(delayMs);
      }
    }
  } catch (error) {
    console.error("Reload contracts error:", error);

    showError(t("contracts.messages.loadError"));
  } finally {
    loading.value = false;
  }
}

function showSuccess(message: string) {
  toastStore.addToast({
    severity: "success",
    title: t("toast.success"),
    message,
  });
}

function showError(message: string) {
  toastStore.addToast({
    severity: "error",
    title: t("toast.error"),
    message,
  });
}

const filteredContracts = computed(() => {
  const term = search.value.trim().toLowerCase();

  if (!term) {
    return contracts.value;
  }

  return contracts.value.filter((contract) => {
    return (
      (contract.code ?? "").toLowerCase().includes(term) ||
      (contract.clientName ?? "").toLowerCase().includes(term) ||
      (contract.status ?? "").toLowerCase().includes(term) ||
      (contract.description ?? "").toLowerCase().includes(term) ||
      (contract.notes ?? "").toLowerCase().includes(term)
    );
  });
});

const summary = computed(() => {
  const total = contracts.value.length;
  const active = contracts.value.filter((item) =>
    (item.status ?? "").toLowerCase().includes("active"),
  ).length;
  const withMilestones = contracts.value.filter(
    (item) => (item.milestones?.length ?? 0) > 0,
  ).length;

  return {
    total,
    active,
    withMilestones,
  };
});

function formatDate(value?: string | null): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString();
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
    props: {
      contractId: contract.contractId,
    },
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
    props: {
      contractId: contract.contractId,
    },
    title: t("contracts.drawer.title"),
    description: t("contracts.drawer.description", {
      code: contract.code,
    }),
    direction: "right",
    size: "xl",
    onSuccess: async () => {
      await reloadEventually();
    },
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
  } catch (error) {
    console.error("Delete contract error:", error);

    showError(t("contracts.messages.deleteError"));
  }
}

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

    <div
      class="mb-bt-spacing-24 grid shrink-0 grid-cols-1 gap-bt-spacing-16 md:grid-cols-3"
    >
      <div
        class="rounded-l border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100"
      >
        <div class="text-sm text-bt-grey-500">
          {{ $t("contracts.summary.total") }}
        </div>
        <div class="mt-bt-spacing-8 text-2xl font-bt-bold text-bt-primary-700">
          {{ summary.total }}
        </div>
      </div>

      <div
        class="rounded-l border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100"
      >
        <div class="text-sm text-bt-grey-500">
          {{ $t("contracts.summary.active") }}
        </div>
        <div class="mt-bt-spacing-8 text-2xl font-bt-bold text-bt-success-700">
          {{ summary.active }}
        </div>
      </div>

      <div
        class="rounded-l border border-bt-grey-200 bg-bt-white p-bt-spacing-16 shadow-bt-elevation-100"
      >
        <div class="text-sm text-bt-grey-500">
          {{ $t("contracts.summary.withMilestones") }}
        </div>
        <div class="mt-bt-spacing-8 text-2xl font-bt-bold text-bt-accent-600">
          {{ summary.withMilestones }}
        </div>
      </div>
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
            :placeholder="$t('contracts.searchPlaceholder')"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            @keyup.enter="loadData"
          />

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition"
            @click="loadData"
          >
            {{ $t("contracts.actions.search") }}
          </button>

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
            @click="loadData"
          >
            {{ $t("contracts.actions.refresh") }}
          </button>
        </div>

        <button
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 transition font-bt-semibold"
          @click="openCreateDrawer"
        >
          {{ $t("contracts.actions.newContract") }}
        </button>
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
                {{ $t("contracts.table.code") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("contracts.table.client") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("contracts.table.startDate") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("contracts.table.endDate") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("contracts.table.status") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("contracts.table.milestones") }}
              </th>
              <th
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20"
              >
                {{ $t("contracts.table.options") }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="contract in filteredContracts"
              :key="contract.contractId"
              class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <div class="font-bt-semibold text-bt-primary-700">
                  {{ contract.code }}
                </div>
                <div class="text-xs text-bt-grey-500">
                  {{ contract.contractId }}
                </div>
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ contract.clientName }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ formatDate(contract.startDate) }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ formatDate(contract.endDate) }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <span
                  class="inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold bg-bt-info-100 text-bt-info-700"
                >
                  {{ contract.status }}
                </span>
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ contract.milestones?.length ?? 0 }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <ContractActionMenu
                  :items="[
                    {
                      label: t('contracts.actions.viewDetails'),
                      action: () => openDetailsDrawer(contract),
                    },
                    {
                      label: t('contracts.actions.edit'),
                      action: () => openEditModal(contract),
                    },
                    {
                      label: t('contracts.actions.delete'),
                      action: () => deleteContract(contract),
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
                </ContractActionMenu>
              </td>
            </tr>

            <tr v-if="!filteredContracts.length">
              <td
                colspan="7"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("contracts.empty") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
