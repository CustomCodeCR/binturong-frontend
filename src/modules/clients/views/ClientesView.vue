<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ClientsService } from "@/core/services/clientsService";
import type { Client } from "@/core/interfaces/clients";

const clients = ref<Client[]>([]);
const loading = ref(true);
const error = ref("");
const showModal = ref(false);
const isEditing = ref(false);
const selectedClient = ref<Client | null>(null);

const form = ref({
  tradeName: "",
  identification: "",
  email: "",
  primaryPhone: "",
  score: 0,
  isActive: true,
});

const fetchClients = async () => {
  try {
    loading.value = true;
    clients.value = await ClientsService.browse();
  } catch (e) {
    error.value = "Error al cargar clientes";
  } finally {
    loading.value = false;
  }
};

const openEdit = (client: Client) => {
  isEditing.value = true;
  selectedClient.value = client;
  form.value = {
    tradeName: client.tradeName,
    identification: client.identification,
    email: client.email,
    primaryPhone: client.primaryPhone,
    score: client.score,
    isActive: client.isActive,
  };
  showModal.value = true;
};

const handleDelete = async (id: string) => {
  if (!confirm("¿Eliminar cliente?")) return;
  await ClientsService.delete(id);
  await fetchClients();
};

onMounted(fetchClients);
</script>

<template>
  <div class="p-8 bg-slate-50 min-h-screen">
    <div class="max-w-7xl mx-auto flex justify-between mb-8">
      <h1 class="text-3xl font-black">Directorio de Clientes</h1>
      <button class="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">
        + Nuevo Cliente
      </button>
    </div>

    <div
      v-if="!loading"
      class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div
        v-for="c in clients"
        :key="c.id"
        class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
      >
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="font-black text-lg">{{ c.tradeName }}</h3>
            <p class="text-xs text-slate-400">{{ c.identification }}</p>
          </div>
          <span
            :class="
              c.isActive
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-600'
            "
            class="px-2 py-1 rounded-lg text-[10px] font-bold"
          >
            {{ c.isActive ? "ACTIVO" : "INACTIVO" }}
          </span>
        </div>

        <div class="space-y-2 mb-4 text-sm">
          <p>📧 {{ c.email }}</p>
          <p>📞 {{ c.primaryPhone }}</p>
          <p class="font-bold text-blue-600">Score: {{ c.score }}</p>
        </div>

        <div class="flex gap-2 border-t pt-4">
          <button
            @click="handleDelete(c.id)"
            class="text-red-500 font-bold text-xs uppercase"
          >
            Eliminar
          </button>
          <button
            @click="openEdit(c)"
            class="text-blue-600 font-bold text-xs uppercase"
          >
            Detalles / Editar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
