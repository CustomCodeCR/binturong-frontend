<script setup lang="ts">
import { ref } from "vue"
import {
  UserPlus,
  Pencil,
  Trash2,
  ShieldCheck,
  Package
} from "lucide-vue-next"

const logs = ref([
  {
    id: 1,
    user: "María González",
    action: "Creó un nuevo usuario",
    module: "Usuarios",
    date: "28/01/2026 10:15",
    type: "create"
  },
  {
    id: 2,
    user: "Carlos Jiménez",
    action: "Actualizó inventario",
    module: "Inventario",
    date: "28/01/2026 09:40",
    type: "update"
  },
  {
    id: 3,
    user: "Administrador",
    action: "Asignó rol Administrador",
    module: "Roles",
    date: "27/01/2026 18:20",
    type: "security"
  },
  {
    id: 4,
    user: "Luis Vargas",
    action: "Eliminó proveedor",
    module: "Proveedores",
    date: "27/01/2026 17:05",
    type: "delete"
  },
  {
    id: 5,
    user: "Sistema",
    action: "Ingreso al sistema",
    module: "Autenticación",
    date: "27/01/2026 08:01",
    type: "login"
  }
])

const iconByType = (type: string) => {
  switch (type) {
    case "create":
      return UserPlus
    case "update":
      return Pencil
    case "delete":
      return Trash2
    case "security":
      return ShieldCheck
    case "login":
      return Package
    default:
      return Package
  }
}

const colorByType = (type: string) => {
  switch (type) {
    case "create":
      return "bg-green-500"
    case "update":
      return "bg-blue-500"
    case "delete":
      return "bg-red-500"
    case "security":
      return "bg-purple-500"
    case "login":
      return "bg-gray-500"
    default:
      return "bg-gray-400"
  }
}
</script>

<template>
  <div class="space-y-6">

    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-800">Auditoría</h1>
      <p class="text-sm text-gray-500">
        Registro de acciones realizadas en el sistema
      </p>
    </div>

    <!-- Timeline -->
    <div class="relative">

      <!-- Línea -->
      <div class="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-300"></div>

      <div
        v-for="log in logs"
        :key="log.id"
        class="relative flex gap-6 mb-8"
      >
        <!-- Icono -->
        <div
          class="w-10 h-10 rounded-full flex items-center justify-center text-white z-10"
          :class="colorByType(log.type)"
        >
          <component :is="iconByType(log.type)" :size="18" />
        </div>

        <!-- Contenido -->
        <div class="bg-white rounded-xl shadow p-4 flex-1">
          <div class="flex justify-between items-center">
            <p class="font-semibold text-gray-800">
              {{ log.action }}
            </p>
            <span class="text-xs text-gray-400">
              {{ log.date }}
            </span>
          </div>

          <p class="text-sm text-gray-600 mt-1">
            👤 {{ log.user }} · 📂 {{ log.module }}
          </p>
        </div>
      </div>

    </div>
  </div>
</template>
