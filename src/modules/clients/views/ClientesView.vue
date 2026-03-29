<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-vue-next";

import { ClientsService } from "@/core/services/clientsService";

import { useModalStore } from "@/core/stores/modalStore";
import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

import ClientCreateModal from "@/modules/clients/components/ClientCreateModal.vue";
import ClientEditModal from "@/modules/clients/components/ClientEditModal.vue";
import ClientDetailsDrawer from "@/modules/clients/components/ClientDetailsDrawer.vue";
import ClientActionMenu from "@/modules/clients/components/ClientActionMenu.vue";

import type { Client } from "@/core/interfaces/clients";

interface ClientSuccessPayload {
  clientId: string;
  identification: string;
  identificationType: string;
  tradeName: string;
  contactName: string;
  email: string;
  primaryPhone: string;
  secondaryPhone?: string | null;
  industry: string;
  clientType: string;
  score: number;
  isActive: boolean;
}

const { t } = useI18n();

const modalStore = useModalStore();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const loading = ref(false);
const clients = ref<Client[]>([]);
const search = ref("");
const page = ref(1);
const pageSize = ref(10);
const statusFilter = ref<"all" | "active" | "inactive">("all");

const MAX_PAGE = 100;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchClients(): Promise<Client[]> {
  return await ClientsService.browse({
    page: page.value,
    pageSize: pageSize.value,
  });
}

function replaceClients(nextClients: Client[]) {
  clients.value = [...nextClients];
}

async function loadClients() {
  loading.value = true;
  try {
    replaceClients(await fetchClients());
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("clients.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

const filteredClients = computed(() => {
  let result = clients.value;

  if (statusFilter.value === "active") {
    result = result.filter((c) => c.isActive);
  } else if (statusFilter.value === "inactive") {
    result = result.filter((c) => !c.isActive);
  }

  if (search.value.trim()) {
    const query = search.value.toLowerCase().trim();
    result = result.filter(
      (c) =>
        c.identification.toLowerCase().includes(query) ||
        c.tradeName.toLowerCase().includes(query) ||
        c.contactName.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.primaryPhone.toLowerCase().includes(query) ||
        c.industry.toLowerCase().includes(query) ||
        c.clientType.toLowerCase().includes(query),
    );
  }

  return result;
});

const pageNumbers = computed(() => {
  const current = page.value;
  const start = Math.max(1, current - 2);
  const end = Math.min(MAX_PAGE, current + 2);

  const pages: number[] = [];
  for (let index = start; index <= end; index += 1) {
    pages.push(index);
  }

  return pages;
});

const canGoPrevious = computed(() => page.value > 1);
const canGoNext = computed(() => page.value < MAX_PAGE);

function patchClientInList(payload: ClientSuccessPayload) {
  const existingIndex = clients.value.findIndex(
    (client) => client.clientId === payload.clientId,
  );

  if (existingIndex >= 0) {
    replaceClients(
      clients.value.map((client) =>
        client.clientId === payload.clientId
          ? {
              ...client,
              clientId: payload.clientId,
              identification: payload.identification,
              identificationType: payload.identificationType,
              tradeName: payload.tradeName,
              contactName: payload.contactName,
              email: payload.email,
              primaryPhone: payload.primaryPhone,
              secondaryPhone: payload.secondaryPhone ?? client.secondaryPhone ?? null,
              industry: payload.industry,
              clientType: payload.clientType,
              score: payload.score,
              isActive: payload.isActive,
            }
          : client,
      ),
    );
    return;
  }

  replaceClients([
    {
      id: `client:${payload.clientId}`,
      clientId: payload.clientId,
      identification: payload.identification,
      identificationType: payload.identificationType,
      tradeName: payload.tradeName,
      contactName: payload.contactName,
      email: payload.email,
      primaryPhone: payload.primaryPhone,
      secondaryPhone: payload.secondaryPhone ?? null,
      industry: payload.industry,
      clientType: payload.clientType,
      score: payload.score,
      isActive: payload.isActive,
    } as Client,
    ...clients.value,
  ]);
}

function patchClientStatusInList(clientId: string, isActive: boolean) {
  replaceClients(
    clients.value.map((client) =>
      client.clientId === clientId ? { ...client, isActive } : client,
    ),
  );
}

function removeClientFromList(clientId: string) {
  replaceClients(
    clients.value.filter((client) => client.clientId !== clientId),
  );
}

function hasClientReachedExpectedState(
  fetchedClients: Client[],
  expected: ClientSuccessPayload,
): boolean {
  const fetchedClient = fetchedClients.find(
    (client) => client.clientId === expected.clientId,
  );

  if (!fetchedClient) return false;

  return (
    fetchedClient.identification === expected.identification &&
    fetchedClient.identificationType === expected.identificationType &&
    fetchedClient.tradeName === expected.tradeName &&
    fetchedClient.contactName === expected.contactName &&
    fetchedClient.email === expected.email &&
    fetchedClient.primaryPhone === expected.primaryPhone &&
    (fetchedClient.secondaryPhone ?? "") === (expected.secondaryPhone ?? "") &&
    fetchedClient.industry === expected.industry &&
    fetchedClient.clientType === expected.clientType &&
    Number(fetchedClient.score) === Number(expected.score) &&
    fetchedClient.isActive === expected.isActive
  );
}

async function reloadClientsUntil(
  predicate: (fetchedClients: Client[]) => boolean,
  options?: { attempts?: number; delayMs?: number },
) {
  const attempts = options?.attempts ?? 12;
  const delayMs = options?.delayMs ?? 500;

  loading.value = true;

  try {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const fetchedClients = await fetchClients();

      if (predicate(fetchedClients)) {
        replaceClients(fetchedClients);
        await refreshOpenClientDetailsDrawer();
        return;
      }

      if (attempt < attempts - 1) {
        await sleep(delayMs);
      }
    }

    replaceClients(await fetchClients());
    await refreshOpenClientDetailsDrawer();
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("clients.messages.loadError"),
    });
  } finally {
    loading.value = false;
  }
}

