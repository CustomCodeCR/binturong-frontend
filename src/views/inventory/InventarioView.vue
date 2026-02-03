<script setup lang="ts">
import { ref } from "vue"

const inventario = ref([
  {
    id: 1,
    nombre: "Cerradura Yale",
    categoria: "Cerraduras",
    stock: 25,
    minimo: 10
  },
  {
    id: 2,
    nombre: "Llave en blanco",
    categoria: "Llaves",
    stock: 120,
    minimo: 50
  },
  {
    id: 3,
    nombre: "Candado de seguridad",
    categoria: "Candados",
    stock: 6,
    minimo: 10
  },
  {
    id: 4,
    nombre: "Kit instalación cerradura",
    categoria: "Herramientas",
    stock: 3,
    minimo: 5
  }
])

const estadoStock = (item: any) => {
  if (item.stock <= item.minimo) return "bajo"
  if (item.stock <= item.minimo * 1.5) return "medio"
  return "alto"
}
</script>

<template>
  <div class="space-y-6">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Inventario</h1>
        <p class="text-sm text-gray-500">
          Control de productos y niveles de stock
        </p>
      </div>

      <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        + Agregar Producto
      </button>
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

      <div
        v-for="item in inventario"
        :key="item.id"
        class="bg-white rounded-xl shadow p-5 hover:shadow-lg transition"
      >
        <!-- Título -->
        <div class="flex justify-between items-start mb-3">
          <div>
            <h2 class="font-semibold text-lg text-gray-800">
              {{ item.nombre }}
            </h2>
            <p class="text-sm text-gray-500">
              {{ item.categoria }}
            </p>
          </div>

          <!-- Estado -->
          <span
            :class="[
              'text-xs font-bold px-2 py-1 rounded',
              estadoStock(item) === 'alto' && 'bg-green-100 text-green-700',
              estadoStock(item) === 'medio' && 'bg-yellow-100 text-yellow-700',
              estadoStock(item) === 'bajo' && 'bg-red-100 text-red-700'
            ]"
          >
            {{
              estadoStock(item) === 'alto'
                ? 'Stock alto'
                : estadoStock(item) === 'medio'
                ? 'Stock medio'
                : 'Stock bajo'
            }}
          </span>
        </div>

        <!-- Stock -->
        <div class="mb-4">
          <div class="flex justify-between text-sm mb-1">
            <span>Stock actual</span>
            <span class="font-semibold">{{ item.stock }}</span>
          </div>

          <!-- Barra -->
          <div class="w-full bg-gray-200 rounded h-2">
            <div
              class="h-2 rounded"
              :class="[
                estadoStock(item) === 'alto' && 'bg-green-500',
                estadoStock(item) === 'medio' && 'bg-yellow-500',
                estadoStock(item) === 'bajo' && 'bg-red-500'
              ]"
              :style="{ width: Math.min((item.stock / (item.minimo * 2)) * 100, 100) + '%' }"
            ></div>
          </div>

          <p class="text-xs text-gray-500 mt-1">
            Mínimo recomendado: {{ item.minimo }}
          </p>
        </div>

        <!-- Acciones -->
        <div class="flex justify-end gap-3 text-sm">
          <button class="text-blue-600 hover:underline">
            Editar
          </button>
          <button class="text-gray-600 hover:underline">
            Movimientos
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
