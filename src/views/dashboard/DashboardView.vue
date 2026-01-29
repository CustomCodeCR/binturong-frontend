<script setup lang="ts">
const stats = [
  { title: "Clientes", value: 128 },
  { title: "Servicios", value: 56 },
  { title: "Inventario", value: 342 },
  { title: "Empleados", value: 12 },
];

const services = [
  {
    client: "Juan Pérez",
    service: "Apertura de puerta",
    employee: "Carlos",
    date: "27/01/2026",
    status: "Completado",
  },
  {
    client: "María López",
    service: "Cambio de cerradura",
    employee: "Andrés",
    date: "26/01/2026",
    status: "Pendiente",
  },
  {
    client: "Luis Gómez",
    service: "Duplicado de llaves",
    employee: "Sofía",
    date: "25/01/2026",
    status: "En proceso",
  },
];
</script>

<template>
  <div class="space-y-8">

    <!-- Título -->
    <div>
      <h1 class="text-2xl font-bold">Dashboard</h1>
      <p class="text-gray-500">Resumen general de la cerrajería</p>
    </div>

    <!-- Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div
        v-for="stat in stats"
        :key="stat.title"
        class="bg-white rounded-lg p-5 shadow"
      >
        <p class="text-gray-500 text-sm">{{ stat.title }}</p>
        <p class="text-2xl font-bold mt-2">{{ stat.value }}</p>
      </div>
    </div>

    <!-- Acciones rápidas -->
    <div class="bg-white rounded-lg p-6 shadow">
      <h2 class="text-lg font-semibold mb-4">Acciones rápidas</h2>

      <div class="flex flex-wrap gap-3">
        <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Nuevo Servicio
        </button>

        <button class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          Nuevo Cliente
        </button>

        <button class="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800">
          Ver Inventario
        </button>
      </div>
    </div>

    <!-- Tabla -->
    <div class="bg-white rounded-lg p-6 shadow">
      <h2 class="text-lg font-semibold mb-4">Últimos servicios</h2>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b text-left text-gray-600">
              <th class="py-2">Cliente</th>
              <th>Servicio</th>
              <th>Empleado</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(service, index) in services"
              :key="index"
              class="border-b last:border-0"
            >
              <td class="py-2">{{ service.client }}</td>
              <td>{{ service.service }}</td>
              <td>{{ service.employee }}</td>
              <td>{{ service.date }}</td>
              <td>
                <span
                  class="px-2 py-1 rounded text-xs font-medium"
                  :class="{
                    'bg-green-100 text-green-700': service.status === 'Completado',
                    'bg-yellow-100 text-yellow-700': service.status === 'Pendiente',
                    'bg-blue-100 text-blue-700': service.status === 'En proceso',
                  }"
                >
                  {{ service.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>
