<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useModalStore } from "@/core/stores/modalStore";
import { ClientsService } from "@/core/services/clientsService";
import type { ClientUpdateRequest } from "@/core/interfaces/clients";

const props = defineProps<{ clientId: string }>();
const modalStore = useModalStore();
const saving = ref(false);

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
  const data = await ClientsService.readById(props.clientId);
  form.value = { ...data }; 
});

async function submit() {
  saving.value = true;
  try {
    await ClientsService.update(props.clientId, form.value);
    modalStore.onSuccess?.();
    modalStore.close();
  } catch (error) {
    console.error("Error al actualizar:", error);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="p-6 bg-white rounded-lg w-full max-w-2xl">
    <h2 class="text-xl font-bold mb-4">Editar Cliente</h2>
    <div class="grid grid-cols-2 gap-4">
      <input v-model="form.tradeName" placeholder="Nombre Comercial" class="border p-2 rounded" />
      <input v-model="form.contactName" placeholder="Nombre Contacto" class="border p-2 rounded" />
      <input v-model="form.email" placeholder="Email" class="border p-2 rounded" />
      <input v-model="form.primaryPhone" placeholder="Tel. Principal" class="border p-2 rounded" />
      <input v-model="form.secondaryPhone" placeholder="Tel. Secundario" class="border p-2 rounded" />
      <input v-model="form.industry" placeholder="Industria" class="border p-2 rounded" />
      <input v-model.number="form.score" type="number" placeholder="Score" class="border p-2 rounded" />
    </div>
    <div class="mt-4">
      <label class="flex items-center gap-2">
        <input type="checkbox" v-model="form.isActive" /> Activo
      </label>
    </div>
    <div class="mt-6 flex justify-end gap-3">
      <button @click="modalStore.close" class="px-4 py-2 bg-gray-100 rounded">Cancelar</button>
      <button @click="submit" :disabled="saving" class="px-4 py-2 bg-yellow-700 text-white rounded">Guardar cambios</button>
    </div>
  </div>
</template>