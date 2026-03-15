<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-vue-next";

import { BranchesService } from "@/core/services/branchesService";
import { EmployeesService } from "@/core/services/employeesService";
import { InventoryTransfersService } from "@/core/services/inventoryTransfersService";

import { useModalStore } from "@/core/stores/modalStore";
import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";
import { useAuthStore } from "@/core/stores/authStore";

import InventoryTransferCreateModal from "@/modules/inventory/components/InventoryTransferCreateModal.vue";
import InventoryMovementModal from "@/modules/inventory/components/InventoryMovementModal.vue";
import InventoryTransferDetailsDrawer from "@/modules/inventory/components/InventoryTransferDetailsDrawer.vue";
import InventoryActionMenu from "@/modules/inventory/components/InventoryActionMenu.vue";

import type { Branch, BranchInventoryItem } from "@/core/interfaces/branches";
import type { InventoryTransfer } from "@/core/interfaces/inventoryTransfers";
import type { Employee } from "@/core/interfaces/employees";

interface InventoryTransferSuccessPayload {
  transferId: string;
  status: string;
  notes: string;
  createdAt: string;
  lines: Array<unknown>;
}

interface BranchInventorySection {
  branch: Branch;
  items: BranchInventoryItem[];
}

const { t } = useI18n();

const modalStore = useModalStore();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();
const authStore = useAuthStore();

const activeTab = ref<"stock" | "transfers" | "alerts">("stock");

const branches = ref<Branch[]>([]);
const branchInventories = ref<BranchInventorySection[]>([]);
const transfers = ref<InventoryTransfer[]>([]);
const assignedEmployee = ref<Employee | null>(null);

const loadingBranches = ref(false);
const loadingEmployee = ref(false);
const loadingInventory = ref(false);
const loadingTransfers = ref(false);

const inventorySearch = ref("");
const transferSearch = ref("");

const inventoryPage = ref(1);
const transferPage = ref(1);

const pageSize = ref(10);
const lowStockThreshold = ref(5);

const MAX_PAGE = 100;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const isSuperAdminOrAdmin = computed(() => {
  return authStore.roles.some((role) =>
    ["superadmin", "admin"].includes(String(role).toLowerCase()),
  );
});

const assignedBranchId = computed(() => {
  return String((assignedEmployee.value as any)?.branchId ?? "").trim();
});

const assignedWarehouseId = computed(() => {
  return String((assignedEmployee.value as any)?.warehouseId ?? "").trim();
});

const visibleBranches = computed(() => {
  if (isSuperAdminOrAdmin.value) {
    return branches.value;
  }

  if (!assignedBranchId.value) {
    return [];
  }

  return branches.value.filter(
    (branch) => branch.branchId === assignedBranchId.value,
  );
});

async function fetchTransfers(): Promise<InventoryTransfer[]> {
  return await InventoryTransfersService.getInventoryTransfers({
    page: transferPage.value,
    pageSize: pageSize.value,
    search: transferSearch.value.trim() || undefined,
  });
}

async function loadBranches() {
  loadingBranches.value = true;

  try {
    const response = await BranchesService.browse({
      page: 1,
      pageSize: 100,
    });

    branches.value = response ?? [];
  } catch {
    branches.value = [];
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("inventory.messages.loadBranchesError"),
    });
  } finally {
    loadingBranches.value = false;
  }
}

async function loadAssignedEmployee() {
  assignedEmployee.value = null;

  if (isSuperAdminOrAdmin.value) {
    return;
  }

  if (!authStore.userId) {
    return;
  }

  loadingEmployee.value = true;

  try {
    const employees = await EmployeesService.browse({
      page: 1,
      pageSize: 100,
      userId: authStore.userId,
    } as any);

    assignedEmployee.value = (employees ?? [])[0] ?? null;
  } catch {
    assignedEmployee.value = null;
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("inventory.messages.loadEmployeeError"),
    });
  } finally {
    loadingEmployee.value = false;
  }
}

