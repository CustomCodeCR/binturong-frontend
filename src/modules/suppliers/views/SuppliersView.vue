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

// Lógica de paginación
const pageNumbers = computed(() => {
  const current = page.value;
  const start = Math.max(1, current - 2);
  const end = Math.min(MAX_PAGE, current + 2);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

const canGoPrevious = computed(() => page.value > 1);
const canGoNext = computed(() => page.value < MAX_PAGE);

// Carga de datos
async function loadClients() {
  loading.value = true;
  try {
    clients.value = await ClientsService.browse({
      page: page.value,
      pageSize: pageSize.value,
      search: search.value.trim() || undefined,
    });
  } catch {
    toastStore.addToast({ severity: "error", title: t("toast.error"), message: "Error al cargar clientes" });
  } finally {
    loading.value = false;
  }
}

// Acciones del Menú
function openDetails(client: Client) {
  drawerStore.openDrawer({
    component: ClientDetailsDrawer,
    props: { clientId: client.clientId },
    title: "Detalles del Cliente",
    size: "xl"
  });
}

function openEdit(client: Client) {
  modalStore.open({
    component: ClientEditModal,
    props: { clientId: client.clientId },
    onSuccess: loadClients
  });
}

async function deleteClient(client: Client) {
  try {
    await ClientsService.delete(client.clientId);
    toastStore.addToast({ severity: "success", title: "Éxito", message: "Cliente eliminado" });
    loadClients();
  } catch {
    toastStore.addToast({ severity: "error", title: "Error", message: "No se pudo eliminar" });
  }
}

onMounted(loadClients);
</script>

<template>
  <section class="h-full bg-bt-grey-50 p-bt-spacing-24">
    <h1 class="text-2xl font-bt-bold text-bt-primary-700">Clientes</h1>

    <div class="bg-bt-white mt-bt-spacing-16 p-bt-spacing-24 rounded-l border">
      <div class="flex gap-bt-spacing-12 mb-bt-spacing-24">
        <input v-model="search" class="border px-4 py-2 rounded-m" placeholder="Buscar..." @keyup.enter="loadClients" />
        <button @click="loadClients" class="bg-bt-primary-500 text-white px-4 py-2 rounded-m">Buscar</button>
      </div>

      <table class="w-full">
        <thead>
          <tr class="bg-bt-primary-50 text-left">
            <th class="p-3">Identificación</th>
            <th class="p-3">Nombre Comercial</th>
            <th class="p-3">Email</th>
            <th class="p-3">Estado</th>
            <th class="p-3">Opciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="client in clients" :key="client.clientId" class="border-t">
            <td class="p-3">{{ client.identification }}</td>
            <td class="p-3">{{ client.tradeName }}</td>
            <td class="p-3">{{ client.email }}</td>
            <td class="p-3">
              <span :class="client.isActive ? 'text-bt-success-600' : 'text-bt-error-600'">
                {{ client.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="p-3">
              <ActionMenu :items="[
                { label: 'Ver', action: () => openDetails(client) },
                { label: 'Editar', action: () => openEdit(client) },
                { label: 'Eliminar', action: () => deleteClient(client), danger: true }
              ]">
                <template #trigger><MoreHorizontal :size="18" /></template>
              </ActionMenu>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>