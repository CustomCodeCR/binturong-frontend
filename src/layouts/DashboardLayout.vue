<template>
  <div class="flex min-h-screen bg-gray-100">
    <!-- Sidebar -->
    <aside
      :class="[
        'bg-gray-900 text-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      ]"
      class="flex flex-col"
    >
      <!-- Logo / Toggle -->
      <div class="flex items-center justify-between p-4 border-b border-gray-700">
        <span v-if="!collapsed" class="text-lg font-bold">
          Binturong
        </span>
        <button @click="collapsed = !collapsed" class="text-gray-300 hover:text-white">
          ☰
        </button>
      </div>

      <!-- Links -->
      <nav class="flex-1 p-2 space-y-2">
        <RouterLink
          to="/home"
          class="flex items-center gap-3 p-2 rounded hover:bg-gray-700"
        >
          🏠
          <span v-if="!collapsed">Dashboard</span>
        </RouterLink>

        <RouterLink
          to="/users"
          class="flex items-center gap-3 p-2 rounded hover:bg-gray-700"
        >
          👤
          <span v-if="!collapsed">Usuarios</span>
        </RouterLink>
      </nav>
    </aside>

    <!-- Contenido -->
    <main class="flex-1 p-6">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { ref } from "vue";

const collapsed = ref(false);
</script>