async function loadInventory() {
  loadingInventory.value = true;

  try {
    const sections = await Promise.all(
      visibleBranches.value.map(async (branch) => {
        const items = await BranchesService.browseInventoryByBranchId(
          branch.branchId,
        );

        let filteredItems = items ?? [];

        // Si luego tenés endpoint por warehouse, aquí es donde se reemplaza
        // por una llamada real a inventario por almacén.
        if (!isSuperAdminOrAdmin.value && assignedWarehouseId.value) {
          filteredItems = filteredItems.filter(() => true);
        }

        return {
          branch,
          items: filteredItems,
        };
      }),
    );

    branchInventories.value = sections;
  } catch {
    branchInventories.value = [];
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("inventory.messages.loadInventoryError"),
    });
  } finally {
    loadingInventory.value = false;
  }
}

async function loadTransfers() {
  loadingTransfers.value = true;

  try {
    transfers.value = await fetchTransfers();
  } catch {
    transfers.value = [];
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("inventory.messages.loadTransfersError"),
    });
  } finally {
    loadingTransfers.value = false;
  }
}

async function reloadInventoryEventually(options?: {
  attempts?: number;
  delayMs?: number;
}) {
  const attempts = options?.attempts ?? 10;
  const delayMs = options?.delayMs ?? 500;

  try {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      await loadInventory();

      if (attempt < attempts - 1) {
        await sleep(delayMs);
      }
    }
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("inventory.messages.loadInventoryError"),
    });
  }
}

async function reloadTransfersUntil(
  predicate: (fetchedTransfers: InventoryTransfer[]) => boolean,
  options?: {
    attempts?: number;
    delayMs?: number;
  },
) {
  const attempts = options?.attempts ?? 10;
  const delayMs = options?.delayMs ?? 500;

  loadingTransfers.value = true;

  try {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const fetchedTransfers = await fetchTransfers();

      if (predicate(fetchedTransfers)) {
        transfers.value = [...fetchedTransfers];
        return;
      }

      if (attempt < attempts - 1) {
        await sleep(delayMs);
      }
    }

    transfers.value = await fetchTransfers();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("inventory.messages.loadTransfersError"),
    });
  } finally {
    loadingTransfers.value = false;
  }
}

function patchTransferInList(payload: InventoryTransferSuccessPayload) {
  const existingIndex = transfers.value.findIndex(
    (transfer) => transfer.transferId === payload.transferId,
  );

  if (existingIndex >= 0) {
    transfers.value = transfers.value.map((transfer) =>
      transfer.transferId === payload.transferId
        ? {
            ...transfer,
            transferId: payload.transferId,
            status: payload.status,
            notes: payload.notes,
            createdAt: payload.createdAt,
            lines: payload.lines as any[],
          }
        : transfer,
    );
    return;
  }

  transfers.value = [
    {
      id: `transfer:${payload.transferId}`,
      transferId: payload.transferId,
      status: payload.status,
      notes: payload.notes,
      createdAt: payload.createdAt,
      lines: payload.lines as any[],
    } as InventoryTransfer,
    ...transfers.value,
  ];
}

function removeTransferFromList(transferId: string) {
  transfers.value = transfers.value.filter(
    (transfer) => transfer.transferId !== transferId,
  );
}

const filteredBranchInventories = computed(() => {
  const term = inventorySearch.value.trim().toLowerCase();

  if (!term) {
    return branchInventories.value;
  }

  return branchInventories.value
    .map((section) => ({
      branch: section.branch,
      items: section.items.filter((item) => {
        return (
          String(item.productId ?? "")
            .toLowerCase()
            .includes(term) ||
          String(item.productName ?? "")
            .toLowerCase()
            .includes(term)
        );
      }),
    }))
    .filter((section) => section.items.length > 0);
});

const flattenedInventory = computed(() => {
  return filteredBranchInventories.value.flatMap((section) =>
    section.items.map((item) => ({
      branch: section.branch,
      item,
    })),
  );
});

