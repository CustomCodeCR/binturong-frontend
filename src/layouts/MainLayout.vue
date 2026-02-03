<script setup lang="ts">
import Sidebar from "@/components/Sidebar.vue"
import TopBar from "@/components/TopBar.vue"
import Footer from "@/components/Footer.vue"
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-100">

    <!-- TOP BAR (ancho completo) -->
    <TopBar />

    <!-- CUERPO -->
    <div class="flex flex-1">

      <!-- SIDEBAR -->
      <Sidebar />

      <!-- CONTENIDO -->
      <main class="flex-1 p-6 overflow-auto">
        <router-view />
      </main>

    </div>

    <!-- FOOTER -->
    <Footer />
  </div>
</template>
