<script setup lang="ts">
import { ref } from "vue"

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
])
</script>

<template>
  <div class="space-y-6">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Clientes</h1>
        <p class="text-sm text-gray-500">
          Gestión y seguimiento de clientes
        </p>
      </div>

      <button
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        + Nuevo Cliente
      </button>
    </div>

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

          <div class="flex gap-3 text-sm">
            <button class="text-blue-600 hover:underline">
              Ver
            </button>
            <button class="text-gray-600 hover:underline">
              Editar
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
