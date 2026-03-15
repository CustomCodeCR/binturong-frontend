<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-vue-next";

import { BranchesService } from "@/core/services/branchesService";
import { useModalStore } from "@/core/stores/modalStore";
import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

import BranchCreateModal from "@/modules/branches/components/BranchCreateModal.vue";
import BranchEditModal from "@/modules/branches/components/BranchEditModal.vue";
import BranchDetailsDrawer from "@/modules/branches/components/BranchDetailsDrawer.vue";
import BranchActionMenu from "@/modules/branches/components/BranchActionMenu.vue";

import type { Branch } from "@/core/interfaces/branches";

interface BranchSuccessPayload {
  branchId: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
  warehouses: Array<unknown>;
}

const { t } = useI18n();

const modalStore = useModalStore();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const branches = ref<Branch[]>([]);
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

async function fetchBranches(): Promise<Branch[]> {
  return await BranchesService.browse({
    page: page.value,
    pageSize: pageSize.value,
    search: search.value.trim() || undefined,
  });
}

function replaceBranches(nextBranches: Branch[]) {
  branches.value = [...nextBranches];
}

async function loadBranches() {
  loading.value = true;

  try {
    replaceBranches(await fetchBranches());
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("branches.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

function patchBranchInList(payload: BranchSuccessPayload) {
  const existingIndex = branches.value.findIndex(
    (branch) => branch.branchId === payload.branchId,
  );

  if (existingIndex >= 0) {
    replaceBranches(
      branches.value.map((branch) =>
        branch.branchId === payload.branchId
          ? {
              ...branch,
              branchId: payload.branchId,
              code: payload.code,
              name: payload.name,
              address: payload.address,
              phone: payload.phone,
              isActive: payload.isActive,
              warehouses: payload.warehouses,
            }
          : branch,
      ),
    );
    return;
  }

  replaceBranches([
    {
      id: `branch:${payload.branchId}`,
      branchId: payload.branchId,
      code: payload.code,
      name: payload.name,
      address: payload.address,
      phone: payload.phone,
      isActive: payload.isActive,
      warehouses: payload.warehouses,
    } as Branch,
    ...branches.value,
  ]);
}

function patchBranchStatusInList(branchId: string, isActive: boolean) {
  replaceBranches(
    branches.value.map((branch) =>
      branch.branchId === branchId
        ? {
            ...branch,
            isActive,
          }
        : branch,
    ),
  );
}

function patchBranchWarehousesInList(
  branchId: string,
  warehouses: Branch["warehouses"],
) {
  replaceBranches(
    branches.value.map((branch) =>
      branch.branchId === branchId
        ? {
            ...branch,
            warehouses: [...warehouses],
          }
        : branch,
    ),
  );
}

function removeBranchFromList(branchId: string) {
  replaceBranches(
    branches.value.filter((branch) => branch.branchId !== branchId),
  );
}

function hasBranchReachedExpectedState(
  fetchedBranches: Branch[],
  expected: BranchSuccessPayload,
): boolean {
  const fetchedBranch = fetchedBranches.find(
    (branch) => branch.branchId === expected.branchId,
  );

  if (!fetchedBranch) {
    return false;
  }

  return (
    fetchedBranch.code === expected.code &&
    fetchedBranch.name === expected.name &&
    fetchedBranch.address === expected.address &&
    fetchedBranch.phone === expected.phone &&
    fetchedBranch.isActive === expected.isActive &&
    (fetchedBranch.warehouses?.length ?? 0) === expected.warehouses.length
  );
}

async function reloadBranchesUntil(
  predicate: (fetchedBranches: Branch[]) => boolean,
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
      const fetchedBranches = await fetchBranches();

      if (predicate(fetchedBranches)) {
        replaceBranches(fetchedBranches);
        return;
      }

      if (attempt < attempts - 1) {
        await sleep(delayMs);
      }
    }

    replaceBranches(await fetchBranches());
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("branches.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

function openCreateModal() {
  modalStore.open({
    component: BranchCreateModal,
    onSuccess: async (payload?: BranchSuccessPayload) => {
      if (payload?.branchId) {
        patchBranchInList(payload);
      }

      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("branches.messages.createSuccess"),
      });

      if (payload?.branchId) {
        await reloadBranchesUntil(
          (fetchedBranches) =>
            fetchedBranches.some(
              (branch) => branch.branchId === payload.branchId,
            ),
          {
            attempts: 12,
            delayMs: 500,
          },
        );
        return;
      }

      await loadBranches();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("branches.messages.createError"),
      });
    },
  });
}

function openEditModal(branch: Branch) {
  modalStore.open({
    component: BranchEditModal,
    props: {
      branchId: branch.branchId,
    },
    onSuccess: async (payload?: BranchSuccessPayload) => {
      if (!payload?.branchId) {
        await loadBranches();
        return;
      }

      patchBranchInList(payload);

      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("branches.messages.updateSuccess"),
      });

      await reloadBranchesUntil(
        (fetchedBranches) =>
          hasBranchReachedExpectedState(fetchedBranches, payload),
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
        message: error?.message ?? t("branches.messages.updateError"),
      });
    },
  });
}

