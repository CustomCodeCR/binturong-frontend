<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useModalStore } from "@/core/stores/modalStore";
import { useToastStore } from "@/core/stores/toastStore";

import { ContractsService } from "@/core/services/contractsService";
import { AttachmentsService } from "@/core/services/attachmentsService";

import ContractMilestoneModal from "@/modules/contracts/components/ContractMilestoneModal.vue";
import ContractEditModal from "@/modules/contracts/components/ContractEditModal.vue";

import type {
  Contract,
  ContractMilestone,
  ContractAttachment,
} from "@/core/interfaces/contracts";

const props = defineProps<{
  contractId: string;
}>();

const { t } = useI18n();

const drawerStore = useDrawerStore();
const modalStore = useModalStore();
const toastStore = useToastStore();

const activeTab = ref<"details" | "milestones" | "attachments">("details");

const loadingContract = ref(false);
const uploadingFile = ref(false);

const contract = ref<Contract | null>(null);

const attachmentFile = ref<File | null>(null);
const dragOver = ref(false);

const viewerOpen = ref(false);
const viewerLoading = ref(false);
const viewerError = ref("");
const viewerObjectUrl = ref("");
const viewerFileName = ref("");
const viewerMimeType = ref("");

const displayName = computed(() => contract.value?.code ?? "");

const billedSummary = computed(() => {
  const milestones = contract.value?.milestones ?? [];
  const total = milestones.reduce(
    (acc, item) => acc + Number(item.amount || 0),
    0,
  );
  const billed = milestones
    .filter((item) => item.isBilled)
    .reduce((acc, item) => acc + Number(item.amount || 0), 0);

  return {
    total,
    billed,
    pending: total - billed,
  };
});

const isViewerPdf = computed(() => viewerMimeType.value.includes("pdf"));
const isViewerImage = computed(() => viewerMimeType.value.startsWith("image/"));
const isViewerText = computed(() => viewerMimeType.value.startsWith("text/"));

function formatDateTime(value?: string | null): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function formatDate(value?: string | null): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString();
}

function formatMoney(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatBool(value?: boolean | null): string {
  return value ? t("common.yes") : t("common.no");
}

function formatFileSize(value?: number | null): string {
  const size = Number(value ?? 0);

  if (Number.isNaN(size) || size <= 0) {
    return "-";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  }

  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function guessMimeType(fileName: string): string {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".bmp")) return "image/bmp";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".txt")) return "text/plain";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html";
  if (lower.endsWith(".json")) return "application/json";
  if (lower.endsWith(".csv")) return "text/csv";
  if (lower.endsWith(".xml")) return "application/xml";
  return "application/octet-stream";
}

function closeViewer() {
  viewerOpen.value = false;
  viewerLoading.value = false;
  viewerError.value = "";
  viewerFileName.value = "";
  viewerMimeType.value = "";

  if (viewerObjectUrl.value) {
    URL.revokeObjectURL(viewerObjectUrl.value);
    viewerObjectUrl.value = "";
  }
}

async function loadContract() {
  loadingContract.value = true;

  try {
    contract.value = await ContractsService.readById(props.contractId);
  } catch {
    contract.value = null;

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("contracts.messages.loadDetailError"),
    });
  } finally {
    loadingContract.value = false;
  }
}

function openEditContractModal() {
  if (!contract.value) return;

  modalStore.open({
    component: ContractEditModal,
    props: {
      contractId: contract.value.contractId,
    },
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("contracts.messages.updateSuccess"),
      });

      await loadContract();
      drawerStore.onSuccess?.();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("contracts.messages.updateError"),
      });
    },
  });
}

function openCreateMilestoneModal() {
  if (!contract.value) return;

  modalStore.open({
    component: ContractMilestoneModal,
    props: {
      contractId: contract.value.contractId,
      milestone: null,
    },
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("contracts.milestones.messages.createSuccess"),
      });

      await loadContract();
      drawerStore.onSuccess?.();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message:
          error?.message ?? t("contracts.milestones.messages.createError"),
      });
    },
  });
}

function openEditMilestoneModal(milestone: ContractMilestone) {
  if (!contract.value) return;

  modalStore.open({
    component: ContractMilestoneModal,
    props: {
      contractId: contract.value.contractId,
      milestone,
    },
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("contracts.milestones.messages.updateSuccess"),
      });

      await loadContract();
      drawerStore.onSuccess?.();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message:
          error?.message ?? t("contracts.milestones.messages.updateError"),
      });
    },
  });
}

