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
      <span v-if="!collapsed" class="font-bold">Binturong</span>
      <button @click="collapsed = !collapsed">☰</button>
    </div>

    <nav class="mt-4">
      <router-link to="/home" class="block px-4 py-2 hover:bg-slate-700">
        Dashboard
      </router-link>

      <router-link to="/users" class="block px-4 py-2 hover:bg-slate-700">
        Usuarios
      </router-link>
    </nav>
  </aside>
</template>
