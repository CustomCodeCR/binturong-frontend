<script setup lang="ts">
import { ref } from "vue";
import { useModalStore } from "@/core/stores/modalStore";
import { ClientsService } from "@/core/services/clientsService";
import type { ClientContact } from "@/core/interfaces/clients";

const props = defineProps<{
  clientId: string;
  contact?: ClientContact | null;
}>();

const modalStore = useModalStore();
const loading = ref(false);

// Inicializamos refs con los valores de las props
const name = ref(props.contact?.name ?? "");
const jobTitle = ref(props.contact?.jobTitle ?? "");
const email = ref(props.contact?.email ?? "");
const phone = ref(props.contact?.phone ?? "");
const isPrimary = ref(props.contact?.isPrimary ?? false);

// Determinamos si es edición basándonos en la existencia de contactId
const isEdit = !!(props.contact && props.contact.contactId);

async function submit() {
  if (!name.value.trim() || !email.value.trim()) return;
  
  loading.value = true;

  try {
    const payload = {
      name: name.value.trim(),
      jobTitle: jobTitle.value.trim(),
      email: email.value.trim(),
      phone: phone.value.trim(),
      isPrimary: isPrimary.value,
    };

    if (isEdit && props.contact?.contactId) {
      // Usamos el método de actualización de tu service
      await ClientsService.updateContact(
        props.clientId, 
        props.contact.contactId, 
        payload
      );
    } else {
      // Usamos el método de creación de tu service
      await ClientsService.addContact(props.clientId, payload);
    }

    modalStore.onSuccess?.({ ok: true });
    modalStore.close();
  } catch (error: any) {
    console.error("Error procesando contacto:", error);
    modalStore.onError?.(error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-8 overflow-hidden">
    <div class="mb-8">
      <h2 class="text-2xl font-black text-slate-800 tracking-tight">
        {{ isEdit ? 'Editar Contacto' : 'Nuevo Contacto' }}
      </h2>
      <p class="text-gray-400 text-sm mt-1">
        {{ isEdit ? 'Actualiza los datos del contacto seleccionado.' : 'Completa los campos para añadir un nuevo contacto.' }}
      </p>
    </div>

    <div class="grid grid-cols-2 gap-5">
      <div class="col-span-2">
        <label class="block mb-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre Completo</label>
        <input v-model="name" type="text" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-slate-700 outline-none transition bg-slate-50/50" />
      </div>

      <div class="col-span-2">
        <label class="block mb-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Puesto / Cargo</label>
        <input v-model="jobTitle" type="text" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-slate-700 outline-none transition bg-slate-50/50" />
      </div>

      <div class="col-span-1">
        <label class="block mb-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Corporativo</label>
        <input v-model="email" type="email" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-slate-700 outline-none transition bg-slate-50/50" />
      </div>

      <div class="col-span-1">
        <label class="block mb-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Teléfono Directo</label>
        <input v-model="phone" type="text" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-slate-700 outline-none transition bg-slate-50/50" />
      </div>

      <div class="col-span-2 flex items-center gap-3 py-2">
        <input v-model="isPrimary" type="checkbox" id="isPrimary" class="w-5 h-5 text-slate-700 rounded-lg border-gray-300 focus:ring-slate-700" />
        <label for="isPrimary" class="text-sm font-bold text-slate-600 cursor-pointer">Marcar como contacto principal</label>
      </div>
    </div>

    <div class="mt-10 flex justify-end gap-3 pt-6 border-t border-slate-100">
      <button @click="modalStore.close" class="px-6 py-3 rounded-xl bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 transition">
        Cancelar
      </button>

      <button @click="submit" :disabled="loading" class="px-10 py-3 rounded-xl bg-[#C6983A] text-white font-black hover:bg-[#b08733] transition shadow-lg shadow-amber-900/10 disabled:opacity-50">
        {{ loading ? 'GUARDANDO...' : 'GUARDAR CONTACTO' }}
      </button>
    </div>
  </div>
</template>