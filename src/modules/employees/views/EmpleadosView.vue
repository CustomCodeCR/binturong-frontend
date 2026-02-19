<script setup lang="ts">
import { ref } from "vue"

const empleados = ref([
  {
    id: 1,
    nombre: "Carlos Jiménez",
    puesto: "Cerrajero",
    sucursal: "Sucursal Central",
    telefono: "8888-1111",
    rol: "Empleado",
    estado: "Activo"
  },
  {
    id: 2,
    nombre: "María González",
    puesto: "Administradora",
    sucursal: "Sucursal Heredia",
    telefono: "8777-2222",
    rol: "Administrador",
    estado: "Activo"
  },
  {
    id: 3,
    nombre: "Luis Vargas",
    puesto: "Asistente",
    sucursal: "Sucursal Alajuela",
    telefono: "8666-3333",
    rol: "Empleado",
    estado: "Inactivo"
  }
])
</script>

<template>
  <div class="space-y-6">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Empleados</h1>
        <p class="text-sm text-gray-500">
          Gestión del personal de la cerrajería
        </p>
      </div>

      <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        + Nuevo Empleado
      </button>
    </div>

    <!-- Lista -->
    <div class="bg-white rounded-xl shadow divide-y">

      <div
        v-for="empleado in empleados"
        :key="empleado.id"
        class="flex items-center justify-between p-4 hover:bg-gray-50 transition"
      >
        <!-- Izquierda -->
        <div class="flex items-center gap-4">
          <!-- Avatar -->
          <div
            class="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold"
          >
            {{ empleado.nombre.charAt(0) }}
          </div>

          <!-- Info -->
          <div>
            <p class="font-semibold text-gray-800">
              {{ empleado.nombre }}
            </p>
            <p class="text-sm text-gray-500">
              {{ empleado.puesto }} · {{ empleado.sucursal }}
            </p>
            <p class="text-sm text-gray-500">
              📞 {{ empleado.telefono }}
            </p>
          </div>
        </div>

        <!-- Derecha -->
        <div class="flex items-center gap-6">
          <!-- Rol -->
          <span
            class="text-xs px-2 py-1 rounded font-semibold bg-gray-100 text-gray-700"
          >
            {{ empleado.rol }}
          </span>

          <!-- Estado -->
          <span
            :class="[
              'text-xs font-semibold px-2 py-1 rounded',
              empleado.estado === 'Activo'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            ]"
          >
            {{ empleado.estado }}
          </span>

          <!-- Acción -->
          <button class="text-blue-600 text-sm hover:underline">
            Ver perfil
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
