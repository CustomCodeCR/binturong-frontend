<script setup lang="ts">
import Sidebar from "@/components/Sidebar.vue"
</script>

<template>
  <div class="flex min-h-screen bg-gray-100">
    
    <!-- Sidebar -->
    <Sidebar />

    <!-- Contenido -->
    <div class="flex-1">
      <router-view />
    </div>

  </div>
</template>
