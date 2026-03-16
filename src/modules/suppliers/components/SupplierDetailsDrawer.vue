<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useModalStore } from "@/core/stores/modalStore";
import { useToastStore } from "@/core/stores/toastStore";

import { SuppliersService } from "@/core/services/suppliersService";
import { SupplierContactsService } from "@/core/services/supplierContactsService";
import { SupplierAttachmentsService } from "@/core/services/supplierAttachmentsService";
import { AttachmentsService } from "@/core/services/attachmentsService";

import SupplierContactModal from "@/modules/suppliers/components/SupplierContactModal.vue";

import type { Supplier, SupplierContact } from "@/core/interfaces/suppliers";
import type { PurchaseOrder } from "@/core/interfaces/purchasesOrders";

const props = defineProps<{
  supplierId: string;
}>();

const { t } = useI18n();

const drawerStore = useDrawerStore();
const modalStore = useModalStore();
const toastStore = useToastStore();

const activeTab = ref<
  "details" | "credit" | "contacts" | "attachments" | "purchases"
>("details");

const loadingSupplier = ref(false);
const loadingHistory = ref(false);
const savingCredit = ref(false);
const uploadingFile = ref(false);

const supplier = ref<Supplier | null>(null);
const purchaseHistory = ref<PurchaseOrder[]>([]);

const creditLimit = ref<number | null>(null);
const creditDays = ref<number | null>(null);

const historyFrom = ref("");
const historyTo = ref("");
const historyStatus = ref("");

const attachmentDocumentType = ref("");
const attachmentFile = ref<File | null>(null);
const dragOver = ref(false);

const viewerOpen = ref(false);
const viewerLoading = ref(false);
const viewerError = ref("");
const viewerObjectUrl = ref("");
const viewerFileName = ref("");
const viewerMimeType = ref("");

const displayName = computed(() => {
  if (!supplier.value) return "";
  return supplier.value.tradeName || supplier.value.legalName;
});

const isViewerPdf = computed(() => viewerMimeType.value.includes("pdf"));
const isViewerImage = computed(() => viewerMimeType.value.startsWith("image/"));
const isViewerText = computed(() => viewerMimeType.value.startsWith("text/"));

function emitSupplierUpdated(action: string) {
  window.dispatchEvent(
    new CustomEvent("supplier-updated", {
      detail: {
        supplierId: props.supplierId,
        action,
      },
    }),
  );
}

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

async function loadSupplier() {
  loadingSupplier.value = true;

  try {
    const response = await SuppliersService.readById(props.supplierId);
    supplier.value = response;
    creditLimit.value = response.creditLimit;
    creditDays.value = response.creditDays;
  } catch {
    supplier.value = null;

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("suppliers.messages.loadError"),
    });
  } finally {
    loadingSupplier.value = false;
  }
}

async function loadPurchaseHistory() {
  loadingHistory.value = true;

  try {
    purchaseHistory.value = await SuppliersService.purchaseHistory(
      props.supplierId,
      {
        from: historyFrom.value || undefined,
        to: historyTo.value || undefined,
        status: historyStatus.value || undefined,
        skip: 0,
        take: 100,
      },
    );
  } catch {
    purchaseHistory.value = [];

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("suppliers.purchases.messages.loadError"),
    });
  } finally {
    loadingHistory.value = false;
  }
}

async function refreshDrawer(options?: { includeHistory?: boolean }) {
  await loadSupplier();

  if (options?.includeHistory || activeTab.value === "purchases") {
    await loadPurchaseHistory();
  }
}

async function saveCredit() {
  if (creditLimit.value === null || creditDays.value === null) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("suppliers.credit.validation.required"),
    });
    return;
  }

  savingCredit.value = true;

  try {
    await SuppliersService.updateCredit(props.supplierId, {
      creditLimit: Number(creditLimit.value),
      creditDays: Number(creditDays.value),
    });

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("suppliers.credit.messages.updateSuccess"),
    });

    emitSupplierUpdated("credit-updated");
    await refreshDrawer();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("suppliers.credit.messages.updateError"),
    });
  } finally {
    savingCredit.value = false;
  }
}

