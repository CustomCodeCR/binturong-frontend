<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useDrawerStore } from "@/core/stores/drawerStore";
import { useModalStore } from "@/core/stores/modalStore";
import { useToastStore } from "@/core/stores/toastStore";

import { ClientsService } from "@/core/services/clientsService";
import { AttachmentsService } from "@/core/services/attachmentsService";

import ClientContactModal from "@/modules/clients/components/ClientContactModal.vue";
import ClientAddressModal from "@/modules/clients/components/ClientAddressModal.vue";

import type {
  Client,
  ClientContact,
  ClientAddress,
  ClientAttachment,
  ClientHistoryItem,
} from "@/core/interfaces/clients";

const props = defineProps<{
  clientId: string;
}>();

const { t } = useI18n();

const drawerStore = useDrawerStore();
const modalStore = useModalStore();
const toastStore = useToastStore();

const activeTab = ref<
  "details" | "history" | "contacts" | "addresses" | "attachments"
>("details");

const loadingClient = ref(false);
const loadingHistory = ref(false);
const uploadingFile = ref(false);

const client = ref<Client | null>(null);
const history = ref<ClientHistoryItem[]>([]);

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

const displayName = computed(() => client.value?.tradeName ?? "");

const isViewerPdf = computed(() => viewerMimeType.value.includes("pdf"));
const isViewerImage = computed(() => viewerMimeType.value.startsWith("image/"));
const isViewerText = computed(() => viewerMimeType.value.startsWith("text/"));

function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatMoney(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(Number(value)))
    return "-";
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

async function loadClient() {
  loadingClient.value = true;

  try {
    client.value = await ClientsService.readById(props.clientId);
  } catch {
    client.value = null;

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("clients.messages.loadError"),
    });
  } finally {
    loadingClient.value = false;
  }
}

async function loadHistory() {
  loadingHistory.value = true;

  try {
    history.value = await ClientsService.history(props.clientId, {
      from: historyFrom.value || undefined,
      to: historyTo.value || undefined,
      status: historyStatus.value || undefined,
      skip: 0,
      take: 100,
    });
  } catch {
    history.value = [];

    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("clients.history.messages.loadError"),
    });
  } finally {
    loadingHistory.value = false;
  }
}

async function refreshDrawer(options?: { includeHistory?: boolean }) {
  await loadClient();

  if (options?.includeHistory || activeTab.value === "history") {
    await loadHistory();
  }
}

function openCreateContactModal() {
  modalStore.open({
    component: ClientContactModal,
    props: {
      clientId: props.clientId,
      contact: null,
    },
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("clients.contacts.messages.createSuccess"),
      });
      await refreshDrawer();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("clients.contacts.messages.createError"),
      });
    },
  });
}

function openEditContactModal(contact: ClientContact) {
  modalStore.open({
    component: ClientContactModal,
    props: {
      clientId: props.clientId,
      contact,
    },
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("clients.contacts.messages.updateSuccess"),
      });
      await refreshDrawer();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("clients.contacts.messages.updateError"),
      });
    },
  });
}

async function deleteContact(contactId: string) {
  try {
    await ClientsService.deleteContact(props.clientId, contactId);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("clients.contacts.messages.deleteSuccess"),
    });

    await refreshDrawer();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("clients.contacts.messages.deleteError"),
    });
  }
}

async function setPrimaryContact(contactId: string) {
  try {
    await ClientsService.setPrimaryContact(props.clientId, contactId);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("clients.contacts.messages.setPrimarySuccess"),
    });

    await refreshDrawer();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("clients.contacts.messages.setPrimaryError"),
    });
  }
}

function openCreateAddressModal() {
  modalStore.open({
    component: ClientAddressModal,
    props: {
      clientId: props.clientId,
      address: null,
    },
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("clients.addresses.messages.createSuccess"),
      });
      await refreshDrawer();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("clients.addresses.messages.createError"),
      });
    },
  });
}

function openEditAddressModal(address: ClientAddress) {
  modalStore.open({
    component: ClientAddressModal,
    props: {
      clientId: props.clientId,
      address,
    },
    onSuccess: async () => {
      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("clients.addresses.messages.updateSuccess"),
      });
      await refreshDrawer();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("clients.addresses.messages.updateError"),
      });
    },
  });
}

async function deleteAddress(addressId: string) {
  try {
    await ClientsService.deleteAddress(props.clientId, addressId);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("clients.addresses.messages.deleteSuccess"),
    });

    await refreshDrawer();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("clients.addresses.messages.deleteError"),
    });
  }
}

