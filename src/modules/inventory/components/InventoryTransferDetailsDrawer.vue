<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";
import { useAuthStore } from "@/core/stores/authStore";

import { InventoryTransfersService } from "@/core/services/inventoryTransfersService";

import type { InventoryTransfer } from "@/core/interfaces/inventoryTransfers";

const props = defineProps<{
  transferId: string;
}>();

const { t } = useI18n();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();
const authStore = useAuthStore();

const loadingTransfer = ref(false);
const actionLoading = ref(false);

const transfer = ref<InventoryTransfer | null>(null);

const canApprove = computed(() => {
  return transfer.value?.status === "REVIEW_REQUESTED";
});

const canReject = computed(() => {
  return transfer.value?.status === "REVIEW_REQUESTED";
});

const canConfirmReceived = computed(() => {
  return transfer.value?.status === "APPROVED";
});

function formatDateTime(value?: string | null): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatUserLabel(
  username?: string | null,
  email?: string | null,
  userId?: string | null,
): string {
  if (username && email) {
    return `${username} (${email})`;
  }

  if (username) {
    return username;
  }

  if (email) {
    return email;
  }

  return userId ?? "-";
}

function formatBranchLabel(
  code?: string | null,
  name?: string | null,
  branchId?: string | null,
): string {
  if (code && name) {
    return `${code} - ${name}`;
  }

  if (name) {
    return name;
  }

  if (code) {
    return code;
  }

  return branchId ?? "-";
}

function formatWarehouseLabel(
  code?: string | null,
  name?: string | null,
  warehouseId?: string | null,
): string {
  if (code && name) {
    return `${code} - ${name}`;
  }

  if (name) {
    return name;
  }

  if (code) {
    return code;
  }

  return warehouseId ?? "-";
}

function formatProductLabel(
  sku?: string | null,
  name?: string | null,
  productId?: string | null,
): string {
  if (sku && name) {
    return `${sku} - ${name}`;
  }

  if (name) {
    return name;
  }

  if (sku) {
    return sku;
  }

  return productId ?? "-";
}

async function loadTransfer() {
  loadingTransfer.value = true;

  try {
    transfer.value = await InventoryTransfersService.getInventoryTransferById(
      props.transferId,
    );
  } finally {
    loadingTransfer.value = false;
  }
}

async function approveTransfer() {
  if (!authStore.userId || !transfer.value) {
    return;
  }

  actionLoading.value = true;

  try {
    await InventoryTransfersService.approveInventoryTransfer(
      transfer.value.transferId,
      {
        approvedByUserId: authStore.userId,
      },
    );

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("inventory.messages.transferApproved"),
    });

    await loadTransfer();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("inventory.messages.transferApproveError"),
    });
  } finally {
    actionLoading.value = false;
  }
}

async function rejectTransfer() {
  if (!authStore.userId || !transfer.value) {
    return;
  }

  actionLoading.value = true;

  try {
    await InventoryTransfersService.rejectInventoryTransfer(
      transfer.value.transferId,
      {
        rejectedByUserId: authStore.userId,
        reason: t("inventory.drawer.defaultRejectReason"),
      },
    );

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("inventory.messages.transferRejected"),
    });

    await loadTransfer();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("inventory.messages.transferRejectError"),
    });
  } finally {
    actionLoading.value = false;
  }
}

async function confirmTransferReceived() {
  if (!authStore.userId || !transfer.value) {
    return;
  }

  actionLoading.value = true;

  try {
    await InventoryTransfersService.confirmInventoryTransfer(
      transfer.value.transferId,
      {
        receivedByUserId: authStore.userId,
      },
    );

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("inventory.messages.transferConfirmed"),
    });

    await loadTransfer();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("inventory.messages.transferConfirmError"),
    });
  } finally {
    actionLoading.value = false;
  }
}

function closeDrawer() {
  drawerStore.closeDrawer();
}

onMounted(async () => {
  await loadTransfer();
});

watch(
  () => props.transferId,
  async () => {
    await loadTransfer();
  },
);
</script>