async function deleteMilestone(milestoneId: string) {
  if (!contract.value) return;

  try {
    await ContractsService.deleteMilestone(
      contract.value.contractId,
      milestoneId,
    );

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("contracts.milestones.messages.deleteSuccess"),
    });

    await loadContract();
    drawerStore.onSuccess?.();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("contracts.milestones.messages.deleteError"),
    });
  }
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  attachmentFile.value = input.files?.[0] ?? null;
}

function onDrop(event: DragEvent) {
  dragOver.value = false;
  attachmentFile.value = event.dataTransfer?.files?.[0] ?? null;
}

async function uploadAttachment() {
  if (!contract.value) return;

  if (!attachmentFile.value) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("contracts.attachments.validation.required"),
    });
    return;
  }

  uploadingFile.value = true;

  try {
    await ContractsService.uploadAttachment(
      contract.value.contractId,
      attachmentFile.value,
    );

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("contracts.attachments.messages.uploadSuccess"),
    });

    attachmentFile.value = null;

    await loadContract();
    drawerStore.onSuccess?.();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("contracts.attachments.messages.uploadError"),
    });
  } finally {
    uploadingFile.value = false;
  }
}

async function removeAttachment(attachmentId: string) {
  if (!contract.value) return;

  try {
    await ContractsService.deleteAttachment(
      contract.value.contractId,
      attachmentId,
    );

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("contracts.attachments.messages.deleteSuccess"),
    });

    await loadContract();
    drawerStore.onSuccess?.();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("contracts.attachments.messages.deleteError"),
    });
  }
}

async function openAttachment(attachment: ContractAttachment) {
  viewerLoading.value = true;
  viewerError.value = "";
  viewerFileName.value = attachment.fileName ?? t("common.file");
  viewerMimeType.value =
    attachment.contentType || guessMimeType(attachment.fileName);
  viewerOpen.value = true;

  try {
    const result = await AttachmentsService.getDownloadUrl(
      "contracts",
      attachment.attachmentId,
    );

    const response = await fetch(result.url);
    if (!response.ok) {
      throw new Error("Failed to fetch attachment blob");
    }

    const blob = await response.blob();

    if (viewerObjectUrl.value) {
      URL.revokeObjectURL(viewerObjectUrl.value);
    }

    viewerObjectUrl.value = URL.createObjectURL(blob);

    if (
      !viewerMimeType.value ||
      viewerMimeType.value === "application/octet-stream"
    ) {
      viewerMimeType.value =
        blob.type ||
        result.contentType ||
        guessMimeType(result.fileName || attachment.fileName);
    }

    viewerFileName.value = result.fileName || viewerFileName.value;
  } catch {
    viewerError.value = t("contracts.attachments.messages.openError");
  } finally {
    viewerLoading.value = false;
  }
}

async function downloadAttachment(attachment: ContractAttachment) {
  try {
    const result = await AttachmentsService.getDownloadUrl(
      "contracts",
      attachment.attachmentId,
    );

    const link = document.createElement("a");
    link.href = result.url;
    link.download = result.fileName || attachment.fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("contracts.attachments.messages.downloadError"),
    });
  }
}

function closeDrawer() {
  closeViewer();
  drawerStore.closeDrawer();
}

onMounted(async () => {
  await loadContract();
});

watch(
  () => props.contractId,
  async () => {
    closeViewer();
    await loadContract();
  },
);
</script>