const paginatedInventory = computed(() => {
  const start = (inventoryPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return flattenedInventory.value.slice(start, end);
});

const inventoryPageNumbers = computed(() => {
  const current = inventoryPage.value;
  const start = Math.max(1, current - 2);
  const end = Math.min(MAX_PAGE, current + 2);

  const pages: number[] = [];
  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }

  return pages;
});

const transferPageNumbers = computed(() => {
  const current = transferPage.value;
  const start = Math.max(1, current - 2);
  const end = Math.min(MAX_PAGE, current + 2);

  const pages: number[] = [];
  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }

  return pages;
});

const lowStockItems = computed(() => {
  return branchInventories.value.flatMap((section) =>
    section.items
      .filter((item) => item.stock <= lowStockThreshold.value)
      .map((item) => ({
        branch: section.branch,
        item,
      })),
  );
});

function openTransferModal() {
  modalStore.open({
    component: InventoryTransferCreateModal,
    onSuccess: async (payload?: InventoryTransferSuccessPayload) => {
      if (payload?.transferId) {
        patchTransferInList(payload);
      }

      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("inventory.messages.reviewRequested"),
      });

      await Promise.all([
        payload?.transferId
          ? reloadTransfersUntil((fetchedTransfers) =>
              fetchedTransfers.some(
                (transfer) => transfer.transferId === payload.transferId,
              ),
            )
          : loadTransfers(),
        reloadInventoryEventually(),
      ]);
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("inventory.messages.transferCreateError"),
      });
    },
  });
}

function openMovementModal(
  mode: "purchase-in" | "service-out" | "physical-adjustment",
) {
  modalStore.open({
    component: InventoryMovementModal,
    props: {
      mode,
    },
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message:
          mode === "purchase-in"
            ? t("inventory.messages.purchaseInSuccess")
            : mode === "service-out"
              ? t("inventory.messages.serviceOutSuccess")
              : t("inventory.messages.adjustmentSuccess"),
      });

      await reloadInventoryEventually();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message:
          error?.message ??
          (mode === "purchase-in"
            ? t("inventory.messages.purchaseInError")
            : mode === "service-out"
              ? t("inventory.messages.serviceOutError")
              : t("inventory.messages.adjustmentError")),
      });
    },
  });
}

function openTransferDrawer(transfer: InventoryTransfer) {
  drawerStore.openDrawer({
    component: InventoryTransferDetailsDrawer,
    props: {
      transferId: transfer.transferId,
    },
    title: t("inventory.drawer.title"),
    description: t("inventory.drawer.description", {
      transferId: transfer.transferId,
    }),
    direction: "right",
    size: "xl",
  });
}

async function deleteTransfer(transfer: InventoryTransfer) {
  try {
    await InventoryTransfersService.deleteInventoryTransfer(
      transfer.transferId,
    );

    removeTransferFromList(transfer.transferId);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("inventory.messages.transferDeleted"),
    });

    await reloadTransfersUntil(
      (fetchedTransfers) =>
        !fetchedTransfers.some(
          (item) => item.transferId === transfer.transferId,
        ),
    );
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("inventory.messages.transferDeleteError"),
    });
  }
}

function goInventoryPage(targetPage: number) {
  if (targetPage < 1 || targetPage > MAX_PAGE) {
    return;
  }

  inventoryPage.value = targetPage;
}

async function goTransferPage(targetPage: number) {
  if (targetPage < 1 || targetPage > MAX_PAGE) {
    return;
  }

  transferPage.value = targetPage;
  await loadTransfers();
}

watch(pageSize, async () => {
  inventoryPage.value = 1;
  transferPage.value = 1;
  await loadTransfers();
});

watch(transferSearch, async () => {
  transferPage.value = 1;
  await loadTransfers();
});

watch(
  filteredBranchInventories,
  () => {
    inventoryPage.value = 1;
  },
  { deep: true },
);

onMounted(async () => {
  await loadBranches();
  await loadAssignedEmployee();
  await Promise.all([loadInventory(), loadTransfers()]);
});
</script>

