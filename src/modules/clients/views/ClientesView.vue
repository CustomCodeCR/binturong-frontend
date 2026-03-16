<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { MoreHorizontal, ChevronLeft, ChevronRight, UserPlus } from "lucide-vue-next";

import { ClientsService } from "@/core/services/clientsService";
import { useModalStore } from "@/core/stores/modalStore";
import { useDrawerStore } from "@/core/stores/drawerStore";
import { useToastStore } from "@/core/stores/toastStore";

import ClientCreateModal from "@/modules/clients/components/ClientCreateModal.vue";
import ClientEditModal from "@/modules/clients/components/ClientEditModal.vue";
import ClientDetailsDrawer from "@/modules/clients/components/ClientDetailsDrawer.vue";
import ClientActionMenu from "@/modules/clients/components/ClientActionMenu.vue";

import type { Client } from "@/core/interfaces/clients";

const { t } = useI18n();
const modalStore = useModalStore();
const drawerStore = useDrawerStore();
const toastStore = useToastStore();

const clients = ref<Client[]>([]);
const loading = ref(false);
const search = ref("");
const page = ref(1);
const pageSize = ref(10);
const totalPages = ref(1); 
const pageNumbers = computed(() => {
  const current = page.value;
  const start = Math.max(1, current - 2);
  const end = Math.min(totalPages.value, current + 2);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});

const canGoPrevious = computed(() => page.value > 1);
const canGoNext = computed(() => page.value < totalPages.value);

