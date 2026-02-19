<script setup lang="ts">
import { ref } from "vue";

const roles = ref([
  {
    id: 1,
    nombre: "Administrador",
    descripcion: "Acceso total al sistema"
  },
  {
    id: 2,
    nombre: "Supervisor",
    descripcion: "Gestiona usuarios y reportes"
  },
  {
    id: 3,
    nombre: "Operador",
    descripcion: "Acceso limitado a operaciones"
  }
]);
</script>

<template>
  <div>
    <!-- Título -->
    <h1 class="text-2xl font-bold mb-6">Gestión de Roles</h1>

    <!-- Botón -->
    <div class="mb-4">
      <button
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        + Nuevo Rol
      </button>
    </div>

    <!-- Tabla -->
    <div class="bg-white rounded shadow overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-gray-200">
          <tr>
            <th class="p-3">Nombre</th>
            <th class="p-3">Descripción</th>
            <th class="p-3">Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="rol in roles"
            :key="rol.id"
            class="border-t hover:bg-gray-50"
          >
            <td class="p-3 font-medium">
              {{ rol.nombre }}
            </td>

            <td class="p-3">
              {{ rol.descripcion }}
            </td>

            <td class="p-3 space-x-2">
              <button class="text-blue-600 hover:underline">
                Editar
              </button>
              <button class="text-red-600 hover:underline">
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
