<script setup lang="ts">
const stats = [
  { title: "Clientes", value: 128, icon: "👥"},
  { title: "Servicios", value: 56, icon: "🛠️" },
  { title: "Inventario", value: 342, icon: "🔑" },
  { title: "Empleados", value: 12, icon: "👷" },
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
  <div class="p-6 space-y-8 bg-gray-100 min-h-screen">

    <!-- TÍTULO -->
    <div>
      <h1 class="text-3xl font-bold text-slate-800">Dashboard</h1>
      <p class="text-gray-500">Resumen general de la cerrajería</p>
    </div>

    <!-- CARDS -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        v-for="stat in stats"
        :key="stat.title"
        class="bg-white rounded-xl p-5 shadow flex items-center gap-4"
      >
        <div class="text-3xl">
          {{ stat.icon }}
        </div>

        <div>
          <p class="text-gray-500 text-sm">{{ stat.title }}</p>
          <p class="text-2xl font-bold text-slate-800">{{ stat.value }}</p>
        </div>
      </div>
    </div>

    <!-- ACCIONES RÁPIDAS -->
    <div class="bg-white rounded-xl p-6 shadow">
      <h2 class="text-lg font-semibold mb-4">Acciones rápidas</h2>

      <div class="flex flex-wrap gap-3">
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          ➕ Nuevo Servicio
        </button>

        <button class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          👤 Nuevo Cliente
        </button>

        <button class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800">
          📦 Ver Inventario
        </button>
      </div>
    </div>

    <!-- TABLA -->
    <div class="bg-white rounded-xl p-6 shadow">
      <h2 class="text-lg font-semibold mb-4">Últimos servicios</h2>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b text-left text-gray-600">
              <th class="py-3">Cliente</th>
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
              class="border-b last:border-0 hover:bg-gray-50"
            >
              <td class="py-3 font-medium">{{ service.client }}</td>
              <td>{{ service.service }}</td>
              <td>{{ service.employee }}</td>
              <td>{{ service.date }}</td>
              <td>
                <span
                  class="px-3 py-1 rounded-full text-xs font-semibold"
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
