<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useModalStore } from "@/core/stores/modalStore";
import { ClientsService } from "@/core/services/clientsService";
import type { ClientUpdateRequest } from "@/core/interfaces/clients";

const props = defineProps<{ clientId: string }>();
const modalStore = useModalStore();
const saving = ref(false);
const loading = ref(true);

const form = ref<ClientUpdateRequest>({
  tradeName: "",
  contactName: "",
  email: "",
  primaryPhone: "",
  secondaryPhone: "",
  industry: "",
  clientType: "",
  score: 0,
  isActive: true
});

onMounted(async () => {
  try {
    const data = await ClientsService.readById(props.clientId);
    // Mapeamos solo los campos que pertenecen al request de actualización
    Object.assign(form.value, {
      tradeName: data.tradeName,
      contactName: data.contactName,
      email: data.email,
      primaryPhone: data.primaryPhone,
      secondaryPhone: data.secondaryPhone,
      industry: data.industry,
      clientType: data.clientType,
      score: data.score,
      isActive: data.isActive
    });
  } catch (error) {
    console.error("Error al cargar cliente:", error);
  } finally {
    loading.value = false;
  }
});

async function submit() {
  if (saving.value) return;
  saving.value = true;
  try {
    await ClientsService.update(props.clientId, form.value);
    modalStore.onSuccess?.();
    modalStore.close();
  } catch (err) {
    console.error("Error al actualizar:", err);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="p-8 bg-white rounded-lg w-full max-w-2xl shadow-xl">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Editar Cliente</h2>
      <p class="text-gray-500 text-sm">Modifica la información del cliente seleccionado.</p>
    </div>

    <div v-if="loading" class="py-10 text-center text-gray-500">
      Cargando datos del cliente...
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="col-span-full">
        <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Nombre Comercial</label>
        <input v-model="form.tradeName" placeholder="Nombre Comercial" class="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-slate-700 outline-none" />
      </div>

      <div>
        <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Nombre de Contacto</label>
        <input v-model="form.contactName" placeholder="Contacto" class="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-slate-700 outline-none" />
      </div>

      <div>
        <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Correo Electrónico</label>
        <input v-model="form.email" placeholder="Email" class="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-slate-700 outline-none" />
      </div>

      <div>
        <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Teléfono Primario</label>
        <input v-model="form.primaryPhone" placeholder="Primario" class="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-slate-700 outline-none" />
      </div>

      <div>
        <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Teléfono Secundario</label>
        <input v-model="form.secondaryPhone" placeholder="Secundario" class="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-slate-700 outline-none" />
      </div>

      <div>
        <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Industria</label>
        <input v-model="form.industry" placeholder="Industria" class="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-slate-700 outline-none" />
      </div>

      <div>
        <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Tipo de Cliente</label>
        <input v-model="form.clientType" placeholder="Tipo" class="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-slate-700 outline-none" />
      </div>

      <div>
        <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Score</label>
        <input v-model.number="form.score" type="number" class="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-slate-700 outline-none" />
      </div>

      <div class="flex items-end pb-2">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="form.isActive" class="w-4 h-4 text-slate-700 rounded border-gray-300" />
          <span class="text-sm font-medium text-gray-700">Cliente Activo</span>
        </label>
      </div>
    </div>

    <div class="mt-8 flex justify-end gap-3 border-t pt-6">
      <button 
        @click="modalStore.close" 
        class="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition font-medium"
      >
        Cancelar
      </button>
      <button 
        @click="submit" 
        :disabled="saving || loading" 
        class="px-8 py-2.5 bg-[#C6983A] text-white rounded-md hover:bg-[#b08733] transition font-bold disabled:opacity-50"
      >
        {{ saving ? 'Guardando...' : 'Actualizar Cliente' }}
      </button>
    </div>
  </div>
</template>