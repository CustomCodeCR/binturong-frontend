<script setup lang="ts">
import { ref } from "vue"
import { LogOut, LogIn } from "lucide-vue-next"

const collapsed = ref(false)
const showLogout = ref(false)
</script>


<template>
  <aside
    :class="[
      'bg-slate-900 text-white transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    ]"
  >
    <div class="p-4 flex justify-between items-center">
      <span v-if="!collapsed" class="font-bold">Cerrajería Calderón</span>
      <button @click="collapsed = !collapsed">☰</button>
    </div>

    <nav
    lass="mt-4"
    :class="collapsed ? 'text-center' : ''"
 >
      <router-link to="/home" class="block px-4 py-2 hover:bg-slate-700">
        <span v-if="!collapsed">Dashboard</span>
      </router-link>


      <router-link to="/users" class="block px-4 py-2 hover:bg-slate-700">
        <span v-if="!collapsed">Usuarios</span>
      </router-link>

      <RouterLink to="/roles" class="flex items-center gap-3 p-2 rounded hover:bg-gray-700">
      <span v-if="!collapsed">Roles</span>
      </RouterLink>

    </nav>
    <!-- Logout -->
    <div class="p-4 border-t border-gray-700">
      <button
        @click="showLogout = true"
        class="flex items-center gap-3 w-full p-2 rounded hover:bg-gray-700"
      >
        <LogOut :size="20" />
        <span v-if="!collapsed">Salir</span>
      </button>
    </div>

  </aside>
  <!-- Modal Logout -->
<div
  v-if="showLogout"
  class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
>
  <div class="bg-white rounded-lg p-6 w-80">
    <h3 class="text-lg font-semibold mb-2">Cerrar sesión</h3>
    <p class="text-sm text-gray-600 mb-4">
      ¿Deseas salir de tu cuenta o iniciar sesión con otra?
    </p>

    <div class="flex justify-end gap-2">
      <button
        class="px-4 py-2 text-sm rounded bg-gray-200"
        @click="showLogout = false"
      >
        Cancelar
      </button>

      <button
        class="px-4 py-2 text-sm rounded bg-blue-600 text-white"
      >
        Cambiar cuenta
      </button>

      <button
        class="px-4 py-2 text-sm rounded bg-red-600 text-white"
      >
        Salir
      </button>
    </div>
  </div>
</div>

  

</template>
