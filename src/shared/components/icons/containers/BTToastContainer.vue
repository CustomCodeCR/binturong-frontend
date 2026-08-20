<script setup lang="ts">
import {
  type Toast,
  type ToastLocation,
  useToastStore,
} from "@/core/stores/toastStore";
import { computed } from "vue";
import BTAlert from "@/shared/components/ui/BTAlert.vue";
import {
  CircleX,
  Info,
  TriangleAlert,
  CircleCheckBig,
  BookAlert,
} from "lucide-vue-next";

const toastStore = useToastStore();

const groupedToasts = computed(() => {
  const groups: Record<ToastLocation, Toast[]> = {
    "top-left": [],
    "top-center": [],
    "top-right": [],
    "bottom-left": [],
    "bottom-center": [],
    "bottom-right": [],
  };
  toastStore.toasts.forEach((toast) => {
    groups[toast.location!].push(toast);
  });
  return groups;
});

function getLocationContainerClasses(location: ToastLocation) {
  const classes = [];
  // Los contenedores se anclan solo a su borde: ocupar todo el alto hacía que
  // las notificaciones se repartieran a lo largo de la pantalla en vez de
  // apilarse junto a la esquina indicada.
  if (location.includes("top")) classes.push("top-4", "flex-col");
  if (location.includes("bottom")) classes.push("bottom-4", "flex-col-reverse");

  if (location === "top-center" || location === "bottom-center") {
    classes.push(
      "left-1/2",
      "-translate-x-1/2",
      "flex-col",
      "flex-wrap",
      "items-center",
    );
  } else {
    if (location.includes("left")) classes.push("left-4", "items-start");
    if (location.includes("right")) classes.push("right-4", "items-end");
  }
  return classes;
}
</script>

<template>
  <div
    v-for="(toasts, location) in groupedToasts"
    :key="location"
    class="pointer-events-none fixed z-[10000] flex gap-4"
    :class="getLocationContainerClasses(location)"
  >
    <!--
      El contenedor ignora el puntero para no bloquear la interfaz, pero cada
      notificación debe volver a recibirlo o su botón de cerrar no responde.
    -->
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="rounded-bt-space pointer-events-auto flex-shrink-0"
    >
      <BTAlert
        icon
        removable
        @remove="() => toastStore.removeToast(toast.id)"
        :variant="toast.severity"
        :title="toast.title ?? ''"
      >
        <template #icon>
          <CircleCheckBig :size="16" v-if="toast.severity === 'success'" />
          <Info :size="16" v-else-if="toast.severity === 'info'" />
          <TriangleAlert :size="16" v-else-if="toast.severity === 'warning'" />
          <CircleX :size="16" v-else-if="toast.severity === 'error'" />
          <BookAlert :size="16" v-else />
        </template>

        <template #message>
          <span>{{ toast.message }}</span>
        </template>
      </BTAlert>
    </div>
  </div>
</template>
