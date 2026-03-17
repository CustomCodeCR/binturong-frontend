<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { MoreHorizontal } from "lucide-vue-next";

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchClients(): Promise<Client[]> {
  return await ClientsService.browse({
    page: 1,
    pageSize: 100,
    search: search.value.trim() || undefined,
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
  const term = search.value.trim().toLowerCase();
  if (!term) return clients.value;

  return clients.value.filter((client) => {
    return (
      client.identification.toLowerCase().includes(term) ||
      client.tradeName.toLowerCase().includes(term) ||
      client.contactName.toLowerCase().includes(term) ||
      client.email.toLowerCase().includes(term) ||
      client.primaryPhone.toLowerCase().includes(term) ||
      client.industry.toLowerCase().includes(term) ||
      client.clientType.toLowerCase().includes(term)
    );
  });
});

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
              secondaryPhone:
                payload.secondaryPhone ?? client.secondaryPhone ?? null,
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
      client.clientId === clientId
        ? {
            ...client,
            isActive,
          }
        : client,
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

  if (!fetchedClient) {
    return false;
  }

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
  const drawer = drawerStore.drawerState;

  if (!drawer?.isOpen) {
    return null;
  }

  const props = (drawer.props ?? {}) as { clientId?: string };
  return props.clientId ?? null;
}

async function refreshOpenClientDetailsDrawer() {
  const openClientId = getDrawerClientId();
  if (!openClientId) {
    return;
  }

  const currentClient = clients.value.find(
    (client) => client.clientId === openClientId,
  );

  drawerStore.openDrawer({
    component: ClientDetailsDrawer,
    props: {
      clientId: openClientId,
    },
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
      if (payload?.clientId) {
        patchClientInList(payload);
      }

      toastStore.addToast({
        severity: "success",
        title: t("toast.success"),
        message: t("clients.messages.createSuccess"),
      });

      if (payload?.clientId) {
        await reloadClientsUntil(
          (fetchedClients) =>
            fetchedClients.some(
              (client) => client.clientId === payload.clientId,
            ),
          {
            attempts: 12,
            delayMs: 500,
          },
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
    props: {
      clientId: client.clientId,
    },
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
        (fetchedClients) =>
          hasClientReachedExpectedState(fetchedClients, payload),
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
        message: error?.message ?? t("clients.messages.updateError"),
      });
    },
  });
}

function openDetailsDrawer(client: Client) {
  drawerStore.openDrawer({
    component: ClientDetailsDrawer,
    props: {
      clientId: client.clientId,
    },
    title: t("clients.drawer.title"),
    description: t("clients.drawer.description", {
      name: client.tradeName,
    }),
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
      {
        attempts: 12,
        delayMs: 500,
      },
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
      {
        attempts: 12,
        delayMs: 500,
      },
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
      <div
        class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 mb-bt-spacing-24 shrink-0"
      >
        <div
          class="flex flex-col sm:flex-row gap-bt-spacing-12 w-full lg:max-w-2xl"
        >
          <input
            v-model="search"
            type="text"
            :placeholder="$t('clients.searchPlaceholder')"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white text-bt-primary-700 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
            @keyup.enter="loadClients"
          />

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white hover:bg-bt-primary-600 transition"
            @click="loadClients"
          >
            {{ $t("clients.actions.search") }}
          </button>

          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition"
            @click="loadClients"
          >
            {{ $t("clients.actions.refresh") }}
          </button>
        </div>

        <div class="flex items-center gap-bt-spacing-12 shrink-0">
          <button
            type="button"
            class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 transition font-bt-semibold"
            @click="openCreateModal"
          >
            {{ $t("clients.actions.newClient") }}
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

        <table v-else class="w-full border-collapse min-w-[1300px]">
          <thead class="sticky top-0 z-10">
            <tr class="bg-bt-primary-50 text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("clients.table.identification") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("clients.table.tradeName") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("clients.table.contactName") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("clients.table.email") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("clients.table.phone") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("clients.table.clientType") }}
              </th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700">
                {{ $t("clients.table.status") }}
              </th>
              <th
                class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 w-20"
              >
                {{ $t("clients.table.options") }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="client in filteredClients"
              :key="client.clientId"
              class="border-t border-bt-grey-200 hover:bg-bt-grey-50"
            >
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                <div class="font-bt-semibold text-bt-primary-700">
                  {{ client.identification }}
                </div>
                <div class="text-xs text-bt-grey-500">
                  {{ client.identificationType }}
                </div>
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ client.tradeName }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ client.contactName }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ client.email }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ client.primaryPhone }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12 text-bt-grey-700">
                {{ client.clientType }}
              </td>

              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <span
                  :class="[
                    'inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold',
                    client.isActive
                      ? 'bg-bt-success-100 text-bt-success-700'
                      : 'bg-bt-error-100 text-bt-error-700',
                  ]"
                >
                  {{
                    client.isActive
                      ? $t("clients.status.active")
                      : $t("clients.status.inactive")
                  }}
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
    </div>
  </section>
</template>
