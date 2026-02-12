<script setup lang="ts">
import BTToastContainer from "@/shared/components/icons/containers/BTToastContainer.vue";
import BTModalContainer from "@/shared/components/icons/containers/BTModalContainer.vue";
import BTDrawerContainer from "@/shared/components/icons/containers/BTDrawerContainer.vue";
import { RouterView } from "vue-router";
</script>

<template>
  <BTToastContainer />
  <BTModalContainer />
  <BTDrawerContainer />

  <RouterView />
</template>
