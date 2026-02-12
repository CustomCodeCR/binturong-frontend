<template>
  <div class="p-6 bg-gray-100 min-h-screen">

    <!-- TÍTULO -->
    <h1 class="text-2xl font-bold mb-6">Dashboard</h1>

    <!-- CARDS -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-white p-5 rounded-xl shadow">
        <p class="text-gray-500">Clientes</p>
        <h2 class="text-3xl font-bold">128</h2>
      </div>

      <div class="bg-white p-5 rounded-xl shadow">
        <p class="text-gray-500">Servicios</p>
        <h2 class="text-3xl font-bold">56</h2>
      </div>

      <div class="bg-white p-5 rounded-xl shadow">
        <p class="text-gray-500">Inventario</p>
        <h2 class="text-3xl font-bold">342</h2>
      </div>

      <div class="bg-white p-5 rounded-xl shadow">
        <p class="text-gray-500">Empleados</p>
        <h2 class="text-3xl font-bold">12</h2>
      </div>
    </div>

    <!-- TABLA -->
    <div class="bg-white rounded-xl shadow p-6">
      <h2 class="text-lg font-semibold mb-4">Últimos servicios</h2>

      <table class="w-full text-left">
        <thead>
          <tr class="border-b">
            <th class="py-2">Cliente</th>
            <th>Servicio</th>
            <th>Empleado</th>
            <th>Fecha</th>
            <th>Estado</th>
          </tr>
        </thead>

        <tbody>
          <tr class="border-b hover:bg-gray-50">
            <td class="py-2">Juan Pérez</td>
            <td>Apertura de puerta</td>
            <td>Carlos</td>
            <td>27/01/2026</td>
            <td>
              <span class="text-green-600 font-semibold">Completado</span>
            </td>
          </tr>

          <tr class="border-b hover:bg-gray-50">
            <td class="py-2">María López</td>
            <td>Cambio de cerradura</td>
            <td>Andrés</td>
            <td>26/01/2026</td>
            <td>
              <span class="text-yellow-600 font-semibold">Pendiente</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup>
</script>