function getDrawerClientId(): string | null {
  if (!drawerStore.isOpen) return null;
  const props = (drawerStore.props ?? {}) as { clientId?: string };
  return props.clientId ?? null;
}

async function refreshOpenClientDetailsDrawer() {
  const openClientId = getDrawerClientId();
  if (!openClientId) return;

  const currentClient = clients.value.find(
    (client) => client.clientId === openClientId,
  );

  drawerStore.openDrawer({
    component: ClientDetailsDrawer,
    props: { clientId: openClientId },
    title: t("clients.drawer.title"),
    description: t("clients.drawer.description", {
      name: currentClient?.tradeName ?? "",
    }),
    direction: "right",
    size: "xl",
  });
}

function openCreateModal() {
  modalStore.open({
    component: ClientCreateModal,
    onSuccess: async (payload?: ClientSuccessPayload) => {
      if (payload?.clientId) patchClientInList(payload);

      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("clients.messages.createSuccess"),
      });

      if (payload?.clientId) {
        await reloadClientsUntil(
          (fetchedClients) =>
            fetchedClients.some((client) => client.clientId === payload.clientId),
          { attempts: 12, delayMs: 500 },
        );
        return;
      }

      await loadClients();
      await refreshOpenClientDetailsDrawer();
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("clients.messages.createError"),
      });
    },
  });
}

function openEditModal(client: Client) {
  modalStore.open({
    component: ClientEditModal,
    props: { clientId: client.clientId },
    onSuccess: async (payload?: ClientSuccessPayload) => {
      if (!payload?.clientId) {
        await loadClients();
        await refreshOpenClientDetailsDrawer();
        return;
      }

      patchClientInList(payload);

      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("clients.messages.updateSuccess"),
      });

      await reloadClientsUntil(
        (fetchedClients) => hasClientReachedExpectedState(fetchedClients, payload),
        { attempts: 12, delayMs: 500 },
      );
    },
    onError: (error) => {
      toastStore.addToast({
        severity: "error",
        title: t("toast.error"),
        message: error?.message ?? t("clients.messages.updateError"),
      });
    },
  });
}

function openDetailsDrawer(client: Client) {
  drawerStore.openDrawer({
    component: ClientDetailsDrawer,
    props: { clientId: client.clientId },
    title: t("clients.drawer.title"),
    description: t("clients.drawer.description", { name: client.tradeName }),
    direction: "right",
    size: "xl",
  });
}

async function toggleClientStatus(client: Client) {
  const nextIsActive = !client.isActive;

  try {
    await ClientsService.update(client.clientId, {
      tradeName: client.tradeName,
      contactName: client.contactName,
      email: client.email,
      primaryPhone: client.primaryPhone,
      secondaryPhone: client.secondaryPhone,
      industry: client.industry,
      clientType: client.clientType,
      score: client.score,
      isActive: nextIsActive,
    });

    patchClientStatusInList(client.clientId, nextIsActive);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: client.isActive
        ? t("clients.messages.deactivateSuccess")
        : t("clients.messages.reactivateSuccess"),
    });

    await reloadClientsUntil(
      (fetchedClients) => {
        const fetchedClient = fetchedClients.find(
          (item) => item.clientId === client.clientId,
        );
        return fetchedClient?.isActive === nextIsActive;
      },
      { attempts: 12, delayMs: 500 },
    );
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: client.isActive
        ? t("clients.messages.deactivateError")
        : t("clients.messages.reactivateError"),
    });
  }
}

