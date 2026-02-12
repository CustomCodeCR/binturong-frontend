<script setup lang="ts">
const users = [
  {
    name: "Juan Pérez",
    email: "juan@correo.com",
    role: "Administrador",
    status: "Activo",
  },
  {
    name: "María López",
    email: "maria@correo.com",
    role: "Empleado",
    status: "Activo",
  },
  {
    name: "Carlos Gómez",
    email: "carlos@correo.com",
    role: "Cliente",
    status: "Inactivo",
  },
];
</script>

<template>
  <div class="p-6 space-y-8 bg-gray-100 min-h-screen">

    <!-- TÍTULO -->
    <div>
      <h1 class="text-3xl font-bold text-slate-800">Usuarios</h1>
      <p class="text-gray-500">Gestión de usuarios del sistema</p>
    </div>

    <!-- RESUMEN -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div class="bg-white rounded-xl p-5 shadow">
        <p class="text-gray-500 text-sm">Total Usuarios</p>
        <p class="text-2xl font-bold">3</p>
      </div>

      <div class="bg-white rounded-xl p-5 shadow">
        <p class="text-gray-500 text-sm">Usuarios Activos</p>
        <p class="text-2xl font-bold text-green-600">2</p>
      </div>

      <div class="bg-white rounded-xl p-5 shadow">
        <p class="text-gray-500 text-sm">Usuarios Inactivos</p>
        <p class="text-2xl font-bold text-red-600">1</p>
      </div>
    </div>

    <!-- BOTÓN -->
    <div class="flex justify-end">
      <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        ➕ Nuevo Usuario
      </button>
    </div>

    <!-- TABLA -->
    <div class="bg-white rounded-xl p-6 shadow">
      <h2 class="text-lg font-semibold mb-4">Listado de usuarios</h2>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b text-left text-gray-600">
              <th class="py-3">Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(user, index) in users"
              :key="index"
              class="border-b last:border-0 hover:bg-gray-50"
            >
              <td class="py-3 font-medium">{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.role }}</td>
              <td>
                <span
                  class="px-3 py-1 rounded-full text-xs font-semibold"
                  :class="{
                    'bg-green-100 text-green-700': user.status === 'Activo',
                    'bg-red-100 text-red-700': user.status === 'Inactivo',
                  }"
                >
                  {{ user.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>