async function setPrimaryAddress(addressId: string) {
  try {
    await ClientsService.setPrimaryAddress(props.clientId, addressId);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("clients.addresses.messages.setPrimarySuccess"),
    });

    await refreshDrawer();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("clients.addresses.messages.setPrimaryError"),
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
  if (!attachmentDocumentType.value.trim() || !attachmentFile.value) {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("clients.attachments.validation.required"),
    });
    return;
  }

  uploadingFile.value = true;

  try {
    await ClientsService.addAttachment(
      props.clientId,
      attachmentFile.value,
      attachmentDocumentType.value.trim(),
    );

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("clients.attachments.messages.uploadSuccess"),
    });

    attachmentDocumentType.value = "";
    attachmentFile.value = null;

    await refreshDrawer();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("clients.attachments.messages.uploadError"),
    });
  } finally {
    uploadingFile.value = false;
  }
}

async function removeAttachment(attachmentId: string) {
  try {
    await ClientsService.deleteAttachment(props.clientId, attachmentId);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("clients.attachments.messages.deleteSuccess"),
    });

    await refreshDrawer();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("clients.attachments.messages.deleteError"),
    });
  }
}

async function openAttachment(attachment: ClientAttachment) {
  viewerLoading.value = true;
  viewerError.value = "";
  viewerFileName.value = attachment.fileName;
  viewerMimeType.value = guessMimeType(attachment.fileName);
  viewerOpen.value = true;

  try {
    const result = await AttachmentsService.getDownloadUrl(
      "clients",
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
    viewerError.value = t("clients.attachments.messages.openError");
  } finally {
    viewerLoading.value = false;
  }
}

async function exportPdf() {
  try {
    const blob = await ClientsService.historyPdfBlob(props.clientId, {
      from: historyFrom.value || undefined,
      to: historyTo.value || undefined,
      status: historyStatus.value || undefined,
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `client-history-${props.clientId}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("clients.history.messages.exportPdfError"),
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
  () => props.clientId,
  async () => {
    closeViewer();
    await refreshDrawer({ includeHistory: true });
  },
);

watch(activeTab, async (tab) => {
  if (tab === "history") {
    await loadHistory();
  }
});
</script>

<template>
  <div class="h-full bg-bt-white p-bt-spacing-24 overflow-y-auto">
    <div class="flex items-start justify-between mb-bt-spacing-24">
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t("clients.drawer.title") }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{ $t("clients.drawer.description", { name: displayName }) }}
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
          'history',
          'contacts',
          'addresses',
          'attachments',
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
        {{ $t(`clients.drawer.tabs.${tab}`) }}
      </button>
    </div>

    <div v-if="loadingClient" class="text-bt-grey-500">
      {{ $t("common.loading") }}
    </div>

    <template v-else-if="client">
      <div
        v-if="activeTab === 'details'"
        class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16"
      >
        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("clients.fields.personType") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ client.personType }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("clients.fields.identification") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ client.identification }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("clients.fields.tradeName") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ client.tradeName }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("clients.fields.contactName") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ client.contactName }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("clients.fields.email") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ client.email }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("clients.fields.primaryPhone") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ client.primaryPhone }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("clients.fields.secondaryPhone") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ client.secondaryPhone || "-" }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("clients.fields.industry") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ client.industry || "-" }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("clients.fields.clientType") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ client.clientType }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("clients.fields.score") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ client.score }}
          </div>
        </div>

        <div
          class="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-bt-spacing-16"
        >
          <div
            class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("clients.kpis.outstandingBalance") }}
            </div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ formatMoney(client.kpis.outstandingBalance) }}
            </div>
          </div>
          <div
            class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("clients.kpis.totalInvoicedLast90Days") }}
            </div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ formatMoney(client.kpis.totalInvoicedLast90Days) }}
            </div>
          </div>
          <div
            class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
          >
            <div class="text-xs text-bt-grey-500">
              {{ $t("clients.kpis.activeContractsCount") }}
            </div>
            <div class="text-bt-primary-700 font-bt-semibold">
              {{ client.kpis.activeContractsCount }}
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'contacts'">
        <div class="mb-bt-spacing-16 flex justify-end">
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600"
            @click="openCreateContactModal"
          >
            {{ $t("clients.contacts.actions.newContact") }}
          </button>
        </div>

        <div class="grid grid-cols-1 gap-bt-spacing-16">
          <div
            v-for="contact in client.contacts"
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
                    {{ $t("clients.contacts.primary") }}
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
                  {{ $t("clients.actions.edit") }}
                </button>

                <button
                  v-if="!contact.isPrimary"
                  type="button"
                  class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-info-100 text-bt-info-700 hover:bg-bt-info-300"
                  @click="setPrimaryContact(contact.contactId)"
                >
                  {{ $t("clients.contacts.actions.setPrimary") }}
                </button>

                <button
                  type="button"
                  class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-error-100 text-bt-error-700 hover:bg-bt-error-300"
                  @click="deleteContact(contact.contactId)"
                >
                  {{ $t("clients.actions.delete") }}
                </button>
              </div>
            </div>
          </div>

          <div
            v-if="!client.contacts.length"
            class="text-center text-bt-grey-500 py-bt-spacing-24"
          >
            {{ $t("clients.contacts.empty") }}
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'addresses'">
        <div class="mb-bt-spacing-16 flex justify-end">
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600"
            @click="openCreateAddressModal"
          >
            {{ $t("clients.addresses.actions.newAddress") }}
          </button>
        </div>

        <div class="grid grid-cols-1 gap-bt-spacing-16">
          <div
            v-for="address in client.addresses"
            :key="address.addressId"
            class="rounded-m border border-bt-grey-200 bg-bt-grey-50 p-bt-spacing-16"
          >
            <div
              class="flex flex-col md:flex-row md:items-start md:justify-between gap-bt-spacing-12"
            >
              <div>
                <div class="flex items-center gap-bt-spacing-8">
                  <h3 class="font-bt-semibold text-bt-primary-700">
                    {{ address.addressType }}
                  </h3>

                  <span
                    v-if="address.isPrimary"
                    class="inline-flex px-bt-spacing-8 py-bt-spacing-4 rounded-full text-xs bg-bt-success-100 text-bt-success-700"
                  >
                    {{ $t("clients.addresses.primary") }}
                  </span>
                </div>

                <p class="text-sm text-bt-grey-600 mt-bt-spacing-4">
                  {{ address.addressLine }}
                </p>
                <p class="text-sm text-bt-grey-600">
                  {{ address.district }}, {{ address.canton }},
                  {{ address.province }}
                </p>
                <p class="text-sm text-bt-grey-600">
                  {{ address.notes || "-" }}
                </p>
              </div>

              <div class="flex flex-wrap gap-bt-spacing-8">
                <button
                  type="button"
                  class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
                  @click="openEditAddressModal(address)"
                >
                  {{ $t("clients.actions.edit") }}
                </button>

                <button
                  v-if="!address.isPrimary"
                  type="button"
                  class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-info-100 text-bt-info-700 hover:bg-bt-info-300"
                  @click="setPrimaryAddress(address.addressId)"
                >
                  {{ $t("clients.addresses.actions.setPrimary") }}
                </button>

                <button
                  type="button"
                  class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-error-100 text-bt-error-700 hover:bg-bt-error-300"
                  @click="deleteAddress(address.addressId)"
                >
                  {{ $t("clients.actions.delete") }}
                </button>
              </div>
            </div>
          </div>

          <div
            v-if="!client.addresses.length"
            class="text-center text-bt-grey-500 py-bt-spacing-24"
          >
            {{ $t("clients.addresses.empty") }}
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
                  {{ $t("clients.attachments.dropzone.title") }}
                </p>
                <p class="text-sm text-bt-grey-600 mt-bt-spacing-8">
                  {{ $t("clients.attachments.dropzone.subtitle") }}
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
                {{ $t("clients.attachments.fields.documentType") }}
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
                    : $t("clients.attachments.actions.upload")
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
                    {{ $t("clients.attachments.table.fileName") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("clients.attachments.table.documentType") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("clients.attachments.table.uploadedAt") }}
                  </th>
                  <th
                    class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                  >
                    {{ $t("clients.attachments.table.options") }}
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="attachment in client.attachments"
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
                        {{ $t("clients.actions.delete") }}
                      </button>
                    </div>
                  </td>
                </tr>

                <tr v-if="!client.attachments.length">
                  <td
                    colspan="4"
                    class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
                  >
                    {{ $t("clients.attachments.empty") }}
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
              {{ $t("clients.history.fields.from") }}
            </label>
            <input
              v-model="historyFrom"
              type="datetime-local"
              class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            />
          </div>

          <div>
            <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
              {{ $t("clients.history.fields.to") }}
            </label>
            <input
              v-model="historyTo"
              type="datetime-local"
              class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            />
          </div>

          <div>
            <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
              {{ $t("clients.history.fields.status") }}
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
            @click="loadHistory"
          >
            {{ $t("clients.history.actions.loadHistory") }}
          </button>

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-warning-500 text-bt-white hover:bg-bt-warning-700"
            @click="exportPdf"
          >
            {{ $t("clients.history.actions.exportPdf") }}
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
                  {{ $t("clients.history.table.code") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("clients.history.table.status") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("clients.history.table.date") }}
                </th>
                <th
                  class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700"
                >
                  {{ $t("clients.history.table.total") }}
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="item in history"
                :key="item.salesOrderId"
                class="border-t border-bt-grey-200"
              >
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ item.code }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ item.status }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ formatDateTime(item.orderDate) }}
                </td>
                <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                  {{ formatMoney(item.total) }}
                </td>
              </tr>

              <tr v-if="!history.length">
                <td
                  colspan="4"
                  class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
                >
                  {{ $t("clients.history.empty") }}
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
            <p>{{ $t("clients.attachments.messages.previewNotAvailable") }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