async function deleteClient(client: Client) {
  try {
    await ClientsService.delete(client.clientId);

    const openedClientId = getDrawerClientId();
    removeClientFromList(client.clientId);

    toastStore.addToast({
      severity: "success",
      title: t("toast.success"),
      message: t("clients.messages.deleteSuccess"),
    });

    await reloadClientsUntil(
      (fetchedClients) =>
        !fetchedClients.some((item) => item.clientId === client.clientId),
      { attempts: 12, delayMs: 500 },
    );

    if (openedClientId === client.clientId) {
      drawerStore.closeDrawer();
    }
  } catch {
    toastStore.addToast({
      severity: "error",
      title: t("toast.error"),
      message: t("clients.messages.deleteError"),
    });
  }
}

async function onSearch() {
  page.value = 1;
  await loadClients();
}

async function goToPage(targetPage: number) {
  if (targetPage < 1 || targetPage > MAX_PAGE || targetPage === page.value) return;
  page.value = targetPage;
  await loadClients();
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
  await loadClients();
});

onMounted(async () => {
  await loadClients();
});
</script>

<template>
  <section class="h-full min-h-0 bg-bt-grey-50 p-bt-spacing-24 flex flex-col">
    <div class="mb-bt-spacing-24 shrink-0">
      <h1 class="text-2xl font-bt-bold text-bt-primary-700">
        {{ $t("clients.title") }}
      </h1>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("clients.subtitle") }}
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
            :placeholder="$t('clients.searchPlaceholder')"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            @keyup.enter="onSearch"
          />

          <select
            v-model="statusFilter"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
          >
            <option value="all">{{ $t("clients.filters.allStatus") }}</option>
            <option value="active">{{ $t("clients.filters.active") }}</option>
            <option value="inactive">{{ $t("clients.filters.inactive") }}</option>
          </select>

          <!-- Primary query action -->
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition"
            @click="onSearch"
          >
            {{ $t("clients.actions.search") }}
          </button>

          <!-- Secondary: no data impact -->
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
            @click="loadClients"
          >
            {{ $t("clients.actions.refresh") }}
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
            {{ $t("clients.actions.newClient") }}
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

        <table v-else class="w-full border-collapse min-w-[900px]">
          <thead class="sticky top-0 z-10">
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("clients.table.identification") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("clients.table.tradeName") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("clients.table.contactName") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("clients.table.email") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("clients.table.phone") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("clients.table.clientType") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">{{ $t("clients.table.status") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20">{{ $t("clients.table.options") }}</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="client in filteredClients"
              :key="client.clientId"
              class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                <div class="font-bt-semibold text-bt-primary-700">{{ client.identification }}</div>
                <div class="text-xs text-bt-grey-500">{{ client.identificationType }}</div>
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ client.tradeName }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ client.contactName }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ client.email }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ client.primaryPhone }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">{{ client.clientType }}</td>
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <span
                  :class="[
                    'inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold',
                    client.isActive
                      ? 'bg-bt-success-100 text-bt-success-700'
                      : 'bg-bt-error-100 text-bt-error-700',
                  ]"
                >
                  {{ client.isActive ? $t("clients.status.active") : $t("clients.status.inactive") }}
                </span>
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <ClientActionMenu
                  :items="[
                    {
                      label: t('clients.actions.viewDetails'),
                      action: () => openDetailsDrawer(client),
                    },
                    {
                      label: t('clients.actions.edit'),
                      action: () => openEditModal(client),
                    },
                    {
                      label: client.isActive
                        ? t('clients.actions.deactivate')
                        : t('clients.actions.reactivate'),
                      action: () => toggleClientStatus(client),
                      danger: client.isActive,
                    },
                    {
                      label: t('clients.actions.delete'),
                      action: () => deleteClient(client),
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
                </ClientActionMenu>
              </td>
            </tr>

            <tr v-if="!filteredClients.length && !loading">
              <td
                colspan="8"
                class="px-bt-spacing-16 py-bt-spacing-24 text-center text-bt-grey-500"
              >
                {{ $t("clients.empty") }}
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
            ({{ filteredClients.length }} {{ $t("clients.filtered") }})
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