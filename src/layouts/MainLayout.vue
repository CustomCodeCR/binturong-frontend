<script setup lang="ts">
import Sidebar from "@/components/Sidebar.vue"
import TopBar from "@/components/TopBar.vue"
</script>

<template>
  <div class="flex min-h-screen bg-gray-100">
    
    <!-- Sidebar -->
    <Sidebar />

    <!-- Top bar -->
      <TopBar />

    <!-- Contenido + Footer -->
    <div class="flex-1 flex flex-col">
      
      <!-- Contenido principal -->
      <main class="flex-1 p-6">
        <router-view />
      </main>

      <!-- Footer -->
      <footer class="bg-gray-900 text-gray-300 text-center py-4 text-sm">
        © 2026 <span class="font-semibold text-white">Cerrajería Calderón</span> · Sistema de Cerrajería
      </footer>

    </div>
  </div>
</template>

