<script setup lang="ts">
import { ref } from "vue";
import { useModalStore } from "@/core/stores/modalStore";
import { ClientsService } from "@/core/services/clientsService";
import type { ClientCreateRequest } from "@/core/interfaces/clients";

const modalStore = useModalStore();
const saving = ref(false);

const form = ref<ClientCreateRequest>({
  personType: "Física", // Valor por defecto común en tus capturas
  identificationType: "Cédula", 
  identification: "",
  tradeName: "",
  contactName: "",
  email: "",
  primaryPhone: "",
  secondaryPhone: "",
  industry: "",
  clientType: "Regular",
  score: 0,
  isActive: true
});

async function submit() {
  if (saving.value) return;
  saving.value = true;
  try {
    await ClientsService.create(form.value);
    modalStore.onSuccess?.();
    modalStore.close();
  } catch (err) {
    console.error("Error al crear:", err);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="p-8 bg-white rounded-lg w-full max-w-2xl shadow-xl">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Crear Cliente</h2>
      <p class="text-gray-500">Registra un nuevo cliente en el sistema.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="col-span-full">
        <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Persona</label>
        <select v-model="form.personType" class="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-slate-700 outline-none">
          <option value="Física">Física</option>
          <option value="Jurídica">Jurídica</option>
        </select>
      </div>

      <input v-model="form.identification" placeholder="Identificación" class="border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-slate-700 outline-none" />
      <input v-model="form.tradeName" placeholder="Nombre Comercial" class="border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-slate-700 outline-none" />

      <input v-model="form.contactName" placeholder="Nombre de Contacto" class="border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-slate-700 outline-none" />
      <input v-model="form.email" placeholder="Email" class="border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-slate-700 outline-none" />

      <input v-model="form.primaryPhone" placeholder="Teléfono Primario" class="border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-slate-700 outline-none" />
      <input v-model="form.secondaryPhone" placeholder="Teléfono Secundario" class="border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-slate-700 outline-none" />

      <input v-model="form.industry" placeholder="Industria" class="border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-slate-700 outline-none" />
      <input v-model="form.clientType" placeholder="Tipo de Cliente" class="border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-slate-700 outline-none" />

      <div class="col-span-full">
        <label class="block text-sm font-medium text-gray-700 mb-1">Score Inicial</label>
        <input v-model.number="form.score" type="number" class="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-slate-700 outline-none" />
      </div>

      <div class="col-span-full flex items-center gap-2 mt-2">
        <input type="checkbox" v-model="form.isActive" id="isActive" class="w-4 h-4 text-slate-700 rounded border-gray-300" />
        <label for="isActive" class="text-sm font-medium text-gray-700">Cliente Activo</label>
      </div>
    </div>

    <div class="mt-8 flex justify-end gap-3">
      <button 
        @click="modalStore.close" 
        class="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition font-medium"
      >
        Cancelar
      </button>
      <button 
        @click="submit" 
        :disabled="saving" 
        class="px-8 py-2.5 bg-[#C6983A] text-white rounded-md hover:bg-[#b08733] transition font-bold disabled:opacity-50"
      >
        {{ saving ? 'Guardando...' : 'Guardar' }}
      </button>
    </div>
  </div>
</template>