async function loadClients() {
  loading.value = true;
  try {
    const response = await ClientsService.browse({
      page: page.value,
      pageSize: pageSize.value,
      search: search.value.trim() || undefined,
    });
    clients.value = response;
    // totalPages.value = response.totalPages; // Ajustar según tu API
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

// Acciones
function openCreateModal() {
  modalStore.open({
    component: ClientCreateModal,
    onSuccess: async () => {
      toastStore.addToast({ severity: "success", title: t("toast.success"), message: t("clients.messages.createSuccess") });
      await loadClients();
    }
  });
}

function openEditModal(client: Client) {
  modalStore.open({
    component: ClientEditModal,
    props: { clientId: client.clientId },
    onSuccess: async () => {
      toastStore.addToast({ severity: "success", title: t("toast.success"), message: t("clients.messages.updateSuccess") });
      await loadClients();
    }
  });
}

function openDetailsDrawer(client: Client) {
  drawerStore.openDrawer({
    component: ClientDetailsDrawer,
    props: { clientId: client.clientId },
    title: t("clients.drawer.title"),
    description: client.tradeName,
    size: "xl",
  });
}

async function deleteClient(client: Client) {
  if (!confirm(t("clients.messages.confirmDelete"))) return;
  try {
    await ClientsService.delete(client.clientId);
    toastStore.addToast({ severity: "success", title: t("toast.success"), message: t("clients.messages.deleteSuccess") });
    await loadClients();
  } catch {
    toastStore.addToast({ severity: "error", title: t("toast.error"), message: t("clients.messages.deleteError") });
  }
}

// Watchers y navegación
watch([pageSize, page], () => loadClients());

onMounted(() => loadClients());

const onSearch = () => {
  page.value = 1;
  loadClients();
};
</script>

<template>
  <section class="h-full min-h-0 bg-bt-grey-50 p-bt-spacing-24 flex flex-col">
    <div class="mb-bt-spacing-24 shrink-0">
      <h1 class="text-2xl font-bt-bold text-bt-primary-700">{{ $t("clients.title") }}</h1>
      <p class="text-bt-grey-600 mt-bt-spacing-8">{{ $t("clients.subtitle") }}</p>
    </div>

    <div class="bg-bt-white rounded-l shadow-bt-elevation-200 border border-bt-grey-200 p-bt-spacing-24 flex-1 min-h-0 flex flex-col">
      
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-bt-spacing-16 mb-bt-spacing-24 shrink-0">
        <div class="flex flex-col sm:flex-row gap-bt-spacing-12 w-full lg:max-w-2xl">
          <input
            v-model="search"
            type="text"
            :placeholder="$t('clients.searchPlaceholder')"
            class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:ring-2 focus:ring-bt-accent-500 outline-none"
            @keyup.enter="onSearch"
          />
          <button @click="onSearch" class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-primary-500 text-bt-white font-bt-semibold hover:bg-bt-primary-600 transition">
            {{ $t("common.search") }}
          </button>
          <button @click="loadClients" class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 transition">
            {{ $t("common.refresh") }}
          </button>
        </div>

        <div class="flex items-center gap-bt-spacing-12">
          <select v-model.number="pageSize" class="px-bt-spacing-12 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
          <button @click="openCreateModal" class="flex items-center gap-2 px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white font-bt-semibold hover:bg-bt-accent-600 transition">
            <UserPlus :size="18" />
            {{ $t("clients.actions.newClient") }}
          </button>
        </div>
      </div>

      <div class="flex-1 min-h-0 overflow-auto">
        <table class="w-full border-collapse min-w-[1200px]">
          <thead class="sticky top-0 z-10 bg-bt-primary-50">
            <tr class="text-left">
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 font-bt-bold">{{ $t("clients.table.client") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 font-bt-bold">{{ $t("clients.table.identification") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 font-bt-bold">{{ $t("clients.table.contact") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 font-bt-bold">{{ $t("clients.table.balance") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 font-bt-bold">{{ $t("clients.table.status") }}</th>
              <th class="px-bt-spacing-16 py-bt-spacing-12 text-bt-primary-700 font-bt-bold w-20 text-center">{{ $t("common.options") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="6" class="py-20 text-center text-bt-grey-500">{{ $t("common.loading") }}</td></tr>
            <tr v-else-if="!clients.length"><td colspan="6" class="py-20 text-center text-bt-grey-500">{{ $t("common.noResults") }}</td></tr>
            
            <tr v-for="client in clients" :key="client.clientId" class="border-t border-bt-grey-200 hover:bg-bt-grey-50 transition">
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <div class="font-bt-bold text-bt-primary-700">{{ client.tradeName }}</div>
                <div class="text-xs text-bt-grey-500">{{ client.industry }}</div>
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <div class="text-sm font-bt-semibold">{{ client.identification }}</div>
                <div class="text-xs text-bt-grey-500 uppercase">{{ client.identificationType }}</div>
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <div class="text-sm">{{ client.email }}</div>
                <div class="text-xs text-bt-grey-500">{{ client.primaryPhone }}</div>
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <div class="text-sm font-bt-bold text-bt-primary-600">
                  ${{ client.kpis?.outstandingBalance?.toLocaleString() || '0.00' }}
                </div>
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12">
                <span :class="[
                  'inline-flex px-bt-spacing-12 py-bt-spacing-4 rounded-full text-xs font-bt-semibold',
                  client.isActive ? 'bg-bt-success-100 text-bt-success-700' : 'bg-bt-error-100 text-bt-error-700'
                ]">
                  {{ client.isActive ? $t("common.active") : $t("common.inactive") }}
                </span>
              </td>
              <td class="px-bt-spacing-16 py-bt-spacing-12 text-center">
                <ClientActionMenu :items="[
                  { label: t('common.actions.view'), action: () => openDetailsDrawer(client) },
                  { label: t('common.actions.edit'), action: () => openEditModal(client) },
                  { label: t('common.actions.delete'), action: () => deleteClient(client), danger: true }
                ]">
                  <template #trigger>
                    <button class="p-2 hover:bg-bt-grey-200 rounded-m transition text-bt-primary-700">
                      <MoreHorizontal :size="20" />
                    </button>
                  </template>
                </ClientActionMenu>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-bt-spacing-24 pt-bt-spacing-16 border-t border-bt-grey-200 flex flex-col md:flex-row md:items-center md:justify-between gap-bt-spacing-16 shrink-0">
        <div class="text-sm text-bt-grey-600">
          {{ $t("pagination.showing") }} {{ clients.length }} {{ $t("pagination.results") }}
        </div>
        <div class="flex items-center gap-bt-spacing-8">
          <button :disabled="!canGoPrevious" @click="page--" class="p-2 border rounded-m disabled:opacity-50"><ChevronLeft :size="18"/></button>
          <button v-for="p in pageNumbers" :key="p" @click="page = p" :class="['px-3 py-1 rounded-m border', p === page ? 'bg-bt-primary-500 text-white border-bt-primary-500' : 'text-bt-primary-700']">
            {{ p }}
          </button>
          <button :disabled="!canGoNext" @click="page++" class="p-2 border rounded-m disabled:opacity-50"><ChevronRight :size="18"/></button>
        </div>
      </div>
    </div>
  </section>
</template>