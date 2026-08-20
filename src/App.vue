<script setup lang="ts">
import BTToastContainer from "@/shared/components/icons/containers/BTToastContainer.vue";
import BTModalContainer from "@/shared/components/icons/containers/BTModalContainer.vue";
import BTDrawerContainer from "@/shared/components/icons/containers/BTDrawerContainer.vue";
import { RouterView } from "vue-router";
</script>

<template>
  <BTModalContainer />
  <BTDrawerContainer />
  <!--
    El contenedor de notificaciones va de último y con el z-index más alto:
    antes se renderizaba antes que el modal y, al compartir `z-[9999]`, los
    mensajes de validación quedaban tapados por el modal abierto.
  -->
  <BTToastContainer />

  <RouterView />
</template>
