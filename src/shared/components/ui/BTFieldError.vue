<script setup lang="ts">
import { ShieldX } from "lucide-vue-next";

/**
 * Mensaje de error de un campo, mostrado justo debajo del control.
 *
 * Sustituye a la notificación global (toast) al pie de la pantalla, que hacía
 * que el usuario no supiera qué campo corregir.
 */
defineProps<{
  message?: string;
}>();
</script>

<template>
  <p
    v-if="message"
    class="mt-bt-spacing-8 flex items-center gap-1 text-sm text-bt-error-700"
    role="alert"
  >
    <ShieldX :size="14" class="shrink-0" />
    <span>{{ message }}</span>
  </p>
</template>