function openCreateContactModal() {
  modalStore.open({
    component: SupplierContactModal,
    props: {
      supplierId: props.supplierId,
      contact: null,
    },
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("suppliers.contacts.messages.createSuccess"),
      });

      emitSupplierUpdated("contact-created");
      await refreshDrawer();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("suppliers.contacts.messages.createError"),
      });
    },
  });
}

function openEditContactModal(contact: SupplierContact) {
  modalStore.open({
    component: SupplierContactModal,
    props: {
      supplierId: props.supplierId,
      contact,
    },
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("suppliers.contacts.messages.updateSuccess"),
      });

      emitSupplierUpdated("contact-updated");
      await refreshDrawer();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("suppliers.contacts.messages.updateError"),
      });
    },
  });
}

async function deleteContact(contactId: string) {
  try {
    await SupplierContactsService.delete(props.supplierId, contactId);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("suppliers.contacts.messages.deleteSuccess"),
    });

    emitSupplierUpdated("contact-deleted");
    await refreshDrawer();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("suppliers.contacts.messages.deleteError"),
    });
  }
}

async function setPrimaryContact(contactId: string) {
  try {
    await SupplierContactsService.setPrimary(props.supplierId, contactId);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("suppliers.contacts.messages.setPrimarySuccess"),
    });

    emitSupplierUpdated("contact-primary-updated");
    await refreshDrawer();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("suppliers.contacts.messages.setPrimaryError"),
    });
  }
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  attachmentFile.value = input.files?.[0] ?? null;
}

function onDrop(event: DragEvent) {
  dragOver.value = false;
  const file = event.dataTransfer?.files?.[0] ?? null;
  attachmentFile.value = file;
}

async function uploadAttachment() {
  if (!attachmentDocumentType.value.trim() || !attachmentFile.value) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("suppliers.attachments.validation.required"),
    });
    return;
  }

  uploadingFile.value = true;

  try {
    await SupplierAttachmentsService.add(
      props.supplierId,
      attachmentFile.value,
      attachmentDocumentType.value.trim(),
    );

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("suppliers.attachments.messages.uploadSuccess"),
    });

    attachmentDocumentType.value = "";
    attachmentFile.value = null;

    emitSupplierUpdated("attachment-uploaded");
    await refreshDrawer();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("suppliers.attachments.messages.uploadError"),
    });
  } finally {
    uploadingFile.value = false;
  }
}

async function removeAttachment(attachmentId: string) {
  try {
    await SupplierAttachmentsService.remove(props.supplierId, attachmentId);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("suppliers.attachments.messages.deleteSuccess"),
    });

    emitSupplierUpdated("attachment-deleted");
    await refreshDrawer();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("suppliers.attachments.messages.deleteError"),
    });
  }
}

async function openAttachment(attachment: any) {
  viewerLoading.value = true;
  viewerError.value = "";
  viewerFileName.value = attachment?.fileName ?? t("common.file");
  viewerMimeType.value = guessMimeType(viewerFileName.value);
  viewerOpen.value = true;

  try {
    const result = await AttachmentsService.getDownloadUrl(
      "suppliers",
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
      viewerMimeType.value = blob.type || guessMimeType(result.fileName);
    }

    viewerFileName.value = result.fileName || viewerFileName.value;
  } catch {
    viewerError.value = t("suppliers.attachments.messages.openError");
  } finally {
    viewerLoading.value = false;
  }
}

async function exportPdf() {
  try {
    const blob = await SuppliersService.purchaseHistoryPdf(props.supplierId, {
      from: historyFrom.value || undefined,
      to: historyTo.value || undefined,
      status: historyStatus.value || undefined,
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `supplier-purchase-history-${props.supplierId}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("suppliers.purchases.messages.exportPdfError"),
    });
  }
}

async function exportExcel() {
  try {
    const blob = await SuppliersService.purchaseHistoryExcel(props.supplierId, {
      from: historyFrom.value || undefined,
      to: historyTo.value || undefined,
      status: historyStatus.value || undefined,
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `supplier-purchase-history-${props.supplierId}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("suppliers.purchases.messages.exportExcelError"),
    });
  }
}

function closeDrawer() {
  closeViewer();
  drawerStore.closeDrawer();
}

onMounted(async () => {
  await refreshDrawer({ includeHistory: true });
});

