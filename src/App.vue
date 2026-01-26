<script setup lang="ts">
import BTToastContainer from "@/components/containers/BTToastContainer.vue";
import BTModalContainer from "@/components/containers/BTModalContainer.vue";
import BTDrawerContainer from "@/components/containers/BTDrawerContainer.vue";
import { RouterView } from "vue-router";
</script>

<template>
  <BTToastContainer />
  <BTModalContainer />
  <BTDrawerContainer />

  <RouterView />
</template>
