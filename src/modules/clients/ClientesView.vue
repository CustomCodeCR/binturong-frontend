<script setup lang="ts">
import { ref } from "vue";
import BTButton from "@/shared/components/ui/BTButton.vue";
import BTHeader from "@/shared/components/ui/BTHeader.vue";
import BTModal from "@/shared/components/ui/BTModal.vue";
import BTInput from "@/shared/components/ui/BTInput.vue";
import { useToastStore } from '@/core/stores/toast';


const clientes = ref([
  {
    id: 1,
    nombre: "Juan Pérez",
    telefono: "8888-1234",
    correo: "juan@email.com",
    tipo: "Frecuente",
    estado: "Activo"
  },
  {
    id: 2,
    nombre: "María López",
    telefono: "8777-5678",
    correo: "maria@email.com",
    tipo: "Ocasional",
    estado: "Activo"
  },
  {
    id: 3,
    nombre: "Carlos Gómez",
    telefono: "8666-9999",
    correo: "carlos@email.com",
    tipo: "Frecuente",
    estado: "Inactivo"
  }
]);

const showModal = ref(false);

// Form data
const formData = ref({
  nombre: '',
  telefono: '',
  correo: '',
  tipo: 'Frecuente',
});



const toastStore = useToastStore();

function handleConfirm() {
  console.log('Creating client:', formData.value);
  
  // Show success toast
  toastStore.addToast({
    severity: 'success',
    title: 'Cliente creado',
    message: 'El cliente se creó exitosamente',
    duration: 3000,
  });
  
  showModal.value = false;
}
</script>

<template>
  <div class="space-y-6">
    <BTHeader>
      <template #title>Clientes</template>
      <template #description>Gestión y seguimiento de clientes</template>
      <template #action>
        <BTButton 
          variant="blue" 
          size="md"
          shape="rounded"
          @click="showModal = true"
        >
          + Nuevo Cliente
        </BTButton>
      </template>
    </BTHeader>

    <!-- Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="cliente in clientes"
        :key="cliente.id"
        class="bg-white rounded-xl shadow p-5 hover:shadow-lg transition"
      >
        <!-- Avatar -->
        <div class="flex items-center gap-4 mb-4">
          <div
            class="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold"
          >
            {{ cliente.nombre.charAt(0) }}
          </div>
          <div>
            <p class="font-semibold text-gray-800">
              {{ cliente.nombre }}
            </p>
            <p class="text-sm text-gray-500">
              {{ cliente.tipo }}
            </p>
          </div>
        </div>

        <!-- Info -->
        <div class="space-y-2 text-sm text-gray-600">
          <p>📞 {{ cliente.telefono }}</p>
          <p>✉️ {{ cliente.correo }}</p>
        </div>

        <!-- Footer -->
        <div class="flex justify-between items-center mt-4">
          <span
            :class="[
              'text-xs font-semibold px-2 py-1 rounded',
              cliente.estado === 'Activo'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            ]"
          >
            {{ cliente.estado }}
          </span>
          <div class="flex gap-3">
            <BTButton variant="text" size="sm">Ver</BTButton>
            <BTButton variant="text" size="sm">Editar</BTButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <BTModal 
      v-model="showModal" 
      title="Nuevo Cliente"
      size="medium"
      @confirm="handleConfirm"
    >
      <div class="space-y-4">
        <BTInput v-model:inputValue="formData.nombre">
          <template #label>Nombre completo</template>
        </BTInput>
        
        <BTInput v-model:inputValue="formData.telefono" inputType="tel">
          <template #label>Teléfono</template>
        </BTInput>
        
        <BTInput v-model:inputValue="formData.correo" inputType="email">
          <template #label>Correo electrónico</template>
        </BTInput>
      </div>
    </BTModal>
  </div>
</template>