<template>
  <div class="h-full bg-bt-white p-bt-spacing-24 overflow-y-auto">
    <div class="flex items-start justify-between mb-bt-spacing-24">
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t("contracts.drawer.title") }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{ $t("contracts.drawer.description", { code: displayName }) }}
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

    <div class="flex flex-wrap gap-bt-spacing-8 mb-bt-spacing-24">
      <button
        v-for="tab in ['details', 'milestones', 'attachments']"
        :key="tab"
        type="button"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m transition"
        :class="
          activeTab === tab
            ? 'bg-bt-primary-500 text-bt-white'
            : 'bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300'
        "
        @click="activeTab = tab as any"
      >
        {{ $t(`contracts.drawer.tabs.${tab}`) }}
      </button>
    </div>

    <div v-if="loadingContract" class="text-bt-grey-500">
      {{ $t("common.loading") }}
    </div>

    <template v-else-if="contract">
      <div v-if="activeTab === 'details'" class="space-y-bt-spacing-24">
        <div class="flex justify-end">
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600"
            @click="openEditContractModal"
          >
            {{ $t("contracts.actions.edit") }}
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
          <div
            class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("contracts.fields.code") }}
            </div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ contract.code }}
            </div>
          </div>

          <div
            class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("contracts.fields.client") }}
            </div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ contract.clientName }}
            </div>
          </div>

          <div
            class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("contracts.fields.startDate") }}
            </div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ formatDate(contract.startDate) }}
            </div>
          </div>

          <div
            class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("contracts.fields.endDate") }}
            </div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ formatDate(contract.endDate) }}
            </div>
          </div>

          <div
            class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("contracts.fields.status") }}
            </div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ contract.status }}
            </div>
          </div>

          <div
            class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("contracts.fields.quoteId") }}
            </div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ contract.quoteId || "-" }}
            </div>
          </div>

          <div
            class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("contracts.fields.salesOrderId") }}
            </div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ contract.salesOrderId || "-" }}
            </div>
          </div>

          <div
            class="md:col-span-2 p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("contracts.fields.description") }}
            </div>
            <div
              class="text-bt-primary-700 font-bt-semibold whitespace-pre-wrap"
            >
              {{ contract.description || "-" }}
            </div>
          </div>

          <div
            class="md:col-span-2 p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("contracts.fields.notes") }}
            </div>
            <div
              class="text-bt-primary-700 font-bt-semibold whitespace-pre-wrap"
            >
              {{ contract.notes || "-" }}
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-bt-spacing-16">
          <div
            class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("contracts.summary.totalAmount") }}
            </div>
            <div
              class="text-xl font-bt-bold text-bt-primary-700 mt-bt-spacing-8"
            >
              {{ formatMoney(billedSummary.total) }}
            </div>
          </div>

          <div
            class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("contracts.summary.billedAmount") }}
            </div>
            <div
              class="text-xl font-bt-bold text-bt-success-700 mt-bt-spacing-8"
            >
              {{ formatMoney(billedSummary.billed) }}
            </div>
          </div>

          <div
            class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("contracts.summary.pendingAmount") }}
            </div>
            <div
              class="text-xl font-bt-bold text-bt-warning-700 mt-bt-spacing-8"
            >
              {{ formatMoney(billedSummary.pending) }}
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'milestones'">
        <div class="mb-bt-spacing-16 flex justify-end">
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600"
            @click="openCreateMilestoneModal"
          >
            {{ $t("contracts.milestones.actions.newMilestone") }}
          </button>
        </div>

        <div class="rounded-m border border-bt-grey-200 overflow-hidden">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-bt-primary-50 text-left">
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("contracts.milestones.table.description") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("contracts.milestones.table.percentage") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("contracts.milestones.table.amount") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("contracts.milestones.table.scheduledDate") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("contracts.milestones.table.isBilled") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("contracts.milestones.table.invoiceId") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("contracts.milestones.table.options") }}
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="milestone in contract.milestones"
                :key="milestone.milestoneId"
                class="border-t border-bt-grey-200"
              >
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ milestone.description }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ milestone.percentage }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ formatMoney(milestone.amount) }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ formatDate(milestone.scheduledDate) }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ milestone.isBilled ? $t("common.yes") : $t("common.no") }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ milestone.invoiceId || "-" }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12">
                  <div class="flex flex-wrap gap-bt-spacing-8">
                    <button
                      type="button"
                      class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
                      @click="openEditMilestoneModal(milestone)"
                    >
                      {{ $t("common.edit") }}
                    </button>

                    <button
                      type="button"
                      class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-error-100 text-bt-error-700 hover:bg-bt-error-300"
                      @click="deleteMilestone(milestone.milestoneId)"
                    >
                      {{ $t("common.delete") }}
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="!contract.milestones.length">
                <td
                  colspan="7"
                  class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
                >
                  {{ $t("contracts.milestones.empty") }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else>
        <div
          class="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-bt-spacing-24"
        >
          <div>
            <div
              class="rounded-l border-2 border-dashed p-bt-spacing-24 transition"
              :class="
                dragOver
                  ? 'border-bt-accent-500 bg-bt-accent-50'
                  : 'border-bt-grey-300 bg-bt-grey-50'
              "
              @dragover.prevent="dragOver = true"
              @dragleave.prevent="dragOver = false"
              @drop.prevent="onDrop"
            >
              <div class="text-center">
                <p class="text-bt-primary-700 font-bt-semibold">
                  {{ $t("contracts.attachments.dropzone.title") }}
                </p>
                <p class="text-sm text-bt-grey-600 mt-bt-spacing-8">
                  {{ $t("contracts.attachments.dropzone.subtitle") }}
                </p>

                <div class="mt-bt-spacing-16">
                  <input type="file" @change="handleFileSelect" />
                </div>

                <div
                  v-if="attachmentFile"
                  class="mt-bt-spacing-12 text-sm text-bt-primary-700"
                >
                  {{ attachmentFile.name }}
                </div>
              </div>
            </div>

            <div class="mt-bt-spacing-16 flex justify-end">
              <button
                type="button"
                :disabled="uploadingFile"
                class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
                @click="uploadAttachment"
              >
                {{
                  uploadingFile
                    ? $t("common.loading")
                    : $t("contracts.attachments.actions.upload")
                }}
              </button>
            </div>
          </div>

          <div class="rounded-m border border-bt-grey-200 overflow-hidden">
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-bt-primary-50 text-left">
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("contracts.attachments.table.fileName") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("contracts.attachments.table.uploadedAt") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("contracts.attachments.table.options") }}
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="attachment in contract.attachments"
                  :key="attachment.attachmentId"
                  class="border-t border-bt-grey-200"
                >
                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ attachment.fileName }}
                  </td>
                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ formatDateTime(attachment.uploadedAt) }}
                  </td>
                  <td class="px-bt-spacing-16 py-bt-spacing-12">
                    <div class="flex flex-wrap gap-bt-spacing-8">
                      <button
                        type="button"
                        class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-info-100 text-bt-info-700 hover:bg-bt-info-300"
                        @click="openAttachment(attachment)"
                      >
                        {{ $t("common.view") }}
                      </button>

                      <button
                        type="button"
                        class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-error-100 text-bt-error-700 hover:bg-bt-error-300"
                        @click="removeAttachment(attachment.attachmentId)"
                      >
                        {{ $t("common.delete") }}
                      </button>
                    </div>
                  </td>
                </tr>

                <tr v-if="!contract.attachments?.length">
                  <td
                    colspan="5"
                    class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
                  >
                    {{ $t("contracts.attachments.empty") }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>

  <div
    v-if="viewerOpen"
    class="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-bt-spacing-24"
  >
    <div
      class="w-full max-w-6xl h-[90vh] bg-bt-white rounded-l shadow-bt-elevation-400 flex flex-col overflow-hidden"
    >
      <div
        class="px-bt-spacing-24 py-bt-spacing-16 border-b border-bt-grey-200 flex items-center justify-between"
      >
        <div class="min-w-0">
          <h3 class="text-lg font-bt-semibold text-bt-primary-700 truncate">
            {{ viewerFileName }}
          </h3>
        </div>

        <button
          type="button"
          class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
          @click="closeViewer"
        >
          {{ $t("common.close") }}
        </button>
      </div>

      <div class="flex-1 min-h-0 bg-bt-grey-50 p-bt-spacing-16 overflow-auto">
        <div
          v-if="viewerLoading"
          class="h-full flex items-center justify-center text-bt-grey-500"
        >
          {{ $t("common.loading") }}
        </div>

        <div
          v-else-if="viewerError"
          class="h-full flex items-center justify-center text-bt-error-700"
        >
          {{ viewerError }}
        </div>

        <div v-else-if="viewerObjectUrl" class="h-full">
          <iframe
            v-if="isViewerPdf"
            :src="viewerObjectUrl"
            class="w-full h-full rounded-m border border-bt-grey-200 bg-bt-white"
          />

          <div
            v-else-if="isViewerImage"
            class="h-full flex items-center justify-center"
          >
            <img
              :src="viewerObjectUrl"
              :alt="viewerFileName"
              class="max-w-full max-h-full object-contain rounded-m border border-bt-grey-200 bg-bt-white"
            />
          </div>

          <iframe
            v-else-if="isViewerText"
            :src="viewerObjectUrl"
            class="w-full h-full rounded-m border border-bt-grey-200 bg-bt-white"
          />

          <div
            v-else
            class="h-full flex flex-col items-center justify-center text-center text-bt-grey-600 gap-bt-spacing-12"
          >
            <p>
              {{ $t("contracts.attachments.messages.previewNotAvailable") }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
