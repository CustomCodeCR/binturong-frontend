<script setup lang="ts">
import Sidebar from "@/components/Sidebar.vue"
import TopBar from "@/components/TopBar.vue"
import Footer from "@/components/Footer.vue"

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
      <main class="flex-1 p-6 overflow-auto">
      <router-view />
      </main>

      <!-- Footer -->
      <footer class="h-14 bg-slate-900 text-white flex items-center justify-center text-sm">
      © 2026 Cerrajería Calderón · Sistema de Cerrajería
      </footer>
      
    </div>
  </div>
</template>