<template>
  <div class="h-full bg-bt-white p-bt-spacing-24 overflow-y-auto">
    <div class="flex items-start justify-between mb-bt-spacing-24">
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t("inventory.drawer.title") }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{
            $t("inventory.drawer.description", { transferId: props.transferId })
          }}
        </p>
      </div>

      <button
        type="button"
        class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
        @click="closeDrawer"
      >
        {{ $t("common.close") }}
      </button>
    </div>

    <div v-if="loadingTransfer" class="text-bt-grey-500">
      {{ $t("common.loading") }}
    </div>

    <div v-else-if="transfer" class="space-y-bt-spacing-16">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("inventory.transfers.table.transferId") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ transfer.transferId }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("inventory.transfers.table.status") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ transfer.status }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("inventory.drawer.fields.fromBranch") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{
              formatBranchLabel(
                transfer.fromBranchCode,
                transfer.fromBranchName,
                transfer.fromBranchId,
              )
            }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("inventory.drawer.fields.toBranch") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{
              formatBranchLabel(
                transfer.toBranchCode,
                transfer.toBranchName,
                transfer.toBranchId,
              )
            }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("inventory.drawer.fields.createdBy") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{
              formatUserLabel(
                transfer.createdByUsername,
                transfer.createdByEmail,
                transfer.createdByUserId,
              )
            }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("inventory.drawer.fields.approvedBy") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{
              transfer.approvedByUserId
                ? formatUserLabel(
                    transfer.approvedByUsername,
                    transfer.approvedByEmail,
                    transfer.approvedByUserId,
                  )
                : "-"
            }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("inventory.transfers.table.createdAt") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ formatDateTime(transfer.createdAt) }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("inventory.transfers.fields.updatedAt") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ formatDateTime(transfer.updatedAt) }}
          </div>
        </div>

        <div
          class="md:col-span-2 p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("inventory.transfers.table.notes") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ transfer.notes || "-" }}
          </div>
        </div>

        <div
          v-if="transfer.rejectionReason"
          class="md:col-span-2 p-bt-spacing-16 rounded-m border border-bt-error-200 bg-bt-error-50"
        >
          <div class="text-xs text-bt-error-700">
            {{ $t("inventory.drawer.fields.rejectionReason") }}
          </div>
          <div class="text-bt-error-700 font-bt-semibold">
            {{ transfer.rejectionReason }}
          </div>
        </div>
      </div>

      <div class="rounded-m border border-bt-grey-200 overflow-hidden">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("inventory.drawer.lines.product") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("inventory.drawer.lines.quantity") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("inventory.drawer.lines.fromWarehouse") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("inventory.drawer.lines.toWarehouse") }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="line in transfer.lines"
              :key="line.lineId"
              class="border-t border-bt-grey-200"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{
                  formatProductLabel(
                    line.productSku,
                    line.productName,
                    line.productId,
                  )
                }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ line.quantity }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{
                  formatWarehouseLabel(
                    line.fromWarehouseCode,
                    line.fromWarehouseName,
                    line.fromWarehouseId,
                  )
                }}
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{
                  formatWarehouseLabel(
                    line.toWarehouseCode,
                    line.toWarehouseName,
                    line.toWarehouseId,
                  )
                }}
              </td>
            </tr>

            <tr v-if="!transfer.lines.length">
              <td
                colspan="4"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("inventory.drawer.lines.empty") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex flex-wrap justify-end gap-bt-spacing-12">
        <button
          v-if="canApprove"
          type="button"
          :disabled="actionLoading"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-success-500 text-bt-white hover:bg-bt-success-700 disabled:bg-bt-disabled"
          @click="approveTransfer"
        >
          {{ $t("inventory.actions.approve") }}
        </button>

        <button
          v-if="canReject"
          type="button"
          :disabled="actionLoading"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-error-500 text-bt-white hover:bg-bt-error-700 disabled:bg-bt-disabled"
          @click="rejectTransfer"
        >
          {{ $t("inventory.actions.reject") }}
        </button>

        <button
          v-if="canConfirmReceived"
          type="button"
          :disabled="actionLoading"
          class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 disabled:bg-bt-disabled"
          @click="confirmTransferReceived"
        >
          {{ $t("inventory.actions.confirmReceived") }}
        </button>
      </div>
    </div>
  </div>
</template>
