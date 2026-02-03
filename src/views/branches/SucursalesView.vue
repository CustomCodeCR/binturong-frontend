<script setup lang="ts">
import { ref } from "vue"

const sucursales = ref([
  {
    id: 1,
    nombre: "Sucursal Central",
    direccion: "San José Centro",
    telefono: "2222-0000",
    encargado: "María González",
    estado: "Abierta"
  },
  {
    id: 2,
    nombre: "Sucursal Heredia",
    direccion: "Heredia Centro",
    telefono: "2233-4455",
    encargado: "Carlos Jiménez",
    estado: "Abierta"
  },
  {
    id: 3,
    nombre: "Sucursal Alajuela",
    direccion: "Alajuela Centro",
    telefono: "2444-6677",
    encargado: "Ana Vargas",
    estado: "Cerrada"
  }
])
</script>

<template>
  <div class="space-y-6">

    <!-- Encabezado -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Sucursales</h1>
        <p class="text-sm text-gray-500">
          Ubicaciones activas de la cerrajería
        </p>
      </div>

      <button
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        + Nueva Sucursal
      </button>
    </div>

    <!-- Grid de sucursales -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

      <div
        v-for="sucursal in sucursales"
        :key="sucursal.id"
        class="bg-white rounded-xl shadow p-5 hover:shadow-lg transition"
      >
        <!-- Título -->
        <div class="flex justify-between items-start mb-3">
          <h2 class="text-lg font-semibold text-gray-800">
            {{ sucursal.nombre }}
          </h2>

          <span
            :class="[
              'text-xs font-semibold px-2 py-1 rounded',
              sucursal.estado === 'Abierta'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            ]"
          >
            {{ sucursal.estado }}
          </span>
        </div>

        <!-- Información -->
        <div class="space-y-2 text-sm text-gray-600">
          <p><strong>📍 Dirección:</strong> {{ sucursal.direccion }}</p>
          <p><strong>📞 Teléfono:</strong> {{ sucursal.telefono }}</p>
          <p><strong>👤 Encargado:</strong> {{ sucursal.encargado }}</p>
        </div>

        <!-- Acciones -->
        <div class="mt-4 flex justify-end">
          <button
            class="text-blue-600 text-sm hover:underline"
          >
            Ver detalles
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
