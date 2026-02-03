<script setup lang="ts">
import { ref } from "vue"

const proveedores = ref([
  {
    id: 1,
    empresa: "Distribuidora Yale CR",
    contacto: "José Ramírez",
    telefono: "2222-8899",
    correo: "ventas@yale.cr",
    relacion: "Alta",
    estado: "Activo"
  },
  {
    id: 2,
    empresa: "Seguridad Total S.A.",
    contacto: "Laura Méndez",
    telefono: "2444-5566",
    correo: "contacto@seguridadtotal.com",
    relacion: "Media",
    estado: "Activo"
  },
  {
    id: 3,
    empresa: "Llaves Express",
    contacto: "Pedro Solís",
    telefono: "2555-7788",
    correo: "info@llavesexpress.cr",
    relacion: "Baja",
    estado: "Inactivo"
  }
])
</script>

<template>
  <div class="space-y-6">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Proveedores</h1>
        <p class="text-sm text-gray-500">
          Gestión de proveedores y contactos comerciales
        </p>
      </div>

      <button
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        + Nuevo Proveedor
      </button>
    </div>

    <!-- Lista compacta -->
    <div class="space-y-4">

      <div
        v-for="proveedor in proveedores"
        :key="proveedor.id"
        class="bg-white rounded-xl shadow p-4 hover:shadow-md transition"
      >
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">

          <!-- Empresa -->
          <div>
            <p class="text-sm text-gray-500">Empresa</p>
            <p class="font-semibold text-gray-800">
              {{ proveedor.empresa }}
            </p>
          </div>

          <!-- Contacto -->
          <div>
            <p class="text-sm text-gray-500">Contacto</p>
            <p class="text-gray-700">
              {{ proveedor.contacto }}
            </p>
            <p class="text-sm text-gray-500">
              📞 {{ proveedor.telefono }}
            </p>
          </div>

          <!-- Relación -->
          <div>
            <p class="text-sm text-gray-500">Relación</p>
            <span
              :class="[
                'text-xs font-semibold px-2 py-1 rounded',
                proveedor.relacion === 'Alta'
                  ? 'bg-green-100 text-green-700'
                  : proveedor.relacion === 'Media'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              ]"
            >
              {{ proveedor.relacion }}
            </span>
          </div>

          <!-- Estado / Acciones -->
          <div class="flex justify-between items-center">
            <span
              :class="[
                'text-xs font-semibold px-2 py-1 rounded',
                proveedor.estado === 'Activo'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-200 text-gray-600'
              ]"
            >
              {{ proveedor.estado }}
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
  </div>
</template>
