<script setup lang="ts">
import { ref } from "vue"

const collapsed = ref(false)
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
  </aside>
</template>