<template>
  <section class="h-full min-h-0 bg-bt-grey-50 p-bt-spacing-24 flex flex-col">
    <div class="mb-bt-spacing-24 shrink-0">
      <h1 class="text-2xl font-bt-bold text-bt-primary-700">
        {{ $t("inventory.title") }}
      </h1>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("inventory.subtitle") }}
      </p>
    </div>

    <div
      class="bg-bt-white rounded-l shadow-bt-elevation-200 border border-bt-grey-200 p-bt-spacing-24 flex-1 min-h-0 flex flex-col"
    >
      <div class="flex flex-wrap gap-bt-spacing-8 mb-bt-spacing-24 shrink-0">
        <button
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m transition"
          :class="
            activeTab === 'stock'
              ? 'bg-bt-primary-500 text-bt-white'
              : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'
          "
          @click="activeTab = 'stock'"
        >
          {{ $t("inventory.tabs.stock") }}
        </button>

        <button
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m transition"
          :class="
            activeTab === 'transfers'
              ? 'bg-bt-primary-500 text-bt-white'
              : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'
          "
          @click="activeTab = 'transfers'"
        >
          {{ $t("inventory.tabs.transfers") }}
        </button>

        <button
          type="button"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m transition"
          :class="
            activeTab === 'alerts'
              ? 'bg-bt-primary-500 text-bt-white'
              : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'
          "
          @click="activeTab = 'alerts'"
        >
          {{ $t("inventory.tabs.alerts") }}
        </button>
      </div>

      <template v-if="activeTab === 'stock'">
        <div
          class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 mb-bt-spacing-24 shrink-0"
        >
          <div
            class="flex flex-col sm:flex-row gap-bt-spacing-12 w-full lg:max-w-2xl"
          >
            <input
              v-model="inventorySearch"
              type="text"
              :placeholder="$t('inventory.stock.searchPlaceholder')"
              class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            />

            <button
              type="button"
              class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
              @click="loadInventory"
            >
              {{ $t("inventory.actions.refresh") }}
            </button>
          </div>

          <div class="flex flex-wrap gap-bt-spacing-12">
            <button
              type="button"
              class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-success-500 text-bt-white hover:bg-bt-success-700"
              @click="openMovementModal('purchase-in')"
            >
              {{ $t("inventory.actions.purchaseIn") }}
            </button>

            <button
              type="button"
              class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-warning-500 text-bt-white hover:bg-bt-warning-700"
              @click="openMovementModal('service-out')"
            >
              {{ $t("inventory.actions.serviceOut") }}
            </button>

            <button
              type="button"
              class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600"
              @click="openMovementModal('physical-adjustment')"
            >
              {{ $t("inventory.actions.physicalAdjustment") }}
            </button>
          </div>
        </div>

        <div
          v-if="loadingBranches || loadingEmployee || loadingInventory"
          class="py-bt-spacing-32 text-center text-bt-grey-500"
        >
          {{ $t("common.loading") }}
        </div>

        <div v-else class="flex-1 min-h-0 overflow-auto">
          <table class="w-full border-collapse min-w-[950px]">
            <thead class="sticky top-0 z-10">
              <tr class="bg-bt-primary-50 text-left">
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("branches.fields.code") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("branches.fields.name") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("inventory.stock.table.productId") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("inventory.stock.table.productName") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("inventory.stock.table.stock") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("inventory.stock.table.alert") }}
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="entry in paginatedInventory"
                :key="`${entry.branch.branchId}-${entry.item.productId}`"
                class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
              >
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ entry.branch.code }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ entry.branch.name }}
                </td>
                <td
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ entry.item.productId }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ entry.item.productName ?? "-" }}
                </td>
                <td
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700 font-bt-semibold"
                >
                  {{ entry.item.stock }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12">
                  <span
                    v-if="entry.item.stock <= lowStockThreshold"
                    class="inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold bg-bt-warning-100 text-bt-warning-700"
                  >
                    {{ $t("inventory.alerts.lowStock") }}
                  </span>
                  <span
                    v-else
                    class="inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold bg-bt-success-100 text-bt-success-700"
                  >
                    {{ $t("inventory.alerts.normalStock") }}
                  </span>
                </td>
              </tr>

              <tr v-if="!paginatedInventory.length">
                <td
                  colspan="6"
                  class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
                >
                  {{ $t("inventory.stock.empty") }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          class="mt-bt-spacing-24 pt-bt-spacing-16 border-t border-bt-grey-200 flex flex-col md:flex-row md:items-center md:justify-between gap-bt-spacing-16 shrink-0"
        >
          <div class="text-sm text-bt-grey-600">
            {{ $t("pagination.page") }} {{ inventoryPage }}
            {{ $t("pagination.of") }} {{ MAX_PAGE }}
          </div>

          <div class="flex items-center gap-bt-spacing-8 flex-wrap">
            <button
              type="button"
              :disabled="inventoryPage <= 1"
              class="inline-flex items-center gap-bt-spacing-8 px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 disabled:bg-bt-disabled disabled:text-bt-grey-500"
              @click="goInventoryPage(inventoryPage - 1)"
            >
              <ChevronLeft :size="16" />
              <span>{{ $t("pagination.previous") }}</span>
            </button>

            <button
              v-for="pageNumber in inventoryPageNumbers"
              :key="pageNumber"
              type="button"
              class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border transition"
              :class="
                pageNumber === inventoryPage
                  ? 'bg-bt-primary-500 border-bt-primary-500 text-bt-white'
                  : 'border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100'
              "
              @click="goInventoryPage(pageNumber)"
            >
              {{ pageNumber }}
            </button>

            <button
              type="button"
              :disabled="inventoryPage >= MAX_PAGE"
              class="inline-flex items-center gap-bt-spacing-8 px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 disabled:bg-bt-disabled disabled:text-bt-grey-500"
              @click="goInventoryPage(inventoryPage + 1)"
            >
              <span>{{ $t("pagination.next") }}</span>
              <ChevronRight :size="16" />
            </button>
          </div>
        </div>
      </template>

      <template v-else-if="activeTab === 'transfers'">
        <div
          class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 mb-bt-spacing-24 shrink-0"
        >
          <div
            class="flex flex-col sm:flex-row gap-bt-spacing-12 w-full lg:max-w-2xl"
          >
            <input
              v-model="transferSearch"
              type="text"
              :placeholder="$t('inventory.transfers.searchPlaceholder')"
              class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            />

            <button
              type="button"
              class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition"
              @click="loadTransfers"
            >
              {{ $t("inventory.actions.search") }}
            </button>

            <button
              type="button"
              class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
              @click="loadTransfers"
            >
              {{ $t("inventory.actions.refresh") }}
            </button>
          </div>

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 font-bt-semibold"
            @click="openTransferModal"
          >
            {{ $t("inventory.actions.newTransfer") }}
          </button>
        </div>

        <div class="flex-1 min-h-0 overflow-auto">
          <div
            v-if="loadingTransfers"
            class="py-bt-spacing-32 text-center text-bt-grey-500"
          >
            {{ $t("common.loading") }}
          </div>

          <table v-else class="w-full border-collapse min-w-[1000px]">
            <thead class="sticky top-0 z-10">
              <tr class="bg-bt-primary-50 text-left">
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("inventory.transfers.table.transferId") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("inventory.transfers.table.status") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("inventory.transfers.table.notes") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("inventory.transfers.table.createdAt") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("inventory.transfers.table.lines") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20"
                >
                  {{ $t("inventory.transfers.table.options") }}
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="transfer in transfers"
                :key="transfer.transferId"
                class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
              >
                <td
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 font-bt-semibold"
                >
                  {{ transfer.transferId }}
                </td>

                <td class="px-bt-spacing-16 py-bt-spacing-12">
                  <span
                    class="inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold bg-bt-info-100 text-bt-info-700"
                  >
                    {{ transfer.status }}
                  </span>
                </td>

                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ transfer.notes || "-" }}
                </td>

                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ transfer.createdAt }}
                </td>

                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ transfer.lines.length }}
                </td>

                <td class="px-bt-spacing-16 py-bt-spacing-12">
                  <InventoryActionMenu
                    :items="[
                      {
                        label: t('inventory.actions.viewDetails'),
                        action: () => openTransferDrawer(transfer),
                      },
                      {
                        label: t('inventory.actions.delete'),
                        action: () => deleteTransfer(transfer),
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
                  </InventoryActionMenu>
                </td>
              </tr>

              <tr v-if="!transfers.length">
                <td
                  colspan="6"
                  class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
                >
                  {{ $t("inventory.transfers.empty") }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          class="mt-bt-spacing-24 pt-bt-spacing-16 border-t border-bt-grey-200 flex flex-col md:flex-row md:items-center md:justify-between gap-bt-spacing-16 shrink-0"
        >
          <div class="text-sm text-bt-grey-600">
            {{ $t("pagination.page") }} {{ transferPage }}
            {{ $t("pagination.of") }} {{ MAX_PAGE }}
          </div>

          <div class="flex items-center gap-bt-spacing-8 flex-wrap">
            <button
              type="button"
              :disabled="transferPage <= 1"
              class="inline-flex items-center gap-bt-spacing-8 px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 disabled:bg-bt-disabled disabled:text-bt-grey-500"
              @click="goTransferPage(transferPage - 1)"
            >
              <ChevronLeft :size="16" />
              <span>{{ $t("pagination.previous") }}</span>
            </button>

            <button
              v-for="pageNumber in transferPageNumbers"
              :key="pageNumber"
              type="button"
              class="px-bt-spacing-12 py-bt-spacing-8 rounded-m border transition"
              :class="
                pageNumber === transferPage
                  ? 'bg-bt-primary-500 border-bt-primary-500 text-bt-white'
                  : 'border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100'
              "
              @click="goTransferPage(pageNumber)"
            >
              {{ pageNumber }}
            </button>

            <button
              type="button"
              :disabled="transferPage >= MAX_PAGE"
              class="inline-flex items-center gap-bt-spacing-8 px-bt-spacing-12 py-bt-spacing-8 rounded-m border border-bt-grey-300 text-bt-primary-700 hover:bg-bt-grey-100 disabled:bg-bt-disabled disabled:text-bt-grey-500"
              @click="goTransferPage(transferPage + 1)"
            >
              <span>{{ $t("pagination.next") }}</span>
              <ChevronRight :size="16" />
            </button>
          </div>
        </div>
      </template>

      <template v-else>
        <div
          class="mb-bt-spacing-24 flex flex-col md:flex-row md:items-center gap-bt-spacing-16"
        >
          <div>
            <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
              {{ $t("inventory.alerts.threshold") }}
            </label>
            <input
              v-model.number="lowStockThreshold"
              type="number"
              min="0"
              step="1"
              class="w-40 px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            />
          </div>

          <div class="text-sm text-bt-grey-600">
            {{ $t("inventory.alerts.note") }}
          </div>
        </div>

        <div class="rounded-m border border-bt-grey-200 overflow-hidden">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-bt-primary-50 text-left">
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("branches.fields.code") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("branches.fields.name") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("inventory.alerts.table.productId") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("inventory.alerts.table.productName") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("inventory.alerts.table.stock") }}
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="entry in lowStockItems"
                :key="`${entry.branch.branchId}-${entry.item.productId}`"
                class="border-t border-bt-grey-200 bg-bt-warning-100/40"
              >
                <td
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ entry.branch.code }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ entry.branch.name }}
                </td>
                <td
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ entry.item.productId }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ entry.item.productName ?? "-" }}
                </td>
                <td
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-warning-700 font-bt-bold"
                >
                  {{ entry.item.stock }}
                </td>
              </tr>

              <tr v-if="!lowStockItems.length">
                <td
                  colspan="5"
                  class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
                >
                  {{ $t("inventory.alerts.empty") }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </section>
</template>