function openDetailsDrawer(branch: Branch) {
  drawerStore.openDrawer({
    component: BranchDetailsDrawer,
    props: {
      branchId: branch.branchId,
      onWarehousesChanged: async (warehouses: Branch["warehouses"]) => {
        patchBranchWarehousesInList(branch.branchId, warehouses);

        await reloadBranchesUntil(
          (fetchedBranches) => {
            const fetchedBranch = fetchedBranches.find(
              (item) => item.branchId === branch.branchId,
            );

            return (
              (fetchedBranch?.warehouses?.length ?? 0) === warehouses.length
            );
          },
          {
            attempts: 12,
            delayMs: 500,
          },
        );
      },
    },
    title: t("branches.drawer.title"),
    description: t("branches.drawer.description", { name: branch.name }),
    direction: "right",
    size: "xl",
  });
}

async function toggleBranchStatus(branch: Branch) {
  const nextIsActive = !branch.isActive;

  try {
    await BranchesService.update(branch.branchId, {
      code: branch.code,
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      isActive: nextIsActive,
    });

    patchBranchStatusInList(branch.branchId, nextIsActive);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: branch.isActive
        ? t("branches.messages.deactivateSuccess")
        : t("branches.messages.reactivateSuccess"),
    });

    await reloadBranchesUntil(
      (fetchedBranches) => {
        const fetchedBranch = fetchedBranches.find(
          (item) => item.branchId === branch.branchId,
        );
        return fetchedBranch?.isActive === nextIsActive;
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
      message: branch.isActive
        ? t("branches.messages.deactivateError")
        : t("branches.messages.reactivateError"),
    });
  }
}

async function deleteBranch(branch: Branch) {
  try {
    await BranchesService.delete(branch.branchId);

    removeBranchFromList(branch.branchId);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("branches.messages.deleteSuccess"),
    });

    await reloadBranchesUntil(
      (fetchedBranches) =>
        !fetchedBranches.some((item) => item.branchId === branch.branchId),
      {
        attempts: 12,
        delayMs: 500,
      },
    );
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("branches.messages.deleteError"),
    });
  }
}

async function goToPage(targetPage: number) {
  if (targetPage < 1 || targetPage > MAX_PAGE || targetPage === page.value) {
    return;
  }

  page.value = targetPage;
  await loadBranches();
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
  await loadBranches();
}

watch(pageSize, async () => {
  page.value = 1;
  await loadBranches();
});

onMounted(async () => {
  await loadBranches();
});
</script>

<template>
  <section class="h-full min-h-0 bg-bt-grey-50 p-bt-spacing-24 flex flex-col">
    <div class="mb-bt-spacing-24 shrink-0">
      <h1 class="text-2xl font-bt-bold text-bt-primary-700">
        {{ $t("branches.title") }}
      </h1>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("branches.subtitle") }}
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
            :placeholder="$t('branches.searchPlaceholder')"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            @keyup.enter="onSearch"
          />

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition"
            @click="onSearch"
          >
            {{ $t("branches.actions.search") }}
          </button>

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
            @click="loadBranches"
          >
            {{ $t("branches.actions.refresh") }}
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
            {{ $t("branches.actions.newBranch") }}
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

        <table v-else class="w-full border-collapse min-w-[1100px]">
          <thead class="sticky top-0 z-10">
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("branches.table.code") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("branches.table.name") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("branches.table.address") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("branches.table.phone") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("branches.table.warehouses") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("branches.table.status") }}
              </th>
              <th
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20"
              >
                {{ $t("branches.table.options") }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="branch in branches"
              :key="branch.branchId"
              class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
            >
              <td
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 font-bt-semibold"
              >
                {{ branch.code }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ branch.name }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ branch.address }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ branch.phone }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ branch.warehouses.length }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <span
                  :class="[
                    'inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold',
                    branch.isActive
                      ? 'bg-bt-success-100 text-bt-success-700'
                      : 'bg-bt-error-100 text-bt-error-700',
                  ]"
                >
                  {{
                    branch.isActive
                      ? $t("branches.status.active")
                      : $t("branches.status.inactive")
                  }}
                </span>
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <BranchActionMenu
                  :items="[
                    {
                      label: t('branches.actions.viewDetails'),
                      action: () => openDetailsDrawer(branch),
                    },
                    {
                      label: t('branches.actions.edit'),
                      action: () => openEditModal(branch),
                    },
                    {
                      label: branch.isActive
                        ? t('branches.actions.deactivate')
                        : t('branches.actions.reactivate'),
                      action: () => toggleBranchStatus(branch),
                      danger: branch.isActive,
                    },
                    {
                      label: t('branches.actions.delete'),
                      action: () => deleteBranch(branch),
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
                </BranchActionMenu>
              </td>
            </tr>

            <tr v-if="!branches.length && !loading">
              <td
                colspan="7"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("branches.empty") }}
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
            class="inline-flex items-center gap-bt-spacing-8 px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 disabled:bg-bt-disabled disabled:text-bt-grey-500"
            @click="goPrevious"
          >
            <ChevronLeft :size="16" />
            <span>{{ $t("pagination.previous") }}</span>
          </button>

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

          <button
            type="button"
            :disabled="!canGoNext"
            class="inline-flex items-center gap-bt-spacing-8 px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 disabled:bg-bt-disabled disabled:text-bt-grey-500"
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
