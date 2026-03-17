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
import ActionMenu from "@/modules/clients/components/ClientActionMenu.vue";
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
const MAX_PAGE = 100;

const pageNumbers = computed(() => {
  const current = page.value;
  const start = Math.max(1, current - 2);
  const end = Math.min(MAX_PAGE, current + 2);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

const canGoPrevious = computed(() => page.value > 1);
const canGoNext = computed(() => page.value < MAX_PAGE);

async function loadClients() {
  loading.value = true;
  try {
    clients.value = await ClientsService.browse({
      page: page.value,
      pageSize: pageSize.value,
      search: search.value.trim() || undefined,
    });
  } catch {
    toastStore.addToast({ severity: "error", title: t("toast.error"), message: "Error al cargar" });
  } finally {
    loading.value = false;
  }
}

function openCreateModal() {
  modalStore.open({ component: ClientCreateModal, onSuccess: loadClients });
}

function openEditModal(client: Client) {
  modalStore.open({
    component: ClientEditModal,
    props: { clientId: client.clientId },
    onSuccess: loadClients
  });
}

function openDetailsDrawer(client: Client) {
  drawerStore.openDrawer({
    component: ClientDetailsDrawer,
    props: { clientId: client.clientId },
    title: "Detalles del Cliente",
    size: "xl"
  });
}

async function deleteClient(client: Client) {
  try {
    await ClientsService.delete(client.clientId);
    toastStore.addToast({ severity: "success", title: "Éxito", message: "Eliminado" });
    await loadClients();
  } catch {
    toastStore.addToast({ severity: "error", title: "Error", message: "Error al eliminar" });
  }
}

watch(pageSize, () => { page.value = 1; loadClients(); });
onMounted(loadClients);
</script>

<template>
  <section class="h-full min-h-0 bg-bt-grey-50 p-6 flex flex-col">
    <div class="mb-6 shrink-0">
      <h1 class="text-2xl font-bold text-bt-primary-700">Gestión de Clientes</h1>
    </div>

    <div class="bg-white rounded-lg shadow-sm border p-6 flex-1 min-h-0 flex flex-col">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div class="flex gap-2 w-full lg:max-w-xl">
          <input 
            v-model="search" 
            @keyup.enter="loadClients" 
            class="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-slate-700 outline-none" 
            placeholder="Search by code, name, address, or phone" 
          />
          <button @click="loadClients" class="px-6 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition">
            Search
          </button>
          <button @click="loadClients" class="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition">
            Refresh
          </button>
        </div>
        
        <div class="flex items-center gap-4">
          <select v-model="pageSize" class="border border-gray-300 px-3 py-2 rounded-md">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
          <button @click="openCreateModal" class="px-6 py-2 bg-[#C6983A] text-white rounded-md hover:bg-[#b08733] transition font-bold">
            New Client
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-auto">
        <table class="w-full border-collapse">
          <thead class="bg-gray-50">
            <tr>
              <th class="p-3 text-left">Identificación</th>
              <th class="p-3 text-left">Nombre</th>
              <th class="p-3 text-left">Email</th>
              <th class="p-3 text-left">Estado</th>
              <th class="p-3 text-left w-20">Opciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in clients" :key="c.clientId" class="border-t hover:bg-gray-50">
              <td class="p-3">{{ c.identification }}</td>
              <td class="p-3">{{ c.tradeName }}</td>
              <td class="p-3">{{ c.email }}</td>
              <td class="p-3">
                <span :class="c.isActive ? 'text-green-600' : 'text-red-600'">
                  {{ c.isActive ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="p-3">
                <ActionMenu :items="[
                  { label: 'Detalles', action: () => openDetailsDrawer(c) },
                  { label: 'Editar', action: () => openEditModal(c) },
                  { label: 'Eliminar', action: () => deleteClient(c), danger: true }
                ]">
                  <template #trigger><button><MoreHorizontal /></button></template>
                </ActionMenu>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-6 pt-4 border-t flex justify-between items-center">
        <span class="text-sm">Página {{ page }} de {{ MAX_PAGE }}</span>
        <div class="flex gap-2">
          <button :disabled="!canGoPrevious" @click="page--" class="px-3 py-1 border rounded hover:bg-gray-50">Anterior</button>
          <button v-for="n in pageNumbers" :key="n" @click="page = n" class="px-3 py-1 border rounded" :class="{'bg-[#C6983A] text-white border-[#C6983A]': n === page}">{{ n }}</button>
          <button :disabled="!canGoNext" @click="page++" class="px-3 py-1 border rounded hover:bg-gray-50">Siguiente</button>
        </div>
      </div>
    </div>
  </section>
</template>