watch(
  () => props.supplierId,
  async () => {
    closeViewer();
    await refreshDrawer({ includeHistory: true });
  },
);

watch(activeTab, async (tab) => {
  if (tab === "purchases") {
    await loadPurchaseHistory();
  }
});
</script>

<template>
  <div class="h-full bg-bt-white p-bt-spacing-24 overflow-y-auto">
    <div class="flex items-start justify-between mb-bt-spacing-24">
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t("suppliers.drawer.title") }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{ $t("suppliers.drawer.description", { name: displayName }) }}
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
        v-for="tab in [
          'details',
          'credit',
          'contacts',
          'attachments',
          'purchases',
        ]"
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
        {{ $t(`suppliers.drawer.tabs.${tab}`) }}
      </button>
    </div>

    <div v-if="loadingSupplier" class="text-bt-grey-500">
      {{ $t("common.loading") }}
    </div>

    <template v-else-if="supplier">
      <div
        v-if="activeTab === 'details'"
        class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16"
      >
        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("suppliers.fields.identificationType") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ supplier.identificationType }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("suppliers.fields.identification") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ supplier.identification }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("suppliers.fields.legalName") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ supplier.legalName }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("suppliers.fields.tradeName") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ supplier.tradeName }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("suppliers.fields.email") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ supplier.email }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("suppliers.fields.phone") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ supplier.phone }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("suppliers.fields.paymentTerms") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ supplier.paymentTerms }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("suppliers.fields.mainCurrency") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ supplier.mainCurrency }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("suppliers.fields.pendingPayables") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ supplier.pendingPayables }}
          </div>
        </div>
      </div>

      <div
        v-else-if="activeTab === 'credit'"
        class="max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16"
      >
        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("suppliers.credit.fields.creditLimit") }}
          </label>
          <input
            v-model.number="creditLimit"
            type="number"
            min="0"
            step="0.01"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div>
          <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
            {{ $t("suppliers.credit.fields.creditDays") }}
          </label>
          <input
            v-model.number="creditDays"
            type="number"
            min="0"
            step="1"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          />
        </div>

        <div class="md:col-span-2 flex justify-end">
          <button
            type="button"
            :disabled="savingCredit"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
            @click="saveCredit"
          >
            {{
              savingCredit
                ? $t("common.loading")
                : $t("suppliers.credit.actions.save")
            }}
          </button>
        </div>
      </div>

      <div v-else-if="activeTab === 'contacts'">
        <div class="mb-bt-spacing-16 flex justify-end">
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600"
            @click="openCreateContactModal"
          >
            {{ $t("suppliers.contacts.actions.newContact") }}
          </button>
        </div>

        <div class="grid grid-cols-1 gap-bt-spacing-16">
          <div
            v-for="contact in supplier.contacts"
            :key="contact.contactId"
            class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
          >
            <div
              class="flex flex-col md:flex-row md:items-start md:justify-between gap-bt-spacing-12"
            >
              <div>
                <div class="flex items-center gap-bt-spacing-8">
                  <h3 class="font-bt-semibold text-bt-primary-700">
                    {{ contact.name }}
                  </h3>

                  <span
                    v-if="contact.isPrimary"
                    class="inline-flex px-bt-spacing-8 py-bt-spacing-4 rounded-full text-xs bg-bt-success-100 text-bt-success-700"
                  >
                    {{ $t("suppliers.contacts.primary") }}
                  </span>
                </div>

                <p class="text-sm text-bt-grey-600 mt-bt-spacing-4">
                  {{ contact.jobTitle }}
                </p>
                <p class="text-sm text-bt-grey-600">{{ contact.email }}</p>
                <p class="text-sm text-bt-grey-600">{{ contact.phone }}</p>
              </div>

              <div class="flex flex-wrap gap-bt-spacing-8">
                <button
                  type="button"
                  class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
                  @click="openEditContactModal(contact)"
                >
                  {{ $t("suppliers.actions.edit") }}
                </button>

                <button
                  v-if="!contact.isPrimary"
                  type="button"
                  class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-info-100 text-bt-info-700 hover:bg-bt-info-300"
                  @click="setPrimaryContact(contact.contactId)"
                >
                  {{ $t("suppliers.contacts.actions.setPrimary") }}
                </button>

                <button
                  type="button"
                  class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-error-100 text-bt-error-700 hover:bg-bt-error-300"
                  @click="deleteContact(contact.contactId)"
                >
                  {{ $t("suppliers.actions.delete") }}
                </button>
              </div>
            </div>
          </div>

          <div
            v-if="!supplier.contacts.length"
            class="text-center text-bt-grey-500 py-bt-spacing-24"
          >
            {{ $t("suppliers.contacts.empty") }}
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'attachments'">
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
                  {{ $t("suppliers.attachments.dropzone.title") }}
                </p>
                <p class="text-sm text-bt-grey-600 mt-bt-spacing-8">
                  {{ $t("suppliers.attachments.dropzone.subtitle") }}
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

            <div class="mt-bt-spacing-16">
              <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
                {{ $t("suppliers.attachments.fields.documentType") }}
              </label>
              <input
                v-model="attachmentDocumentType"
                type="text"
                class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
              />
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
                    : $t("suppliers.attachments.actions.upload")
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
                    {{ $t("suppliers.attachments.table.fileName") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("suppliers.attachments.table.documentType") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("suppliers.attachments.table.uploadedAt") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("suppliers.attachments.table.options") }}
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="attachment in supplier.attachments"
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
                    {{ attachment.documentType }}
                  </td>
                  <td
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700"
                  >
                    {{ formatDateTime((attachment as any).uploadedAt) }}
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
                        {{ $t("suppliers.actions.delete") }}
                      </button>
                    </div>
                  </td>
                </tr>

                <tr v-if="!supplier.attachments.length">
                  <td
                    colspan="4"
                    class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
                  >
                    {{ $t("suppliers.attachments.empty") }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-else>
        <div
          class="grid grid-cols-1 md:grid-cols-3 gap-bt-spacing-16 mb-bt-spacing-16"
        >
          <div>
            <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
              {{ $t("suppliers.purchases.fields.from") }}
            </label>
            <input
              v-model="historyFrom"
              type="datetime-local"
              class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            />
          </div>

          <div>
            <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
              {{ $t("suppliers.purchases.fields.to") }}
            </label>
            <input
              v-model="historyTo"
              type="datetime-local"
              class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            />
          </div>

          <div>
            <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
              {{ $t("suppliers.purchases.fields.status") }}
            </label>
            <input
              v-model="historyStatus"
              type="text"
              class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            />
          </div>
        </div>

        <div class="mb-bt-spacing-16 flex flex-wrap gap-bt-spacing-12">
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600"
            @click="loadPurchaseHistory"
          >
            {{ $t("suppliers.purchases.actions.loadHistory") }}
          </button>

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-warning-500 text-bt-white hover:bg-bt-warning-700"
            @click="exportPdf"
          >
            {{ $t("suppliers.purchases.actions.exportPdf") }}
          </button>

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-success-500 text-bt-white hover:bg-bt-success-700"
            @click="exportExcel"
          >
            {{ $t("suppliers.purchases.actions.exportExcel") }}
          </button>
        </div>

        <div v-if="loadingHistory" class="text-bt-grey-500">
          {{ $t("common.loading") }}
        </div>

        <div v-else class="rounded-m border border-bt-grey-200 overflow-hidden">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-bt-primary-50 text-left">
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("suppliers.purchases.table.reference") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("suppliers.purchases.table.status") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("suppliers.purchases.table.date") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("suppliers.purchases.table.total") }}
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="item in purchaseHistory"
                :key="(item as any).purchaseOrderId ?? (item as any).id"
                class="border-t border-bt-grey-200"
              >
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{
                    (item as any).number ?? (item as any).purchaseOrderId ?? "-"
                  }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ (item as any).status ?? "-" }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{
                    formatDateTime(
                      (item as any).createdAt ?? (item as any).date,
                    )
                  }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ (item as any).total ?? "-" }}
                </td>
              </tr>

              <tr v-if="!purchaseHistory.length">
                <td
                  colspan="4"
                  class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
                >
                  {{ $t("suppliers.purchases.empty") }}
                </td>
              </tr>
            </tbody>
          </table>
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
              {{ $t("suppliers.attachments.messages.previewNotAvailable") }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
